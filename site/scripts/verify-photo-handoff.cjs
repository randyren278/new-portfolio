// Hold the incoming iframe to expose photos that leak AFTER the departure fade.
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
const sharp = require('sharp');
const path = require('node:path');
const os = require('node:os');
(async () => {
  for (const [name, engine, viewport] of [
    ['chrome-desktop', chromium, { width: 1440, height: 900 }],
    ['webkit-desktop', webkit, { width: 1440, height: 900 }],
    ['webkit-mobile', webkit, { width: 393, height: 852 }],
  ]) {
    const browser = await engine.launch(
      engine === chromium
        ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
        : {},
    );
    try {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(process.env.PUFF_URL || 'http://localhost:4180');
      async function enter() {
        await page.locator('iframe.is-ready').waitFor();
        const frame = await (await page.locator('iframe').elementHandle()).contentFrame();
        await frame.locator('.explore-button').click();
        await page.locator('iframe').waitFor({ state: 'detached' });
      }
      await enter();
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('.photo-flip').first().click();
      await page.waitForTimeout(700);
      // One open back and one front exercise both visibility escape paths.
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      await page.route('**/puff-intro/index.html*', async (route) => {
        await gate;
        await route.continue();
      });
      await page.evaluate(() => {
        window.photoLeaks = [];
        window.sampleHandoff = true;
        function sample() {
          if (!window.sampleHandoff) return;
          if (document.querySelector('.awaiting-intro')) {
            for (const face of document.querySelectorAll('.photo-face')) {
              if (getComputedStyle(face).visibility !== 'hidden') photoLeaks.push(face.className);
            }
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      await page.getByRole('button', { name: 'Return to intro' }).click();
      await page.locator('.awaiting-intro').waitFor({ state: 'attached' });
      for (const wait of [0, 80, 300, 600]) {
        await page.waitForTimeout(wait);
        const png = await page.screenshot({
          path: path.join(os.tmpdir(), `photo-handoff-${name}-${wait}.png`),
        });
        const { data, info } = await sharp(png)
          .extract({ left: 20, top: 20, width: viewport.width - 40, height: viewport.height - 100 })
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let deviation = 0;
        for (let i = 0; i < data.length; i++)
          deviation += Math.abs(data[i] - [24, 25, 23][i % info.channels]);
        assert(deviation / data.length < 0.5, `${name}: visible content survived the fade`);
      }
      assert.deepEqual(await page.evaluate(() => photoLeaks), []);
      await page.evaluate(() => {
        window.sampleHandoff = false;
      });
      release();
      await page.locator('iframe.is-ready').waitFor();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await enter();
      assert.equal(
        await page
          .locator('.photo-back')
          .first()
          .evaluate((e) => getComputedStyle(e).visibility),
        'visible',
      );
      await page.locator('.photo-return').first().click();
      await page.waitForTimeout(350);
      assert.equal(
        await page
          .locator('.photo-front')
          .first()
          .evaluate((e) => getComputedStyle(e).visibility),
        'visible',
      );
      assert.deepEqual(errors, []);
      console.log(
        `${name}: no front/back leaks throughout delayed intro handoff; photo flips preserved`,
      );
    } finally {
      await browser.close();
    }
  }
})();

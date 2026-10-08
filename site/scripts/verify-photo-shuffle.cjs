const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const url = process.env.BASE_URL || 'http://127.0.0.1:4390';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 393, height: 852 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(url);
      await page.locator('iframe.is-ready').waitFor();
      await page.frameLocator('iframe').locator('.explore-button').click();
      await page.locator('iframe').waitFor({ state: 'detached' });
      const button = page.locator('.photo-shuffle');
      const wait = () => page.waitForFunction(() => !document.querySelector('.photo-shuffle').disabled);
      const names = () => page.locator('.photo-fname').allTextContents();
      await wait();
      await page.evaluate(() => {
        window.emptyPhotoFrames = [];
        window.shuffleAnimations = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (keys, options) {
          if (this.classList.contains('photo-incoming')) window.shuffleAnimations.push({ keys, options });
          return animate.call(this, keys, options);
        };
        function sample() {
          for (const stage of document.querySelectorAll('.photo-stage')) {
            const image = stage.querySelector('.photo-current') || stage.querySelector('.photo-fallback');
            if (!image?.complete || !image?.naturalWidth || getComputedStyle(image).opacity !== '1') {
              window.emptyPhotoFrames.push(performance.now());
            }
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      const before = await names();
      await button.click();
      await wait();
      assert((await names()).every(name => !before.includes(name)));
      const animations = await page.evaluate(() => window.shuffleAnimations);
      assert.equal(animations.length, 2);
      assert.deepEqual(animations.map(a => a.options.delay), [0, 90]);
      assert(animations.every(a => a.keys[0].transform === 'translateY(101%)'));
      console.log(`${viewport.width}px: film advance, 90ms stagger, no repeated pair`);

      let rejected = 0;
      const broken = async route => {
        if (rejected++ === 0) await route.fulfill({ status: 404, body: '' });
        else await route.continue();
      };
      await page.route('**/photos/*.jpg', broken);
      const beforeBroken = await names();
      await button.click();
      await wait();
      assert((await names()).every(name => !beforeBroken.includes(name)));
      await page.unroute('**/photos/*.jpg', broken);
      console.log(`${viewport.width}px: real 404 replaced automatically`);

      let stalled = false;
      let held;
      const slow = async route => {
        if (!stalled) { stalled = true; held = route; }
        else await route.continue();
      };
      await page.route('**/photos/*.jpg', slow);
      const beforeSlow = await names();
      await button.click();
      await page.waitForTimeout(1000);
      assert.deepEqual(await names(), beforeSlow);
      await wait();
      assert((await names()).every(name => !beforeSlow.includes(name)));
      await held.abort().catch(() => {});
      await page.unroute('**/photos/*.jpg', slow);
      console.log(`${viewport.width}px: stalled request times out without a grey frame`);

      const outage = route => route.abort('failed');
      await page.route('**/photos/*.jpg', outage);
      const beforeOutage = await names();
      await button.click();
      await wait();
      assert.deepEqual(await names(), beforeOutage);
      assert.match(await page.locator('output.puff-sr-only').innerText(), /Keeping/i);
      await page.unroute('**/photos/*.jpg', outage);
      console.log(`${viewport.width}px: all replacements fail, previous pair retained`);

      await page.locator('.photo-flip').first().click();
      await page.waitForTimeout(700);
      assert.equal(await page.locator('.cell-photo.flipped').count(), 1);
      // Native .click() in one task exercises the immediate ref-based lock.
      await page.evaluate(() => { for (let i = 0; i < 8; i++) document.querySelector('.photo-shuffle').click(); });
      await wait();
      assert.equal(await page.locator('.cell-photo.flipped').count(), 0);
      assert.equal(await page.locator('.photo-current').count(), 2);
      assert.equal(await page.locator('.photo-incoming').count(), 0);
      assert.equal(await page.locator('.photo-stage img').count(), 4);
      await page.locator('.photo-flip').first().click();
      await page.waitForTimeout(700);
      assert.equal(await page.locator('.cell-photo.flipped').count(), 1);
      await page.keyboard.press('Escape');
      console.log(`${viewport.width}px: repeated clicks and open-photo shuffle preserve flip controls`);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => { window.shuffleAnimations = []; });
      await button.click();
      await wait();
      const reduced = await page.evaluate(() => window.shuffleAnimations);
      assert.equal(reduced.length, 2);
      assert(reduced.every(a => a.options.duration === 120 && !a.keys[0].transform));
      assert.deepEqual(await page.evaluate(() => window.emptyPhotoFrames), []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `/tmp/photo-shuffle-${viewport.width}.png`, fullPage: true });
      console.log(`${viewport.width}px: reduced motion, no overflow, zero empty frames or JS errors`);

      // Block all image URLs before first paint: the bundled photographs must survive.
      await page.route('**/photos/*.jpg', outage);
      await page.reload();
      await wait();
      assert.equal(await page.locator('.photo-fallback').evaluateAll(images => images.filter(i => i.complete && i.naturalWidth).length), 2);
      console.log(`${viewport.width}px: cold image outage retains bundled photographs`);
      await page.close();
    }
    const page = await browser.newPage();
    await page.route('**/photos/*.jpg', route => route.fulfill({ contentType: 'image/jpeg', body: 'not a JPEG' }));
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('output.puff-sr-only')?.textContent.includes('Keeping'));
    assert.equal(await page.locator('.photo-fallback').evaluateAll(images => images.filter(i => i.complete && i.naturalWidth).length), 2);
    console.log('Corrupt JPEGs: decode failures retain the bundled pair');
    await page.close();
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

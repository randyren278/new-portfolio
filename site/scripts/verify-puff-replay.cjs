const { chromium, webkit } = require('playwright'),
  assert = require('assert'),
  sharp = require('sharp');
(async () => {
  for (const [name, engine, viewport] of [
    ['desktop', chromium, { width: 1440, height: 900 }],
    ['mobile', webkit, { width: 393, height: 852 }],
  ]) {
    const b = await engine.launch(
        name === 'desktop'
          ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
          : {},
      ),
      p = await b.newPage({ viewport }),
      errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.goto(process.env.PUFF_URL || 'http://localhost:4180');
    const enter = async () => {
      await p.locator('iframe.is-ready').waitFor();
      const f = await (await p.locator('iframe').elementHandle()).contentFrame();
      await f.locator('.explore-button').click();
      await p.locator('iframe').waitFor({ state: 'detached' });
    };
    await enter();
    for (const [roll, scene] of [
      [0.01, 'space'],
      [0.4, 'pool'],
      [0.8, 'kite'],
    ]) {
      await p.emulateMedia({ reducedMotion: 'no-preference' });
      await p.waitForTimeout(200);
      if (name === 'mobile') await p.locator('.cell-photo').first().scrollIntoViewIfNeeded();
      await p.evaluate(() => {
        document.getAnimations().forEach((a) => a.pause());
        window.nativeAnimate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const a = nativeAnimate.apply(this, args);
          if (this.classList.contains('bento-departure')) {
            a.pause();
            a.currentTime = 160;
            window.departureTest = a;
          }
          return a;
        };
      });
      const before = await p.screenshot();
      await p.evaluate((roll) => {
        window.nativeRandom = Math.random;
        Math.random = () => roll;
        [...document.querySelectorAll('button')]
          .find((b) => b.textContent.includes('Return to intro'))
          .click();
      }, roll);
      await p.waitForFunction(() => window.departureTest);
      await p.waitForTimeout(60);
      const mid = await p.screenshot({
        path: require('path').join(require('os').tmpdir(), `replay-${name}-${scene}-mid.png`),
      });
      const a = await sharp(before).removeAlpha().raw().toBuffer(),
        c = await sharp(mid).removeAlpha().raw().toBuffer();
      let error = 0,
        n = 0;
      for (let i = 0; i < a.length; i++) {
        const bg = [24, 25, 23][i % 3];
        if (Math.abs(a[i] - bg) > 35) {
          error += Math.abs(c[i] - (bg + (a[i] - bg) * 0.5));
          n++;
        }
      }
      assert(error / n < 3, `uneven fade ${name}: ${error / n}`);
      await p.evaluate(() => {
        Element.prototype.animate = nativeAnimate;
        departureTest.finish();
        delete window.departureTest;
      });
      await p.locator('iframe.is-ready').waitFor();
      assert((await p.locator('iframe').getAttribute('src')).includes('scene=' + scene));
      await p.evaluate(() => {
        Math.random = nativeRandom;
      });
      await p.emulateMedia({ reducedMotion: 'reduce' });
      await enter();
    }
    assert.deepEqual(errors, []);
    console.log(name, 'uniform photo/card fade and all three replay scene choices passed');
    await b.close();
  }
})();

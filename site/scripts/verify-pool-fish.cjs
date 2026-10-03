// PUFF_URL=http://localhost:4180 node scripts/verify-pool-fish.cjs
const { chromium, webkit } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  await Promise.all([
    ['desktop', chromium, { width: 1440, height: 900 }],
    ['mobile', webkit, { width: 393, height: 852 }],
  ].map(async ([name, engine, viewport]) => {
    const browser = await engine.launch(name === 'desktop' ? {
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    } : {});
    try {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.PUFF_URL || 'http://localhost:4180');
      await page.locator('iframe.is-ready').waitFor();
      let frame = await (await page.locator('iframe').elementHandle()).contentFrame();
      await frame.evaluate(() => spaceScene.setMode('pool'));
      await frame.locator('.fish-layer').waitFor();
      // Deterministic rolls cover the 25% boundary through the real control.
      for (const [roll, expected] of [[.1, 1], [.25, 0], [.5, 0], [.99, 0]]) {
        await frame.evaluate(roll => {
          const fish = spaceScene.resources.find(r => r instanceof PoolFish);
          fish.clear(); clearTimeout(fish.timer); fish.count = 0;
          window.originalRandom = Math.random; Math.random = () => roll;
        }, roll);
        await frame.locator('#scene-effect').click();
        assert.equal(await frame.evaluate(() => spaceScene.resources.find(r => r instanceof PoolFish).count), expected);
        await frame.evaluate(() => { Math.random = originalRandom; });
      }
      for (const selector of ['#entrance-puff-button', '#pixel-actor']) {
        await frame.evaluate(() => {
          const fish = spaceScene.resources.find(r => r instanceof PoolFish);
          fish.clear(); clearTimeout(fish.timer); fish.count = 0;
          window.originalRandom = Math.random; Math.random = () => .1;
        });
        await frame.locator(selector).click(selector === '#pixel-actor' ? { position: { x: 30, y: viewport.height * .6 } } : {});
        await frame.locator('#scene-effect').click();
        assert.equal(await frame.evaluate(() => spaceScene.resources.find(r => r instanceof PoolFish).count), 1, 'No duplicate fish');
        await frame.evaluate(() => { Math.random = originalRandom; });
      }
      await frame.evaluate(() => {
        const fish = spaceScene.resources.find(r => r instanceof PoolFish);
        fish.clear(); fish.count = 0;
        const random = Math.random; Math.random = () => 0;
        spaceScene.effect(true);
        if (fish.count) throw new Error('Ambient ripple spawned a fish');
        Math.random = random; fish.schedule(100);
      });
      await frame.waitForFunction(() => spaceScene.resources.find(r => r instanceof PoolFish).active, {}, { timeout: 22000 });
      assert(await frame.evaluate(() => {
        const fish = spaceScene.resources.find(r => r instanceof PoolFish), active = fish.active;
        document.querySelector('#light-button').click();
        return active === fish.active && fish.canvas.isConnected;
      }), 'Lighting must preserve the jump');
      await page.waitForTimeout(2700);
      assert(await frame.evaluate(() => !spaceScene.resources.find(r => r instanceof PoolFish).active));
      // Timer-triggered jump tests cleanup during the real portfolio handoff.
      await frame.evaluate(() => {
        window.fishUnderTest = spaceScene.resources.find(r => r instanceof PoolFish);
        fishUnderTest.schedule(10);
      });
      await frame.waitForFunction(() => fishUnderTest.active);
      await frame.locator('.explore-button').click();
      assert(await frame.evaluate(() => !fishUnderTest.alive && !fishUnderTest.canvas.isConnected));
      await page.locator('iframe').waitFor({ state: 'detached' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.getByRole('button', { name: 'Return to intro' }).click();
      await page.locator('iframe.is-ready').waitFor();
      frame = await (await page.locator('iframe').elementHandle()).contentFrame();
      await frame.evaluate(() => spaceScene.setMode('pool'));
      assert(await frame.evaluate(() => {
        const fish = spaceScene.resources.find(r => r instanceof PoolFish);
        return fish.reduced && !fish.active && !fish.timer;
      }));
      await frame.evaluate(() => spaceScene.setMode('space'));
      assert.equal(await frame.locator('.fish-layer').count(), 0);
      assert.deepEqual(errors, []);
      console.log(`${name}: ambient arrival, 25% ripple chance, lighting continuity, entry cleanup, reduced motion and scene isolation passed`);
    } finally { await browser.close(); }
  }));
})();

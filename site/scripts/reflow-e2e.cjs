const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(process.env.BASE_URL || 'http://localhost:3878');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    assert.equal(await page.locator('header .welcome-note').count(), 0, 'top-right tagline removed');
    const sizes = [];
    for (const width of [1440, 1101, 1100, 900, 721, 720, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(650);
      const metrics = await page.evaluate(() => {
        const cells = [...document.querySelectorAll('.bento-grid > .cell')];
        const rects = cells.map((cell) => cell.getBoundingClientRect());
        const overlap = rects.some((a, i) => rects.slice(i + 1).some((b) =>
          a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1));
        return {
          width: innerWidth,
          height: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          overlap,
          animations: cells.flatMap((cell) => cell.getAnimations()).length,
          photoHeight: document.querySelector('.cell-photo-a').getBoundingClientRect().height,
          clipped: [...document.querySelectorAll('.contact-rows,.resume-actions,.projects-list')].some((el) => el.scrollWidth > el.clientWidth + 1),
        };
      });
      assert.equal(metrics.overflow, false, `horizontal overflow at ${width}`);
      assert.equal(metrics.overlap, false, `settled cards overlap at ${width}`);
      assert.equal(metrics.animations, 0, `motion did not settle at ${width}`);
      assert.equal(metrics.clipped, false, `content clips at ${width}`);
      if (width <= 720) assert.ok(metrics.photoHeight <= 460, 'wide mobile photos stay bounded');
      sizes.push(metrics);
    }
    await page.setViewportSize({ width: 1101, height: 900 });
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(50);
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.bento-grid > .cell')].some((cell) => cell.getAnimations().length)), true, 'column crossing glides');
    assert.notEqual(await page.locator('.name-bio').evaluate((el) => getComputedStyle(el).filter), 'none', 'text softens while resizing');
    assert.notEqual(await page.locator('.photo-img').first().evaluate((el) => getComputedStyle(el).filter), 'none', 'photos soften during resize');
    assert.equal(await page.locator('.photo-glass-label').first().evaluate((el) => getComputedStyle(el).filter), 'none', 'glass control stays sharp');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('.cell-photo')].every((cell) => getComputedStyle(cell).opacity === '1')), 'photos remain opaque during reflow');
    const dragWidths = [];
    await page.evaluate(() => {
      window.cardAnimationStarts = 0;
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        if (this.matches('.bento-grid > .cell')) window.cardAnimationStarts++;
        return animate.apply(this, args);
      };
    });
    for (let width = 1440; width >= 640; width -= 10) dragWidths.push(width);
    for (let width = 640; width <= 1440; width += 10) dragWidths.push(width);
    dragWidths.push(1101, 1099, 1102, 719, 722, 720);
    for (const width of dragWidths) {
      await page.setViewportSize({ width, height: 900 });
      const drag = await page.evaluate(() => {
        const cells = [...document.querySelectorAll('.bento-grid > .cell')];
        const rects = cells.map((cell) => cell.getBoundingClientRect());
        return {
          animating: cells.some((cell) => cell.getAnimations().length > 0 || getComputedStyle(cell).transform !== 'none'),
          overlap: rects.some((a, i) => rects.slice(i + 1).some((b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1)),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      // Moving cards can cross during a glide; no overlap is allowed after settling.
      assert.equal(drag.overflow, false, `continuous resize overflow at ${width}`);
    }
    await page.waitForTimeout(700);
    assert.ok(await page.evaluate(() => window.cardAnimationStarts < 100), 'glides do not restart on every drag step');
    assert.equal(await page.locator('.name-bio').evaluate((el) => getComputedStyle(el).filter), 'none', 'text returns fully sharp');
    assert.equal(await page.locator('.photo-img').first().evaluate((el) => getComputedStyle(el).filter), 'none', 'photos return fully sharp');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.bento-grid > .cell')].flatMap((cell) => cell.getAnimations()).length), 0, 'rapid reversals settle');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 721, height: 900 });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.name-bio').evaluate((el) => getComputedStyle(el).filter), 'none', 'reduced motion keeps text sharp');
    assert.equal(await page.locator('.photo-img').first().evaluate((el) => getComputedStyle(el).filter), 'none', 'reduced motion keeps photos sharp');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('.bento-grid > .cell')].flatMap((cell) => cell.getAnimations()).length), 0, 'reduced motion skips reflow');
    await page.locator('.cell-photo-a .photo-flip').click();
    assert.equal(await page.locator('.cell-photo-a .photo-front').evaluate((el) => el.inert), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.cell-photo-a .photo-back').evaluate((el) => el.inert), true);
    await page.locator('.projects-row').first().click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    const box = await page.locator('.projects-plate').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390, 'modal remains in viewport while resizing');
    await page.locator('.projects-plate-close').focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.projects-plate-close').evaluate((el) => el === document.activeElement), true, 'tab wraps to close');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.projects-plate', { state: 'detached' });
    assert.equal(await page.locator('.projects-row').first().evaluate((el) => el === document.activeElement), true, 'focus returns to opener');
    assert.equal(await page.locator('.bento-page').evaluate((el) => el.inert), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify(sizes, null, 2));
    console.log(`PASS: ${dragWidths.length} continuous resize steps, breakpoints, reduced motion, photo faces, modal resize and keyboard return`);
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

const assert = require('node:assert/strict');
const { webkit } = require('playwright');

async function snapshot(page) {
  return page.evaluate(() => {
    const cells = [...document.querySelectorAll('.bento-grid .cell')];
    const rects = cells.map((cell) => cell.getBoundingClientRect());
    const overlap = rects.some((a, i) => rects.slice(i + 1).some((b) =>
      a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1));
    return {
      overlap,
      overflow: document.documentElement.scrollWidth > innerWidth,
      blurred: getComputedStyle(document.querySelector('.name-bio')).filter !== 'none'
        || getComputedStyle(document.querySelector('.photo-img')).filter !== 'none',
    };
  });
}

(async () => {
  const browser = await webkit.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1101, height: 900 } });
    await page.goto(process.env.BASE_URL || 'http://localhost:3877');
    await page.frameLocator('iframe.puff-entrance').locator('a[href="#portfolio"]').first().click();
    await page.waitForSelector('iframe.puff-entrance', { state: 'detached' });
    await page.waitForTimeout(700);

    for (const width of [1100, 1101, 721, 720, 390, 720, 721, 1100, 1101]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(60);
      const state = await snapshot(page);
      assert.equal(state.overlap, false, `cards overlap during resize at ${width}px`);
      assert.equal(state.overflow, false, `horizontal overflow at ${width}px`);
      assert.equal(state.blurred, false, `content blurs during resize at ${width}px`);
    }
    console.log('PASS: WebKit resize crossings keep cards separate and content sharp');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });

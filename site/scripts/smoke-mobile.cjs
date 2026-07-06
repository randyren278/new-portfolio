// Mobile-emulation smoke for the mobile-audit round of fixes.
// Only asserts behaviors this round actually introduced — does NOT test the
// pre-existing `open <project>` → plate auto-chain, which requires human
// interaction (clicking the label) and is out of scope for this fix.
//
//   1) Page loads on iPhone-13 viewport with no console errors
//   2) The (pointer: coarse) media query applies:
//      - #term padding-left computes to ≤ 24px (was 48px)
//      - #keysink is pinned into the viewport at (0,0) with opacity 0
//   3) #chrome-cmdk is a real BUTTON element
//   4) Tapping #chrome-cmdk opens the palette
//   5) Tapping outside the palette dismisses it (pointerdown path)
//
// Runs against localhost:3877 (the dev server started outside this test).

const { chromium, devices } = require('playwright');

const URL = 'http://localhost:3877/';
const DEVICE = devices['iPhone 13'];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...DEVICE,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE ERR: ' + msg.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !document.getElementById('page-loader'), { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const buf = document.getElementById('buffer');
      return (
        buf &&
        [...buf.querySelectorAll('button.link')].some(
          (b) => b.textContent.trim() === 'about',
        )
      );
    },
    { timeout: 8000 },
  );
  await page.waitForTimeout(400);

  const results = [];

  // 1) Mobile media query applied to #term
  const termPadLeft = await page.evaluate(() => {
    const t = document.getElementById('term');
    return t ? parseFloat(getComputedStyle(t).paddingLeft) : null;
  });
  results.push([
    `mobile: #term padding-left ≤ 24px (was 48px) [n=${termPadLeft}]`,
    termPadLeft !== null && termPadLeft <= 24,
  ]);

  // 2) Keysink repositioned into viewport (so iOS will summon soft keyboard)
  const keysink = await page.evaluate(() => {
    const k = document.getElementById('keysink');
    if (!k) return null;
    const r = k.getBoundingClientRect();
    const cs = getComputedStyle(k);
    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      opacity: cs.opacity,
      position: cs.position,
      pointerEvents: cs.pointerEvents,
    };
  });
  results.push([
    `mobile: #keysink pinned to viewport [left=${keysink?.left} top=${keysink?.top} op=${keysink?.opacity}]`,
    keysink !== null &&
      keysink.left >= -5 && keysink.left < 10 &&
      keysink.top >= -5 && keysink.top < 10 &&
      keysink.opacity === '0' &&
      keysink.pointerEvents === 'none',
  ]);

  // 3) #chrome-cmdk is a BUTTON, not a DIV
  const cmdKTag = await page.evaluate(() => {
    const el = document.getElementById('chrome-cmdk');
    return el ? el.tagName : null;
  });
  results.push([`mobile: #chrome-cmdk is a BUTTON [tag=${cmdKTag}]`, cmdKTag === 'BUTTON']);

  // 4) chrome-cmdk pointer-events unlocked on mobile
  const cmdKPE = await page.evaluate(() => {
    const el = document.getElementById('chrome-cmdk');
    return el ? getComputedStyle(el).pointerEvents : null;
  });
  results.push([`mobile: #chrome-cmdk pointer-events=auto [pe=${cmdKPE}]`, cmdKPE === 'auto']);

  // 5) Tap chrome-cmdk to open palette
  await page.tap('#chrome-cmdk');
  await page.waitForTimeout(400);
  const paletteOpen = await page.evaluate(() => {
    const p = document.getElementById('palette');
    return p ? p.classList.contains('open') : false;
  });
  results.push(['mobile: tap #chrome-cmdk opens palette', paletteOpen]);

  // 6) Tap outside palette dismisses it (pointerdown path replaces mousedown)
  if (paletteOpen) {
    await page.tap('#palette', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(600);
    const paletteClosed = await page.evaluate(() => {
      const p = document.getElementById('palette');
      return p ? !p.classList.contains('open') : true;
    });
    results.push(['mobile: tap outside palette dismisses (pointerdown)', paletteClosed]);
  } else {
    results.push(['mobile: tap outside palette dismisses (pointerdown) [skipped]', false]);
  }

  // 7) viewportFit=cover is set (indirect check — the meta tag renders it)
  const hasViewportFit = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? /viewport-fit=cover/.test(meta.getAttribute('content') || '') : false;
  });
  results.push(['mobile: viewport meta includes viewport-fit=cover', hasViewportFit]);

  // 8) chrome-tr / chrome-br honor safe-area via max() (env resolves to 0 in
  //    headless emulation, so the max() falls through to the base 14/20 values;
  //    all we can assert is that the CSS parses cleanly — via the computed top
  //    being a positive number.)
  const chromePositions = await page.evaluate(() => {
    const tr = document.querySelector('.chrome-tr');
    const br = document.querySelector('.chrome-br');
    return {
      trTop: tr ? parseFloat(getComputedStyle(tr).top) : null,
      brBottom: br ? parseFloat(getComputedStyle(br).bottom) : null,
    };
  });
  results.push([
    `mobile: .chrome-tr top parses [n=${chromePositions.trTop}]`,
    chromePositions.trTop !== null && chromePositions.trTop >= 14,
  ]);
  results.push([
    `mobile: .chrome-br bottom parses [n=${chromePositions.brBottom}]`,
    chromePositions.brBottom !== null && chromePositions.brBottom >= 14,
  ]);

  await page.screenshot({ path: '/tmp/smoke-mobile.png', fullPage: true });
  await browser.close();

  let bad = 0;
  console.log('\n== mobile smoke results ==');
  for (const [name, ok] of results) {
    console.log(`  ${ok ? '✓' : '✗'}  ${name}`);
    if (!ok) bad++;
  }
  console.log(`\n== console/page errors: ${errors.length} ==`);
  errors.forEach((e) => console.log('  ' + e));
  process.exit(bad > 0 || errors.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Smoke test for the round of changes:
//   1) Boot ceremony ("welcome, visitor") shows on every visit
//   2) `ls` runs once, not twice, after the ceremony
//   3) `latest` appears in the home listing
//   4) `now`, `guestbook`, `archive` are gone from home listing
//   5) Fuzzy navigation: typing `oryzo` from home jumps to ~/work/oryzo
//   6) Fuzzy sibling jump: from ~/work/oryzo, typing `halcyon` hops sideways
//   7) No "museum" or "catalog" strings leak into the DOM

const { chromium } = require('playwright');

const URL = 'http://localhost:3877/';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE ERR: ' + msg.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  // Wait for page-loader to actually exit (either via its own dissolve or a
  // skip). We just wait it out — do NOT dispatch a key here, because that
  // would race with the skip listener the boot() ceremony attaches next.
  await page.waitForFunction(() => !document.getElementById('page-loader'), { timeout: 15000 });
  // Boot ceremony runs a 1200ms timeline before auto-ls fires; wait for the
  // "about" link to actually appear rather than gambling on a sleep.
  await page.waitForFunction(
    () => {
      const buf = document.getElementById('buffer');
      if (!buf) return false;
      return [...buf.querySelectorAll('button.link')].some(
        (b) => b.textContent.trim() === 'about',
      );
    },
    { timeout: 8000 },
  );
  await page.waitForTimeout(400);

  const bufAfterBoot = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  const aboutButtonCount = await page.evaluate(() => {
    const buf = document.getElementById('buffer');
    if (!buf) return 0;
    return [...buf.querySelectorAll('button.link')].filter(
      (b) => b.textContent.trim() === 'about',
    ).length;
  });

  const results = [];
  const has = (needle) => bufAfterBoot.includes(needle);
  results.push(['preamble: welcome visitor',    has('welcome, visitor')]);
  results.push(['preamble: studio hours',       has('[studio hours — open]')]);
  results.push(['preamble: lights on',          has('[lights on]')]);
  results.push(['auto-ls: about visible',       has('about')]);
  results.push(['auto-ls: work/ visible',       has('work/')]);
  results.push(['auto-ls: latest visible',      has('latest')]);
  results.push(['auto-ls ran ONCE (about x1)',  aboutButtonCount === 1]);
  results.push(['deprecated: now not shown',   !bufAfterBoot.split('\n').some((l) => l.trim() === 'now')]);
  results.push(['deprecated: guestbook gone',  !has('guestbook')]);
  results.push(['deprecated: archive gone',    !has('archive')]);
  results.push(['museum vocab gone',           !bufAfterBoot.toLowerCase().includes('museum')]);
  results.push(['catalog vocab gone',          !bufAfterBoot.toLowerCase().includes('catalog')]);

  // Fuzzy navigation: type `oryzo` and press Enter
  for (const ch of 'oryzo') {
    await page.evaluate((k) => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    }, ch);
  }
  await page.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });
  await page.waitForTimeout(600);

  const bufAfterFuzz = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  results.push(['fuzzy: jumping-to hint printed', bufAfterFuzz.includes('jumping to')]);
  results.push(['fuzzy: oryzo landed',           bufAfterFuzz.toLowerCase().includes('oryzo')]);

  // Deep test: navigate into the work dir, then fuzz-type a sibling slug.
  // From `~/work` typing `halcyon` (unknown) should fuzzy-jump to that project.
  const typeAndSubmit = async (s) => {
    for (const ch of s) {
      await page.evaluate((k) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      }, ch);
    }
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.waitForTimeout(500);
  };

  await typeAndSubmit('cd work');
  await typeAndSubmit('halcyon');
  const bufAfterSibling = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  results.push(['fuzzy in-dir jump: halcyon', bufAfterSibling.toLowerCase().includes('halcyon')]);
  results.push(['fuzzy in-dir jump: hint',    bufAfterSibling.includes('jumping to ~/work/halcyon')]);

  await page.screenshot({ path: '/tmp/smoke-after-boot.png', fullPage: true });
  await browser.close();

  let bad = 0;
  console.log('\n== smoke results ==');
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

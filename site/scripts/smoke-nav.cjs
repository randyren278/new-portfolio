// Smoke test for the round of changes:
//   1) `ls` runs automatically on boot
//   2) `latest` appears in the home listing
//   3) `now`, `guestbook`, `archive` are gone from home listing
//   4) Fuzzy navigation: typing `oryzo` from home jumps to ~/work/oryzo

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
  await page.waitForTimeout(600);
  // Skip loader/ceremony
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  await page.waitForFunction(
    () => {
      const chips = document.getElementById('chips');
      return chips && chips.children.length > 0;
    },
    { timeout: 15000 },
  );
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
    { timeout: 5000 },
  );
  await page.waitForTimeout(200);

  const bufAfterBoot = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );

  const results = [];
  const has = (needle) => bufAfterBoot.includes(needle);
  results.push(['auto-ls: about visible',       has('about')]);
  results.push(['auto-ls: work/ visible',       has('work/')]);
  results.push(['auto-ls: latest visible',      has('latest')]);
  results.push(['deprecated: now not shown',   !has('\nnow\n') && !bufAfterBoot.split('\n').some((l) => l.trim() === 'now')]);
  results.push(['deprecated: guestbook gone',  !has('guestbook')]);
  results.push(['deprecated: archive gone',    !has('archive')]);

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
  // After `open oryzo` from home the inline label card renders (kicker "Studio note")
  results.push(['fuzzy: oryzo landed',           bufAfterFuzz.toLowerCase().includes('oryzo')]);

  // Deep test: cd into oryzo, then type "halcyon" — sibling jump one level up
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

  await typeAndSubmit('cd work/oryzo');
  await typeAndSubmit('halcyon');
  const bufAfterSibling = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  // The last chunk of buffer should contain a fresh "jumping to" line
  results.push(['fuzzy sibling jump: halcyon', bufAfterSibling.toLowerCase().includes('halcyon')]);
  results.push(['fuzzy sibling jump: hint',    (bufAfterSibling.match(/jumping to/g) || []).length >= 2]);

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

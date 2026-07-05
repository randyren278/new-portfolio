// Visual + behavioral parity check between the standalone index.html and the
// Next.js wrapped version. Loads each in headless Chromium, drives the shell
// through a scripted command sequence, and diffs the resulting buffer text.
//
// Fails the exit code if outputs diverge — this is the Phase 1 gate.

const { chromium } = require('playwright');
const path = require('node:path');

const NEXT_URL = 'http://localhost:3877/';
const HTML_URL = 'file://' + path.resolve(__dirname, '../../index.html');

const COMMANDS = [
  'pwd',
  'ls',
  'cd oryzo',
  'ls',
  'cd ..',
  'cat about',
  'hours',
  'contact',
  'help',
  'man cd',
  'whoami',
  'history',
];

async function drive(url, label) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push('CONSOLE ERR: ' + msg.text());
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  // Skip page-loader + boot ceremony by dispatching a key on window.
  // We need to wait for the page loader to actually start before it can be
  // skipped — the engine adds its skip listeners inside runPageLoader.
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
  // Wait for boot ceremony to complete (chip row appears once busy=false).
  await page.waitForFunction(
    () => {
      const chips = document.getElementById('chips');
      return chips && chips.children.length > 0;
    },
    { timeout: 15000 },
  );
  // Give a beat for lingering animations.
  await page.waitForTimeout(300);

  for (const cmd of COMMANDS) {
    // Dispatch each character via a keydown on document (that's what the
    // engine listens on). Real Playwright keyboard events don't reach the
    // engine because #input-area isn't visibly focused for the click path.
    for (const ch of cmd) {
      await page.evaluate((k) => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      }, ch);
    }
    await page.evaluate(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await page.waitForTimeout(200);
  }

  const bufferText = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  await page.screenshot({ path: `/tmp/parity-${label}.png`, fullPage: true });
  await browser.close();
  return { text: bufferText, errors: consoleErrors };
}

(async () => {
  console.log('driving index.html...');
  const original = await drive(HTML_URL, 'original');
  console.log('driving next.js...');
  const wrapped = await drive(NEXT_URL, 'wrapped');

  console.log(`\n=== errors in original: ${original.errors.length} ===`);
  original.errors.forEach((e) => console.log('  ' + e));
  console.log(`\n=== errors in next.js: ${wrapped.errors.length} ===`);
  wrapped.errors.forEach((e) => console.log('  ' + e));

  // Redact the "Last login: ..." line — it stamps `new Date()` at boot and
  // will always differ between two runs seconds apart. Everything else is
  // fully deterministic and must match byte-for-byte.
  const normalize = (s) =>
    s
      .replace(/^Last login: .*$/m, 'Last login: <redacted>')
      .replace(/\s+$/gm, '')
      .trim();
  const a = normalize(original.text);
  const b = normalize(wrapped.text);
  if (a === b) {
    console.log('\n✓ BUFFER OUTPUT IDENTICAL');
    console.log(`  (${a.length} chars)`);
    process.exit(wrapped.errors.length > 0 ? 1 : 0);
  }

  console.log('\n✗ BUFFER DIVERGES');
  console.log(`  original: ${a.length} chars`);
  console.log(`  next.js:  ${b.length} chars`);
  // Print first diverging line for quick triage.
  const aL = a.split('\n');
  const bL = b.split('\n');
  for (let i = 0; i < Math.max(aL.length, bL.length); i++) {
    if (aL[i] !== bL[i]) {
      console.log(`\nfirst diff at line ${i + 1}:`);
      console.log('  original: ' + JSON.stringify(aL[i]));
      console.log('  next.js:  ' + JSON.stringify(bL[i]));
      break;
    }
  }
  process.exit(1);
})();

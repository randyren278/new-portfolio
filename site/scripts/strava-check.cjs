/**
 * End-to-end test for the `latest` command with a mocked Strava response.
 *
 * Intercepts /api/strava/latest and returns a canned activity payload with
 * a real Google encoded polyline (a small loop in SF). Types `latest` into
 * the shell, waits for the card to render, and asserts:
 *   - kicker reads "§ LATEST FIELD RECORDING"
 *   - distance and pace are formatted correctly
 *   - the SVG polyline has a non-empty <path d="..."> attribute
 *   - the card uses the same .label-card class family as about/contact
 */

const { chromium } = require('playwright');

const NEXT_URL = 'http://localhost:3877/';

// A tiny encoded polyline — a real one from Strava's polyline docs.
// Represents roughly a 3-point track; enough to prove decode + projection.
const MOCK_ACTIVITY = {
  id: 999,
  name: 'Morning ferry crossing',
  distanceM: 5030,
  movingTimeS: 1568,
  startDate: '2026-06-30T14:22:00Z',
  activityType: 'Run',
  // Pre-projected by the server; here we just provide a plausible SVG path.
  polylinePath: 'M 20 40 L 80 60 L 140 100 L 200 90 L 260 130 L 320 150',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  // Intercept the Strava API call.
  await page.route('**/api/strava/latest', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_ACTIVITY),
    });
  });

  await page.goto(NEXT_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Skip the page-loader.
  await page.evaluate(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  );
  // Wait for boot to complete.
  await page.waitForFunction(
    () => document.getElementById('chips')?.children.length > 0,
    { timeout: 15000 },
  );
  await page.waitForTimeout(300);

  // Type `latest` + Enter.
  for (const ch of 'latest') {
    await page.evaluate((k) =>
      document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), ch);
  }
  await page.evaluate(() =>
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));

  // Wait for the card to appear. Reduced-motion path is instant; the animated
  // path takes ~4-5s for all fields to type in. Poll until it's done.
  await page.waitForFunction(
    () => !!document.querySelector('[data-inline-slug="latest"]'),
    { timeout: 8000 },
  );
  // Wait until all meta values are populated (last dd is the Date row).
  await page.waitForFunction(
    () => {
      const card = document.querySelector('[data-inline-slug="latest"]');
      const dds = card ? card.querySelectorAll('.label-meta dd') : [];
      return dds.length === 4 && [...dds].every((d) => d.textContent.length > 0);
    },
    { timeout: 10000 },
  );
  // And until the SVG path is in the DOM.
  await page.waitForFunction(
    () => {
      const p = document.querySelector('[data-inline-slug="latest"] svg path');
      return p && p.getAttribute('d')?.length > 0;
    },
    { timeout: 10000 },
  );

  const result = await page.evaluate(() => {
    const card = document.querySelector('[data-inline-slug="latest"]');
    if (!card) return null;
    const kicker = card.querySelector('.label-kicker')?.textContent;
    const title = card.querySelector('.label-title')?.textContent;
    const dts = [...card.querySelectorAll('.label-meta dt')].map((n) => n.textContent);
    const dds = [...card.querySelectorAll('.label-meta dd')].map((n) => n.textContent);
    const path = card.querySelector('svg path')?.getAttribute('d');
    return { kicker, title, dts, dds, path, classes: card.className };
  });

  await page.screenshot({ path: '/tmp/latest-card.png', fullPage: true });
  await browser.close();

  console.log('\n=== console errors:', errors.length, '===');
  errors.forEach((e) => console.log('  ' + e));

  console.log('\n=== card contents ===');
  console.log(JSON.stringify(result, null, 2));

  const fails = [];
  if (!result) fails.push('card element not found');
  else {
    if (result.kicker !== '§ LATEST FIELD RECORDING') fails.push('kicker wrong: ' + result.kicker);
    // Title is now generated from time-of-day + activity type, so it's not
    // "Morning ferry crossing" any more. Assert shape instead: two words,
    // ends with the activity verb.
    if (!/^(Morning|Afternoon|Evening|Night|Late night) run$/.test(result.title))
      fails.push('title shape wrong: ' + result.title);
    if (!result.classes.includes('label-card')) fails.push('missing .label-card class');
    // dts should be [Distance, Pace|Speed, Type, Date]; the mock is type=Run so Pace.
    const iDist = result.dts.indexOf('Distance');
    if (iDist < 0 || result.dds[iDist] !== '5.03 km') fails.push('distance wrong: ' + result.dds[iDist]);
    const iPace = result.dts.indexOf('Pace');
    // 1568s / 5.03km = 311.7 s/km = 5:12 /km
    if (iPace < 0 || result.dds[iPace] !== '5:12 /km') fails.push('pace wrong: ' + result.dds[iPace]);
    if (!result.path || !result.path.startsWith('M ')) fails.push('svg path missing/invalid: ' + result.path);
  }

  if (fails.length) {
    console.log('\n✗ FAILED:');
    fails.forEach((f) => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('\n✓ latest command works end-to-end');
  process.exit(errors.length > 0 ? 1 : 0);
})();

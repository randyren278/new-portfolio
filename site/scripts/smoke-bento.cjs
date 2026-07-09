/**
 * Playwright smoke test for the bento home.
 *
 * Runs in two modes controlled by the DEVICE env var:
 *
 *   node scripts/smoke-bento.cjs                    # desktop, 1440x900
 *   DEVICE=mobile node scripts/smoke-bento.cjs      # iPhone 13
 *
 * Requires the dev server on http://localhost:3877 (see CLAUDE.md).
 * Exits 0 on success, 1 on any assertion or page error.
 */

const { chromium, devices } = require('playwright');

const URL = 'http://localhost:3877/';
const IS_MOBILE = process.env.DEVICE === 'mobile';

function assert(cond, label) {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    console.error(`  FAIL ${label}`);
    process.exitCode = 1;
  }
}

(async () => {
  const browser = await chromium.launch();
  const contextOpts = IS_MOBILE
    ? { ...devices['iPhone 13'] }
    : { viewport: { width: 1440, height: 900 } };
  const context = await browser.newContext(contextOpts);
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // Generic "Failed to load resource: 404" from the browser has no URL in
    // the text — the URL lives on the associated request. We ignore those
    // because they're expected: /photos/photo-NN.jpg 404s until Randy drops
    // files in. Below we also assert via `response` events that the only
    // 404s are photo files, so this filter is safe.
    if (/Failed to load resource.*404/.test(text)) return;
    errors.push('CONSOLE: ' + text);
  });

  // Track every non-2xx response so we can prove after-the-fact that any
  // 404s are photo files and nothing else.
  const badResponses = [];
  page.on('response', (r) => {
    if (r.status() >= 400) badResponses.push({ status: r.status(), url: r.url() });
  });

  console.log(`\n== smoke-bento (${IS_MOBILE ? 'mobile / iPhone 13' : 'desktop'}) ==`);

  await page.goto(URL, { waitUntil: 'networkidle' });

  // ---- 1. page + title ---------------------------------------------------

  const title = await page.title();
  assert(title === 'Randy Ren', `document title is "Randy Ren" (got "${title}")`);

  // ---- 2. the four info cells ------------------------------------------

  const kickers = await page.$$eval('.kicker', (els) => els.map((e) => e.textContent?.trim()));
  assert(kickers.includes('§ INDEX'), 'Name card kicker rendered');
  assert(kickers.includes('§ CORRESPONDENCE'), 'Contact card kicker rendered');
  assert(
    kickers.some((k) => k?.startsWith('§ INDEX / SIX PLATES')),
    'Projects card kicker rendered',
  );
  assert(kickers.includes('§ COLOPHON'), 'Colophon card kicker rendered');
  assert(kickers.includes('§ LATEST ACTIVITY'), 'Strava card kicker rendered');

  // ---- 3. all six PLATE rows in Projects ------------------------------

  const projectNums = await page.$$eval('.projects-num', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  ['01', '02', '03', '04', '05', '06'].forEach((n) => {
    assert(projectNums.includes(n), `PLATE ${n} row rendered`);
  });

  const projectTitles = await page.$$eval('.projects-ttl', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  ['ORYZO', 'HALCYON', 'APERTURE', 'FIELDNOTE', 'SIGNAL GARDEN', 'LOOM'].forEach((t) => {
    assert(projectTitles.includes(t), `project title "${t}" rendered`);
  });

  // ---- 4. clicking a project row expands the plate in-place ------------

  await page.click('.projects-row:has(.projects-ttl:text("ORYZO"))');
  await page.waitForSelector('.projects-plate', { state: 'visible' });
  const plateTitle = await page.$eval('.projects-plate-title', (el) => el.textContent?.trim());
  assert(plateTitle === 'Oryzo', `Oryzo plate title rendered (got "${plateTitle}")`);
  const plateEssayCount = await page.$$eval('.projects-plate-essay', (els) => els.length);
  assert(plateEssayCount >= 1, `plate essay paragraphs rendered (${plateEssayCount})`);
  const ariaExpanded = await page.getAttribute(
    '.projects-row:has(.projects-ttl:text("ORYZO"))',
    'aria-expanded',
  );
  assert(ariaExpanded === 'true', `row aria-expanded flips to true (got "${ariaExpanded}")`);

  // ---- 5. close returns to the list -----------------------------------

  await page.click('.projects-plate-close');
  await page.waitForSelector('.projects-plate', { state: 'detached' });
  const listVisible = await page.$('.projects-list');
  assert(listVisible !== null, 'projects list returns after close');

  // ---- 6. exactly 2 photo cells with filename labels -----------------
  // Middle column always renders 2 near-square photo cells (see
  // pickLayout in src/bento/photos.ts). Assert count + filename format.

  const photoLabels = await page.$$eval('.photo-fname', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  assert(photoLabels.length === 2, `two photo cells rendered (got ${photoLabels.length})`);
  const hasValidFilenames = photoLabels.every((l) => /^PHOTO-\d{2}\.JPG$/i.test(l ?? ''));
  assert(hasValidFilenames, `photo labels look like PHOTO-NN.JPG (${photoLabels.join(', ')})`);

  // Sanity check: bento-grid carries data-photo-count matching what we see.
  const declaredCount = await page.getAttribute('.bento-grid', 'data-photo-count');
  assert(
    String(photoLabels.length) === declaredCount,
    `data-photo-count matches rendered count (${declaredCount} vs ${photoLabels.length})`,
  );

  // ---- 7. strava svg with a <path> ------------------------------------

  const stravaPathD = await page.$eval('.cell-strava svg path', (el) => el.getAttribute('d'));
  assert(
    !!stravaPathD && stravaPathD.length > 20,
    `strava SVG path rendered (${stravaPathD?.slice(0, 32)}...)`,
  );

  // ---- 8. mobile-specific checks -------------------------------------

  if (IS_MOBILE) {
    const gridCols = await page.$eval(
      '.bento-grid',
      (el) => getComputedStyle(el).gridTemplateColumns,
    );
    // Should be a single track on mobile; count via " " separators.
    const trackCount = gridCols.trim().split(/\s+/).length;
    assert(trackCount === 1, `mobile grid is single-column (got ${trackCount}: "${gridCols}")`);

    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    assert(
      bodyScrollWidth <= viewportWidth + 1,
      `no horizontal scroll (body ${bodyScrollWidth} vs viewport ${viewportWidth})`,
    );

    const viewportMeta = await page.$eval('meta[name="viewport"]', (el) =>
      el.getAttribute('content'),
    );
    assert(
      viewportMeta?.includes('viewport-fit=cover'),
      `viewport meta contains viewport-fit=cover (got "${viewportMeta}")`,
    );

    // Cells stack top-to-bottom via CSS `order`. Read each cell's y
    // position and derive the stack sequence. Rules under test:
    //   1. .cell-name is first (§ INDEX anchored to the top).
    //   2. photo-a and photo-b are never adjacent in the stack.
    // We pick the LONGEST `cell-*` class so `cell-photo-a` wins over
    // the shared `cell-photo` on the photo cells.
    const stack = await page.$$eval('.bento-grid > .cell', (els) =>
      els
        .map((el) => ({
          cls: [...el.classList]
            .filter((c) => c.startsWith('cell-') && c !== 'cell')
            .sort((a, b) => b.length - a.length)[0],
          y: el.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.y - b.y)
        .map((e) => e.cls),
    );
    assert(stack[0] === 'cell-name', `Name card stacks first on mobile (got "${stack[0]}")`);
    const photoAIdx = stack.indexOf('cell-photo-a');
    const photoBIdx = stack.indexOf('cell-photo-b');
    assert(
      photoAIdx !== -1 && photoBIdx !== -1,
      `both photo cells present in mobile stack (a:${photoAIdx}, b:${photoBIdx})`,
    );
    assert(
      Math.abs(photoAIdx - photoBIdx) > 1,
      `photos never back-to-back on mobile (a:${photoAIdx}, b:${photoBIdx}, stack:${stack.join(',')})`,
    );
  }

  // ---- 9. only expected 404s (photo placeholders) ---------------------

  const unexpected404s = badResponses.filter((r) => !/\/photos\/photo-\d+\.jpe?g$/i.test(r.url));
  assert(
    unexpected404s.length === 0,
    `no unexpected 4xx/5xx responses (found ${unexpected404s.length})`,
  );
  if (unexpected404s.length) unexpected404s.forEach((r) => console.error('    ', r.status, r.url));

  // ---- 10. no console/page errors --------------------------------------

  assert(errors.length === 0, `no page or console errors (found ${errors.length})`);
  if (errors.length) errors.forEach((e) => console.error('    ', e));

  await browser.close();

  if (process.exitCode) {
    console.log(`\n== FAIL ==\n`);
    process.exit(process.exitCode);
  }
  console.log(`\n== PASS ==\n`);
})();

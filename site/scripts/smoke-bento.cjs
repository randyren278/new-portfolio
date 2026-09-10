/**
 * Playwright smoke test for the bento home.
 *
 * Runs in two modes controlled by the DEVICE env var:
 *
 *   node scripts/smoke-bento.cjs                    # desktop, 1440x900
 *   DEVICE=mobile node scripts/smoke-bento.cjs      # iPhone 13
 *   BASE_URL=https://www.randyren.org/ node scripts/smoke-bento.cjs
 *
 * Requires the dev server on http://localhost:3877 (see CLAUDE.md).
 * Exits 0 on success, 1 on any assertion or page error.
 */

const { chromium, devices } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3877/';
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

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });

  // ---- 1. page + title ---------------------------------------------------

  const title = await page.title();
  assert(title === 'Randy Ren', `document title is "Randy Ren" (got "${title}")`);

  // ---- 2. the four info cells ------------------------------------------

  const kickers = await page.$$eval('.kicker', (els) => els.map((e) => e.textContent?.trim()));
  assert(kickers.includes('§ INDEX'), 'Name card kicker rendered');
  assert(kickers.includes('§ CORRESPONDENCE'), 'Contact card kicker rendered');
  assert(kickers.includes('§ PROJECTS'), 'Projects card kicker rendered');
  assert(kickers.includes('§ RÉSUMÉ / ONE PAGE'), 'Résumé card kicker rendered');
  assert(kickers.includes('§ LATEST ACTIVITY'), 'Strava card kicker rendered');

  // ---- 2b. résumé card exposes the real one-page document ------------

  const resumeViewHref = await page.getAttribute('.resume-view', 'href');
  const resumeViewTarget = await page.getAttribute('.resume-view', 'target');
  const resumeDownloadHref = await page.getAttribute('.resume-download', 'href');
  const resumeDownloadName = await page.getAttribute('.resume-download', 'download');
  const resumeViewName = await page.getAttribute('.resume-view', 'aria-label');
  const resumeDownloadAccessibleName = await page.getAttribute('.resume-download', 'aria-label');
  assert(
    resumeViewHref === '/resume/Randy_Ren_Resume.pdf',
    `résumé view link targets the public PDF (got "${resumeViewHref}")`,
  );
  assert(
    resumeViewTarget === '_blank',
    `résumé view link opens a new tab (got "${resumeViewTarget}")`,
  );
  assert(
    resumeDownloadHref === '/api/resume/download',
    `résumé download uses the attachment endpoint (got "${resumeDownloadHref}")`,
  );
  assert(
    resumeDownloadName === 'Randy_Ren_Resume.pdf',
    `résumé download filename is stable (got "${resumeDownloadName}")`,
  );
  assert(
    resumeViewName === 'View Randy Ren résumé (PDF, opens in a new tab)',
    `résumé view purpose is explicit (got "${resumeViewName}")`,
  );
  assert(
    resumeDownloadAccessibleName === 'Download Randy Ren résumé (PDF)',
    `résumé download purpose is explicit (got "${resumeDownloadAccessibleName}")`,
  );

  // The card must not restate what the page already says. The wordmark
  // lives in the Name cell; a page-count badge on the thumbnail duplicates
  // the "1 PAGE" spec line. Both were removed — assert they stay gone.
  const resumeCardText = await page.$eval('.cell-resume', (el) => el.textContent ?? '');
  assert(
    !/Randy\s+Ren/i.test(resumeCardText),
    'résumé card does not repeat the name already carried by the Name cell',
  );
  assert(
    (await page.$('.resume-preview span')) === null,
    'résumé preview carries no page-count badge',
  );
  const resumeSpec = await page.$$eval('.resume-spec', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  assert(
    resumeSpec.length === 1 && resumeSpec[0] === 'PDF · 1 PAGE',
    `résumé spec is a single format line (got ${JSON.stringify(resumeSpec)})`,
  );

  const resumeActionHeights = await page.$$eval('.resume-action', (links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  assert(
    resumeActionHeights.every((height) => height >= 44),
    `résumé actions meet the 44px target minimum (${resumeActionHeights.join(', ')})`,
  );

  await page.focus('.resume-view');
  const resumeFocus = await page.$eval('.resume-view', (link) => {
    const style = getComputedStyle(link);
    return `${style.outlineStyle} ${style.outlineWidth}`;
  });
  assert(resumeFocus === 'solid 2px', `résumé keyboard focus is visible (${resumeFocus})`);

  const [openedResume] = await Promise.all([
    context.waitForEvent('page'),
    page.keyboard.press('Enter'),
  ]);
  assert(
    (await openedResume.opener()) === page,
    'résumé view action opens from the portfolio page',
  );
  await openedResume.close();

  await page.focus('.resume-download');
  const [resumeDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.keyboard.press('Enter'),
  ]);
  assert(
    resumeDownload.suggestedFilename() === 'Randy_Ren_Resume.pdf',
    `résumé download activates with the stable filename (${resumeDownload.suggestedFilename()})`,
  );

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const resumeTransitionDuration = await page.$eval(
    '.resume-view',
    (link) => getComputedStyle(link).transitionDuration,
  );
  assert(
    resumeTransitionDuration === '0s',
    `résumé actions suppress motion when requested (${resumeTransitionDuration})`,
  );
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  const resumePreviewLoaded = await page.$eval(
    '.resume-preview img',
    (img) => img.complete && img.naturalWidth > 0,
  );
  assert(resumePreviewLoaded, 'résumé preview image loaded');

  const resumeResponse = await page.request.get(new URL(resumeViewHref, BASE_URL).toString());
  assert(resumeResponse.ok(), `résumé PDF responds successfully (${resumeResponse.status()})`);
  assert(
    resumeResponse.headers()['content-type']?.includes('application/pdf'),
    `résumé response is application/pdf (${resumeResponse.headers()['content-type']})`,
  );
  assert(
    !resumeResponse.headers()['content-disposition']?.includes('attachment'),
    'résumé view response remains inline',
  );

  const resumeDownloadResponse = await page.request.get(
    new URL(resumeDownloadHref, BASE_URL).toString(),
  );
  assert(
    resumeDownloadResponse.ok(),
    `résumé download responds successfully (${resumeDownloadResponse.status()})`,
  );
  assert(
    resumeDownloadResponse.headers()['content-type']?.includes('application/pdf'),
    `résumé download response is application/pdf (${resumeDownloadResponse.headers()['content-type']})`,
  );
  assert(
    resumeDownloadResponse.headers()['content-disposition'] ===
      'attachment; filename="Randy_Ren_Resume.pdf"',
    `résumé download is an attachment (${resumeDownloadResponse.headers()['content-disposition']})`,
  );

  // ---- 3. PLATE rows in Projects ---------------------------------------
  // The complete catalog must be visible in stable order. This intentionally
  // names the expected projects so hiding entries behind random sampling
  // cannot pass the smoke test.

  const projectNums = await page.$$eval('.projects-num', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  const projectTitles = await page.$$eval('.projects-ttl', (els) =>
    els.map((e) => e.textContent?.trim()),
  );
  const expectedProjectTitles = [
    'SILL',
    'STRAITS',
    'BODE',
    'HERA',
    'IRIS',
    'LIMINAL',
    'HEPHAESTUS',
    'IDIOLECT',
  ];

  assert(
    projectNums.length === expectedProjectTitles.length,
    `all ${expectedProjectTitles.length} plate rows rendered (got ${projectNums.length})`,
  );
  const expectedNums = projectNums.map((_, i) => String(i + 1).padStart(2, '0'));
  assert(
    projectNums.join(',') === expectedNums.join(','),
    `plate numbers are a contiguous run (got ${projectNums.join(', ')})`,
  );
  assert(
    projectTitles.join(',') === expectedProjectTitles.join(','),
    `complete project catalog is in stable order (got ${projectTitles.join(', ')})`,
  );

  const projectListMetrics = await page.$eval('.projects-list', (list) => {
    const viewport = list.getBoundingClientRect();
    const fullyVisibleRows = [...list.querySelectorAll('.projects-row')].filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.top >= viewport.top && rect.bottom <= viewport.bottom + 1;
    }).length;
    return {
      clientHeight: list.clientHeight,
      scrollHeight: list.scrollHeight,
      fullyVisibleRows,
    };
  });
  // Every project is reachable by scrolling the page alone, in both modes.
  // Mobile used to cap the cell at 70dvh, which hid the last three
  // projects inside a nested scroller with no affordance.
  assert(
    projectListMetrics.scrollHeight <= projectListMetrics.clientHeight + 1,
    `Projects list is not a nested scroller (${projectListMetrics.clientHeight}/${projectListMetrics.scrollHeight}px)`,
  );
  assert(
    projectListMetrics.fullyVisibleRows === expectedProjectTitles.length,
    `the whole catalog is laid out at once (${projectListMetrics.fullyVisibleRows}/${expectedProjectTitles.length})`,
  );

  // ---- 4. every project row opens the matching plate -------------------

  for (let i = 0; i < expectedProjectTitles.length; i++) {
    const row = `.projects-row:nth-child(${i + 1})`;
    await page.click(row);
    await page.waitForSelector('.projects-plate', { state: 'visible' });

    const plateTitle = await page.$eval('.projects-plate-title', (el) => el.textContent?.trim());
    const plateNumber = await page.$eval('.projects-plate-number', (el) => el.textContent?.trim());
    const plateEssayCount = await page.$$eval('.projects-plate-essay', (els) => els.length);
    const plateLinks = await page.$$eval('.projects-plate-link', (els) =>
      els.map((e) => e.getAttribute('href')),
    );
    const ariaExpanded = await page.getAttribute(row, 'aria-expanded');

    assert(
      plateTitle?.toUpperCase() === expectedProjectTitles[i],
      `plate ${expectedNums[i]} matches ${expectedProjectTitles[i]} (got "${plateTitle}")`,
    );
    assert(
      plateNumber === expectedNums[i],
      `plate ${expectedProjectTitles[i]} keeps number ${expectedNums[i]} (got "${plateNumber}")`,
    );
    assert(
      plateEssayCount >= 1,
      `plate ${expectedProjectTitles[i]} renders essay content (${plateEssayCount} paragraphs)`,
    );
    assert(
      plateLinks.length > 0 && plateLinks.every((href) => (href ?? '').startsWith('https://')),
      `plate ${expectedProjectTitles[i]} renders secure external links (${plateLinks.join(', ')})`,
    );
    assert(
      ariaExpanded === 'true',
      `row ${expectedProjectTitles[i]} exposes its expanded state (got "${ariaExpanded}")`,
    );

    await page.click('.projects-plate-close');
    await page.waitForSelector('.projects-plate', { state: 'detached' });
  }

  // ---- 5. close returns to the list -----------------------------------

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

  // ---- 6b. photo cards flip to a verso face ---------------------------
  // Each photo cell is a flip card: front is the image, back is the
  // "verso" (provenance, palette, the paired frame). Independent flips —
  // opening one must not open the other.

  const flipButtons = await page.$$('.photo-flip');
  assert(flipButtons.length === 2, `two photo flip buttons (got ${flipButtons.length})`);

  const cardA = '.cell-photo-a';
  assert(
    (await page.getAttribute(`${cardA} .photo-flip`, 'aria-expanded')) === 'false',
    'photo card starts unflipped',
  );

  await page.click(`${cardA} .photo-flip`);
  await page.waitForTimeout(500);

  assert(
    (await page.getAttribute(`${cardA} .photo-flip`, 'aria-expanded')) === 'true',
    'clicking a photo flips it',
  );
  assert(
    (await page.getAttribute('.cell-photo-b .photo-flip', 'aria-expanded')) === 'false',
    'flipping one photo leaves the other alone',
  );

  // Front face must be fully hidden once flipped, or its text paints
  // mirrored through the card (mix-blend-mode / backface bug).
  const frontHidden = await page.$eval(
    `${cardA} .photo-front`,
    (el) => getComputedStyle(el).visibility,
  );
  assert(frontHidden === 'hidden', `front face hidden when flipped (got ${frontHidden})`);

  // Verso content: provenance, this frame's palette, the paired frame.
  const versoProv = await page.textContent(`${cardA} .photo-prov`);
  assert(/RANDY REN/i.test(versoProv ?? ''), `verso carries provenance (got "${versoProv}")`);
  const versoKicker = await page.textContent(`${cardA} .photo-verso-top .kicker`);
  assert(
    /\/42 BY HUE/.test(versoKicker ?? ''),
    `verso reports the complete 42-photo pool (got "${versoKicker?.trim()}")`,
  );

  const paletteChips = await page.$$eval(`${cardA} .photo-rib-self span`, (els) => els.length);
  assert(paletteChips === 5, `verso shows a 5-tone palette (got ${paletteChips})`);

  const pairName = await page.textContent(`${cardA} .photo-pairname`);
  assert(
    /^PHOTO-\d{2}$/i.test((pairName ?? '').trim()),
    `verso names the paired frame (got "${pairName}")`,
  );
  assert(
    (await page.$(`${cardA} .photo-thumb`)) !== null,
    'verso shows the paired photograph as a thumbnail',
  );

  for (const file of ['photo-41.jpg', 'photo-42.jpg']) {
    const response = await page.request.get(new URL(`/photos/${file}`, BASE_URL).toString());
    assert(response.ok(), `${file} responds successfully (${response.status()})`);
    assert(
      response.headers()['content-type']?.includes('image/jpeg'),
      `${file} responds as image/jpeg (${response.headers()['content-type']})`,
    );
  }

  // Any point on the verso returns to the photograph, not just the corner
  // arrow. Click authored content well away from that button to prove it.
  await page.click(`${cardA} .photo-verso-tail`);
  await page.waitForTimeout(500);
  assert(
    (await page.getAttribute(`${cardA} .photo-flip`, 'aria-expanded')) === 'false',
    'clicking the verso flips the card back',
  );

  // Esc returns the card to the photograph.
  await page.click(`${cardA} .photo-flip`);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  assert(
    (await page.getAttribute(`${cardA} .photo-flip`, 'aria-expanded')) === 'false',
    'Esc flips the card back',
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

  // ---- 8a. every control shows a keyboard focus ring -------------------
  // Interactive elements used to fold :focus-visible into :hover and then
  // set `outline: none`, so tabbing through the page showed a mouse-hover
  // tint or, on .projects-row, nothing. Focus each control for real and
  // demand a ring of at least 2px.

  const ringless = [];
  const controls = await page.$$('a[href], button, [tabindex]:not([tabindex="-1"])');
  for (const control of controls) {
    if (!(await control.isVisible())) continue;
    // $$ pierces shadow DOM, which in `pnpm dev` drags in the Next.js
    // dev-tools button. Only audit controls in the real document.
    if (!(await control.evaluate((el) => el.getRootNode() === document))) continue;
    await control.focus();
    const ring = await control.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
        label:
          (el.textContent ?? '').trim().slice(0, 20) ||
          el.getAttribute('aria-label') ||
          `${el.tagName.toLowerCase()}.${el.className}`,
      };
    });
    if (ring.style === 'none' || !(ring.width >= 2)) {
      ringless.push(`${ring.label} (${ring.style} ${ring.width}px)`);
    }
  }
  assert(
    ringless.length === 0,
    `every control has a >=2px focus ring (${ringless.length} without one)`,
  );
  if (ringless.length) ringless.forEach((r) => console.error('    ', r));

  // ---- 8b. every visible text run clears WCAG AA -----------------------
  // --muted carries the section labels, captions, and metadata lines. It
  // was #8a8a8a (3.30:1) and failed AA on seven text roles at once. This
  // walks every text-bearing element, composites the foreground alpha
  // over its nearest opaque ancestor background, and demands 4.5:1
  // (3:1 for large text) so a palette tweak can never quietly regress it.

  const contrastFailures = await page.evaluate(() => {
    const channel = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const luminance = ([r, g, b]) =>
      0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const parse = (value) => {
      const n = (value.match(/[\d.]+/g) ?? []).map(Number);
      return { rgb: n.slice(0, 3), alpha: n.length > 3 ? n[3] : 1 };
    };
    const opaqueBackdrop = (node) => {
      for (let el = node; el; el = el.parentElement) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && !/,\s*0\)$/.test(bg)) return parse(bg).rgb;
      }
      return parse(getComputedStyle(document.documentElement).backgroundColor).rgb;
    };

    const failures = [];
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim())
        .join(' ')
        .trim();
      if (!own) continue;

      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (style.visibility === 'hidden' || style.opacity === '0') continue;

      const fg = parse(style.color);
      const bg = opaqueBackdrop(el);
      const composited = fg.rgb.map((v, i) => v * fg.alpha + bg[i] * (1 - fg.alpha));
      const a = luminance(composited);
      const b = luminance(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

      const px = Number.parseFloat(style.fontSize);
      const isLarge = px >= 24 || (px >= 18.66 && Number(style.fontWeight) >= 700);
      const required = isLarge ? 3 : 4.5;
      if (ratio + 0.005 < required) {
        failures.push(
          `${own.slice(0, 24)} [${el.className || el.tagName}] ${ratio.toFixed(2)}:1 < ${required}`,
        );
      }
    }
    return failures;
  });
  assert(
    contrastFailures.length === 0,
    `all visible text clears WCAG AA contrast (${contrastFailures.length} failing)`,
  );
  if (contrastFailures.length) contrastFailures.forEach((f) => console.error('    ', f));

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

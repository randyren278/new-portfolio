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

// The Puff entrance covers the bento (and makes it inert) until the visitor
// follows its invitation. Do what a visitor does, then wait for the handoff.
async function passIntro(page) {
  await page.frameLocator('iframe.puff-entrance').locator('a[href="#portfolio"]').first().click();
  await page.waitForSelector('iframe.puff-entrance', { state: 'detached' });
  await page.waitForSelector('.puff-bento:not(.awaiting-intro)');
}

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
  await passIntro(page);

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

  // ---- 2a. every action is the same pill ------------------------------
  // Photo details, Training status and the two résumé links drifted into
  // three looks and three hover behaviours (one with a cream glow: a shadow
  // built from --ink-rgb on the dark palette). One .glass-pill now; assert
  // they render identically, cast no light glow, and hover identically.

  const pillLook = () =>
    page.$$eval('.bento-grid .glass-pill', (els) =>
      els.filter((el) => el.getClientRects().length > 0).map((el) => {
        const c = getComputedStyle(el);
        return {
          label: el.textContent.replace(/\s+/g, ' ').trim(),
          look: [
            c.backgroundColor,
            c.borderTopColor,
            c.borderRadius,
            c.fontSize,
            c.fontFamily,
            c.textTransform,
            Math.round(el.getBoundingClientRect().height),
          ].join(' | '),
          shadow: c.boxShadow,
        };
      }),
    );
  await page.mouse.move(2, 2); // the intro's click leaves the pointer over a photo
  await page.waitForTimeout(250);
  const pills = await pillLook();
  assert(
    pills.length >= 4,
    `the page's actions are glass pills (${pills.map((p) => p.label).join(', ')})`,
  );
  assert(
    new Set(pills.map((p) => p.look)).size === 1,
    `every pill renders identically (${[...new Set(pills.map((p) => p.look))].join(' // ')})`,
  );
  const ink = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue('--ink-rgb')
      .trim()
      .split(/\s+/)
      .join(', '),
  );
  // A light glow = an outer (non-inset) shadow layer in the ink colour.
  const glows = (shadow) =>
    shadow
      .split(/,(?![^(]*\))/)
      .some((layer) => !layer.includes('inset') && layer.includes(`rgba(${ink}`));
  assert(
    pills.every((p) => !glows(p.shadow)),
    `no pill casts a light glow (${[...new Set(pills.map((p) => p.shadow))].join(' // ')})`,
  );
  const creamShadows = await page.evaluate((inkRgb) => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const sh = getComputedStyle(el).boxShadow;
      if (sh === 'none') continue;
      const layers = sh.split(/,(?![^(]*\))/);
      if (layers.some((l) => !l.includes('inset') && l.includes(`rgba(${inkRgb}`)))
        out.push(el.className || el.tagName);
    }
    return out;
  }, ink);
  assert(
    creamShadows.length === 0,
    `nothing on the page casts a cream shadow (${creamShadows.join(', ') || 'none'})`,
  );
  const hovered = [];
  for (const trigger of [
    '.cell-photo-a .photo-flip',
    '.strava-open',
    '.resume-view',
    '.resume-download',
    '.contact-play',
  ]) {
    await page.hover(trigger);
    await page.waitForTimeout(250);
    hovered.push(
      await page.$eval(`${trigger}.glass-pill, ${trigger} .glass-pill`, (el) => {
        const c = getComputedStyle(el);
        return `${c.backgroundColor} | ${c.borderTopColor}`;
      }),
    );
  }
  await page.mouse.move(2, 2);
  assert(
    new Set(hovered).size === 1,
    `every pill hovers the same way (${[...new Set(hovered)].join(' // ')})`,
  );
  assert(
    hovered[0] !== pills[0].look.split(' | ').slice(0, 2).join(' | '),
    'hovering a pill visibly changes it',
  );

  // ---- 2b. résumé card exposes the real one-page document ------------

  const resumeViewHref = await page.getAttribute('.resume-view', 'href');
  const resumeViewTarget = await page.getAttribute('.resume-view', 'target');
  const resumeDownloadHref = await page.getAttribute('.resume-download', 'href');
  const resumeDownloadName = await page.getAttribute('.resume-download', 'download');
  const resumeViewName = await page.getAttribute('.resume-view', 'aria-label');
  const resumeDownloadAccessibleName = await page.getAttribute('.resume-download', 'aria-label');
  assert(
    new URL(resumeViewHref, BASE_URL).pathname === '/resume/Randy_Ren_Resume.pdf',
    `résumé view link targets the public PDF (got "${resumeViewHref}")`,
  );
  assert(
    resumeViewTarget === '_blank',
    `résumé view link opens a new tab (got "${resumeViewTarget}")`,
  );
  assert(
    new URL(resumeDownloadHref, BASE_URL).pathname === '/api/resume/download',
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

  // The card must not restate the wordmark the Name cell already carries.
  // The "1 / 1" badge on the thumbnail is deliberate (it reads as a page
  // counter on the document, not as a repeat of the spec line).
  const resumeCardText = await page.$eval('.cell-resume', (el) => el.textContent ?? '');
  assert(
    !/Randy\s+Ren/i.test(resumeCardText),
    'résumé card does not repeat the name already carried by the Name cell',
  );
  const resumeBadge = await page.$eval('.resume-preview span', (el) => el.textContent?.trim());
  assert(resumeBadge === '1 / 1', `résumé preview carries the page badge (got "${resumeBadge}")`);
  assert(
    !/1\s*PAGE/i.test(resumeCardText),
    'résumé card has no "1 PAGE" line now that the thumbnail badge carries the count',
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
    'UMBRA',
    'STRAITS',
    'HERA',
    'HEPHAESTUS',
    'LIMINAL',
    'IDIOLECT',
    'SILL',
    'IRIS',
    'BODE',
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

    await page.focus('.projects-plate-close');
    await page.keyboard.press('Shift+Tab');
    assert(
      await page.evaluate(() => !!document.activeElement.closest('.projects-plate')),
      'project dialog contains reverse keyboard navigation',
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert(
      await page.$eval('.projects-plate', (el) => getComputedStyle(el).transitionDuration === '0s'),
      'project dialog honors reduced motion',
    );
    await page.emulateMedia({ reducedMotion: 'no-preference' });

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

  // ---- 7c. Correspondence has a plain way into the game --------------
  // The only way in used to be tapping Puff twice within 5 s, behind a
  // first tap that just says "Hello!". The pill opens the same invitation.

  const play = page.locator('.cell-contact .contact-play');
  const playLabel = (await play.textContent())?.replace(/\s+/g, ' ').trim();
  assert(playLabel === 'Play a game ↗', `Correspondence shows the game pill (got "${playLabel}")`);
  await play.click();
  const invited = await page
    .waitForFunction(
      () => window.puffUp?.state === 'invite' && document.getElementById('invite')?.open,
      null,
      { timeout: 15000 },
    )
    .then(() => true)
    .catch(() => false);
  assert(invited, 'one tap on the pill opens the "Want to play?" invitation');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !window.puffUp, null, { timeout: 15000 }).catch(() => {});
  assert(
    await page.evaluate(
      () =>
        !document.querySelector('.puff-game') &&
        document.activeElement?.classList.contains('contact-play') &&
        document.body.style.overflow !== 'hidden',
    ),
    'declining closes the invitation and hands focus back to the pill',
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

    // The DOM follows the randomized visual order. Index remains first,
    // Projects stays near the top, and both photos share one section.
    const stack = await page.$$eval('.bento-grid > *', (els) =>
      els
        .map((el) => ({
          cls: el.classList.contains('photo-gallery') ? 'photos' : [...el.classList]
            .filter((c) => c.startsWith('cell-') && c !== 'cell')
            .sort((a, b) => b.length - a.length)[0],
          y: el.getBoundingClientRect().top,
        }))
        .sort((a, b) => a.y - b.y)
        .map((e) => e.cls),
    );
    assert(stack[0] === 'cell-name', `Name card stacks first on mobile (got "${stack[0]}")`);
    assert(
      stack.indexOf('cell-projects') > 0 && stack.indexOf('cell-projects') <= 3,
      `Projects stays near the top on mobile (${stack.join(',')})`,
    );
    assert(
      stack.filter((section) => section === 'photos').length === 1,
      `one photo section appears in the mobile stack (${stack.join(',')})`,
    );
    const photos = await page.$$eval('.photo-gallery > .cell-photo', (els) => els.length);
    assert(
      photos === 2,
      `both photo cells stay together on mobile (got ${photos})`,
    );
  }

  // ---- 6c. the dark palette is declared to the UA -----------------------
  // The bento has been dark-only since the Puff entrance (4123f4c). Without
  // `color-scheme: dark` an OS-light visitor gets light scrollbars and UA
  // surfaces against the dark page. Assert it under an emulated light
  // preference, which is the only condition where its absence shows.

  await page.emulateMedia({ colorScheme: 'light' });
  const declaredScheme = await page.evaluate(
    () => getComputedStyle(document.documentElement).colorScheme,
  );
  assert(
    declaredScheme === 'dark',
    `page declares its dark scheme to the UA (got "${declaredScheme}")`,
  );
  const bodyInLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert(
    /24, 24, 24/.test(bodyInLight),
    `page keeps its dark background under OS light mode (got "${bodyInLight}")`,
  );
  await page.emulateMedia({ colorScheme: null });

  // ---- 7a. touch targets are big enough to hit -------------------------
  // Mobile only: the contact links were 19px tall and the verso return
  // 30x26, both under the 44px minimum.
  //
  // This measures via hit-testing rather than trusting
  // getBoundingClientRect for size, because a control's real tappable
  // footprint can be larger than its own layout box — .photo-return's fix
  // is exactly that: an invisible ::after pseudo-element carries the
  // 44x44 target while the button itself stays 30x26. A pure rect-size
  // check would fail that control despite it being genuinely tappable.
  //
  // The probe distance (21.5px, not 22) is deliberately short of the
  // mathematical 44px half-extent: a probe run exactly on that edge is at
  // the mercy of sub-pixel border rendering and can fail a control that
  // measures a real, reported 44.0px height — measured empirically at
  // 20/20 clean passes for a genuine 44px button, where 21.75 (a smaller
  // margin) still flaked 7/20. A control at exactly 43px is an edge case
  // this cannot reliably resolve either way at this precision, but no
  // real defect on this page has ever been that close — 19px, 26px, and
  // 30px controls all fail this trivially. Edge midpoints, not corners:
  // every button on this page has border-radius, and a rounded corner
  // does not paint at its own mathematical corner point by design.
  //
  // The same probe catches occlusion too — a neighbour overlapping a
  // control's live area answers the hit-test instead of the control. This
  // is what caught the contact links: padding-block on an inline <a>
  // doesn't reserve line-box space, so adjacent links' padding physically
  // overlapped and a probe here landed on the wrong <a>.
  //
  // Card A is flipped first so the verso return is genuinely exposed;
  // controls that are occluded right now cannot be tapped either way and
  // are skipped rather than reported.

  if (IS_MOBILE) {
    await page.click(`${cardA} .photo-flip`);
    // .photo-inner's flip transition runs 620ms (bento.css ~656); waiting
    // less than that lands mid-turn, where the verso return is briefly
    // un-hit-testable and silently skipped rather than measured.
    await page.waitForTimeout(700);

    const smallTargets = [];
    let skipped = 0;
    const touchControls = await page.$$('a[href], button');
    for (const control of touchControls) {
      if (!(await control.isVisible())) continue;
      if (!(await control.evaluate((el) => el.getRootNode() === document))) continue;
      // The skip link is intentionally exposed only to keyboard focus.
      if (await control.evaluate((el) => el.classList.contains('skip-link'))) {
        // Establish keyboard modality: programmatic focus after a pointer click
        // does not consistently activate :focus-visible on mobile Chromium.
        await page.keyboard.press('Tab');
        await control.focus();
      }
      // Centre it: scrollIntoViewIfNeeded leaves a mostly visible control
      // where it is, and a probe point past the viewport edge hits nothing.
      await control.evaluate((el) => el.scrollIntoView({ block: 'center' }));
      const verdict = await control.evaluate((el) => {
        const HALF = 21.5;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const owns = (x, y) => {
          const hit = document.elementFromPoint(x, y);
          return hit === el || el.contains(hit);
        };
        if (!owns(cx, cy)) return { skip: true };
        const covered = [
          [cx, cy - HALF],
          [cx, cy + HALF],
          [cx - HALF, cy],
          [cx + HALF, cy],
        ].every(([x, y]) => owns(x, y));
        return {
          skip: false,
          covered,
          label: `${el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 18)} (${Math.round(r.width)}x${Math.round(r.height)})`,
        };
      });
      if (verdict.skip) {
        skipped++;
        continue;
      }
      if (!verdict.covered) smallTargets.push(verdict.label);
    }
    assert(
      smallTargets.length === 0,
      `tappable controls own a 44x44 touch target (${smallTargets.length} too small, ${skipped} skipped)`,
    );
    if (smallTargets.length) smallTargets.forEach((t) => console.error('    ', t));
    // A control can only be legitimately unmeasurable here (mid-transition,
    // behind an overlay) because .photo-flip already got 700ms to settle
    // and nothing else on the page animates on load. Any skip is a probe
    // that silently reported nothing rather than a real exemption.
    assert(skipped === 0, `no control was skipped by the touch-target probe (${skipped} skipped)`);

    await page.keyboard.press('Escape');
    // Same 620ms flip transition as the wait above (bento.css ~656).
    // 500ms here left the card mid-turn when 8a started tabbing through
    // controls right after, producing an intermittent, spurious "ring
    // clipped by .cell-photo-a" from a 3D-transformed box mid-animation.
    await page.waitForTimeout(700);
  }

  // ---- 7b. the page has a heading outline ------------------------------
  // Every cell was headingless: the wordmark was a div and the section
  // kickers were divs, so the page offered no outline to a screen reader
  // and no H1 to a crawler. Exactly one H1, and no level is skipped.

  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', (els) =>
    els.map((el) => ({ level: Number(el.tagName[1]), text: el.textContent?.trim() ?? '' })),
  );
  const h1s = headings.filter((h) => h.level === 1);
  assert(h1s.length === 1, `exactly one H1 (got ${h1s.length})`);
  assert(h1s[0]?.text === 'RANDY REN', `the H1 is the wordmark (got "${h1s[0]?.text}")`);
  // The skip check below only catches an INCREASE of more than one level;
  // an H1 arriving anywhere but first (e.g. after all four H2s) passed it
  // silently. DOM order is reading order for a screen reader's outline,
  // so the page's one H1 has to lead.
  assert(
    headings[0]?.level === 1,
    `the H1 leads the document order (first heading is H${headings[0]?.level})`,
  );
  assert(
    headings.filter((h) => h.level === 2).length === 5,
    `the labelled sections carry H2s (got ${headings.filter((h) => h.level === 2).length})`,
  );
  const skipped = headings
    .slice(1)
    .map((h, i) => (h.level > headings[i].level + 1 ? `${headings[i].level}->${h.level}` : null))
    .filter(Boolean);
  assert(skipped.length === 0, `no heading level is skipped (${skipped.join(', ') || 'none'})`);

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
      const label =
        (el.textContent ?? '').trim().slice(0, 20) ||
        el.getAttribute('aria-label') ||
        `${el.tagName.toLowerCase()}.${el.className}`;

      const width = Number.parseFloat(style.outlineWidth);
      // outlineStyle/outlineWidth alone pass a ring nobody can see:
      // outline-color: transparent reports solid 2px right up until you
      // look at the pixel. Parse the alpha channel of the resolved color.
      const colorMatch = style.outlineColor.match(/[\d.]+/g) ?? [];
      const alpha = colorMatch.length > 3 ? Number(colorMatch[3]) : 1;

      // A ring with a positive offset is drawn OUTSIDE the element's own
      // box, so an ancestor's `overflow` can crop it even though the
      // element itself renders fine. Walk up from the element and check
      // the ring's bounding box against every ancestor whose overflow is
      // not `visible`.
      const offset = Number.parseFloat(style.outlineOffset) || 0;
      const rect = el.getBoundingClientRect();
      const pad = width + Math.max(offset, 0);
      const shrink = offset < 0 ? Math.abs(offset) : 0;
      const ringBox = {
        left: rect.left - pad + shrink,
        top: rect.top - pad + shrink,
        right: rect.right + pad - shrink,
        bottom: rect.bottom + pad - shrink,
      };
      let clippedBy = null;
      // Stop before <body>/<html>: on mobile body is the page's own
      // scroll container (overflow: auto), which is not a clipping
      // hazard — the browser scrolls a focused control into view inside
      // it. What matters is a NESTED overflow region that stays clipped
      // regardless of where the page is scrolled.
      for (
        let node = el.parentElement;
        node && node !== document.body && node !== document.documentElement;
        node = node.parentElement
      ) {
        const nodeStyle = getComputedStyle(node);
        if (
          nodeStyle.overflow === 'visible' &&
          nodeStyle.overflowX === 'visible' &&
          nodeStyle.overflowY === 'visible'
        ) {
          continue;
        }
        const clip = node.getBoundingClientRect();
        const fits =
          ringBox.left >= clip.left - 0.5 &&
          ringBox.top >= clip.top - 0.5 &&
          ringBox.right <= clip.right + 0.5 &&
          ringBox.bottom <= clip.bottom + 0.5;
        if (!fits) {
          clippedBy = node.className || node.tagName;
          break;
        }
      }

      return { style: style.outlineStyle, width, alpha, label, clippedBy };
    });
    if (ring.style === 'none' || !(ring.width >= 2)) {
      ringless.push(`${ring.label} (${ring.style} ${ring.width}px)`);
    } else if (ring.alpha === 0) {
      ringless.push(`${ring.label} (outline-color alpha 0 — invisible)`);
    } else if (ring.clippedBy) {
      ringless.push(`${ring.label} (clipped by .${ring.clippedBy})`);
    }
  }
  assert(
    ringless.length === 0,
    `every control has a real, unclipped, >=2px focus ring (${ringless.length} without one)`,
  );
  if (ringless.length) ringless.forEach((r) => console.error('    ', r));

  // ---- 8b. every visible text run clears WCAG AA -----------------------
  // --muted carries the section labels, captions, and metadata lines. It
  // was #8a8a8a (3.30:1) and failed AA on seven text roles at once. This
  // walks every text-bearing element, composites the foreground alpha
  // over its nearest opaque ancestor background, and demands 4.5:1
  // (3:1 for large text) so a palette tweak can never quietly regress it.
  //
  // It only ever ran with the plate unmounted, so .projects-plate-meta,
  // .projects-plate-close, and .projects-plate-link — all --muted text —
  // were never in the queried set. runContrastSweep() is called a second
  // time below with a plate open so that surface is covered too.

  const runContrastSweep = () =>
    page.evaluate(() => {
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
      // Composite every translucent layer between the text and the first
      // opaque one. Treating a layer as opaque the moment it is not fully
      // transparent reads a 3% hover tint as solid --ink and reports a
      // false 1.00:1 on whichever row the pointer happens to rest over.
      const opaqueBackdrop = (node) => {
        const layers = [];
        for (let el = node; el; el = el.parentElement) {
          const { rgb, alpha } = parse(getComputedStyle(el).backgroundColor);
          if (alpha === 0) continue;
          layers.push({ rgb, alpha });
          if (alpha === 1) break;
        }
        let base =
          layers.length && layers[layers.length - 1].alpha === 1
            ? layers.pop().rgb
            : parse(getComputedStyle(document.documentElement).backgroundColor).rgb;
        for (let i = layers.length - 1; i >= 0; i--) {
          base = layers[i].rgb.map((v, k) => v * layers[i].alpha + base[k] * (1 - layers[i].alpha));
        }
        return base;
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
        // .photo-fname is white type laid over a photograph, and its
        // legibility comes from a text-shadow, not from a colour pair. A
        // ratio against the cell's background measures nothing real here,
        // so it is exempt — and therefore NOT covered by this sweep.
        if (el.classList.contains('photo-fname')) continue;
        // WCAG 1.4.3 exempts disabled controls by spec (incidental text).
        // The plate's PREV/NEXT dim to --muted at opacity .3 when disabled,
        // which is a legitimate design signal ("nothing further this way"),
        // not a contrast bug — so it is exempt for the same reason the spec
        // is, not because this sweep cannot see it.
        if (el.closest('button')?.disabled) continue;

        // `opacity` dims the painted result independently of the colour's own
        // alpha, and it inherits down the ancestor chain. Reading style.color
        // alone rated .strava-sub (--muted at opacity .65) as 4.81:1 when it
        // actually paints rgb(160,160,159) for 2.52:1.
        let cumulativeOpacity = 1;
        for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
          cumulativeOpacity *= Number(getComputedStyle(node).opacity);
        }
        const fg = parse(style.color);
        const bg = opaqueBackdrop(el);
        const effectiveAlpha = fg.alpha * cumulativeOpacity;
        const composited = fg.rgb.map((v, i) => v * effectiveAlpha + bg[i] * (1 - effectiveAlpha));
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
  const contrastFailures = await runContrastSweep();
  assert(
    contrastFailures.length === 0,
    `all visible text clears WCAG AA contrast (${contrastFailures.length} failing)`,
  );
  if (contrastFailures.length) contrastFailures.forEach((f) => console.error('    ', f));

  await page.click('.projects-row:first-child');
  await page.waitForSelector('.projects-plate', { state: 'visible' });
  // .projects-plate-body fades in with a 130ms delay plus a 200ms
  // transition (330ms total) on top of the plate's own 320ms grow. `state:
  // 'visible'` only checks display/visibility, not that either animation
  // has settled, so a sweep run too early samples a partial-opacity frame
  // and reads real text as near-invisible against its own backdrop.
  await page.waitForTimeout(500);
  const plateContrastFailures = await runContrastSweep();
  assert(
    plateContrastFailures.length === 0,
    `the expanded plate's text also clears WCAG AA (${plateContrastFailures.length} failing)`,
  );
  if (plateContrastFailures.length) plateContrastFailures.forEach((f) => console.error('    ', f));
  await page.click('.projects-plate-close');
  await page.waitForSelector('.projects-plate', { state: 'detached' });

  // ---- 8c. the layout holds across viewports ---------------------------
  // The single desktop/mobile pair above misses the widths where the grid
  // actually broke: 3-col at 1025-1100 (cells ~306px, blurbs clipped),
  // 2-col at 721-800 (same), 2-col Projects spanning four rows (1300px of
  // dead space), an uncapped page at 2560, and the résumé spec line
  // floating away from its summary at every size. Open each size fresh
  // and measure the things that went wrong. Desktop run only — the sizes
  // are the point, not the device profile.

  if (!IS_MOBILE) {
    const sizes = [
      [2560, 1440],
      [1920, 1080],
      [1440, 900],
      [1280, 720],
      [1101, 768],
      [1100, 768],
      [1024, 768],
      [768, 1024],
      [721, 900],
      [720, 900],
      [390, 844],
      [320, 568],
    ];
    const layoutFailures = [];
    for (const [w, h] of sizes) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const vp = await ctx.newPage();
      await vp.goto(BASE_URL, { waitUntil: 'networkidle' });
      await passIntro(vp);
      const m = await vp.evaluate(() => {
        const rect = (sel) => document.querySelector(sel)?.getBoundingClientRect();
        const overrun = (sel) => {
          let worst = 0;
          for (const el of document.querySelectorAll(sel)) {
            const range = document.createRange();
            range.selectNodeContents(el);
            const right = Math.max(0, ...[...range.getClientRects()].map((r) => r.right));
            worst = Math.max(worst, right - el.getBoundingClientRect().right);
          }
          return Math.round(worst);
        };
        const list = document.querySelector('.projects-list');
        const preview = rect('.resume-preview');
        const img = rect('.resume-preview img');
        return {
          cols: getComputedStyle(document.querySelector('.bento-grid')).gridTemplateColumns.split(
            ' ',
          ).length,
          hscroll: document.documentElement.scrollWidth - innerWidth,
          pageW: Math.round(rect('.bento-page').width),
          listOverflow: list.scrollWidth - list.clientWidth,
          blurbOverrun: overrun('.projects-blb'),
          summaryOverrun: overrun('.resume-summary'),
          previewSlack: Math.round(preview.height - img.height),
          // the thumbnail should absorb the cell's height, not leave it empty
          layoutH: Math.round(rect('.resume-layout').height),
          previewH: Math.round(preview.height),
          projectsBottom: Math.round(rect('.cell-projects').bottom),
          stravaBottom: Math.round(rect('.cell-strava').bottom),
        };
      });
      await ctx.close();

      const expectCols = w <= 720 ? 1 : w <= 1100 ? 2 : 3;
      const bad = [];
      if (m.cols !== expectCols) bad.push(`${m.cols} columns, expected ${expectCols}`);
      if (m.hscroll > 0) bad.push(`horizontal scroll ${m.hscroll}px`);
      if (m.pageW > 1680) bad.push(`page ${m.pageW}px wide, cap is 1680`);
      if (m.listOverflow > 0) bad.push(`projects list clips ${m.listOverflow}px`);
      if (m.blurbOverrun > 1) bad.push(`project blurb overruns ${m.blurbOverrun}px`);
      if (m.summaryOverrun > 1) bad.push(`résumé summary overruns ${m.summaryOverrun}px`);
      if (Math.abs(m.previewSlack) > 3)
        bad.push(`résumé page ${m.previewSlack}px short of its frame`);
      // Multi-column only: in one column the cell is content-sized and the
      // page is deliberately width-driven, so there is no row to fill.
      if (expectCols > 1 && m.layoutH - m.previewH > 3) {
        bad.push(`résumé page ${m.previewH}px in a ${m.layoutH}px row`);
      }
      if (expectCols === 2 && Math.abs(m.projectsBottom - m.stravaBottom) > 1) {
        bad.push(`2-col Projects ends at ${m.projectsBottom}, Strava at ${m.stravaBottom}`);
      }
      if (bad.length) layoutFailures.push(`${w}x${h}: ${bad.join('; ')}`);
    }
    assert(
      layoutFailures.length === 0,
      `layout holds at all ${sizes.length} viewports (${layoutFailures.length} failing)`,
    );
    if (layoutFailures.length) layoutFailures.forEach((f) => console.error('    ', f));
  }

  // ---- 8d. one inset, one rail, at every size ---------------------------
  // Edge-anchored things took their inset from four places (cell padding, a
  // fixed 22px on the photo pill and label, a clamp() on the Strava pill, a
  // fixed 18/22 on Puff) and drifted 2-8px apart at every size, so Photo
  // details floated above the résumé buttons on the shared bottom line. Now
  // everything reads --inset-y/--inset-x; assert each sits exactly on its
  // cell's padding line, the bottom row shares one rail, and the bars'
  // left and right labels share a baseline.

  if (!IS_MOBILE) {
    const cohesionSizes = [
      [1920, 1080],
      [1512, 982],
      [1440, 900],
      [1280, 800],
      [1280, 720],
      [1200, 800],
      [1024, 768],
      [390, 844],
    ];
    const drift = [];
    for (const [w, h] of cohesionSizes) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const vp = await ctx.newPage();
      await vp.goto(BASE_URL, { waitUntil: 'networkidle' });
      await passIntro(vp);
      await vp.mouse.move(1, 1);
      const m = await vp.evaluate(() => {
        const ref = getComputedStyle(document.querySelector('.cell-name'));
        const py = Number.parseFloat(ref.paddingTop);
        const px = Number.parseFloat(ref.paddingLeft);
        const B = 1; // cell border
        const at = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const c = el.closest('.cell').getBoundingClientRect();
          return {
            top: r.top - c.top - B,
            left: r.left - c.left - B,
            right: c.right - r.right - B,
            bottom: c.bottom - r.bottom - B,
            el: r,
          };
        };
        const off = [];
        const near = (a, b) => Math.abs(a - b) <= 1;
        for (const sel of [
          '.cell-photo-a .glass-pill',
          '.cell-photo-b .glass-pill',
          '.strava-pill',
          '.resume-download',
          '.contact-play',
        ]) {
          const a = at(sel);
          if (a && !(near(a.bottom, py) && near(a.right, px)))
            off.push(
              `${sel} bottom ${a.bottom.toFixed(1)} right ${a.right.toFixed(1)} (inset ${py}/${px})`,
            );
        }
        for (const sel of ['.cell-photo-a .photo-fname', '.cell-photo-b .photo-fname']) {
          const a = at(sel);
          if (a && !(near(a.top, py) && near(a.left, px)))
            off.push(`${sel} top ${a.top.toFixed(1)} left ${a.left.toFixed(1)}`);
        }
        const puff = at('.correspondence-puff');
        if (puff && !(near(puff.top, py) && near(puff.right, px)))
          off.push(`puff top ${puff.top.toFixed(1)} right ${puff.right.toFixed(1)}`);
        for (const c of document.querySelectorAll('.bento-grid > .cell:not(.cell-photo)')) {
          const s = getComputedStyle(c);
          if (Number.parseFloat(s.paddingTop) !== py || Number.parseFloat(s.paddingLeft) !== px)
            off.push(`${c.className} padding ${s.padding}`);
        }
        // The Projects meta line never overlaps the list (it hides when tight).
        const meta = document.querySelector('.projects-meta');
        const rows = document.querySelectorAll('.projects-row');
        if (meta && getComputedStyle(meta).visibility !== 'hidden') {
          const gap =
            meta.getBoundingClientRect().top - rows[rows.length - 1].getBoundingClientRect().bottom;
          if (gap < 0) off.push(`projects meta overlaps the last row by ${(-gap).toFixed(1)}px`);
        }
        // Bottom row shares a rail when Photo B and Résumé end on one grid line.
        const pb = at('.cell-photo-b .glass-pill');
        const rs = at('.resume-download');
        const sameLine =
          Math.abs(
            document.querySelector('.cell-photo-b').getBoundingClientRect().bottom -
              document.querySelector('.cell-resume').getBoundingClientRect().bottom,
          ) < 1;
        if (pb && rs && sameLine && !near(pb.el.bottom, rs.el.bottom))
          off.push(
            `bottom rail: photo ${pb.el.bottom.toFixed(1)} vs résumé ${rs.el.bottom.toFixed(1)}`,
          );
        // The text's own baseline, not the icon glyph's taller inline-block box.
        const baseline = (el) => {
          const t = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
          const r = document.createRange();
          r.selectNodeContents(t ?? el);
          return r.getBoundingClientRect().bottom;
        };
        for (const bar of document.querySelectorAll('.bento-topbar')) {
          const left = bar.firstElementChild;
          const right = [...bar.querySelectorAll('button, a')].find((el) =>
            el !== left && el.getClientRects().length > 0);
          if (left && right && Math.abs(baseline(left) - baseline(right)) > 1)
            off.push(
              `${bar.tagName.toLowerCase()} baselines ${baseline(left).toFixed(1)} vs ${baseline(right).toFixed(1)}`,
            );
        }
        return off;
      });
      if (m.length) drift.push(`${w}x${h}: ${m.join('; ')}`);
      await ctx.close();
    }
    assert(
      drift.length === 0,
      `one inset and one rail at all ${cohesionSizes.length} sizes (${drift.length} drifting)`,
    );
    for (const d of drift) console.error('    ', d);
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

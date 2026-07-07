// Mobile-emulation smoke for the studio shell on iPhone-13 viewport.
// Asserts the mobile-only behaviors that this project ships:
//
//   1) Page loads without console errors
//   2) The (pointer: coarse) block applies:
//      - #term padding-left ≤ 24px (was 48px on desktop)
//      - #chips is a CSS grid, 2 columns, no visible separator dots
//      - .chip-sep elements are display:none
//   3) Typing is DISABLED on mobile:
//      - #keysink stays parked off-screen (left ≤ -1000px)
//      - Tapping #term does NOT focus #keysink; activeElement stays BODY
//   4) The tappable palette route still works:
//      - #chrome-cmdk is a real BUTTON with pointer-events:auto
//      - Tap opens the palette
//      - Tap outside dismisses it (pointerdown path)
//   5) The full plate modal is BLOCKED on mobile:
//      - After navigating to ~/work/oryzo, .plate-overlay.open never appears
//   6) The "Show the note" / "Open the project" chip is REMOVED on mobile
//      (there is no full-plate view — the chip would just re-render the
//      label the visitor is already looking at)
//   7) The inline studio-note card's .label-hint ("Type `open oryzo` to
//      see the full page.") is not rendered on touch — same reason
//   8) After `cat about` completes, the card's hint is inside the terminal
//      viewport bounds (scroll-follow keeps the reveal in frame)
//   9) viewport meta includes viewport-fit=cover
//
// Runs against localhost:3877 (dev server started outside this test).

const { chromium, devices } = require('playwright');

const URL = 'http://localhost:3877/';
const DEVICE = devices['iPhone 13'];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...DEVICE, hasTouch: true });
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

  // 1) Mobile side padding
  const termPadLeft = await page.evaluate(() => {
    const t = document.getElementById('term');
    return t ? parseFloat(getComputedStyle(t).paddingLeft) : null;
  });
  results.push([
    `mobile: #term padding-left ≤ 24px [n=${termPadLeft}]`,
    termPadLeft !== null && termPadLeft <= 24,
  ]);

  // 2) Chips as a 2-column grid, separators hidden
  const chipsLayout = await page.evaluate(() => {
    const c = document.getElementById('chips');
    if (!c) return null;
    const cs = getComputedStyle(c);
    const seps = [...c.querySelectorAll('.chip-sep')].map(
      (s) => getComputedStyle(s).display,
    );
    return {
      display: cs.display,
      cols: cs.gridTemplateColumns,
      sepsHidden: seps.every((d) => d === 'none'),
      sepCount: seps.length,
    };
  });
  results.push([
    `mobile: #chips display=grid [n=${chipsLayout?.display}]`,
    chipsLayout?.display === 'grid',
  ]);
  results.push([
    `mobile: #chips has 2 columns [cols=${chipsLayout?.cols}]`,
    chipsLayout && chipsLayout.cols.split(' ').length === 2,
  ]);
  results.push([
    `mobile: .chip-sep display:none [n=${chipsLayout?.sepCount} seps]`,
    chipsLayout?.sepsHidden,
  ]);

  // 3) Typing disabled: keysink stays off-screen
  const keysinkLeft = await page.evaluate(() => {
    const k = document.getElementById('keysink');
    return k ? parseFloat(getComputedStyle(k).left) : null;
  });
  results.push([
    `mobile: #keysink parked off-screen [left=${keysinkLeft}]`,
    keysinkLeft !== null && keysinkLeft <= -1000,
  ]);

  // 3b) Tap the terminal. On mobile the engine no-ops focusInput() on
  // TOUCH so activeElement should NOT become the keysink INPUT — that
  // was the last-mile bug where iOS still summoned the soft keyboard
  // because .focus() inside a synthesized touch→mouseup gesture bypasses
  // the off-screen-input protection.
  await page.tap('#term', { position: { x: 150, y: 400 } });
  await page.waitForTimeout(300);
  const activeAfterTermTap = await page.evaluate(
    () => document.activeElement?.tagName || 'NONE',
  );
  results.push([
    `mobile: tap #term does NOT focus INPUT [active=${activeAfterTermTap}]`,
    activeAfterTermTap !== 'INPUT',
  ]);

  // Also tap the prompt line itself — this is the specific element the
  // user was tapping when the keyboard kept popping up. Its pointer-events
  // are now 'none' on mobile, so the tap should pass through to #term
  // (which no-ops per the assertion above).
  const promptBox = await page.evaluate(() => {
    const el = document.getElementById('active-line');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + 30, y: r.top + r.height / 2 };
  });
  if (promptBox) {
    await page.mouse.click(promptBox.x, promptBox.y);
    await page.waitForTimeout(300);
    const activeAfterPromptTap = await page.evaluate(
      () => document.activeElement?.tagName || 'NONE',
    );
    results.push([
      `mobile: tap active prompt line does NOT focus INPUT [active=${activeAfterPromptTap}]`,
      activeAfterPromptTap !== 'INPUT',
    ]);
  }

  // The keysink itself must be readonly + inputMode=none — belt-and-
  // suspenders in case something focuses it anyway.
  const keysinkAttrs = await page.evaluate(() => {
    const k = document.getElementById('keysink');
    return k ? { readOnly: k.readOnly, inputMode: k.inputMode } : null;
  });
  results.push([
    `mobile: #keysink is readonly + inputMode=none [ro=${keysinkAttrs?.readOnly} im=${keysinkAttrs?.inputMode}]`,
    keysinkAttrs?.readOnly === true && keysinkAttrs?.inputMode === 'none',
  ]);

  // 4) chrome-cmdk button + tap-to-open-palette
  const cmdKTag = await page.evaluate(() => {
    const el = document.getElementById('chrome-cmdk');
    return el ? { tag: el.tagName, pe: getComputedStyle(el).pointerEvents } : null;
  });
  results.push([
    `mobile: #chrome-cmdk BUTTON with pointer-events:auto [tag=${cmdKTag?.tag} pe=${cmdKTag?.pe}]`,
    cmdKTag?.tag === 'BUTTON' && cmdKTag?.pe === 'auto',
  ]);

  await page.tap('#chrome-cmdk');
  await page.waitForTimeout(400);
  const paletteOpen = await page.evaluate(
    () => document.getElementById('palette')?.classList.contains('open'),
  );
  results.push(['mobile: tap #chrome-cmdk opens palette', !!paletteOpen]);

  if (paletteOpen) {
    // #pal-input font-size must be ≥16px on touch — iOS Safari auto-
    // zooms into any smaller input on focus and never zooms back on
    // blur, leaving the whole viewport stuck at ~1.5× until the visitor
    // pinches out manually. Locked as a regression check.
    const palInputSize = await page.evaluate(() => {
      const el = document.getElementById('pal-input');
      return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
    });
    results.push([
      `mobile: #pal-input font-size ≥ 16px [n=${palInputSize}]`,
      palInputSize >= 16,
    ]);

    await page.tap('#palette', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(600);
    const closed = await page.evaluate(
      () => !document.getElementById('palette')?.classList.contains('open'),
    );
    results.push(['mobile: tap outside palette dismisses (pointerdown)', closed]);
  } else {
    results.push(['mobile: tap outside palette dismisses (pointerdown) [skipped]', false]);
  }

  // ---- Help menu as tappable grid rows ----
  // The old cmd_help() printed rows as "<span class=nowrap>cmd</span>desc"
  // which wrapped desc back to column 0 on narrow viewports, tangling
  // into the next row. The new implementation renders each row as a
  // <button class="help-row"> with a two-column grid and a click handler
  // that invokes the command — the only way to reach bare-verb commands
  // (pwd, history, theme) on mobile since typing is disabled.
  //
  // Route: reopen palette, type "help", click the first item.
  await page.tap('#chrome-cmdk');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const p = document.getElementById('pal-input');
    if (!p) return;
    p.value = 'help';
    p.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.pal-item')];
    const help = items.find((i) => i.textContent.trim().startsWith('help'));
    (help || items[0])?.click();
  });
  await page.waitForTimeout(600);
  const helpRowCount = await page.evaluate(
    () => document.querySelectorAll('.help-row').length,
  );
  results.push([
    `mobile: help renders as .help-row buttons [n=${helpRowCount}]`,
    helpRowCount >= 10,
  ]);

  // Descriptions must not wrap to column 0 — they wrap under themselves
  // via the grid layout. Check the second column's left edge > first
  // column's right edge, i.e. columns are separate.
  const helpColumns = await page.evaluate(() => {
    const row = document.querySelector('.help-row');
    if (!row) return null;
    const hc = row.querySelector('.hc');
    const hd = row.querySelector('.hd');
    if (!hc || !hd) return null;
    return {
      hcRight: hc.getBoundingClientRect().right,
      hdLeft: hd.getBoundingClientRect().left,
    };
  });
  results.push([
    `mobile: help description column starts after command column`,
    helpColumns && helpColumns.hdLeft > helpColumns.hcRight,
  ]);

  // Tap the pwd help row → prints "~" as its own row.
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.help-row')];
    const pwd = rows.find(
      (r) => r.querySelector('.hc')?.textContent.trim() === 'pwd',
    );
    pwd?.click();
  });
  await page.waitForTimeout(400);
  const bufAfterHelpPwd = await page.evaluate(
    () => document.getElementById('buffer')?.innerText ?? '',
  );
  results.push([
    `mobile: tapping help pwd row runs pwd (buffer ends with /randy)`,
    bufAfterHelpPwd.trimEnd().endsWith('/randy'),
  ]);

  // 5) Full plate blocked on mobile
  //    Navigate: cd into work/oryzo via chip. Then tap "Show the note" twice.
  //    .plate-overlay.open must never appear.
  //    Easiest chip route: click the "See the work" chip from ~, then the
  //    "Open Oryzo" chip in ~/work, then "Show the note" chip in ~/work/oryzo,
  //    then "Show the note" again. We fire the commands directly since chips
  //    call chipInvoke which just re-dispatches to runCommand.
  await page.evaluate(() => {
    // Fire commands via the same chipInvoke bus the chip taps use.
    // The engine module isn't exported, so we go through the input path:
    // simulate a chip click by finding a chip button and clicking it.
  });
  // Programmatically drive the engine by calling runCommand-equivalent
  // through the chip buttons. First: cd work.
  const clickChipByLabel = async (label) => {
    return page.evaluate((l) => {
      const chips = [...document.querySelectorAll('#chips .chip')];
      const btn = chips.find(
        (c) => c.querySelector('.l1')?.textContent.trim() === l,
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, label);
  };
  const clickedSeeWork = await clickChipByLabel('See the work');
  await page.waitForTimeout(400);
  const clickedOpenOryzo = await clickChipByLabel('Open Oryzo');
  // Wait for label card to appear.
  await page.waitForFunction(
    () => document.querySelector('.label-card'),
    { timeout: 6000 },
  );
  await page.waitForTimeout(500);

  // The chip row must NOT contain a "Show the note" or "Open the project"
  // chip on mobile — the full-plate view is disabled on touch, so the chip
  // would just re-render the label the visitor is already looking at.
  const chipLabelsAfterOpen = await page.evaluate(() => {
    return [...document.querySelectorAll('#chips .chip .l1')]
      .map((c) => c.textContent.trim());
  });
  const noRedundantChip = !chipLabelsAfterOpen.includes('Show the note')
    && !chipLabelsAfterOpen.includes('Open the project');
  results.push([
    `mobile: no "Show the note"/"Open the project" chip in ~/work/oryzo`,
    noRedundantChip,
  ]);

  // The inline studio-note card must NOT contain a .label-hint element.
  // The hint on desktop reads "Type `open oryzo` to see the full page." —
  // misleading on mobile where the full page doesn't exist.
  const noteHintPresent = await page.evaluate(() => {
    return !!document.querySelector(
      '.label-card[data-inline-slug="oryzo"] .label-hint'
    );
  });
  results.push([
    `mobile: studio-note card omits .label-hint on touch`,
    !noteHintPresent,
  ]);

  // The plate overlay must never open on touch. The chip that used to
  // attempt the promotion is now gone, so this is defense-in-depth: even
  // if some future path calls openPlate(), the engine's TOUCH guard
  // must still prevent it.
  const plateEverOpened = await page.evaluate(
    () => !!document.querySelector('.plate-overlay.open'),
  );
  results.push([
    `mobile: .plate-overlay.open never appears on touch`,
    !plateEverOpened,
  ]);

  // Scroll-follow: fire `cat about` (a card taller than the iPhone-13
  // viewport with hint enabled). Wait for its reveal to complete, then
  // assert the card's hint is inside the terminal viewport bounds. If
  // the animator failed to scroll-follow the growing tail, the hint
  // would render below the fold and this fails.
  await page.evaluate(() => {
    // Navigate back home so the about-card lays out at the buffer bottom
    // rather than after a stack of previous cards.
    const chips = [...document.querySelectorAll('#chips .chip')];
    const back = chips.find((c) => c.querySelector('.l1')?.textContent.trim() === 'Back home')
              || chips.find((c) => c.querySelector('.l1')?.textContent.trim() === 'Back to work');
    if (back) back.click();
  });
  await page.waitForTimeout(300);
  // Cascade back to ~
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#chips .chip')];
    const back = chips.find((c) => c.querySelector('.l1')?.textContent.trim() === 'Back home');
    if (back) back.click();
  });
  await page.waitForTimeout(400);
  await clickChipByLabel('Read about Randy');
  // Wait until the about-card is fully revealed. animateLabelCard flips
  // revealInProgress false when done; we also fall back to a fixed wait.
  await page.waitForFunction(
    () => {
      const c = document.querySelector('.label-card[data-inline-slug="about"]');
      const h = c && c.querySelector('.label-hint');
      // hint rendered AND has non-empty text = reveal finished the hint beat.
      return !!(h && h.textContent && h.textContent.trim().length > 4);
    },
    { timeout: 12000 },
  );
  // Give the trailing settle beat a moment to run.
  await page.waitForTimeout(400);

  const hintInFrame = await page.evaluate(() => {
    const term = document.getElementById('term');
    const hint = document.querySelector(
      '.label-card[data-inline-slug="about"] .label-hint'
    );
    if (!term || !hint) return { ok: false, why: 'missing element' };
    const t = term.getBoundingClientRect();
    const h = hint.getBoundingClientRect();
    return {
      ok: h.bottom <= t.bottom + 4 && h.top >= t.top - 4,
      hb: h.bottom, tb: t.bottom, ht: h.top, tt: t.top,
    };
  });
  results.push([
    `mobile: about-card .label-hint is in terminal viewport after reveal` +
      (hintInFrame.ok ? '' : ` (hint b=${Math.round(hintInFrame.hb)}, term b=${Math.round(hintInFrame.tb)})`),
    hintInFrame.ok,
  ]);

  // The chip row is the entire navigation model on touch — after any
  // card reveal it MUST be inside the terminal viewport at rest, or the
  // visitor is stranded with no way out. This is the specific regression
  // the pre-frame + single-scrollBottom pattern is preventing: the old
  // followCardTail(wrap) targeted the card's bottom and pushed #chips
  // past the fold.
  const chipsInFrame = await page.evaluate(() => {
    const term = document.getElementById('term');
    const chips = document.getElementById('chips');
    if (!term || !chips) return { ok: false, why: 'missing element' };
    const t = term.getBoundingClientRect();
    const c = chips.getBoundingClientRect();
    return {
      ok: c.bottom <= t.bottom + 4 && c.top >= t.top - 4,
      cb: c.bottom, tb: t.bottom, ct: c.top, tt: t.top,
    };
  });
  results.push([
    `mobile: #chips is in terminal viewport after about-card reveal` +
      (chipsInFrame.ok ? '' : ` (chips b=${Math.round(chipsInFrame.cb)}, term b=${Math.round(chipsInFrame.tb)})`),
    chipsInFrame.ok,
  ]);

  // 7) viewport-fit=cover in meta
  const hasViewportFit = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? /viewport-fit=cover/.test(meta.getAttribute('content') || '') : false;
  });
  results.push(['mobile: viewport meta includes viewport-fit=cover', hasViewportFit]);

  // ---- Theme toggle on mobile ----
  // (15) theme toggle is tappable on touch (pointer-events must be auto).
  // (16) Tapping it flips data-theme.
  // (17) Tapping it does NOT summon the soft keyboard (keysink must stay
  //      off-screen; we assert by checking that the active element is not
  //      an input after the tap).
  const themeBefore = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  );
  const tlPointerEvents = await page.evaluate(() => {
    const el = document.getElementById('chrome-theme');
    if (!el) return null;
    return getComputedStyle(el).pointerEvents;
  });
  results.push(['mobile: theme toggle pointer-events auto', tlPointerEvents === 'auto']);

  await page.tap('#chrome-theme');
  await page.waitForTimeout(180);
  const themeAfter = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  );
  results.push([
    'mobile: theme toggle tap flips data-theme',
    themeAfter !== themeBefore && (themeAfter === 'dark' || themeAfter === 'light'),
  ]);

  const activeIsInput = await page.evaluate(() => {
    const ae = document.activeElement;
    return !!(ae && ae.tagName === 'INPUT' && ae.id !== 'pal-input');
  });
  results.push(['mobile: theme toggle tap does not focus terminal input', !activeIsInput]);

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

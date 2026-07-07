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
//      - After navigating to ~/work/oryzo and running `open oryzo` twice
//        via chip taps, .plate-overlay.open never appears
//   6) Chip label wording flips to "Show the note" (not "Open the project")
//   7) viewport meta includes viewport-fit=cover
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
    await page.tap('#palette', { position: { x: 10, y: 10 } });
    await page.waitForTimeout(600);
    const closed = await page.evaluate(
      () => !document.getElementById('palette')?.classList.contains('open'),
    );
    results.push(['mobile: tap outside palette dismisses (pointerdown)', closed]);
  } else {
    results.push(['mobile: tap outside palette dismisses (pointerdown) [skipped]', false]);
  }

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

  // The chip set should now show "Show the note" (mobile wording).
  const hasShowTheNote = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#chips .chip .l1')];
    return chips.some((c) => c.textContent.trim() === 'Show the note');
  });
  results.push([
    `mobile: chip label reads "Show the note" (not "Open the project")`,
    hasShowTheNote,
  ]);

  // Tap "Show the note" TWICE. The second tap on desktop would promote to
  // full plate; on mobile it must stay a label.
  const clickedShow1 = await clickChipByLabel('Show the note');
  await page.waitForTimeout(500);
  const clickedShow2 = await clickChipByLabel('Show the note');
  await page.waitForTimeout(1000);
  const plateEverOpened = await page.evaluate(
    () => !!document.querySelector('.plate-overlay.open'),
  );
  results.push([
    `mobile: two "Show the note" taps do NOT open plate overlay`,
    !plateEverOpened,
  ]);

  // 7) viewport-fit=cover in meta
  const hasViewportFit = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta ? /viewport-fit=cover/.test(meta.getAttribute('content') || '') : false;
  });
  results.push(['mobile: viewport meta includes viewport-fit=cover', hasViewportFit]);

  // ---- Theme toggle on mobile ----
  // (15) chrome-tl is tappable on touch (pointer-events must be auto).
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
  results.push(['mobile: chrome-tl pointer-events auto', tlPointerEvents === 'auto']);

  await page.tap('#chrome-theme');
  await page.waitForTimeout(180);
  const themeAfter = await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme'),
  );
  results.push([
    'mobile: chrome-tl tap flips data-theme',
    themeAfter !== themeBefore && (themeAfter === 'dark' || themeAfter === 'light'),
  ]);

  const activeIsInput = await page.evaluate(() => {
    const ae = document.activeElement;
    return !!(ae && ae.tagName === 'INPUT' && ae.id !== 'pal-input');
  });
  results.push(['mobile: chrome-tl tap does not focus terminal input', !activeIsInput]);

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

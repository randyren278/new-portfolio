/**
 * End-to-end smoke for the training status journey:
 * home → Latest Activity → "view training status?" plate → /training → back.
 *
 *   node scripts/smoke-training.cjs                      # desktop, 1440x900
 *   DEVICE=mobile node scripts/smoke-training.cjs        # iPhone 13
 *   BASE_URL=https://www.randyren.org/ node scripts/smoke-training.cjs
 *   EXPECT_COROS=0 …                                     # Coros not connected yet
 *   SHARE_URL=<vercel share link> BASE_URL=<preview> …   # protected preview
 *
 * Locally, run the dev server with TRAINING_FIXTURE=1 on :3877 so the page
 * renders the captured Coros responses instead of a live account.
 * Exits 0 on success, 1 on any failed assertion or page error.
 */

const { chromium, devices } = require('playwright');

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3877/';
const IS_MOBILE = process.env.DEVICE === 'mobile';
const EXPECT_COROS = process.env.EXPECT_COROS !== '0';
const url = (p) => new URL(p, BASE_URL).toString();

function assert(cond, label) {
  if (cond) console.log(`  ok  ${label}`);
  else {
    console.error(`  FAIL ${label}`);
    process.exitCode = 1;
  }
}

async function passIntro(page) {
  await page.frameLocator('iframe.puff-entrance').locator('a[href="#portfolio"]').first().click();
  await page.waitForSelector('iframe.puff-entrance', { state: 'detached' });
  await page.waitForSelector('.puff-bento:not(.awaiting-intro)');
}

/** Same sweep as smoke-bento: every visible text run against its composited backdrop. */
const contrastFailures = (page) =>
  page.evaluate(() => {
    const channel = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const parse = (v) => {
      const n = (v.match(/[\d.]+/g) ?? []).map(Number);
      return { rgb: n.slice(0, 3), alpha: n.length > 3 ? n[3] : 1 };
    };
    const backdrop = (node) => {
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
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim())
        .join(' ')
        .trim();
      if (!own || el.closest('svg')) continue; // chart text: checked below as SVG fill
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || style.visibility === 'hidden') continue;
      let opacity = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        opacity *= Number(getComputedStyle(n).opacity);
      }
      const fg = parse(style.color);
      const bg = backdrop(el);
      const a = fg.alpha * opacity;
      const c = fg.rgb.map((v, i) => v * a + bg[i] * (1 - a));
      const ratio = (Math.max(lum(c), lum(bg)) + 0.05) / (Math.min(lum(c), lum(bg)) + 0.05);
      const px = Number.parseFloat(style.fontSize);
      const need = px >= 24 || (px >= 18.66 && Number(style.fontWeight) >= 700) ? 3 : 4.5;
      if (ratio + 0.005 < need) out.push(`${own.slice(0, 24)} [${el.className}] ${ratio.toFixed(2)}:1`);
    }
    return out;
  });

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(
    IS_MOBILE ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } },
  );
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource.*404/.test(m.text())) {
      errors.push(`CONSOLE: ${m.text()}`);
    }
  });

  console.log(`\n== smoke-training (${IS_MOBILE ? 'mobile / iPhone 13' : 'desktop'}) → ${BASE_URL} ==`);

  // ---- 1. the doorway ----------------------------------------------------
  // A Vercel share link sets the cookie that lets us through preview protection.
  if (process.env.SHARE_URL) await page.goto(process.env.SHARE_URL, { waitUntil: 'load' });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await passIntro(page);
  const opener = page.locator('.strava-open');
  assert(await opener.isVisible(), 'Latest Activity cell carries the training status opener');
  const pill = (await page.textContent('.strava-pill'))?.replace(/\s+/g, ' ').trim();
  assert(pill === 'Training status →', `opener shows its glass pill (got "${pill}")`);
  assert(
    (await opener.getAttribute('aria-haspopup')) === 'dialog',
    'opener announces that it opens a dialog',
  );
  const box = await opener.boundingBox();
  assert(box.width >= 44 && box.height >= 44, `opener is a large target (${Math.round(box.width)}×${Math.round(box.height)})`);
  await opener.focus();
  const ring = await opener.evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });
  assert(ring === 'solid 2px', `opener has a visible keyboard focus ring (${ring})`);

  // ---- 2. the plate, by keyboard -------------------------------------------
  await page.keyboard.press('Enter');
  const plate = page.locator('.training-ask-plate');
  await plate.waitFor({ state: 'visible' });
  const title = (await page.textContent('#training-ask-title'))?.trim();
  assert(title === 'Do you want to view Randy’s training status?', `plate asks the question (got "${title}")`);
  assert(
    (await plate.getAttribute('aria-modal')) === 'true' && (await plate.evaluate((el) => el.tagName)) === 'DIALOG',
    'plate is a modal <dialog>',
  );
  const focusedInPlate = await page.evaluate(() => document.activeElement?.closest('.training-ask-plate') != null);
  assert(focusedInPlate, 'focus moves into the plate');
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  assert(
    await page.evaluate(() => document.activeElement?.closest('.training-ask-plate') != null),
    'Tab stays trapped inside the plate',
  );
  await page.waitForFunction(
    () => [...document.querySelectorAll('.training-ask-preview dd')].every((d) => d.textContent !== '…'),
    null,
    { timeout: 20000 },
  ).catch(() => {});
  const preview = await page.$$eval('.training-ask-preview dd', (els) => els.map((e) => e.textContent));
  assert(preview.length === 3 && preview.every((t) => t && t !== '…'), `plate previews the numbers (${preview.join(' / ')})`);
  if (EXPECT_COROS) assert(preview[0] !== '—' && preview[1].endsWith('%'), 'preview has Coros status and recovery');
  await page.keyboard.press('Escape');
  await plate.waitFor({ state: 'detached' });
  assert(
    await page.evaluate(() => document.activeElement?.classList.contains('strava-open')),
    'Escape closes the plate and returns focus to the opener',
  );
  assert(await page.evaluate(() => document.body.style.overflow !== 'hidden'), 'page scroll is restored after closing');

  // ---- 3. the plate, by pointer → /training ---------------------------------
  await opener.click();
  await plate.waitFor({ state: 'visible' });
  await page.click('.training-ask-actions >> text=Not now');
  await plate.waitFor({ state: 'detached' });
  assert(true, '"Not now" closes the plate');
  await opener.click();
  await plate.waitFor({ state: 'visible' });
  await page.click('.training-ask-go');
  await page.waitForURL('**/training', { timeout: 20000 });
  await page.waitForSelector('.tr-grid');
  await page.waitForTimeout(800);
  assert(new URL(page.url()).pathname === '/training', 'View training status lands on /training');
  assert((await page.title()) === 'Training status — Randy Ren', `training page title (got "${await page.title()}")`);
  assert((await page.locator('.bento-departure').count()) === 0, 'the departure curtain is lifted on arrival');

  // ---- 4. the training page -------------------------------------------------
  const kickers = await page.$$eval('.tr-grid h2.kicker', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  const has = (prefix) => kickers.some((k) => k.startsWith(prefix));
  for (const k of ['§ STATUS', '§ THIS WEEK', '§ WEEKLY VOLUME', '§ LINE STUDIES', '§ ODOMETER', '§ HOW THIS WORKS']) {
    assert(has(k), `cell rendered: ${k}`);
  }
  if (EXPECT_COROS) {
    for (const k of ['§ READINESS', '§ TRAINING LOAD', '§ RECOVERY', '§ TRAINING FOCUS', '§ NOTES FROM THE LOG']) {
      assert(has(k), `Coros cell rendered: ${k}`);
    }
  }
  for (const k of ['§ CONSISTENCY', '§ RACE PREDICTOR']) assert(!has(k), `cell removed: ${k}`);
  const word = (await page.textContent('.tr-status-word'))?.trim();
  assert(/^[A-Z][a-z]+\.$/.test(word ?? ''), `status word reads as one word and a full stop (got "${word}")`);
  if (EXPECT_COROS) assert(word !== 'Logging.', 'status comes from Coros, not the Strava-only fallback');

  const charts = await page.$$eval('.chart svg', (els) => els.map((e) => e.getBoundingClientRect().width));
  assert(charts.length >= (EXPECT_COROS ? 5 : 2) && charts.every((w) => w > 100), `charts drew at their real width (${charts.map(Math.round).join(', ')})`);
  const lines = await page.locator('.tr-study').count();
  assert(lines >= 1 && lines <= 8, `line studies show the latest activities (${lines})`);
  if (await page.locator('.tr-reps').count()) {
    const reps = await page.locator('.tr-reps tbody tr').count();
    const best = await page.locator('.tr-reps tr.best').count();
    assert(reps >= 2 && best === 1, `session table lists reps with one fastest (${reps} reps)`);
  }

  // Randy shows resting HR in the readiness cell and nowhere else: no other
  // heart-rate field in the page's data payload, and no HR text, tooltip or
  // label outside that cell (HRV is fine).
  const payload = await (await page.request.get(url('/training'))).text();
  assert(
    !/\\?"(hr|avgHr|restingHr|maxHr)\\?"\s*:/.test(payload) &&
      (payload.match(/\\?"rhr\\?"\s*:/g) ?? []).length <= 1,
    'the page payload carries only the readiness resting HR',
  );
  const hrOutside = await page.evaluate(() => {
    const HR = /\bbpm\b|resting hr|heart rate|\bHR\b/i;
    const hits = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const el = n.parentElement;
      if (el.closest('script, style, template, noscript, .tr-ready')) continue;
      if (HR.test(n.nodeValue)) hits.push(n.nodeValue.trim());
    }
    for (const el of document.querySelectorAll('[data-tip], [aria-label], [title]')) {
      const text = ['data-tip', 'aria-label', 'title'].map((a) => el.getAttribute(a) ?? '').join(' ');
      if (HR.test(text) && !el.closest('.tr-ready')) hits.push(text.trim());
    }
    return hits;
  });
  assert(hrOutside.length === 0, `no heart rate outside readiness (${hrOutside.slice(0, 3).join(' / ')})`);
  if (EXPECT_COROS) {
    const ready = await page.locator('.tr-ready').innerText();
    assert(/resting hr/i.test(ready) && /\d+\s*bpm/i.test(ready), 'readiness shows resting HR');
  }

  const outline = await page.$$eval('h1, h2, h3', (els) => els.map((e) => Number(e.tagName[1])));
  assert(outline.filter((l) => l === 1).length === 1 && outline[0] === 1, 'one H1 leads the outline');
  assert(outline.every((l, i) => i === 0 || l <= outline[i - 1] + 1), 'no heading level is skipped');

  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert(hscroll <= 0, `no horizontal scroll (${hscroll}px)`);
  const contrast = await contrastFailures(page);
  assert(contrast.length === 0, `all visible text clears WCAG AA (${contrast.length} failing)`);
  for (const f of contrast) console.error('    ', f);
  const svgText = await page.$$eval('.tr-grid svg text', (els) => [...new Set(els.map((t) => t.getAttribute('fill')))]);
  assert(svgText.every((f) => f === 'var(--muted)' || f === 'var(--ink)'), `chart text uses text colours only (${svgText.join(', ')})`);

  // Reach the back link the way a keyboard user does: Tab from the brand.
  const back = page.locator('.training-page header a.bento-text-button');
  await page.locator('.training-page header a.brand').focus();
  await page.keyboard.press('Tab');
  assert(
    await back.evaluate((el) => el === document.activeElement),
    'Tab moves from the brand to the back link',
  );
  const backRing = await back.evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });
  assert(backRing === 'solid 2px', `back link has a visible focus ring (${backRing})`);
  if (IS_MOBILE) {
    const small = await page.$$eval('.training-page a, .training-page button', (els) =>
      els
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.width && (r.width < 44 || r.height < 44)).length,
    );
    assert(small === 0, `every control owns a 44px target (${small} too small)`);
  }

  // Tooltips: a day bar, then (desktop) the load chart crosshair.
  const day = page.locator('.tr-grid rect[data-tip]').first();
  await day.scrollIntoViewIfNeeded();
  const dbox = await day.boundingBox();
  // Touch screens get the tooltip on tap; pointers on hover.
  if (IS_MOBILE) await page.touchscreen.tap(dbox.x + dbox.width / 2, dbox.y + dbox.height / 2);
  else await page.mouse.move(dbox.x + dbox.width / 2, dbox.y + dbox.height / 2);
  await page.waitForTimeout(150);
  const tipText = await page.textContent('.tr-tip').catch(() => null);
  assert(!!tipText && /[A-Z]{3} [A-Z]{3} \d+/.test(tipText), `hovering a mark shows its tooltip ("${tipText?.slice(0, 40)}")`);

  // ---- 5. API + connect gate --------------------------------------------------
  const summary = await page.request.get(url('/api/training/summary'));
  const body = await summary.json().catch(() => ({}));
  assert(summary.ok() && 'km7' in body && 'status' in body, `summary API answers (${summary.status()})`);
  if (EXPECT_COROS) assert(`${body.status}.` === word, `summary status matches the page (${body.status})`);
  const connect = await page.request.get(url('/api/coros/connect'), { maxRedirects: 0 });
  assert([403, 500].includes(connect.status()), `Coros connect refuses without the key (${connect.status()})`);
  const wrongKey = await page.request.get(url('/api/coros/connect?key=nope'), { maxRedirects: 0 });
  assert([403, 500].includes(wrongKey.status()), `Coros connect refuses a wrong key (${wrongKey.status()})`);
  const callback = await page.request.get(url('/api/coros/callback?code=x&state=y'), { maxRedirects: 0 });
  assert(callback.status() === 400, `Coros callback refuses a flow it didn't start (${callback.status()})`);

  // ---- 6. back home, without the intro ------------------------------------------
  await back.click();
  await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 20000 });
  await page.waitForSelector('.strava-open');
  await page.waitForTimeout(1200);
  assert((await page.locator('iframe.puff-entrance').count()) === 0, 'returning home skips the Puff intro');
  assert(await page.locator('.strava-open').isVisible(), 'the bento is visible on return');

  assert(errors.length === 0, `no page or console errors (${errors.length})`);
  for (const e of errors) console.error('    ', e);
  await browser.close();
  console.log(process.exitCode ? '== FAIL ==' : '== PASS ==');
})();

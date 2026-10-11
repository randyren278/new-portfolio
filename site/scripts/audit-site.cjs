/**
 * Whole-site audit for randyren.org — routes, assets, metadata, headers,
 * links, photos, and a browser pass over every page.
 *
 *   node scripts/audit-site.cjs                                   # live site
 *   BASE_URL=http://localhost:3877/ node scripts/audit-site.cjs   # local
 *
 * FAIL lines are defects and set exit code 1. WARN lines are judgement
 * calls worth a look. Complements smoke-bento / smoke-training, which own
 * the interaction-level checks.
 */

const { chromium, webkit } = require('playwright');
const sharp = require('sharp');
const manifest = require('../src/bento/photos.manifest.json');

const BASE = process.env.BASE_URL ?? 'https://www.randyren.org/';
const at = (p) => new URL(p, BASE).toString();
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

const counts = { ok: 0, warn: 0, fail: 0 };
const ok = (m) => {
  counts.ok++;
  console.log(`  ok    ${m}`);
};
const warn = (m) => {
  counts.warn++;
  console.log(`  WARN  ${m}`);
};
const fail = (m) => {
  counts.fail++;
  console.error(`  FAIL  ${m}`);
};
const check = (cond, m) => (cond ? ok(m) : fail(m));

async function get(path, opts = {}) {
  return fetch(at(path), { redirect: 'manual', headers: { 'user-agent': UA }, ...opts });
}

// ------------------------------------------------------------------ routes

const ROUTES = [
  ['/', 200, 'text/html'],
  ['/training', 200, 'text/html'],
  ['/api/training/summary', 200, 'application/json'],
  ['/resume/Randy_Ren_Resume.pdf', 200, 'application/pdf'],
  ['/api/resume/download', 200, 'application/pdf'],
  ['/resume/Randy_Ren_Resume-preview.jpg', 200, 'image/'],
  ['/favicon.svg', 200, 'image/svg+xml'],
  ['/favicon-32.png', 200, 'image/png'],
  ['/favicon-16.png', 200, 'image/png'],
  ['/apple-touch-icon.png', 200, 'image/png'],
  ['/og-image.png', 200, 'image/png'],
  ['/privacy.html', 200, 'text/html'],
  ['/puff-intro/index.html', 200, 'text/html'],
  ['/robots.txt', 200, 'text/plain'],
  ['/sitemap.xml', 200, 'xml'],
  ['/this-page-does-not-exist', 404, 'text/html'],
  // Removed or gated endpoints must stay that way.
  ['/api/strava/latest', 404, ''],
  ['/api/strava/connect', 403, 'application/json'],
  ['/api/coros/connect', 403, 'application/json'],
  ['/api/strava/callback?code=x&state=y', 400, 'application/json'],
  ['/api/coros/callback?code=x&state=y', 400, 'application/json'],
];

async function routes() {
  console.log('\n== routes & assets');
  for (const [path, status, type] of ROUTES) {
    const res = await get(path);
    const ct = res.headers.get('content-type') ?? '';
    check(res.status === status && ct.includes(type), `${path} → ${res.status} ${ct.split(';')[0] || '—'}`);
  }
  for (const mock of ['/sill-plate-mockup.html', '/project-detail-mockup.html', '/project-detail-tile-mockup.html']) {
    const res = await get(mock);
    if (res.status === 200) warn(`${mock} is publicly served (design-process mockup)`);
    else ok(`${mock} is not served (${res.status})`);
  }
  const preview = await (await get('/preview')).text().catch(() => '');
  if (preview && !/noindex/.test(preview)) warn('/preview duplicates the home page without noindex');
}

// ---------------------------------------------------------------- metadata

const meta = (html, re) => re.exec(html)?.[1];

async function metadata() {
  console.log('\n== metadata');
  for (const path of ['/', '/training']) {
    const html = await (await get(path)).text();
    const title = meta(html, /<title>([^<]*)<\/title>/);
    const desc = meta(html, /<meta name="description" content="([^"]*)"/);
    const ogImage = meta(html, /<meta property="og:image" content="([^"]*)"/);
    const ogTitle = meta(html, /<meta property="og:title" content="([^"]*)"/);
    const ogUrl = meta(html, /<meta property="og:url" content="([^"]*)"/);
    const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/);
    check(!!title && title.length <= 60, `${path} title "${title}"`);
    check(!!desc && desc.length >= 20 && desc.length <= 160, `${path} meta description (${desc?.length ?? 0} chars)`);
    check(/<html lang="en"/.test(html), `${path} declares lang="en"`);
    check(/name="viewport" content="[^"]*width=device-width/.test(html), `${path} has a responsive viewport`);
    check(/name="theme-color" content="#181917"/.test(html), `${path} theme-color matches the page`);
    check(!!ogTitle && !!ogImage, `${path} has og:title and og:image`);
    if (ogTitle && title && path !== '/') check(ogTitle === title, `${path} og:title matches its title ("${ogTitle}")`);
    if (ogUrl) check(new URL(ogUrl).pathname === path, `${path} og:url points at itself (${ogUrl})`);
    if (canonical) check(new URL(canonical).pathname === path, `${path} canonical points at itself (${canonical})`);
    else warn(`${path} has no canonical link`);
    if (ogImage) {
      const res = await fetch(ogImage);
      const img = await sharp(Buffer.from(await res.arrayBuffer())).metadata().catch(() => ({}));
      check(res.ok && img.width === 1200 && img.height === 630, `${path} og:image loads at 1200×630 (${img.width}×${img.height})`);
    }
  }
}

// ----------------------------------------------------------------- headers

async function headers() {
  console.log('\n== security headers (/)');
  const h = (await get('/')).headers;
  check(/max-age=\d{7,}/.test(h.get('strict-transport-security') ?? ''), `HSTS (${h.get('strict-transport-security')})`);
  check(h.get('x-content-type-options') === 'nosniff', `X-Content-Type-Options (${h.get('x-content-type-options')})`);
  check(!!h.get('referrer-policy'), `Referrer-Policy (${h.get('referrer-policy')})`);
  const frame = h.get('x-frame-options') || (h.get('content-security-policy') ?? '').match(/frame-ancestors[^;]*/)?.[0];
  check(!!frame, `framing is restricted (${frame})`);
  check(!!h.get('permissions-policy'), `Permissions-Policy (${h.get('permissions-policy')})`);
  check(!h.get('x-powered-by'), `no X-Powered-By (${h.get('x-powered-by')})`);
  const www = await fetch(BASE.replace('://www.', '://'), { redirect: 'manual' }).catch(() => null);
  if (BASE.includes('://www.') && www) {
    check([301, 307, 308].includes(www.status) && (www.headers.get('location') ?? '').includes('://www.'), `apex redirects to www (${www.status})`);
  }
}

// ------------------------------------------------------------------ photos

async function photos() {
  console.log('\n== photos');
  const files = (manifest.photos ?? manifest).map((p) => p.file ?? p.src ?? p).filter((f) => typeof f === 'string');
  const bad = [];
  for (const f of files) {
    const res = await fetch(at(`/photos/${f.replace(/^\/?photos\//, '')}`), { method: 'HEAD' });
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) bad.push(`${f} ${res.status}`);
  }
  check(files.length > 0 && bad.length === 0, `all ${files.length} manifest photos load${bad.length ? `: ${bad.join(', ')}` : ''}`);
}

// ------------------------------------------------------------- browser pass

const VIEWPORTS = [
  [1440, 900],
  [1024, 768],
  [390, 844],
];

async function visit(page, path) {
  await page.goto(at(path), { waitUntil: 'networkidle' });
  if (path === '/' && (await page.locator('iframe.puff-entrance').count())) {
    await page.frameLocator('iframe.puff-entrance').locator('a[href="#portfolio"]').first().click();
    await page.waitForSelector('iframe.puff-entrance', { state: 'detached' });
  }
  await page.waitForTimeout(800);
}

async function browserPass(links) {
  for (const [name, engine] of [
    ['chromium', chromium],
    ['webkit', webkit],
  ]) {
    console.log(`\n== browser pass: ${name}`);
    const browser = await engine.launch();
    for (const [w, h] of VIEWPORTS) {
      for (const scheme of ['dark', 'light']) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, userAgent: undefined });
        const page = await ctx.newPage();
        const problems = [];
        page.on('pageerror', (e) => problems.push(`pageerror ${e.message}`));
        page.on('console', (m) => m.type() === 'error' && problems.push(`console ${m.text().slice(0, 120)}`));
        page.on('response', (r) => {
          if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) {
            problems.push(`${r.status()} ${new URL(r.url()).pathname}`);
          }
        });
        for (const path of ['/', '/training']) {
          await visit(page, path);
          const m = await page.evaluate(() => ({
            hscroll: document.documentElement.scrollWidth - innerWidth,
            brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')),
            bg: getComputedStyle(document.body).backgroundColor,
            links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
          }));
          for (const l of m.links) links.add(l);
          const label = `${path} @ ${w}×${h} OS-${scheme}`;
          check(m.hscroll <= 0, `${label}: no horizontal scroll (${m.hscroll}px)`);
          check(m.brokenImgs.length === 0, `${label}: images load${m.brokenImgs.length ? ` (${m.brokenImgs.join(', ')})` : ''}`);
          check(/24, 25, 23/.test(m.bg), `${label}: dark page regardless of OS (${m.bg})`);
        }
        check(problems.length === 0, `${w}×${h} OS-${scheme}: no errors or failed requests${problems.length ? ` — ${[...new Set(problems)].join(' | ')}` : ''}`);
        await ctx.close();
      }
    }
    await browser.close();
  }
}

// ------------------------------------------------------------------- links

async function linkCheck(links) {
  console.log('\n== links');
  for (const href of [...links].sort()) {
    const u = new URL(href);
    if (u.protocol === 'mailto:') {
      check(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(u.pathname), `mailto ${u.pathname}`);
      continue;
    }
    if (u.hash && u.origin === new URL(BASE).origin && u.pathname === '/') continue; // in-page anchors
    const res = await fetch(href, { headers: { 'user-agent': UA }, redirect: 'follow' }).catch((e) => ({ status: `ERR ${e.message}` }));
    if (u.hostname.endsWith('linkedin.com') && res.status === 999) {
      warn(`${href} → 999 (LinkedIn blocks bots; check by hand)`);
      continue;
    }
    check(typeof res.status === 'number' && res.status < 400, `${href} → ${res.status}`);
  }
}

(async () => {
  console.log(`audit → ${BASE}`);
  await routes();
  await metadata();
  await headers();
  await photos();
  const links = new Set();
  await browserPass(links);
  await linkCheck(links);
  console.log(`\n${counts.ok} ok · ${counts.warn} warn · ${counts.fail} fail`);
  process.exitCode = counts.fail ? 1 : 0;
})();

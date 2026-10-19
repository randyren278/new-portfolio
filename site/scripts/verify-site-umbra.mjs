// Whole-site user-path checks using Umbra and an isolated scratch profile.
// Run against a production build with TRAINING_FIXTURE=1 and synthetic Strava.
// node scripts/verify-site-umbra.mjs http://127.0.0.1:4320 /absolute/evidence-dir
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';

const [base, out] = process.argv.slice(2);
if (!base || !out) throw new Error('Expected base URL and evidence directory');
mkdirSync(out, { recursive: true });
const profile = `scratch-portfolio-e2e-${process.pid}`;
const exec = promisify(execFile);
const results = [];
async function call(...args) {
  return JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], { timeout: 60000, maxBuffer: 8e6 })).stdout);
}
const evaluate = async source => (await call('eval', source)).value;
const wait = condition => call('wait', '--js', condition, '--timeout', '20');
function check(label, observed, expected = true) {
  assert.deepEqual(observed, expected, label);
  results.push({ label, observed });
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, profile, results }, null, 2));
  console.log(`PASS ${label}`);
}
async function consoleCheck(label) {
  const errors = await call('console', '--level', 'error');
  writeFileSync(path.join(out, `${label}-console.json`), JSON.stringify(errors, null, 2));
  const entries = errors.entries;
  assert.ok(Array.isArray(entries), 'Umbra console entries must be present');
  check(`${label}: no browser errors`, entries.length, 0);
}
try {
  await call('tab', 'new', 'site');
  for (const mobile of [false, true]) {
    const device = mobile ? 'mobile' : 'desktop';
    await call('viewport', ...(mobile ? ['390', '844', '--mobile'] : ['1440', '900']));
    await call('open', `${base}/`);
    await wait('!!document.querySelector("iframe.is-ready")');
    check(`${device}: intro covers inert portfolio`, await evaluate('return document.querySelector(".bento-page").inert'));
    for (const scene of ['space', 'pool', 'kite']) {
      if (!await evaluate('return !!document.querySelector("iframe")')) {
        await call('click', 'text=Return to intro');
        await wait('!!document.querySelector("iframe.is-ready")');
      }
      await evaluate(`document.querySelector('iframe').src='/puff-intro/index.html?scene=${scene}';return true`);
      await wait(`document.querySelector('iframe')?.contentWindow?.spaceScene?.mode==='${scene}' && document.querySelector('iframe')?.contentDocument?.readyState==='complete'`);
      check(`${device}/${scene}: renderer paints`, await evaluate('return [...document.querySelector("iframe").contentDocument.querySelectorAll("canvas")].some(c=>c.width>0&&c.height>0)'));
      await call('click', '#light-button');
      check(`${device}/${scene}: lighting works`, await evaluate('return document.querySelector("iframe").contentDocument.querySelector("#entrance").dataset.light'), 'ember');
      await call('click', '#entrance-puff-button');
      await evaluate('const f=document.querySelector("iframe");f.contentDocument.querySelector(".explore-button").addEventListener("click",e=>window.__entryTrusted=e.isTrusted,{once:true});return true');
      await call('click', '.explore-button');
      if (scene === 'space') {
        await wait('!document.querySelector(".bento-page").inert');
        await call('click', '.strava-open');
        check(`${device}: controls respond during landing`, await evaluate('return !!document.querySelector(".training-ask.open")'));
        await call('click', 'text=Not now');
      }
      await wait('!document.querySelector("iframe")');
      check(`${device}/${scene}: trusted Explore enters`, await evaluate('return window.__entryTrusted'));
      check(`${device}/${scene}: portfolio released`, await evaluate('return !document.querySelector(".bento-page").inert && getComputedStyle(document.querySelector(".bento-page")).opacity==="1"'));
      check(`${device}/${scene}: intro unmounted`, await evaluate('return document.querySelectorAll("iframe").length'), 0);
    }
    await wait('!document.querySelector(".photo-shuffle").disabled');
    await call('screenshot', path.join(out, `${device}-portfolio.png`), '--full');
    check(`${device}: no horizontal overflow`, await evaluate('return document.documentElement.scrollWidth<=innerWidth+1'));
    check(`${device}: images decoded`, await evaluate('return [...document.images].every(i=>i.complete&&i.naturalWidth>0)'));
    check(`${device}: local font loaded`, await evaluate('await document.fonts.ready;return document.fonts.check("400 14px \'IBM Plex Mono\'")'));
    check(`${device}: no external fonts requested`, await evaluate('return !performance.getEntriesByType("resource").some(r=>/fonts\\.(googleapis|gstatic)\\.com/.test(r.name))'));
    const projects = await evaluate('return document.querySelectorAll(".projects-row").length');
    check(`${device}: full project catalogue`, projects >= 8);
    for (let i = 0; i < projects; i++) {
      await call('click', `.projects-row:nth-child(${i + 1})`);
      await wait('!!document.querySelector(".projects-plate.open")');
      check(`${device}: project ${i + 1} opens`, await evaluate('return !!document.querySelector(".projects-plate-title")?.textContent.trim()'));
      await call('press', 'Escape');
      await wait('!document.querySelector(".projects-plate")');
    }
    await call('click', '.cell-photo-a .photo-flip');
    await wait('document.querySelector(".cell-photo-a").classList.contains("flipped")');
    check(`${device}: photo verso`, await evaluate('return document.querySelector(".cell-photo-a .photo-back").inert===false'));
    await call('press', 'Escape');
    await wait('!document.querySelector(".cell-photo-a").classList.contains("flipped")');
    const photos = await evaluate('return [...document.querySelectorAll(".photo-fname")].map(e=>e.textContent)');
    await call('click', mobile ? '.photo-gallery-shuffle' : '.photo-shuffle-top');
    await wait('!document.querySelector(".photo-shuffle").disabled');
    const next = await evaluate('return [...document.querySelectorAll(".photo-fname")].map(e=>e.textContent)');
    check(`${device}: shuffle replaces both photos`, next.every(name => !photos.includes(name)));
    await call('click', '.strava-open');
    await wait('!!document.querySelector(".training-ask.open")');
    await wait('document.querySelector(".training-ask-preview")?.getAttribute("aria-busy")==="false"');
    check(`${device}: training summary ready`, await evaluate('return !document.querySelector(".training-ask-preview").textContent.includes("…")'));
    await call('click', '.training-ask-go');
    await wait('location.pathname==="/training" && !!document.querySelector(".training-page")');
    await call('screenshot', path.join(out, `${device}-training.png`), '--full');
    check(`${device}: training charts`, await evaluate('return document.querySelectorAll("main svg").length>3'));
    check(`${device}: training no horizontal overflow`, await evaluate('return document.documentElement.scrollWidth<=innerWidth+1'));
    await consoleCheck(`${device}-training`);
    await call('click', 'text=Back to portfolio');
    await wait('location.pathname==="/" && !!document.querySelector(".bento-page") && !document.querySelector(".bento-page").inert');
    check(`${device}: return bypasses intro`, await evaluate('return !document.querySelector("iframe")'));
    await call('click', 'text=Return to intro');
    await wait('!!document.querySelector("iframe.is-ready")');
    await call('click', '.explore-button');
    await wait('!document.querySelector("iframe") && !document.querySelector(".photo-shuffle").disabled');
    check(`${device}: replay after training keeps photos live`, await evaluate('return [...document.querySelectorAll(".photo-current")].every(i=>i.complete&&i.naturalWidth>0) && document.querySelectorAll(".photo-current").length===2'));
    await consoleCheck(`${device}-home`);
    await call('open', `${base}/training`);
    await wait('!!document.querySelector(".training-page main svg")');
    check(`${device}: direct training entry`, await evaluate('return document.title==="Training Log"'));
  }
  await call('open', `${base}/preview`);
  await wait('!!document.querySelector("iframe.is-ready")');
  check('preview has working intro and noindex', await evaluate('return document.querySelector("meta[name=robots]").content.includes("noindex")'));
  await call('click', '.explore-button');
  await wait('!document.querySelector("iframe")');
  check('preview enters portfolio', await evaluate('return !document.querySelector(".bento-page").inert'));
  for (const route of ['/preview', '/training', '/api/training/summary', '/api/strava/latest', '/robots.txt', '/sitemap.xml', '/favicon.svg', '/resume/Randy_Ren_Resume.pdf', '/api/resume/download', '/resume/Randy_Ren_Resume-preview.webp']) {
    const start = performance.now();
    const response = await fetch(new URL(route, base));
    const body = Buffer.from(await response.arrayBuffer());
    check(`${route}: HTTP 200`, response.status, 200);
    results.push({ label: `${route}: response`, bytes: body.length, ms: performance.now() - start, type: response.headers.get('content-type') });
    if (route === '/api/resume/download') check('résumé attachment header', /attachment/.test(response.headers.get('content-disposition')));
  }
  check('unknown route: HTTP 404', (await fetch(new URL('/performance-missing-page', base))).status, 404);
  const pdf = Buffer.from(await (await fetch(new URL('/resume/Randy_Ren_Resume.pdf', base))).arrayBuffer());
  const download = Buffer.from(await (await fetch(new URL('/api/resume/download', base))).arrayBuffer());
  check('résumé download preserves original PDF bytes', pdf.equals(download));
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, profile, results }, null, 2));
} finally {
  await call('stop').catch(() => {});
}

// Umbra regression: page-load refresh, stable invitation and missing readiness vitals.
// node scripts/verify-training-invitation.mjs BASE_URL EVIDENCE_DIRECTORY [--readiness-only]
import { execFile } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';
import vm from 'node:vm';

const [base, directory] = process.argv.slice(2);
if (!base || !directory) throw new Error('Expected fixture server URL and evidence directory');
const out = path.resolve(directory);
const profile = `scratch-training-invitation-${process.pid}`;
const run = promisify(execFile);
const checks = [];
mkdirSync(out, { recursive: true });
async function call(...args) {
  const { stdout } = await run('umbra', ['--profile', profile, '--json', ...args], {
    timeout: 45000, maxBuffer: 8e6,
  });
  return JSON.parse(stdout);
}
const read = async source => (await call('eval', source)).value;
const wait = condition => call('wait', '--js', condition, '--timeout', '38');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}

// Render the actual components with captured data and unavailable biometric sources.
// Only framework navigation, effects and tooltip context are replaced for static rendering.
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const modules = new Map();
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, console,
    require(id) {
      if (id.endsWith('.css')) return {};
      if (id === 'next/link') return { default: p => React.createElement('a', p) };
      if (id === './curtain') return { useLiftCurtain() {} };
      if (id === './useTrainingRefresh') return { useTrainingRefresh() {} };
      if (id === './tip') return { TipLayer: ({ children }) => children, useTip: () => ({}) };
      if (id.startsWith('.')) {
        const resolved = path.resolve(path.dirname(file), id);
        return load(`${resolved}${id.endsWith('derive') || id.endsWith('parse') || id.endsWith('returnFlag') ? '.ts' : '.tsx'}`);
      }
      return require(id);
    },
  }, { filename: file });
  return module.exports;
}
const root = path.resolve('src/training');
const P = load(path.join(root, 'coros/parse.ts'));
const D = load(path.join(root, 'derive.ts'));
const fx = name => readFileSync(path.join(root, 'fixtures', name), 'utf8');
const source = {
  today: '2026-10-10', asOf: '2026-10-10T19:00:00.000Z',
  records: P.parseSportRecords(fx('sport-records.txt')), strava: null,
  load: P.parseTrainingLoad(fx('training-load.txt')), fitness: P.parseFitness(fx('fitness.txt')),
  recovery: P.parseRecovery(fx('recovery.txt')),
  restingHr: P.parseRestingHr(fx('resting-hr.txt')), hrv: P.parseSleepHrv(fx('sleep-hrv.txt')),
  details: {}, session: null,
};
const { TrainingPage } = load(path.join(root, 'ui/TrainingPage.tsx'));
const trainingHtml = await (await fetch(new URL('/training', base))).text();
const styles = [...trainingHtml.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]).join('');
const variants = new Map();
for (const [name, overrides, expected] of [
  ['no-vitals', { hrv: null, restingHr: null }, ['Time on feet', 'Avg. run length']],
  ['hrv-only', { restingHr: null }, ['HRV', 'Avg. run length']],
  ['rhr-only', { hrv: null }, ['Time on feet', 'Resting HR']],
  ['all-vitals', {}, ['HRV', 'Resting HR']],
  ['no-load', { hrv: null, restingHr: null, load: null }, ['Time on feet', 'Avg. run length']],
  ['no-fitness', { hrv: null, restingHr: null, fitness: null }, ['Time on feet', 'Avg. run length']],
  ['no-runs', { hrv: null, restingHr: null, records: [], strava: [] }, ['Time on feet', 'Avg. run length']],
]) {
  const view = D.deriveView({ ...source, ...overrides });
  const body = renderToStaticMarkup(React.createElement(TrainingPage, { view, updatedLabel: 'Fixture snapshot' }));
  variants.set(name, `<!doctype html><html class="puff-theme" data-training-fixture="${name}"><head>${styles}</head><body>${body}</body></html>`);
  const readiness = body.match(/<section class="cell tr-ready"[\s\S]*?<\/section>/)?.[0] ?? '';
  const labels = [...readiness.matchAll(/class="tr-lab">([^<]+)/g)].map(m => m[1]);
  check(`${name}: readiness uses available sources`, JSON.stringify(labels) === JSON.stringify(expected), { labels, expected });
  check(`${name}: no invented numeric values`, !/NaN|undefined|Infinity/.test(readiness));
  check(`${name}: no rejected replacement metrics`, !/Short-term load|Long-term load|5K estimate|10K estimate/.test(readiness));
  if (name === 'no-vitals') {
    check('activity metrics match the recorded runs', readiness.includes('7h 05m') && readiness.includes('13.2'), labels);
    check('activity metrics state their seven-day window', (readiness.match(/>Last 7 days</g) ?? []).length === 2);
  }
  if (name === 'no-runs') {
    check('no runs shows zero time and an unavailable average', readiness.includes('>0m<') && readiness.includes('>—<'));
  }
}

const initial = await (await fetch(new URL('/api/training/summary', base))).json();
const updated = { ...initial, recoveryPct: 88, km7: 94.9, run: initial.run ? { ...initial.run, km: initial.run.km + 1 } : null };
let nextSummary = initial;
let hold = false;
let release = () => {};
let requests = 0;
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/__readiness/')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(variants.get(req.url.split('/').at(-1)));
  } else if (req.url.startsWith('/api/training/summary')) {
    requests++;
    const reply = () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(nextSummary)); };
    if (hold) release = reply;
    else setTimeout(reply, 250);
  } else {
    const target = new URL(req.url, base);
    const transport = target.protocol === 'https:' ? https : http;
    const upstream = transport.request(target, { method: req.method, headers: { ...req.headers, host: new URL(base).host } }, response => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.on('error', error => { res.statusCode = 502; res.end(error.message); });
    req.pipe(upstream);
  }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
async function enter() {
  await wait('!!document.querySelector("iframe.is-ready")');
  await call('click', '.explore-button');
  await wait('!document.querySelector("iframe.puff-entrance")');
}
const sample = `
  window.__samples=[];
  const end=performance.now()+1200;
  function sample(){
    const p=document.querySelector('.training-ask-plate');
    if(p && +getComputedStyle(p).opacity>0){
      const r=p.getBoundingClientRect();
      window.__samples.push({y:r.y,height:r.height,values:p.querySelector('dl')?.innerText});
    }
    if(performance.now()<end)requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
`;
try {
  await call('tab', 'new', 'invitation');
  await call('viewport', '1440', '900');
  if (!process.argv.includes('--readiness-only')) {
  hold = true;
  await call('open', url);
  await enter();
  check('summary starts on page load without a training click', requests > 0, requests);
  await call('click', '.strava-open');
  check('early click waits for data before showing numbers', await read('return !document.querySelector(".training-ask-plate") && document.querySelector(".strava-open").getAttribute("aria-busy")==="true"'));
  hold = false;
  release();
  await wait('!!document.querySelector(".training-ask.open dl") && document.querySelector("dl").getAttribute("aria-busy")==="false"');
  await call('press', 'Escape');

  // A fresh document exercises cold font loading and the opening transition.
  await call('open', url);
  await enter();
  await wait('document.querySelector(".strava-sub").innerText.includes("/KM")');
  const before = requests;
  nextSummary = updated;
  await read(`${sample} return true;`);
  await call('click', '.strava-open');
  await wait('window.__samples.length>20');
  const samples = await read('return window.__samples');
  writeFileSync(path.join(out, 'opening-frames.json'), JSON.stringify(samples, null, 2));
  const range = key => Math.max(...samples.map(s => s[key])) - Math.min(...samples.map(s => s[key]));
  check('opening stays at one vertical position', range('y') < 0.5 && range('height') < 0.5, { topRange: range('y'), heightRange: range('height') });
  check('opening does not request another summary', requests === before, { before, after: requests });
  check('numbers stay stable through opening', new Set(samples.map(s => s.values)).size === 1);
  const visibleValues = await read('return document.querySelector(".training-ask-preview").innerText');
  const cardBefore = await read('return document.querySelector(".strava-cap").innerText');
  await call('screenshot', path.join(out, 'desktop-invitation.png'));
  // Wait for the real page-owned interval, without clicking or requesting data ourselves.
  try {
    await wait(`document.querySelector('.strava-cap').innerText!==${JSON.stringify(cardBefore)}`);
    check('background refresh updates the card without another click', true, requests);
  } catch {
    check('background refresh updates the card without another click', false, requests);
  }
  check('background refresh leaves the open invitation unchanged', await read(`return document.querySelector('.training-ask-preview').innerText===${JSON.stringify(visibleValues)}`));
  await call('press', 'Escape');
  check('Escape restores focus to the activity button', await read('return document.activeElement===document.querySelector(".strava-open")'));
  await call('click', '.strava-open');
  await wait('!!document.querySelector(".training-ask.open")');
  check('next opening uses the refreshed data', await read('return document.querySelector(".training-ask-preview").innerText.includes("94.9 km")'));
  for (const [width, height] of [[390,844], [320,568], [844,390]]) {
    await call('viewport', String(width), String(height));
    const fits = await read('const p=document.querySelector(".training-ask-plate"), r=p.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&p.scrollWidth<=p.clientWidth+1');
    check(`${width}x${height}: invitation fits`, fits);
  }
  await call('press', 'Escape');
  await call('viewport', '1440', '900');
  await read(`
    window.__originalFontLoad=document.fonts.load;
    window.__fontReleases=[];
    document.fonts.load=()=>new Promise(resolve=>window.__fontReleases.push(resolve));
    return true;
  `);
  await call('click', '.strava-open');
  await wait('!!document.querySelector(".training-ask.open.font-fallback") && +getComputedStyle(document.querySelector(".training-ask-plate")).opacity===1');
  check('stalled fonts reveal a readable fallback', true);
  const fallbackBox = await read('return document.querySelector(".training-ask-plate").getBoundingClientRect().toJSON()');
  await read('window.__fontReleases.forEach(resolve=>resolve([])); return true;');
  const lateFonts = await read('const p=document.querySelector(".training-ask-plate"),r=p.getBoundingClientRect();return {fallback:!!p.closest(".font-fallback"),font:getComputedStyle(p.querySelector("h2")).fontFamily,y:r.y,height:r.height}');
  check('late fonts cannot resize the open fallback', lateFonts.fallback && lateFonts.font.includes('Georgia') && Math.abs(lateFonts.y-fallbackBox.y)<0.5 && Math.abs(lateFonts.height-fallbackBox.height)<0.5, lateFonts);
  await call('press', 'Escape');
  check('fallback closes and restores focus', await read('return !document.querySelector(".training-ask-plate") && document.activeElement===document.querySelector(".strava-open")'));
  await read('document.fonts.load=window.__originalFontLoad; return true;');
  await call('click', '.strava-open');
  await wait('!!document.querySelector(".training-ask.open:not(.font-fallback)")');
  await call('click', '.training-ask-go');
  await wait('location.pathname==="/training" && !!document.querySelector(".tr-ready")');
  check('View training log opens the training page', true);
  }
  await call('tab', 'new', 'readiness');
  for (const [width, height] of [[1440,900], [900,900], [390,844], [320,568]]) {
    await call('viewport', String(width), String(height));
    await call('open', `${url}/__readiness/no-vitals`);
    await wait('location.pathname==="/__readiness/no-vitals" && document.documentElement.dataset.trainingFixture==="no-vitals" && document.readyState==="complete" && document.fonts.status==="loaded"');
    await call('snapshot', '--max', '1000');
    const result = await read(`
      const p=document.querySelector('.tr-ready'),r=p.getBoundingClientRect();
      return {labels:[...p.querySelectorAll('.tr-lab')].map(e=>e.innerText),
        overflow:p.scrollWidth>p.clientWidth+1,
        contained:[...p.querySelectorAll('.tr-vital')].every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left && b.right<=r.right}),
        values:[...p.querySelectorAll('.tr-activity-metric .tr-serif')].map(e=>e.innerText)};
    `);
    check(`${width}x${height}: missing-vitals card is filled and fits`, !result.overflow && result.contained && result.labels.length===2 && JSON.stringify(result.values)===JSON.stringify(['7h 05m','13.2km']), result);
    await call('screenshot', path.join(out, `readiness-${width}.png`), '--target', '.tr-ready');
  }
} catch (error) {
  const state = await read('return {url:location.href,ready:document.readyState,fonts:document.fonts.status,fixture:document.documentElement.dataset.trainingFixture,card:document.querySelector(".tr-ready")?.innerText}').catch(() => null);
  writeFileSync(path.join(out, 'failure-state.json'), JSON.stringify(state, null, 2));
  throw error;
} finally {
  await call('stop');
  server.closeAllConnections();
  server.close();
}
const failed = checks.filter(c => !c.pass);
console.log(`${checks.length-failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;

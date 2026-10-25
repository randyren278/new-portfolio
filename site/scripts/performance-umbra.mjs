// Production-build performance probe. All browser work goes through Umbra.
// node scripts/performance-umbra.mjs http://127.0.0.1:4317 output.json [runs=5] [desktop|mobile] [comparison-base]
// A local streaming proxy adds identical timing marks to baseline and candidate.
// PERF_ACTIVITY_FAULT=error|timeout verifies the optional activity fallback.
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [base, output, count = '5', device = 'desktop', comparisonBase] = process.argv.slice(2);
if (!base || !output) throw new Error('Expected base URL and output JSON path');
const profile = `scratch-portfolio-perf-${process.pid}`;
const hook = `<script>window.__portfolioPerf={};new MutationObserver(()=>{const f=document.querySelector('iframe.puff-entrance');if(f&&!window.__portfolioPerf.frameCreated)window.__portfolioPerf.frameCreated=performance.now();if(f?.classList.contains('is-ready')&&!window.__portfolioPerf.introReady){window.__portfolioPerf.introReady=performance.now();requestAnimationFrame(()=>window.__portfolioPerf.introPaintOpportunity=performance.now())}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});</script>`;
function proxy(target) {
return http.createServer((req, res) => {
  if (req.url === '/api/training/summary' && process.env.PERF_ACTIVITY_FAULT) {
    const fault = process.env.PERF_ACTIVITY_FAULT;
    const timer = setTimeout(() => {
      res.writeHead(fault === 'error' ? 503 : 200, { 'content-type': 'application/json' });
      res.end('null');
    }, fault === 'timeout' ? 12000 : 0);
    res.on('close', () => clearTimeout(timer));
    return;
  }
  const upstream = http.request(new URL(req.url, target), { headers: { ...req.headers, host: new URL(target).host, 'accept-encoding': 'identity' } }, response => {
    const type = response.headers['content-type'] || '';
    const html = type.includes('text/html');
    const script = req.url.startsWith('/puff-intro/') && req.url.endsWith('.js');
    const headers = { ...response.headers };
    delete headers['content-length'];
    delete headers['content-encoding'];
    res.writeHead(response.statusCode, headers);
    let injected = false;
    if (script) res.write(`performance.mark(${JSON.stringify(`${req.url}:start`)});\n`);
    response.on('data', chunk => {
      if (html && !injected && chunk.includes(Buffer.from('<head>'))) {
        res.write(chunk.toString().replace('<head>', `<head>${hook}`));
        injected = true;
      } else res.write(chunk);
    });
    response.on('end', () => {
      if (script) res.write(`\nperformance.mark(${JSON.stringify(`${req.url}:end`)});`);
      res.end();
    });
  });
  upstream.on('error', error => { res.writeHead(502); res.end(error.message); });
  req.pipe(upstream);
});
}
const arms = [];
for (const target of [base, comparisonBase].filter(Boolean)) {
  const server = proxy(target);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  arms.push({ target, server, url: `http://127.0.0.1:${server.address().port}` });
}
function umbra(...args) {
  return JSON.parse(execFileSync('umbra', ['--profile', profile, '--json', ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 8e6 }));
}
const probe = `const until=performance.now()+20000;while(!document.querySelector('iframe.is-ready')&&performance.now()<until)await new Promise(r=>setTimeout(r,20));const f=document.querySelector('iframe'),w=f?.contentWindow;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const nav=performance.getEntriesByType('navigation')[0];return {url:location.pathname,activity:document.querySelector(".strava-sub")?.textContent,marks:window.__portfolioPerf,nav:nav.toJSON(),resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd,bytes:r.encodedBodySize,transfer:r.transferSize})),frame:w?{scene:w.spaceScene?.mode,nav:w.performance.getEntriesByType('navigation')[0].toJSON(),marks:w.performance.getEntriesByType('mark').map(m=>({name:m.name,at:m.startTime})),resources:w.performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,start:r.startTime,end:r.responseEnd,bytes:r.encodedBodySize})),sprites:Object.fromEntries(Object.entries(w.PuffPixels?.sprites||{}).map(([k,v])=>[k,{frames:v.frames.length,canvases:v.canvases.size}]))}:null}`;
const results = [];
try {
  // Use async child processes so this process can keep serving proxy requests.
  const { promisify } = await import('node:util');
  const { execFile } = await import('node:child_process');
  const run = promisify(execFile);
  const call = async (...args) => JSON.parse((await run('umbra', ['--profile', profile, '--json', ...args], { timeout: 60000, maxBuffer: 8e6 })).stdout);
  await call('tab', 'new', 'measure');
  await call('viewport', ...(device === 'mobile' ? ['390', '844', '--mobile'] : ['1440', '900']));
  for (let i = 0; i < Number(count); i++) {
    for (const arm of (i % 2 ? [...arms].reverse() : arms)) {
    await call('open', `${arm.url}/?perf-sample=${i}`);
    const result = await call('eval', process.env.PERF_ACTIVITY_FAULT
      ? probe.replace('const nav=performance', 'const deadline=performance.now()+10000;while(document.querySelector(".strava-sub")?.textContent==="loading activity"&&performance.now()<deadline)await new Promise(r=>setTimeout(r,25));const nav=performance')
      : probe);
    if (!result.value.marks?.introReady) throw new Error('Intro never became ready');
    results.push({ ...result.value, base: arm.target, sample: i });
    writeFileSync(output, JSON.stringify({ base, comparisonBase, device, profile, results }, null, 2));
    console.log(JSON.stringify({ base: arm.target, sample: i, ...result.value.marks, ttfb: result.value.nav.responseStart, scene: result.value.frame?.scene }));
    }
  }
} finally {
  for (const arm of arms) arm.server.close();
  try { umbra('stop'); } catch {}
}

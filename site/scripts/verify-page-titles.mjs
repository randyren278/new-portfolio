// Check server-rendered and settled browser titles through Umbra/WebKit.
// node scripts/verify-page-titles.mjs BASE_URL EVIDENCE_DIRECTORY
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [base, directory] = process.argv.slice(2);
if (!base || !directory) throw new Error('Expected base URL and evidence directory');
const out = path.resolve(directory), profile = `scratch-page-titles-${process.pid}`, checks = [];
mkdirSync(out, { recursive: true });
function call(...args) {
  return JSON.parse(execFileSync('umbra', ['--profile', profile, '--json', ...args], {
    encoding: 'utf8', timeout: 45000, maxBuffer: 4e6,
  }));
}
const read = source => call('eval', source).value;
const wait = condition => call('wait', '--js', condition, '--timeout', '30');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}
try {
  for (const [index, route] of ['/', '/game', '/training', '/preview', '/privacy.html', '/puff-intro/index.html', '/puff-up/game/index.html', '/title-check-missing'].entries()) {
    // A fresh tab prevents a training router.refresh from racing a new navigation.
    call('tab', 'new', `titles-${index}`);
    const navigation = call('open', new URL(route, base).href);
    wait(`location.pathname===${JSON.stringify(route)}&&document.readyState==='complete'`);
    if (route === '/game') wait('window.puffUp?.state==="game"');
    if (route === '/training') wait('!!document.querySelector(".training-page")');
    check(`${route}: expected HTTP status`, navigation.status === (route === '/title-check-missing' ? 404 : 200), navigation.status);
    const rendered = read(`const response=await fetch(location.href);const html=await response.text();const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('title')].filter(e=>e.namespaceURI==='http://www.w3.org/1999/xhtml').map(e=>e.textContent)`);
    check(`${route}: server titles are Randy Ren`, rendered.length > 0 && rendered.every(t => t === 'Randy Ren'), rendered);
    const title = read('return document.title');
    check(`${route}: browser title is Randy Ren`, title === 'Randy Ren', title);
    if (route === '/game') {
      call('click', '#back');
      wait('location.pathname==="/"&&!window.puffUp&&!document.querySelector(".bento-page").inert');
      check('game exit keeps Randy Ren', read('return document.title') === 'Randy Ren');
      call('click', '.correspondence-puff', '--count', '2');
      wait('window.puffUp?.state==="invite"');
      call('click', '#play');
      wait('window.puffUp?.state==="game"&&window.puffUp.gameRunning');
      check('discovered game keeps Randy Ren', read('return document.title') === 'Randy Ren');
    }
  }
} catch (error) {
  check('verification execution', false, error.stack);
} finally {
  call('stop');
}
process.exitCode = checks.every(c => c.pass) ? 0 : 1;

import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [base, outArg] = process.argv.slice(2),
  out = path.resolve(outArg),
  profile = `scratch-game-route-${process.pid}`,
  checks = [],
  commands = [];
mkdirSync(out, { recursive: true });
function cmd(...args) {
  const result = JSON.parse(
    execFileSync(
      'umbra',
      ['--profile', profile, ...(args[0] === 'stop' ? [] : ['--tab', 'game']), ...args, '--json'],
      { encoding: 'utf8', timeout: 35000, maxBuffer: 15000000 },
    ),
  );
  commands.push({ args, result });
  return result;
}
const read = (s) => cmd('eval', s).value,
  wait = (s) => cmd('wait', '--js', s, '--timeout', '15');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  assert.ok(pass, name);
  console.log('PASS ' + name);
}
const game = () =>
  wait('location.pathname==="/game"&&window.puffUp?.state==="game"&&window.puffUp.gameRunning');
const home = (pathname) =>
  wait(
    `location.pathname===${JSON.stringify(pathname)}&&!window.puffUp&&!document.querySelector('.bento-page').inert&&!document.querySelector('.puff-entrance')`,
  );
// Same-document WebKit history does not emit didFinish; verify the destination
// independently while Umbra issues the real browser navigation.
function historyMove(direction, destination) {
  const child = spawn('umbra', ['--profile', profile, '--tab', 'game', direction, '--json'], {
    stdio: 'ignore',
  });
  try {
    destination();
    commands.push({
      args: [direction],
      observed: read('return {url:location.href,state:window.puffUp?.state}'),
    });
  } finally {
    child.kill();
  }
}
function discover() {
  cmd('click', '.correspondence-puff', '--count', '2');
  wait('window.puffUp?.state==="invite"');
  cmd('click', '#play');
}
try {
  for (const [name, w, h, mobile] of [
    ['desktop', 1440, 1000, false],
    ['mobile', 390, 844, true],
  ]) {
    cmd('open', base + '/');
    cmd('viewport', String(w), String(h), ...(mobile ? ['--mobile'] : []));
    cmd('reload');
    wait('!!document.querySelector("iframe.is-ready")');
    cmd('click', '.explore-button');
    wait('!document.querySelector(".puff-entrance")');
    discover();
    game();
    check(
      name + ': approved entry changes address to /game',
      read('return document.title==="Puff Up · Randy Ren"&&window.puffUp.hero.finished'),
      read('return window.puffUp'),
    );
    historyMove('back', () => home('/'));
    check(
      name + ': browser Back restores portfolio',
      read(
        'return getComputedStyle(document.querySelector(".bento-page")).visibility==="visible"&&document.body.style.overflow!=="hidden"',
      ),
    );
    historyMove('forward', game);
    check(
      name + ': browser Forward reopens playable /game',
      read('return !document.querySelector(".puff-entrance")'),
    );
    historyMove('back', () => wait('location.pathname==="/"&&window.puffUp?.state==="returning"'));
    historyMove('forward', game);
    wait('window.puffUp?.phase==="playing"');
    check(
      name + ': immediate Forward cancels a pending Back transition',
      read(
        'return location.pathname==="/game"&&document.querySelectorAll(".puff-game").length===1',
      ),
    );
    cmd('click', '#back');
    home('/');
    discover();
    game();
    cmd('reload');
    game();
    check(
      name + ': refreshing /game opens game without invitation or portfolio intro',
      read(
        'return !document.querySelector(".puff-entrance")&&!document.getElementById("invite").open',
      ),
    );
    cmd('screenshot', path.join(out, name + '-direct-game.png'));
    cmd('click', '#back');
    home('/');
    check(name + ': direct game exit restores portfolio without replaying intro', true);
    discover();
    wait('window.puffUp?.state==="entering"');
    cmd('click', '#back');
    home('/');
    check(name + ': canceled entry keeps the original URL', true);
    cmd('open', base + '/game');
    game();
    check(
      name + ': shared /game link starts directly',
      read('return document.querySelector("link[rel=canonical]").href.endsWith("/game")'),
    );
    cmd('open', base + '/robots.txt');
    historyMove('back', game);
    check(name + ': returning from another page restores a playable game URL', true);
    cmd('click', '#back');
    home('/');
    const errors = cmd('console', '--level', 'error');
    check(name + ': no runtime errors', errors.count === 0, errors);
  }
  cmd('open', base + '/preview');
  wait('!!document.querySelector("iframe.is-ready")');
  cmd('click', '.explore-button');
  wait('!document.querySelector(".puff-entrance")');
  discover();
  game();
  cmd('click', '#back');
  home('/preview');
  check('preview entry returns to its original route', true);
  const response = await fetch(base + '/game');
  check(
    'direct route has HTTP200 and game metadata',
    response.status === 200 && (await response.text()).includes('Puff Up · Randy Ren'),
  );
} catch (error) {
  try {
    commands.push({
      failureState: read(
        'return {url:location.href,title:document.title,puff:window.puffUp,roots:[...document.querySelectorAll(".puff-game")].map(x=>({hidden:x.hidden,state:x.dataset.state})),history:history.state,html:document.querySelector(".bento-page")?.outerHTML.slice(0,1000)}',
      ),
    });
    cmd('screenshot', path.join(out, 'failure.png'));
  } catch {}
  checks.push({ name: 'verifier execution', pass: false, error: error.stack });
  process.exitCode = 1;
  console.error(error.message);
} finally {
  try {
    cmd('stop');
  } catch {}
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  writeFileSync(path.join(out, 'commands.json'), JSON.stringify(commands, null, 2));
}

import assert from 'node:assert/strict';
import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [base = 'http://127.0.0.1:4345', output = '../output/puff-up-release'] =
    process.argv.slice(2),
  out = path.resolve(output),
  profile = `scratch-puff-release-${process.pid}`,
  checks = [],
  commands = [];
mkdirSync(out, { recursive: true });
function cmd(...args) {
  const r = JSON.parse(
    execFileSync(
      'umbra',
      [
        '--profile',
        profile,
        ...(args[0] === 'stop' ? [] : ['--tab', 'release']),
        ...args,
        '--json',
      ],
      { encoding: 'utf8', timeout: 45000, maxBuffer: 20000000 },
    ),
  );
  commands.push({ args, result: r });
  return r;
}
const read = (source) => cmd('eval', source).value,
  wait = (condition) => cmd('wait', '--js', condition, '--timeout', '20');
function check(name, condition, evidence) {
  checks.push({ name, pass: !!condition, evidence });
  assert.ok(condition, name);
  console.log('PASS ' + name);
}
const strings = (v) =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
function ref(name) {
  const line = strings(cmd('snapshot', '--interactive'))
    .join('\n')
    .split('\n')
    .find((s) => s.includes('button "' + name + '"') && s.includes('[ref='));
  assert.ok(line, 'Native ref for ' + name);
  return line.match(/\[ref=([^\]]+)\]/)[1];
}
function openInvite() {
  cmd('click', '.correspondence-puff', '--count', '2');
  wait('window.puffUp?.state==="invite"');
}
try {
  for (const [name, width, height, mobile] of [
    ['desktop', 1440, 1000, false],
    ['mobile', 390, 844, true],
  ]) {
    cmd('open', base + '/');
    cmd('viewport', String(width), String(height), ...(mobile ? ['--mobile'] : []));
    cmd('reload');
    wait('!!document.querySelector("iframe.is-ready")');
    cmd('click', '.explore-button');
    wait('!document.querySelector(".puff-entrance")');
    check(
      name + ': normal intro leaves real portfolio interactive',
      read('return !document.querySelector(".bento-page").inert'),
    );
    check(
      name + ': game is absent before discovery',
      read(
        'return !window.puffUp&&!performance.getEntriesByType("resource").some(r=>r.name.includes("/puff-up/"))',
      ),
    );
    cmd('click', '.correspondence-puff');
    check(
      name + ': first Puff tap keeps greeting',
      read('return !document.querySelector(".puff-game")'),
    );
    const time = read('return performance.now()');
    wait(`performance.now()>${time + 1200}`);
    cmd('click', '.correspondence-puff');
    wait('window.puffUp?.state==="invite"');
    const focus = read(
      'return {id:document.activeElement.id,play:getComputedStyle(document.getElementById("play")).outlineStyle,mounted:window.puffUp.gameMounted}',
    );
    check(
      name + ': second tap opens concise unfocused Play invitation',
      focus.id === 'invite-title' && focus.play === 'none' && !focus.mounted,
      focus,
    );
    cmd('press', 'Escape');
    wait('!window.puffUp');
    check(
      name + ': declining fully cleans invitation and focus',
      read(
        'return !document.querySelector(".puff-game")&&document.activeElement.classList.contains("correspondence-puff")&&document.body.style.overflow!=="hidden"',
      ),
    );
    const photos = read(
      'return [...document.querySelectorAll(".photo-current")].map(e=>e.currentSrc)',
    );
    openInvite();
    const savedScroll = read('return window.puffUp.returnScroll');
    cmd('click', '#play');
    wait('window.puffUp?.phase==="blast-off"');
    const hero = read('return window.puffUp.hero');
    check(name + ': approved close-up precedes boost', hero.current.width > hero.from.width, hero);
    wait('window.puffUp?.state==="game"&&window.puffUp.gameRunning');
    const scene = read(
      'const d=document.getElementById("game").contentDocument,c=document.querySelector("#space-layer canvas").getBoundingClientRect();return {stars:window.puffUp.staticStars,w:c.width,h:c.height,frame:document.getElementById("game").src,arrows:getComputedStyle(d.querySelector(".steering")).display,background:getComputedStyle(d.querySelector(".pause-label")).backgroundColor}',
    );
    check(
      name + ': full-screen star scene and real game load',
      scene.w === width &&
        scene.h === height &&
        scene.stars === Math.max(48, Math.min(280, Math.round((width * height) / 7500))) &&
        scene.frame.endsWith('/puff-up/game/index.html'),
      scene,
    );
    check(
      name + ': pause/results card is neutral charcoal',
      /^rgba?\(24, 24, 24/.test(scene.background),
      scene.background,
    );
    check(
      name + ': phone uses screen steering and desktop retains buttons',
      mobile ? scene.arrows === 'none' : scene.arrows === 'flex',
      scene.arrows,
    );
    cmd('press', 'Escape');
    wait('!window.puffUp.gameRunning');
    const paused = read(
      'const w=document.getElementById("game").contentWindow;return {visible:!w.document.getElementById("pause-label").hidden,keys:w.puffClimb.inputs}',
    );
    check(
      name + ': pause clears steering',
      paused.visible &&
        !paused.keys.screenPointers &&
        !paused.keys.screenAxis &&
        paused.keys.keys.length === 0,
      paused,
    );
    cmd('press', 'Space');
    wait('window.puffUp.gameRunning');
    const x = read('return document.getElementById("game").contentWindow.puffClimb.run.player.x');
    if (mobile) {
      cmd('click', '#game-canvas');
    } else cmd('click', ref('Move right'));
    // A trusted click has a short directional pulse; observe the next physics frame.
    wait(`document.getElementById('game').contentWindow.puffClimb.run.player.x>${x}+.1`);
    check(name + ': native pointer steering changes position', true, {
      before: x,
      after: read('return document.getElementById("game").contentWindow.puffClimb.run.player.x'),
    });
    cmd('screenshot', path.join(out, name + '-game.png'));
    cmd('click', '#back');
    wait('!window.puffUp');
    const restored = read(
      'const p=document.querySelector(".bento-page");return {inert:p.inert,opacity:getComputedStyle(p).opacity,transform:getComputedStyle(p).transform,overflow:document.body.style.overflow,y:scrollY,photos:[...document.querySelectorAll(".photo-current")].map(e=>e.currentSrc),focus:document.activeElement.className}',
    );
    check(
      name + ': return restores real page, photos, scroll and focus',
      !restored.inert &&
        restored.opacity === '1' &&
        restored.transform === 'none' &&
        restored.overflow !== 'hidden' &&
        Math.abs(restored.y - savedScroll.y) <= 1 &&
        JSON.stringify(restored.photos) === JSON.stringify(photos) &&
        restored.focus.includes('correspondence-puff'),
      restored,
    );
    cmd('click', '.projects-row');
    wait('!!document.querySelector(".projects-plate.open")');
    check(
      name + ': projects still open after game',
      read('return !!document.querySelector(".projects-plate-title")?.textContent.trim()'),
    );
    cmd('press', 'Escape');
    wait('!document.querySelector(".projects-plate")');
    cmd('click', '.cell-photo-a .photo-flip');
    wait('document.querySelector(".cell-photo-a").classList.contains("flipped")');
    check(name + ': photo controls remain live', true);
    cmd('press', 'Escape');
    openInvite();
    cmd('click', '#play');
    wait('window.puffUp?.state==="entering"');
    cmd('click', '#back');
    wait('!window.puffUp');
    const canceledAt = read('return performance.now()');
    wait(`performance.now()>${canceledAt + 1300}`);
    check(
      name + ': entry cancellation leaves no late frame or inert page',
      read(
        'return !document.querySelector(".puff-game")&&!document.querySelector(".bento-page").inert',
      ),
    );
    openInvite();
    cmd('click', '#play');
    wait('window.puffUp?.state==="game"');
    cmd('open', base + '/robots.txt');
    cmd('back');
    wait('!!document.querySelector(".bento-page")');
    check(
      name + ': browser Back does not restore a trapped game',
      read(
        'return !window.puffUp&&(!document.querySelector(".puff-game")||document.querySelector(".puff-game").hidden)&&(!document.querySelector(".bento-page").inert||!!document.querySelector(".puff-entrance"))',
      ),
    );
    const errors = cmd('console', '--level', 'error');
    check(name + ': no browser errors', errors.count === 0, errors);
  }
  for (const asset of [
    '/puff-up/entry.js',
    '/puff-up/space-scene.js',
    '/puff-up/game/index.html',
    '/puff-up/game/touch-steering.js',
  ]) {
    const response = await fetch(base + asset);
    check(asset + ': publicly served', response.status === 200, {
      status: response.status,
      type: response.headers.get('content-type'),
    });
  }
  const scene = await (await fetch(base + '/puff-up/space-scene.js')).text();
  check('game space contains no planets', !scene.includes('planet'));
} catch (error) {
  checks.push({ name: 'verifier', pass: false, error: error.stack });
  process.exitCode = 1;
  console.error(error.message);
} finally {
  try {
    cmd('stop');
  } catch {}
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  writeFileSync(path.join(out, 'commands.json'), JSON.stringify(commands, null, 2));
}

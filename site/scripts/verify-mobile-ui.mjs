// WebKit user paths plus explicit text/safe-area layout stress fixtures.
// node scripts/verify-mobile-ui.mjs http://localhost:4361 /absolute/evidence-dir
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [base, directory] = process.argv.slice(2);
if (!base || !directory) throw new Error('Expected base URL and evidence directory');
const out = path.resolve(directory), profile = `scratch-mobile-ui-${process.pid}`, checks = [];
mkdirSync(out, { recursive: true });
function call(...args) {
  return JSON.parse(execFileSync('umbra', ['--profile', profile, '--json', ...args], {
    encoding: 'utf8', timeout: 45000, maxBuffer: 8e6,
  }));
}
const read = source => call('eval', source).value;
const wait = condition => call('wait', '--js', condition, '--timeout', '30');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}
const screenshot = name => call('screenshot', path.join(out, `${name}.png`));
const overlap = (a, b) => a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
function gameGeometry() {
  return read(`
    const d=document.querySelector('#game').contentDocument;
    const items=[document.querySelector('#back'),...['.height-hud','.sound-toggle','.pause-label','.touch-controls'].map(s=>d.querySelector(s))];
    return items.map(e=>({id:e.id||e.className,...e.getBoundingClientRect().toJSON(),visible:!e.hidden&&e.ownerDocument.defaultView.getComputedStyle(e).visibility!=='hidden'}));
  `);
}
function clearBoxes(label, boxes) {
  const visible = boxes.filter(b => b.visible && b.width && b.height);
  check(`${label}: chrome stays in viewport`, visible.every(b => b.left >= -.5 && b.top >= -.5 && b.right <= viewportWidth + .5 && b.bottom <= viewportHeight + .5), boxes);
  const collisions = visible.flatMap((a, i) => visible.slice(i + 1).filter(b => overlap(a, b)).map(b => [a.id, b.id]));
  check(`${label}: chrome does not overlap`, !collisions.length, collisions);
  if (visible.some(b => b.id === 'pause-label')) {
    const button = read(`
      const d=document.querySelector('#game').contentDocument,e=d.querySelector('#play-toggle'),r=e.getBoundingClientRect(),card=d.querySelector('#pause-label').getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      return {fits:r.top>=card.top&&r.bottom<=card.bottom&&r.left>=card.left&&r.right<=card.right,hits:[[0,0],[-21.5,0],[21.5,0],[0,-21.5],[0,21.5]].every(([dx,dy])=>e.contains(d.elementFromPoint(x+dx,y+dy)))};
    `);
    check(`${label}: primary button fully visible and tappable`, button.fits && button.hits, button);
  }
}
const pageGeometry = `
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width&&r.height&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[inert]')&&!e.matches(':disabled')};
  return {overflow:document.documentElement.scrollWidth-innerWidth,small:[...document.querySelectorAll('button,a[href]')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width<43.99||r.height<43.99}).map(e=>({text:e.textContent.trim().slice(0,60),...e.getBoundingClientRect().toJSON()}))};
`;
function pageCheck(label) {
  const geometry = read(pageGeometry);
  check(`${label}: no horizontal overflow`, geometry.overflow <= 1, geometry.overflow);
  check(`${label}: controls at least 44 by 44`, !geometry.small.length, geometry.small);
}
let viewportWidth, viewportHeight;
try {
  call('tab', 'new', 'mobile-ui');
  for (const [w, h] of [[320,568],[360,640],[375,667],[390,844],[430,932],[720,1024],[721,1024],[844,390],[667,375],[568,320],[1440,900]]) {
    viewportWidth = w; viewportHeight = h;
    const label = `${w}x${h}`, compact = w <= 720 || (w <= 1000 && h <= 500);
    call('viewport', String(w), String(h), ...(w < 1100 ? ['--mobile'] : []));
    call('open', `${base}/game?audit=${label}`);
    wait('window.puffUp?.state==="game"&&window.puffUp.gameRunning');
    call('press', 'Escape');
    wait('!window.puffUp.gameRunning');
    clearBoxes(`${label}/pause`, gameGeometry());
    check(`${label}: instructions match controls`, read(`return document.querySelector('#game').contentDocument.querySelector('#overlay-copy').textContent.includes(${JSON.stringify(compact ? 'Tap Resume' : 'Space')})`));
    if (w === 390 || h === 320) screenshot(`${label}-pause`);
    // Freeze the game and render the longest plausible labels, without
    // modifying physics or claiming the fixture is an earned score.
    read(`const d=document.querySelector('#game').contentDocument;d.querySelector('#pause-label').hidden=true;d.querySelector('.height-hud').hidden=false;d.querySelector('#height-score').textContent='999999';const s=d.querySelector('#streak-meter');s.hidden=false;s.textContent='×999';return true`);
    clearBoxes(`${label}/long-score`, gameGeometry());
    const hit = read(`
      const d=document.querySelector('#game').contentDocument;
      return [document.querySelector('#back'),d.querySelector('#sound-toggle'),d.querySelector('#bot-toggle'),d.querySelector('#restart')].map(e=>{
        const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
        return {id:e.id,w:r.width,h:r.height,hits:[[0,0],[-21.5,0],[21.5,0],[0,-21.5],[0,21.5]].every(([dx,dy])=>e.contains(e.ownerDocument.elementFromPoint(x+dx,y+dy)))};
      });
    `);
    check(`${label}: game buttons have unobstructed 44px targets`, hit.every(b => b.w >= 44 && b.h >= 44 && b.hits), hit);
    if (compact) {
      const [back, , sound] = gameGeometry();
      check(`${label}: Back and Sound align`, Math.abs(back.top - sound.top) < 1 && back.height === sound.height);
    }
    if (w === 390) {
      screenshot(`${label}-long-score`);
      // Simulate an iPhone host safe-area while leaving the iframe inset at 0.
      read(`const s=document.createElement('style');s.id='audit-notch';s.textContent='.puff-game #back{top:59px!important;left:32px!important}';document.head.append(s);dispatchEvent(new Event('resize'));return true`);
      wait('document.querySelector("#game").contentDocument.documentElement.style.getPropertyValue("--game-header-top")==="59px"');
      clearBoxes(`${label}/host-notch`, gameGeometry());
      screenshot(`${label}-host-notch`);
      read(`document.querySelector('#audit-notch').remove();dispatchEvent(new Event('resize'));return true`);
    }
    const soundBefore = read(`return document.querySelector('#game').contentDocument.querySelector('#sound-toggle').textContent`);
    call('click', '#sound-toggle');
    check(`${label}: sound responds to a trusted tap`, read(`return document.querySelector('#game').contentDocument.querySelector('#sound-toggle').textContent`)!==soundBefore);
    call('click', '#restart');
    wait('window.puffUp.gameRunning');
    if (h <= 390) {
      wait('document.querySelector("#game").contentWindow.puffClimb.run.status==="over"&&!document.querySelector("#game").contentDocument.querySelector("#pause-label").hidden');
      clearBoxes(`${label}/results`, gameGeometry());
      screenshot(`${label}-results`);
      call('click', '#play-toggle');
      wait('window.puffUp.gameRunning');
      check(`${label}: results retry responds to a trusted tap`, true);
    }
    call('click', '#back');
    wait('location.pathname==="/"&&!window.puffUp&&!document.querySelector(".bento-page").inert');
    check(`${label}: exit restores portfolio`, read('return !document.querySelector(".puff-entrance")&&document.body.style.overflow!=="hidden"'));
  }
  call('viewport', '390', '844', '--mobile');
  call('open', `${base}/game?audit=rotation`);
  wait('window.puffUp?.state==="game"&&window.puffUp.gameRunning');
  call('press', 'Escape');
  read('window.auditGameFrame=document.querySelector("#game");return true');
  for (const [w,h] of [[844,390],[390,844]]) {
    viewportWidth=w; viewportHeight=h;
    call('viewport', String(w), String(h), '--mobile');
    wait(`document.querySelector('#game').contentWindow.innerWidth===${w}`);
    clearBoxes(`rotation/${w}x${h}`, gameGeometry());
    check(`rotation/${w}x${h}: same paused game survives`, read('return document.querySelector("#game")===window.auditGameFrame&&!window.puffUp.gameRunning&&!document.querySelector("#game").contentDocument.querySelector("#pause-label").hidden'));
  }
  call('click', '#play-toggle');
  wait('window.puffUp.gameRunning');
  check('rotation: trusted Resume starts the existing game', true);
  call('click', '#back');
  wait('location.pathname==="/"&&!window.puffUp');
  for (const [w,h] of [[320,568],[360,640],[390,844],[430,932],[720,1024],[721,1024],[844,390],[667,375]]) {
    const label = `${w}x${h}`;
    call('viewport', String(w), String(h), '--mobile');
    call('open', `${base}/?audit=${label}`);
    wait('!!document.querySelector("iframe.is-ready")');
    for (const scene of ['space','pool','kite']) {
      if (read('return !document.querySelector("iframe")')) {
        call('click', 'text=Return to intro');
        wait('!!document.querySelector("iframe.is-ready")');
      }
      const sceneSearch = `?scene=${scene}&audit=${label}-${scene}`;
      read(`document.querySelector('iframe').src='/puff-intro/index.html${sceneSearch}';return true`);
      wait(`document.querySelector('iframe')?.contentWindow?.location.search===${JSON.stringify(sceneSearch)}&&document.querySelector('iframe')?.contentDocument?.readyState==='complete'&&document.querySelector('iframe')?.contentWindow?.spaceScene?.mode==='${scene}'`);
      read(`const d=document.querySelector('iframe').contentDocument;await d.fonts.ready;await new Promise(r=>d.defaultView.requestAnimationFrame(()=>d.defaultView.requestAnimationFrame(r)));return true`);
      const intro = read(`const d=document.querySelector('iframe').contentDocument;return [...d.querySelectorAll('#light-button','.explore-button','#scene-effect')].map(e=>({id:e.id||e.className,...e.getBoundingClientRect().toJSON()}))`);
      check(`${label}/${scene}: intro controls fit and meet 44px`, intro.every(r => r.left >= 0 && r.right <= w && r.top >= 0 && r.bottom <= h && r.width >= 44 && r.height >= 44), intro);
      call('click', '.explore-button');
      wait('!document.querySelector("iframe")&&!document.querySelector(".bento-page").inert');
    }
    wait('!document.querySelector(".photo-shuffle").disabled');
    pageCheck(`${label}/portfolio`);
    call('screenshot', path.join(out, `${label}-portfolio.png`), '--full');
    const count = read('return document.querySelectorAll(".projects-row").length');
    for (let i=1; i<=count; i++) {
      call('click', `.projects-row:nth-child(${i})`);
      wait('!!document.querySelector(".projects-plate.open")');
      pageCheck(`${label}/project-${i}`);
      const next = i < count ? 'last-child' : 'first-child';
      call('click', `.projects-plate-nav button:${next}`);
      check(`${label}/project-${i}: navigation responds`, read('return !!document.querySelector(".projects-plate-title")?.textContent.trim()'));
      call('click', '.projects-plate-close');
      wait('!document.querySelector(".projects-plate")');
    }
    call('click', '.cell-photo-a .photo-flip');
    wait('document.querySelector(".cell-photo-a").classList.contains("flipped")');
    pageCheck(`${label}/photo-details`);
    call('press', 'Escape');
    wait('!document.querySelector(".cell-photo-a").classList.contains("flipped")');
    call('click', '.strava-open');
    wait('!!document.querySelector(".training-ask.open")&&document.querySelector(".training-ask-preview")?.getAttribute("aria-busy")==="false"');
    pageCheck(`${label}/training-invite`);
    call('click', '.training-ask-go');
    wait('location.pathname==="/training"&&!!document.querySelector(".training-page main svg")');
    pageCheck(`${label}/training`);
    call('screenshot', path.join(out, `${label}-training.png`), '--full');
    call('click', 'text=Back to portfolio');
    wait('location.pathname==="/"&&!document.querySelector(".bento-page").inert');
    check(`${label}: training return bypasses intro`, read('return !document.querySelector("iframe")'));
    const errors = call('console', '--level', 'error');
    check(`${label}: no browser errors`, errors.count === 0, errors);
  }
} catch (error) {
  check('verification execution', false, error.stack);
  try { screenshot('failure'); } catch {}
} finally {
  call('stop');
}
process.exitCode = checks.every(c => c.pass) ? 0 : 1;

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [base, output] = process.argv.slice(2),
  out = path.resolve(output),
  profile = `scratch-neutral-${process.pid}`,
  checks = [],
  commands = [];
mkdirSync(out, { recursive: true });
function cmd(...args) {
  const result = JSON.parse(
    execFileSync(
      'umbra',
      ['--profile', profile, ...(args[0] === 'stop' ? [] : ['--tab', 'site']), ...args, '--json'],
      { encoding: 'utf8', timeout: 40000, maxBuffer: 16000000 },
    ),
  );
  commands.push({ args, result });
  return result;
}
const read = (source) => cmd('eval', source).value,
  wait = (condition) => cmd('wait', '--js', condition, '--timeout', '20');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
}
function neutral(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const hex = color.slice(1);
    return hex.slice(0, 2) === hex.slice(2, 4) && hex.slice(2, 4) === hex.slice(4, 6);
  }
  const channels = color?.match(/[\d.]+/g)?.map(Number);
  return channels?.length >= 3 && channels[0] === channels[1] && channels[1] === channels[2];
}
function colors(name, values) {
  for (const [surface, color] of Object.entries(values))
    check(name + ': ' + surface + ' is neutral', neutral(color), color);
}
try {
  for (const [device, width, height, mobile] of [
    ['desktop', 1440, 1000, false],
    ['mobile', 390, 844, true],
  ]) {
    cmd('open', base + '/');
    cmd('viewport', String(width), String(height), ...(mobile ? ['--mobile'] : []));
    cmd('reload');
    cmd('screenshot', path.join(out, device + '-initial.png'));
    colors(
      device + ' initial',
      read(
        'return {html:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,page:getComputedStyle(document.querySelector(".bento-page")).backgroundColor}',
      ),
    );
    check(
      device + ': browser theme is charcoal',
      read('return document.querySelector("meta[name=theme-color]").content') === '#181818',
    );
    wait('!!document.querySelector("iframe.is-ready")');
    for (let light = 0; light < 3; light++) {
      colors(
        device + ' intro lighting ' + light,
        read(
          'const d=document.querySelector(".puff-entrance").contentDocument;return {entrance:getComputedStyle(d.querySelector("#entrance")).backgroundColor}',
        ),
      );
      cmd('click', '#light-button');
    }
    cmd('click', '.explore-button');
    colors(
      device + ' during intro exit',
      read(
        'return {page:getComputedStyle(document.querySelector(".bento-page")).backgroundColor,body:getComputedStyle(document.body).backgroundColor}',
      ),
    );
    wait('!document.querySelector(".puff-entrance")');
    colors(
      device + ' portfolio',
      read(
        'return {muted:getComputedStyle(document.querySelector(".kicker")).color,rule:getComputedStyle(document.querySelector(".bento-page")).getPropertyValue("--rule")}',
      ),
    );
    cmd('click', '.projects-row');
    wait('!!document.querySelector(".projects-plate.open")');
    colors(
      device + ' project modal',
      read(
        'const e=document.querySelector(".projects-plate");return {panel:getComputedStyle(e).backgroundColor,glass:getComputedStyle(e,"::before").backgroundColor}',
      ),
    );
    cmd('press', 'Escape');
    wait('!document.querySelector(".projects-plate")');
    cmd('click', '.strava-open');
    wait('!!document.querySelector(".training-ask.open")');
    colors(
      device + ' training invitation',
      read(
        'const e=document.querySelector(".training-ask-plate");return {panel:getComputedStyle(e).backgroundColor,glass:getComputedStyle(e,"::before").backgroundColor}',
      ),
    );
    cmd('click', '.training-ask-go');
    const departure = read(
      'const e=document.querySelector(".bento-departure");return e?getComputedStyle(e).backgroundColor:null',
    );
    check(device + ': training curtain neutral', neutral(departure), departure);
    wait('location.pathname==="/training"&&!!document.querySelector(".training-page")');
    colors(
      device + ' training page',
      read(
        'return {body:getComputedStyle(document.body).backgroundColor,page:getComputedStyle(document.querySelector(".training-page")).backgroundColor}',
      ),
    );
    cmd('click', 'text=Back to portfolio');
    wait(
      'location.pathname==="/"&&!!document.querySelector(".bento-page")&&!document.querySelector(".bento-page").inert',
    );
    cmd('click', 'text=Return to intro');
    const replay = read(
      'const e=document.querySelector(".bento-departure");return e?getComputedStyle(e).backgroundColor:null',
    );
    check(device + ': replay curtain neutral', neutral(replay), replay);
    wait('!!document.querySelector("iframe.is-ready")');
    cmd('click', '.explore-button');
    wait('!document.querySelector(".puff-entrance")');
    cmd('click', '.correspondence-puff', '--count', '2');
    wait('window.puffUp?.state==="invite"');
    colors(
      device + ' game invitation',
      read(
        'const e=document.getElementById("invite");return {panel:getComputedStyle(e).backgroundColor,backdrop:getComputedStyle(e,"::backdrop").backgroundColor,buttonBorder:getComputedStyle(document.getElementById("decline")).borderColor}',
      ),
    );
    cmd('screenshot', path.join(out, device + '-invite.png'));
    cmd('click', '#play');
    wait('window.puffUp?.state==="entering"');
    colors(
      device + ' game entry',
      read(
        'return {veil:getComputedStyle(document.getElementById("veil")).backgroundColor,space:getComputedStyle(document.getElementById("space-layer")).backgroundColor}',
      ),
    );
    wait('window.puffUp?.state==="game"');
    cmd('press', 'Escape');
    const card = read(
      'const d=document.getElementById("game").contentDocument,e=d.getElementById("pause-label");return {background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow,select:getComputedStyle(d.getElementById("result-height")).webkitUserSelect,callout:getComputedStyle(d.body).getPropertyValue("-webkit-touch-callout"),calloutSupported:CSS.supports("-webkit-touch-callout","none"),portfolioSelect:getComputedStyle(document.querySelector(".contact-val")).webkitUserSelect}',
    );
    colors(device + ' pause', { background: card.background });
    check(
      device + ': pause/results panel opaque with no heavy shadow',
      card.background === 'rgb(24, 24, 24)' && card.shadow === 'none',
      card,
    );
    if (mobile)
      check(
        'mobile: game text cannot be selected or show copy callouts',
        card.select === 'none' &&
          (!card.calloutSupported || card.callout === 'none') &&
          card.portfolioSelect !== 'none',
        card,
      );
    cmd('screenshot', path.join(out, device + '-pause.png'));
    cmd('click', '#back');
    colors(
      device + ' during game return',
      read(
        'return {veil:getComputedStyle(document.getElementById("veil")).backgroundColor,body:getComputedStyle(document.body).backgroundColor}',
      ),
    );
    wait('!window.puffUp');
    check(
      device + ': return restores interaction',
      read(
        'return !document.querySelector(".bento-page").inert&&document.body.style.overflow!=="hidden"',
      ),
    );
    const errors = cmd('console', '--level', 'error');
    check(device + ': no browser errors', errors.count === 0, errors);
  }
  for (const css of ['/puff-up/game/climb.css']) {
    const response = await fetch(base + css),
      source = await response.text();
    check(
      'iOS game long-press callout suppression is shipped',
      response.ok && source.includes('-webkit-touch-callout: none'),
      { supportedByTestBrowser: false, css },
    );
  }
  for (const scene of ['space', 'pool', 'kite']) {
    cmd('open', base + '/puff-intro/index.html?scene=' + scene);
    wait('!!window.spaceScene?.running');
    colors(
      scene + ' direct intro',
      read(
        'return {entrance:getComputedStyle(document.querySelector("#entrance")).backgroundColor}',
      ),
    );
  }
} catch (error) {
  checks.push({ name: 'verifier execution', pass: false, error: error.stack });
  console.error(error.message);
} finally {
  try {
    cmd('stop');
  } catch {}
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  writeFileSync(path.join(out, 'commands.json'), JSON.stringify(commands, null, 2));
  if (checks.some((c) => !c.pass)) process.exitCode = 1;
  console.log(
    JSON.stringify({
      pass: checks.filter((c) => c.pass).length,
      fail: checks.filter((c) => !c.pass).length,
    }),
  );
}

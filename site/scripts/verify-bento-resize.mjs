// Resize the same WebKit document: fresh loads miss stale intrinsic row sizes.
// node scripts/verify-bento-resize.mjs BASE_URL EVIDENCE_DIRECTORY
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [base, directory] = process.argv.slice(2);
if (!base || !directory) throw new Error('Expected base URL and evidence directory');
const out = path.resolve(directory);
const profile = `scratch-bento-resize-${process.pid}`;
const checks = [];
mkdirSync(out, { recursive: true });
function call(...args) {
  return JSON.parse(execFileSync('umbra', ['--profile', profile, '--json', ...args], {
    encoding: 'utf8', timeout: 45000, maxBuffer: 8e6,
  }));
}
const read = source => call('eval', source).value;
const wait = condition => call('wait', '--js', condition, '--timeout', '20');
function check(name, pass, evidence) {
  checks.push({ name, pass: !!pass, evidence });
  writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ base, checks }, null, 2));
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(evidence)}`);
}
const geometry = `
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const cells = [...document.querySelectorAll('.bento-grid .cell')];
  const rects = cells.map(e => e.getBoundingClientRect());
  const contains = (outer, inner) => inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1;
  const clipped = cells.filter(e => !e.classList.contains('cell-photo')).flatMap(cell => {
    const r = cell.getBoundingClientRect(), s = getComputedStyle(cell);
    const content = {left:r.left + parseFloat(s.paddingLeft) + 1, right:r.right - parseFloat(s.paddingRight) - 1, top:r.top + parseFloat(s.paddingTop) + 1, bottom:r.bottom - parseFloat(s.paddingBottom) - 1};
    return [...cell.children].filter(e => getComputedStyle(e).position !== 'absolute')
      .filter(e => !contains(content, e.getBoundingClientRect()))
      .map(e => ({cell:cell.className, child:e.className, box:e.getBoundingClientRect().toJSON(), content}));
  });
  const list = document.querySelector('.projects-list'), listRect = list.getBoundingClientRect();
  const projectOverflow = list.lastElementChild.getBoundingClientRect().bottom > listRect.bottom + 1;
  return {
    width:innerWidth, height:innerHeight,
    columns:getComputedStyle(document.querySelector('.bento-grid')).gridTemplateColumns.split(' ').length,
    horizontalOverflow:document.documentElement.scrollWidth > innerWidth + 1,
    overlap:rects.some((a,i) => rects.slice(i+1).some(b => a.left < b.right-1 && a.right > b.left+1 && a.top < b.bottom-1 && a.bottom > b.top+1)),
    clipped,
    projectsContained:!projectOverflow || ['auto','scroll'].includes(getComputedStyle(list).overflowY),
    projectsOverflow:projectOverflow,
    footerClear:document.querySelector('footer').getBoundingClientRect().top >= Math.max(...rects.map(r=>r.bottom)),
    nameHeight:document.querySelector('.cell-name').getBoundingClientRect().height,
    pageHeight:document.querySelector('.bento-page').getBoundingClientRect().height,
    mobileHeaderActions:[...document.querySelectorAll('header a,header button')].filter(e=>e.getClientRects().length).map(e=>e.textContent.trim()),
    first:document.querySelector('.bento-grid').firstElementChild.className,
  };
`;
try {
  call('tab', 'new', 'resize');
  call('viewport', '1440', '900');
  call('open', base);
  wait('!!document.querySelector("iframe.is-ready")');
  call('click', '.explore-button');
  wait('!document.querySelector("iframe.puff-entrance")');
  const sizes = [[1440,900],[1280,720],[1280,719],[1280,720],[1440,720],
    [1100,844],[800,844],[721,844],[720,844],[560,844],[390,844],[320,568]];
  for (let width = 320; width <= 1440; width += 20) sizes.push([width, 844]);
  for (let width = 1440; width >= 320; width -= 20) sizes.push([width, 900]);
  sizes.push([719,844],[722,844],[720,844],[1100,844],[1101,844],
    [1279,844],[1280,844],[1280,900],[1360,880],[1440,880],[1440,881],
    [1920,720],[2560,720],[844,390],[568,320],[1024,768],[1440,900],[2560,1440]);
  for (const [index, [width, height]] of sizes.entries()) {
    call('viewport', String(width), String(height));
    const result = read(geometry);
    check(`${index}: ${width}x${height} content fits after resize`,
      !result.horizontalOverflow && !result.overlap && !result.clipped.length && result.projectsContained && result.footerClear,
      result);
    check(`${index}: responsive columns`, result.columns === (width <= 720 ? 1 : width <= 1100 ? 2 : 3), result.columns);
    if (width <= 720) {
      check(`${index}: mobile header has no photo shortcut`, !result.mobileHeaderActions.length, result.mobileHeaderActions);
      check(`${index}: Index stays first`, result.first.includes('cell-name'), result.first);
    }
    if (index === 9 || index === 10 || index === 0) {
      read('for(const e of [document.body,document.scrollingElement]) e.scrollTo({top:0,left:0,behavior:"instant"});return true');
      wait('scrollY===0 && document.body.scrollTop===0');
      call('screenshot', path.join(out, `${width}x${height}.png`));
    }
    if (index === 0) check('normal desktop still fits viewport', result.pageHeight <= height + 1, result.pageHeight);
  }
  call('viewport', '1280', '720');
  read(geometry);
  call('scroll', '--target', '.projects-list', '--dy', '1000');
  wait(`(() => {const list=document.querySelector('.projects-list');return list.lastElementChild.getBoundingClientRect().bottom<=list.getBoundingClientRect().bottom+1})()`);
  check('short desktop can scroll to the final project', true);
  call('click', '.projects-row:last-child');
  wait('!!document.querySelector(".projects-plate.open")');
  call('press', 'Escape');
  wait('!document.querySelector(".projects-plate")');
  check('short desktop final project remains usable', true);
  call('viewport', '390', '844', '--mobile');
  wait('!document.querySelector(".photo-shuffle").disabled');
  const photos = read('return [...document.querySelectorAll(".photo-fname")].map(e=>e.textContent)');
  call('click', '.photo-gallery-shuffle');
  wait('!document.querySelector(".photo-shuffle").disabled');
  check('mobile gallery shuffle still works', read(`return [...document.querySelectorAll('.photo-fname')].every(e=>!${JSON.stringify(photos)}.includes(e.textContent))`));
  call('click', '.cell-photo-a .photo-flip');
  wait('document.querySelector(".cell-photo-a").classList.contains("flipped")');
  call('press', 'Escape');
  wait('!document.querySelector(".cell-photo-a").classList.contains("flipped")');
  check('photo details still opens and closes', true);
  call('click', '.projects-row');
  wait('!!document.querySelector(".projects-plate.open")');
  for (const [width, height] of [[1440,900],[721,844],[390,844]]) {
    call('viewport', String(width), String(height));
    wait(`(() => {const r=document.querySelector('.projects-plate').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()`);
    check(`open project stays in ${width}x${height} viewport`, true);
  }
  call('press', 'Escape');
  wait('!document.querySelector(".projects-plate")');
  const errors = call('console', '--level', 'error').entries;
  check('no browser errors', Array.isArray(errors) && !errors.length, errors);
  const failed = checks.filter(c => !c.pass);
  console.log(`${checks.length - failed.length}/${checks.length} checks passed across ${sizes.length} resize steps`);
  assert.equal(failed.length, 0, `See ${path.join(out, 'checks.json')}`);
} finally {
  call('stop');
}

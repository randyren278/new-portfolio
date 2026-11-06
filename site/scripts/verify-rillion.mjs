import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { QUESTIONS } from '../public/dive/questions.mjs';

const [base = 'http://127.0.0.1:4326', output = '/tmp/rillion-qa'] = process.argv.slice(2);
const exec = promisify(execFile);
const profile = `scratch-rillion-${process.pid}`;
const tab = 'rillion';
const checks = [];
const geometry = [];
mkdirSync(output, { recursive: true });
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], {
  timeout: 45000, maxBuffer: 4e6,
})).stdout);
const evaluate = async (source) => (await call('eval', source, '--tab', tab)).value;
const click = (selector) => call('click', selector, '--tab', tab);
const pass = (name) => { checks.push(name); console.log(`PASS ${name}`); };
const settle = () => call('wait', '--js', `document.fonts.status==='loaded' && document.getAnimations().filter(a=>a.effect?.target===document.querySelector('#screen')).every(a=>a.playState!=='running')`, '--tab', tab);
const sizes = [[320,568],[360,640],[390,844],[430,932],[568,320],[667,375],[844,390],
  [700,900],[701,900],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080],[2560,1440]];
async function inspect(state, width, height) {
  await settle();
  const value = await evaluate(`
    const box=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const panel=document.querySelector('.play-panel');
    const controls=[...document.querySelectorAll('.topbar a,.topbar button,.modes button')].filter(el=>el.getClientRects().length).map(el=>({name:el.id||el.getAttribute('aria-label')||el.textContent,...box(el)}));
    return {viewport:[innerWidth,innerHeight],page:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],canvas:box(document.querySelector('#ocean')),panel:{...box(panel),scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,overflow:getComputedStyle(panel).overflowY,scrollbar:getComputedStyle(panel).scrollbarWidth,webkitScrollbar:getComputedStyle(panel,'::-webkit-scrollbar').display},controls,content:[...document.querySelectorAll('#screen h2,#screen input,#screen .primary,#screen .submit-answer')].map(el=>({name:el.id||el.className,...box(el)}))};
  `);
  geometry.push({state,...value});
  assert.ok(value.page[0] <= width+1, `${state} horizontal overflow ${width}`);
  assert.ok(value.page[1] <= height+1, `${state} page taller than viewport ${height}`);
  assert.ok(Math.abs(value.canvas.width-width)<1);
  assert.ok(Math.abs(value.canvas.height-height)<1);
  assert.ok(value.panel.width>0 && value.panel.height>0, `${state}: usable panel`);
  assert.ok(value.panel.height>=Math.min(180,height*0.5), `${state}: enough vertical space at ${width}×${height}`);
  assert.ok(value.panel.x>=0 && value.panel.right<=width+1 && value.panel.y>=0 && value.panel.bottom<=height+1, `${state}: panel within viewport`);
  assert.ok(value.panel.scrollHeight<=value.panel.clientHeight+1 || ['auto','scroll'].includes(value.panel.overflow), `${state}: overflow remains scrollable`);
  assert.equal(value.panel.scrollbar,'none');
  assert.equal(value.panel.webkitScrollbar,'none');
  for(const b of value.controls) {
    assert.ok(b.x>=-1 && b.right<=width+1 && b.y>=-1 && b.bottom<=height+1, `${state} ${width}×${height}: clipped control ${b.name}`);
    assert.ok(b.height>=44, `${state}: touch height ${b.name}`);
  }
  for(let i=0;i<value.controls.length;i++) for(let j=i+1;j<value.controls.length;j++) {
    const a=value.controls[i],b=value.controls[j];
    assert.ok(Math.min(a.right,b.right)-Math.max(a.x,b.x)<=1 || Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)<=1, `${state} ${width}: overlapping ${a.name} and ${b.name}`);
  }
  for(const b of value.content) assert.ok(b.x>=-1 && b.right<=width+1, `${state}: content fits horizontally ${b.name}`);
  if (state==='expanded-result' && width<=700 && width>height) {
    for (const name of ['final-depth','again']) {
      const b=value.content.find(item=>item.name===name);
      assert.ok(b && b.y>=value.panel.y && b.bottom<=value.panel.bottom, `${width}×${height}: ${name} visible without scrolling`);
    }
  }
  pass(`${state} ${width}×${height}: bounds, controls, full canvas, scrolling`);
}
async function submit() {
  const prompt = await evaluate('return document.querySelector("#prompt").textContent');
  const question = QUESTIONS.find(q=>q.prompt===prompt);
  assert.ok(question, prompt);
  const answer = [...question.answers].sort((a,b)=>b.score-a.score)[0];
  await call('fill','#answer',answer.name,'--tab',tab);
  await call('press','Enter','--target','#answer','--tab',tab);
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'),'feedback');
}
try {
  await call('open',base+'/', '--tab',tab);
  await call('wait','--selector','#begin','--tab',tab);
  const entry=await evaluate('return {path:location.pathname,title:document.title,iframes:document.querySelectorAll("iframe").length,home:document.querySelector(".brand").href,canonical:document.querySelector("link[rel=canonical]").href,icons:[...document.querySelectorAll("link[rel*=icon]")].map(el=>({rel:el.rel,path:new URL(el.href).pathname}))};');
  assert.equal(entry.path,'/');
  assert.equal(entry.title,'Randy Ren');
  assert.equal(entry.iframes,0);
  assert.equal(entry.home,'https://randyren.org/');
  assert.equal(entry.canonical,'https://rillion.randyren.org/');
  for(const icon of ['favicon.svg','favicon-32.png','favicon-16.png','apple-touch-icon.png']) {
    assert.ok(entry.icons.some(i=>i.path==='/'+icon));
    const response=await fetch(`${base}/${icon}`);
    assert.equal(response.status,200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),readFileSync(new URL(`../public/${icon}`,import.meta.url)));
  }
  pass('root serves game directly; portfolio link, canonical and all four icon files match');
  for(const [w,h] of sizes) {
    await call('reload','--tab',tab);
    await call('wait','--selector','#begin','--tab',tab);
    await call('viewport',String(w),String(h),'--tab',tab);
    await click('#unlimited-mode');
    await inspect('home',w,h);
    if([320,390,768,1440,2560].includes(w)) await call('screenshot',path.join(output,`home-${w}.png`),'--tab',tab);
    await click('#begin');
    await inspect('question',w,h);
    await submit();
    await inspect('feedback',w,h);
    if([320,390,844,1440].includes(w)) await call('screenshot',path.join(output,`feedback-${w}.png`),'--tab',tab);
  }
  // Complete an actual daily run through the public controls and reload its saved result.
  await click('#daily-mode');
  await click('#begin');
  for(let i=0;i<7;i++) { await submit(); await click('#next'); }
  const best=await evaluate('return Number(document.querySelector("#best").textContent.replaceAll(",",""))');
  assert.equal(best,700);
  await call('reload','--tab',tab);
  await call('wait','--selector','#begin','--tab',tab);
  assert.match(await evaluate('return document.querySelector("#begin").textContent'),/View/);
  assert.equal(await evaluate('return Number(document.querySelector("#best").textContent)'),best);
  await click('#begin');
  pass('seven real daily submissions complete once; best score and completed daily survive reload');
  await click('#screen details summary');
  for(const [w,h] of sizes) {
    await call('viewport',String(w),String(h),'--tab',tab);
    await inspect('expanded-result',w,h);
    if([320,390,768,844,1440,2560].includes(w)) await call('screenshot',path.join(output,`result-${w}.png`),'--tab',tab);
  }
  await call('viewport','390','844','--tab',tab);
  const before=await evaluate('const p=document.querySelector(".play-panel");p.scrollTop=0;return {top:p.scrollTop,overflow:p.scrollHeight-p.clientHeight};');
  assert.ok(before.overflow>0);
  await call('scroll','--target','.play-panel','--dy','400','--tab',tab);
  assert.ok(await evaluate('return document.querySelector(".play-panel").scrollTop>0'));
  pass('expanded results scroll by native wheel with no visible scrollbar');
  for(const [w,h] of [[320,568],[568,320],[768,1024],[1440,900]]) {
    await call('viewport',String(w),String(h),'--tab',tab);
    for(const id of ['help','stats','themes','archive']) {
      await click(`[data-dialog="${id}"]`);
      const dialog=await evaluate(`const el=document.querySelector('#${id}'),r=el.getBoundingClientRect();return {open:el.open,x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflow:getComputedStyle(el).overflowY};`);
      assert.ok(dialog.open && dialog.x>=0 && dialog.y>=0 && dialog.right<=w+1 && dialog.bottom<=h+1, `${id} ${w}×${h}: modal bounds`);
      assert.ok(dialog.scrollHeight<=dialog.clientHeight+1 || ['auto','scroll'].includes(dialog.overflow));
      if(w===320) await call('screenshot',path.join(output,`${id}-${w}.png`),'--tab',tab);
      await call('press','Escape','--tab',tab);
    }
    pass(`all four dialogs fit or scroll at ${w}×${h}`);
  }
  await click('.brand');
  await call('wait','--url','randyren.org','--tab',tab);
  assert.ok(['randyren.org','www.randyren.org'].includes(await evaluate('return location.hostname')));
  pass('clicking top-left Randy Ren navigates back to the live portfolio');
} finally {
  writeFileSync(path.join(output,'receipt.json'),JSON.stringify({base,recordedAt:new Date().toISOString(),checks,geometry,source:{html:createHash('sha256').update(readFileSync(new URL('../public/dive/index.html',import.meta.url))).digest('hex'),css:createHash('sha256').update(readFileSync(new URL('../public/dive/style.css',import.meta.url))).digest('hex')},limits:['WebKit viewport emulation; physical device keyboards and safe-area hardware not emulated.']},null,2)+'\n');
  await exec('umbra',['--profile',profile,'stop']).catch(()=>{});
}
console.log(`${checks.length} Rillion checks passed`);

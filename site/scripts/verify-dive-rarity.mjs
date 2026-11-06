import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { QUESTIONS } from '../public/dive/questions.mjs';
import { RARITY_BANDS, diveRarityFor } from '../public/dive/rarity.mjs';

const [base = 'http://127.0.0.1:4318', output = '/tmp/dive-rarity-qa'] = process.argv.slice(2);
const profile = `scratch-dive-rarity-check-${process.pid}`;
const exec = promisify(execFile);
const tab = 'rarity';
const receipt = { checks: [], reveals: [], rope: [] };
mkdirSync(output, { recursive: true });
const call = async (...args) =>
  JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], {
    timeout: 45000, maxBuffer: 4e6,
  })).stdout);
const evaluate = async (source) => (await call('eval', source, '--tab', tab)).value;
const click = (target) => call('click', target, '--tab', tab);
function pass(name) {
  receipt.checks.push(name);
  console.log(`PASS ${name}`);
}
async function checkRope(width, height, state) {
  await call('viewport', String(width), String(height), '--tab', tab);
  const result = await evaluate(`
    const ctx=document.querySelector('#ocean').getContext('2d');
    const draw=ctx.drawImage,quad=ctx.quadraticCurveTo;let end=null;const samples=[];
    ctx.quadraticCurveTo=function(...args){end={x:args[2],y:args[3]};return quad.apply(this,args)};
    ctx.drawImage=function(img,x,y,w,h,...rest){
      if(img.width===112&&img.height===96&&end){
        const sx=(end.x-x)/w*112,sy=(end.y-y)/h*96;
        const pixels=img.getContext('2d').getImageData(0,0,112,96).data;
        const alpha=pixels[(Math.floor(sy)*112+Math.floor(sx))*4+3]??0;
        samples.push({sx,sy,alpha});
      }
      return draw.call(this,img,x,y,w,h,...rest);
    };
    await new Promise(resolve=>setTimeout(resolve,800));
    ctx.drawImage=draw;ctx.quadraticCurveTo=quad;
    return {viewport:[innerWidth,innerHeight],samples};
  `);
  receipt.rope.push({ state, ...result });
  assert.ok(result.samples.length > 15, 'Observe enough actual rendered Puff frames');
  assert.ok(result.samples.every((sample) => sample.alpha > 128), 'Rope ends on opaque Puff pixels');
  pass(`rope touches Puff on every ${state} frame at ${width}×${height}`);
}
async function checkFeedbackGeometry(width, height, name) {
  await call('viewport', String(width), String(height), '--tab', tab);
  await evaluate(`await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true`);
  const result = await evaluate(`
    const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
    const ctx=document.querySelector('#ocean').getContext('2d'),draw=ctx.drawImage;
    let puff=null;
    ctx.drawImage=function(img,x,y,w,h,...rest){
      if(img.width===112&&img.height===96){
        const data=img.getContext('2d').getImageData(0,0,112,96).data;
        let minX=112,minY=96,maxX=0,maxY=0;
        for(let yy=0;yy<96;yy++)for(let xx=0;xx<112;xx++)if(data[(yy*112+xx)*4+3]>128){
          minX=Math.min(minX,xx);maxX=Math.max(maxX,xx+1);minY=Math.min(minY,yy);maxY=Math.max(maxY,yy+1);
        }
        puff={x:x+minX*w/112,right:x+maxX*w/112,y:y+minY*h/96,bottom:y+maxY*h/96};
      }
      return draw.call(this,img,x,y,w,h,...rest);
    };
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    ctx.drawImage=draw;
    return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,
      panel:rect('.play-panel'),button:rect('#next'),footer:rect('.modes'),
      footerVisible:getComputedStyle(document.querySelector('.modes')).display!=='none',
      emblem:rect('.rarity-emblem'),answer:rect('.result-answer'),puff};
  `);
  await call('screenshot', path.join(output, `${name}-${width}.png`), '--tab', tab);
  assert.ok(result.scroll <= width + 1, `No horizontal overflow at ${width}`);
  for (const box of [result.button, result.emblem, result.answer])
    assert.ok(box.x >= 0 && box.right <= width + 1 && box.y >= 0 && box.bottom <= height,
      `Reward and next control visible at ${width}×${height}: ${JSON.stringify(result)}`);
  assert.ok(!result.footerVisible || result.button.bottom < result.footer.top,
    `Next stays above persistent navigation: ${JSON.stringify(result)}`);
  assert.ok(result.button.bottom <= result.panel.bottom + 1, 'Next is inside the visible scrolling panel');
  const p = result.puff, a = result.answer;
  assert.ok(p && (p.right <= a.x || p.x >= a.right || p.bottom <= a.y || p.y >= a.bottom),
    `Puff does not cover the answer: ${JSON.stringify(result)}`);
}
try {
  await call('open', `${base}/dive`, '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await checkRope(1440, 1000, 'idle');
  await checkRope(390, 844, 'idle');
  await checkRope(320, 568, 'idle');
  await call('viewport', '1440', '1000', '--tab', tab);
  await click('#begin');
  let expected = 0;
  for (let round = 0; round < 7; round++) {
    const band = RARITY_BANDS[Math.min(round, 5)];
    const prompt = await evaluate('return document.querySelector("#prompt").textContent');
    const question = QUESTIONS.find((entry) => entry.prompt === prompt);
    const answer = question?.answers.find((entry) => entry.score >= band.min && entry.score <= band.max);
    assert.ok(answer, `Current prompt has an answer for ${band.label}`);
    await call('fill', '#answer', answer.name, '--tab', tab);
    await call('press', 'Enter', '--target', '#answer', '--tab', tab);
    expected += answer.score;
    const reveal = await evaluate(`return {
      rarity:document.querySelector('#screen').dataset.rarity,
      label:document.querySelector('.feedback-title').textContent,
      answer:document.querySelector('.result-answer').textContent,
      icons:document.querySelectorAll('.rarity-step').length,
      current:document.querySelector('.rarity-step.current').title,
      total:Number(document.querySelector('#score').textContent),
      state:document.querySelector('#screen').dataset.state,
      finalVisible:Boolean(document.querySelector('#again')),
      next:document.querySelector('#next').textContent,
      animation:getComputedStyle(document.querySelector('.rarity-emblem .rarity-icon')).animationName
    }`);
    assert.equal(reveal.rarity, band.id);
    assert.equal(reveal.label, band.label);
    assert.equal(reveal.answer, answer.name);
    assert.equal(reveal.icons, 6);
    assert.equal(reveal.current, band.label);
    assert.equal(reveal.total, expected);
    assert.equal(reveal.state, 'feedback');
    assert.equal(reveal.finalVisible, false);
    assert.notEqual(reveal.animation, 'none');
    receipt.reveals.push({ round: round + 1, answer, ...reveal });
    if (round === 0) {
      await checkRope(1440, 1000, 'reward');
      await checkRope(390, 844, 'reward');
      await checkRope(320, 568, 'reward');
    }
    if (round < 6) {
      await checkFeedbackGeometry(1440, 1000, band.id);
      await checkFeedbackGeometry(390, 844, band.id);
      if (round === 5) {
        await checkFeedbackGeometry(320, 568, band.id);
        await checkFeedbackGeometry(844, 390, band.id);
      }
      pass(`${band.label}: native answer reveals badge, distinct animation, score and six-tier ladder`);
    } else {
      assert.match(reveal.next, /Surface/);
      pass('seventh answer receives its own reward before the final result');
    }
    await click('#next');
  }
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'result');
  assert.equal(await evaluate('return document.querySelector(".dive-grade span").textContent'), diveRarityFor(expected).label);
  await call('reload', '--tab', tab);
  const saved = await evaluate('return JSON.parse(localStorage.getItem("randy-dive-v1"))');
  assert.equal(saved.best, expected);
  assert.equal(saved.played, 1);
  assert.equal(saved.history[0].score, expected);
  pass('reward flow persists original point totals and counts the completed dive once');
  const errors = await call('console', '--level', 'error', '--tab', tab);
  assert.equal(errors.count, 0);
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(`PASS ${receipt.checks.length} reward and rope checks`);
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}

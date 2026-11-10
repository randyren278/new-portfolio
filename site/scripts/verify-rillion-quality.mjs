import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { QUESTIONS } from '../public/dive/questions.mjs';
import { createRun, recordAnswer, STORAGE_KEY, loadProgress, saveProgress, finishRun, dayKey } from '../public/dive/model.mjs';

const [base = 'http://127.0.0.1:4331', output = '/tmp/rillion-quality'] = process.argv.slice(2);
const profile = `scratch-rillion-quality-${process.pid}`;
const tab = 'quality';
const exec = promisify(execFile);
const checks = [];
mkdirSync(output, { recursive: true });
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], { timeout: 45000, maxBuffer: 8e6 })).stdout);
const evaluate = async source => (await call('eval', source, '--tab', tab)).value;
const click = selector => call('click', selector, '--tab', tab);
const wait = source => call('wait', '--js', source, '--timeout', '12', '--tab', tab);
const read = selector => evaluate(`return document.querySelector(${JSON.stringify(selector)})?.textContent;`);
function pass(name, evidence = {}) {
  checks.push({ name, ...evidence });
  console.log(`PASS ${name}`);
}
async function capture(name) {
  await wait('document.getAnimations().filter(a=>a.effect?.target===document.querySelector("#screen")).every(a=>a.playState!=="running")');
  await call('screenshot', path.join(output, `${name}.png`), '--full', '--tab', tab);
}
async function geometry(width, height, name) {
  await call('viewport', String(width), String(height), ...(width < 701 ? ['--mobile'] : []), '--tab', tab);
  await wait(`document.fonts.status === 'loaded'`);
  const result = await evaluate(`const root=document.documentElement;return {width:innerWidth,scroll:root.scrollWidth,controls:[...document.querySelectorAll('#next,#answer,.submit-answer,#skip,.modes button')].map(e=>{const b=e.getBoundingClientRect();return {id:e.id||e.className,x:b.x,right:b.right,width:b.width,height:b.height}}),panel:getComputedStyle(document.querySelector('#screen')).backgroundColor};`);
  assert.ok(result.scroll <= width + 1, JSON.stringify(result));
  assert.ok(result.controls.every(box => box.x >= -1 && box.right <= width + 1 && box.width > 0 && box.height > 0), JSON.stringify(result));
  await capture(name);
  pass(`reachable controls and no horizontal overflow at ${width}x${height}`, result);
}
async function settleJourney() {
  const samples = await evaluate(`const samples=[],start=performance.now();await new Promise(resolve=>{function sample(){const screen=document.querySelector('#screen'),ocean=document.querySelector('#ocean');samples.push({state:screen.dataset.state,score:Number(document.querySelector('#score').textContent.replaceAll(',','')),earned:document.querySelector('#earned-points')?.textContent,depth:Number(document.querySelector('#scene-depth').textContent.replaceAll(',','')),nextDisabled:document.querySelector('#next')?.disabled,timer:Boolean(document.querySelector('#timer')),phase:ocean.dataset.journeyPhase});if(screen.dataset.state!=='journey'||performance.now()-start>5000)resolve();else requestAnimationFrame(sample)}sample()});return samples;`);
  assert.equal(samples.at(-1).state, 'feedback', JSON.stringify(samples.at(-1)));
  assert.ok(samples.every(sample => !sample.timer), 'question clock cannot run during reveal');
  assert.ok(samples.filter(sample => sample.state === 'journey').every(sample => sample.nextDisabled), 'next is disabled during travel');
  assert.ok(samples.every(sample => sample.score === samples.at(-1).score && sample.earned === samples.at(-1).earned), 'the earned score is visible immediately and does not count up during travel');
  assert.ok(samples.every(sample => sample.depth <= sample.score * 10), 'depth travels toward the awarded score');
  assert.equal(samples.at(-1).depth, samples.at(-1).score * 10);
  for (let i = 1; i < samples.length; i++) assert.ok(samples[i].depth >= samples[i - 1].depth, 'descent is monotonic');
  writeFileSync(path.join(output, `journey-${checks.length}.json`), JSON.stringify(samples, null, 2));
  return samples;
}
async function answer(which = 'common', duplicate = false) {
  const prompt = await read('#prompt');
  const question = QUESTIONS.find(question => question.prompt === prompt);
  assert.ok(question, `known prompt: ${prompt}`);
  const entries = [...question.answers].sort((a, b) => a.score - b.score);
  const entry = which === 'provisional' ? entries.find(entry => entry.scoreBasis === 'conservative')
    : which === 'common' ? entries[0] : entries.at(-1);
  assert.ok(entry, `an answer exists for ${which}`);
  const previousScore = Number((await read('#score')).replaceAll(',', ''));
  await call('fill', '#answer', entry.name, '--tab', tab);
  await call('press', ...duplicate ? ['Enter', 'Enter'] : ['Enter'], '--target', '#answer', '--tab', tab);
  const stage = await evaluate(`return {state:document.querySelector('#screen').dataset.state,width:innerWidth,height:innerHeight,score:Number(document.querySelector('#score').textContent.replaceAll(',','')),earned:document.querySelector('#earned-points').textContent,label:document.querySelector('.feedback-title').textContent,active:document.activeElement.id,outline:getComputedStyle(document.querySelector('#next')).outlineStyle,tiers:[...document.querySelectorAll('.journey-tier')].map(e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}})};`);
  assert.equal(stage.score, previousScore + entry.score);
  assert.equal(stage.earned, `+${entry.score}`);
  assert.doesNotMatch(stage.label, /finding your depth/i);
  assert.equal(stage.active, 'screen');
  assert.equal(stage.outline, 'none');
  if (stage.width < 701) {
    assert.equal(stage.state, 'journey');
    assert.equal(stage.tiers.length, 6);
    assert.ok(stage.tiers.every(box => box.left >= 0 && box.right <= stage.width && box.top >= 0 && box.bottom <= stage.height), 'all six animated tiers stay visible');
    await call('screenshot', path.join(output, `journey-${stage.width}-${checks.length}.png`), '--tab', tab);
  }
  const samples = await settleJourney();
  assert.equal(await evaluate('return document.activeElement.id;'), 'screen');
  assert.ok((await read('.result-score')).includes(`+${entry.score}`));
  if (which === 'provisional') assert.match(await read('.rarity-verdict'), /provisional 45 points/);
  const rows = await evaluate(`return [...document.querySelectorAll('.journey-tier')].map(e=>e.textContent);`);
  assert.equal(rows.length, 6);
  await click('.answer-comparison summary');
  const examples = await evaluate(`return [...document.querySelectorAll('.comparison-row')].map(e=>e.textContent);`);
  assert.ok(examples.length >= 2);
  pass(`${which} answer reveals a labelled rating and scored comparisons`, { question: question.id, entry, sampledFrames: samples.length });
  return entry.score;
}
async function installRun(run, { feedback = true, deadline = 0 } = {}) {
  let progress = loadProgress();
  if (run.complete) progress = finishRun(progress, run);
  else {
    progress.activeDaily = { run, deadline, feedback };
    progress.activeDailies = { [run.dateKey]: progress.activeDaily };
  }
  let raw;
  saveProgress({ setItem: (_, value) => { raw = value; } }, progress);
  await evaluate(`localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(raw)});return true;`);
  await call('reload', '--tab', tab);
  await wait('Boolean(document.querySelector("#begin"))');
  if (run.dateKey !== dayKey()) {
    await click('[data-dialog="archive"]');
    await click(`[data-date="${run.dateKey}"]`);
  }
  await click('#begin');
}
try {
  await call('open', base + '/', '--tab', tab);
  await wait('Boolean(document.querySelector("#begin"))');
  await geometry(390, 844, 'home-mobile');
  await click('#begin');
  await geometry(320, 568, 'question-small');
  let expected = await answer('common', true);
  await geometry(320, 568, 'feedback-small');
  await call('reload', '--tab', tab);
  await wait('Boolean(document.querySelector("#begin"))');
  assert.match(await read('#begin'), /Resume/);
  await click('#begin');
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state;'), 'feedback');
  assert.equal(Number(await read('#score')), expected);
  pass('reload resumes settled feedback without replaying or duplicating the answer');
  await click('#next');
  assert.ok(Number((await read('#timer')).replace('s', '')) >= 24);
  await geometry(390, 844, 'question-mobile');
  expected += await answer('rare');
  await geometry(1440, 900, 'feedback-desktop');
  await click('#next');
  await click('#skip');
  await settleJourney();
  assert.equal(Number((await read('#score')).replaceAll(',', '')), expected);
  pass('skip completes without earning points or getting stuck');
  await click('#next');
  for (let i = 3; i < 7; i++) {
    expected += await answer(i === 3 ? 'provisional' : 'rare');
    await click('#next');
  }
  await wait('Boolean(document.querySelector("#again"))');
  assert.equal(Number((await read('#score')).replaceAll(',', '')), expected);
  const stored = await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}));`);
  assert.equal(stored.played, 1);
  await click('#screen details summary');
  assert.equal(await evaluate('return document.querySelectorAll(".answer-log li").length;'), 7);
  await capture('result-desktop');
  pass('full seven-round run is saved once with per-answer ratings', { score: expected });

  // A persisted partial run exercises real resume at otherwise expensive depths.
  for (const target of [2300, 4000, 6000]) {
    let run = createRun();
    if (target === 6000) {
      const candidates = Array.from({ length: 30 }, (_, i) => createRun({ dateKey: dayKey(new Date(Date.now() - i * 86400000)) }));
      run = candidates.find(run => run.questions.reduce((sum, q) => sum + Math.max(...q.answers.map(a => a.score)), 0) >= 600);
      assert.ok(run, 'a recent puzzle can reach the hadal zone with valid reviewed answers');
    }
    while (!run.complete && run.score * 10 < target) {
      const entry = [...run.questions[run.round].answers].sort((a, b) => b.score - a.score)[0];
      run = recordAnswer(run, entry.name);
    }
    assert.ok(run.score * 10 >= target);
    await installRun(run);
    await geometry(390, 844, `depth-${target}`);
    const labels = await evaluate(`return ['#depth-near-top','#depth-near-mid','#depth-near-bottom'].map(id=>document.querySelector(id)?.textContent);`);
    assert.ok(labels.every(Boolean));
    if (target === 6000) assert.equal(await evaluate('return document.querySelector("#ocean").dataset.zone;'), 'hadal');
    pass(`deep-water resume near ${target}m with local depth labels`, { depth: run.score * 10, labels });
  }

  let expired = createRun();
  await installRun(expired, { feedback: false, deadline: Date.now() - 1000 });
  await settleJourney();
  assert.equal(Number(await read('#score')), 0);
  pass('expired persisted question times out once and permits continuation');

  await click('#next');
  const prompt = await read('#prompt');
  const q = QUESTIONS.find(question => question.prompt === prompt);
  await call('fill', '#answer', q.answers.at(-1).name, '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  await click('#unlimited-mode');
  await wait('document.querySelector("#screen").dataset.state === "home"');
  const stable = await evaluate(`let stable=true;const end=performance.now()+2200;await new Promise(resolve=>{function check(){stable &&=document.querySelector('#screen').dataset.state==='home';if(performance.now()>=end)resolve();else requestAnimationFrame(check)}check()});return stable;`);
  assert.ok(stable);
  pass('leaving during a reveal cancels old callbacks without overwriting home');
  await click('[data-dialog="help"]');
  assert.match(await read('#help'), /hand-ranked|editorial/i);
  await capture('help');
  await click('#help .close');
  await click('[data-dialog="stats"]');
  assert.ok(await evaluate('return document.querySelector("#stats").open;'));
  await click('#stats .close');
  await call('focus', '#begin', '--tab', tab);
  await call('press', 'Alt+Tab', '--tab', tab);
  assert.ok(await evaluate('return document.activeElement !== document.body;'));
  assert.notEqual(await evaluate('return getComputedStyle(document.activeElement).outlineStyle;'), 'none');
  pass('instructions, logbook and keyboard focus remain available');
  const errors = await call('console', '--level', 'error', '--tab', tab);
  writeFileSync(path.join(output, 'console.json'), JSON.stringify(errors, null, 2));
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify({ base, checks, limitations: ['WebKit viewport checks do not validate a physical iPhone keyboard.', 'Deep-water checks use persisted run fixtures; normal gameplay is exercised by the full dive.'] }, null, 2));
  console.log(`PASS ${checks.length} browser checks; evidence ${output}`);
} finally {
  await call('stop').catch(() => {});
}

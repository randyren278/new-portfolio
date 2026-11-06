import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { QUESTIONS, PLAYABLE_QUESTIONS, CATEGORIES } from '../public/dive/questions.mjs';
import { GENERAL_QUESTIONS } from '../public/dive/questions-general-extra.mjs';
import { PLAYABLE_ANCHORS } from '../public/dive/playability.mjs';
import { createRun, STORAGE_KEY } from '../public/dive/model.mjs';

const [base = 'http://127.0.0.1:4329', output = '/tmp/rillion-general-qa'] = process.argv.slice(2);
const exec = promisify(execFile), profile = `scratch-rillion-general-${process.pid}`, tab = 'general';
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], {
  timeout: 45000, maxBuffer: 4e6,
})).stdout);
const evaluate = async source => (await call('eval', source, '--tab', tab)).value;
const click = selector => call('click', selector, '--tab', tab);
const checks = [], dates = new Map(), targetIds = new Set(GENERAL_QUESTIONS.map(q => q.id));
mkdirSync(output, { recursive: true });
for (let i = 0; i < 10000 && dates.size < targetIds.size; i++) {
  const dateKey = new Date(Date.UTC(2026, 10, 7 + i)).toISOString().slice(0, 10);
  const q = createRun({ dateKey }).questions[0];
  if (targetIds.has(q.id) && !dates.has(q.id)) dates.set(q.id, dateKey);
}
assert.equal(dates.size, targetIds.size);
async function setDate(dateKey, clear = false) {
  await evaluate(`
    ${clear ? 'localStorage.clear();' : ''}
    const NativeDate=Date,stamp=Date.parse(${JSON.stringify(dateKey + 'T12:00:00Z')});
    window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}};return true;
  `);
}
async function submit(input) {
  await call('fill', '#answer', input, '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
}
try {
  for (const q of GENERAL_QUESTIONS) {
    await call('open', base + '/', '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    await setDate(dates.get(q.id), true);
    await click('#daily-mode');
    await click('#begin');
    assert.equal(await evaluate('return document.querySelector("#prompt").textContent'), q.prompt);
    await submit(PLAYABLE_ANCHORS[q.id][0]);
    const score = Number(await evaluate('return document.querySelector("#score").textContent'));
    assert.ok(score > 0 && score <= 40);
    checks.push({ id: q.id, dateKey: dates.get(q.id), input: PLAYABLE_ANCHORS[q.id][0], score });
    if (checks.length % 12 === 0) {
      await call('screenshot', path.join(output, `${q.category}-new-answer.png`), '--tab', tab);
      console.log(`PASS ${checks.length}/48 new questions through native typing`);
    }
  }
  const dateKey = dates.get(GENERAL_QUESTIONS.at(-1).id);
  for (let i = 1; i < 7; i++) {
    await click('#next');
    const prompt = await evaluate('return document.querySelector("#prompt").textContent');
    const q = QUESTIONS.find(q => q.prompt === prompt);
    assert.ok(PLAYABLE_ANCHORS[q.id]);
    await submit(PLAYABLE_ANCHORS[q.id][0]);
  }
  await click('#next');
  const stored = await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}));`);
  assert.equal(stored.played, 1);
  assert.equal(stored.daily[dateKey].poolVersion, 2);
  assert.ok(stored.daily[dateKey].answers.every(a => a.valid && a.bankVersion === 3));
  await call('reload', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await setDate(dateKey);
  await click('#daily-mode');
  assert.match(await evaluate('return document.querySelector("#begin").textContent'), /View/);
  await click('#begin');
  assert.equal((await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})).played;`)), 1);
  await call('screenshot', path.join(output, 'completed-reloaded.png'), '--tab', tab);
  console.log('PASS seven low-score answers complete once and survive reload');

  const contextChecks = [];
  for (const [id, input] of [
    ['play-world-cities', 'New Westminster'], ['play-world-cities', 'Penticton'],
    ['play-world-cities', 'Port Coquitlam'], ['play-nature-pets', 'pitbull'],
    ['play-nature-body-parts', 'rib cage'], ['play-nature-body-parts', 'pelvis'],
  ]) {
    await call('open', base + '/', '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    await setDate(dates.get(id), true);
    await click('#daily-mode');
    await click('#begin');
    assert.equal(await evaluate('return document.querySelector("#prompt").textContent'), QUESTIONS.find(q => q.id === id).prompt);
    await submit(input);
    contextChecks.push({ id, input, canonical: await evaluate('return document.querySelector(".result-answer").textContent') });
  }
  console.log('PASS six ordinary answers remain valid across broader question contexts');
  await click('[data-dialog="themes"]');
  const themeText = await evaluate('return document.querySelector("#theme-list").textContent');
  for (const category of CATEGORIES) {
    const count = PLAYABLE_QUESTIONS.filter(q => q.category === category.id).length;
    assert.ok(themeText.includes(`${count} PROMPTS`));
  }
  await click('#themes .close');
  // Verify a real previous-version browser save retains its completed/active dailies.
  const previous = JSON.parse(readFileSync(new URL('./fixtures/dive-v6-progress.json', import.meta.url), 'utf8'));
  await evaluate(`localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(JSON.stringify(previous))});return true;`);
  await call('reload', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  const restored = await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}));`);
  assert.equal(restored.best, previous.best);
  assert.deepEqual(restored.history, previous.history);
  assert.deepEqual(restored.activeDaily.run.answers, previous.activeDaily.run.answers);
  await setDate('2026-11-08');
  await click('#daily-mode');
  assert.match(await evaluate('return document.querySelector("#begin").textContent'), /Resume/);
  await click('#begin');
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
  await click('#next');
  const resumedPrompt = await evaluate('return document.querySelector("#prompt").textContent');
  assert.equal(resumedPrompt, QUESTIONS.find(q => q.id === previous.activeDaily.run.questions[3].id).prompt);
  console.log('PASS theme counts and previous-version browser save resume');
  assert.equal((await call('console', '--level', 'error', '--tab', tab)).count, 0);
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify({ base, checks, contextChecks, completion: stored.daily[dateKey], savedVersionResume: true, themeCounts: themeText, testedAt: new Date().toISOString() }, null, 2) + '\n');
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}

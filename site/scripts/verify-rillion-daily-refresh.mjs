import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRun, dayKey, STORAGE_KEY } from '../public/dive/model.mjs';
import { PLAYABLE_ANCHORS } from '../public/dive/playability.mjs';

const [base = 'http://127.0.0.1:4331', output = '/tmp/rillion-daily-refresh', mode = 'fixed'] = process.argv.slice(2);
assert.ok(['baseline', 'fixed'].includes(mode));
const exec = promisify(execFile), profile = `scratch-rillion-daily-refresh-${process.pid}`, tab = 'daily';
const previous = JSON.parse(readFileSync(new URL('./fixtures/dive-v6-progress.json', import.meta.url), 'utf8'));
const call = async (...args) => JSON.parse((await exec('umbra', ['--profile', profile, '--json', ...args], { timeout: 45000, maxBuffer: 4e6 })).stdout);
const evaluate = async source => (await call('eval', source, '--tab', tab)).value;
const click = selector => call('click', selector, '--tab', tab);
const results = [];
mkdirSync(output, { recursive: true });
async function setDate(date) {
  await evaluate(`const NativeDate=Date,stamp=Date.parse(${JSON.stringify(date + 'T12:00:00Z')});window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}};return true;`);
}
async function openSave(progress, date) {
  await call('open', base + '/', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await evaluate(`localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(JSON.stringify(progress))});return true;`);
  await call('reload', '--tab', tab);
  await call('wait', '--selector', '#begin', '--tab', tab);
  await setDate(date);
  await click('#daily-mode');
}
async function submit(q) {
  assert.equal(await evaluate('return document.querySelector("#prompt").textContent'), q.prompt);
  await call('fill', '#answer', PLAYABLE_ANCHORS[q.id][0], '--tab', tab);
  await call('press', 'Enter', '--target', '#answer', '--tab', tab);
  assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
}
try {
  for (const date of ['2026-11-06', '2026-11-07']) {
    await openSave(previous, date);
    if (mode === 'fixed' && date === '2026-11-07') {
      await click('[data-dialog="archive"]');
      assert.match(await evaluate(`return document.querySelector('[data-date="2026-11-06"]').textContent`), /DIVE IN/);
      await click('#archive .close');
    }
    const button = await evaluate('return document.querySelector("#begin").textContent');
    assert.match(button, mode === 'baseline' ? /View/ : /Dive in/);
    await click('#begin');
    if (mode === 'baseline') {
      assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'result');
      results.push({ date, oldCompletedDailyBlocksNewPuzzle: true });
      continue;
    }
    const expected = createRun({ dateKey: date });
    assert.equal(expected.poolVersion, 2);
    for (let i = 0; i < 7; i++) {
      await submit(expected.questions[i]);
      if (i === 0) {
        await call('reload', '--tab', tab);
        await call('wait', '--selector', '#begin', '--tab', tab);
        await setDate(date);
        await click('#daily-mode');
        assert.match(await evaluate('return document.querySelector("#begin").textContent'), /Resume/);
        await click('#begin');
        assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
        if (date === '2026-11-06') {
          await call('open', base + '/', '--tab', 'other');
          await call('wait', '--selector', '#sound', '--tab', 'other');
          await call('click', '#sound', '--tab', 'other');
          await call('wait', '--js', 'document.querySelector("#sound").getAttribute("aria-pressed")==="false"', '--tab', tab);
          assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
          await call('tab', 'close', 'other');
        }
      }
      await click('#next');
    }
    const stored = await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}));`);
    assert.equal(stored.daily[date].id, expected.id);
    assert.equal(stored.daily[date].poolVersion, 2);
    assert.equal(stored.played, previous.played + 1);
    assert.equal(stored.total, previous.total + stored.daily[date].score);
    assert.equal(stored.best, Math.max(previous.best, stored.daily[date].score));
    assert.ok(stored.history.some(run => run.id === previous.daily[date].id && run.score === previous.daily[date].score));
    assert.ok(stored.daily[date].answers.every(a => a.valid && a.score <= 40));
    await call('reload', '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    await setDate(date);
    await click('#daily-mode');
    assert.match(await evaluate('return document.querySelector("#begin").textContent'), /View/);
    await click('#begin');
    assert.equal(await evaluate(`return JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})).played;`), previous.played + 1);
    results.push({ date, oldScore: previous.daily[date].score, newId: expected.id, newScore: stored.daily[date].score, completedOnce: true, oldScorePreserved: true, reloadedDuringRun: true });
    if (date === '2026-11-06') {
      await setDate('2026-11-07');
      await click('[data-dialog="archive"]');
      assert.match(await evaluate(`return document.querySelector('[data-date="2026-11-06"]').textContent`), new RegExp(`${stored.daily[date].score} PTS · VIEW`));
      await click('#archive .close');
    }
    await call('screenshot', path.join(output, date + '.png'), '--tab', tab);
  }
  const date = '2026-11-07';
  const active = structuredClone(previous);
  const old = active.daily[date];
  delete active.daily[date];
  active.history = active.history.filter(run => run.id !== old.id);
  active.completedIds = active.completedIds.filter(id => id !== old.id);
  active.played--; active.total -= old.score;
  const prefix = { ...old, round: 2, answers: old.answers.slice(0, 2), complete: false };
  prefix.score = prefix.answers.reduce((sum, a) => sum + a.score, 0);
  delete prefix.completedAt;
  active.activeDaily = { run: prefix, deadline: Date.parse(date + 'T12:00:00Z') + 25000, feedback: true };
  active.activeDailies = { [date]: active.activeDaily };
  await openSave(active, date);
  assert.match(await evaluate('return document.querySelector("#begin").textContent'), mode === 'baseline' ? /Resume/ : /Dive in/);
  await click('#begin');
  if (mode === 'baseline') assert.equal(await evaluate('return document.querySelector("#screen").dataset.state'), 'feedback');
  else {
    assert.equal(Number(await evaluate('return document.querySelector("#score").textContent')), 0);
    await submit(createRun({ dateKey: date }).questions[0]);
  }
  results.push({ date, olderActivePuzzle: mode === 'baseline' ? 'resumed' : 'replaced with accessible pool' });
  if (mode === 'fixed') {
    await evaluate('localStorage.clear();return true;');
    await call('reload', '--tab', tab);
    await call('wait', '--selector', '#begin', '--tab', tab);
    const actualDay = await evaluate('return new Date().toISOString().slice(0,10)');
    assert.equal(actualDay, dayKey());
    await click('#begin');
    await submit(createRun({ dateKey: actualDay }).questions[0]);
    results.push({ realClockDay: actualDay, currentDailyUsesAccessiblePool: true });
  }
  assert.equal((await call('console', '--level', 'error', '--tab', tab)).count, 0);
  writeFileSync(path.join(output, 'receipt.json'), JSON.stringify({ base, mode, results, testedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(`PASS ${mode}: completed and active Daily refresh, preserved scores, and reload behavior`);
} finally {
  await exec('umbra', ['--profile', profile, 'stop']);
}

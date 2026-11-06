import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  QUESTIONS, AUDITED_QUESTIONS, PLAYABLE_QUESTIONS, ANSWER_BANK_VERSION, CATEGORIES,
} from '../public/dive/questions.mjs';
import { GENERAL_QUESTIONS } from '../public/dive/questions-general-extra.mjs';
import { PLAYABLE_ANCHORS } from '../public/dive/playability.mjs';
import { createRun, evaluateAnswer, recordAnswer, loadProgress, saveProgress, finishRun } from '../public/dive/model.mjs';

const fixture = name => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const byId = new Map(QUESTIONS.map(q => [q.id, q]));

test('ordinary dives exclude specialist recall and every selectable prompt has three low-score anchors', () => {
  const ids = new Set(PLAYABLE_QUESTIONS.map(q => q.id));
  assert.equal(ids.size, Object.keys(PLAYABLE_ANCHORS).length);
  for (const id of ['culture-shakespeare-characters', 'nature-clouds', 'world-v5-kenyan-towns', 'culture-v5-ballet-terms'])
    assert.equal(ids.has(id), false, id);
  for (const q of PLAYABLE_QUESTIONS) {
    const anchors = PLAYABLE_ANCHORS[q.id];
    assert.ok(anchors.length >= 3, q.id);
    const results = anchors.map(input => evaluateAnswer(q, input));
    assert.ok(results.every(r => r.valid && r.score <= 40), `${q.id}: accessible low-score entry points`);
    assert.equal(new Set(results.map(r => r.canonical)).size, anchors.length, `${q.id}: distinct anchors`);
  }
  for (const category of CATEGORIES) assert.ok(PLAYABLE_QUESTIONS.filter(q => q.category === category.id).length >= 30);
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    for (const mode of ['daily', 'unlimited']) {
      const dateKey = new Date(Date.UTC(2026, 10, 7 + i)).toISOString().slice(0, 10);
      const run = createRun({ mode, dateKey, seed: `playability-${i}` });
      assert.equal(run.poolVersion, 2);
      assert.equal(new Set(run.questions.map(q => q.id)).size, 7);
      for (const q of run.questions) {
        assert.ok(ids.has(q.id), `${mode}: specialist prompt escaped review`);
        seen.add(q.id);
      }
    }
  }
  assert.equal(seen.size, ids.size, 'all accessible questions remain reachable');
});

test('new content adds 48 distinct broadly answerable prompts across all four themes', () => {
  assert.equal(GENERAL_QUESTIONS.length, 48);
  const oldPrompts = new Set(AUDITED_QUESTIONS.map(q => q.prompt.toLowerCase()));
  for (const category of CATEGORIES) assert.equal(GENERAL_QUESTIONS.filter(q => q.category === category.id).length, 12);
  for (const q of GENERAL_QUESTIONS) {
    assert.ok(!oldPrompts.has(q.prompt.toLowerCase()), q.id);
    assert.ok(q.answers.length >= 24, q.id);
    assert.ok(PLAYABLE_ANCHORS[q.id], q.id);
  }
});

test('reviewed ordinary correct answers accept and unrelated answers stay rejected', () => {
  for (const [id, input] of [
    ['nature-mammals', 'polar bears'], ['nature-trees', 'oak tree'],
    ['culture-instruments', 'electric guitar'], ['culture-music-genres', 'rock music'],
    ['everyday-cooking', 'stir fry'], ['everyday-v5-cleaning-tools', 'dishcloth'],
    ['everyday-v5-desserts', 'apple pie'], ['everyday-v5-cookies', 'chocolate chip'],
  ]) {
    assert.equal(evaluateAnswer(AUDITED_QUESTIONS.find(q => q.id === id), input).valid, false, `baseline ${id}: ${input}`);
    assert.equal(evaluateAnswer(byId.get(id), input).valid, true, `${id}: ${input}`);
  }
  for (const [id, input] of [
    ['nature-mammals', 'sparrow'], ['everyday-cooking', 'refrigerator'],
    ['world-landlocked', 'Gambia'], ['nature-sharks', 'whale'],
    ['everyday-v5-track-field', '9000m'],
  ]) assert.equal(evaluateAnswer(byId.get(id), input).valid, false, `${id}: ${input}`);
});

test('new broad questions accept familiar answers already valid in narrower questions', () => {
  for (const [broad, narrow, input] of [
    ['play-world-cities', 'world-v5-canadian-cities', 'New Westminster'],
    ['play-world-cities', 'world-v5-canadian-cities', 'Penticton'],
    ['play-world-cities', 'world-v5-canadian-cities', 'Port Coquitlam'],
    ['play-nature-pets', 'nature-dog-breeds', 'pitbull'],
    ['play-nature-body-parts', 'nature-human-bones', 'rib cage'],
    ['play-nature-body-parts', 'nature-human-bones', 'pelvis'],
  ]) {
    assert.equal(evaluateAnswer(byId.get(narrow), input).valid, true, `${narrow}: ${input}`);
    assert.equal(evaluateAnswer(byId.get(broad), input).valid, true, `${broad}: ${input}`);
  }
});

test('the entire previous bank remains frozen for version-two scores and matching', () => {
  const hashes = JSON.parse(fixture('dive-v6-bank.json'));
  assert.equal(AUDITED_QUESTIONS.length, Object.keys(hashes).length);
  for (const q of AUDITED_QUESTIONS)
    assert.equal(createHash('sha256').update(JSON.stringify(q)).digest('hex'), hashes[q.id], q.id);
});

test('version-two saved future dailies keep their pool, answers and score through mixed-version resume', () => {
  let raw = fixture('dive-v6-progress.json');
  const expected = JSON.parse(raw);
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const compact = run => ({ ...run, questions: run.questions.map(({ id }) => ({ id })) });
  for (let i = 0; i < 2; i++) {
    const progress = loadProgress(storage);
    assert.equal(progress.played, expected.played);
    assert.equal(progress.total, expected.total);
    assert.deepEqual(progress.history.map(compact), expected.history);
    assert.deepEqual(Object.fromEntries(Object.entries(progress.daily).map(([key, run]) => [key, compact(run)])), expected.daily);
    assert.deepEqual(progress.activeDaily.run.answers, expected.activeDaily.run.answers);
    assert.deepEqual(progress.activeDaily.run.questions.map(q => q.id), expected.activeDaily.run.questions.map(q => q.id));
    assert.equal(saveProgress(storage, progress), true);
  }
  let progress = loadProgress(storage);
  const prefix = progress.activeDaily.run.answers;
  let run = progress.activeDaily.run;
  while (!run.complete) run = recordAnswer(run, run.questions[run.round].answers[0].name);
  assert.deepEqual(run.answers.slice(0, prefix.length), prefix);
  assert.equal(run.answers.at(-1).bankVersion, ANSWER_BANK_VERSION);
  progress = finishRun(progress, run);
  assert.equal(progress.played, expected.played + 1);
  assert.equal(finishRun(progress, run), progress);
  assert.equal(saveProgress(storage, progress), true);
  assert.equal(loadProgress(storage).daily[run.dateKey].score, run.score);
});

test('new pool identity survives reload and unknown pool versions reject', () => {
  let run = createRun({ dateKey: '2026-11-07' });
  run = recordAnswer(run, PLAYABLE_ANCHORS[run.questions[0].id][0]);
  let raw;
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const progress = loadProgress(storage);
  progress.activeDaily = { run, deadline: 0, feedback: true };
  progress.activeDailies[run.dateKey] = progress.activeDaily;
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(loadProgress(storage).activeDaily.run, run);
  assert.throws(() => createRun({ poolVersion: 3 }), RangeError);
});

test('a malformed new-question record cannot discard other saved games or best scores', () => {
  const old = JSON.parse(fixture('dive-v6-progress.json'));
  const newIds = new Set(GENERAL_QUESTIONS.map(q => q.id));
  let run;
  for (let i = 0; i < 100; i++) {
    run = createRun({ mode: 'unlimited', seed: `corrupt-record-${i}` });
    if (run.questions.some(q => newIds.has(q.id))) break;
  }
  assert.ok(run.questions.some(q => newIds.has(q.id)));
  while (!run.complete) run = recordAnswer(run, run.questions[run.round].answers[0].name);
  const progress = finishRun(loadProgress({ getItem: () => JSON.stringify(old) }), run);
  let raw;
  saveProgress({ setItem: (_, value) => { raw = value; } }, progress);
  const index = run.questions.findIndex(q => newIds.has(q.id));
  for (const invalidVersion of [undefined, 1, 2, null, 4]) {
    const malformed = JSON.parse(raw);
    if (invalidVersion === undefined) delete malformed.history[0].answers[index].bankVersion;
    else malformed.history[0].answers[index].bankVersion = invalidVersion;
    const loaded = loadProgress({ getItem: () => JSON.stringify(malformed) });
    assert.equal(loaded.best, progress.best);
    assert.equal(loaded.history.length, old.history.length);
    assert.equal(loaded.played, progress.played);
    assert.ok(loaded.activeDaily);
  }
  const malformed = JSON.parse(raw);
  malformed.history[0].poolVersion = null;
  assert.equal(loadProgress({ getItem: () => JSON.stringify(malformed) }).history.length, old.history.length);
});

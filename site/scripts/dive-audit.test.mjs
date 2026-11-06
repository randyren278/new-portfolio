import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { BASE_QUESTIONS, QUESTIONS, applyAnswerAudit } from '../public/dive/questions.mjs';
import {
  createRun,
  evaluateAnswer,
  recordAnswer,
  finishRun,
  loadProgress,
  saveProgress,
} from '../public/dive/model.mjs';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const find = (id) => QUESTIONS.find((q) => q.id === id);

test('the complete pre-audit catalog stays frozen for historical scoring', () => {
  const hashes = JSON.parse(fixture('dive-v5-bank.json'));
  assert.equal(BASE_QUESTIONS.length, Object.keys(hashes).length);
  for (const q of BASE_QUESTIONS)
    assert.equal(createHash('sha256').update(JSON.stringify(q)).digest('hex'), hashes[q.id]);
});

test('confirmed valid-answer regressions accept common members and native spellings', () => {
  for (const [id, input] of [
    ['world-v5-canadian-cities', 'Surrey'],
    ['world-v5-canadian-cities', 'Burnaby'],
    ['world-capitals', 'Kyoto'],
    ['world-v5-vietnamese-cities', 'Đà Nẵng'],
    ['world-v5-vietnamese-cities', 'Đà Lạt'],
    ['nature-mammals', 'Guinea pig'],
    ['nature-mammals', 'Orca'],
    ['nature-marine-mammals', 'whale'],
    ['nature-primates', 'monkey'],
    ['nature-primates', 'ape'],
    ['nature-wild-canids', 'fox'],
    ['culture-v5-minecraft-mobs', 'Creaking'],
  ])
    assert.equal(evaluateAnswer(find(id), input).valid, true, `${id}: ${input}`);
  for (const [id, input] of [
    ['world-landlocked', 'Gambia'],
    ['nature-sharks', 'Whale'],
    ['culture-instruments', 'villa'],
    ['culture-board-games', 'chest'],
  ])
    assert.equal(evaluateAnswer(find(id), input).valid, false, `${id}: ${input}`);
});

test('all current authored names and aliases resolve to their own identity and score', () => {
  for (const q of QUESTIONS)
    for (const answer of q.answers)
      for (const input of [answer.name, ...(answer.aliases ?? [])]) {
        const result = evaluateAnswer(q, input);
        assert.equal(result.canonical, answer.name, `${q.id}: ${input}`);
        assert.equal(result.score, answer.score);
      }
});

test('old scored answers survive corrections and mixed-version resume counts once', () => {
  let raw = fixture('dive-v5-audit-progress.json');
  const expected = JSON.parse(raw);
  const storage = {
    getItem: () => raw,
    setItem: (_key, next) => {
      raw = next;
    },
  };
  let progress = loadProgress(storage);
  assert.equal(progress.played, expected.played);
  assert.equal(progress.total, expected.total);
  for (let i = 0; i < expected.history.length; i++)
    assert.deepEqual(progress.history[i].answers, expected.history[i].answers);
  const prefix = progress.activeDaily.run.answers;
  let resumed = recordAnswer(
    progress.activeDaily.run,
    progress.activeDaily.run.questions[progress.activeDaily.run.round].answers[0].name,
  );
  assert.deepEqual(resumed.answers.slice(0, prefix.length), prefix);
  assert.equal(resumed.answers.at(-1).bankVersion, 2);
  progress.activeDaily = { run: resumed, deadline: 0, feedback: true };
  progress.activeDailies[resumed.dateKey] = progress.activeDaily;
  assert.equal(saveProgress(storage, progress), true);
  progress = loadProgress(storage);
  resumed = progress.activeDaily.run;
  assert.deepEqual(resumed.answers.slice(0, prefix.length), prefix);
  assert.equal(resumed.answers.at(-1).bankVersion, 2);
  while (!resumed.complete)
    resumed = recordAnswer(resumed, resumed.questions[resumed.round].answers[0].name);
  const finished = finishRun(progress, resumed);
  assert.equal(finished.played, expected.played + 1);
  assert.equal(finishRun(finished, resumed), finished);
});

test('audit overlay can remove every alias, merge identities and edit new aliases', () => {
  const base = {
    id: 'fixture',
    prompt: 'Name a fixture.',
    answers: [
      { name: 'stable form', score: 40, aliases: ['legacy token'] },
      { name: 'duplicate form', score: 80, aliases: ['duplicate token'] },
    ],
  };
  const changed = applyAnswerAudit(base, {
    merge: { 'duplicate form': 'stable form' },
    removeAliases: { 'stable form': ['legacy token'], 'new form': ['unwanted token'] },
    aliases: { 'new form': ['new token'] },
    additions: [{ name: 'new form', score: 55, aliases: ['unwanted token'] }],
  });
  assert.equal(evaluateAnswer(changed, 'legacy token').valid, false);
  assert.equal(evaluateAnswer(changed, 'duplicate token').score, 40);
  assert.equal(evaluateAnswer(changed, 'new token').score, 55);
  assert.equal(evaluateAnswer(changed, 'unwanted token').valid, false);
  assert.deepEqual(base.answers[0].aliases, ['legacy token']);
});

test('versioned matching supports uppercase transliteration and rejects unknown versions', () => {
  const question = {
    preciseMatching: true,
    matchingVersion: 2,
    answers: [{ name: 'Straße', score: 50 }],
  };
  assert.equal(evaluateAnswer(question, 'STRAẞE').canonical, 'Straße');
  const run = createRun();
  for (const bankVersion of [0, 3, null, '1'])
    assert.throws(() => recordAnswer(run, 'anything', { bankVersion }), RangeError);
});

test('current matching accepts short and irregular plurals without fuzzy numeric changes', () => {
  for (const [id, input, canonical] of [
    ['nature-mammals', 'cats', 'cat'],
    ['nature-mammals', 'mice', 'mouse'],
    ['nature-birds', 'geese', 'goose'],
    ['everyday-kitchen', 'knives', 'knife'],
    ['nature-animal-body-parts', 'hooves', 'hoof'],
    ['everyday-furniture', 'shelves', 'shelf'],
  ]) assert.equal(evaluateAnswer(find(id), input).canonical.toLowerCase(), canonical);
  const question = { matchingVersion: 2, answers: [{ name: 'Canada goose', score: 40 }] };
  assert.equal(evaluateAnswer(question, 'Canada geese').canonical, 'Canada goose');
  const track = find('everyday-v5-track-field');
  assert.equal(evaluateAnswer(track, '9000m').valid, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { QUESTIONS, PLAYABLE_QUESTIONS, LEGACY_QUESTIONS, CATEGORIES } from '../public/dive/questions.mjs';
import { createRun, evaluateAnswer, loadProgress, saveProgress } from '../public/dive/model.mjs';
import { rarityFor } from '../public/dive/rarity.mjs';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const legacy = JSON.parse(fixture('dive-legacy-bank.json'));
const legacyIds = new Set(LEGACY_QUESTIONS.map((q) => q.id));
const extra = QUESTIONS.filter((q) => !legacyIds.has(q.id));

test('expansion adds 300 distinct prompts and at least 7000 accepted answer entries', () => {
  assert.ok(extra.length >= 300);
  assert.ok(extra.reduce((sum, q) => sum + q.answers.length, 0) >= 7000);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  assert.equal(new Set(QUESTIONS.map((q) => q.prompt.toLowerCase())).size, QUESTIONS.length);
  for (const category of CATEGORIES)
    assert.ok(extra.filter((q) => q.category === category.id).length >= 70);
  for (const q of extra) {
    assert.ok(q.answers.length >= 8, `${q.id} has a useful answer bank`);
    assert.ok(q.prompt.length <= 125, `${q.id} prompt stays concise`);
    const bands = new Set(q.answers.map((a) => rarityFor(a.score).id));
    if (q.scoringVersion) {
      assert.ok(bands.has('plankton'), `${q.id} has familiar entry points`);
      assert.ok(bands.has('rare'), `${q.id} has reviewed rare choices`);
      assert.ok(bands.size >= 3, `${q.id} offers differentiated rewards`);
    } else assert.equal(bands.size, 6, `${q.id} retains historical rarity coverage`);
    for (const answer of q.answers) {
      for (const text of [answer.name, ...(answer.aliases ?? [])]) {
        assert.ok(text.trim() && text.length <= 80, `${q.id}: usable input length`);
        const result = evaluateAnswer(q, text);
        assert.equal(result.canonical, answer.name, `${q.id}: ${text} resolves unambiguously`);
        assert.equal(result.score, answer.score);
      }
    }
  }
});

test('all legacy question content and scores remain byte-for-byte equivalent', () => {
  assert.equal(LEGACY_QUESTIONS.length, legacy.count);
  for (const q of LEGACY_QUESTIONS)
    assert.equal(
      createHash('sha256').update(JSON.stringify(q)).digest('hex'),
      legacy.digests[q.id],
    );
  for (const expected of legacy.daily) {
    const actual = createRun({ dateKey: expected.dateKey, poolVersion: 1 });
    assert.equal(actual.id, expected.id);
    assert.deepEqual(
      actual.questions.map((q) => q.id),
      expected.questions,
    );
  }
});

test('pre-expansion completed and unfinished browser saves survive load and resave', () => {
  let raw = fixture('dive-legacy-progress.json');
  const expected = JSON.parse(raw);
  const storage = {
    getItem: () => raw,
    setItem: (_key, next) => {
      raw = next;
    },
  };
  for (let i = 0; i < 2; i++) {
    const saved = loadProgress(storage);
    assert.equal(saved.best, 700);
    assert.equal(saved.played, expected.played);
    assert.equal(saved.daily['2026-11-05'].score, 700);
    assert.deepEqual(saved.daily['2026-11-05'].answers, expected.daily['2026-11-05'].answers);
    assert.equal(saved.activeDaily.run.round, 1);
    assert.equal(saved.activeDaily.feedback, true);
    assert.deepEqual(saved.activeDaily.run.answers, expected.activeDaily.run.answers);
    assert.equal(saveProgress(storage, saved), true);
  }
});

test('new daily schedule and all unlimited themes actually draw expanded content', () => {
  const oldIds = new Set(LEGACY_QUESTIONS.map((q) => q.id));
  const daily = createRun({ dateKey: '2026-11-07' });
  assert.ok(daily.questions.some((q) => !oldIds.has(q.id)));
  assert.deepEqual(daily, createRun({ dateKey: '2026-11-07', seed: 'ignored' }));
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const run = createRun({ mode: 'unlimited', seed: `expansion-coverage-${i}` });
    assert.equal(new Set(run.questions.map((q) => q.id)).size, 7);
    for (const q of run.questions) seen.add(q.id);
  }
  assert.deepEqual([...seen].sort(), PLAYABLE_QUESTIONS.map(q => q.id).sort());
  for (const category of CATEGORIES) {
    const run = createRun({ mode: 'unlimited', category: category.id, seed: 'expanded-theme' });
    assert.ok(run.questions.every((q) => q.category === category.id));
    assert.ok(run.questions.some((q) => !oldIds.has(q.id)));
  }
});

test('new answer matching handles names and symbols without changing numeric answers', () => {
  const find = (id) => QUESTIONS.find((q) => q.id === id);
  const track = find('everyday-v5-track-field');
  assert.equal(evaluateAnswer(track, '3000m').canonical, '3000 meters');
  assert.equal(evaluateAnswer(track, '5000m').canonical, '5000 meters');
  assert.equal(evaluateAnswer(track, '6000m').valid, false);
  assert.equal(evaluateAnswer(track, '9000m').valid, false);
  const pokemon = find('culture-v5-kanto-pokemon');
  assert.equal(pokemon.answers.length, 151);
  assert.equal(find('world-v5-us-parks').answers.length, 63);
  assert.equal(find('world-v5-scheduled-indian-languages').answers.length, 22);
  assert.equal(evaluateAnswer(pokemon, 'Nidoran♀').canonical, 'Nidoran female');
  assert.equal(evaluateAnswer(pokemon, 'Nidoran♂').canonical, 'Nidoran male');
  assert.equal(evaluateAnswer(pokemon, 'Nidoran').valid, false);
  assert.equal(evaluateAnswer(find('culture-v5-novelists'), 'Tolkien').valid, true);
  assert.equal(evaluateAnswer(find('world-v5-lakes'), 'Superior').valid, true);
  assert.equal(evaluateAnswer(find('world-v5-canadian-parks'), 'Banff National Park').valid, true);
  assert.equal(evaluateAnswer(find('nature-butterflies'), 'monarch butterfly').valid, true);
});

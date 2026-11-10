import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  QUESTIONS, VERSION_THREE_QUESTIONS, PLAYABLE_QUESTIONS, ANSWER_BANK_VERSION,
} from '../public/dive/questions.mjs';
import { SCORE_REVIEW } from '../public/dive/score-review.mjs';
import { EDITORIAL_POINTS, CONSERVATIVE_POINTS, reviewQuestionBank } from '../public/dive/score-calibration.mjs';
import { pluralForms } from '../public/dive/answer-matching.mjs';
import {
  answerKey, createRun, evaluateAnswer, recordAnswer, finishRun, loadProgress, saveProgress,
} from '../public/dive/model.mjs';

const byId = new Map(QUESTIONS.map((question) => [question.id, question]));
const grade = (id, input) => evaluateAnswer(byId.get(id), input);

test('every selectable prompt has explicit common, uncommon and rare editorial anchors', () => {
  assert.equal(ANSWER_BANK_VERSION, 4);
  assert.equal(PLAYABLE_QUESTIONS.length, 255);
  assert.deepEqual(Object.keys(SCORE_REVIEW).sort(), PLAYABLE_QUESTIONS.map((q) => q.id).sort());
  for (const question of PLAYABLE_QUESTIONS) {
    const review = SCORE_REVIEW[question.id];
    assert.ok(review.common.length >= 3, `${question.id}: common anchors`);
    assert.ok(review.uncommon.length >= 1, `${question.id}: uncommon anchor`);
    assert.ok(review.rare.length >= 1, `${question.id}: rare anchor`);
    for (const [tier, names] of Object.entries(review)) {
      for (const name of names) {
        const answer = evaluateAnswer(question, name);
        assert.equal(answer.valid, true, `${question.id}: ${name}`);
        assert.ok(answer.score <= EDITORIAL_POINTS[tier], `${question.id}: ${name} must not gain points from an alias`);
      }
    }
    for (const answer of question.answers) {
      assert.ok(Object.values(EDITORIAL_POINTS).includes(answer.score));
      assert.ok(['reviewed', 'conservative'].includes(answer.scoreBasis));
      if (answer.scoreBasis === 'conservative') assert.equal(answer.score, CONSERVATIVE_POINTS);
      if (answer.score >= 95) {
        const names = [answer.name, ...(answer.aliases ?? [])].map((name) => answerKey(question, name));
        assert.ok(review.exceptional.some((name) => names.includes(answerKey(question, name))), `${question.id}: jackpot requires an explicit review`);
      }
    }
  }
});

test('entry ordering cannot change current scores, matching or canonical concepts', () => {
  const reversed = reviewQuestionBank(VERSION_THREE_QUESTIONS.map((q) => ({ ...q, answers: [...q.answers].reverse() })));
  const reversedById = new Map(reversed.map((q) => [q.id, q]));
  for (const question of PLAYABLE_QUESTIONS) {
    for (const answer of question.answers) {
      const result = evaluateAnswer(reversedById.get(question.id), answer.name);
      assert.equal(result.valid, true, `${question.id}: ${answer.name}`);
      assert.equal(result.score, answer.score, `${question.id}: ${answer.name}`);
    }
  }
});

test('ordinary cooking, camping, spreads and drinks do not receive arbitrary rare rewards', () => {
  for (const [id, inputs] of [
    ['everyday-cooking', ['baking', 'toasting', 'chopping', 'slicing']],
    ['everyday-v5-camping-gear', ['water filter', 'headlamp', 'toilet paper']],
    ['play-everyday-sandwich-fillings', ['cheese', 'mayonnaise', 'mustard', 'butter']],
    ['play-everyday-cold-drinks', ['milk', 'chocolate milk', 'iced coffee', 'iced latte']],
  ]) {
    for (const input of inputs) {
      const answer = grade(id, input);
      assert.equal(answer.valid, true, `${id}: ${input}`);
      assert.ok(answer.score <= 34, `${id}: ${input} should be familiar`);
    }
  }
  assert.equal(grade('everyday-v5-camping-gear', 'water filter').score, 30);
  assert.ok(grade('culture-instruments', 'glass harmonica').score > grade('culture-instruments', 'piano').score);
});

test('equivalent names and plural forms cannot select a different reward', () => {
  assert.equal(grade('everyday-v5-sports-gear', 'ski').score, grade('everyday-v5-sports-gear', 'skis').score);
  assert.equal(grade('everyday-v5-sports-gear', 'ski').canonical, grade('everyday-v5-sports-gear', 'skis').canonical);
  for (const question of PLAYABLE_QUESTIONS) {
    const exactNames = new Map(question.answers.flatMap((answer) =>
      [answer.name, ...(answer.aliases ?? [])].map((name) => [answerKey(question, name), answer]),
    ));
    for (const answer of question.answers) {
      for (const name of [answer.name, ...(answer.aliases ?? [])]) {
        const exact = evaluateAnswer(question, name);
        assert.equal(exact.valid, true, `${question.id}: ${name}`);
        assert.equal(exact.score, answer.score, `${question.id}: ${name}`);
        for (const plural of pluralForms(answerKey(question, name))) {
          const result = evaluateAnswer(question, plural);
          const expected = exactNames.get(plural) ?? answer;
          if (result.valid) assert.equal(result.score, expected.score, `${question.id}: ${name}/${plural}`);
        }
      }
    }
  }
});

test('chemical symbols, proper names, code suffixes and genre names retain distinct identities', () => {
  for (const [id, left, right] of [
    ['nature-elements', 'oxygen', 'osmium'],
    ['nature-elements', 'hydrogen', 'hassium'],
    ['nature-elements', 'carbon', 'caesium'],
    ['world-v5-canadian-cities', 'Saint John', 'St John’s'],
    ['play-world-cities', 'Saint John', 'St John’s'],
    ['everyday-v5-file-extensions', 'c', 'cs'],
    ['culture-music-genres', 'afrobeat', 'afrobeats'],
  ]) {
    const a = grade(id, left), b = grade(id, right);
    assert.equal(a.valid, true, `${id}: ${left}`);
    assert.equal(b.valid, true, `${id}: ${right}`);
    assert.notEqual(a.canonical, b.canonical, `${id}: ${left} and ${right} are different concepts`);
  }
  for (const [symbol, element] of [['O', 'oxygen'], ['Os', 'osmium'], ['H', 'hydrogen'], ['Hs', 'hassium'], ['C', 'carbon'], ['Cs', 'caesium']]) {
    assert.equal(grade('nature-elements', symbol).canonical, element);
  }
});

test('every merge of previously distinct stored names is an explicitly reviewed equivalent', () => {
  const merged = [];
  for (const previous of VERSION_THREE_QUESTIONS) {
    const current = byId.get(previous.id);
    const grouped = new Map();
    for (const answer of previous.answers) {
      const result = evaluateAnswer(current, answer.name);
      if (!grouped.has(result.canonical)) grouped.set(result.canonical, []);
      grouped.get(result.canonical).push(answer.name);
    }
    for (const names of grouped.values()) {
      if (names.length > 1) merged.push({ id: previous.id, names: names.sort() });
    }
  }
  assert.deepEqual(merged, [
    { id: 'everyday-v5-bedroom', names: ['book', 'books'] },
    { id: 'everyday-v5-sports-gear', names: ['ski', 'skis'] },
  ]);
});

test('clear ordinary variants and newly reviewed valid members are accepted without broadening categories', () => {
  for (const [id, variant, canonical] of [
    ['nature-human-organs', 'thyroid gland', 'thyroid'],
    ['play-nature-body-parts', 'thyroid gland', 'thyroid'],
    ['everyday-stationery', 'ballpoint', 'ballpoint pen'],
    ['everyday-stationery', 'whiteboard marker', 'marker'],
  ]) {
    assert.equal(grade(id, variant).valid, true, `${id}: ${variant}`);
    assert.equal(grade(id, variant).canonical, grade(id, canonical).canonical);
    assert.equal(grade(id, variant).score, grade(id, canonical).score);
  }
  for (const id of ['world-v5-canadian-cities', 'play-world-cities'])
    for (const input of ['Lethbridge', 'Grande Prairie', 'Prince Albert']) assert.equal(grade(id, input).valid, true, `${id}: ${input}`);
  assert.equal(grade('play-world-cities', 'Durban').valid, true);
  for (const id of ['nature-mammals', 'play-nature-four-legged-animals'])
    for (const input of ['tenrec', 'solenodon', 'fossa']) assert.equal(grade(id, input).valid, true, `${id}: ${input}`);
  for (const [id, input] of [
    ['world-v5-canadian-cities', 'Durban'], ['nature-wild-cats', 'fossa'],
    ['nature-human-organs', 'whiteboard marker'], ['nature-birds', 'tenrec'],
  ]) assert.equal(grade(id, input).valid, false, `${id}: ${input}`);
});

test('known valid ensembles and members of narrower categories work in broad prompts', () => {
  for (const [id, inputs] of [
    ['play-culture-music-groups', ['brass quintet', 'brass quintets', 'wind quintet', 'piano trio', 'chamber orchestra']],
    ['nature-mammals', ['aardvark', 'dunnart', 'uakari', 'takin', 'xoloitzcuintli']],
    ['nature-birds', ['caracara', 'kittiwake']],
    ['nature-reptiles', ['uromastyx', 'Brahminy blind snake']],
    ['play-nature-body-parts', ['uvula', 'diaphragm', 'thymus']],
  ]) for (const input of inputs) assert.equal(grade(id, input).valid, true, `${id}: ${input}`);
  for (const [id, input] of [
    ['nature-mammals', 'owl'], ['nature-mammals', 'sparrow'], ['nature-reptiles', 'frog'],
    ['nature-birds', 'bat'], ['play-culture-music-groups', 'trumpet'],
    ['world-island-countries', 'canada'], ['everyday-v5-appliances', 'washing machine'],
    ['everyday-v5-track-field', '9000m'], ['nature-sharks', 'whale'],
  ]) assert.equal(grade(id, input).valid, false, `${id}: ${input}`);
});

test('new organ names and aliases propagate to the broader body-part prompt', () => {
  for (const id of ['nature-human-organs', 'play-nature-body-parts']) {
    for (const input of ['thyroid gland', 'parathyroid gland', 'parathyroid glands'])
      assert.equal(grade(id, input).valid, true, `${id}: ${input}`);
    assert.equal(grade(id, 'ballpoint pen').valid, false);
  }
  assert.equal(grade('everyday-stationery', 'biro').canonical,
    grade('everyday-stationery', 'ballpoint pen').canonical);
});

test('the complete version-three bank stays byte-identical for historical answer validation', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(VERSION_THREE_QUESTIONS)).digest('hex'),
    'e931b62f570a7a729db45c019e1cd9f9a0336de7fd290ce29266abf19c5c2b42');
  const oldCamping = VERSION_THREE_QUESTIONS.find((q) => q.id === 'everyday-v5-camping-gear');
  assert.equal(evaluateAnswer(oldCamping, 'water filter').score, 100);
  assert.equal(grade('everyday-v5-camping-gear', 'water filter').score, 30);
});

test('version-three completed and partial saves retain scores through mixed-version resume', () => {
  let run = createRun({ dateKey: '2026-11-10' });
  run = recordAnswer(run, 'chess', { bankVersion: 3 });
  run = recordAnswer(run, 'water filter', { bankVersion: 3 });
  assert.deepEqual(run.answers.map((answer) => answer.score), [12, 100]);
  const oldPrefix = structuredClone(run.answers);
  let raw;
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  let progress = loadProgress(storage);
  progress.activeDaily = { run, deadline: 0, feedback: true };
  progress.activeDailies[run.dateKey] = progress.activeDaily;
  saveProgress(storage, progress);
  progress = loadProgress(storage);
  assert.ok(progress.activeDaily);
  run = progress.activeDaily.run;
  assert.deepEqual(run.answers, oldPrefix);
  while (!run.complete) run = recordAnswer(run, run.questions[run.round].answers[0].name);
  assert.deepEqual(run.answers.slice(0, 2), oldPrefix);
  assert.equal(run.answers.at(-1).bankVersion, 4);
  progress = finishRun(progress, run);
  saveProgress(storage, progress);
  const reloaded = loadProgress(storage);
  assert.deepEqual(reloaded.daily[run.dateKey].answers, run.answers);
  assert.equal(reloaded.daily[run.dateKey].score, run.score);
  assert.equal(reloaded.played, 1);
  assert.equal(finishRun(reloaded, run), reloaded);
});

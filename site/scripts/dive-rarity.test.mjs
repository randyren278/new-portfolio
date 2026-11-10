import test from 'node:test';
import assert from 'node:assert/strict';
import { RARITY_BANDS, rarityFor, diveRarityFor, ratingExamples, rarityJourney } from '../public/dive/rarity.mjs';

test('every possible earned score maps to exactly one of six ordered rarity bands', () => {
  assert.equal(RARITY_BANDS.length, 6);
  for (let score = 1; score <= 100; score++) {
    const matches = RARITY_BANDS.filter((band) => score >= band.min && score <= band.max);
    assert.equal(matches.length, 1);
    assert.equal(rarityFor(score), matches[0]);
  }
  for (const score of [0, -1, 101, NaN, Infinity]) assert.equal(rarityFor(score), null);
});

test('rating explanations select distinct ordered examples without changing their scores', () => {
  const question = { answers: [
    { name: 'rare', score: 85 }, { name: 'common', score: 12 },
    { name: 'uncommon', score: 45 }, { name: 'other common', score: 20 },
  ] };
  const original = JSON.stringify(question);
  const examples = ratingExamples(question);
  assert.deepEqual(examples.map(answer => answer.label), ['Common', 'Uncommon', 'Rare']);
  assert.ok(examples.every(answer => answer.score >= answer.tier.min && answer.score <= answer.tier.max));
  assert.equal(new Set(examples.map(answer => answer.name)).size, examples.length);
  assert.equal(JSON.stringify(question), original);
  assert.deepEqual(ratingExamples({ answers: [] }), []);
});

test('the journey scale exposes each tier and its point range', () => {
  const html = rarityJourney(rarityFor(85));
  for (const band of RARITY_BANDS) {
    assert.ok(html.includes(band.label));
    assert.ok(html.includes(`${band.min}–${band.max}`));
  }
  assert.ok(html.includes('--journey-rank:4'));
});

test('rating examples explain reviewed tiers without presenting provisional scores as reviewed', () => {
  const examples = ratingExamples({ answers: [
    { name: 'reviewed common', score: 15, scoreBasis: 'reviewed' },
    { name: 'unreviewed', score: 45, scoreBasis: 'conservative' },
    { name: 'reviewed rare', score: 65, scoreBasis: 'reviewed' },
  ] });
  assert.deepEqual(examples.map(answer => answer.name), ['reviewed common', 'reviewed rare']);
});

test('comparison examples preserve Common and Rare when adjacent tiers have more entries', () => {
  const answers = [
    { name: 'common', score: 15 },
    ...Array.from({ length: 8 }, (_, i) => ({ name: `familiar ${i}`, score: 30 })),
    { name: 'uncommon', score: 45 }, { name: 'rare', score: 65 },
    ...Array.from({ length: 8 }, (_, i) => ({ name: `deep ${i}`, score: 85 })),
  ];
  assert.deepEqual(ratingExamples({ answers }).map(answer => answer.name), ['common', 'uncommon', 'rare']);
});

test('rarity boundaries distinguish all six reward types', () => {
  for (const [score, label] of [
    [12, 'plankton'],
    [20, 'tooclever'],
    [35, 'schooler'],
    [55, 'rare'],
    [75, 'deepcut'],
    [95, 'krillion'],
    [100, 'krillion'],
  ])
    assert.equal(rarityFor(score).id, label);
});

test('final dive rating uses total score without rewriting saved answer scores', () => {
  for (const [score, label] of [
    [0, 'plankton'],
    [150, 'plankton'],
    [151, 'schooler'],
    [251, 'rare'],
    [351, 'deepcut'],
    [450, 'krillion'],
    [700, 'krillion'],
  ])
    assert.equal(diveRarityFor(score).id, label);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { RARITY_BANDS, rarityFor, diveRarityFor } from '../public/dive/rarity.mjs';

test('every possible earned score maps to exactly one of six ordered rarity bands', () => {
  assert.equal(RARITY_BANDS.length, 6);
  for (let score = 1; score <= 100; score++) {
    const matches = RARITY_BANDS.filter((band) => score >= band.min && score <= band.max);
    assert.equal(matches.length, 1);
    assert.equal(rarityFor(score), matches[0]);
  }
  for (const score of [0, -1, 101, NaN, Infinity]) assert.equal(rarityFor(score), null);
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

import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiveJourney, oceanZone, rodTip } from '../public/dive/journey.mjs';

test('a catch holds, travels and settles before completing on the same depth/rating clock', () => {
  const journey = createDiveJourney({ from: 1840, to: 2700, rank: 4 });
  assert.equal(journey.sample(0).phase, 'anticipation');
  assert.equal(journey.sample(179).depth, 1840);
  assert.equal(journey.sample(181).phase, 'descent');
  let previous = journey.from;
  for (let elapsed = 0; elapsed < journey.duration; elapsed += 7) {
    const frame = journey.sample(elapsed);
    assert.ok(frame.depth >= previous && frame.depth <= 2700);
    assert.ok(Math.abs(frame.depth - (1840 + 860 * frame.progress)) < 1e-8);
    assert.ok(Math.abs(frame.rarityProgress - 4 * frame.progress) < 1e-8);
    previous = frame.depth;
  }
  assert.equal(journey.sample(journey.duration - 1).phase, 'settle');
  assert.deepEqual(journey.sample(journey.duration), { phase: 'landed', phaseProgress: 1, progress: 1, depth: 2700, rarityProgress: 4, velocity: 0 });
});

test('long gains visibly travel longer, with a short bounded total duration', () => {
  const small = createDiveJourney({ from: 0, to: 100 });
  const large = createDiveJourney({ from: 0, to: 1000 });
  const max = createDiveJourney({ from: 0, to: 7000 });
  assert.ok(small.duration < large.duration);
  assert.ok(large.duration < max.duration);
  assert.ok(small.duration >= 1000 && max.duration <= 2000);
  for (const journey of [small, large, max]) {
    assert.equal(journey.sample(180).velocity, 0);
    assert.equal(journey.sample(journey.duration - 220).velocity, 0);
  }
});

test('misses hold position and reduced motion reaches the same outcome immediately', () => {
  const miss = createDiveJourney({ from: 3300, to: 3300, rank: -1 });
  assert.ok(miss.duration <= 400);
  for (let elapsed = 0; elapsed <= miss.duration; elapsed += 10) {
    const frame = miss.sample(elapsed);
    assert.equal(frame.depth, 3300);
    assert.equal(frame.rarityProgress, 0);
    assert.notEqual(frame.phase, 'descent');
  }
  const quiet = createDiveJourney({ from: 100, to: 1100, rank: 5, reducedMotion: true });
  assert.equal(quiet.duration, 0);
  assert.equal(quiet.sample(0).phase, 'landed');
  assert.equal(quiet.sample(0).depth, 1100);
  assert.equal(quiet.sample(0).rarityProgress, 5);
});

test('the deep-water line keeps its rod origin continuously across the former boat cutoff', () => {
  const geometry = { width: 390, height: 844, portrait: true, time: 0 };
  const before = rodTip({ ...geometry, surface: -149.99 });
  const after = rodTip({ ...geometry, surface: -150.01 });
  assert.equal(before.x, after.x);
  assert.ok(Math.abs(after.y - before.y + 0.02) < 1e-8);
  assert.ok(after.y < -200);
});

test('depth zones have distinct stable boundaries', () => {
  assert.deepEqual([0, 199, 200, 1999, 2000, 3999, 4000, 5999, 6000, 7000].map(oceanZone), ['surface', 'surface', 'twilight', 'twilight', 'midnight', 'midnight', 'abyss', 'abyss', 'hadal', 'hadal']);
});

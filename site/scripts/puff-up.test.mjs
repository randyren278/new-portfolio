import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  stepRun,
  scoreForPeak,
  difficultyForScore,
  platformAtTime,
  SPRING_SPEED,
} from '../public/puff-up/game/climb.js';
import { FIXED_DT, DEFAULT_TUNING, createState, step } from '../public/puff-up/game/physics.js';
const center = (p) => p.x + p.width / 2;
const steer = (p, x) => {
  const v = (x - p.x) * 0.035 - p.vx * 0.012;
  return Math.abs(v) < 0.15 ? 0 : Math.sign(v);
};
function target(run) {
  const y = run.lastLanding?.y ?? 575;
  const platform = run.platforms.filter((p) => p.y < y).sort((a, b) => b.y - a.y)[0];
  return platform ? platformAtTime(platform, run.player.timeMs + 300) : null;
}
function play(seed, ticks = 3000) {
  let run = createRun(seed);
  for (let i = 0; i < ticks && run.status === 'playing'; i++) {
    const p = target(run);
    run = stepRun(run, { axis: p ? steer(run.player, center(p)) : 0 });
  }
  return run;
}
test('seeded replays and updates are immutable and JSON-safe', () => {
  const a = createRun(12),
    original = structuredClone(a);
  let one = a,
    two = createRun(12);
  for (let i = 0; i < 500; i++) {
    const input = { axis: i % 90 < 45 ? 1 : -1 };
    one = stepRun(one, input);
    two = stepRun(two, input);
  }
  assert.deepEqual(one, two);
  assert.deepEqual(a, original);
  assert.deepEqual(JSON.parse(JSON.stringify(one)), one);
  assert.notDeepEqual(createRun(2).platforms, createRun(3).platforms);
});
test('launchpad vanishes but the first stone remains safe across repeated opening bounces', () => {
  let run = stepRun(createRun());
  assert.ok(!run.platforms.some((p) => p.id === 'floor'));
  assert.ok(run.effects.some((e) => e.type === 'break' && e.y === 575));
  for (let i = 0; i < 600; i++) run = stepRun(run);
  assert.equal(run.status, 'playing');
  assert.equal(run.lastLanding.id, '01');
  assert.ok(run.landings >= 4);
  assert.equal(run.platforms.find((p) => p.id === '01').kind, 'solid');
});
test('falling below the view still ends the run and later updates preserve terminal state', () => {
  let run = {
    ...createRun(),
    player: {
      ...createState(),
      x: 600,
      y: 699,
      vy: 900,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  };
  run = stepRun(run);
  assert.equal(run.status, 'over');
  assert.equal(stepRun(run, { axis: 1 }), run);
});
test('later crumble contacts bounce once, remove support, and cannot catch the next descent', () => {
  let run = {
    ...createRun(1),
    platforms: [
      { id: 'crumble-test', x: 80, y: 465, width: 160, kind: 'crumble' },
      { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: 140,
      y: 460,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  };
  for (let i = 0; i < 10 && !run.lastLanding; i++) run = stepRun(run);
  assert.equal(run.lastLanding.kind, 'crumble');
  assert.equal(run.lastLanding.id, 'crumble-test');
  assert.ok(run.player.vy < 0);
  assert.ok(!run.platforms.some((p) => p.id === 'crumble-test'));
  assert.ok(run.effects.some((e) => e.type === 'break' && e.y === 465));
  const landings = run.landings;
  for (let i = 0; i < 200 && run.status === 'playing'; i++) run = stepRun(run);
  assert.equal(run.landings, landings);
  assert.equal(run.status, 'over');
});
test('spring contacts preserve impact event and produce a higher real trajectory', () => {
  const make = (kind) => ({
    ...createRun(1),
    platforms: [
      { id: 'spring-test', x: 80, y: 465, width: 160, kind },
      { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: 140,
      y: 460,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  });
  let spring = make('spring'),
    solid = make('solid');
  for (let i = 0; i < 10 && !spring.lastLanding; i++) {
    spring = stepRun(spring);
    solid = stepRun(solid);
  }
  assert.equal(spring.player.vy, -SPRING_SPEED);
  assert.equal(spring.lastLanding.kind, 'spring');
  assert.ok(spring.player.landSpeed > 0);
  assert.ok(spring.effects.some((e) => e.type === 'spring'));
  let sp = spring.player.y,
    np = solid.player.y;
  for (let i = 0; i < 90; i++) {
    spring = stepRun(spring);
    solid = stepRun(solid);
    sp = Math.min(sp, spring.player.y);
    np = Math.min(np, solid.player.y);
  }
  assert.ok(np - sp > 90);
});
test('movers are analytic, bounded, deterministic and participate in actual collisions', () => {
  const p = {
    id: 'm',
    x: 260,
    baseX: 260,
    y: 470,
    width: 94,
    kind: 'moving',
    amplitude: 24,
    periodMs: 2400,
    phase: 0,
  };
  for (let t = 0; t < 10000; t += 17) {
    const at = platformAtTime(p, t);
    assert.ok(Math.abs(at.x - p.baseX) <= 24);
    assert.deepEqual(at, platformAtTime(p, t));
  }
  const at = platformAtTime(p, 600);
  assert.equal(at.x, 284);
  const state = {
    ...createState(),
    x: 330,
    y: 465,
    vy: 300,
    grounded: false,
    platformId: null,
    coyoteMsLeft: 0,
  };
  const hit = step(state, {}, 1 / 30, DEFAULT_TUNING, [at]);
  assert.equal(hit.platformId, 'm');
  assert.equal(hit.y, 470);
});
test('difficulty narrows ledges and raises gaps, with all four mechanics introduced early', () => {
  assert.ok(difficultyForScore(200).width < difficultyForScore(0).width);
  assert.ok(difficultyForScore(200).gap > difficultyForScore(0).gap);
  const kinds = new Set(createRun().platforms.map((p) => p.kind));
  assert.deepEqual(kinds, new Set(['crumble', 'solid', 'moving', 'spring']));
  assert.equal(scoreForPeak(365), 21);
});
test('score/camera stay monotonic, effects/platforms bounded, and supports remain visible', () => {
  let run = createRun(42),
    old = run;
  for (let i = 0; i < 12000 && run.status === 'playing'; i++) {
    const p = target(run);
    run = stepRun(run, { axis: p ? steer(run.player, center(p)) : 0 });
    assert.ok(run.score >= old.score && run.cameraY <= old.cameraY && run.peakY <= old.peakY);
    assert.ok(run.platforms.length < 20 && run.effects.length <= 8);
    assert.ok(run.platforms.every((p) => p.y <= run.cameraY + 620));
    assert.ok(run.effects.every((e) => run.player.timeMs - e.at < 650));
    old = run;
  }
});
test('normal jump physics can reach initial consecutive ledges across 32 seeds including the visible default without springs', () => {
  for (const seed of [...Array.from({ length: 31 }, (_, i) => i), 0x50554646]) {
    const platforms = createRun(seed)
      .platforms.filter((p) => p.id !== 'floor')
      .sort((a, b) => b.y - a.y);
    for (let e = 0; e < platforms.length - 1; e++) {
      const from = platforms[e],
        to = platforms[e + 1];
      let p = { ...createState(), x: center(from), y: from.y, platformId: from.id };
      let hit = false;
      for (let i = 0; i < 160; i++) {
        const now = p.timeMs + FIXED_DT * 1000,
          landing = platformAtTime(to, now + 200);
        p = step(p, { axis: steer(p, center(landing)), autoHop: true }, FIXED_DT, DEFAULT_TUNING, [
          { ...from, kind: 'solid' },
          platformAtTime(to, now),
        ]);
        if (p.landed && p.y === to.y) {
          hit = true;
          break;
        }
        if (p.y > from.y + 5) break;
      }
      assert.ok(hit, `seed${seed}: ${from.id}→${to.id}`);
    }
  }
});
test('the moving ledge after the stone opening is reachable at all four phase extremes with normal jumps', () => {
  for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const run = createRun(),
      from = run.platforms.find((p) => p.id === '05'),
      template = run.platforms.find((p) => p.id === '06'),
      to = { ...template, phase };
    let p = { ...createState(), x: center(from), y: from.y, platformId: from.id },
      hit = false;
    for (let i = 0; i < 160; i++) {
      const now = p.timeMs + FIXED_DT * 1000,
        future = platformAtTime(to, now + 200);
      p = step(p, { axis: steer(p, center(future)), autoHop: true }, FIXED_DT, DEFAULT_TUNING, [
        from,
        platformAtTime(to, now),
      ]);
      if (p.landed && p.y === to.y) {
        hit = true;
        break;
      }
      if (p.y > from.y + 5) break;
    }
    assert.ok(hit, `teaching mover phase${phase}`);
  }
});

const steerWith = (p, x, damping) => {
  const intent = (x - p.x) * 0.035 - p.vx * damping;
  return Math.abs(intent) < 0.15 ? 0 : Math.sign(intent);
};
function collectLater(seed) {
  let run = createRun(seed);
  const seen = new Map(run.platforms.map((p) => [p.id, p]));
  for (let i = 0; i < 6000 && run.status === 'playing'; i++) {
    const p = target(run);
    run = stepRun(run, { axis: p ? steerWith(run.player, center(p), 0.008) : 0 });
    for (const ledge of run.platforms) seen.set(ledge.id, ledge);
  }
  return {
    run,
    platforms: [...seen.values()]
      .filter((p) => p.id !== 'floor')
      .sort((a, b) => Number(a.id) - Number(b.id)),
  };
}
test('later generated course edges remain reachable with digital controls at mover phase extremes', () => {
  let cases = 0;
  for (const seed of [...Array.from({ length: 31 }, (_, i) => i), 0x50554646]) {
    const { platforms } = collectLater(seed);
    const springs = platforms.filter((p) => p.kind === 'spring');
    for (let s = 1; s < springs.length; s++)
      assert.ok(Number(springs[s].id) - Number(springs[s - 1].id) >= 4);
    for (let edge = 0; edge < platforms.length - 1; edge++) {
      const source = platforms[edge],
        destination = platforms[edge + 1];
      for (const fromPhase of source.kind === 'moving'
        ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
        : [source.phase])
        for (const toPhase of destination.kind === 'moving'
          ? [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
          : [destination.phase]) {
          const from = platformAtTime(
            source.kind === 'moving' ? { ...source, phase: fromPhase } : source,
            0,
          );
          const to =
            destination.kind === 'moving' ? { ...destination, phase: toPhase } : destination;
          let hit = false;
          cases++;
          for (const policy of [0.008, 0.004, 0.012, 'constant']) {
            let p = { ...createState(), x: center(from), y: from.y, platformId: from.id };
            const dir = Math.sign(center(platformAtTime(to, 500)) - p.x);
            for (let i = 0; i < 150; i++) {
              const now = p.timeMs + FIXED_DT * 1000;
              const axis =
                policy === 'constant'
                  ? dir
                  : steerWith(p, center(platformAtTime(to, now + 200)), policy);
              p = step(p, { axis, autoHop: true }, FIXED_DT, DEFAULT_TUNING, [
                from,
                platformAtTime(to, now),
              ]);
              if (p.landed && p.y === to.y) {
                hit = true;
                break;
              }
              if (p.y > from.y + 5) break;
            }
            if (hit) break;
          }
          assert.ok(hit, `later seed${seed}: ${from.id}→${to.id}, phases${fromPhase}/${toPhase}`);
        }
    }
  }
  console.log(
    'LATER_EDGE_CERTIFICATE',
    JSON.stringify({ seeds: 32, cases, digitalPolicies: 4, passed: cases }),
  );
});

test('1000 fixed seeds produce deterministic varied openings with a safe first catch', () => {
  const openings = new Set(),
    spawns = new Set();
  for (let seed = 0; seed < 1000; seed++) {
    const run = createRun(seed),
      again = createRun(seed),
      first = run.platforms.find((p) => p.id === '01');
    assert.deepEqual(run, again);
    assert.ok(run.player.x >= 180 && run.player.x <= 460);
    assert.ok(Math.abs(center(first) - run.player.x) <= 8);
    for (const id of ['01', '02', '03']) {
      const ledge = run.platforms.find((p) => p.id === id);
      assert.equal(ledge.kind, 'solid');
      assert.equal(platformAtTime(ledge, 12345).x, ledge.x);
    }
    openings.add(JSON.stringify(run.platforms.slice(0, 5)));
    spawns.add(run.player.x);
    if (seed > 0) assert.notDeepEqual(run.platforms, createRun(seed - 1).platforms);
  }
  assert.ok(openings.size > 990);
  assert.ok(spawns.size > 250);
});

test('stone opening applies to uint32 boundary seeds and later special ledges remain', () => {
  for (const seed of [0, 0xffffffff, 0x80000000, 0x50554646]) {
    const run = createRun(seed);
    for (const id of ['01', '02', '03'])
      assert.equal(run.platforms.find((p) => p.id === id).kind, 'solid');
    assert.equal(run.platforms.find((p) => p.id === '04').kind, 'crumble');
    assert.equal(run.platforms.find((p) => p.id === '05').kind, 'spring');
    assert.equal(run.platforms.find((p) => p.id === '06').kind, 'moving');
  }
});

test('every spring offers a direct second-ledge skip with room below the boost apex', () => {
  let cases = 0;
  for (const seed of [...Array.from({ length: 31 }, (_, i) => i), 0x50554646]) {
    const { platforms } = collectLater(seed);
    for (let i = 0; i < platforms.length - 2; i++) {
      const source = platforms[i];
      if (source.kind !== 'spring') continue;
      const middle = platforms[i + 1],
        to = platforms[i + 2];
      assert.equal(to.kind, 'solid', `seed ${seed}: spring ${source.id} reward is stable stone`);
      assert.ok(source.y - to.y <= 216, `seed ${seed}: spring ${source.id} skip has apex margin`);
      for (const start of [-0.25, 0, 0.25])
        for (const vx of [-260, 0, 260])
          for (const phase of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
            const intermediate = middle.kind === 'moving' ? { ...middle, phase } : middle;
            let p = {
              ...createState(),
              x: center(source) + source.width * start,
              y: source.y,
              vx,
              vy: -SPRING_SPEED,
              grounded: false,
              platformId: null,
              coyoteMsLeft: 0,
            };
            let landed = null;
            cases++;
            for (let tick = 0; tick < 180; tick++) {
              const now = p.timeMs + FIXED_DT * 1000;
              p = step(
                p,
                { axis: steerWith(p, center(to), 0.008), autoHop: true },
                FIXED_DT,
                DEFAULT_TUNING,
                [source, platformAtTime(intermediate, now), to],
              );
              if (p.landed) {
                landed = p.y;
                break;
              }
              if (p.y > source.y + 5) break;
            }
            assert.equal(
              landed,
              to.y,
              `seed ${seed}: spring ${source.id} skips ${middle.id}, start ${start} vx ${vx} phase ${phase}`,
            );
          }
    }
  }
  assert.ok(cases > 1000);
  console.log('SPRING_SKIP_CERTIFICATE', JSON.stringify({ cases, passed: cases }));
});

import { shotDirection } from '../public/puff-up/space-scene.js';
for (const [width, height] of [
  [1440, 1000],
  [390, 844],
])
  test(`Puff continues falling beyond old cutoff and exits ${width}x${height}`, () => {
    const scale = Math.min(width / 640, height / 620, 1.25),
      top = (height - 620 * scale) / 2,
      limit = (height - top) / scale + 144;
    let run = createRun(17),
      passedOldLimit = false;
    for (let tick = 0; tick < 600 && run.status !== 'over'; tick++) {
      run = stepRun(run, { axis: 1 }, 1 / 120, limit);
      if (run.player.y - run.cameraY > 700 && run.status === 'playing') passedOldLimit = true;
    }
    assert.ok(passedOldLimit);
    assert.equal(run.status, 'over');
    assert.ok(
      top + (run.player.y - run.cameraY - 144) * scale > height,
      'whole sprite texture must leave viewport',
    );
  });
test('direction selection preserves random choices until three matching stars, then forces reversal', () => {
  assert.equal(shotDirection([], 0), -1);
  assert.equal(shotDirection([], 1), 1);
  assert.equal(shotDirection([-1, -1], 0), -1);
  assert.equal(shotDirection([1, 1], 1), 1);
  assert.equal(shotDirection([-1, -1, -1], 0), 1);
  assert.equal(shotDirection([1, 1, 1], 1), -1);
  for (const random of [0, 1]) {
    const history = [];
    for (let i = 0; i < 100; i++) {
      history.push(shotDirection(history, random));
      if (history.length >= 4) assert.ok(!history.slice(-4).every((d) => d === history.at(-1)));
    }
  }
});

import { bindTouchSteering } from '../public/puff-up/game/touch-steering.js';
function touchFixture({ enabled = true, canSteer = true } = {}) {
  const listeners = new Map(),
    taps = [];
  let starts = 0;
  const canvas = {
    getBoundingClientRect: () => ({ left: 10, width: 400 }),
    setPointerCapture: () => {},
    addEventListener: (type, fn) => listeners.set(type, fn),
  };
  const touch = bindTouchSteering(canvas, {
    enabled: () => enabled,
    canSteer: () => canSteer,
    onStart: () => starts++,
    onTap: (axis) => taps.push(axis),
  });
  const send = (type, pointerId, clientX) =>
    listeners.get(type)({ type, pointerId, clientX, preventDefault() {} });
  return {
    touch,
    send,
    taps,
    get starts() {
      return starts;
    },
  };
}
test('screen halves steer continuously, crossing midpoint reverses, release clears input', () => {
  const f = touchFixture();
  f.send('pointerdown', 1, 40);
  assert.equal(f.touch.axis, -1);
  assert.equal(f.touch.count, 1);
  f.send('pointermove', 1, 360);
  assert.equal(f.touch.axis, 1);
  f.send('pointerup', 1, 360);
  assert.equal(f.touch.axis, 0);
  assert.deepEqual(f.taps, [1]);
});
test('newest finger wins and releasing it restores the other held direction', () => {
  const f = touchFixture();
  f.send('pointerdown', 1, 40);
  f.send('pointerdown', 2, 360);
  assert.equal(f.touch.axis, 1);
  f.send('pointerup', 2, 360);
  assert.equal(f.touch.axis, -1);
  assert.deepEqual(f.taps, []);
  f.send('pointercancel', 1, 40);
  assert.equal(f.touch.axis, 0);
  assert.deepEqual(f.taps, []);
});
test('lost capture and pause clearing cannot leave screen steering stuck', () => {
  const f = touchFixture();
  f.send('pointerdown', 1, 40);
  f.send('lostpointercapture', 1, 40);
  assert.equal(f.touch.axis, 0);
  assert.deepEqual(f.taps, []);
  f.send('pointerdown', 2, 360);
  f.touch.clear();
  f.send('pointerup', 2, 360);
  assert.equal(f.touch.axis, 0);
  assert.equal(f.touch.count, 0);
  assert.deepEqual(f.taps, []);
});
test('desktop canvas clicks and ended runs do not capture steering', () => {
  for (const config of [{ enabled: false }, { canSteer: false }]) {
    const f = touchFixture(config);
    f.send('pointerdown', 1, 40);
    assert.equal(f.touch.axis, 0);
    assert.equal(f.starts, 0);
  }
});

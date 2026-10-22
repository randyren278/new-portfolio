import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  stepRun,
  scoreForPeak,
  zoneForScore,
  ZONES,
  SEGMENTS,
  launch,
  CALM_MS,
  STARS_FOR_RESCUE,
  RESCUE_MS,
  FALL_MIN_MS,
  FALL_CAP_MS,
  fallenY,
  HAZARD_LAG,
  platformAtTime,
  SPRING_SPEED,
  MODIFIERS,
  modifierFor,
  lineSpeed,
  SURGE_MS,
  STREAK_FOR_STAR,
  climbFrom,
} from '../public/puff-up/game/climb.js';
import { playBot, choose } from './puff-bot.mjs';
import {
  FIXED_DT,
  DEFAULT_TUNING,
  WORLD,
  createState,
  step,
} from '../public/puff-up/game/physics.js';
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
test('zones step up every 200 m, then the last zone repeats, with all four mechanics introduced early', () => {
  assert.deepEqual(
    [0, 199, 200, 399, 400, 800, 5000].map((m) => zoneForScore(m).index),
    [0, 0, 1, 1, 2, 4, 25],
  );
  assert.deepEqual(zoneForScore(5000).scroll, ZONES.at(-1).scroll);
  // The last zone remixes every signature at the top difficulty.
  assert.deepEqual(
    { ...ZONES.at(-1), name: 0, signature: 0, twist: 0 },
    { ...ZONES.at(-2), name: 0, signature: 0, twist: 0 },
  );
  for (let z = 1; z < ZONES.length - 1; z++) {
    const [easier, harder] = [ZONES[z - 1], ZONES[z]];
    assert.ok(harder.scroll > easier.scroll);
    assert.ok(harder.mix[0] < easier.mix[0] && harder.mix[3] <= easier.mix[3]);
    assert.ok(harder.width < easier.width && harder.turnWidth < easier.turnWidth);
    const speed = (zone) => zone.amplitude / zone.periodMs[1];
    assert.ok(speed(harder) > speed(easier));
    assert.equal(
      harder.mix.reduce((a, b) => a + b),
      100,
    );
  }
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
    assert.ok(run.hazardY <= old.hazardY && run.hazardY <= run.peakY + HAZARD_LAG);
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
// Generate a course without playing it: lift Puff 100 px per update so the camera keeps rising.
function course(seed, metres) {
  let run = createRun(seed);
  const seen = new Map(run.platforms.map((p) => [p.id, p]));
  while (run.score < metres) {
    run = stepRun({ ...run, player: { ...run.player, y: run.player.y - 100 } }, {}, 0);
    for (const ledge of run.platforms) seen.set(ledge.id, ledge);
  }
  return seen;
}
const PHASES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
test('every certified takeoff replays from its source with real physics at every mover phase', () => {
  let hops = 0,
    forks = 0;
  const id = (n) => String(n).padStart(2, '0');
  for (const seed of [...Array.from({ length: 40 }, (_, i) => i), 0x50554646]) {
    const ledges = course(seed, 1400);
    // A fork puts two ledges in one row; the other one is present (first, so it wins any tie)
    // and Puff must land clear of it at every phase of either.
    const replay = (source, ledge, states, beside = null) => {
      assert.ok(states.length > 0, `seed ${seed}: ${ledge.id} has a certificate`);
      for (const w of states)
        for (const phase of ledge.kind === 'moving' ? PHASES : [0])
          for (const besidePhase of beside?.kind === 'moving' ? PHASES : [0]) {
            const from = source.witness[w.parent],
              target = ledge.kind === 'moving' ? { ...ledge, phase } : ledge,
              other = beside?.kind === 'moving' ? { ...beside, phase: besidePhase } : beside;
            let p = {
              ...createState(),
              x: from.x,
              vx: launch(from, source).vx,
              y: source.y,
              vy: launch({ vy: -DEFAULT_TUNING.jumpSpeed }, source).vy,
              grounded: false,
              platformId: null,
              coyoteMsLeft: 0,
            };
            for (let t = 0; t < 240 && !p.landed; t++) {
              const at = p.timeMs + FIXED_DT * 1000;
              p = step(p, { axis: t < w.k ? w.a : w.b, autoHop: true }, FIXED_DT, DEFAULT_TUNING, [
                ...(other ? [platformAtTime(other, at)] : []),
                platformAtTime(target, at),
              ]);
            }
            hops++;
            const near = other && platformAtTime(other, p.timeMs);
            assert.deepEqual(
              [
                p.landed && p.y === ledge.y,
                p.x,
                p.vx,
                !!near && p.x + 28 > near.x && p.x - 28 < near.x + near.width,
              ],
              [true, w.x, w.vx, false],
              `seed ${seed}: ${source.id}→${ledge.id} witness ${JSON.stringify(w)} phase ${phase}/${besidePhase}`,
            );
          }
    };
    for (const [key, ledge] of ledges) {
      if (key === 'floor') continue;
      const n = Number.parseInt(key, 10),
        below = ledges.get(id(n - 2)),
        // A spark lane leaves from the same ledge as the main ledge in its row.
        source =
          key === '01'
            ? ledges.get('floor')
            : below?.kind === 'spring' && !ledge.lane
              ? below
              : ledges.get(id(n - 1));
      const mate = ledge.lane ? ledges.get(key.slice(0, -1)) : ledges.get(`${key}L`),
        merge = ledges.get(id(n + 1)),
        // A lane withdrawn before its merge was never in play beside its row-mate.
        beside =
          mate && (ledge.lane ? merge?.fromLane : ledges.get(id(n + 1))?.fromLane) ? mate : null;
      replay(source, ledge, ledge.witness, beside);
      if (ledge.fromLane) {
        forks++;
        replay(ledges.get(`${id(n - 1)}L`), ledge, ledge.fromLane);
      }
    }
  }
  assert.ok(forks > 40, `${forks} forks`);
  console.log(
    'COURSE_CERTIFICATE',
    JSON.stringify({ seeds: 41, metres: 1400, forks, hops, passed: hops }),
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
  test(`Puff falls past the old cutoff until the line or the ${width}x${height} view ends the climb`, () => {
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
    const caught = run.player.y > run.hazardY,
      gone = top + (run.player.y - run.cameraY - 144) * scale > height;
    assert.ok(caught || gone, 'the rising line catches Puff or his whole sprite leaves the view');
    if (caught) assert.ok(run.hazardY - run.cameraY < (height - top) / scale, 'line is on screen');
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

test('broken red platforms restore after three seconds in the first zone, keeping their geometry', () => {
  const original = createRun(17),
    red = original.platforms.find((p) => p.kind === 'crumble' && p.id !== 'floor');
  const impact = {
    ...original,
    player: {
      ...original.player,
      x: red.x + red.width / 2,
      y: red.y - 1,
      vy: 300,
      grounded: false,
      platformId: null,
    },
  };
  const broken = stepRun(impact);
  assert.ok(!broken.platforms.some((p) => p.id === red.id));
  const repair = broken.brokenPlatforms.find((r) => r.platform.id === red.id);
  assert.equal(repair.readyAt, broken.player.timeMs + 3000);
  const at = (timeMs) =>
    stepRun(
      {
        ...broken,
        player: { ...broken.player, x: 24, y: broken.cameraY + 500, vy: 0, grounded: true, timeMs },
      },
      {},
      0,
    );
  assert.ok(!at(repair.readyAt - 1).platforms.some((p) => p.id === red.id));
  const restored = at(repair.readyAt);
  assert.deepEqual(
    restored.platforms.find((p) => p.id === red.id),
    red,
  );
  assert.equal(restored.brokenPlatforms.length, 0);
  assert.ok(!broken.platforms.some((p) => p.id === red.id), 'previous state stays unchanged');
});
test('scrolled-off red platforms and the initial launch pad never regenerate', () => {
  const original = createRun(17),
    red = original.platforms.find((p) => p.kind === 'crumble' && p.id !== 'floor');
  const broken = stepRun({
    ...original,
    player: {
      ...original.player,
      x: red.x + red.width / 2,
      y: red.y - 1,
      vy: 300,
      grounded: false,
      platformId: null,
    },
  });
  const due = broken.brokenPlatforms[0].readyAt,
    cameraY = red.y - 700;
  const ended = stepRun(
    { ...broken, cameraY, player: { ...broken.player, y: cameraY + 500, timeMs: due } },
    {},
    0,
  );
  assert.ok(!ended.platforms.some((p) => p.id === red.id));
  assert.equal(ended.brokenPlatforms.length, 0);
  assert.equal(stepRun(createRun(17)).brokenPlatforms.length, 0);
});

test('high up, Puff can wait on the stone below a crumble he broke until it returns', () => {
  // Find a gate stone with a crumble next above it, past 3000 m.
  let run, stone, red;
  for (let seed = 0; !red; seed++) {
    run = createRun(seed);
    while (run.score < 3000)
      run = stepRun({ ...run, player: { ...run.player, y: run.player.y - 100 } }, {}, 0);
    const path = run.platforms
      .filter((p) => /^\d+$/.test(p.id))
      .sort((a, b) => Number(a.id) - Number(b.id));
    const i = path.findIndex(
      (p, i) =>
        p.kind === 'solid' &&
        p.pace === 0.4 &&
        scoreForPeak(p.y) >= 3000 &&
        path[i + 1]?.kind === 'crumble' &&
        Number(path[i + 1].id) === Number(p.id) + 1,
    );
    if (i >= 0) [stone, red] = [path[i], path[i + 1]];
  }
  // Puff stands on the stone with the line its full lag below, hops onto the crumble, misses
  // the next ledge and falls back, then bounces on the stone until the crumble returns.
  run = {
    ...run,
    platforms: run.platforms.filter((p) => !p.lane),
    stars: 0,
    calmUntil: 0,
    lastLanding: null,
    player: { ...createState(), x: center(stone), y: stone.y, platformId: stone.id, timeMs: 0 },
    cameraY: stone.y - 300,
    peakY: stone.y,
    hazardY: stone.y + HAZARD_LAG,
    score: scoreForPeak(stone.y),
  };
  const landings = [];
  let target = red;
  while (run.status === 'playing' && run.player.timeMs < 15000 && landings.length < 12) {
    run = stepRun(run, { axis: steer(run.player, center(target)) });
    if (!run.player.events.includes('land')) continue;
    landings.push(run.lastLanding.id);
    const back = run.platforms.some((p) => p.id === red.id);
    target = landings.length === 1 || (run.lastLanding.id === stone.id && !back) ? stone : red;
    if (landings.length > 2 && run.lastLanding.id === red.id) break;
  }
  assert.equal(run.status, 'playing', `caught after ${landings.join(' → ')}`);
  assert.deepEqual([landings[0], landings[1], landings.at(-1)], [red.id, stone.id, red.id]);
});
test('the rising line catches a Puff who stops climbing, at the first zone speed', () => {
  let run = createRun();
  const first = run.platforms.find((p) => p.id === '01'),
    peaks = [];
  while (run.status === 'playing' && run.player.timeMs < 30000) {
    run = stepRun(run);
    peaks.push([run.player.timeMs, run.peakY]);
  }
  assert.equal(run.lastLanding.id, '01');
  assert.ok(run.player.y > run.hazardY);
  // From the first bounce apex the line trails HAZARD_LAG below it and rises 25 px per game
  // second until it reaches the stone; Puff is caught on the next landing, within one bounce.
  const apexAt = peaks.find(([, y]) => y === run.peakY)[0],
    reaches = apexAt + ((HAZARD_LAG - (first.y - run.peakY)) / 25) * 1000;
  assert.ok(
    run.player.timeMs >= reaches && run.player.timeMs <= reaches + 850,
    `${run.player.timeMs}`,
  );
});
test('a clean climb gains at least 20% on the fastest rising line', () => {
  const fastest =
    Math.max(...ZONES.map((z) => z.scroll)) *
    Math.max(...Object.values(SEGMENTS).map((s) => s.pace)) *
    10;
  const hop = (rise, gap) => {
    let p = { ...createState(), y: 0, vy: -rise, grounded: false, platformId: null };
    for (let ticks = 1; ; ticks++) {
      const next = step(p, {}, FIXED_DT, DEFAULT_TUNING, [{ id: 'g', x: 0, y: -gap, width: 640 }]);
      if (next.landed) return (ticks + 1) * FIXED_DT;
      p = next;
    }
  };
  for (let gap = 104; gap <= 134; gap++)
    assert.ok(gap / hop(700, gap) > fastest * 1.2, `gap ${gap}`);
  for (let gap = 208; gap <= 216; gap++)
    assert.ok(gap / hop(SPRING_SPEED, gap) > fastest * 1.2, `boost ${gap}`);
});
test('the search bot clears every zone of the visible default course through the real game', () => {
  const result = playBot(0x50554646, 1200);
  assert.ok(result.cleared, JSON.stringify(result));
});

test('each zone opens with a gate, teaches its signature, then runs and twists it', () => {
  for (const seed of [3, 11, 0x50554646]) {
    const ledges = [...course(seed, 1250).values()]
      .filter((p) => p.id !== 'floor')
      .sort((a, b) => b.y - a.y);
    const zoneOf = (p) => zoneForScore(scoreForPeak(p.y)).index;
    for (let z = 1; z <= 5; z++) {
      const inZone = ledges.filter((p) => zoneOf(p) === z),
        // The first ledge past a boundary is planned from the zone below, so the gate may
        // start one ledge in.
        gate = inZone.findIndex((p) => p.pace === 0.4);
      assert.ok(gate === 0 || gate === 1, `seed ${seed} zone ${z} gate at ${gate}`);
      assert.deepEqual(
        inZone.slice(gate, gate + 2).map((p) => [p.kind, p.pace, p.width >= 100]),
        [
          ['solid', 0.4, true],
          ['solid', 0.4, true],
        ],
        `seed ${seed} zone ${z} gate`,
      );
      const teach = inZone.slice(gate + 2, gate + 4);
      assert.ok(
        teach.every((p) => p.pace === 0.8),
        `seed ${seed} zone ${z} teaches`,
      );
    }
    const run = (z, kind) => {
      let best = 0,
        streak = 0;
      for (const p of ledges.filter((p) => zoneOf(p) === z)) {
        streak = p.kind === kind ? streak + 1 : 0;
        best = Math.max(best, streak);
      }
      return best;
    };
    assert.ok(run(1, 'crumble') >= 3, `seed ${seed}: zone 1 has a crumble run`);
    assert.ok(run(2, 'moving') >= 2, `seed ${seed}: zone 2 chains movers`);
    assert.ok(ledges.filter((p) => zoneOf(p) < 3).every((p) => p.kind !== 'kicker'));
    assert.ok(
      ledges.some((p) => zoneOf(p) === 3 && p.kind === 'kicker'),
      `seed ${seed}: kickers`,
    );
  }
});
test('a kicker launches Puff sideways at full speed toward the open side', () => {
  const make = (x) => ({
    ...createRun(1),
    platforms: [
      { id: 'kick', x, y: 465, width: 100, kind: 'kicker', push: x < 270 ? 1 : -1, pace: 1 },
      { id: 'ahead', x: 270, y: 0, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: x + 50,
      y: 460,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  });
  for (const [x, vx] of [
    [80, 260],
    [460, -260],
  ]) {
    let run = make(x);
    for (let i = 0; i < 10 && !run.lastLanding; i++) run = stepRun(run);
    assert.equal(run.lastLanding.kind, 'kicker');
    assert.equal(run.player.vx, vx);
    assert.ok(run.effects.some((e) => e.type === 'kick'));
  }
});
test('the rising line eases to 40% on a gate and presses harder during runs', () => {
  const rise = (pace) => {
    const run = {
      ...createRun(),
      lastLanding: { id: 'x', kind: 'solid', pace },
      hazardY: 400,
      peakY: 0,
    };
    return run.hazardY - stepRun(run, {}, 1 / 30).hazardY;
  };
  assert.ok(Math.abs(rise(0.4) - (2.5 * 0.4 * 10) / 30) < 1e-9);
  assert.ok(Math.abs(rise(1.05) - (2.5 * 1.05 * 10) / 30) < 1e-9);
});

test('forks offer a narrow spark lane beside the path that merges on wide stone', () => {
  let forks = 0;
  for (const seed of [2, 5, 9, 13, 0x50554646]) {
    const ledges = course(seed, 1250);
    for (const lane of [...ledges.values()].filter((p) => p.lane)) {
      const main = ledges.get(lane.id.slice(0, -1)),
        merge = ledges.get(String(Number(main.id) + 1).padStart(2, '0'));
      // A lane that cannot reach its merge is withdrawn before it ever reaches the view.
      if (!merge.fromLane) continue;
      forks++;
      assert.equal(lane.y, main.y);
      assert.deepEqual([lane.kind, lane.spark], ['crumble', true]);
      assert.ok(scoreForPeak(lane.y) >= 100, `${lane.id} opens from 100 m`);
      const gap = Math.abs(lane.x + lane.width / 2 - (main.x + main.width / 2));
      assert.ok(gap >= (lane.width + main.width) / 2 + 60, `${lane.id} clear of ${main.id}`);
      assert.deepEqual(
        [merge.kind, merge.width >= 94, merge.fromLane.length > 0],
        ['solid', true, true],
      );
    }
  }
  assert.ok(forks >= 10, `${forks} forks`);
});
test('landing on a spark pauses the rising line for 2.5 s and spends the spark', () => {
  let run = {
    ...createRun(1),
    // Inside the trailing limit (peak + HAZARD_LAG), so only the rise could move the line.
    hazardY: 700,
    peakY: 400,
    platforms: [
      { id: '30L', x: 80, y: 465, width: 60, kind: 'crumble', lane: true, spark: true, pace: 1 },
      { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: 110,
      y: 460,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  };
  for (let i = 0; i < 10 && !run.lastLanding; i++) run = stepRun(run);
  assert.ok(run.effects.some((e) => e.type === 'spark'));
  assert.equal(run.calmUntil, run.player.timeMs + CALM_MS);
  assert.equal(run.brokenPlatforms[0].platform.spark, false);
  const held = run.hazardY;
  for (let i = 0; i < 120; i++) run = stepRun(run);
  assert.equal(run.hazardY, held, 'the line holds while calm');
});
import { cuesFor } from '../public/puff-up/game/audio.js';
import { ufoAt } from '../public/puff-up/game/feedback.js';
test('sound cues follow what happened in each step', () => {
  const landOn = (kind, extra = {}) => {
    let run = {
      ...createRun(1),
      platforms: [
        { id: 'x', x: 80, y: 465, width: 100, kind, pace: 1, ...extra },
        { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
      ],
      player: {
        ...createState(),
        x: 130,
        y: 460,
        vy: 200,
        grounded: false,
        platformId: null,
        coyoteMsLeft: 0,
      },
    };
    let previous = run;
    while (!run.player.landed) [previous, run] = [run, stepRun(run)];
    return cuesFor(previous, run);
  };
  assert.deepEqual(landOn('solid'), ['hop']);
  assert.deepEqual(landOn('crumble'), ['hop', 'crack']);
  assert.deepEqual(landOn('spring'), ['hop', 'boing']);
  assert.deepEqual(landOn('kicker', { push: 1 }), ['hop', 'kick']);
  assert.deepEqual(landOn('crumble', { spark: true, lane: true }), ['hop', 'crack', 'spark']);
  assert.deepEqual(landOn('solid', { gate: 2 }), ['hop', 'chime']);
  const over = { ...createRun(1), status: 'over' };
  assert.deepEqual(cuesFor(createRun(1), over), ['caught']);
});
test('a gate names its zone once, however often Puff bounces on it', () => {
  let run = {
      ...createRun(1),
      platforms: [
        { id: 'g', x: 80, y: 465, width: 160, kind: 'solid', gate: 2, pace: 0.4 },
        { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
      ],
      player: {
        ...createState(),
        x: 160,
        y: 460,
        vy: 200,
        grounded: false,
        platformId: null,
        coyoteMsLeft: 0,
      },
    },
    chimes = 0,
    landings = 0;
  for (let i = 0; i < 600 && landings < 5; i++) {
    const previous = run;
    run = stepRun(run);
    if (run.player.landed) landings++;
    chimes += cuesFor(previous, run).filter((c) => c === 'chime').length;
  }
  assert.equal(landings, 5);
  assert.equal(chimes, 1);
  assert.equal(run.banner.zone, 2);
});

// A run lifted past a few screens of course, so ledges exist above and below Puff.
function midClimb(seed, metres) {
  let run = createRun(seed);
  while (run.score < metres)
    run = stepRun({ ...run, player: { ...run.player, y: run.player.y - 100 } }, {}, 0);
  return run;
}
test('sparks count as stars up to three', () => {
  let run = { ...createRun(1), stars: 2 };
  for (let landing = 0; landing < 2; landing++) {
    run = {
      ...run,
      lastLanding: null,
      platforms: [
        { id: `s${landing}`, x: 80, y: 465, width: 60, kind: 'crumble', spark: true, pace: 1 },
        { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
      ],
      player: {
        ...createState(),
        x: 110,
        y: 460,
        vy: 200,
        grounded: false,
        platformId: null,
        coyoteMsLeft: 0,
        timeMs: run.player.timeMs,
      },
    };
    for (let i = 0; i < 10 && !run.lastLanding; i++) run = stepRun(run);
  }
  assert.equal(STARS_FOR_RESCUE, 3);
  assert.equal(run.stars, 3);
});
test('with three stars a fall calls the UFO, which sets Puff back on the track', () => {
  const climbing = midClimb(4, 300),
    falling = {
      ...climbing,
      stars: 3,
      player: {
        ...climbing.player,
        y: climbing.cameraY + 900,
        vy: 600,
        grounded: false,
        platformId: null,
      },
    };
  let run = stepRun(falling);
  assert.equal(run.status, 'rescue');
  assert.equal(run.stars, 0);
  assert.ok(run.effects.some((e) => e.type === 'ufo'));
  const { from, to, at, fallMs } = run.rescue,
    ledge = run.platforms.find((p) => p.id === to.id),
    caughtLine = run.hazardY;
  // A main-path ledge on screen, no higher than Puff's best ledge.
  assert.ok(/^\d+$/.test(to.id) && ledge.witness?.length);
  assert.ok(to.y >= run.peakY + 100 && to.y - run.cameraY < 560, JSON.stringify(to));
  // It opens like an ending: the catch, then Puff falls out of view under the game's gravity
  // while the line holds where it caught him.
  assert.deepEqual(cuesFor(falling, run), ['caught']);
  assert.ok(fallMs >= FALL_MIN_MS && fallMs <= FALL_CAP_MS, String(fallMs));
  assert.equal(from.y, run.player.y);
  let cues = [];
  while (run.player.timeMs + FIXED_DT * 1000 < at + fallMs) {
    const before = run;
    run = stepRun(run);
    cues.push(...cuesFor(before, run));
    assert.equal(run.status, 'rescue');
    assert.equal(run.hazardY, caughtLine);
    assert.ok(Math.abs(run.player.y - fallenY(from.y, from.vy, run.player.timeMs - at)) < 1e-6);
  }
  assert.deepEqual(cues, []);
  // Then the UFO comes, once, and the line drops back below the ledge while it works.
  for (let t = 0; t < 4; t++) {
    const before = run;
    run = stepRun(run);
    cues.push(...cuesFor(before, run));
  }
  assert.deepEqual(cues, ['ufo']);
  // The beam lifts him from just below the view, not from wherever the fall left him.
  assert.ok(run.player.y - run.cameraY <= WORLD.height + 80 + 1e-6, String(run.player.y));
  const score = run.score;
  while (run.player.timeMs < at + fallMs + RESCUE_MS * 0.9) run = stepRun(run);
  assert.ok(run.hazardY >= to.y + 300);
  while (run.status === 'rescue') run = stepRun(run);
  assert.equal(run.status, 'playing');
  assert.equal(run.lastLanding.id, to.id);
  assert.equal(run.score, score, 'a rescue never adds height');
  assert.ok(run.calmUntil >= run.player.timeMs + CALM_MS - 20);
  // Puff takes off from the ledge and the line holds while he gets going.
  for (let t = 0; t < 240; t++) run = stepRun(run);
  assert.equal(run.status, 'playing');
});
test('a rescue sets Puff down at rest on a ledge that neither breaks nor kicks', () => {
  const hardened = { crumble: 0, kicker: 0 };
  for (let seed = 1; seed <= 24; seed++)
    for (const metres of [150, 300, 450, 650, 750]) {
      const climbing = midClimb(seed, metres);
      let run = stepRun({
        ...climbing,
        stars: 3,
        player: {
          ...climbing.player,
          y: climbing.cameraY + 900,
          vy: 600,
          grounded: false,
          platformId: null,
        },
      });
      const { id } = run.rescue.to,
        was = climbing.platforms.find((p) => p.id === id).kind;
      if (was in hardened) hardened[was]++;
      while (run.status === 'rescue') run = stepRun(run);
      const ledge = run.platforms.find((p) => p.id === id),
        at = `seed ${seed} at ${metres} m`;
      assert.equal(run.lastLanding.id, id);
      assert.ok(ledge && !['crumble', 'kicker'].includes(ledge.kind), `${at}: ${ledge?.kind}`);
      // He hops straight up from its middle, keeping none of the speed he had before the fall.
      // (A fast mover slides under 2 px in the tick he lands.)
      assert.equal(run.player.vx, 0, at);
      assert.ok(Math.abs(run.player.x - (ledge.x + ledge.width / 2)) < 2, at);
      // From rest he can still climb on past it.
      for (
        let hop = 0;
        hop < 6 && run.status === 'playing' && run.lastLanding.y >= ledge.y;
        hop++
      ) {
        const plan = choose(run);
        if (!plan) break;
        for (let t = 0; t < 240 && run.status === 'playing'; t++) {
          run = stepRun(run, { axis: t < plan.k ? plan.a : plan.b });
          if (run.player.landed) break;
        }
      }
      assert.ok(run.status === 'playing' && run.lastLanding.y < ledge.y, `${at}: stuck`);
    }
  assert.ok(hardened.crumble > 0 && hardened.kicker > 0, JSON.stringify(hardened));
});
test('a rescue falls like an ending: until Puff is out of view, within the same bounds', () => {
  const climbing = midClimb(4, 300);
  for (const depth of [100, 300, 400, 650, 900]) {
    const run = stepRun({
      ...climbing,
      stars: 3,
      hazardY: climbing.cameraY + depth - 5,
      player: {
        ...climbing.player,
        y: climbing.cameraY + depth,
        grounded: false,
        platformId: null,
      },
    });
    assert.equal(run.status, 'rescue', String(depth));
    const { from, fallMs } = run.rescue,
      outY = run.cameraY + WORLD.height + 80,
      out = fallenY(from.y, from.vy, fallMs);
    assert.ok(fallMs >= FALL_MIN_MS && fallMs <= FALL_CAP_MS, `${depth}: ${fallMs}`);
    if (fallMs > FALL_MIN_MS) assert.ok(Math.abs(out - outY) < 1e-6, `${depth}: ${out}`);
    else assert.ok(out >= outY - 1e-6, `${depth}: ${out}`);
  }
});
test('the UFO comes only once Puff has fallen away, and hovers above the controls', () => {
  const rescue = { at: 1000, fallMs: 600, from: { x: 300, y: 500, vy: 0 }, to: { x: 320, y: 400 } },
    arrives = 1000 + 600;
  assert.equal(ufoAt(rescue, arrives - 1, 300, 900, 0, 560), null);
  assert.ok(ufoAt(rescue, arrives, 300, 900, 0, 560));
  // While Puff is still below the view it waits 70 px above the floor with the beam on.
  assert.deepEqual(ufoAt(rescue, arrives + RESCUE_MS * 0.5, 300, 900, 0, 560), {
    x: 300,
    y: 490,
    beam: true,
  });
  // Once he is up in view it rides 150 px above him.
  assert.equal(ufoAt(rescue, arrives + RESCUE_MS * 0.5, 300, 420, 0, 560).y, 270);
  assert.equal(ufoAt(rescue, arrives + RESCUE_MS + 1, 320, 400, 0, 560), null);
});
test('without three stars a fall still ends the climb', () => {
  const climbing = midClimb(4, 300);
  const run = stepRun({
    ...climbing,
    stars: 2,
    player: {
      ...climbing.player,
      y: climbing.cameraY + 900,
      vy: 600,
      grounded: false,
      platformId: null,
    },
  });
  assert.equal(run.status, 'over');
  assert.equal(run.stars, 2);
});

// Past the zone table: modifiers, the wave each zone climbs in, and climbing streaks.
const mainPath = (seed, metres) =>
  [...course(seed, metres).values()].filter((p) => /^\d+$/.test(p.id)).sort((a, b) => b.y - a.y);
const zoneAt = (seed, p) => zoneForScore(scoreForPeak(p.y), seed);
test('past the table each zone draws a modifier, in seeded rounds of all five, never twice in a row', () => {
  const ids = Object.keys(MODIFIERS);
  assert.equal(ids.length, 5);
  for (let seed = 0; seed < 300; seed++) {
    for (let z = 0; z < ZONES.length; z++) assert.equal(modifierFor(seed, z), null);
    const order = Array.from({ length: 30 }, (_, i) => modifierFor(seed, ZONES.length + i));
    for (let round = 0; round < 6; round++)
      assert.deepEqual(new Set(order.slice(round * 5, round * 5 + 5)), new Set(ids));
    order.forEach((m, i) => i && assert.notEqual(m, order[i - 1], `seed ${seed} zone ${i}`));
    assert.equal(zoneForScore(ZONES.length * 200, seed).modifier, order[0]);
    assert.equal(zoneForScore(ZONES.length * 200 - 1, seed).modifier, undefined);
  }
  assert.equal(new Set(Array.from({ length: 50 }, (_, s) => modifierFor(s, ZONES.length))).size, 5);
});
test('past the table a zone climbs in a wave: a gate, runs at the hardest pace, then wide stone', () => {
  const press = Math.max(...Object.values(SEGMENTS).map((s) => s.pace));
  for (const seed of [1, 2, 3, 4, 5, 0x50554646]) {
    const ledges = mainPath(seed, 2650);
    for (let z = ZONES.length; z <= 12; z++) {
      const inZone = ledges.filter((p) => zoneAt(seed, p).index === z),
        gate = inZone.findIndex((p) => p.pace === 0.4);
      assert.ok(gate === 0 || gate === 1, `seed ${seed} zone ${z} gate at ${gate}`);
      assert.equal(inZone[gate].modifier, modifierFor(seed, z));
      assert.ok(inZone.filter((p) => p.pace === 0.5).length >= 2, `seed ${seed} zone ${z} rests`);
      for (const p of inZone)
        assert.ok([0.4, 0.5, 0.8, press].includes(p.pace), `seed ${seed} ${p.id} pace ${p.pace}`);
    }
    // Every ledge planned from 165 m into a zone is a breather: wide stone, the line at half pace.
    for (let i = 1; i < ledges.length; i++) {
      const [from, ledge] = [ledges[i - 1], ledges[i]],
        zone = zoneAt(seed, from);
      if (!zone.modifier || zoneAt(seed, ledge).index !== zone.index) continue;
      if (scoreForPeak(from.y) - zone.index * 200 < 165) continue;
      assert.deepEqual(
        [ledge.kind, ledge.pace, ledge.width >= 100],
        ['solid', 0.5, true],
        `seed ${seed} ${ledge.id}`,
      );
    }
  }
});
test('each modifier reshapes the ledges of its zone', () => {
  const tally = {};
  for (let seed = 0; seed < 16; seed++)
    for (const p of [...course(seed, 2650).values()]) {
      if (p.id === 'floor') continue;
      const zone = zoneAt(seed, p);
      if (zone.index < 4 || zone.index > 12) continue;
      const t = (tally[zone.modifier ?? 'table'] ??= { ledges: 0, lanes: 0 });
      if (p.lane) t.lanes++;
      else {
        t.ledges++;
        t[p.kind] = (t[p.kind] ?? 0) + 1;
      }
    }
  const share = (m, kind) => (tally[m][kind] ?? 0) / tally[m].ledges;
  assert.ok(share('crumble-storm', 'crumble') > 1.5 * share('table', 'crumble'));
  assert.ok(share('kicker-gauntlet', 'kicker') > 3 * share('table', 'kicker'));
  assert.ok(share('spring-garden', 'spring') > 5 * share('table', 'spring'));
  assert.ok(share('star-field', 'lanes') > 2.5 * share('table', 'lanes'));
  assert.ok(share('spring-garden', 'spring') > 0.12, JSON.stringify(tally['spring-garden']));
});
test('every spring in a spring garden still offers its certified skip', () => {
  let springs = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const ledges = mainPath(seed, 2650);
    for (let i = 0; i < ledges.length - 2; i++) {
      const [spring, middle, to] = ledges.slice(i, i + 3);
      if (spring.kind !== 'spring' || zoneAt(seed, spring).modifier !== 'spring-garden') continue;
      springs++;
      assert.equal(to.kind, 'solid', `seed ${seed}: ${spring.id} skips to stone`);
      assert.ok(spring.y - to.y <= 216, `seed ${seed}: ${spring.id} skip has apex margin`);
      // The skip is certified from the spring itself, and replays with real physics.
      for (const w of to.witness) {
        let p = {
          ...createState(),
          x: spring.witness[w.parent].x,
          vx: spring.witness[w.parent].vx,
          y: spring.y,
          vy: -SPRING_SPEED,
          grounded: false,
          platformId: null,
          coyoteMsLeft: 0,
        };
        for (let t = 0; t < 240 && !p.landed; t++)
          p = step(p, { axis: t < w.k ? w.a : w.b, autoHop: true }, FIXED_DT, DEFAULT_TUNING, [to]);
        assert.deepEqual([p.landed, p.x, p.vx], [true, w.x, w.vx], `seed ${seed}: ${spring.id}`);
      }
    }
  }
  assert.ok(springs > 20, `${springs} springs`);
});
test('a surge rushes at the hardest pace on any ledge, then holds still, never past a clean climb', () => {
  const fastest =
    Math.max(...ZONES.map((z) => z.scroll)) *
    Math.max(...Object.values(SEGMENTS).map((s) => s.pace)) *
    10;
  const seed = [...Array(50).keys()].find((s) => modifierFor(s, ZONES.length) === 'surge'),
    surge = zoneForScore(ZONES.length * 200, seed),
    cycle = SURGE_MS[0] + SURGE_MS[1];
  for (const pace of [0.4, 0.5, 1]) {
    assert.equal(lineSpeed(surge, pace, 0), fastest);
    assert.equal(lineSpeed(surge, pace, SURGE_MS[0] - 1), fastest);
    assert.equal(lineSpeed(surge, pace, SURGE_MS[0]), 0);
    assert.equal(lineSpeed(surge, pace, cycle - 1), 0);
    assert.equal(lineSpeed(surge, pace, cycle), fastest);
  }
  const plain = zoneForScore(500);
  assert.equal(lineSpeed(plain, 0.4, 0), plain.scroll * 0.4 * 10);
  // The fairness bound holds in every zone and modifier, at every pace and moment.
  for (let s = 0; s < 10; s++)
    for (let m = 0; m <= 3000; m += 200)
      for (const pace of [0.4, 0.5, 0.8, ...Object.values(SEGMENTS).map((g) => g.pace)])
        for (let t = 0; t < cycle * 2; t += 500)
          assert.ok(lineSpeed(zoneForScore(m, s), pace, t) <= fastest);
  // stepRun moves the line by it; here it starts closer than its lag, so the lag never binds.
  const start = climbFrom(seed, ZONES.length * 200 + 20),
    lifted = { ...start, calmUntil: 0, hazardY: start.peakY + 200 };
  assert.equal(zoneForScore(lifted.score, seed).modifier, 'surge');
  const rush = stepRun(lifted, {}, 1 / 30),
    hold = stepRun(
      { ...lifted, player: { ...lifted.player, timeMs: SURGE_MS[0] + 100 } },
      {},
      1 / 30,
    );
  assert.ok(Math.abs(lifted.hazardY - rush.hazardY - fastest / 30) < 1e-6);
  assert.equal(hold.hazardY, lifted.hazardY);
});
test('a gate past the table names its modifier on the banner', () => {
  const seed = 7,
    gate = mainPath(seed, 1300).find((p) => p.gate === ZONES.length);
  assert.equal(gate.modifier, modifierFor(seed, ZONES.length));
  let run = {
    ...createRun(seed),
    platforms: [
      { ...gate, x: 80, y: 465 },
      { id: 'ahead', x: 400, y: 0, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: 80 + gate.width / 2,
      y: 460,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
    },
  };
  while (!run.player.landed) run = stepRun(run);
  assert.deepEqual([run.banner.zone, run.banner.modifier], [ZONES.length, gate.modifier]);
});
// Lands Puff from just above on a stone ledge at `y`.
function landAt(run, y) {
  let next = {
    ...run,
    platforms: [
      { id: `l${y}`, x: 80, y, width: 100, kind: 'solid', pace: 1 },
      { id: 'ahead', x: 400, y: y - 2000, width: 100, kind: 'solid' },
    ],
    player: {
      ...createState(),
      x: 130,
      y: y - 5,
      vy: 200,
      grounded: false,
      platformId: null,
      coyoteMsLeft: 0,
      timeMs: run.player.timeMs,
    },
  };
  let previous = next;
  while (!next.player.landed) [previous, next] = [next, stepRun(next)];
  return [previous, next];
}
test('a streak counts landings each higher than the last, and its tenth earns one star', () => {
  let run = createRun(1),
    previous;
  assert.equal(run.streak, 0);
  for (let i = 1; i <= 25; i++) {
    [previous, run] = landAt(run, 465 - i * 120);
    assert.equal(run.streak, i);
    const earned = i === STREAK_FOR_STAR;
    assert.equal(run.stars, i >= STREAK_FOR_STAR ? 1 : 0, `landing ${i}`);
    assert.equal(cuesFor(previous, run).includes('streak'), earned, `landing ${i}`);
  }
  // A landing no higher than the last breaks it.
  [, run] = landAt(run, 465 - 25 * 120);
  assert.equal(run.streak, 0);
  // The star is capped with the others.
  run = { ...run, stars: 3, streak: STREAK_FOR_STAR - 1 };
  [, run] = landAt(run, 465 - 30 * 120);
  assert.deepEqual([run.streak, run.stars], [STREAK_FOR_STAR, 3]);
});
test('a rescue breaks the streak', () => {
  const climbing = midClimb(4, 300);
  let run = stepRun({
    ...climbing,
    stars: 3,
    streak: 7,
    player: {
      ...climbing.player,
      y: climbing.cameraY + 900,
      vy: 600,
      grounded: false,
      platformId: null,
    },
  });
  assert.equal(run.status, 'rescue');
  while (run.status === 'rescue') run = stepRun(run);
  assert.equal(run.streak, 0);
});
test('climbFrom starts Puff at rest on main-path stone at about that height, the line its lag below', () => {
  for (const seed of [1, 2, 3]) {
    const run = climbFrom(seed, 1150),
      ledge = run.platforms.find((p) => p.id === run.player.platformId);
    assert.ok(run.score >= 1100 && run.score <= 1160, String(run.score));
    assert.deepEqual(
      [ledge.kind, run.player.x, run.player.vx],
      ['solid', ledge.x + ledge.width / 2, 0],
    );
    assert.equal(run.hazardY, ledge.y + HAZARD_LAG);
    assert.ok(/^\d+$/.test(ledge.id));
  }
  assert.ok(playBot(3, 1450, 1150).cleared);
});

// The rocket: each 50 landings of a streak.
import {
  ROCKET_STREAK,
  ROCKET_METRES,
  rocketMs,
  ROCKET_IGNITE_MS,
  ROCKET_CLIMB_MS,
  ROCKET_CUTOFF,
  ROCKET_DROP,
  rocketAt,
} from '../public/puff-up/game/climb.js';
// A climb at about `metres`, one landing short of `streak`. climbFrom leaves no landing behind,
// so Puff's first bounce counts as a climb.
const nearStreak = (seed, metres, streak) => ({ ...climbFrom(seed, metres), streak: streak - 1 });
function untilLanded(run) {
  let previous = run;
  for (let i = 0; i < 400 && !run.player.landed; i++) [previous, run] = [run, stepRun(run)];
  return [previous, run];
}
// The kind a ledge was laid as, before anything turned it to stone.
function laidAs(seed, id) {
  let run = createRun(seed);
  while (!run.platforms.some((p) => p.id === id))
    run = stepRun({ ...run, player: { ...run.player, y: run.player.y - 100 } }, {}, 0);
  return run.platforms.find((p) => p.id === id).kind;
}
test('a streak of 50 lights the rocket: about 200 m up, set down as a rescue would', () => {
  const hardened = { crumble: 0, kicker: 0 };
  for (let seed = 1; seed <= 16; seed++)
    for (const metres of [300, 650, 1150, 1550, 2350]) {
      const at = `seed ${seed} at ${metres} m`;
      let [previous, run] = untilLanded(nearStreak(seed, metres, ROCKET_STREAK));
      assert.deepEqual([run.status, run.streak], ['rocket', ROCKET_STREAK], at);
      const { from, to } = run.rocket,
        was = laidAs(seed, to.id);
      if (was in hardened) hardened[was]++;
      assert.ok(/^\d+$/.test(to.id), at);
      assert.ok(
        Math.abs((from.y - to.y) / 10 - ROCKET_METRES) <= 10,
        `${at}: ${(from.y - to.y) / 10} m`,
      );
      // The camera and height only rise on the way, and the line never catches him.
      while (run.status === 'rocket') {
        [previous, run] = [run, stepRun(run)];
        assert.ok(run.cameraY <= previous.cameraY && run.score >= previous.score, at);
        assert.ok(run.player.y <= run.hazardY, at);
      }
      const ledge = run.platforms.find((p) => p.id === to.id);
      assert.equal(run.lastLanding.id, to.id, at);
      assert.ok(ledge && !['crumble', 'kicker'].includes(ledge.kind), `${at}: ${ledge?.kind}`);
      assert.equal(run.player.vx, 0, at);
      assert.ok(Math.abs(run.player.x - (ledge.x + ledge.width / 2)) < 2, at);
      // The touchdown is a landing higher than the last; the line holds a while; the card names
      // the zone it lands in.
      assert.equal(run.streak, ROCKET_STREAK + 1, at);
      assert.ok(run.calmUntil > run.player.timeMs, at);
      assert.equal(run.banner?.zone, zoneForScore(scoreForPeak(ledge.y), seed).index, at);
      // From rest he climbs on past it.
      for (
        let hop = 0;
        hop < 6 && run.status === 'playing' && run.lastLanding.y >= ledge.y;
        hop++
      ) {
        const plan = choose(run);
        if (!plan) break;
        for (let t = 0; t < 240 && run.status === 'playing'; t++) {
          run = stepRun(run, { axis: t < plan.k ? plan.a : plan.b });
          if (run.player.landed) break;
        }
      }
      assert.ok(run.status === 'playing' && run.lastLanding.y < ledge.y, `${at}: stuck`);
    }
  assert.ok(hardened.crumble > 0 && hardened.kicker > 0, JSON.stringify(hardened));
});
test('the rocket lifts off in place, climbs to just over its ledge, then drops onto it', () => {
  const rocket = { from: { x: 200, y: 0 }, to: { x: 400, y: -2000 }, climb: ROCKET_CLIMB_MS },
    top = ROCKET_IGNITE_MS + ROCKET_CLIMB_MS;
  let last = rocketAt(rocket, 0);
  assert.deepEqual(last, rocket.from);
  for (let age = 5; age <= rocketMs(rocket); age += 5) {
    const p = rocketAt(rocket, age);
    if (age <= ROCKET_IGNITE_MS) assert.equal(p.x, 200);
    assert.ok(age <= top ? p.y <= last.y : p.y >= last.y, `${age} ms`);
    last = p;
  }
  assert.deepEqual(rocketAt(rocket, top), { x: 400, y: -2000 - ROCKET_DROP });
  assert.deepEqual(rocketAt(rocket, rocketMs(rocket)), rocket.to);
  // Let go, it leaves the ledge at once, is fastest as the engine cuts out, then coasts.
  const speed = (age) => rocketAt(rocket, age).y - rocketAt(rocket, age + 5).y,
    cutoff = ROCKET_IGNITE_MS + ROCKET_CLIMB_MS * ROCKET_CUTOFF;
  assert.ok(speed(ROCKET_IGNITE_MS + 5) > speed(cutoff - 5) / 4);
  for (const age of [ROCKET_IGNITE_MS + 200, cutoff - 400, cutoff + 400])
    assert.ok(speed(age) < speed(cutoff - 5), `${age} ms`);
});
test('each 50 more of a streak carries the rocket 200 m higher, on a longer flight', () => {
  const flights = [];
  for (const stages of [1, 2, 3]) {
    let [, run] = untilLanded(nearStreak(7, 1000, ROCKET_STREAK * stages));
    const { from, to } = run.rocket,
      at = `×${run.streak}`;
    assert.ok(
      Math.abs((from.y - to.y) / 10 - ROCKET_METRES * stages) <= 10,
      `${at}: ${(from.y - to.y) / 10} m`,
    );
    flights.push(rocketMs(run.rocket));
    while (run.status === 'rocket') run = stepRun(run);
    assert.deepEqual([run.status, run.lastLanding.id], ['playing', to.id], at);
  }
  assert.ok(flights[0] < flights[1] && flights[1] < flights[2], JSON.stringify(flights));
});
test('the zone card at touchdown names the ledge it lands on, not the top of its flight', () => {
  // The flight tops out 9 m over its ledge, so a ledge just under a zone line is still below it.
  let straddled = 0;
  for (let seed = 1; seed <= 60; seed++) {
    let [, run] = untilLanded(nearStreak(seed, 900 + (seed % 10) * 20, ROCKET_STREAK));
    const { to } = run.rocket;
    while (run.status === 'rocket') run = stepRun(run);
    const landed = zoneForScore(scoreForPeak(to.y), seed).index;
    if (zoneForScore(run.score, seed).index !== landed) straddled++;
    assert.equal(run.banner?.zone, landed, `seed ${seed}`);
  }
  assert.ok(straddled > 0, 'no touchdown landed just under a zone line');
});
test('the rocket lights at each 50 of a streak, not between', () => {
  for (const [streak, lit] of [
    [ROCKET_STREAK - 1, false],
    [ROCKET_STREAK * 2, true],
    [ROCKET_STREAK * 2 + 1, false],
  ]) {
    const [, run] = untilLanded(nearStreak(5, 900, streak));
    assert.deepEqual(
      [run.streak, run.status],
      [streak, lit ? 'rocket' : 'playing'],
      String(streak),
    );
  }
});
test('the rocket sounds as it lights, once as it blasts off, and on touchdown', () => {
  let [previous, run] = untilLanded(nearStreak(2, 700, ROCKET_STREAK));
  const heard = [cuesFor(previous, run)];
  while (run.status === 'rocket') {
    [previous, run] = [run, stepRun(run)];
    heard.push(cuesFor(previous, run));
  }
  const all = heard.flat(),
    count = (cue) => all.filter((c) => c === cue).length;
  assert.ok(heard[0].includes('hop') && heard[0].includes('ignite'), JSON.stringify(heard[0]));
  assert.deepEqual([count('ignite'), count('blast'), count('touchdown')], [1, 1, 1]);
  assert.ok(heard.at(-1).includes('touchdown') && heard.at(-1).includes('hop'));
});

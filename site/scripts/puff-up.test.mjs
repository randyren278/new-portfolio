import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  stepRun,
  scoreForPeak,
  zoneForScore,
  ZONES,
  rebuildMs,
  HAZARD_LAG,
  platformAtTime,
  SPRING_SPEED,
} from '../public/puff-up/game/climb.js';
import { playBot } from './puff-bot.mjs';
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
test('zones step up every 200 m, then the last zone repeats, with all four mechanics introduced early', () => {
  assert.deepEqual(
    [0, 199, 200, 399, 400, 800, 5000].map((m) => zoneForScore(m).index),
    [0, 0, 1, 1, 2, 4, 25],
  );
  assert.deepEqual(zoneForScore(5000).scroll, ZONES.at(-1).scroll);
  for (let z = 1; z < ZONES.length; z++) {
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
  let hops = 0;
  for (const seed of [...Array.from({ length: 40 }, (_, i) => i), 0x50554646]) {
    const ledges = course(seed, 1400);
    for (const [id, ledge] of ledges) {
      if (id === 'floor') continue;
      const below = ledges.get(String(Number(id) - 2).padStart(2, '0'));
      const source =
        id === '01'
          ? ledges.get('floor')
          : below?.kind === 'spring'
            ? below
            : ledges.get(String(Number(id) - 1).padStart(2, '0'));
      assert.ok(ledge.witness.length > 0, `seed ${seed}: ${id} has a certificate`);
      for (const w of ledge.witness)
        for (const phase of ledge.kind === 'moving' ? PHASES : [0]) {
          const from = source.witness[w.parent],
            target = ledge.kind === 'moving' ? { ...ledge, phase } : ledge;
          let p = {
            ...createState(),
            x: from.x,
            vx: from.vx,
            y: source.y,
            vy: source.kind === 'spring' ? -SPRING_SPEED : -DEFAULT_TUNING.jumpSpeed,
            grounded: false,
            platformId: null,
            coyoteMsLeft: 0,
          };
          for (let t = 0; t < 240 && !p.landed; t++)
            p = step(p, { axis: t < w.k ? w.a : w.b, autoHop: true }, FIXED_DT, DEFAULT_TUNING, [
              platformAtTime(target, p.timeMs + FIXED_DT * 1000),
            ]);
          hops++;
          assert.deepEqual(
            [p.landed && p.y === ledge.y, p.x, p.vx],
            [true, w.x, w.vx],
            `seed ${seed}: ${source.id}→${id} witness ${JSON.stringify(w)} phase ${phase}`,
          );
        }
    }
  }
  console.log(
    'COURSE_CERTIFICATE',
    JSON.stringify({ seeds: 41, metres: 1400, hops, passed: hops }),
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

test('crumbled ledges take one second longer to return in each higher zone', () => {
  const at = (metres) => 575 - metres * 10;
  assert.deepEqual(
    [50, 250, 450, 650, 850, 1050, 1300].map((m) => rebuildMs(at(m))),
    [3000, 4000, 5000, 6000, 7000, 8000, 9000],
  );
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
test('a clean climb always outpaces the fastest rising line', () => {
  const fastest = Math.max(...ZONES.map((z) => z.scroll)) * 10;
  const hop = (rise, gap) => {
    let p = { ...createState(), y: 0, vy: -rise, grounded: false, platformId: null };
    for (let ticks = 1; ; ticks++) {
      const next = step(p, {}, FIXED_DT, DEFAULT_TUNING, [{ id: 'g', x: 0, y: -gap, width: 640 }]);
      if (next.landed) return (ticks + 1) * FIXED_DT;
      p = next;
    }
  };
  for (let gap = 104; gap <= 132; gap++)
    assert.ok(gap / hop(700, gap) > fastest * 1.3, `gap ${gap}`);
  for (let gap = 208; gap <= 216; gap++)
    assert.ok(gap / hop(SPRING_SPEED, gap) > fastest * 1.3, `boost ${gap}`);
});
test('the search bot clears every zone of the visible default course through the real game', () => {
  const result = playBot(0x50554646, 1200);
  assert.ok(result.cleared, JSON.stringify(result));
});

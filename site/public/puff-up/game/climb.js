import { WORLD, COLLIDER, FIXED_DT, DEFAULT_TUNING, createState, step, moveX } from './physics.js';
export const SPRING_SPEED = 910;
const START_Y = 575;
const random = (rng) => (Math.imul(rng, 1664525) + 1013904223) >>> 0;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function scoreForPeak(y) {
  return Number.isFinite(y) ? Math.max(0, Math.floor((START_Y - y) / 10)) : 0;
}
export const ZONE_METRES = 200;
// Each zone is a step up; past the table the last zone repeats under a modifier (see MODIFIERS),
// climbing in a wave. scroll is the rising line in
// metres per second, mix weighs solid/crumble/moving/spring/kicker, and movers swing
// ±amplitude px once per periodMs. A zone teaches its signature run of ledges, tests it, then
// twists it near the top (see SEGMENTS).
export const ZONES = Object.freeze(
  [
    {
      name: 'Lift-off',
      signature: null,
      twist: 'crumbles',
      scroll: 2.5,
      mix: [40, 30, 20, 10, 0],
      width: 84,
      minWidth: 64,
      turnWidth: 94,
      moverWidth: 84,
      gap: 120,
      offset: 140,
      amplitude: 28,
      periodMs: [2200, 2600],
    },
    {
      name: 'Crumble run',
      signature: 'crumbles',
      twist: 'crumble-movers',
      scroll: 5,
      mix: [30, 36, 26, 8, 0],
      width: 72,
      minWidth: 58,
      turnWidth: 84,
      moverWidth: 80,
      gap: 124,
      offset: 146,
      amplitude: 36,
      periodMs: [1900, 2300],
    },
    {
      name: 'Drift',
      signature: 'movers',
      twist: 'mover-switchbacks',
      scroll: 7.5,
      mix: [22, 40, 31, 7, 0],
      width: 62,
      minWidth: 52,
      turnWidth: 74,
      moverWidth: 80,
      gap: 126,
      offset: 150,
      amplitude: 44,
      periodMs: [1700, 2000],
    },
    {
      name: 'Kickback',
      signature: 'kickers',
      twist: 'kicker-movers',
      scroll: 10,
      mix: [16, 38, 30, 6, 10],
      width: 54,
      minWidth: 46,
      turnWidth: 64,
      moverWidth: 92,
      gap: 128,
      offset: 150,
      amplitude: 50,
      periodMs: [1500, 1800],
    },
    {
      name: 'Switchbacks',
      signature: 'switchbacks',
      twist: 'crumble-switchbacks',
      scroll: 12,
      mix: [10, 40, 34, 5, 11],
      width: 48,
      minWidth: 40,
      turnWidth: 56,
      moverWidth: 100,
      gap: 130,
      offset: 150,
      amplitude: 54,
      periodMs: [1300, 1600],
    },
    {
      name: 'The long way up',
      signature: 'remix',
      twist: 'remix',
      scroll: 12,
      mix: [10, 40, 34, 5, 11],
      width: 48,
      minWidth: 40,
      turnWidth: 56,
      moverWidth: 100,
      gap: 130,
      offset: 150,
      amplitude: 54,
      periodMs: [1300, 1600],
    },
  ].map(Object.freeze),
);
// Runs of ledges. kind/kinds force ledge types (alternating), turn forces a reversal each ledge,
// keep forbids one, and pace scales the rising line while Puff stands on them.
export const SEGMENTS = Object.freeze({
  gate: { kind: 'solid', length: [2, 2], pace: 0.4 },
  rest: { kind: 'solid', length: [2, 3], pace: 0.5 },
  mixed: { length: [3, 6], pace: 1 },
  crumbles: { kind: 'crumble', keep: true, length: [3, 5], pace: 1.05 },
  movers: { kind: 'moving', length: [2, 4], pace: 1.05 },
  kickers: { kind: 'kicker', length: [2, 3], pace: 1.05 },
  switchbacks: { turn: true, length: [4, 6], pace: 1.05 },
  'crumble-movers': { kinds: ['crumble', 'moving'], length: [4, 4], pace: 1.1 },
  'mover-switchbacks': { kind: 'moving', turn: true, length: [4, 4], pace: 1.1 },
  'kicker-movers': { kinds: ['kicker', 'moving'], length: [4, 4], pace: 1.1 },
  'crumble-switchbacks': { kind: 'crumble', turn: true, length: [4, 4], pace: 1.1 },
});
const SIGNATURES = ['crumbles', 'movers', 'kickers', 'switchbacks'],
  TWISTS = ['crumble-movers', 'mover-switchbacks', 'kicker-movers', 'crumble-switchbacks'];
// The hardest pace a run of ledges sets; the fairness test holds a clean climb above it.
const PRESS = Math.max(...Object.values(SEGMENTS).map((s) => s.pace));
// Past the table each zone draws a modifier, a rule named on its card, over the last zone's
// ledges. A modifier only reweighs ledges the certificate already handles, or times the line.
export const MODIFIERS = Object.freeze(
  Object.fromEntries(
    Object.entries({
      'crumble-storm': {
        name: 'Crumble storm',
        signature: 'crumbles',
        twist: 'crumble-switchbacks',
        mix: [6, 70, 14, 0, 10],
      },
      'kicker-gauntlet': {
        name: 'Kicker gauntlet',
        signature: 'kickers',
        twist: 'kicker-movers',
        mix: [10, 14, 16, 0, 60],
      },
      // Springs a ledge closer than anywhere else: a spring, the ledge it skips, the stone it
      // lands on, then the next spring.
      'spring-garden': {
        name: 'Spring garden',
        signature: null,
        twist: null,
        mix: [15, 10, 15, 60, 0],
        springEvery: 3,
      },
      // Side lanes twice as often: stars, and the calm each one brings.
      'star-field': {
        name: 'Star field',
        signature: null,
        twist: null,
        forkEvery: 2,
      },
      // The line ignores the ledges' pace: it rushes at the hardest one, then holds still.
      surge: { name: 'Surge', surge: true },
    }).map(([id, m]) => [id, Object.freeze(m)]),
  ),
);
const MODIFIER_IDS = Object.keys(MODIFIERS);
// Modifiers come in seeded rounds of all five, so each comes round before any repeats, and a
// round never opens with the one the last round ended on.
function modifierRound(seed, round) {
  let rng = random((seed ^ Math.imul(round + 1, 0x9e3779b1)) >>> 0);
  const ids = [...MODIFIER_IDS];
  for (let i = ids.length - 1; i > 0; i--) {
    rng = random(rng);
    const j = (rng >>> 16) % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
export function modifierFor(seed, index) {
  if (index < ZONES.length) return null;
  const n = MODIFIER_IDS.length,
    round = Math.floor((index - ZONES.length) / n),
    ids = modifierRound(seed, round);
  if (round > 0 && ids[0] === modifierRound(seed, round - 1)[n - 1])
    [ids[0], ids[1]] = [ids[1], ids[0]];
  return ids[(index - ZONES.length) % n];
}
/** The zone at `score`. Given the run's seed, a zone past the table carries its modifier. */
export function zoneForScore(score, seed) {
  const index = Math.max(0, Math.floor((Number.isFinite(score) ? score : 0) / ZONE_METRES)),
    zone = { index, ...ZONES[Math.min(index, ZONES.length - 1)] },
    modifier = seed === undefined ? null : modifierFor(seed, index);
  return modifier ? { ...zone, ...MODIFIERS[modifier], modifier } : zone;
}
/** The rising line's speed in px per second, in `zone`, after a landing on a ledge of `pace`. */
export const SURGE_MS = Object.freeze([6000, 4000]);
export function lineSpeed(zone, pace, timeMs) {
  if (zone.surge)
    return timeMs % (SURGE_MS[0] + SURGE_MS[1]) < SURGE_MS[0] ? zone.scroll * PRESS * 10 : 0;
  return zone.scroll * pace * 10;
}
/** A crumbled ledge returns after 3 s at any height: higher up, the line would reach a Puff
 * waiting below it any later. */
export const REBUILD_MS = 3000;
/** What a ledge does to Puff as he leaves it: springs boost him, kickers throw him sideways. */
export function launch(player, ledge) {
  if (ledge.kind === 'spring') return { ...player, vy: -SPRING_SPEED };
  if (ledge.kind === 'kicker') return { ...player, vx: ledge.push * DEFAULT_TUNING.moveSpeed };
  return player;
}
/** A spark pauses the rising line for this long. */
export const CALM_MS = 2500;
/** Sparks are the stars; three charge one rescue from a fall. */
export const STARS_FOR_RESCUE = 3;
/** A streak counts landings in a row each higher than the last; its tenth earns a star. */
export const STREAK_FOR_STAR = 10;
/** How long the UFO takes to beam Puff back onto the track. */
export const RESCUE_MS = 1700;
/** When the line catches Puff he drops under the game's gravity until he is out of view, at most
 * FALL_CAP_MS. It usually catches him at the bottom edge, half out of view, so the fall runs at
 * least FALL_MIN_MS to be seen. An ending and a rescue open with the same fall. */
export const FALL_MIN_MS = 550,
  FALL_CAP_MS = 1500;
/** Puff's feet `ms` into a fall that began at `y` dropping at `vy`. */
export const fallenY = (y, vy, ms) =>
  y + (vy * ms) / 1000 + 0.5 * DEFAULT_TUNING.gravity * (ms / 1000) ** 2;
function fallDuration(y, vy, outY) {
  const g = DEFAULT_TUNING.gravity,
    ms = ((-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, outY - y))) / g) * 1000;
  return clamp(ms, FALL_MIN_MS, FALL_CAP_MS);
}
const smooth = (u) => u * u * (3 - 2 * u);
// The UFO and the rocket never set Puff on a ledge that breaks or kicks: a crumble or kicker one
// chooses turns to stone, and stays stone.
const harden = (platforms, id) =>
  platforms.map((p) =>
    p.id === id && (p.kind === 'crumble' || p.kind === 'kicker') ? { ...p, kind: 'solid' } : p,
  );
// Both then set him down at rest in the middle of the ledge, as if he had just landed there.
function setDown(player, ledge, to, now, speed = 0) {
  return {
    lastLanding: {
      id: ledge.id,
      kind: ledge.kind,
      x: to.x,
      y: to.y,
      speed,
      at: now,
      pace: ledge.pace ?? 1,
    },
    player: launch(
      {
        ...player,
        x: to.x,
        y: to.y,
        vx: 0,
        vy: -DEFAULT_TUNING.jumpSpeed,
        grounded: false,
        platformId: null,
        coyoteMsLeft: 0,
        landed: true,
        events: ['land', 'jump'],
        timeMs: now,
      },
      ledge,
    ),
  };
}
// Where a rescued Puff is set down: a main-path ledge on screen, the highest no higher than his
// best ledge (the rescue then drops the line below it), so a rescue never gains him height.
// Only if none is on screen does he go to the lowest ledge above.
function rescueLedge(platforms, { cameraY, peakY }) {
  const onScreen = platforms.filter(
    (p) => /^\d+$/.test(p.id) && p.witness?.length && p.y > cameraY + 120 && p.y < cameraY + 560,
  );
  const behind = onScreen.filter((p) => p.y >= peakY + 100);
  if (behind.length) return behind.reduce((a, b) => (b.y < a.y ? b : a));
  return onScreen.reduce((a, b) => (b.y > a.y ? b : a), onScreen[0]) ?? null;
}
// One step of a rescue: Puff first falls out of view as when a climb ends, then the UFO lifts
// him from below to the ledge and sets him down as if he had just landed there, at rest: he keeps
// none of the speed he had before the fall.
function stepRescue(run, dt) {
  const delta = Number.isFinite(dt) ? clamp(dt, 0, 1 / 30) : 0,
    now = run.player.timeMs + delta * 1000,
    { from, to, at, fallMs, outY, line } = run.rescue,
    progress = (now - at - fallMs) / RESCUE_MS;
  const platforms = run.platforms.map((p) => platformAtTime(p, now));
  const effects = (run.effects ?? []).filter((e) => now - e.at < 650);
  if (progress < 0)
    return {
      ...run,
      platforms,
      effects,
      player: {
        ...run.player,
        y: fallenY(from.y, from.vy, now - at),
        vy: from.vy + (DEFAULT_TUNING.gravity * (now - at)) / 1000,
        timeMs: now,
      },
    };
  if (progress < 1) {
    // The beam lifts him from just out of view, however far he has fallen, so he shows soon.
    const low = Math.min(fallenY(from.y, from.vy, fallMs), outY),
      lift = smooth(clamp((progress - 0.3) / 0.55, 0, 1));
    return {
      ...run,
      platforms,
      effects,
      // The line cools and drops back below the ledge while the UFO swoops in, and holds.
      hazardY: line[0] + (line[1] - line[0]) * smooth(clamp(progress / 0.3, 0, 1)),
      calmUntil: at + fallMs + RESCUE_MS + CALM_MS,
      player: {
        ...run.player,
        x: from.x + (to.x - from.x) * lift,
        y: low + (to.y - low) * lift,
        vx: 0,
        vy: 0,
        grounded: false,
        landed: false,
        events: [],
        timeMs: now,
      },
    };
  }
  const ledge = platforms.find((p) => p.id === to.id) ?? { id: to.id, kind: 'solid', pace: 1 };
  return {
    ...run,
    ...setDown(run.player, ledge, to, now),
    status: 'playing',
    rescue: null,
    platforms,
    effects,
    streak: 0,
    calmUntil: now + CALM_MS,
  };
}
/** Each ROCKET_STREAK landings of a streak light Puff's rocket, and each carries him
 * ROCKET_METRES further than the last: about 200 m at ×50, 400 m at ×100. It sets him down
 * there as the UFO would. */
export const ROCKET_STREAK = 50,
  ROCKET_METRES = 200;
/** The rocket's beats follow a real launch: it lights on the ledge and builds thrust held down,
 * is let go, lifts off slowly and gathers pace while the engine burns for ROCKET_CUTOFF of the
 * climb, coasts up to ROCKET_DROP px over the ledge it chose, and Puff falls onto it. The climb
 * takes ROCKET_CLIMB_MS at ×50; a higher one takes longer by the square root of its height, as
 * it would under the same thrust. */
export const ROCKET_IGNITE_MS = 750,
  ROCKET_CLIMB_MS = 2800,
  ROCKET_CUTOFF = 0.7,
  ROCKET_DROP = 90;
const DROP_MS = Math.sqrt((2 * ROCKET_DROP) / DEFAULT_TUNING.gravity) * 1000;
/** How long `rocket` flies, from lighting to touchdown. */
export const rocketMs = (rocket) => ROCKET_IGNITE_MS + rocket.climb + DROP_MS;
// Puff strains a little off the ledge against the hold-down.
const HOVER = 4;
// The share of the climb done `u` through it. He is let go at KICK of the top speed, gathers
// pace evenly to it while the engine burns, then slows evenly to nothing at the top. PEAK scales
// the speed so the whole climb comes to 1.
const KICK = 0.3,
  PEAK = 2 / (1 + ROCKET_CUTOFF * KICK);
export function rocketClimb(u) {
  const c = ROCKET_CUTOFF;
  if (u < c) return PEAK * (KICK * u + ((1 - KICK) * u * u) / (2 * c));
  const coast = u - c;
  return PEAK * ((c * (1 + KICK)) / 2 + coast - (coast * coast) / (2 * (1 - c)));
}
/** Where the rocket has Puff's feet `age` ms after it lit. */
export function rocketAt({ from, to, climb }, age) {
  const lift = from.y - HOVER,
    apex = to.y - ROCKET_DROP;
  if (age < ROCKET_IGNITE_MS)
    return { x: from.x, y: from.y - HOVER * smooth(age / ROCKET_IGNITE_MS) };
  const u = (age - ROCKET_IGNITE_MS) / climb;
  if (u >= 1) return { x: to.x, y: Math.min(to.y, fallenY(apex, 0, (u - 1) * climb)) };
  // He drifts across only as he climbs, never sideways off the ledge.
  const climbed = rocketClimb(u);
  return { x: from.x + (to.x - from.x) * smooth(climbed), y: lift + (apex - lift) * climbed };
}
// The rocket lights on the landing that fills the streak. It lays the course out to past its
// goal at once and chooses the main-path ledge nearest it, turned to stone if it would break or
// kick. The line holds until a while after touchdown.
function ignite(run) {
  const { player } = run,
    stages = run.streak / ROCKET_STREAK,
    goal = player.y - ROCKET_METRES * 10 * stages,
    ahead = extend([...run.platforms], goal - 300, run.rng, run.nextId, run.plan, run.seed),
    ledge = ahead.platforms
      .filter((p) => /^\d+$/.test(p.id) && p.witness?.length)
      .reduce((a, b) => (Math.abs(b.y - goal) < Math.abs(a.y - goal) ? b : a)),
    at = player.timeMs,
    climb = ROCKET_CLIMB_MS * Math.sqrt(stages),
    landing = platformAtTime(ledge, at + rocketMs({ climb }));
  return {
    ...run,
    ...ahead,
    platforms: harden(
      ahead.platforms.map((p) => platformAtTime(p, at)),
      ledge.id,
    ),
    status: 'rocket',
    calmUntil: at + rocketMs({ climb }) + CALM_MS,
    rocket: {
      at,
      climb,
      from: { x: player.x, y: player.y },
      to: { id: ledge.id, x: landing.x + ledge.width / 2, y: ledge.y },
    },
    player: { ...player, vx: 0, vy: 0, grounded: false, platformId: null, events: ['land'] },
  };
}
function stepRocket(run, dt) {
  const delta = Number.isFinite(dt) ? clamp(dt, 0, 1 / 30) : 0,
    now = run.player.timeMs + delta * 1000,
    { at, to } = run.rocket,
    effects = (run.effects ?? []).filter((e) => now - e.at < 650);
  let platforms = run.platforms.map((p) => platformAtTime(p, now));
  if (now - at >= rocketMs(run.rocket)) {
    // Touchdown: a landing higher than the last, so the streak runs on. Past a zone's gate, the
    // zone of the ledge it lands on is named as the gate would have. (The flight topped out above
    // the ledge, perhaps over the next zone's line, so the score can't tell.)
    const ledge = platforms.find((p) => p.id === to.id) ?? { id: to.id, kind: 'solid', pace: 1 },
      zone = zoneForScore(scoreForPeak(to.y), run.seed),
      speed = Math.sqrt(2 * DEFAULT_TUNING.gravity * ROCKET_DROP);
    return {
      ...run,
      ...setDown(run.player, ledge, to, now, speed),
      status: 'playing',
      rocket: null,
      platforms,
      effects: [...effects, { type: 'touchdown', x: to.x, y: to.y, width: ledge.width, at: now }],
      landings: run.landings + 1,
      streak: run.streak + 1,
      banner:
        zone.index > (run.banner?.zone ?? 0)
          ? { zone: zone.index, modifier: zone.modifier ?? null, at: now }
          : run.banner,
    };
  }
  const { x, y } = rocketAt(run.rocket, now - at),
    peakY = Math.min(run.peakY, y),
    cameraY = Math.min(run.cameraY, y - 300);
  platforms = platforms.filter((p) => p.y <= cameraY + WORLD.height);
  const generated = extend(platforms, cameraY, run.rng, run.nextId, run.plan, run.seed);
  return {
    ...run,
    ...generated,
    platforms: generated.platforms.map((p) => platformAtTime(p, now)),
    effects,
    cameraY,
    peakY,
    score: scoreForPeak(peakY),
    hazardY: Math.min(run.hazardY, peakY + HAZARD_LAG),
    player: {
      ...run.player,
      x,
      y,
      vx: 0,
      vy: delta ? (y - run.player.y) / delta : run.player.vy,
      grounded: false,
      landed: false,
      events: [],
      timeMs: now,
    },
  };
}
/** While Puff outclimbs the rising line it trails this far below the peak. */
export const HAZARD_LAG = 460;
export function platformAtTime(platform, timeMs) {
  if (platform.kind !== 'moving') return platform;
  return {
    ...platform,
    x:
      platform.baseX +
      Math.sin((timeMs / platform.periodMs) * Math.PI * 2 + platform.phase) * platform.amplitude,
  };
}
// Course certificate. Every ledge carries `witness`: takeoff states Puff really reaches on it,
// each made from its source ledge's witness[parent] by steering `a` for `k` ticks, then `b`.
// A mover is certified only on the band its landing zone covers at every phase, so no certified
// hop depends on when Puff arrives.
const MARGIN = 8; // certified landings stay this far inside the real landing zone
const BAND = 12; // a mover keeps at least this half-width of landing zone over its centre
const OVERLAP = 6; // a chosen centre leaves this much reachable zone for one switch tick to hit
const landingHalf = (width, amplitude) => width / 2 + COLLIDER.halfWidth - MARGIN - amplitude;
const crossings = new Map();
function crossing(rise, gap) {
  // [ticks, fraction] until the real fall crosses `gap` above takeoff; null above the apex.
  const key = `${rise}:${gap}`;
  if (!crossings.has(key)) {
    let p = { ...createState(), y: 0, vy: -rise, grounded: false, platformId: null };
    crossings.set(key, null);
    for (let ticks = 1; ticks < 600; ticks++) {
      const next = step(p, {}, FIXED_DT, DEFAULT_TUNING, []);
      if (next.vy >= 0 && p.y <= -gap && next.y >= -gap) {
        crossings.set(key, [ticks, (-gap - p.y) / (next.y - p.y)]);
        break;
      }
      p = next;
    }
  }
  return crossings.get(key);
}
function fly(from, rise, gap, a, b, k) {
  const [ticks, fraction] = crossing(rise, gap);
  let x = from.x,
    vx = from.vx,
    before = x;
  for (let t = 0; t < ticks; t++) {
    before = x;
    [x, vx] = moveX(x, vx, t < k ? a : b, false, FIXED_DT);
  }
  return { impact: before + (x - before) * fraction, x, vx };
}
// The centre nearest `want` within [min, max] whose landing zone ±half some witness can reach.
function reachableCentre(sources, rise, gap, want, half, min, max) {
  if (!crossing(rise, gap)) return null;
  let best = null;
  for (const from of sources) {
    const low = Math.max(min, fly(from, rise, gap, -1, -1, 0).impact - half + OVERLAP),
      high = Math.min(max, fly(from, rise, gap, 1, 1, 0).impact + half - OVERLAP);
    if (low > high) continue;
    const centre = clamp(want, low, high);
    if (best === null || Math.abs(centre - want) < Math.abs(best - want)) best = centre;
  }
  return best;
}
// One switch from a to b moves the impact monotonically with the switch tick.
function aim(from, rise, gap, a, b, target) {
  let lo = 0,
    hi = crossing(rise, gap)[0];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (fly(from, rise, gap, a, b, mid).impact < target === a > b) lo = mid + 1;
    else hi = mid;
  }
  return [lo, Math.max(0, lo - 1)].map((k) => ({ ...fly(from, rise, gap, a, b, k), k }));
}
// Landings at both ends of [low, high], arriving fast and slow, so the next hop keeps its options.
// Each end is aimed from the source state whose reach comes closest to it.
function certify(sources, rise, gap, low, high) {
  const reaches = sources.map((from) => [
    fly(from, rise, gap, -1, -1, 0).impact,
    fly(from, rise, gap, 1, 1, 0).impact,
  ]);
  const found = [];
  for (const target of [low, high]) {
    const miss = ([lo, hi]) => Math.max(lo - target, target - hi, 0),
      parent = reaches.reduce((best, r, i) => (miss(r) < miss(reaches[best]) ? i : best), 0);
    for (const [a, b] of [
      [1, -1],
      [-1, 1],
    ]) {
      const best = aim(sources[parent], rise, gap, a, b, target)
        .filter((w) => w.impact >= low && w.impact <= high)
        .sort((p, q) => Math.abs(p.impact - target) - Math.abs(q.impact - target))[0];
      if (best && !found.some((f) => f.x === best.x && f.vx === best.vx))
        found.push({ x: best.x, vx: best.vx, parent, a, b, k: best.k });
    }
  }
  return found;
}
const KINDS = ['solid', 'crumble', 'moving', 'spring', 'kicker'];
// The next run of ledges: a gate on entering a zone, its signature taught gently, then mixed
// stretches alternating with the signature, and one twist in the zone's last quarter. Past the
// table a zone climbs in a wave instead: every run at the hardest pace (see extend), the twist
// earlier, then a breather of wide stone from REST_AT until the next gate.
const REST_AT = 165;
function nextSegment(plan, zone, into, rng) {
  if (zone.index > plan.zone)
    return {
      zone: zone.index,
      name: 'gate',
      left: 2,
      step: 0,
      teach: false,
      twisted: false,
      forkAt: plan.forkAt,
    };
  const pick = (names) => names[(rng >>> 8) % names.length],
    signature = zone.signature === 'remix' ? pick(SIGNATURES) : zone.signature;
  let name = 'mixed',
    teach = false,
    twisted = plan.twisted;
  if (plan.name === 'gate' && signature) [name, teach] = [signature, true];
  else if (zone.modifier && into >= REST_AT) name = 'rest';
  else if (into >= (zone.modifier ? 110 : 150) && !twisted && zone.twist)
    [name, twisted] = [zone.twist === 'remix' ? pick(TWISTS) : zone.twist, true];
  else if (plan.name === 'mixed' && signature) name = signature;
  const [shortest, longest] = SEGMENTS[name].length;
  return {
    zone: zone.index,
    name,
    left: teach ? 2 : shortest + (rng % (longest - shortest + 1)),
    step: 0,
    teach,
    twisted,
    forkAt: plan.forkAt,
  };
}
const OPENING = Object.freeze({
  zone: 0,
  name: 'mixed',
  left: 6,
  step: 0,
  teach: false,
  twisted: false,
  forkAt: 0,
});
function extend(platforms, cameraY, rng, nextId, plan, seed) {
  let top = platforms.filter((p) => !p.lane).reduce((a, b) => (a.y < b.y ? a : b));
  while (top.y > cameraY - 180) {
    const zone = zoneForScore(scoreForPeak(top.y), seed);
    const skipSource = platforms.find((p) => p.kind === 'spring' && Number(p.id) === nextId - 2),
      into = scoreForPeak(top.y) - zone.index * ZONE_METRES;
    // A wave's breather cuts in on time, whatever run it interrupts.
    const rest = zone.modifier && into >= REST_AT && plan.name !== 'rest' && plan.name !== 'gate';
    if (plan.left <= 0 || zone.index > plan.zone || rest) {
      rng = random(rng);
      plan = nextSegment(plan, zone, into, rng);
    }
    plan = { ...plan, left: plan.left - 1, step: plan.step + 1 };
    const segment = SEGMENTS[plan.name];
    rng = random(rng);
    let roll = rng % 100,
      choice = 0;
    while (roll >= zone.mix[choice]) roll -= zone.mix[choice++];
    let kind =
      segment.kinds?.[(plan.step - 1) % segment.kinds.length] ?? segment.kind ?? KINDS[choice];
    if (nextId === 2 || nextId === 3) kind = 'solid';
    if (nextId === 4) kind = 'crumble';
    if (nextId === 5) kind = 'spring';
    if (nextId === 6) kind = 'moving';
    if (skipSource) kind = 'solid';
    // After a fork both lanes merge on wide stone, where a lane taker can bounce to reposition.
    const lane = platforms.find((p) => p.lane && p.y === top.y);
    if (lane) kind = 'solid';
    // Springs stay apart, and their skip stays inside the run they start in.
    if (
      kind === 'spring' &&
      (plan.left < 2 ||
        platforms.some(
          (p) => p.kind === 'spring' && nextId - Number(p.id) < (zone.springEvery ?? 4),
        ))
    )
      kind = 'solid';
    rng = random(rng);
    let width = clamp(zone.width + (rng % 9) - 4, zone.minWidth, 104);
    rng = random(rng);
    // Gaps vary enough that hops don't fall into one steady beat.
    let gap = clamp(zone.gap + (rng % 15) - 7, 112, 134);
    rng = random(rng);
    let direction = rng >>> 31 ? 1 : -1;
    // A kicker throws Puff one way; the next ledge waits in that direction.
    if (top.kind === 'kicker') direction = top.push;
    else if (segment.turn && top.travelDir) direction = -top.travelDir;
    else if (segment.keep && top.travelDir) direction = top.travelDir;
    const previousCenter = (top.baseX ?? top.x) + top.width / 2;
    const reversal = top.travelDir && direction !== top.travelDir;
    rng = random(rng);
    let offset = Math.min(150, zone.offset + (rng % 9) - 4);
    // Fast reversals need a real landing area; narrow long reaches are for
    // continued momentum, not instant changes from full speed in the wrong direction.
    if (reversal) {
      offset = 108 + (rng % 9);
      width = Math.max(width, zone.turnWidth);
      gap = Math.min(gap, 122);
    }
    if (kind === 'moving') {
      offset = Math.min(offset, 140);
      width = Math.max(width, zone.moverWidth);
    }
    if (nextId === 2) {
      width = 100 + (rng % 9);
      gap = 114 + (rng % 5);
      offset = 132 + (rng % 15);
    }
    if (nextId === 3) {
      width = 94;
      gap = 118;
      offset = Math.min(offset, 124 + (rng % 9));
    }
    if (plan.name === 'gate' || plan.name === 'rest') {
      width = Math.max(width, 100);
      offset = Math.min(offset, 112);
    }
    if (plan.teach) {
      width = Math.min(104, width + 16);
      offset -= 12;
    }
    if (previousCenter + direction * offset < 95 || previousCenter + direction * offset > 545) {
      direction *= -1;
      offset = 108 + (rng % 9);
      width = Math.max(width, zone.turnWidth);
      gap = Math.min(gap, 122);
    }
    // Two shorter gaps make the boost's second ledge a real skip reward.
    // Keep its target over the spring; the intermediate ledge remains reachable normally.
    if (top.kind === 'spring' || skipSource) {
      gap = 104 + (rng % 5);
      width = Math.max(width, 88);
    }
    if (top.kind === 'spring') offset = Math.min(offset, 108);
    if (lane) width = Math.max(width, 94);
    let amplitude =
      kind === 'moving'
        ? Math.min(nextId === 6 ? 24 : zone.amplitude, landingHalf(width, 0) - BAND)
        : 0;
    // The boost's second ledge is certified from the spring itself, which is the skip.
    const source = skipSource ?? top,
      rise = -launch({ vy: -DEFAULT_TUNING.jumpSpeed }, source).vy,
      y = top.y - gap,
      // Hand-built ledges without a certificate take off from rest at their centre.
      from = (source.witness ?? [{ x: (source.baseX ?? source.x) + source.width / 2, vx: 0 }]).map(
        (w) => ({ ...w, vx: launch(w, source).vx }),
      ),
      want = skipSource ? skipSource.x + skipSource.width / 2 : previousCenter + direction * offset;
    let center = null,
      witness = [];
    for (const plain of [false, true]) {
      if (plain) {
        kind = 'solid';
        amplitude = 0;
        width = Math.max(width, zone.turnWidth);
      }
      const half = landingHalf(width, amplitude);
      center = reachableCentre(
        from,
        rise,
        source.y - y,
        want,
        half,
        Math.max(95, amplitude + width / 2),
        Math.min(545, WORLD.width - amplitude - width / 2),
      );
      if (center !== null)
        witness = certify(from, rise, source.y - y, center - half, center + half);
      if (witness.length) break;
    }
    if (!witness.length) {
      // Last resort: a stone exactly where Puff lands without steering.
      const coast = fly(from[0], rise, source.y - y, 0, 0, 0);
      center = coast.impact;
      witness = [{ x: coast.x, vx: coast.vx, parent: 0, a: 0, b: 0, k: 0 }];
    }
    // The merge must be certified from the lane too, or the lane never opens.
    const fromLane = lane
      ? certify(
          lane.witness,
          DEFAULT_TUNING.jumpSpeed,
          lane.y - y,
          center - landingHalf(width, 0),
          center + landingHalf(width, 0),
        )
      : [];
    if (lane && !fromLane.length) platforms.splice(platforms.indexOf(lane), 1);
    direction = Math.sign(center - previousCenter) || direction;
    top = {
      id: String(nextId++).padStart(2, '0'),
      x: center - width / 2,
      y,
      width,
      kind,
      travelDir: direction,
      pace: plan.teach ? 0.8 : zone.modifier && segment.pace >= 1 ? PRESS : segment.pace,
      witness,
    };
    if (kind === 'kicker') top.push = center < WORLD.width / 2 ? 1 : -1;
    if (fromLane.length) top.fromLane = fromLane;
    // The first gate ledge names the zone it opens, and the zone's modifier.
    if (plan.name === 'gate' && plan.step === 1) {
      top.gate = plan.zone;
      if (zone.modifier) top.modifier = zone.modifier;
    }
    if (kind === 'moving') {
      rng = random(rng);
      const [shortest, longest] = zone.periodMs;
      top = {
        ...top,
        baseX: top.x,
        amplitude,
        periodMs: shortest + (rng % (longest - shortest + 1)),
        phase: (rng / 4294967296) * Math.PI * 2,
      };
    }
    platforms.push(top);
    // A fork: from 100 m, often a narrow crumble lane opens on the far side carrying a spark (a
    // star). Three stars charge a rescue, so they come about twice per zone.
    rng = random(rng);
    if (
      plan.name === 'mixed' &&
      plan.left >= 1 &&
      scoreForPeak(top.y) >= 100 &&
      !skipSource &&
      !lane &&
      source.kind !== 'spring' &&
      kind !== 'spring' &&
      nextId - plan.forkAt >= (zone.forkEvery ?? 4)
    ) {
      const laneWidth = zone.minWidth,
        laneHalf = landingHalf(laneWidth, 0),
        laneCentre = reachableCentre(
          from,
          rise,
          source.y - y,
          previousCenter - direction * (108 + (rng % 9)),
          laneHalf,
          95,
          545,
        ),
        // Keep both landing zones apart at every phase, so a landing is never ambiguous.
        apart =
          laneCentre !== null &&
          Math.abs(laneCentre - center) >= (width + laneWidth) / 2 + amplitude + 60,
        laneWitness = apart
          ? certify(from, rise, source.y - y, laneCentre - laneHalf, laneCentre + laneHalf)
          : [];
      if (laneWitness.length) {
        platforms.push({
          id: `${top.id}L`,
          x: laneCentre - laneWidth / 2,
          y,
          width: laneWidth,
          kind: 'crumble',
          travelDir: Math.sign(laneCentre - previousCenter) || -direction,
          pace: segment.pace,
          lane: true,
          spark: true,
          witness: laneWitness,
        });
        plan = { ...plan, forkAt: nextId };
      }
    }
  }
  return { platforms, rng, nextId, plan };
}
export function createRun(seed = 0x50554646) {
  const normalized = Number.isFinite(seed) ? seed >>> 0 : 0x50554646;
  let rng = random(normalized);
  const spawnX = 180 + (rng % 281);
  rng = random(rng);
  const firstCenter = spawnX + (rng % 17) - 8;
  rng = random(rng);
  const firstY = 461 + (rng % 9);
  rng = random(rng);
  const firstWidth = 108 + (rng % 9);
  const generated = extend(
    [
      {
        id: 'floor',
        x: spawnX - 60,
        y: 575,
        width: 120,
        kind: 'crumble',
        travelDir: 0,
        witness: [{ x: spawnX, vx: 0 }],
      },
      {
        id: '01',
        x: firstCenter - firstWidth / 2,
        y: firstY,
        width: firstWidth,
        kind: 'solid',
        travelDir: 0,
        // Without steering Puff rises and lands where he started, within the first stone.
        witness: [{ x: spawnX, vx: 0, parent: 0, a: 0, b: 0, k: 0 }],
      },
    ],
    0,
    rng,
    2,
    OPENING,
    normalized,
  );
  return {
    status: 'playing',
    seed: normalized,
    player: { ...createState(), x: spawnX },
    ...generated,
    platforms: generated.platforms.map((p) => platformAtTime(p, 0)),
    cameraY: 0,
    peakY: 575,
    hazardY: 575 + HAZARD_LAG,
    score: 0,
    landings: 0,
    lastLanding: null,
    banner: null,
    calmUntil: 0,
    stars: 0,
    streak: 0,
    rescue: null,
    effects: [],
    brokenPlatforms: [],
  };
}
/** For testing: run `seed` lifted to about `metres`, with Puff at rest on a ledge of the main
 * path, turned to stone as a rescue would, and the line its usual lag below him. */
export function climbFrom(seed, metres) {
  let run = createRun(seed);
  while (run.score < metres)
    run = stepRun({ ...run, player: { ...run.player, y: run.player.y - 100 } }, {}, 0);
  const ledge = run.platforms
    .filter((p) => /^\d+$/.test(p.id) && p.kind !== 'spring' && p.y > run.cameraY + 300)
    .reduce((a, b) => (b.y < a.y ? b : a));
  return {
    ...run,
    platforms: run.platforms.map((p) => (p === ledge ? { ...p, kind: 'solid' } : p)),
    player: { ...createState(), x: ledge.x + ledge.width / 2, y: ledge.y, platformId: ledge.id },
    cameraY: ledge.y - 300,
    peakY: ledge.y,
    hazardY: ledge.y + HAZARD_LAG,
    score: scoreForPeak(ledge.y),
  };
}
export function stepRun(run, input = {}, dt = FIXED_DT, fallLimit = WORLD.height + 80) {
  if (run.status === 'over') return run;
  if (run.status === 'rescue') return stepRescue(run, dt);
  if (run.status === 'rocket') return stepRocket(run, dt);
  const delta = Number.isFinite(dt) ? clamp(dt, 0, 1 / 30) : 0;
  const now = run.player.timeMs + delta * 1000;
  let platforms = run.platforms.map((p) => platformAtTime(p, now));
  const brokenPlatforms = [];
  for (const repair of run.brokenPlatforms ?? []) {
    if (repair.platform.y < run.cameraY) continue;
    if (now >= repair.readyAt) {
      if (repair.platform.y <= run.cameraY + WORLD.height) platforms.push({ ...repair.platform });
    } else brokenPlatforms.push(repair);
  }
  let player = step(run.player, { ...input, autoHop: true }, delta, DEFAULT_TUNING, platforms);
  const effects = (run.effects ?? []).filter((e) => now - e.at < 650);
  let lastLanding = run.lastLanding,
    landings = run.landings,
    banner = run.banner,
    calmUntil = run.calmUntil ?? 0,
    stars = run.stars ?? 0,
    streak = run.streak ?? 0;
  const addEffect = (type, p) =>
    effects.push({ type, x: p.x, y: p.y, width: p.width, at: player.timeMs });
  if (run.player.grounded && run.player.platformId === 'floor' && player.events.includes('jump')) {
    const launch = platforms.find((p) => p.id === 'floor');
    if (launch) addEffect('break', launch);
    platforms = platforms.filter((p) => p.id !== 'floor');
  }
  if (player.landed) {
    streak = player.y < (run.lastLanding?.y ?? START_Y) - 1 ? streak + 1 : 0;
    if (streak === STREAK_FOR_STAR) {
      stars = Math.min(STARS_FOR_RESCUE, stars + 1);
      addEffect('streak', { x: player.x, y: player.y, width: 0 });
    }
    // Two ledges can share a row at a fork, so match the landing by position as well.
    const contact = platforms.find(
      (p) =>
        Math.abs(p.y - player.y) < 0.000001 &&
        player.x + COLLIDER.halfWidth + 4 > p.x &&
        player.x - COLLIDER.halfWidth - 4 < p.x + p.width,
    );
    lastLanding = {
      id: contact?.id ?? 'unknown',
      kind: contact?.kind ?? 'solid',
      x: player.x,
      y: player.y,
      speed: player.landSpeed,
      at: player.timeMs,
      pace: contact?.pace ?? 1,
    };
    landings++;
    if (contact?.kind === 'crumble') {
      brokenPlatforms.push({
        platform: contact.spark ? { ...contact, spark: false } : { ...contact },
        readyAt: player.timeMs + REBUILD_MS,
      });
      addEffect('break', contact);
      platforms = platforms.filter((p) => p.id !== contact.id);
    }
    // A gate names its zone once, not on every bounce.
    if (contact?.gate !== undefined && banner?.zone !== contact.gate)
      banner = { zone: contact.gate, modifier: contact.modifier ?? null, at: player.timeMs };
    if (contact) player = launch(player, contact);
    if (contact?.spark) {
      calmUntil = player.timeMs + CALM_MS;
      stars = Math.min(STARS_FOR_RESCUE, stars + 1);
      addEffect('spark', contact);
    }
    if (contact?.kind === 'kicker') addEffect('kick', contact);
    if (contact?.kind === 'spring') addEffect('spring', contact);
  }
  const peakY = Math.min(run.peakY, player.y),
    cameraY = Math.min(run.cameraY, player.y - 300),
    hazardY = Math.min(
      run.hazardY -
        (now < (run.calmUntil ?? 0) ? 0 : 1) *
          lineSpeed(zoneForScore(run.score, run.seed), run.lastLanding?.pace ?? 1, now) *
          delta,
      peakY + HAZARD_LAG,
    );
  platforms = platforms.filter((p) => p.y <= cameraY + WORLD.height);
  const generated = extend(platforms, cameraY, run.rng, run.nextId, run.plan, run.seed);
  const next = {
    ...run,
    player,
    ...generated,
    platforms: generated.platforms.map((p) => platformAtTime(p, now)),
    cameraY,
    peakY,
    hazardY,
    score: scoreForPeak(peakY),
    landings,
    lastLanding,
    banner,
    calmUntil,
    stars,
    streak,
    effects: effects.slice(-8),
    brokenPlatforms: brokenPlatforms.filter((repair) => repair.platform.y >= cameraY),
    status: 'playing',
  };
  if (!(player.y > hazardY || player.y - cameraY > fallLimit))
    return player.landed && streak > run.streak && streak % ROCKET_STREAK === 0
      ? ignite(next)
      : next;
  // A fall with three stars calls the UFO instead of ending the climb.
  const ledge = stars >= STARS_FOR_RESCUE && rescueLedge(next.platforms, next);
  if (!ledge) return { ...next, status: 'over' };
  const from = { x: player.x, y: player.y, vy: Math.max(0, player.vy) },
    // Where his sprite has just left the view, and how long his fall takes to get there.
    outY = cameraY + fallLimit,
    fallMs = fallDuration(from.y, from.vy, outY),
    // He is set down at rest on the middle of the ledge, wherever a mover has carried it by then.
    landing = platformAtTime(ledge, now + fallMs + RESCUE_MS);
  return {
    ...next,
    status: 'rescue',
    stars: 0,
    // The UFO never sets him on a ledge that breaks or kicks: a crumble or kicker it picks turns
    // to stone. Below his best ledge many rescues find only those, and a stone ledge higher would
    // gain him height.
    platforms: harden(next.platforms, ledge.id),
    rescue: {
      from,
      to: { id: ledge.id, x: landing.x + ledge.width / 2, y: ledge.y },
      at: now,
      outY,
      fallMs,
      // Where the line caught him, and where it drops to once the UFO comes.
      line: [hazardY, Math.max(hazardY, ledge.y + 300)],
    },
    player: { ...player, vx: 0, vy: from.vy, grounded: false, landed: false, events: [] },
    effects: [...next.effects, { type: 'ufo', x: from.x, y: from.y, width: 0, at: now }],
  };
}

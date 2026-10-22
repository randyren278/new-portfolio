// Search bot for Puff Up. It plans each hop with the physics alone, which is fast, then plays
// it through the real stepRun, so a clear means the real game was beaten: rising line,
// crumbles, springs and movers included.
// CLI: node scripts/puff-bot.mjs [seeds=20] [metres=1200] [firstSeed=0] [fromMetres=0]
import { pathToFileURL } from 'node:url';
import {
  createRun,
  climbFrom,
  stepRun,
  platformAtTime,
  zoneForScore,
  lineSpeed,
  HAZARD_LAG,
  launch,
  ROCKET_STREAK,
} from '../public/puff-up/game/climb.js';
import { FIXED_DT, DEFAULT_TUNING, step } from '../public/puff-up/game/physics.js';

// Each plan holds axis `a` for `k` ticks, then `b`, until the next landing.
const PLANS = [];
for (const [a, b] of [
  [1, -1],
  [-1, 1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
])
  for (let k = 0; k <= 110; k += 2) PLANS.push({ a, b, k });

const planned = (run) => ({
  player: run.player,
  // The launch pad breaks as Puff takes off, so it only supports the first tick.
  launch: run.platforms.filter((p) => p.id === 'floor'),
  ledges: run.platforms.filter((p) => p.id !== 'floor'),
  hazardY: run.hazardY,
  peakY: run.peakY,
  zone: zoneForScore(run.score, run.seed),
  pace: run.lastLanding?.pace ?? 1,
});
// One predicted flight to a landing no lower than takeoff, or null if it falls or is caught.
function flight(state, plan) {
  const from = state.player.y,
    near = state.ledges.filter((l) => l.y <= from + 1 && l.y >= from - 260);
  let p = state.player,
    { hazardY, peakY } = state;
  for (let t = 0; t < 240; t++) {
    const now = p.timeMs + FIXED_DT * 1000;
    p = step(
      p,
      { axis: t < plan.k ? plan.a : plan.b, autoHop: true },
      FIXED_DT,
      DEFAULT_TUNING,
      [...(t === 0 ? (state.launch ?? []) : []), ...near].map((l) => platformAtTime(l, now)),
    );
    peakY = Math.min(peakY, p.y);
    hazardY = Math.min(
      hazardY - lineSpeed(state.zone, state.pace, p.timeMs) * FIXED_DT,
      peakY + HAZARD_LAG,
    );
    if (p.y > hazardY || (p.vy > 0 && p.y > from + 1)) return null;
    if (p.landed) {
      const ledge = near.find((l) => {
        const at = platformAtTime(l, p.timeMs);
        return Math.abs(at.y - p.y) < 0.000001 && p.x + 28 > at.x && p.x - 28 < at.x + at.width;
      });
      return {
        plan,
        ledge,
        climbs: p.y < from - 1,
        player: launch(p, ledge),
        ledges: ledge.kind === 'crumble' ? state.ledges.filter((l) => l !== ledge) : state.ledges,
        hazardY,
        peakY,
        zone: state.zone,
        pace: ledge.pace ?? 1,
      };
    }
  }
  return null;
}
const centre = (l) => (l.baseX ?? l.x) + l.width / 2;
// How far a landing leaves Puff from the ledge after it, counting his speed toward it.
function behind(n) {
  const after = n.ledges.filter((l) => l.y < n.player.y - 1).sort((a, b) => b.y - a.y)[0];
  if (!after) return 0;
  const toward = Math.sign(centre(after) - n.player.x);
  return Math.abs(centre(after) - n.player.x) - toward * n.player.vx * 0.3;
}
// Distinct landings, best first: highest, then most progress toward the ledge after it.
const expansions = new WeakMap();
function landings(state) {
  if (!expansions.has(state)) {
    const seen = new Map();
    for (const plan of PLANS) {
      const next = flight(state, plan);
      if (!next) continue;
      const key = `${next.ledge.id}:${Math.round(next.player.x / 2)}:${Math.round(next.player.vx / 20)}`;
      if (!seen.has(key)) seen.set(key, next);
    }
    expansions.set(
      state,
      [...seen.values()].sort((p, q) => p.player.y - q.player.y || behind(p) - behind(q)),
    );
  }
  return expansions.get(state);
}
// Quick probes when any climb will do: a spread of switch times, toward the next ledge first.
const PROBES = PLANS.filter((p) => [110, 70, 50, 30, 10].includes(p.k));
const TOWARD = Object.fromEntries(
  [1, -1].map((d) => [d, [...PROBES].sort((p, q) => (q.a === d) - (p.a === d) || q.k - p.k)]),
);
// Can Puff keep climbing for `depth` more hops? Quick probes first, then every landing.
function viable(state, depth) {
  const above = state.ledges.filter((l) => l.y < state.player.y - 1);
  if (depth === 0 || !above.length) return true;
  const next = above.reduce((a, b) => (a.y > b.y ? a : b)),
    d = Math.sign((next.baseX ?? next.x) + next.width / 2 - state.player.x) || 1;
  for (const plan of TOWARD[d]) {
    const landing = flight(state, plan);
    if (landing?.climbs && viable(landing, depth - 1)) return true;
  }
  return landings(state).some((landing) => landing.climbs && viable(landing, depth - 1));
}
/** The next hop: the climb that stays viable longest, or a bounce that sets one up. */
export function choose(run) {
  const options = landings(planned(run));
  for (let d = 3; d >= 1; d--) {
    for (const next of options) if (next.climbs && viable(next, d - 1)) return next.plan;
    for (const next of options) if (!next.climbs && viable(next, d)) return next.plan;
  }
  return options[0]?.plan ?? null;
}
export function playBot(seed, metres = 1200, from = 0) {
  let run = from ? climbFrom(seed, from) : createRun(seed),
    hops = 0;
  while (run.status === 'playing' && run.score < metres) {
    const plan = choose(run);
    if (!plan) break;
    // The bot climbs every metre itself, so a clear covers every zone: each streak lapses one
    // landing short of a rocket.
    if (run.streak === ROCKET_STREAK - 1) run = { ...run, streak: 0 };
    for (let t = 0; t < 240 && run.status === 'playing'; t++) {
      run = stepRun(run, { axis: t < plan.k ? plan.a : plan.b });
      if (run.player.landed) break;
    }
    hops++;
  }
  return { seed, metres: run.score, cleared: run.score >= metres, hops };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [seeds = 20, metres = 1200, first = 0, from = 0] = process.argv.slice(2).map(Number);
  let failed = 0;
  for (let seed = first; seed < first + seeds; seed++) {
    const started = performance.now(),
      result = playBot(seed, metres, from);
    if (!result.cleared) failed++;
    console.log(JSON.stringify({ ...result, ms: Math.round(performance.now() - started) }));
  }
  console.log(JSON.stringify({ seeds, metres, cleared: seeds - failed, failed }));
  process.exitCode = failed ? 1 : 0;
}

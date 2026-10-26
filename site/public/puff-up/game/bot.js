// Search bot for Puff Up. It plans each hop with the physics alone, which is fast, then plays
// it through the real stepRun, so a clear means the real game was beaten: rising line,
// crumbles, springs and movers included. The tests climb with it, and the ★ lets it steer a
// climb in the game (see autopilot.js).
import { stepRun, platformAtTime, zoneForScore, lineSpeed, HAZARD_LAG, launch } from './climb.js';
import { FIXED_DT, DEFAULT_TUNING, step } from './physics.js';

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
function landings(state, plans = PLANS) {
  if (!expansions.has(state)) {
    const seen = new Map();
    for (const plan of plans) {
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
// A landing on a star's ledge that climbs and stays viable two hops on.
const starred = (n) => n?.ledge.spark && n.climbs && viable(n, 2);
// The hop onto a star, or else the one that sets it up: a star's lane sits off to the side, often
// out of reach from where Puff lands. A setup is a landing still viable a hop on, from which a
// quick probe toward the star lands on it. Setups a few pixels apart probe alike; one of each.
function starward(options) {
  const onto = options.find(starred);
  if (onto) return onto.plan;
  const tried = new Set();
  for (const next of options) {
    const key = `${next.ledge.id}:${Math.round(next.player.x / 12)}:${Math.sign(Math.round(next.player.vx / 40))}`;
    if (tried.has(key)) continue;
    tried.add(key);
    const star = next.ledges.find((l) => l.spark && l.y < next.player.y - 1);
    if (!star) continue;
    const d = Math.sign(centre(star) - next.player.x) || 1;
    if (PROBES.some((plan) => plan.a === d && starred(flight(next, plan))) && viable(next, 1))
      return next.plan;
  }
  return null;
}
/** The next hop: a star within two hops if the climb stays viable, as a player would take it;
 * else the climb that stays viable longest, or a bounce that sets one up. With `wait`, only a hop
 * that goes straight up for its first `wait` ticks. */
export function choose(run, wait = 0) {
  // A plan switches steer once, so it is straight throughout if it is at both ends.
  const plans = wait ? PLANS.filter((p) => steer(p, 0) === 0 && steer(p, wait - 1) === 0) : PLANS,
    state = planned(run),
    options = landings(state, plans),
    { y } = state.player;
  if (state.ledges.some((l) => l.spark && l.y < y - 1 && l.y >= y - 260)) {
    const plan = starward(options);
    if (plan) return plan;
  }
  for (let d = 3; d >= 1; d--) {
    for (const next of options) if (next.climbs && viable(next, d - 1)) return next.plan;
    for (const next of options) if (!next.climbs && viable(next, d)) return next.plan;
  }
  return options[0]?.plan ?? null;
}
/** The steer `tick` ticks into a hop flown with `plan`; with no plan Puff hops straight. */
export const steer = (plan, tick) => (plan ? (tick < plan.k ? plan.a : plan.b) : 0);
/** The bot decides at the start of a climb and after each landing that leaves Puff climbing. */
export const decides = (run) => run.player.landed && run.status === 'playing';
/** Names the exact moment of a climb, so the game can tell a decision was made where it is. */
export const stateKey = ({ player: p }) => `${p.timeMs}:${p.x}:${p.y}:${p.vx}:${p.vy}`;
/** The bot's climb from `run` as the game plays it: a decision at each point where it decides,
 * each played through the real stepRun to the next. Yields where each was made and its plan. The
 * first hop goes straight up for `wait` ticks, which the game plays while it waits for it. */
export function* climb(run, fallLimit, wait = 0) {
  for (let first = true; run.status !== 'over'; first = false) {
    const plan = choose(run, first ? wait : 0);
    yield { at: stateKey(run), plan, run };
    for (let tick = 0; ; tick++) {
      run = stepRun(run, { axis: steer(plan, tick) }, FIXED_DT, fallLimit);
      if (decides(run) || run.status === 'over') break;
    }
  }
}

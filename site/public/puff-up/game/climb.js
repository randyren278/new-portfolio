import { WORLD, COLLIDER, FIXED_DT, DEFAULT_TUNING, createState, step, moveX } from './physics.js';
export const SPRING_SPEED = 910;
const START_Y = 575;
const random = (rng) => (Math.imul(rng, 1664525) + 1013904223) >>> 0;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function scoreForPeak(y) {
  return Number.isFinite(y) ? Math.max(0, Math.floor((START_Y - y) / 10)) : 0;
}
export const ZONE_METRES = 200;
// Each zone is a step up; past the table the last zone repeats. scroll is the rising line in
// metres per second, mix weighs solid/crumble/moving/spring, and movers swing ±amplitude px
// once per periodMs.
export const ZONES = Object.freeze(
  [
    {
      scroll: 2.5,
      mix: [40, 30, 20, 10],
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
      scroll: 5,
      mix: [30, 36, 26, 8],
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
      scroll: 7.5,
      mix: [22, 40, 31, 7],
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
      scroll: 10,
      mix: [15, 44, 35, 6],
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
      scroll: 12,
      mix: [10, 46, 39, 5],
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
export function zoneForScore(score) {
  const index = Math.max(0, Math.floor((Number.isFinite(score) ? score : 0) / ZONE_METRES));
  return { index, ...ZONES[Math.min(index, ZONES.length - 1)] };
}
/** A crumbled ledge returns after 3 s in the first zone and 1 s longer per zone. */
export function rebuildMs(y) {
  return (3 + zoneForScore(scoreForPeak(y)).index) * 1000;
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
const KINDS = ['solid', 'crumble', 'moving', 'spring'];
function extend(platforms, cameraY, rng, nextId) {
  let top = platforms.reduce((a, b) => (a.y < b.y ? a : b));
  while (top.y > cameraY - 180) {
    const zone = zoneForScore(scoreForPeak(top.y));
    const skipSource = platforms.find((p) => p.kind === 'spring' && Number(p.id) === nextId - 2);
    rng = random(rng);
    let roll = rng % 100,
      choice = 0;
    while (roll >= zone.mix[choice]) roll -= zone.mix[choice++];
    let kind = KINDS[choice];
    if (nextId === 2 || nextId === 3) kind = 'solid';
    if (nextId === 4) kind = 'crumble';
    if (nextId === 5) kind = 'spring';
    if (nextId === 6) kind = 'moving';
    if (skipSource) kind = 'solid';
    if (
      kind === 'spring' &&
      platforms.some((p) => p.kind === 'spring' && nextId - Number(p.id) < 4)
    )
      kind = 'solid';
    rng = random(rng);
    let width = clamp(zone.width + (rng % 9) - 4, zone.minWidth, 104);
    rng = random(rng);
    let gap = clamp(zone.gap + (rng % 5) - 2, 114, 132);
    rng = random(rng);
    let direction = rng >>> 31 ? 1 : -1;
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
    let amplitude =
      kind === 'moving'
        ? Math.min(nextId === 6 ? 24 : zone.amplitude, landingHalf(width, 0) - BAND)
        : 0;
    // The boost's second ledge is certified from the spring itself, which is the skip.
    const source = skipSource ?? top,
      rise = source.kind === 'spring' ? SPRING_SPEED : DEFAULT_TUNING.jumpSpeed,
      y = top.y - gap,
      // Hand-built ledges without a certificate take off from rest at their centre.
      from = source.witness ?? [{ x: (source.baseX ?? source.x) + source.width / 2, vx: 0 }],
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
    direction = Math.sign(center - previousCenter) || direction;
    top = {
      id: String(nextId++).padStart(2, '0'),
      x: center - width / 2,
      y,
      width,
      kind,
      travelDir: direction,
      witness,
    };
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
  }
  return { platforms, rng, nextId };
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
    effects: [],
    brokenPlatforms: [],
  };
}
export function stepRun(run, input = {}, dt = FIXED_DT, fallLimit = WORLD.height + 80) {
  if (run.status === 'over') return run;
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
    landings = run.landings;
  const addEffect = (type, p) =>
    effects.push({ type, x: p.x, y: p.y, width: p.width, at: player.timeMs });
  if (run.player.grounded && run.player.platformId === 'floor' && player.events.includes('jump')) {
    const launch = platforms.find((p) => p.id === 'floor');
    if (launch) addEffect('break', launch);
    platforms = platforms.filter((p) => p.id !== 'floor');
  }
  if (player.landed) {
    const contact = platforms.find((p) => Math.abs(p.y - player.y) < 0.000001);
    lastLanding = {
      id: contact?.id ?? 'unknown',
      kind: contact?.kind ?? 'solid',
      x: player.x,
      y: player.y,
      speed: player.landSpeed,
      at: player.timeMs,
    };
    landings++;
    if (contact?.kind === 'crumble') {
      brokenPlatforms.push({
        platform: { ...contact },
        readyAt: player.timeMs + rebuildMs(contact.y),
      });
      addEffect('break', contact);
      platforms = platforms.filter((p) => p.id !== contact.id);
    }
    if (contact?.kind === 'spring') {
      player = { ...player, vy: -SPRING_SPEED };
      addEffect('spring', contact);
    }
  }
  const peakY = Math.min(run.peakY, player.y),
    cameraY = Math.min(run.cameraY, player.y - 300),
    hazardY = Math.min(
      run.hazardY - zoneForScore(run.score).scroll * 10 * delta,
      peakY + HAZARD_LAG,
    );
  platforms = platforms.filter((p) => p.y <= cameraY + WORLD.height);
  const generated = extend(platforms, cameraY, run.rng, run.nextId);
  return {
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
    effects: effects.slice(-8),
    brokenPlatforms: brokenPlatforms.filter((repair) => repair.platform.y >= cameraY),
    status: player.y > hazardY || player.y - cameraY > fallLimit ? 'over' : 'playing',
  };
}

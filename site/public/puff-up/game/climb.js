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
export function zoneForScore(score) {
  const index = Math.max(0, Math.floor((Number.isFinite(score) ? score : 0) / ZONE_METRES));
  return { index, ...ZONES[Math.min(index, ZONES.length - 1)] };
}
/** A crumbled ledge returns after 3 s in the first zone and 1 s longer per zone. */
export function rebuildMs(y) {
  return (3 + zoneForScore(scoreForPeak(y)).index) * 1000;
}
/** What a ledge does to Puff as he leaves it: springs boost him, kickers throw him sideways. */
export function launch(player, ledge) {
  if (ledge.kind === 'spring') return { ...player, vy: -SPRING_SPEED };
  if (ledge.kind === 'kicker') return { ...player, vx: ledge.push * DEFAULT_TUNING.moveSpeed };
  return player;
}
/** A spark pauses the rising line for this long. */
export const CALM_MS = 2500;
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
// stretches alternating with the signature, and one twist in the zone's last quarter.
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
  else if (into >= 150 && !twisted && zone.twist)
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
function extend(platforms, cameraY, rng, nextId, plan) {
  let top = platforms.filter((p) => !p.lane).reduce((a, b) => (a.y < b.y ? a : b));
  while (top.y > cameraY - 180) {
    const zone = zoneForScore(scoreForPeak(top.y));
    const skipSource = platforms.find((p) => p.kind === 'spring' && Number(p.id) === nextId - 2);
    if (plan.left <= 0 || zone.index > plan.zone) {
      rng = random(rng);
      plan = nextSegment(plan, zone, scoreForPeak(top.y) - zone.index * ZONE_METRES, rng);
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
      (plan.left < 2 || platforms.some((p) => p.kind === 'spring' && nextId - Number(p.id) < 4))
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
    if (plan.name === 'gate') {
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
      pace: plan.teach ? 0.8 : segment.pace,
      witness,
    };
    if (kind === 'kicker') top.push = center < WORLD.width / 2 ? 1 : -1;
    if (fromLane.length) top.fromLane = fromLane;
    // The first gate ledge names the zone it opens.
    if (plan.name === 'gate' && plan.step === 1) top.gate = plan.zone;
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
    // A fork: now and then a narrow crumble lane opens on the far side carrying a spark.
    rng = random(rng);
    if (
      plan.name === 'mixed' &&
      plan.left >= 1 &&
      zone.index >= 1 &&
      !skipSource &&
      !lane &&
      source.kind !== 'spring' &&
      kind !== 'spring' &&
      nextId - plan.forkAt >= 7 &&
      rng % 100 < 45
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
    landings = run.landings,
    banner = run.banner,
    calmUntil = run.calmUntil ?? 0;
  const addEffect = (type, p) =>
    effects.push({ type, x: p.x, y: p.y, width: p.width, at: player.timeMs });
  if (run.player.grounded && run.player.platformId === 'floor' && player.events.includes('jump')) {
    const launch = platforms.find((p) => p.id === 'floor');
    if (launch) addEffect('break', launch);
    platforms = platforms.filter((p) => p.id !== 'floor');
  }
  if (player.landed) {
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
        readyAt: player.timeMs + rebuildMs(contact.y),
      });
      addEffect('break', contact);
      platforms = platforms.filter((p) => p.id !== contact.id);
    }
    // A gate names its zone once, not on every bounce.
    if (contact?.gate !== undefined && banner?.zone !== contact.gate)
      banner = { zone: contact.gate, at: player.timeMs };
    if (contact) player = launch(player, contact);
    if (contact?.spark) {
      calmUntil = player.timeMs + CALM_MS;
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
          zoneForScore(run.score).scroll *
          (run.lastLanding?.pace ?? 1) *
          10 *
          delta,
      peakY + HAZARD_LAG,
    );
  platforms = platforms.filter((p) => p.y <= cameraY + WORLD.height);
  const generated = extend(platforms, cameraY, run.rng, run.nextId, run.plan);
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
    banner,
    calmUntil,
    effects: effects.slice(-8),
    brokenPlatforms: brokenPlatforms.filter((repair) => repair.platform.y >= cameraY),
    status: player.y > hazardY || player.y - cameraY > fallLimit ? 'over' : 'playing',
  };
}

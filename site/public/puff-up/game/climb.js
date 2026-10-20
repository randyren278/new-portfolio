import { WORLD, COLLIDER, FIXED_DT, DEFAULT_TUNING, createState, step } from './physics.js';
export const SPRING_SPEED = 910;
const START_Y = 575;
const random = (rng) => (Math.imul(rng, 1664525) + 1013904223) >>> 0;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function scoreForPeak(y) {
  return Number.isFinite(y) ? Math.max(0, Math.floor((START_Y - y) / 10)) : 0;
}
export function difficultyForScore(score) {
  const progress = clamp(Number.isFinite(score) ? score / 200 : 0, 0, 1);
  return {
    progress,
    width: Math.round(100 - progress * 36),
    gap: Math.round(116 + progress * 12),
    offset: Math.round(130 + progress * 20),
  };
}
export function platformAtTime(platform, timeMs) {
  if (platform.kind !== 'moving') return platform;
  return {
    ...platform,
    x:
      platform.baseX +
      Math.sin((timeMs / platform.periodMs) * Math.PI * 2 + platform.phase) * platform.amplitude,
  };
}
// Cache a bounded takeoff witness driven by the actual approved physics API.
const travelByGap = new Map();
function normalTravel(gap) {
  if (travelByGap.has(gap)) return travelByGap.get(gap);
  const source = { id: 'reachability-source', x: 0, y: 0, width: WORLD.width };
  const startX = 300;
  let previous = { ...createState(), x: startX, y: 0, platformId: source.id };
  for (let i = 0; i < 160; i++) {
    const next = step(previous, { axis: 1, autoHop: true }, FIXED_DT, DEFAULT_TUNING, [source]);
    if (next.vy >= 0 && previous.y <= -gap && next.y >= -gap) {
      const fraction = (-gap - previous.y) / (next.y - previous.y);
      const distance = previous.x + (next.x - previous.x) * fraction - startX;
      travelByGap.set(gap, distance);
      return distance;
    }
    previous = next;
  }
  return 0; // Approved gaps always cross; conservative deterministic fallback.
}
function extend(platforms, cameraY, rng, nextId) {
  let top = platforms.reduce((a, b) => (a.y < b.y ? a : b));
  while (top.y > cameraY - 180) {
    const difficulty = difficultyForScore(scoreForPeak(top.y));
    const skipSource = platforms.find((p) => p.kind === 'spring' && Number(p.id) === nextId - 2);
    rng = random(rng);
    const choice = rng % 10;
    let kind = choice < 4 ? 'solid' : choice < 7 ? 'crumble' : choice < 9 ? 'moving' : 'spring';
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
    let width = clamp(difficulty.width + (rng % 9) - 4, 64, 104);
    rng = random(rng);
    let gap = clamp(difficulty.gap + (rng % 5) - 2, 114, 128);
    rng = random(rng);
    let direction = rng >>> 31 ? 1 : -1;
    const previousCenter = (top.baseX ?? top.x) + top.width / 2;
    const reversal = top.travelDir && direction !== top.travelDir;
    rng = random(rng);
    let offset = Math.min(150, difficulty.offset + (rng % 9) - 4);
    // Fast reversals need a real landing area; narrow long reaches are for
    // continued momentum, not instant changes from full speed in the wrong direction.
    if (reversal) {
      offset = 108 + (rng % 9);
      width = Math.max(width, 94);
      gap = Math.min(gap, 122);
    }
    if (kind === 'moving') {
      offset = Math.min(offset, 140);
      width = Math.max(width, 84);
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
      width = Math.max(width, 94);
      gap = Math.min(gap, 122);
    }
    // A moving source can be a full amplitude behind its base center at takeoff.
    // Reserve that excursion rather than hiding an extra horizontal gap.
    offset = Math.min(
      offset,
      (kind === 'moving' ? 140 : 150) - (top.kind === 'moving' ? top.amplitude : 0),
    );
    const amplitude =
      kind === 'moving' ? (nextId === 6 ? 24 : 24 + Math.round(difficulty.progress * 12)) : 0;
    offset = Math.min(
      offset,
      normalTravel(gap) +
        width / 2 +
        COLLIDER.halfWidth -
        8 -
        (top.kind === 'moving' ? top.amplitude : 0) -
        amplitude,
    );
    // Two shorter gaps make the boost's second ledge a real skip reward.
    // Keep its target over the spring; the intermediate ledge remains reachable normally.
    if (top.kind === 'spring' || skipSource) {
      gap = 104 + (rng % 5);
      width = Math.max(width, 88);
    }
    if (top.kind === 'spring') offset = Math.min(offset, 108);
    const center = skipSource
      ? skipSource.x + skipSource.width / 2
      : previousCenter + direction * offset;
    if (skipSource) direction = Math.sign(center - previousCenter);
    top = {
      id: String(nextId++).padStart(2, '0'),
      x: center - width / 2,
      y: top.y - gap,
      width,
      kind,
      travelDir: direction,
    };
    if (kind === 'moving') {
      rng = random(rng);
      top = {
        ...top,
        baseX: top.x,
        amplitude,
        periodMs: 2400 + (rng % 401),
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
      { id: 'floor', x: spawnX - 60, y: 575, width: 120, kind: 'crumble', travelDir: 0 },
      {
        id: '01',
        x: firstCenter - firstWidth / 2,
        y: firstY,
        width: firstWidth,
        kind: 'solid',
        travelDir: 0,
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
    score: 0,
    landings: 0,
    lastLanding: null,
    effects: [],
  };
}
export function stepRun(run, input = {}, dt = FIXED_DT, fallLimit = WORLD.height + 80) {
  if (run.status === 'over') return run;
  const delta = Number.isFinite(dt) ? clamp(dt, 0, 1 / 30) : 0;
  const now = run.player.timeMs + delta * 1000;
  let platforms = run.platforms.map((p) => platformAtTime(p, now));
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
      addEffect('break', contact);
      platforms = platforms.filter((p) => p.id !== contact.id);
    }
    if (contact?.kind === 'spring') {
      player = { ...player, vy: -SPRING_SPEED };
      addEffect('spring', contact);
    }
  }
  const peakY = Math.min(run.peakY, player.y),
    cameraY = Math.min(run.cameraY, player.y - 300);
  platforms = platforms.filter((p) => p.y <= cameraY + WORLD.height);
  const generated = extend(platforms, cameraY, run.rng, run.nextId);
  return {
    ...run,
    player,
    ...generated,
    platforms: generated.platforms.map((p) => platformAtTime(p, now)),
    cameraY,
    peakY,
    score: scoreForPeak(peakY),
    landings,
    lastLanding,
    effects: effects.slice(-8),
    status: player.y - cameraY > fallLimit ? 'over' : 'playing',
  };
}

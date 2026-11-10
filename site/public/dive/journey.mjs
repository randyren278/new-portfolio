const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const smooth = (value) => value * value * (3 - 2 * value);
const safeDepth = (value) => clamp(Number(value) || 0, 0, 7000);

/** One seekable clock drives the diver, camera, rating and score. Times are milliseconds. */
export function createDiveJourney({ from = 0, to = 0, rank = 0, reducedMotion = false } = {}) {
  from = safeDepth(from);
  to = safeDepth(to);
  rank = clamp(Math.trunc(Number(rank) || 0), -1, 5);
  const distance = Math.abs(to - from);
  const travel = distance ? clamp(650 + distance * 0.55, 720, 1450) : 0;
  const anticipation = distance ? 180 : 140;
  const settling = distance ? 220 : 220;
  const duration = reducedMotion ? 0 : anticipation + travel + settling;
  function sample(elapsed = 0) {
    elapsed = Math.max(0, Number(elapsed) || 0);
    if (!duration || elapsed >= duration)
      return { phase: 'landed', phaseProgress: 1, progress: 1, depth: to, rarityProgress: Math.max(0, rank), velocity: 0 };
    if (elapsed < anticipation)
      return { phase: 'anticipation', phaseProgress: elapsed / anticipation, progress: 0, depth: from, rarityProgress: 0, velocity: 0 };
    if (travel && elapsed < anticipation + travel) {
      const phaseProgress = (elapsed - anticipation) / travel;
      const progress = smooth(phaseProgress);
      return { phase: 'descent', phaseProgress, progress, depth: from + (to - from) * progress, rarityProgress: Math.max(0, rank) * progress, velocity: 4 * phaseProgress * (1 - phaseProgress) };
    }
    return { phase: 'settle', phaseProgress: (elapsed - anticipation - travel) / settling, progress: 1, depth: to, rarityProgress: Math.max(0, rank), velocity: 0 };
  }
  return { from, to, rank, duration, sample };
}

export function oceanZone(depth) {
  if (depth >= 6000) return 'hadal';
  if (depth >= 4000) return 'abyss';
  if (depth >= 2000) return 'midnight';
  if (depth >= 200) return 'twilight';
  return 'surface';
}

/** The rod remains a world-space point even while its boat is outside the camera. */
export function rodTip({ width, height, portrait, surface, time = 0 }) {
  const pixel = (portrait ? 65 : 86) / 56;
  const desired = portrait ? (height < 600 ? 120 : 168) : clamp(width * 0.17, 190, 270);
  const w = Math.round(desired / pixel) * pixel;
  const h = Math.round((Math.round(desired / pixel) * 701) / 1075) * pixel;
  const x = width * (portrait ? 0.48 : 0.69);
  const angle = Math.sin(time * 1.35) * 0.022;
  const bob = Math.sin(time * 1.8) * 3;
  const tip = { x: w * 0.58, y: -h * 0.94 };
  return {
    x: x + tip.x * Math.cos(angle) - tip.y * Math.sin(angle),
    y: surface + bob + tip.x * Math.sin(angle) + tip.y * Math.cos(angle),
    boatX: x,
    w,
    h,
    angle,
    bob,
  };
}

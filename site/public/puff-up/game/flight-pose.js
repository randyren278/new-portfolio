/** Actual momentum → bounded, cache-friendly, deterministic airborne foot pose. */
const clamp = (n) => Math.max(-1, Math.min(1, n));
const finite = (n) => (Number.isFinite(n) ? n : 0);
const normalized = (velocity, speed) =>
  Number.isFinite(speed) && speed > 0 ? clamp(finite(velocity) / speed) : 0;
const quantize = (n, steps) => {
  const value = Math.round(clamp(finite(n)) * steps) / steps;
  return value === 0 ? 0 : value; // Avoid -0 cache keys/readouts.
};
export function sampleFlightMotion(player = {}, tuning = {}) {
  return {
    horizontal: quantize(normalized(player.vx, tuning.moveSpeed), 4),
    vertical: quantize(normalized(player.vy, tuning.jumpSpeed), 8),
  };
}
/** direction is the renderer's facing sign (+1 right, -1 left). */
export function sampleAirFeet(flight = {}, direction = 1) {
  const horizontal = clamp(finite(flight.horizontal));
  const vertical = clamp(finite(flight.vertical));
  const speed = Math.abs(horizontal),
    localTravel = horizontal * (direction < 0 ? -1 : 1);
  // Launch barely lifts the feet; the tuck builds into the apex, then releases.
  const base = vertical <= 0 ? 0.25 + (1 + vertical) * 0.95 : 1.2 * (1 - vertical);
  const leadLift = base * (1 + 0.2 * speed),
    trailLift = base * (1 - 0.65 * speed);
  let leftLift = base,
    rightLift = base,
    leftX = 0,
    rightX = 0;
  if (localTravel > 0) {
    rightLift = leadLift;
    leftLift = trailLift;
    rightX = 0.25 * speed;
    leftX = -0.8 * speed;
  } else if (localTravel < 0) {
    leftLift = leadLift;
    rightLift = trailLift;
    leftX = -0.25 * speed;
    rightX = 0.8 * speed;
  }
  return {
    leftFootX: leftX,
    leftFootY: leftLift === 0 ? 0 : -leftLift,
    leftFootRotation: 0,
    rightFootX: rightX,
    rightFootY: rightLift === 0 ? 0 : -rightLift,
    rightFootRotation: 0,
  };
}

/** Pure fixed-step movement for the local Puff playground. y is foot baseline. */
export const WORLD = Object.freeze({ width: 640, height: 620 });
export const COLLIDER = Object.freeze({ halfWidth: 24, height: 38 });
export const PLATFORMS = Object.freeze(
  [
    { id: 'floor', x: 0, y: 575, width: 640 },
    { id: '01', x: 70, y: 470, width: 160 },
    { id: '02', x: 310, y: 365, width: 160 },
    { id: '03', x: 75, y: 260, width: 160 },
    { id: '04', x: 340, y: 155, width: 180 },
  ].map(Object.freeze),
);
export const FIXED_DT = 1 / 120;
export const DEFAULT_TUNING = Object.freeze({
  moveSpeed: 260,
  acceleration: 1800,
  airAcceleration: 1250,
  friction: 1800,
  gravity: 1700,
  jumpSpeed: 700,
  maxFallSpeed: 900,
  coyoteMs: 100,
  jumpBufferMs: 110,
});
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const approach = (value, target, amount) =>
  value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
const overlaps = (x, p) => x + COLLIDER.halfWidth > p.x && x - COLLIDER.halfWidth < p.x + p.width;
/** One tick of horizontal motion; shared with the course certificate so both use one rule. */
export function moveX(x, vx, axis, grounded, dt, t = DEFAULT_TUNING) {
  const accel =
    axis === 0 ? t.friction * (grounded ? 1 : 0.3) : grounded ? t.acceleration : t.airAcceleration;
  const v = approach(vx, axis * t.moveSpeed, accel * dt);
  const proposed = x + v * dt;
  const next = clamp(proposed, COLLIDER.halfWidth, WORLD.width - COLLIDER.halfWidth);
  return next === proposed ? [next, v] : [next, 0];
}
export function createState() {
  return {
    x: 140,
    y: 575,
    vx: 0,
    vy: 0,
    grounded: true,
    platformId: 'floor',
    facing: 'right',
    motion: 'idle',
    landed: false,
    landSpeed: 0,
    jumpCount: 0,
    resetCount: 0,
    timeMs: 0,
    coyoteMsLeft: 100,
    jumpBufferMsLeft: 0,
    events: [],
  };
}
function jump(s, t) {
  s.vy = -t.jumpSpeed;
  s.grounded = false;
  s.platformId = null;
  s.coyoteMsLeft = 0;
  s.jumpBufferMsLeft = 0;
  s.jumpCount++;
  s.events.push('jump');
}
function motion(s, axis) {
  if (!s.grounded) return s.vy < -40 ? 'rise' : s.vy > 40 ? 'fall' : 'apex';
  if (Math.abs(s.vx) < 8) return 'idle';
  if (axis === 0 && Math.abs(s.vx) > 80) return 'brake';
  return Math.abs(s.vx) > 150 ? 'run' : 'walk';
}
/** Returns a NEW plain state; never mutates input state, input or tuning. */
export function step(
  state,
  input = {},
  dtSeconds = FIXED_DT,
  tuning = DEFAULT_TUNING,
  platforms = PLATFORMS,
) {
  const dt = Number.isFinite(dtSeconds) ? clamp(dtSeconds, 0, 1 / 30) : 0;
  const t = { ...DEFAULT_TUNING, ...tuning };
  const axis = Number.isFinite(input.axis) ? clamp(input.axis, -1, 1) : 0;
  const s = { ...state, events: [], landed: false, landSpeed: 0 };
  if (dt === 0) return s;
  const ms = dt * 1000,
    wasGrounded = s.grounded;
  s.timeMs += ms;
  s.coyoteMsLeft = wasGrounded ? t.coyoteMs : Math.max(0, s.coyoteMsLeft - ms);
  s.jumpBufferMsLeft = input.jumpPressed ? t.jumpBufferMs : Math.max(0, s.jumpBufferMsLeft - ms);
  const previousX = s.x,
    previousY = s.y;
  [s.x, s.vx] = moveX(s.x, s.vx, axis, wasGrounded, dt, t);
  if (axis !== 0) s.facing = axis > 0 ? 'right' : 'left';

  // Ground support is checked after horizontal movement, so walking off an
  // edge starts falling this tick rather than hovering for a frame.
  if (s.grounded) {
    const support = platforms.find((p) => p.id === s.platformId);
    if (!support || Math.abs(s.y - support.y) > 0.001 || !overlaps(s.x, support)) {
      s.grounded = false;
      s.platformId = null;
    }
  }
  if (
    (s.jumpBufferMsLeft > 0 && (s.grounded || s.coyoteMsLeft > 0)) ||
    (input.autoHop && s.grounded)
  )
    jump(s, t);
  if (!s.grounded) {
    s.vy = Math.min(t.maxFallSpeed, s.vy + t.gravity * dt);
    const proposedY = s.y + s.vy * dt;
    let contact = null,
      earliest = Infinity;
    if (s.vy >= 0 && proposedY >= previousY)
      for (const platform of platforms) {
        if (previousY > platform.y + 0.000001 || proposedY < platform.y) continue;
        // Leaving a support at fraction zero is not a new landing on its edge.
        if (Math.abs(previousY - platform.y) < 0.000001 && !overlaps(s.x, platform)) continue;
        const fraction =
          proposedY === previousY ? 0 : (platform.y - previousY) / (proposedY - previousY);
        const impactX = previousX + (s.x - previousX) * fraction;
        if (fraction >= 0 && fraction <= 1 && fraction < earliest && overlaps(impactX, platform)) {
          contact = platform;
          earliest = fraction;
        }
      }
    if (contact) {
      s.y = contact.y;
      s.landSpeed = s.vy;
      s.vy = 0;
      s.grounded = true;
      s.platformId = contact.id;
      s.landed = true;
      s.coyoteMsLeft = t.coyoteMs;
      s.events.push('land');
      if (s.jumpBufferMsLeft > 0 || input.autoHop) jump(s, t);
      else if (!overlaps(s.x, contact)) {
        s.grounded = false;
        s.platformId = null;
      }
    } else s.y = proposedY;
  } else s.vy = 0;
  s.motion = motion(s, axis);
  return s;
}

import { sampleAirFeet } from './flight-pose.js';

/** Puff's approved 56×48 drawing, articulated for a seekable local review lab. */
export const PUFF_BOUNDS = Object.freeze({ width: 56, height: 48 });
export const PUFF_PIVOT = Object.freeze({ x: 28, y: 40 });
// Stable simulation bounds; artwork squash, feet and helmet do not change them.
export const PUFF_COLLISION = Object.freeze({ x: 15, y: 21, width: 27, height: 19 });
const define = (id, label, group, durationMs, fps, loop, description) =>
  Object.freeze({ id, label, group, durationMs, fps, loop, description });
export const ANIMATIONS = Object.freeze([
  define(
    'idle',
    'Idle + blink',
    'Personality',
    4000,
    12,
    true,
    'A slow breath and one quiet blink. Feet stay planted.',
  ),
  define(
    'look',
    'Look around',
    'Personality',
    2800,
    12,
    false,
    'The eyes lead a curious glance, then return to you.',
  ),
  define(
    'hello',
    'Little hello',
    'Personality',
    1800,
    16,
    false,
    'A small lift and two tiny, body-connected waves.',
  ),
  define(
    'walk',
    'Walk',
    'Ground',
    800,
    16,
    true,
    'Alternating planted and lifted feet, with a small body bob.',
  ),
  define(
    'run',
    'Run',
    'Ground',
    560,
    20,
    true,
    'Quick tucked steps with a planted push, soft compression and a springy recovery.',
  ),
  define(
    'turn',
    'Sway',
    'Personality',
    1800,
    20,
    true,
    'A gentle front-facing sway inside the bubble, with the lower body softly anchored.',
  ),
  define(
    'brake',
    'Brake',
    'Ground',
    650,
    20,
    false,
    'A planted stance absorbs forward momentum, then quietly settles.',
  ),
  define(
    'jump',
    'Jump arc',
    'Air',
    1500,
    20,
    false,
    'Crouch, launch, tuck at the apex, fall, then land.',
  ),
  define('fall', 'Fall', 'Air', 900, 16, true, 'Feet and arms spread slightly while Puff falls.'),
  define(
    'soft-land',
    'Soft landing',
    'Landing',
    600,
    20,
    false,
    'A modest body squash and quiet recovery inside a rigid helmet.',
  ),
  define(
    'hard-land',
    'Hard landing',
    'Landing',
    900,
    20,
    false,
    'A stronger squash, staggered feet, blink and two settling beats.',
  ),
  define(
    'bounce',
    'Bounce',
    'Landing',
    1000,
    20,
    true,
    'Compression launches the next bounce; feet tuck then extend.',
  ),
  define(
    'hit',
    'Hit + tumble',
    'Recovery',
    1400,
    20,
    false,
    'Travel backward, roll around the body center and settle into a defeated pose.',
  ),
  define(
    'respawn',
    'Respawn',
    'Recovery',
    1200,
    20,
    false,
    'Reappear with a small stretch, a blink and a steady landing.',
  ),
  define(
    'celebrate',
    'Collect + celebrate',
    'Reward',
    1700,
    20,
    false,
    'Two small hops, a lifted arm and a pair of little stars.',
  ),
  define(
    'boost',
    'Boost',
    'Reward',
    1200,
    20,
    false,
    'Anticipation, an upward burst and a small warm rocket trail.',
  ),
]);
const byId = new Map(ANIMATIONS.map((a) => [a.id, a]));
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const ease = (t) => t * t * (3 - 2 * t);
const mix = (a, b, t) => a + (b - a) * t;
// Sparse keyframes are interpreted at query time. No timers, DOM or frame cache.
function track(u, keys) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++)
    if (u <= keys[i][0]) {
      const [a, x] = keys[i - 1],
        [b, y] = keys[i];
      return mix(x, y, ease((u - a) / (b - a)));
    }
  return keys.at(-1)[1];
}
const pulse = (u, a, b) => (u > a && u < b ? Math.sin(((u - a) / (b - a)) * Math.PI) : 0);
export function samplePose(id = 'idle', timeMs = 0, { direction = 'right' } = {}) {
  const animation = byId.get(id) || byId.get('idle');
  const t = Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0;
  const u = animation.loop
    ? (t % animation.durationMs) / animation.durationMs
    : clamp(t / animation.durationMs);
  const phase = u * TAU;
  const p = {
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    bodyScaleX: 1,
    bodyScaleY: 1,
    leftFootX: 0,
    leftFootY: 0,
    leftFootRotation: 0,
    rightFootX: 0,
    rightFootY: 0,
    rightFootRotation: 0,
    leftArm: 0,
    rightArm: 0,
    lookX: 0,
    lookY: 0,
    eyeHeight: 2,
    opacity: 1,
    turnScale: 1,
    starAmount: 0,
    direction: direction === 'left' ? -1 : 1,
    progress: u,
  };
  const T = (keys) => track(u, keys);
  switch (animation.id) {
    case 'idle': {
      const breath = (1 - Math.cos(phase)) * 0.5;
      p.bodyScaleY = 1 + breath * 0.016;
      p.bodyScaleX = 1 - breath * 0.005;
      p.eyeHeight = u > 0.69 && u < 0.735 ? 1 : 2;
      break;
    }
    case 'look':
      p.lookX = T([
        [0, 0],
        [0.2, -1.5],
        [0.4, -1.5],
        [0.62, 1.5],
        [0.8, 1.5],
        [1, 0],
      ]);
      p.rotation = p.lookX * 0.7;
      p.lookY = -pulse(u, 0.4, 0.9) * 0.4;
      break;
    case 'hello':
      p.offsetY = -pulse(u, 0.05, 0.95) * 0.8;
      p.rotation = -pulse(u, 0.05, 0.95) * 2;
      p.rightArm = T([
        [0, 0],
        [0.16, 1],
        [0.3, 0.55],
        [0.43, 1],
        [0.56, 0.55],
        [0.7, 1],
        [0.95, 0],
        [1, 0],
      ]);
      p.lookX = pulse(u, 0.1, 0.9) * 0.6;
      break;
    case 'walk': {
      const gait = Math.sin(phase),
        amplitude = 0.75;
      // One foot always supports Puff. Feet stay joined to the lower body.
      p.leftFootX = gait * amplitude;
      p.rightFootX = -gait * amplitude;
      p.leftFootY = -Math.max(0, gait) * 0.5;
      p.rightFootY = -Math.max(0, -gait) * 0.5;
      p.offsetX = gait * 0.3;
      p.offsetY = -(1 - Math.cos(phase * 2)) * 0.12;
      p.rotation = 0.7 + gait * 0.3;
      p.lookX = 0.35;
      // No arm swing: Puff is a pebble with tiny feet, not a humanoid rig.
      break;
    }
    case 'run': {
      // A longer supporting stroke and quick tucked recovery replace the
      // metronomic sine gait. Each foot overlaps the other's planted stance.
      const footPhase = (q) => ({
        x: track(q, [
          [0, 1.2],
          [0.62, -1.2],
          [0.7, -1.2],
          [0.94, 1.2],
          [1, 1.2],
        ]),
        y: track(q, [
          [0, 0],
          [0.62, 0],
          [0.75, -1.5],
          [0.86, -1.15],
          [1, 0],
        ]),
      });
      const left = footPhase(u),
        right = footPhase((u + 0.5) % 1),
        step = (u * 2) % 1;
      p.leftFootX = left.x;
      p.leftFootY = left.y;
      p.rightFootX = right.x;
      p.rightFootY = right.y;
      // Weight arrives just after contact; the soft body rebounds a beat later.
      p.bodyScaleY = track(step, [
        [0, 1],
        [0.17, 0.97],
        [0.55, 1.015],
        [1, 1],
      ]);
      p.bodyScaleX = 1 + (1 - p.bodyScaleY) * 0.55;
      p.offsetY = track(step, [
        [0, 0],
        [0.17, 0.12],
        [0.56, -0.65],
        [1, 0],
      ]);
      p.offsetX = 0.4 * Math.sin(phase - 0.25);
      p.rotation = 2.6 + 0.45 * Math.sin(phase - 0.4);
      p.lookX = 0.8;
      break;
    }
    case 'turn':
      // Review slot retained, but this is a front-facing anchored sway.
      p.sway = Math.sin(phase);
      p.lookX = p.sway * 0.1;
      break;
    case 'brake':
      // One deceleration into a planted stance, then one quiet recovery.
      p.rotation = T([
        [0, 3],
        [0.26, -2],
        [0.68, -0.7],
        [1, 0],
      ]);
      p.offsetX = T([
        [0, -2.5],
        [0.26, -0.6],
        [0.68, -0.05],
        [1, 0],
      ]);
      p.leftFootX = T([
        [0, -0.5],
        [0.26, -0.7],
        [0.68, -0.25],
        [1, 0],
      ]);
      p.rightFootX = T([
        [0, 0.8],
        [0.26, 1.1],
        [0.68, 0.35],
        [1, 0],
      ]);
      p.bodyScaleY = T([
        [0, 1],
        [0.26, 0.97],
        [0.68, 0.99],
        [1, 1],
      ]);
      p.bodyScaleX = 1 + (1 - p.bodyScaleY) * 0.5;
      p.lookX = 1 - u;
      break;
    case 'jump':
      p.offsetY = T([
        [0, 0],
        [0.12, 0],
        [0.38, -13],
        [0.53, -16],
        [0.64, -14],
        [0.84, 0],
        [1, 0],
      ]);
      p.bodyScaleY = T([
        [0, 1],
        [0.12, 0.91],
        [0.22, 1.04],
        [0.52, 1],
        [0.84, 0.93],
        [1, 1],
      ]);
      p.bodyScaleX = T([
        [0, 1],
        [0.12, 1.06],
        [0.22, 0.98],
        [0.52, 1],
        [0.84, 1.04],
        [1, 1],
      ]);
      p.leftFootY = -pulse(u, 0.17, 0.79) * 1.2;
      p.rightFootY = -pulse(u, 0.19, 0.81) * 1.2;
      p.leftArm = p.rightArm = pulse(u, 0.18, 0.8) * 0.45;
      p.lookY = -pulse(u, 0.15, 0.75);
      p.rotation = T([
        [0, 0],
        [0.35, -3],
        [0.7, 2],
        [1, 0],
      ]);
      break;
    case 'fall':
      p.offsetY = Math.sin(phase) * 0.4;
      p.rotation = Math.sin(phase) * 2;
      p.leftFootY = p.rightFootY = -1.2;
      p.leftArm = 0.4 + Math.sin(phase) * 0.07;
      p.rightArm = 0.4 - Math.sin(phase) * 0.07;
      p.lookY = 1;
      break;
    case 'soft-land':
    case 'hard-land': {
      const hard = animation.id === 'hard-land';
      const squash = T([
        [0, 0],
        [hard ? 0.15 : 0.22, 1],
        [0.48, -0.22],
        [0.7, 0.12],
        [1, 0],
      ]);
      p.bodyScaleY = 1 - squash * (hard ? 0.11 : 0.06);
      p.bodyScaleX = 1 + squash * (hard ? 0.075 : 0.04);
      p.leftFootX = -Math.max(0, squash) * (hard ? 1.5 : 0.7);
      p.rightFootX = -p.leftFootX;
      p.rotation = hard
        ? T([
            [0, 4],
            [0.2, -3],
            [0.55, 1],
            [1, 0],
          ])
        : 0;
      p.eyeHeight = hard && u > 0.1 && u < 0.32 ? 1 : 2;
      p.rightArm = hard ? Math.max(0, squash) * 0.25 : 0;
      break;
    }
    case 'bounce':
      p.offsetY = T([
        [0, 0],
        [0.13, 0],
        [0.4, -11],
        [0.55, -13],
        [0.86, 0],
        [1, 0],
      ]);
      p.bodyScaleY = T([
        [0, 1],
        [0.13, 0.9],
        [0.27, 1.04],
        [0.6, 1],
        [0.86, 0.92],
        [1, 1],
      ]);
      p.bodyScaleX = 1 + (1 - p.bodyScaleY) * 0.6;
      p.leftFootY = p.rightFootY = -pulse(u, 0.18, 0.8) * 2;
      p.leftArm = p.rightArm = pulse(u, 0.2, 0.75) * 0.3;
      break;
    case 'hit':
      // Recoil travels through space, with roll around the body mass center.
      p.offsetX = T([
        [0, 0],
        [0.2, -5],
        [0.5, -8],
        [0.8, -9],
        [1, -9],
      ]);
      p.offsetY = T([
        [0, 0],
        [0.25, -5],
        [0.55, -3],
        [0.8, 0],
        [1, 0],
      ]);
      p.rotation = T([
        [0, 0],
        [0.2, -18],
        [0.55, -48],
        [0.8, -70],
        [1, -70],
      ]);
      p.leftFootRotation = pulse(u, 0.1, 0.75) * 8;
      p.rightFootRotation = -p.leftFootRotation;
      p.leftArm = p.rightArm = pulse(u, 0.05, 0.85) * 0.2;
      p.eyeHeight = u > 0.08 && u < 0.45 ? 1 : 2;
      p.lookY = u > 0.7 ? 1 : 0;
      // Once the helmet becomes the contact surface, rest its transformed
      // lower-left rim on the same floor as the feet (one-pixel stroke included).
      {
        const r = (p.rotation * Math.PI) / 180;
        const rimBottom =
          27 -
          18.5 * Math.sin(r) +
          4.5 * Math.cos(r) +
          0.5 * (Math.abs(Math.sin(r)) + Math.abs(Math.cos(r)));
        p.offsetY = Math.min(p.offsetY, 40 - rimBottom);
      }
      break;
    case 'respawn':
      p.opacity = T([
        [0, 0],
        [0.12, 0],
        [0.35, 1],
        [1, 1],
      ]);
      p.offsetY = T([
        [0, -7],
        [0.2, -7],
        [0.65, 0],
        [1, 0],
      ]);
      p.bodyScaleY = T([
        [0, 0.97],
        [0.35, 1.06],
        [0.65, 0.94],
        [1, 1],
      ]);
      p.bodyScaleX = 1 + (1 - p.bodyScaleY) * 0.5;
      p.eyeHeight = u > 0.55 && u < 0.68 ? 1 : 2;
      p.leftArm = p.rightArm = pulse(u, 0.1, 0.65) * 0.45;
      break;
    case 'celebrate':
      p.offsetY = T([
        [0, 0],
        [0.1, 0],
        [0.24, -5],
        [0.4, 0],
        [0.57, -7],
        [0.77, 0],
        [1, 0],
      ]);
      p.bodyScaleY = T([
        [0, 1],
        [0.1, 0.95],
        [0.24, 1],
        [0.4, 0.95],
        [0.57, 1],
        [0.77, 0.95],
        [1, 1],
      ]);
      p.rotation = T([
        [0, 0],
        [0.24, -4],
        [0.4, 0],
        [0.57, 4],
        [1, 0],
      ]);
      p.rightArm = pulse(u, 0.08, 0.92);
      p.leftFootY = -pulse(u, 0.15, 0.72) * 1.5;
      p.starAmount = pulse(u, 0.08, 0.9);
      break;
    case 'boost':
      p.offsetY = T([
        [0, 0],
        [0.18, 0],
        [0.45, -13],
        [0.7, -17],
        [1, -18],
      ]);
      p.bodyScaleY = T([
        [0, 1],
        [0.18, 0.91],
        [0.4, 1.06],
        [0.7, 1],
        [1, 1],
      ]);
      p.bodyScaleX = 1 + (1 - p.bodyScaleY) * 0.5;
      p.leftFootRotation = T([
        [0, 0],
        [0.45, 18],
        [1, 18],
      ]);
      p.rightFootRotation = -p.leftFootRotation;
      p.leftArm = p.rightArm = T([
        [0, 0],
        [0.18, 0.2],
        [0.45, 0.5],
        [1, 0.3],
      ]);
      p.lookY = -u;
      p.starAmount = pulse(u, 0.22, 0.9);
      p.thrust = T([
        [0, 0],
        [0.18, 0],
        [0.28, 1],
        [0.7, 0.8],
        [1, 0.55],
      ]);
      break;
  }
  return p;
}
const COLORS = {
  cream: '#eee5d2',
  shade: '#d3c8b3',
  eye: '#282723',
  helmet: '#c9c5b9',
  glint: '#f7efd9',
  star: '#e9be76',
};
const BODY = [
  [23, 20],
  [30, 20],
  [30, 21],
  [33, 21],
  [33, 23],
  [36, 23],
  [36, 25],
  [38, 25],
  [38, 27],
  [39, 27],
  [39, 33],
  [37, 33],
  [37, 36],
  [33, 36],
  [33, 37],
  [18, 37],
  [18, 36],
  [14, 36],
  [14, 34],
  [11, 34],
  [11, 29],
  [12, 29],
  [12, 26],
  [15, 26],
  [15, 24],
  [19, 24],
  [19, 22],
  [23, 22],
];
const SHADE = [
  [13, 33],
  [16, 34],
  [20, 35],
  [32, 35],
  [36, 33],
  [37, 33],
  [37, 36],
  [33, 36],
  [33, 37],
  [18, 37],
  [18, 36],
  [14, 36],
  [14, 34],
  [13, 34],
];
const HELMET = [
  [7, 28],
  [7, 20],
  [8, 20],
  [8, 16],
  [10, 16],
  [10, 13],
  [13, 13],
  [13, 11],
  [17, 11],
  [17, 9],
  [23, 9],
  [23, 8],
  [34, 8],
  [34, 9],
  [38, 9],
  [38, 11],
  [41, 11],
  [41, 14],
  [43, 14],
  [43, 18],
  [44, 18],
  [44, 28],
  [43, 28],
  [43, 31],
  [41, 31],
  [41, 33],
];
const RIM = [
  [7, 27],
  [7, 31],
  [9, 31],
  [9, 33],
  [13, 33],
  [13, 34],
  [18, 34],
  [18, 35],
  [32, 35],
  [32, 34],
  [38, 34],
  [38, 33],
  [41, 33],
  [41, 31],
  [43, 31],
  [43, 28],
];
const GLINT = [
  [34, 12],
  [37, 12],
  [37, 13],
  [39, 13],
  [39, 16],
  [36, 16],
  [36, 13],
  [34, 13],
];
// Scanline fill preserves crisp unit pixels without allocating canvases or images.
function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  const low = Math.floor(Math.min(...points.map((p) => p[1]))),
    high = Math.ceil(Math.max(...points.map((p) => p[1])));
  for (let y = low; y < high; y++) {
    const scan = y + 0.5,
      hits = [];
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[j],
        [bx, by] = points[i];
      if ((ay <= scan && by > scan) || (by <= scan && ay > scan))
        hits.push(ax + ((scan - ay) * (bx - ax)) / (by - ay));
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i + 1 < hits.length; i += 2) {
      const left = Math.ceil(hits[i] - 0.5),
        right = Math.ceil(hits[i + 1] - 0.5);
      ctx.fillRect(left, y, right - left, 1);
    }
  }
}
function line(ctx, points, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x + 0.5, y + 0.5) : ctx.moveTo(x + 0.5, y + 0.5)));
  ctx.stroke();
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function foot(ctx, x, dx, dy, rotation) {
  ctx.save();
  ctx.translate(x + 2.5 + dx, 35 + dy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-2.5, -35);
  polygon(
    ctx,
    [
      [0, 35],
      [5, 35],
      [5, 39],
      [4, 40],
      [1, 40],
      [0, 39],
    ],
    COLORS.cream,
  );
  rect(ctx, 1, 39, 3, 1, COLORS.shade);
  ctx.restore();
}
function arm(ctx, right, amount) {
  if (amount <= 0.01) return;
  ctx.save();
  ctx.translate(right ? 37 : 13, 31);
  ctx.rotate(((right ? -1 : 1) * (20 + amount * 65) * Math.PI) / 180);
  polygon(
    ctx,
    right
      ? [
          [0, -2],
          [4, -2],
          [4, -4],
          [6, -4],
          [6, 0],
          [4, 2],
          [0, 2],
        ]
      : [
          [0, -2],
          [-4, -2],
          [-4, -4],
          [-6, -4],
          [-6, 0],
          [-4, 2],
          [0, 2],
        ],
    COLORS.cream,
  );
  ctx.restore();
}
function star(ctx, x, y, amount) {
  if (amount < 0.1) return;
  ctx.globalAlpha *= Math.min(1, amount * 1.5);
  rect(ctx, x - 1, y, 3, 1, COLORS.star);
  rect(ctx, x, y - 1, 1, 3, COLORS.star);
}
/** Draw in transparent 56×48 source coordinates. Airborne motion may extend above that box. */
function renderApprovedPuff(
  ctx,
  {
    animation = 'idle',
    timeMs = 0,
    x = 0,
    y = 0,
    scale = 4,
    direction = 'right',
    overlays = false,
  } = {},
) {
  const p = samplePose(animation, timeMs, { direction });
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.globalAlpha *= p.opacity;
  ctx.translate(PUFF_PIVOT.x + p.offsetX, PUFF_PIVOT.y + p.offsetY);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(p.direction * p.turnScale, 1);
  ctx.translate(-26, -40);
  // The body gently deforms within the independently rigid helmet.
  ctx.save();
  ctx.translate(26, 37);
  ctx.scale(p.bodyScaleX, p.bodyScaleY);
  ctx.translate(-26, -37);
  polygon(ctx, BODY, COLORS.cream);
  polygon(ctx, SHADE, COLORS.shade);
  rect(ctx, 19 + p.lookX, 28 + p.lookY, 2, p.eyeHeight, COLORS.eye);
  rect(ctx, 29 + p.lookX, 28 + p.lookY, 2, p.eyeHeight, COLORS.eye);
  ctx.restore();
  foot(ctx, 17, p.leftFootX, p.leftFootY, p.leftFootRotation);
  foot(ctx, 30, p.rightFootX, p.rightFootY, p.rightFootRotation);
  arm(ctx, false, p.leftArm);
  arm(ctx, true, p.rightArm);
  line(ctx, HELMET, COLORS.helmet);
  line(ctx, RIM, COLORS.shade);
  helmetReflection(ctx, p.direction, polygon);
  ctx.restore();
  ctx.save();
  star(ctx, 3, 27, p.starAmount);
  ctx.restore();
  ctx.save();
  star(ctx, 52, 15, p.starAmount * 0.9);
  ctx.restore();
  if (overlays) {
    ctx.strokeStyle = '#91c7e8';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(0.2, 0.2, 55.6, 47.6);
    ctx.strokeStyle = '#e9be76';
    ctx.strokeRect(PUFF_COLLISION.x, PUFF_COLLISION.y, PUFF_COLLISION.width, PUFF_COLLISION.height);
    rect(ctx, PUFF_PIVOT.x - 2, PUFF_PIVOT.y, 5, 1, '#e78383');
    rect(ctx, PUFF_PIVOT.x, PUFF_PIVOT.y - 2, 1, 5, '#e78383');
  }
  ctx.restore();
  return p;
}

// Fill each revised silhouette once: individually transformed scanlines produce
// alpha seams along their shared boundaries when the rig is rotated.
function solidPolygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
function solidFoot(ctx, x, dx, dy, rotation) {
  ctx.save();
  ctx.translate(x + 2.5 + dx, 35 + dy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-2.5, -35);
  solidPolygon(
    ctx,
    [
      [0, 35],
      [5, 35],
      [5, 39],
      [4, 40],
      [1, 40],
      [0, 39],
    ],
    COLORS.cream,
  );
  rect(ctx, 1, 39, 3, 1, COLORS.shade);
  ctx.restore();
}
const APPROVED = new Set(['idle', 'look', 'respawn', 'soft-land']);
const GROUNDED = new Set(['walk', 'run', 'brake']);
// The base penetrates the body at y30..34 on every frame. No limb pivot can
// rotate the connecting pixels out of the cream silhouette.
function connectedNub(ctx, right, amount) {
  if (amount <= 0.01) return;
  const lift = Math.round(clamp(amount) * 3),
    reach = amount > 0.65 ? 3 : 2;
  const points = right
    ? [
        [36, 30],
        [39, 30],
        [39, 29 - lift],
        [39 + reach, 29 - lift],
        [39 + reach, 32 - lift],
        [39, 34],
        [36, 34],
      ]
    : [
        [14, 30],
        [11, 30],
        [11, 29 - lift],
        [11 - reach, 29 - lift],
        [11 - reach, 32 - lift],
        [11, 34],
        [14, 34],
      ];
  solidPolygon(ctx, points, COLORS.cream);
}
function rocketTrail(ctx, p) {
  if (!p.thrust) return;
  const strength = p.thrust,
    frame = Math.floor(p.progress * 24);
  // Warm exhaust under both feet, attached to the moving rig rather than stage.
  for (const x of [20, 33]) {
    const length = 3 + Math.round(strength * 3) + (frame % 2);
    rect(ctx, x - 1, 40, 3, length, '#d99759');
    rect(ctx, x, 40, 1, Math.max(2, length - 2), '#f7efd9');
    rect(ctx, x, 40 + length, 1, 1, '#e9be76');
  }
  for (let i = 0; i < 4; i++) {
    const age = ((frame + i * 7) % 17) / 17;
    const px = 25 + (i % 2 ? 1 : -1) * (3 + age * 5);
    const py = 45 + age * 10;
    ctx.save();
    ctx.globalAlpha *= strength * (1 - age) * 0.75;
    rect(ctx, px, py, 1, 1, i % 2 ? '#d99759' : '#e9be76');
    ctx.restore();
  }
}
function revisedBody(ctx, p) {
  ctx.save();
  ctx.translate(26, 37);
  ctx.scale(p.bodyScaleX, p.bodyScaleY);
  ctx.translate(-26, -37);
  connectedNub(ctx, false, p.leftArm);
  connectedNub(ctx, true, p.rightArm);
  solidPolygon(ctx, BODY, COLORS.cream);
  solidPolygon(ctx, SHADE, COLORS.shade);
  rect(ctx, 19 + p.lookX, 28 + p.lookY, 2, p.eyeHeight, COLORS.eye);
  rect(ctx, 29 + p.lookX, 28 + p.lookY, 2, p.eyeHeight, COLORS.eye);
  ctx.restore();
}
function helmetReflection(ctx, direction, fill = solidPolygon) {
  // Cancel facing only for the glass reflection, retaining the helmet's pose.
  if (direction < 0) {
    ctx.save();
    ctx.translate(52, 0);
    ctx.scale(-1, 1);
  }
  fill(ctx, GLINT, COLORS.glint);
  rect(ctx, 40, 19, 1, 1, COLORS.glint);
  if (direction < 0) ctx.restore();
}
function rigidHelmet(ctx, direction) {
  line(ctx, HELMET, COLORS.helmet);
  line(ctx, RIM, COLORS.shade);
  helmetReflection(ctx, direction);
}
/** Updated draft. Approved clips intentionally retain their exact renderer. */
export function renderPuff(ctx, options = {}) {
  const {
    animation = 'idle',
    timeMs = 0,
    x = 0,
    y = 0,
    scale = 4,
    direction = 'right',
    overlays = false,
    flight = null,
  } = options;
  if (APPROVED.has(animation) || !byId.has(animation)) return renderApprovedPuff(ctx, options);
  if (animation === 'turn') return renderSway(ctx, options);
  const p = samplePose(animation, timeMs, { direction });
  if (flight && (animation === 'jump' || animation === 'fall'))
    Object.assign(p, sampleAirFeet(flight, p.direction));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.globalAlpha *= p.opacity;
  const grounded = GROUNDED.has(animation),
    pivotY = animation === 'hit' ? 27 : 40;
  ctx.translate(PUFF_PIVOT.x + (grounded ? 0 : p.offsetX), pivotY + (grounded ? 0 : p.offsetY));
  ctx.rotate(((grounded ? 0 : p.rotation) * Math.PI) / 180);
  ctx.scale(p.direction * p.turnScale, 1);
  ctx.translate(-26, -pivotY);
  if (grounded) {
    // Keep supporting feet on the floor while the body/helmet carry weight.
    solidFoot(ctx, 17, p.leftFootX, p.leftFootY, 0);
    solidFoot(ctx, 30, p.rightFootX, p.rightFootY, 0);
    ctx.save();
    ctx.translate(26 + p.offsetX, 30 + p.offsetY);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.translate(-26, -30);
    revisedBody(ctx, p);
    rigidHelmet(ctx, p.direction);
    ctx.restore();
  } else {
    revisedBody(ctx, p);
    solidFoot(ctx, 17, p.leftFootX, p.leftFootY, p.leftFootRotation);
    solidFoot(ctx, 30, p.rightFootX, p.rightFootY, p.rightFootRotation);
    rigidHelmet(ctx, p.direction);
    if (animation === 'boost') rocketTrail(ctx, p);
  }
  ctx.restore();
  ctx.save();
  star(ctx, 3, 27, p.starAmount);
  ctx.restore();
  ctx.save();
  star(ctx, 52, 15, p.starAmount * 0.9);
  ctx.restore();
  if (overlays) {
    ctx.strokeStyle = '#91c7e8';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(0.2, 0.2, 55.6, 47.6);
    ctx.strokeStyle = '#e9be76';
    ctx.strokeRect(PUFF_COLLISION.x, PUFF_COLLISION.y, PUFF_COLLISION.width, PUFF_COLLISION.height);
    rect(ctx, PUFF_PIVOT.x - 2, PUFF_PIVOT.y, 5, 1, '#e78383');
    rect(ctx, PUFF_PIVOT.x, PUFF_PIVOT.y - 2, 1, 5, '#e78383');
  }
  ctx.restore();
  return p;
}

function renderSway(
  ctx,
  { timeMs = 0, x = 0, y = 0, scale = 4, direction = 'right', overlays = false } = {},
) {
  const p = samplePose('turn', timeMs, { direction });
  // Only the upper pebble rocks. Every body vertex at/below y33, all underside
  // shade, feet and helmet retain their canonical coordinates on every frame.
  const shift = (py) => p.sway * 1.2 * clamp((33 - py) / 13);
  const upper = (points) => points.map(([px, py]) => [px + shift(py), py]);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.translate(28, 0);
  ctx.scale(p.direction, 1);
  ctx.translate(-26, 0);
  solidFoot(ctx, 17, 0, 0, 0);
  solidFoot(ctx, 30, 0, 0, 0);
  solidPolygon(ctx, upper(BODY), COLORS.cream);
  solidPolygon(ctx, SHADE, COLORS.shade);
  rect(ctx, 19 + shift(28) + p.lookX, 28, 2, 2, COLORS.eye);
  rect(ctx, 29 + shift(28) + p.lookX, 28, 2, 2, COLORS.eye);
  rigidHelmet(ctx, p.direction);
  ctx.restore();
  if (overlays) {
    ctx.strokeStyle = '#91c7e8';
    ctx.lineWidth = 0.4;
    ctx.strokeRect(0.2, 0.2, 55.6, 47.6);
    ctx.strokeStyle = '#e9be76';
    ctx.strokeRect(PUFF_COLLISION.x, PUFF_COLLISION.y, PUFF_COLLISION.width, PUFF_COLLISION.height);
    rect(ctx, PUFF_PIVOT.x - 2, PUFF_PIVOT.y, 5, 1, '#e78383');
    rect(ctx, PUFF_PIVOT.x, PUFF_PIVOT.y - 2, 1, 5, '#e78383');
  }
  ctx.restore();
  return p;
}

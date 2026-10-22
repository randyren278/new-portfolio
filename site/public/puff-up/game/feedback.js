import { WORLD } from './physics.js';
import {
  MODIFIERS,
  RESCUE_MS,
  ZONES,
  ZONE_METRES,
  ROCKET_IGNITE_MS,
  ROCKET_CUTOFF,
  ROCKET_METRES,
  rocketClimb,
} from './climb.js';

// Feedback drawn in world coordinates from run state and the frame's blended time `t` and
// camera, so it moves as smoothly as the scene and pauses with the game.
const zoneName = (index) => ZONES[Math.min(index, ZONES.length - 1)].name;
export const metresToY = (metres) => 575 - metres * 10;

/** A kicker: lavender ledge whose chevrons point the way it throws Puff. */
export function drawKicker(ctx, p, y) {
  const x = Math.round(p.x);
  ctx.fillStyle = '#5f5480';
  ctx.fillRect(x + 4, y + 4, p.width - 8, 7);
  ctx.fillStyle = '#b7a6d9';
  ctx.fillRect(x, y, p.width, 4);
  ctx.strokeStyle = '#d8ccf2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -1; i <= 1; i++) {
    const c = Math.round(x + p.width / 2 + i * 10);
    ctx.moveTo(c - 3 * p.push, y + 4);
    ctx.lineTo(c + 3 * p.push, y + 7.5);
    ctx.lineTo(c - 3 * p.push, y + 11);
  }
  ctx.stroke();
}

/** A spark hovering over a fork's lane: land there to hold the rising line. */
export function drawSpark(ctx, p, y, t, reduced) {
  const c = p.x + p.width / 2,
    r = reduced ? 5 : 4.5 + Math.sin(t / 140) * 1.2,
    top = y - 20;
  ctx.fillStyle = '#f3e3a6';
  ctx.beginPath();
  ctx.moveTo(c, top - r * 1.6);
  ctx.lineTo(c + r * 0.45, top - r * 0.45);
  ctx.lineTo(c + r * 1.6, top);
  ctx.lineTo(c + r * 0.45, top + r * 0.45);
  ctx.lineTo(c, top + r * 1.6);
  ctx.lineTo(c - r * 0.45, top + r * 0.45);
  ctx.lineTo(c - r * 1.6, top);
  ctx.lineTo(c - r * 0.45, top - r * 0.45);
  ctx.fill();
}

/** A crumbled ledge rebuilding: a faint outline that fills in as it returns. */
export function drawRebuild(ctx, repair, t, totalMs, cameraY) {
  const p = repair.platform,
    y = Math.round(p.y - cameraY),
    filled = Math.max(0, Math.min(1, 1 - (repair.readyAt - t) / totalMs));
  ctx.strokeStyle = 'rgba(200,149,104,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.strokeRect(Math.round(p.x) + 0.5, y + 0.5, p.width - 1, 4);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(200,149,104,0.3)';
  ctx.fillRect(Math.round(p.x), y, Math.round(p.width * filled), 4);
}

/** The first gate ledge of a zone names it underneath, like the launch pad: past the table, by
 * its modifier. */
export function drawGateLabel(ctx, p, y) {
  ctx.fillStyle = '#a5a69b';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${p.gate * ZONE_METRES}M · ${(MODIFIERS[p.modifier]?.name ?? zoneName(p.gate)).toUpperCase()}`,
    p.x + p.width / 2,
    y + 27,
  );
  ctx.textAlign = 'left';
}

/** A title card that fades in, holds and fades out. It sits below Puff, over ledges already
 * climbed, so it never hides what is coming. */
export const CALLOUT_Y = 455;
export function drawCallout(ctx, kicker, title, age, durationMs = 2400, y = CALLOUT_Y) {
  if (age < 0 || age > durationMs) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, age / 220, (durationMs - age) / 600);
  ctx.font = '26px Instrument,serif';
  const width = Math.max(ctx.measureText(title).width, kicker.length * 5.6) + 44;
  ctx.fillStyle = 'rgba(24,24,24,0.88)';
  ctx.beginPath();
  // roundRect is missing before Safari 16; a square card is better than a frozen frame.
  if (ctx.roundRect) ctx.roundRect(WORLD.width / 2 - width / 2, y - 26, width, 66, 14);
  else ctx.rect(WORLD.width / 2 - width / 2, y - 26, width, 66);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eee7d7';
  ctx.fillText(title, WORLD.width / 2, y + 28);
  ctx.fillStyle = '#a5a69b';
  ctx.font = '9px Plex,monospace';
  ctx.fillText(kicker, WORLD.width / 2, y - 6);
  ctx.restore();
}
/** Where a second card sits while a zone card shows. */
export const CALLOUT_LOW_Y = CALLOUT_Y + 80;
/** The rocket's card sits above Puff instead: he lights it where the card would sit, and the
 * plume fills everything below him. */
export const CALLOUT_HIGH_Y = 150;

const BANNER_MS = 2400;
/** Whether the zone card is up at time `t`. */
export const bannerShows = (banner, t) => !!banner && t >= banner.at && t <= banner.at + BANNER_MS;
/** Zone title card after landing on a gate; past the table it names the zone's modifier. */
export function drawBanner(ctx, banner, t) {
  if (banner)
    drawCallout(
      ctx,
      `ZONE ${banner.zone} · ${banner.zone * ZONE_METRES} M`,
      MODIFIERS[banner.modifier]?.name ?? zoneName(banner.zone),
      t - banner.at,
      BANNER_MS,
    );
}

/** Where the last best climb ended: a dashed gold line to climb toward. */
export function drawBest(ctx, best, cameraY) {
  if (best <= 0) return;
  const y = Math.round(metresToY(best) - cameraY);
  if (y < -10 || y > WORLD.height + 10) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(233,190,118,0.55)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);
  ctx.beginPath();
  // Start clear of the metre ruler's labels.
  ctx.moveTo(60, y + 0.5);
  ctx.lineTo(WORLD.width, y + 0.5);
  ctx.stroke();
  ctx.fillStyle = '#e9be76';
  ctx.textAlign = 'right';
  ctx.fillText(`BEST ${best}M`, WORLD.width - 10, y - 5);
  ctx.restore();
}

/** 0 while the rising line is far below Puff, rising to 1 as it reaches his feet. */
export function danger(hazardY, playerY) {
  return Math.max(0, Math.min(1, 1 - (hazardY - playerY) / 220));
}

/** While the line is below the view, a gauge above the bottom controls says how far below, and
 * in a surge whether it is rushing or holding. */
export function drawGauge(ctx, metres, y, surge = null) {
  ctx.fillStyle = '#d99177';
  ctx.textAlign = 'center';
  ctx.fillText(
    `▼ LINE ${metres} M BELOW${surge ? ` · ${surge.toUpperCase()}` : ''}`,
    WORLD.width / 2,
    y,
  );
  ctx.textAlign = 'left';
}

/** Short decaying camera shake from big moments only; none with reduced motion. The rocket
 * sways the view gently instead: building as it ignites, most as it is let go, a little while it
 * burns. */
const JOLTS = { spring: 3, kick: 2, break: 1.2, touchdown: 5 };
export function shake(effects, t, reduced, rocket = null) {
  if (reduced) return [0, 0];
  let x = 0,
    y = 0;
  if (rocket) {
    const age = t - rocket.at,
      release = age - ROCKET_IGNITE_MS,
      strength =
        release < 0
          ? 1.5 * ease(age / ROCKET_IGNITE_MS)
          : 1.5 * Math.max(0, 1 - release / 700) ** 2 + 0.5 * rocketThrust(rocket, age);
    x += Math.sin(age / 45) * strength;
    y += Math.cos(age / 37) * strength;
  }
  for (const e of effects) {
    const age = t - e.at,
      strength = JOLTS[e.type];
    if (!strength || age < 0 || age > 200) continue;
    const decay = (1 - age / 200) ** 2;
    x += Math.sin(age * 0.11 + e.x) * strength * decay;
    y += Math.cos(age * 0.13 + e.y) * strength * decay;
  }
  return [x, y];
}

/** A small puff of dust where Puff last landed, scaled by how hard he came down. */
export function drawDust(ctx, landing, t, cameraY) {
  if (!landing) return;
  const age = t - landing.at;
  if (age < 0 || age > 280) return;
  const fade = age / 280,
    spread = 6 + Math.min(1, landing.speed / 900) * 10;
  ctx.fillStyle = `rgba(214,203,180,${(1 - fade) * 0.5})`;
  for (let i = 0; i < 3; i++) {
    const reach = (i + 1) * spread * (0.4 + fade * 0.6),
      lift = Math.round(3 + i * 2 - (1 - fade) * 2 - fade * (4 + i * 2)),
      y = Math.round(landing.y - cameraY - lift);
    ctx.fillRect(Math.round(landing.x - 14 - reach), y, 2, 2);
    ctx.fillRect(Math.round(landing.x + 12 + reach), y, 2, 2);
  }
}

/** Squash on landing, scaled by impact: [scaleX, scaleY] about Puff's feet. */
export function squash(landing, t, reduced) {
  if (reduced || !landing) return [1, 1];
  const age = t - landing.at;
  if (age < 0 || age > 110) return [1, 1];
  const amount = Math.sin((age / 110) * Math.PI) * 0.13 * Math.min(1, landing.speed / 800);
  return [1 + amount, 1 - amount];
}

const ease = (u) => u * u * (3 - 2 * u);
/** Where the rescue UFO is at blended time `t`: once Puff has fallen out of view it swoops in,
 * hovers over him while the beam lifts him back into view and up to the ledge, then leaves up
 * and away. It stays above `floor`, the bottom of the clear view, while he is still below it.
 * Returns null outside the UFO's part of a rescue. */
export function ufoAt(rescue, t, puffX, puffY, cameraY, floor) {
  if (!rescue) return null;
  const p = (t - rescue.at - rescue.fallMs) / RESCUE_MS;
  if (p < 0 || p > 1) return null;
  const hover = (x, y) => ({ x, y: Math.min(y - 150, cameraY + floor - 70) }),
    from = hover(puffX, puffY),
    to = hover(rescue.to.x, rescue.to.y);
  if (p < 0.3) {
    const u = ease(p / 0.3);
    return {
      x: 700 + (from.x - 700) * u,
      y: cameraY - 80 + (from.y - cameraY + 80) * u,
      beam: p > 0.22,
    };
  }
  if (p < 0.85) return { ...hover(puffX, puffY), beam: true };
  const u = ease((p - 0.85) / 0.15);
  return { x: to.x + (-80 - to.x) * u, y: to.y + (cameraY - 80 - to.y) * u, beam: p < 0.88 };
}
/** The tractor beam, drawn behind Puff: a dithered column of 2 px cells on Puff's pixel grid,
 * shimmering upward, with gold motes rising through it. */
let checks = null;
export function drawBeam(ctx, ufo, puffX, puffY, cameraY, t) {
  if (!ufo?.beam) return;
  // Two 2 px checkerboards, one each way round; swapping them makes the beam shimmer.
  if (!checks)
    checks = [0, 2].map((offset) => {
      const tile = document.createElement('canvas');
      tile.width = tile.height = 4;
      const g = tile.getContext('2d');
      g.fillStyle = 'rgba(238,229,210,0.18)';
      g.fillRect(offset, 0, 2, 2);
      g.fillRect(2 - offset, 2, 2, 2);
      return ctx.createPattern(tile, 'repeat');
    });
  const top = Math.round((ufo.y - cameraY + 12) / 2) * 2,
    bottom = Math.round((puffY - cameraY + 6) / 2) * 2,
    inner = checks[Math.floor(t / 110) % 2];
  for (let y = top; y < bottom; y += 2) {
    const u = (y - top) / (bottom - top),
      half = Math.round((10 + 34 * u) / 2) * 2,
      cx = Math.round((ufo.x + (puffX - ufo.x) * u) / 2) * 2;
    ctx.fillStyle = inner;
    ctx.fillRect(cx - half + 2, y, half * 2 - 4, 2);
    ctx.fillStyle = 'rgba(238,229,210,0.4)';
    ctx.fillRect(cx - half, y, 2, 2);
    ctx.fillRect(cx + half - 2, y, 2, 2);
  }
  ctx.fillStyle = '#e9be76';
  for (let i = 0; i < 5; i++) {
    const u = (t / 700 + i / 5) % 1,
      y = bottom + (top - bottom) * u,
      x = puffX + (ufo.x - puffX) * u + Math.round(Math.sin(i * 2.3) * 8) * 2 * (1 - u);
    ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2);
  }
}

// The saucer is pixel art drawn like Puff: a 1× sprite on its own canvas, scaled 2× without
// smoothing. Local (32, 30) is the saucer's centre.
const inside = (x, y, cx, cy, rx, ry) =>
  ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
function oval(g, cx, cy, rx, ry, color, keep = () => true, rim = false) {
  const at = (x, y) => inside(x, y, cx, cy, rx, ry);
  g.fillStyle = color;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++)
      if (
        at(x, y) &&
        keep(x, y) &&
        (!rim || !(at(x - 1, y) && at(x + 1, y) && at(x, y - 1) && at(x, y + 1)))
      )
        g.fillRect(x, y, 1, 1);
}
// The beacon on the dome: a small gold star that twinkles brighter now and then. It is drawn in
// world cells rather than on the sprite so it centres on the dome, which sits between two pixels.
const BEACON = ['..#..', '.d#d.', '##o##', '.d#d.', '..#..'];
// Each look (eyes up or down, which light is lit) is painted once and kept.
const saucers = new Map();
function saucer(look, light) {
  const key = look * 3 + light;
  if (saucers.has(key)) return saucers.get(key);
  const sprite = document.createElement('canvas');
  sprite.width = 64;
  sprite.height = 48;
  const g = sprite.getContext('2d'),
    px = (x, y, color, w = 1, h = 1) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };
  // The friend, then the glass over it, then the hull over the glass's foot.
  oval(g, 32, 23.5, 6, 4.5, '#d3c8b3');
  oval(g, 32, 23, 6, 4, '#eee5d2');
  px(29, 22 + look, '#282723', 1, 2);
  px(34, 22 + look, '#282723', 1, 2);
  oval(g, 32, 26, 11, 11, '#c9c5b9', (x, y) => y <= 27, true);
  for (const [x, y] of [
    [36, 17],
    [37, 17],
    [38, 18],
    [39, 19],
    [39, 20],
    [40, 22],
  ])
    px(x, y, '#f7efd9');
  oval(g, 32, 30, 22, 5, '#ada28c');
  oval(g, 32, 30, 22, 5, '#d3c8b3', (x, y) => y <= 30);
  px(17, 30, '#eee5d2', 4, 1);
  for (let i = 0; i < 3; i++) px(23 + i * 8, 32, i === light ? '#f7efd9' : '#e9be76', 2, 1);
  saucers.set(key, sprite);
  return sprite;
}
/** The rescue saucer: Puff's kin. A small friend sits under the same helmet glass as Puff's
 * and looks down at him while the beam is on; three gold lights chase round the hull for the
 * three stars spent, and a star on the dome twinkles. */
export function drawUfo(ctx, ufo, cameraY, t) {
  if (!ufo) return;
  const x = Math.round(ufo.x),
    y = Math.round(ufo.y - cameraY);
  ctx.drawImage(saucer(ufo.beam ? 1 : 0, Math.floor(t / 180) % 3), x - 64, y - 60, 128, 96);
  const colors =
    t % 1200 < 160
      ? { '#': '#f7efd9', o: '#f7efd9', d: '#e9be76' }
      : { '#': '#e9be76', o: '#f7efd9', d: '#9c8457' };
  // Sprite row 15, the top of the dome, is 30 world px above the saucer's centre.
  BEACON.forEach((row, r) =>
    [...row].forEach((k, c) => {
      if (k === '.') return;
      ctx.fillStyle = colors[k];
      ctx.fillRect(x - 5 + c * 2, y - 40 + r * 2, 2, 2);
    }),
  );
}

// The rocket. Everything is drawn on Puff's 2 px grid from the rocket's timeline, so it pauses
// and blends with the rest of the scene.
const grid = (n) => Math.round(n / 2) * 2;
// A fixed scatter in [0, 1) for the `i`th spark, cloud or line.
const scatter = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** How hard the engine burns `age` ms after it lit: easing up to full while held down, then
 * easing out quickly at ROCKET_CUTOFF of the climb while Puff coasts on. */
export function rocketThrust(rocket, age) {
  if (age < ROCKET_IGNITE_MS) return 0.3 + 0.7 * ease(age / ROCKET_IGNITE_MS);
  const u = (age - ROCKET_IGNITE_MS) / rocket.climb;
  return ease(Math.max(0, Math.min(1, (ROCKET_CUTOFF + 0.06 - u) / 0.06)));
}
// The rocket's flame is painted at Puff's pixel size on its own canvas, a row at a time, then
// drawn at 2× without smoothing like his sprite: whole pixels, and no seams between rows.
const FLAME = { width: 48, height: 260 };
let flameCanvas = null;
// Colours down the flame, root to tip; each row blends the two stops either side of it.
const OUTER = [
    [0, [247, 239, 217]],
    [0.2, [233, 190, 118]],
    [0.5, [217, 151, 89]],
    [0.8, [217, 145, 119]],
    [1, [217, 145, 119]],
  ],
  INNER = [
    [0, [247, 239, 217]],
    [0.25, [247, 239, 217]],
    [1, [233, 190, 118]],
  ],
  // The igniter's green, which the flame fades from as the engine lights.
  LIGHTING = [
    [0, [238, 229, 210]],
    [1, [184, 197, 166]],
  ];
// The colour `s` of the way down `stops`, tinted `green` of the way to the igniter's.
function blend(stops, s, green = 0) {
  const at = (list) => {
      const i = Math.max(
          1,
          list.findIndex(([p]) => p >= s),
        ),
        [a, from] = list[i - 1],
        [b, to] = list[i],
        u = b > a ? Math.max(0, Math.min(1, (s - a) / (b - a))) : 1;
      return from.map((c, k) => c + (to[k] - c) * u);
    },
    tint = at(LIGHTING);
  return at(stops)
    .map((c, k) => Math.round(c + (tint[k] - c) * green))
    .join(',');
}
/** One flame `length` world px long hanging from (x, top), no lower than `end`: a teardrop as
 * wide as Puff's body where it leaves his helmet, swelling, then tapering to a tip that fades
 * into the smoke, with a hotter core inside it, its edges rippling slowly, and licks of flame
 * breaking off below. */
function drawFlame(ctx, x, top, end, length, t, green) {
  if (!flameCanvas) {
    flameCanvas = document.createElement('canvas');
    flameCanvas.width = FLAME.width;
    flameCanvas.height = FLAME.height;
  }
  const g = flameCanvas.getContext('2d'),
    count = Math.min(FLAME.height, Math.round(length / 2)),
    shown = Math.max(0, Math.min(FLAME.height, Math.floor((end - top) / 2))),
    mid = FLAME.width / 2;
  if (!shown) return;
  g.clearRect(0, 0, FLAME.width, FLAME.height);
  for (let r = 0; r < Math.min(count, shown); r++) {
    const s = r / count,
      ripple = 1 + 0.06 * Math.sin(s * 9 - t / 90) + 0.03 * Math.sin(s * 21 + t / 70),
      half = Math.round((12 + 6 * Math.min(1, s / 0.22)) * (1 - s) ** 0.9 * ripple),
      fade = s > 0.7 ? (1 - s) / 0.3 : 1;
    if (half < 1) continue;
    g.fillStyle = `rgba(${blend(OUTER, s, green)},${fade})`;
    g.fillRect(mid - half, r, half * 2, 1);
    const inner = Math.round(half * 0.55 * Math.sqrt(Math.max(0, 1 - s / 0.45)));
    if (inner >= 1) {
      g.fillStyle = `rgb(${blend(INNER, s / 0.45, green)})`;
      g.fillRect(mid - inner, r, inner * 2, 1);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = ((t + scatter(i + 60) * 700) % 700) / 700,
      r = Math.round(count * (0.75 + 0.2 * scatter(i + 61)) + a * 30);
    if (r >= shown) continue;
    g.fillStyle = `rgba(217,145,119,${(1 - a) * 0.8})`;
    g.fillRect(Math.round(mid + (scatter(i + 62) - 0.5) * 14), r, a < 0.5 ? 2 : 1, a < 0.5 ? 2 : 1);
  }
  ctx.drawImage(
    flameCanvas,
    0,
    0,
    FLAME.width,
    shown,
    x - FLAME.width,
    top,
    FLAME.width * 2,
    shown * 2,
  );
}
// A round puff of smoke in 2 px rows.
function cloud(ctx, x, y, r) {
  const cx = grid(x),
    cy = grid(y),
    shape = new Path2D();
  for (let dy = -grid(r); dy < r; dy += 2) {
    const half = grid(Math.sqrt(Math.max(0, r * r - (dy + 1) ** 2)));
    if (half) shape.rect(cx - half, cy + dy, half * 2, 2);
  }
  ctx.fill(shape);
}
// 2 px checkerboards of a colour, one each way round; swapping them makes the flame shimmer.
const dithers = new Map();
function dither(ctx, color, flip) {
  const key = color + flip;
  if (!dithers.has(key)) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 4;
    const g = tile.getContext('2d');
    g.fillStyle = color;
    g.fillRect(flip * 2, 0, 2, 2);
    g.fillRect(2 - flip * 2, 2, 2, 2);
    dithers.set(key, ctx.createPattern(tile, 'repeat'));
  }
  return dithers.get(key);
}
/** Speed lines while the rocket climbs fast, streaming down past the ledges. */
export function drawStreaks(ctx, rocket, vy, cameraY, view, reduced) {
  if (!rocket || reduced) return;
  const k = Math.max(0, Math.min(1, (-vy - 300) / 1000));
  if (!k) return;
  const span = view.bottom - view.top + 240;
  for (let i = 0; i < 18; i++) {
    const length = grid((50 + scatter(i + 20) * 110) * k),
      drift = scatter(i + 40) * span - cameraY * (1.3 + scatter(i + 60)),
      y = view.top - 120 + (((drift % span) + span) % span);
    ctx.fillStyle =
      i % 4 ? `rgba(238,231,215,${0.06 + 0.12 * k})` : `rgba(233,190,118,${0.1 + 0.18 * k})`;
    ctx.fillRect(grid(12 + scatter(i) * (WORLD.width - 24)), grid(y), 2, length);
  }
}
// How green the engine's light still is `age` ms after it lit, fading out as it comes up.
const greenAt = (age) => Math.max(0, 1 - age / 300);
/** The launch around Puff, after a Falcon 9's: the engine's light, green at first as its
 * igniter burns; the exhaust splashing along the ledge and rolling out as a bank of smoke as he
 * lifts off; the smoke trail it leaves and gold motes falling from it. Drawn behind Puff; his
 * flame is drawn over him (see drawRocketFlame). */
export function drawRocket(ctx, rocket, t, puffX, puffY, cameraY, view) {
  const age = t - rocket.at,
    thrust = rocketThrust(rocket, age),
    { from, to } = rocket,
    pad = from.y - cameraY,
    feet = puffY - cameraY,
    height = from.y - puffY,
    flip = Math.floor(t / 70) % 2;
  ctx.save();
  if (thrust > 0) {
    const glow = ctx.createRadialGradient(puffX, feet + 50, 0, puffX, feet + 50, 230),
      green = greenAt(age),
      light = [233, 190, 118].map((c, k) => Math.round(c + ([184, 197, 166][k] - c) * green));
    glow.addColorStop(0, `rgba(${light.join(',')},${0.2 * thrust + 0.2 * green})`);
    glow.addColorStop(1, 'rgba(233,190,118,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(puffX - 230, feet - 180, 460, 460);
  }
  // Smoke rolling out across the ledge from the moment it lights.
  const bank = age / 2800;
  if (bank < 1) {
    ctx.fillStyle = '#d3c8b3';
    for (let i = 0; i < 16; i++) {
      const reach = (20 + scatter(i + 11) * 180) * (1 - (1 - bank) ** 2.5),
        r = 5 + 20 * Math.sqrt(bank) * (0.5 + scatter(i + 31) * 0.7);
      ctx.globalAlpha = 0.55 * Math.min(1, age / 300) * (1 - bank);
      cloud(
        ctx,
        from.x + (i % 2 ? 1 : -1) * reach,
        pad - 4 - r * 0.5 - scatter(i + 23) * 30 * bank,
        r,
      );
    }
  }
  // While the plume still reaches the ledge it splashes along it, throwing sparks.
  const splash = thrust * Math.max(0, 1 - height / 320);
  if (splash > 0) {
    const reach = 24 + 90 * splash * Math.min(1, age / 500);
    ctx.globalAlpha = splash;
    ['#f7efd9', '#e9be76', '#d99759'].forEach((color, row) => {
      const half = grid(reach * (1 - row * 0.25));
      ctx.fillStyle = dither(ctx, color, (flip + row) % 2);
      ctx.fillRect(grid(from.x) - half, grid(pad - 2 - row * 2), half * 2, 2);
    });
    for (let i = 0; i < 16; i++) {
      const a = ((age + scatter(i) * 300) % 300) / 300;
      ctx.globalAlpha = splash * (1 - a);
      ctx.fillStyle = i % 3 ? '#e9be76' : '#f7efd9';
      ctx.fillRect(
        grid(from.x + (i % 2 ? 1 : -1) * (8 + a * (50 + scatter(i + 7) * 120))),
        grid(pad - 4 - a * (12 + scatter(i + 3) * 22) + a * a * 26),
        2,
        2,
      );
    }
  }
  // The smoke trail, where Puff passed while the engine burned: widening and thinning far below.
  const burned = rocketClimb(ROCKET_CUTOFF);
  ctx.fillStyle = '#d3c8b3';
  for (let k = 1, y = from.y - 18; y > puffY + 40; k++, y -= 18) {
    const below = y - puffY,
      screenY = y - cameraY,
      f = (from.y - y) / (from.y - to.y);
    if (f > burned || screenY < view.top - 40 || screenY > view.bottom + 40) continue;
    ctx.globalAlpha = 0.3 * Math.min(1, (burned - f) * 20) * Math.max(0, 1 - below / 900);
    cloud(
      ctx,
      from.x + (to.x - from.x) * f * f * (3 - 2 * f) + (scatter(k) - 0.5) * 16,
      screenY,
      8 + Math.min(20, below * 0.03) * (0.6 + scatter(k + 90) * 0.8),
    );
  }
  // Gold motes falling from the flame; the ledge stops them.
  const end = Math.min(view.bottom, pad - 2);
  if (thrust > 0.05) {
    for (let i = 0; i < 10; i++) {
      const a = ((t + scatter(i) * 600) % 600) / 600,
        y = grid(feet + 70 + a * 260);
      if (y >= end) continue;
      ctx.globalAlpha = thrust * (1 - a);
      ctx.fillStyle = i % 3 ? '#e9be76' : '#f7efd9';
      ctx.fillRect(grid(puffX + (scatter(i + 50) - 0.5) * (60 + a * 60)), y, 2, 2);
    }
  }
  ctx.restore();
}
/** The rocket's flame, drawn over Puff from the foot of his helmet down, so his feet are hidden
 * and he rides it like a capsule while the engine burns; they show again as it cuts out. A
 * higher rocket's runs longer. The ledge he lit it on stops it. */
export function drawRocketFlame(ctx, rocket, t, puffX, puffY, cameraY, view) {
  const age = t - rocket.at,
    thrust = rocketThrust(rocket, age);
  if (thrust <= 0.01) return;
  const { from, to } = rocket,
    power = Math.min(1.5, 0.75 + (0.25 * (from.y - to.y)) / (ROCKET_METRES * 10)),
    length = (140 + 130 * Math.min(1, (from.y - puffY) / 1200)) * thrust * power;
  ctx.save();
  ctx.globalAlpha = Math.min(1, age / 150, thrust / 0.3);
  // On Puff's own pixel grid, from the row under his helmet's rim, 4 of his pixels above his soles.
  drawFlame(
    ctx,
    Math.round(puffX),
    Math.round(puffY - cameraY) - 8,
    Math.min(view.bottom, from.y - cameraY - 2),
    length,
    t,
    greenAt(age),
  );
  ctx.restore();
}
/** The rocket's touchdown: a gold shockwave along the ledge and a fountain of little stars. */
export function drawTouchdown(ctx, effect, t, cameraY) {
  const age = t - effect.at,
    y = effect.y - cameraY,
    s = age / 1000;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#e9be76';
  for (const [delay, grow] of [
    [0, 0.3],
    [90, 0.2],
  ]) {
    const rx = 18 + Math.max(0, age - delay) * grow;
    ctx.beginPath();
    ctx.ellipse(effect.x, y + 2, rx, 3 + rx * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f3e3a6';
  for (let i = 0; i < 8; i++) {
    const x = grid(effect.x + (i % 2 ? 1 : -1) * (20 + scatter(i + 70) * 110) * s * 1.6),
      top = grid(y - (180 + scatter(i + 80) * 160) * s + 900 * s * s);
    ctx.fillRect(x - 2, top, 6, 2);
    ctx.fillRect(x, top - 2, 2, 6);
  }
}

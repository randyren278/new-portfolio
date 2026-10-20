import { WORLD } from './physics.js';
import { RESCUE_MS, ZONES, ZONE_METRES } from './climb.js';

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

/** The first gate ledge of a zone names it underneath, like the launch pad. */
export function drawGateLabel(ctx, p, y) {
  ctx.fillStyle = '#a5a69b';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${p.gate * ZONE_METRES}M · ${zoneName(p.gate).toUpperCase()}`,
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

/** Zone title card after landing on a gate. */
export function drawBanner(ctx, banner, t) {
  if (banner)
    drawCallout(
      ctx,
      `ZONE ${banner.zone} · ${banner.zone * ZONE_METRES} M`,
      zoneName(banner.zone),
      t - banner.at,
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

/** While the line is below the view, a gauge above the bottom controls says how far below. */
export function drawGauge(ctx, metres, y) {
  ctx.fillStyle = '#d99177';
  ctx.textAlign = 'center';
  ctx.fillText(`▼ LINE ${metres} M BELOW`, WORLD.width / 2, y);
  ctx.textAlign = 'left';
}

/** Short decaying camera shake from big moments only; none with reduced motion. */
const JOLTS = { spring: 3, kick: 2, break: 1.2 };
export function shake(effects, t, reduced) {
  if (reduced) return [0, 0];
  let x = 0,
    y = 0;
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

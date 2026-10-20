import { WORLD } from './physics.js';
import { ZONES, ZONE_METRES } from './climb.js';

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
const CALLOUT_Y = 455;
export function drawCallout(ctx, kicker, title, age, durationMs = 2400) {
  if (age < 0 || age > durationMs) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, age / 220, (durationMs - age) / 600);
  ctx.font = '26px Instrument,serif';
  const width = Math.max(ctx.measureText(title).width, kicker.length * 5.6) + 44;
  ctx.fillStyle = 'rgba(24,24,24,0.88)';
  ctx.beginPath();
  ctx.roundRect(WORLD.width / 2 - width / 2, CALLOUT_Y - 26, width, 66, 14);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eee7d7';
  ctx.fillText(title, WORLD.width / 2, CALLOUT_Y + 28);
  ctx.fillStyle = '#a5a69b';
  ctx.font = '9px Plex,monospace';
  ctx.fillText(kicker, WORLD.width / 2, CALLOUT_Y - 6);
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

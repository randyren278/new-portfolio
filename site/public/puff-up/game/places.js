import { WORLD } from './physics.js';
import { ZONES, ZONE_METRES } from './climb.js';

// Past the zone table the climb leaves the sky behind: Puff rises through a sea of clouds, then
// the jet stream, drawn far behind the ledges. Each drifts down the view as Puff climbs its zone,
// slower the farther away it is, and fades out toward the zones on either side.
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const snap = (n) => Math.round(n / 2) * 2;
// A wide screen shows past the course on both sides; the sky carries on out there.
const LEFT = -320,
  SPAN = WORLD.width - 2 * LEFT;
const wrap = (x) => LEFT + ((((x - LEFT) % SPAN) + SPAN) % SPAN);

// Pixel clouds, painted once at 1× like Puff and drawn 2× without smoothing: round puffs on a
// flat base, lit along the top and shaded along the bottom.
const CLOUDS = Array.from({ length: 14 }, (_, i) => ({
  x: (i * 173) % SPAN,
  y: ((i * 97) % 520) - 260,
  cells: 28 + ((i * 13) % 26),
  depth: 0.22 + (i % 3) * 0.1,
  speed: 3 + (i % 4) * 2,
}));
const cloudSprites = new Map();
function cloudSprite(cells) {
  if (cloudSprites.has(cells)) return cloudSprites.get(cells);
  const height = 16,
    base = height - 2,
    puffs = [
      [cells * 0.25, base - 3, 4],
      [cells * 0.48, base - 6, 7],
      [cells * 0.72, base - 4, 5],
    ],
    sprite = document.createElement('canvas');
  sprite.width = cells;
  sprite.height = height;
  const g = sprite.getContext('2d'),
    inside = (x, y) =>
      y <= base &&
      x >= 1 &&
      x < cells - 1 &&
      (y >= base - 2 ||
        puffs.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r));
  for (let y = 0; y < height; y++)
    for (let x = 0; x < cells; x++) {
      if (!inside(x, y)) continue;
      g.fillStyle = !inside(x, y - 1) ? '#f2ead8' : y === base ? '#8f8a7c' : '#cfc6b2';
      g.fillRect(x, y, 1, 1);
    }
  cloudSprites.set(cells, sprite);
  return sprite;
}
function clouds(ctx, off, t) {
  const alpha = ctx.globalAlpha;
  for (const c of CLOUDS) {
    const sprite = cloudSprite(c.cells),
      x = snap(wrap(c.x + (t / 1000) * c.speed) - 60),
      y = snap(WORLD.height / 2 + off * c.depth + c.y);
    ctx.globalAlpha = alpha * (0.05 + c.depth * 0.18);
    ctx.drawImage(sprite, x, y, sprite.width * 2, sprite.height * 2);
  }
  ctx.globalAlpha = alpha;
}

const STREAKS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 211) % SPAN,
  y: ((i * 61) % 520) - 260,
  length: 30 + ((i * 37) % 90),
  speed: 140 + ((i * 47) % 140),
}));
function jetStream(ctx, off, t) {
  const middle = WORLD.height / 2 + off * 0.35;
  ctx.fillStyle = 'rgba(238,231,215,0.16)';
  for (const s of STREAKS) {
    const x = Math.round(wrap(s.x + (t / 1000) * s.speed) - 60),
      y = Math.round(middle + s.y);
    ctx.fillRect(x, y, s.length, 1);
    ctx.fillRect(x + s.length - 6, y, 6, 2);
  }
}

// The places past the table, one per zone; above them is open space.
const PLACES = [clouds, jetStream];

/** Every place near the view, behind everything else. */
export function drawPlaces(ctx, cameraY, t, reduced) {
  const centre = cameraY + WORLD.height / 2;
  PLACES.forEach((draw, i) => {
    // World y of the middle of its zone, 10 px to the metre from the launch pad at 575.
    const off = 575 - (ZONES.length + i + 0.5) * ZONE_METRES * 10 - centre,
      fade = 1 - clamp((Math.abs(off) - 800) / 500, 0, 1);
    if (fade <= 0) return;
    ctx.save();
    ctx.globalAlpha = fade;
    draw(ctx, off, reduced ? 0 : t);
    ctx.restore();
  });
}

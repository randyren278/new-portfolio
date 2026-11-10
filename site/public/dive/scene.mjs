import { renderPuff } from '/puff-up/game/puff-motion.js';
import { createDiveJourney, oceanZone, rodTip } from './journey.mjs';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) ** 3;
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function sprite(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'));
  return canvas;
}

const puffFrames = new Map();
const puffAnchors = new WeakMap();
function puffFrame(animation, frame) {
  const key = `${animation}:${frame}`;
  if (!puffFrames.has(key)) {
    const image = sprite(112, 96, (ctx) =>
      renderPuff(ctx, { animation, timeMs: frame * 75, x: 0, y: 0, scale: 2, direction: 'left' }),
    );
    const pixels = image.getContext('2d').getImageData(0, 0, 112, 96).data;
    let anchor = { x: 56, y: 20 };
    for (let y = 0; y < 48; y++) {
      const xs = [];
      for (let x = 0; x < 112; x++) if (pixels[(y * 112 + x) * 4 + 3] > 128) xs.push(x);
      if (xs.length >= 3) {
        const x = xs.reduce((best, next) =>
          Math.abs(next - 56) < Math.abs(best - 56) ? next : best,
        );
        anchor = { x: x + 0.5, y: y + 0.5 };
        break;
      }
    }
    puffAnchors.set(image, anchor);
    puffFrames.set(key, image);
  }
  return puffFrames.get(key);
}

const fishFrames = ['#ffcb82', '#68e4d7', '#f69ca3', '#acd3ff'].map((color) =>
  [0, 1].map((tail) =>
    sprite(40, 20, (ctx) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(9, 6);
      ctx.lineTo(4, tail ? 2 : 4);
      ctx.lineTo(4, tail ? 17 : 15);
      ctx.lineTo(10, 13);
      ctx.lineTo(15, 16);
      ctx.lineTo(26, 15);
      ctx.lineTo(33, 10);
      ctx.lineTo(26, 5);
      ctx.lineTo(15, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#effbff';
      ctx.fillRect(15, 6, 10, 2);
      ctx.fillStyle = '#133453';
      ctx.fillRect(27, 8, 2, 2);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(20, 11, 2, 3);
    }),
  ),
);
const glow = sprite(32, 32, (ctx) => {
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, '#b7fff8');
  g.addColorStop(0.1, '#72f3e6aa');
  g.addColorStop(1, '#51e3df00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
});
const waters = [
  ['#0c7c92', '#0a506f', '#082b49'],
  ['#0a455d', '#0a2f49', '#081e34'],
  ['#071525', '#091529', '#0b1830'],
  ['#080e1c', '#10142a', '#12152c'],
  ['#080c16', '#111225', '#18152b'],
].map((colors) =>
  sprite(2, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    colors.forEach((color, i) => g.addColorStop(i / 2, color));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2, 256);
  }),
);

/** Sprites retain their pixel artwork; their positions move at display cadence. */
export function mountOcean(canvas, { reducedMotion = false } = {}) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return {
    setDepth() {}, setMood() {}, celebrate() {}, cancelJourney() {}, dispose() {},
    descend(to, { rank = 0, onUpdate, onComplete } = {}) {
      onUpdate?.(createDiveJourney({ to, rank, reducedMotion: true }).sample(0));
      onComplete?.();
    },
  };
  for (let i = 0; i < 24; i++) {
    puffFrame('turn', i);
    puffFrame('hello', i);
    puffFrame('fall', i);
    puffFrame('soft-land', i);
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let quiet = reducedMotion || motion.matches;
  let width = 1440,
    height = 1000,
    ratio = 1,
    portrait = false;
  let frame = 0,
    lastTime = 0,
    clock = 0,
    disposed = false;
  let depth = 0,
    target = 0,
    from = 0,
    moveAt = 0,
    duration = 620;
  let journey = null,
    journeyFrame = null;
  let mood = 'idle',
    moodAt = 0;
  let rarityRank = 0,
    rarityColor = '#ffd18b';
  let boatArtwork = null;
  const boatFrames = new Map();
  const boat = new Image();
  boat.decoding = 'async';
  boat.onload = () => {
    boatArtwork = boat;
    render();
    start();
  };
  boat.src = new URL('./boat-grid.webp', import.meta.url).href;

  function pixelSize() {
    return (portrait ? 65 : 86) / 56;
  }

  function drawBoat(surface, time) {
    const rig = rodTip({ width, height, portrait, surface, time });
    if (!boatArtwork || surface < -rig.h * 2) return rig;
    const pixel = pixelSize();
    const columns = Math.round(rig.w / pixel);
    const rows = Math.round(rig.h / pixel);
    if (!boatFrames.has(columns)) {
      boatFrames.set(columns, sprite(columns, rows, (image) => {
        image.imageSmoothingEnabled = false;
        image.drawImage(boatArtwork, 257, 134, 1075, 701, 0, 0, columns, rows);
      }));
    }
    ctx.save();
    ctx.translate(rig.boatX, surface + rig.bob);
    ctx.rotate(rig.angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(boatFrames.get(columns), -rig.w * 0.5, -rig.h * 0.87, rig.w, rig.h);
    ctx.beginPath();
    ctx.moveTo(rig.w * 0.28, -rig.h * 0.24);
    ctx.lineTo(rig.w * 0.37, -rig.h * 0.65);
    ctx.lineTo(rig.w * 0.46, -rig.h * 0.91);
    ctx.lineTo(rig.w * 0.58, -rig.h * 0.94);
    ctx.strokeStyle = '#dbc295';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    return rig;
  }

  function render() {
    if (disposed) return;
    const t = quiet ? 0 : clock;
    const p = depth / 7000;
    const camera = p * height * (portrait ? 1.25 : 1.32);
    const compact = portrait && height < 600;
    const surface = height * (portrait ? (compact ? 0.19 : 0.24) : 0.25) - camera;
    const action = journeyFrame;
    const traveling = action?.phase === 'descent';
    const speed = traveling ? action.velocity : 0;
    const preparing = action?.phase === 'anticipation' ? Math.sin(action.phaseProgress * Math.PI) : 0;
    const settling = action?.phase === 'settle' ? Math.sin(action.phaseProgress * Math.PI) : 0;
    const diverX = width * (portrait ? 0.57 : 0.72) + Math.sin(t * 1.1) * (traveling ? 1 : 4) + speed * 9;
    const diverY =
      height * (portrait ? (compact ? 0.23 : 0.33) : 0.53) +
      Math.sin(t * 1.8) * 5 +
      p * height * (compact ? 0.025 : 0.055) - preparing * 7 + speed * 15 + settling * 5;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#081a30';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const top = Math.max(0, surface);
    const zonePosition = clamp(depth / 1650, 0, 3.99999);
    const zone = Math.floor(zonePosition);
    const blend = smooth(zonePosition - zone);
    ctx.drawImage(waters[zone], 0, top, width, height - top);
    ctx.globalAlpha = blend;
    ctx.drawImage(waters[zone + 1], 0, top, width, height - top);
    ctx.globalAlpha = 1;

    if (surface > 0) {
      for (let i = 0; i < 34; i++) {
        const x = (i * 157 + 47) % width;
        const y = ((i * 71 + 9) % Math.max(30, height * 0.2)) - camera * 0.25;
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(t * 0.8 + i);
        ctx.fillStyle = '#d9efff';
        ctx.fillRect(x, y, i % 5 ? 1 : 2, 1);
      }
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffe7b1';
      ctx.beginPath();
      ctx.arc(width * 0.85, height * 0.105 - camera * 0.3, portrait ? 8 : 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const sunlight = 1 - smooth((depth - 200) / 1200);
    if (sunlight > 0) {
      ctx.globalAlpha = 0.055 * sunlight;
      ctx.fillStyle = '#b7fff6';
      for (let i = 0; i < 5; i++) {
        const x = width * (i * 0.24 - 0.08) + Math.sin(t * 0.3 + i) * 14;
        ctx.beginPath();
        ctx.moveTo(x, surface);
        ctx.lineTo(x + width * 0.045, surface);
        ctx.lineTo(x + width * 0.24, height);
        ctx.lineTo(x + width * 0.08, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (surface > -60) {
      for (let row = 3; row >= 0; row--) {
        ctx.beginPath();
        for (let x = -10; x <= width + 10; x += 16) {
          const y = surface + row * 6 + Math.sin(x * 0.021 + t * (1.5 + row * 0.08)) * (2 + row);
          if (x === -10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = ['#b0f3ed', '#70d9d8aa', '#44c2d177', '#48c3d144'][row];
        ctx.lineWidth = row ? 1 : 1.6;
        ctx.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = (i * 97 + t * 12) % width;
        ctx.fillStyle = '#d6faf177';
        ctx.fillRect(x, surface + 8 + (i % 3) * 7, 8 + (i % 4) * 6, 1);
      }
    }

    // Three layers swim at distinct speeds; no integer-position snapping.
    for (let school = 0; school < 9; school++) {
      const abundance = 1 - smooth((depth - 350 - school * 90) / 1250);
      if (abundance < 0.01) continue;
      const direction = school % 2 ? 1 : -1;
      const speed = 20 + (school % 4) * 8;
      const groupX = ((school * 211 + t * speed * direction + width * 20) % (width + 200)) - 100;
      const swimY =
        top + 40 + ((school * height * 0.187 + camera * 0.16) % Math.max(100, height - top - 65));
      for (let j = 0; j < 4; j++) {
        const x = groupX + j * 19;
        const y = swimY + (j % 2) * 13 + Math.sin(t * 2.1 + j + school) * 4;
        const size = school % 3 === 0 ? 38 : 25;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(direction, 1);
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = (school % 3 === 0 ? 0.78 : 0.55) * abundance;
        ctx.drawImage(
          fishFrames[school % 4][Math.floor(t * 7 + j) % 2],
          -size / 2,
          -size / 4,
          size,
          size / 2,
        );
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;

    const deepLife = smooth((depth - 1700) / 1800);
    for (let i = 0; i < 24; i++) {
      const y =
        height - ((i * 113 + t * (14 + (i % 6) * 3) + camera * 0.3) % Math.max(80, height - top));
      const x = (i * 179 + Math.sin(t * 0.8 + i) * 9) % width;
      if (i % 4 === 0) {
        ctx.globalAlpha = 0.08 + deepLife * 0.2;
        ctx.drawImage(glow, x - 12, y - 12, 24, 24);
      } else {
        ctx.strokeStyle = depth > 2000 ? '#9cb7db33' : '#b6f5ef55';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    const jellyLight = smooth((depth - 1400) / 1000) * (1 - smooth((depth - 4800) / 1200));
    if (jellyLight > 0) {
      for (let i = 0; i < 3; i++) {
        const x = width * (0.18 + i * 0.32) + Math.sin(t * 0.4 + i) * 15;
        const y = height * (0.24 + i * 0.2) + Math.sin(t * 0.9 + i) * 12;
        ctx.globalAlpha = 0.2 * jellyLight;
        ctx.fillStyle = i % 2 ? '#bdabff' : '#77f1f3';
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.bezierCurveTo(x - 11, y - 18, x + 11, y - 18, x + 12, y);
        ctx.fill();
        ctx.strokeStyle = '#9be9ee';
        ctx.lineWidth = 1;
        for (let k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.moveTo(x + k * 7, y);
          ctx.bezierCurveTo(
            x + k * 7 + Math.sin(t + i) * 5,
            y + 10,
            x + k * 8 - 6,
            y + 18,
            x + k * 7,
            y + 26,
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    const midnight = smooth((depth - 1000) / 1600) * (1 - smooth((depth - 4400) / 1400));
    if (midnight > 0) {
      for (let i = 0; i < 3; i++) {
        const x = ((width * (0.25 + i * 0.37) + t * (i % 2 ? -4 : 5) + width * 3) % (width + 140)) - 70;
        const y = height * (0.19 + i * 0.22) + Math.sin(t * 0.3 + i) * 12 - camera * 0.04;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(i % 2 ? -1 : 1, 1);
        ctx.globalAlpha = midnight * 0.45;
        ctx.fillStyle = '#020914';
        ctx.beginPath();
        ctx.moveTo(-42, 0);
        ctx.bezierCurveTo(-27, -15, 19, -16, 39, 0);
        ctx.bezierCurveTo(18, 13, -23, 15, -42, 0);
        ctx.lineTo(-58, -12);
        ctx.lineTo(-55, 12);
        ctx.fill();
        ctx.globalAlpha = midnight * 0.6;
        ctx.fillStyle = '#7ad5d6';
        ctx.fillRect(24, -3, 2, 2);
        ctx.restore();
      }
    }

    const abyss = smooth((depth - 3200) / 1400);
    if (abyss > 0) {
      for (let side = 0; side < 2; side++) {
        ctx.save();
        ctx.translate(side ? width : 0, 0);
        ctx.scale(side ? -1 : 1, 1);
        ctx.globalAlpha = abyss;
        ctx.fillStyle = side ? '#080e1c' : '#071020';
        ctx.beginPath();
        ctx.moveTo(0, -20);
        for (let i = 0; i <= 16; i++) {
          const y = i * height / 14 - (camera * 0.08 % (height / 14));
          const x = width * (0.035 + 0.035 * Math.sin(i * 2.4 + side) + 0.035 * (depth / 7000));
          ctx.lineTo(x, y);
          ctx.lineTo(x + width * 0.025, y + height / 35);
        }
        ctx.lineTo(0, height + 20);
        ctx.closePath();
        ctx.fill();
        for (let i = 0; i < 12; i++) {
          const y = (i * 127 - camera * 0.12 + height * 10) % height;
          const x = width * (0.025 + (i % 3) * 0.013);
          ctx.globalAlpha = abyss * (0.25 + 0.1 * Math.sin(t * 0.7 + i));
          ctx.fillStyle = i % 2 ? '#9b89bd' : '#64bcc2';
          ctx.fillRect(x, y, 2, 3);
        }
        ctx.restore();
      }
    }
    const trench = smooth((depth - 5500) / 1200);
    if (trench > 0) {
      const floor = height * (1.2 - trench * 0.29);
      ctx.fillStyle = '#080d19';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + 20; x += 20)
        ctx.lineTo(x, floor + Math.sin(x * 0.025) * 8 + Math.cos(x * 0.061) * 4);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 11; i++) {
        const x = (i * 137 + 40) % width;
        const y = floor + 4;
        ctx.strokeStyle = i % 3 ? '#68729577' : '#ad8eb888';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 1, y - 8 - (i % 3) * 3);
        ctx.stroke();
        ctx.fillStyle = '#b9bcdf88';
        ctx.fillRect(x - 2, y - 10 - (i % 3) * 3, 5, 2);
      }
    }
    const landmarks = [
      [200, 'sunlight begins to fade'],
      [1000, 'the last light from above'],
      [2000, 'midnight water'],
      [4000, 'the abyss opens below'],
      [6000, 'the trench begins'],
    ];
    ctx.font = `${portrait ? 9 : 11}px monospace`;
    ctx.textAlign = portrait ? 'center' : 'right';
    const nearestLandmark = landmarks.reduce((nearest, item) =>
      Math.abs(item[0] - depth) < Math.abs(nearest[0] - depth) ? item : nearest);
    for (const [metres, label] of landmarks) {
      if (portrait && metres !== nearestLandmark[0]) continue;
      const x = width * (portrait ? 0.5 : 0.96);
      const y = portrait ? height * 0.63 : height * 0.36 + (metres - depth) * height * 0.0007;
      if (y < height * 0.12 || y > height * 0.85) continue;
      ctx.globalAlpha = 0.35 * (1 - Math.min(1, Math.abs(metres - depth) / 950));
      ctx.fillStyle = '#bdd4e5';
      ctx.fillText(label, x, y);
      ctx.fillRect(x - (portrait ? 9 : 18), y + 6, 18, 1);
    }
    ctx.globalAlpha = 1;

    const success = mood === 'good' || mood === 'complete';
    const elapsed = t - moodAt;
    const animation = traveling ? 'fall' : action?.phase === 'settle' ? 'soft-land' : success && elapsed < 1.7 ? 'hello' : 'turn';
    const animationTime = action?.phase === 'settle' ? action.phaseProgress * 600 : animation === 'hello' ? elapsed * 1000 : t * 1000;
    const index = Math.floor(animationTime / 75) % 24;
    const puff = puffFrame(animation, Math.max(0, index));
    const w = 56 * pixelSize();
    const angle = -speed * 0.24 + preparing * 0.08 - settling * 0.05;
    const pixelAnchor = puffAnchors.get(puff);
    const ax = -w / 2 + pixelAnchor.x * w / 112;
    const ay = -w * 0.43 + pixelAnchor.y * w / 112;
    const anchor = {
      x: diverX + ax * Math.cos(angle) - ay * Math.sin(angle),
      y: diverY + ax * Math.sin(angle) + ay * Math.cos(angle),
    };
    const origin = drawBoat(surface, t);
    const lineBow = 7 * (1 - speed) + Math.sin(t * 0.8) * 2 - preparing * 8;
    ctx.strokeStyle = '#c8e9e399';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.quadraticCurveTo(
      lerp(origin.x, anchor.x, 0.5) + lineBow,
      lerp(origin.y, anchor.y, 0.55),
      anchor.x,
      anchor.y,
    );
    ctx.stroke();
    if (traveling) {
      for (let i = 0; i < 10; i++) {
        const u = ((t * 1.7 + i * 0.11) % 1);
        const x = diverX + Math.sin(i * 2.3) * (5 + u * 15) - u * 10;
        const y = diverY - 16 - u * (50 + speed * 55);
        ctx.globalAlpha = speed * (1 - u) * 0.5;
        ctx.strokeStyle = '#c7eff1';
        ctx.beginPath();
        ctx.arc(x, y, 1 + u * (i % 3 + 1), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    ctx.save();
    ctx.translate(diverX, diverY);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(puff, -w / 2, -w * 0.43, w, (w * 48) / 56);
    ctx.restore();
    ctx.strokeStyle = '#ffe1a2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 1.5, 0, Math.PI * 2);
    ctx.stroke();
    canvas.dataset.depth = depth.toFixed(2);
    canvas.dataset.zone = oceanZone(depth);
    canvas.dataset.journeyPhase = action?.phase ?? 'idle';
    canvas.dataset.lineOrigin = `${origin.x.toFixed(2)},${origin.y.toFixed(2)}`;
    if (!quiet && success && elapsed < 0.75) {
      const phase = elapsed / 0.75;
      ctx.globalAlpha = 1 - phase;
      const count = [5, 7, 10, 14, 18, 25][rarityRank];
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const r = 17 + phase * (24 + rarityRank * 8);
        const px = diverX + Math.cos(a) * r;
        const py = diverY + Math.sin(a) * r - phase * 12;
        ctx.fillStyle = i % 3 ? rarityColor : '#e8fff8';
        if (rarityRank === 0) {
          ctx.strokeStyle = rarityColor;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillRect(px - 1.5, py - 1.5, rarityRank >= 4 ? 4 : 3, rarityRank >= 4 ? 4 : 3);
        }
      }
      if (rarityRank >= 3) {
        ctx.strokeStyle = rarityColor;
        ctx.lineWidth = rarityRank === 5 ? 2 : 1;
        ctx.beginPath();
        ctx.arc(diverX, diverY, 20 + phase * 57, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (rarityRank === 1) {
        ctx.strokeStyle = rarityColor;
        ctx.beginPath();
        ctx.arc(diverX - 9, diverY, 17 + phase * 25, -0.8, 0.8);
        ctx.stroke();
      }
      if (rarityRank === 2) {
        ctx.imageSmoothingEnabled = false;
        for (let i = 0; i < 3; i++)
          ctx.drawImage(
            fishFrames[1][i % 2],
            diverX - 55 + phase * 110 - i * 18,
            diverY + 30 + (i % 2) * 7,
            23,
            12,
          );
      }
      if (rarityRank === 5) {
        ctx.fillStyle = rarityColor;
        const sy = diverY - 53 - phase * 10;
        ctx.fillRect(diverX - 12, sy - 2, 24, 4);
        ctx.fillRect(diverX - 2, sy - 12, 4, 24);
      }
      ctx.globalAlpha = 1;
    }
  }

  function tick(timestamp) {
    frame = 0;
    if (disposed || quiet || document.hidden) return;
    const dt = lastTime ? Math.min(0.05, (timestamp - lastTime) / 1000) : 0;
    lastTime = timestamp;
    clock += dt;
    if (journey) {
      journey.elapsed += dt * 1000;
      advanceJourney(journey);
    } else if (depth !== target) {
      const progress = clamp((timestamp - moveAt) / duration, 0, 1);
      depth = lerp(from, target, easeOut(progress));
      if (progress === 1) depth = target;
    }
    render();
    frame = requestAnimationFrame(tick);
  }
  function start() {
    if (!frame && !quiet && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width || 1440;
    height = box.height || 1000;
    portrait = width <= 700 && height > width;
    ratio = Math.min(devicePixelRatio || 1, portrait ? 2 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    render();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      lastTime = 0;
      render();
      start();
    }
  }
  function preference() {
    quiet = reducedMotion || motion.matches;
    if (quiet) {
      cancelAnimationFrame(frame);
      frame = 0;
      if (journey) advanceJourney(journey, true);
      else depth = target;
      render();
    } else {
      lastTime = 0;
      start();
    }
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  motion.addEventListener('change', preference);
  document.addEventListener('visibilitychange', visibility);
  resize();
  start();
  function cancelJourney() {
    journey = null;
    journeyFrame = null;
    from = target = depth;
    moveAt = performance.now();
  }
  function advanceJourney(active, finish = false) {
    const next = active.plan.sample(finish ? active.plan.duration : active.elapsed);
    const previous = journeyFrame?.phase;
    journeyFrame = next;
    depth = next.depth;
    if (next.phase === 'settle' && previous !== 'settle' && active.plan.rank >= 0) {
      mood = 'good';
      moodAt = clock;
    }
    active.onUpdate?.(next);
    if (journey !== active || next.phase !== 'landed') return;
    journey = null;
    depth = target = active.plan.to;
    active.onComplete?.();
  }
  return {
    setDepth(value, { immediate = false } = {}) {
      const next = clamp(Number(value) || 0, 0, 7000);
      cancelJourney();
      from = depth;
      target = next;
      moveAt = performance.now();
      duration = next === 0 ? 420 : 620;
      if (quiet || immediate) {
        depth = next;
        render();
      } else start();
    },
    descend(value, { rank = 0, color = '#ffd18b', onUpdate, onComplete } = {}) {
      if (disposed) return;
      cancelJourney();
      rarityRank = clamp(rank, 0, 5);
      rarityColor = color;
      mood = rank >= 0 ? 'thinking' : 'miss';
      const plan = createDiveJourney({ from: depth, to: value, rank, reducedMotion: quiet });
      target = plan.to;
      const active = { plan, elapsed: 0, onUpdate, onComplete };
      journey = active;
      advanceJourney(active);
      render();
      start();
    },
    cancelJourney,
    celebrate(rank, color) {
      rarityRank = clamp(rank, 0, 5);
      rarityColor = color;
      mood = 'good';
      moodAt = clock;
      render();
      start();
    },
    setMood(value) {
      mood = value;
      moodAt = clock;
      render();
    },
    dispose() {
      disposed = true;
      cancelJourney();
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
      boat.onload = null;
    },
  };
}

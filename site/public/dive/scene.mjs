import { renderPuff } from '/puff-up/game/puff-motion.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) ** 3;

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
  ['#0b5c7b', '#093d65', '#0a254b'],
  ['#113f6c', '#15325f', '#11203f'],
  ['#12325e', '#17254e', '#141b39'],
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
  if (!ctx) return { setDepth() {}, setMood() {}, celebrate() {}, dispose() {} };
  for (let i = 0; i < 24; i++) {
    puffFrame('turn', i);
    puffFrame('hello', i);
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

  function drawBoat(x, surface, time) {
    if (!boatArtwork) return;
    const pixel = pixelSize();
    const desired = portrait ? (height < 600 ? 120 : 168) : clamp(width * 0.17, 190, 270);
    const columns = Math.round(desired / pixel);
    const rows = Math.round((columns * 701) / 1075);
    if (!boatFrames.has(columns)) {
      boatFrames.set(
        columns,
        sprite(columns, rows, (image) => {
          image.imageSmoothingEnabled = false;
          image.drawImage(boatArtwork, 257, 134, 1075, 701, 0, 0, columns, rows);
        }),
      );
    }
    const art = boatFrames.get(columns);
    const w = art.width * pixel;
    const h = art.height * pixel;
    const bob = Math.sin(time * 1.8) * 3;
    const angle = Math.sin(time * 1.35) * 0.022;
    const tip = { x: w * 0.58, y: -h * 0.94 };
    ctx.save();
    ctx.translate(x, surface + bob);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(art, -w * 0.5, -h * 0.87, w, h);
    ctx.beginPath();
    ctx.moveTo(w * 0.28, -h * 0.24);
    ctx.lineTo(w * 0.37, -h * 0.65);
    ctx.lineTo(w * 0.46, -h * 0.91);
    ctx.lineTo(tip.x, tip.y);
    ctx.strokeStyle = '#dbc295';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
    return [
      x + tip.x * Math.cos(angle) - tip.y * Math.sin(angle),
      surface + bob + tip.x * Math.sin(angle) + tip.y * Math.cos(angle),
    ];
  }

  function render() {
    if (disposed) return;
    const t = quiet ? 0 : clock;
    const p = depth / 7000;
    const camera = p * height * (portrait ? 1.25 : 1.32);
    const compact = portrait && height < 600;
    const surface = height * (portrait ? (compact ? 0.19 : 0.24) : 0.25) - camera;
    const diverX = width * (portrait ? 0.57 : 0.72) + Math.sin(t * 1.1) * 5;
    const diverY =
      height * (portrait ? (compact ? 0.23 : 0.33) : 0.53) +
      Math.sin(t * 1.8) * 5 +
      p * height * (compact ? 0.025 : 0.055);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#081a30';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    const top = Math.max(0, surface);
    const zone = Math.min(2, Math.floor(p * 3));
    const blend = p * 3 - zone;
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

    if (p < 0.65) {
      ctx.globalAlpha = 0.055 * (1 - p);
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
        ctx.globalAlpha = school % 3 === 0 ? 0.9 : 0.6;
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

    for (let i = 0; i < 30; i++) {
      const y =
        height - ((i * 113 + t * (14 + (i % 6) * 3) + camera * 0.3) % Math.max(80, height - top));
      const x = (i * 179 + Math.sin(t * 0.8 + i) * 9) % width;
      if (i % 4 === 0) {
        ctx.globalAlpha = 0.28 + p * 0.2;
        ctx.drawImage(glow, x - 12, y - 12, 24, 24);
      } else {
        ctx.strokeStyle = '#b6f5ef55';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    if (p > 0.3) {
      for (let i = 0; i < 3; i++) {
        const x = width * (0.18 + i * 0.32) + Math.sin(t * 0.4 + i) * 15;
        const y = height * (0.24 + i * 0.2) + Math.sin(t * 0.9 + i) * 12;
        ctx.globalAlpha = 0.22;
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
    const floor = height * (2.17 - p * 1.32);
    if (floor < height + 90) {
      ctx.fillStyle = '#0a1834';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width + 20; x += 25) ctx.lineTo(x, floor + Math.sin(x * 0.008) * 18);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 16; i++) {
        const x = (i * 137 + 40) % width;
        const y = floor + 16;
        ctx.strokeStyle = i % 3 === 0 ? '#a67ca766' : '#3e9c9a77';
        ctx.lineWidth = i % 2 ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(
          x - 8,
          y - 15,
          x + Math.sin(t * 0.7 + i) * 9,
          y - 35,
          x - 3,
          y - 45 - (i % 4) * 13,
        );
        ctx.stroke();
      }
    }

    const success = mood === 'good' || mood === 'complete';
    const elapsed = t - moodAt;
    const animation = success && elapsed < 1.7 ? 'hello' : 'turn';
    const index = Math.floor(((animation === 'hello' ? elapsed : t) * 1000) / 75) % 24;
    const puff = puffFrame(animation, Math.max(0, index));
    const w = 56 * pixelSize();
    const pixelAnchor = puffAnchors.get(puff);
    const anchor = {
      x: diverX - w / 2 + (pixelAnchor.x * w) / 112,
      y: diverY - w * 0.43 + (pixelAnchor.y * w) / 112,
    };
    const hook = surface > -150 ? drawBoat(width * (portrait ? 0.48 : 0.69), surface, t) : null;
    const origin = hook ?? [anchor.x + 8, -10];
    ctx.strokeStyle = '#c8f3ee99';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(origin[0], origin[1]);
    ctx.quadraticCurveTo(
      lerp(origin[0], anchor.x, 0.5) + Math.sin(t * 0.8) * 3,
      lerp(origin[1], anchor.y, 0.55),
      anchor.x,
      anchor.y,
    );
    ctx.stroke();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(puff, diverX - w / 2, diverY - w * 0.43, w, (w * 48) / 56);
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = '#ffe1a2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 1.4, 0, Math.PI * 2);
    ctx.stroke();
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
    if (depth !== target) {
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
      depth = target;
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
  return {
    setDepth(value) {
      const next = clamp(Number(value) || 0, 0, 7000);
      if (next === target) return;
      from = depth;
      target = next;
      moveAt = performance.now();
      duration = next === 0 ? 420 : 620;
      if (quiet) {
        depth = next;
        render();
      } else start();
    },
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
      cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', preference);
      document.removeEventListener('visibilitychange', visibility);
      boat.onload = null;
    },
  };
}

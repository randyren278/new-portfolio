export function shotDirection(history, randomValue) {
  if (history.length >= 3 && history.slice(-3).every((direction) => direction === history.at(-1)))
    return -history.at(-1);
  return randomValue < 0.5 ? -1 : 1;
}

// Gameplay keeps the intro's charcoal, with empty space around the climb.
export function createSpaceScene(host, previousDirections = []) {
  const canvas = document.createElement('canvas'),
    cache = document.createElement('canvas');
  const ctx = canvas.getContext('2d'),
    still = cache.getContext('2d');
  const width = innerWidth,
    height = innerHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = cache.width = Math.ceil(width * dpr);
  canvas.height = cache.height = Math.ceil(height * dpr);
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  still.setTransform(dpr, 0, 0, dpr, 0, 0);
  const starCount = Math.max(48, Math.min(280, Math.round((width * height) / 7500))),
    starPoints = [];
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width,
      y = Math.random() * height;
    const inClimb = Math.abs(x - width / 2) < Math.min(320, width * 0.34);
    const alpha = (0.28 + Math.random() * 0.24) * (inClimb ? 0.78 : 1);
    const size = Math.random() < 0.2 ? 2 : 1.25;
    still.fillStyle = `rgba(183,180,164,${alpha})`;
    still.fillRect(Math.round(x), Math.round(y), size, size);
    starPoints.push({ x: Math.round(x), y: Math.round(y), size });
  }
  const shots = [],
    twinkles = [],
    directions = previousDirections.slice(-3);
  let emitted = 0,
    twinkled = 0;
  function draw(dt = 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(cache, 0, 0, width, height);
    for (let i = twinkles.length - 1; i >= 0; i--) {
      const t = twinkles[i];
      t.time += dt;
      if (t.time >= t.life) {
        twinkles.splice(i, 1);
        continue;
      }
      const glow = Math.sin((Math.PI * t.time) / t.life) ** 2;
      ctx.strokeStyle = `rgba(218,211,187,${glow * 0.42})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      const x = t.x + t.size / 2,
        y = t.y + t.size / 2,
        arm = 1 + glow * 2;
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
      ctx.stroke();
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.time += dt;
      if (s.time >= s.life) {
        shots.splice(i, 1);
        continue;
      }
      const progress = s.time / s.life,
        x = s.x + s.vx * s.time,
        y = s.y + s.vy * s.time;
      const fade = Math.sin(Math.PI * progress) * 0.52,
        length = s.length * Math.min(1, progress * 5);
      const dx = (s.vx / Math.hypot(s.vx, s.vy)) * length,
        dy = (s.vy / Math.hypot(s.vx, s.vy)) * length;
      const trail = ctx.createLinearGradient(x - dx, y - dy, x, y);
      trail.addColorStop(0, 'rgba(190,185,166,0)');
      trail.addColorStop(1, `rgba(190,185,166,${fade})`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = `rgba(223,216,194,${fade * 0.9})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  function shoot() {
    if (shots.length) return;
    const direction = shotDirection(directions, Math.random());
    directions.push(direction);
    if (directions.length > 3) directions.shift();
    shots.push({
      x: width * ((direction < 0 ? 0.35 : 0.05) + Math.random() * 0.6),
      y: height * (0.07 + Math.random() * 0.35),
      vx: direction * (150 + Math.random() * 60),
      vy: 65 + Math.random() * 30,
      time: 0,
      life: 1.15 + Math.random() * 0.25,
      length: 65 + Math.random() * 35,
    });
    emitted++;
  }
  function twinkle() {
    if (twinkles.length) return;
    twinkles.push({
      ...starPoints[Math.floor(Math.random() * starPoints.length)],
      time: 0,
      life: 1.6,
    });
    twinkled++;
  }
  function stop() {
    shots.length = 0;
    twinkles.length = 0;
    draw();
  }
  host.replaceChildren(canvas);
  draw();
  return {
    canvas,
    shots,
    twinkles,
    starCount,
    draw,
    shoot,
    twinkle,
    stop,
    get emitted() {
      return emitted;
    },
    get twinkled() {
      return twinkled;
    },
    get directions() {
      return [...directions];
    },
  };
}

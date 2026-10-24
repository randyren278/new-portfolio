export function shotDirection(history, randomValue) {
  if (history.length >= 3 && history.slice(-3).every((direction) => direction === history.at(-1)))
    return -history.at(-1);
  return randomValue < 0.5 ? -1 : 1;
}

// Gameplay keeps the intro's charcoal, with empty space around the climb.
export function createSpaceScene(host, previousDirections = []) {
  // One full-screen canvas, no offscreen copy of the stars: a twinkle or a shooting star repaints
  // only the few pixels it touches, so the sky never redraws the whole screen while it animates.
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const width = innerWidth,
    height = innerHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(width * dpr);
  canvas.height = Math.ceil(height * dpr);
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  const starCount = Math.max(48, Math.min(280, Math.round((width * height) / 7500))),
    starPoints = [];
  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width,
      y = Math.random() * height;
    const inClimb = Math.abs(x - width / 2) < Math.min(320, width * 0.34);
    const alpha = (0.28 + Math.random() * 0.24) * (inClimb ? 0.78 : 1);
    const size = Math.random() < 0.2 ? 2 : 1.25;
    starPoints.push({
      x: Math.round(x),
      y: Math.round(y),
      size,
      color: `rgba(183,180,164,${alpha})`,
    });
  }
  const shots = [],
    twinkles = [],
    directions = previousDirections.slice(-3);
  let emitted = 0,
    twinkled = 0,
    // Device-pixel boxes the last frame drew into; whole pixels, so the clip has no soft edge.
    painted = [];
  const box = (x0, y0, x1, y1) => [
    Math.floor((Math.min(x0, x1) - 2) * dpr),
    Math.floor((Math.min(y0, y1) - 2) * dpr),
    Math.ceil((Math.max(x0, x1) + 2) * dpr),
    Math.ceil((Math.max(y0, y1) + 2) * dpr),
  ];
  function mark(m) {
    if (m.trail) {
      ctx.strokeStyle = m.trail;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.x - m.dx, m.y - m.dy);
      ctx.lineTo(m.x, m.y);
      ctx.stroke();
      ctx.fillStyle = `rgba(223,216,194,${m.fade * 0.9})`;
      ctx.fillRect(m.x, m.y, 1.5, 1.5);
      return;
    }
    ctx.strokeStyle = `rgba(218,211,187,${m.glow * 0.42})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(m.x - m.arm, m.y);
    ctx.lineTo(m.x + m.arm, m.y);
    ctx.moveTo(m.x, m.y - m.arm);
    ctx.lineTo(m.x, m.y + m.arm);
    ctx.stroke();
  }
  function draw(dt = 0, full = false) {
    const marks = [];
    for (let i = twinkles.length - 1; i >= 0; i--) {
      const t = twinkles[i];
      t.time += dt;
      if (t.time >= t.life) {
        twinkles.splice(i, 1);
        continue;
      }
      const glow = Math.sin((Math.PI * t.time) / t.life) ** 2,
        x = t.x + t.size / 2,
        y = t.y + t.size / 2,
        arm = 1 + glow * 2;
      marks.push({ glow, x, y, arm, box: box(x - arm, y - arm, x + arm, y + arm) });
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
      marks.push({ trail, fade, x, y, dx, dy, box: box(x - dx, y - dy, x + 1.5, y + 1.5) });
    }
    const areas = full
      ? [[0, 0, canvas.width, canvas.height]]
      : [...painted, ...marks.map((m) => m.box)];
    for (const [x0, y0, x1, y1] of areas) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const s of starPoints)
        if (
          s.x < x1 / dpr &&
          s.x + s.size > x0 / dpr &&
          s.y < y1 / dpr &&
          s.y + s.size > y0 / dpr
        ) {
          ctx.fillStyle = s.color;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        }
      for (const m of marks) mark(m);
      ctx.restore();
    }
    painted = marks.map((m) => m.box);
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
  draw(0, true);
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

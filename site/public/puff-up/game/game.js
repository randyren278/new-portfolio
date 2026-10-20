import { WORLD, DEFAULT_TUNING, FIXED_DT } from './physics.js';
import { createRun, stepRun, platformAtTime, rebuildMs } from './climb.js';
import { ANIMATIONS, renderPuff, samplePose } from './puff-motion.js';
import { sampleFlightMotion } from './flight-pose.js';
import { sampleGameVisual } from './game-visual.js';
import { bindTouchSteering } from './touch-steering.js';
import { createSound, cuesFor } from './audio.js';
import {
  danger,
  drawBanner,
  drawBest,
  drawCallout,
  drawDust,
  drawGateLabel,
  drawGauge,
  drawKicker,
  drawRebuild,
  drawSpark,
  shake,
  squash,
} from './feedback.js';

const $ = (id) => document.getElementById(id),
  canvas = $('game-canvas'),
  ctx = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const bestKey = 'puff-up:challenge-best:v1';
function nextSeed(previous) {
  const value = crypto.getRandomValues(new Uint32Array(1))[0];
  return value === previous ? (value + 1) >>> 0 : value;
}
// draw() blends `previous` (the state before the latest fixed step) into `run`.
let run = createRun(nextSeed()),
  previous = run,
  running = false,
  started = false,
  best = 0;
// bestAtStart is the record this climb chases; streak counts consecutive climbing landings.
let bestAtStart = 0,
  streak = 0,
  lastLandY = 575,
  newBestAt = null,
  endedAt = null;
const ENDING_MS = 700,
  sound = createSound();
let raf = null,
  lastTime = null,
  accumulator = 0,
  pointerAxis = 0,
  pulseAxis = 0,
  pulseUntil = 0;
const keys = new Set();
try {
  const saved = Number(localStorage.getItem(bestKey));
  if (Number.isSafeInteger(saved) && saved >= 0) best = saved;
} catch {}

Object.defineProperty(window, 'puffClimb', {
  get: () =>
    Object.freeze({
      running,
      started,
      best,
      visual: Object.freeze(sampleGameVisual(run)),
      run: Object.freeze({
        ...run,
        brokenPlatforms: Object.freeze(
          run.brokenPlatforms.map((repair) =>
            Object.freeze({
              readyAt: repair.readyAt,
              platform: Object.freeze({ ...repair.platform }),
            }),
          ),
        ),
        player: Object.freeze({ ...run.player, events: Object.freeze([...run.player.events]) }),
        platforms: Object.freeze(run.platforms.map((p) => Object.freeze({ ...p }))),
        lastLanding: run.lastLanding ? Object.freeze({ ...run.lastLanding }) : null,
        effects: Object.freeze(run.effects.map((e) => Object.freeze({ ...e }))),
      }),
      inputs: Object.freeze({
        keys: Object.freeze([...keys]),
        pointerAxis,
        pulseAxis: performance.now() < pulseUntil ? pulseAxis : 0,
        screenAxis: touch.axis,
        screenPointers: touch.count,
      }),
    }),
});

// Puff is redrawn every frame at 1× into this one canvas, then scaled up 2× without smoothing.
const puff = document.createElement('canvas');
puff.width = 104;
puff.height = 112;
const puffCtx = puff.getContext('2d');
function sprite(animation, timeMs, direction, flight = null) {
  const clip = ANIMATIONS.find((a) => a.id === animation),
    count = Math.ceil((clip.durationMs * clip.fps) / 1000);
  const frame = Math.max(
    0,
    Math.min(
      count - 1,
      Math.floor(((clip.loop ? timeMs % clip.durationMs : timeMs) * clip.fps) / 1000),
    ),
  );
  const time = (frame * 1000) / clip.fps,
    pose = samplePose(animation, time, { direction }),
    airborne = ['jump', 'fall', 'boost'].includes(animation);
  puffCtx.clearRect(0, 0, 104, 112);
  renderPuff(puffCtx, {
    animation,
    timeMs: time,
    x: 24 - (airborne ? pose.offsetX : 0),
    y: 32 - (airborne ? pose.offsetY : 0),
    scale: 1,
    direction,
    flight,
  });
  return puff;
}
const mix = (from, to, a) => from + (to - from) * a;
let cssWidth = 640,
  cssHeight = 620,
  dpr = 1,
  shownScore = null,
  // CSS px from the canvas top to the bottom controls; the line gauge sits just above them.
  gaugeTop = 620;
function viewTransform() {
  const scale = Math.min(cssWidth / WORLD.width, cssHeight / WORLD.height, 1.25),
    left = (cssWidth - WORLD.width * scale) / 2,
    top = (cssHeight - WORLD.height * scale) / 2;
  // Wait until the entire sprite texture has passed the real viewport bottom.
  return { scale, left, top, fallLimit: (cssHeight - top) / scale + 144 };
}
function draw() {
  // The simulation runs in fixed 1/120 s steps; the frame shows the moment `accumulator` past the
  // previous step, so motion stays even at any refresh rate. Poses come from the latest step.
  const { scale, left, top } = viewTransform(),
    a = Math.min(1, accumulator / FIXED_DT),
    t = mix(previous.player.timeMs, run.player.timeMs, a),
    cameraY = mix(previous.cameraY, run.cameraY, a),
    player = run.player,
    puffX = mix(previous.player.x, player.x, a),
    puffY = mix(previous.player.y, player.y, a);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.translate(left, top);
  ctx.scale(scale, scale);
  const ending = endedAt === null ? 0 : performance.now() - endedAt,
    [shakeX, shakeY] = shake(run.effects, t, reduced),
    caught = reduced || ending > 300 ? 0 : 6 * (1 - ending / 300) ** 2;
  ctx.translate(
    shakeX + Math.sin(ending * 0.09) * caught,
    shakeY + Math.cos(ending * 0.11) * caught,
  );
  ctx.imageSmoothingEnabled = false;
  ctx.font = '9px Plex,monospace';
  const first = Math.max(0, Math.ceil((575 - (cameraY + 620)) / 100)),
    last = Math.floor((575 - cameraY) / 100);
  for (let n = first; n <= last; n++) {
    const y = Math.round(575 - n * 100 - cameraY);
    ctx.fillStyle = '#a5a69b70';
    ctx.fillRect(0, y, 7, 1);
    ctx.fillText(`${n * 10}m`, 14, y - 5);
  }
  for (const repair of run.brokenPlatforms)
    if (repair.platform.id !== 'floor')
      drawRebuild(ctx, repair, t, rebuildMs(repair.platform.y), cameraY);
  for (const ledge of run.platforms) {
    const p = platformAtTime(ledge, t),
      y = Math.round(p.y - cameraY);
    if (y < -20 || y > 620) continue;
    if (p.gate !== undefined) drawGateLabel(ctx, p, y);
    if (p.spark) drawSpark(ctx, p, y, t, reduced);
    if (p.kind === 'kicker') {
      drawKicker(ctx, p, y);
      continue;
    }
    const moving = p.kind === 'moving',
      crumble = p.kind === 'crumble',
      spring = p.kind === 'spring';
    if (moving) {
      ctx.strokeStyle = '#82b5cb40';
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.moveTo(p.baseX - p.amplitude, y + 14);
      ctx.lineTo(p.baseX + p.amplitude + p.width, y + 14);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = moving ? '#476e86' : crumble ? '#785543' : spring ? '#6d8763' : '#676a52';
    ctx.fillRect(Math.round(p.x) + 4, y + 4, p.width - 8, 7);
    ctx.fillStyle = moving ? '#82b5cb' : crumble ? '#c89568' : spring ? '#b8c5a6' : '#d6cbb4';
    ctx.fillRect(Math.round(p.x), y, p.width, 4);
    ctx.fillStyle = moving ? '#59879f' : crumble ? '#a77555' : spring ? '#7d9b70' : '#929779';
    ctx.fillRect(Math.round(p.x) + 6, y + 5, p.width - 12, 2);
    if (crumble) {
      const c = Math.round(p.x + p.width * 0.52);
      ctx.strokeStyle = '#3a3029';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c - 5, y);
      ctx.lineTo(c + 1, y + 3);
      ctx.lineTo(c - 3, y + 6);
      ctx.lineTo(c + 5, y + 10);
      ctx.stroke();
    }
    if (moving) {
      // The arrow leads on the side the mover is heading toward.
      const heading = Math.cos((t / p.periodMs) * Math.PI * 2 + p.phase);
      ctx.fillStyle = '#9bcbe1';
      if (heading < 0) ctx.fillText('‹', p.x - 10, y + 5);
      else ctx.fillText('›', p.x + p.width + 4, y + 5);
    }
    if (spring) {
      const c = Math.round(p.x + p.width / 2);
      ctx.strokeStyle = '#e9be76';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c - 9, y);
      ctx.lineTo(c + 7, y - 3);
      ctx.lineTo(c - 7, y - 6);
      ctx.lineTo(c + 7, y - 9);
      ctx.lineTo(c - 7, y - 12);
      ctx.lineTo(c + 9, y - 15);
      ctx.stroke();
      ctx.fillStyle = '#eee7d7';
      ctx.fillRect(c - 10, y - 17, 20, 3);
    }
    if (p.id === 'floor') {
      ctx.fillStyle = '#a5a69b';
      ctx.fillText('LIFT-OFF', p.x + 25, y + 29);
    }
  }
  for (const effect of run.effects) {
    // An effect born in the latest step holds its first frame until the blend reaches it.
    const age = Math.max(0, (t - effect.at) / 650);
    if (age > 1) continue;
    ctx.save();
    ctx.globalAlpha = 1 - age;
    if (effect.type === 'break') {
      ctx.fillStyle = '#c89568';
      for (let i = 0; i < 4; i++) {
        const w = effect.width / 4 - 3,
          x = effect.x + (i * effect.width) / 4 + (i - 1.5) * age * 24,
          y = effect.y - cameraY + age * age * 100 + i * age * 3;
        ctx.fillRect(Math.round(x), Math.round(y), w, 4);
        ctx.fillStyle = '#785543';
        ctx.fillRect(Math.round(x) + 2, Math.round(y) + 4, w - 4, 3);
        ctx.fillStyle = '#c89568';
      }
    } else if (effect.type === 'spring') {
      ctx.strokeStyle = '#e9be76';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(
        effect.x + effect.width / 2,
        effect.y - cameraY,
        12 + age * 25,
        3 + age * 7,
        0,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }
  drawBest(ctx, run.score <= bestAtStart ? bestAtStart : 0, cameraY);
  // The rising line: touch it and the climb ends. It glows as it closes in, and cools to blue
  // while a spark holds it.
  const hazardY = mix(previous.hazardY, run.hazardY, a),
    hazard = Math.round(hazardY - cameraY),
    bottom = (cssHeight - top) / scale,
    close = danger(hazardY, puffY),
    calm = t < run.calmUntil,
    rgb = calm ? '130,181,203' : '217,145,119',
    pulse = reduced || calm ? 0 : close * (0.5 + 0.5 * Math.sin(t / 90));
  if (hazard < bottom) {
    const haze = ctx.createLinearGradient(0, hazard, 0, hazard + 160);
    haze.addColorStop(0, `rgba(${rgb},${0.24 + close * 0.22})`);
    haze.addColorStop(1, `rgba(${rgb},0.05)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, hazard, WORLD.width, bottom - hazard);
    ctx.fillStyle = `rgba(${rgb},${0.85 + pulse * 0.15})`;
    ctx.fillRect(0, hazard - Math.round(close * 2), WORLD.width, 2 + Math.round(close * 2));
  } else if (run.status === 'playing')
    drawGauge(ctx, Math.round((hazardY - puffY) / 10), (gaugeTop - top) / scale - 14);
  let support = null;
  for (const ledge of run.platforms) {
    const p = platformAtTime(ledge, t);
    if (p.y >= puffY - 1 && puffX >= p.x && puffX <= p.x + p.width && (!support || p.y < support.y))
      support = p;
  }
  if (support) {
    const distance = support.y - puffY;
    ctx.fillStyle = `rgba(184,197,166,${Math.max(0.04, 0.2 - distance / 900)})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.round(puffX),
      Math.round(support.y - cameraY + 3),
      Math.max(9, 32 - distance * 0.06),
      2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  if (run.lastLanding && !reduced) {
    const l = run.lastLanding,
      age = t - l.at;
    if (age >= 0 && age < 300) {
      ctx.strokeStyle = `rgba(233,190,118,${(1 - age / 300) * 0.35})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(l.x, l.y - cameraY + 2, 16 + age * 0.065, 3 + age * 0.006, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  drawDust(ctx, run.lastLanding, t, cameraY);
  const v = endedAt === null ? sampleGameVisual(run) : { animation: 'hit', time: ending },
    flight = ['jump', 'fall'].includes(v.animation)
      ? sampleFlightMotion(player, DEFAULT_TUNING)
      : null,
    image = sprite(v.animation, v.time, player.facing, flight),
    [sx, sy] = squash(run.lastLanding, t, reduced),
    feetX = Math.round(puffX),
    feetY = Math.round(puffY - cameraY);
  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale(sx, sy);
  ctx.drawImage(image, -104, -144, 208, 224);
  ctx.restore();
  drawBanner(ctx, run.banner, t);
  if (newBestAt !== null) drawCallout(ctx, 'PAST YOUR BEST', 'New best', t - newBestAt, 1800);
  // Writing the HUD invalidates its layout and paint even when the text is unchanged.
  if (run.score !== shownScore) {
    shownScore = run.score;
    $('height-score').textContent = shownScore;
  }
}
new ResizeObserver(() => {
  const r = canvas.getBoundingClientRect();
  cssWidth = r.width;
  cssHeight = r.height;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  const controls = [...document.querySelectorAll('.touch-controls, .keyboard-hint')]
    .map((el) => el.getBoundingClientRect())
    .filter((box) => box.height > 0);
  gaugeTop = Math.min(r.bottom, ...controls.map((box) => box.top)) - r.top;
  draw();
}).observe(canvas);
document.fonts.ready.then(draw);
function clearInputs() {
  touch.clear();
  keys.clear();
  pointerAxis = 0;
  pulseAxis = 0;
  pulseUntil = 0;
}
function axis() {
  return (
    Number(keys.has('ArrowRight') || keys.has('KeyD')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyA')) ||
    touch.axis ||
    pointerAxis ||
    (performance.now() < pulseUntil ? pulseAxis : 0)
  );
}
function saveBest() {
  try {
    localStorage.setItem(bestKey, String(best));
  } catch {}
}
function syncUI() {
  const over = run.status === 'over';
  $('play-toggle').innerHTML = running
    ? 'Pause <span aria-hidden="true">Ⅱ</span>'
    : `${over ? 'Try again' : started ? 'Resume' : 'Start climbing'} <span aria-hidden="true">${over ? '↺' : '↑'}</span>`;
  $('play-toggle').setAttribute(
    'aria-label',
    running
      ? 'Pause climb'
      : over
        ? 'Try the climb again'
        : started
          ? 'Resume climb'
          : 'Start climbing',
  );
  $('pause-label').hidden = running;
  $('pause-label').classList.toggle('over', over);
  const beaten = over && bestAtStart > 0 && run.score > bestAtStart;
  $('overlay-kicker').textContent = over
    ? beaten
      ? 'NEW BEST'
      : 'THIS CLIMB'
    : started
      ? 'PAUSED'
      : 'PUFF UP';
  $('run-results').hidden = !over;
  $('result-height').textContent = run.score;
  $('overlay-title').hidden = over;
  $('overlay-copy').hidden = over;
  document.querySelector('.height-hud').hidden = over;
  $('overlay-title').textContent = started ? 'Paused.' : 'Puff Up.';
  $('overlay-copy').textContent = started ? 'Space to resume.' : '← → to steer. Puff hops.';
  $('run-announcement').textContent = over
    ? `Climb ended at ${run.score} metres.${beaten ? ' New best.' : ''} Try again to retry.`
    : running
      ? 'Climbing. Puff hops automatically.'
      : started
        ? 'Climb paused.'
        : 'Ready to climb.';
}
function stopFrames() {
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null;
  lastTime = null;
  accumulator = 0;
  previous = run;
  clearInputs();
}
function pause() {
  running = false;
  endedAt = null;
  sound.danger(0);
  sound.pause();
  stopFrames();
  saveBest();
  syncUI();
  draw();
}
function reset() {
  stopFrames();
  saveBest();
  run = previous = createRun(nextSeed(run.seed));
  running = false;
  started = false;
  endedAt = null;
}
function start() {
  if (running) return;
  if (run.status === 'over') reset();
  if (!started) {
    bestAtStart = best;
    streak = 0;
    lastLandY = 575;
    newBestAt = null;
  }
  sound.start();
  running = true;
  started = true;
  lastTime = null;
  accumulator = 0;
  syncUI();
  canvas.focus({ preventScroll: true });
  raf = requestAnimationFrame(tick);
}
function tick(now) {
  raf = null;
  if (!running) return;
  if (lastTime !== null) accumulator += Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  let steps = 0;
  // After a fall the scene holds for a beat (Puff's hit, a jolt) before the results.
  if (endedAt !== null) {
    if (now - endedAt < ENDING_MS) {
      draw();
      raf = requestAnimationFrame(tick);
      return;
    }
    running = false;
    endedAt = null;
    stopFrames();
    saveBest();
    syncUI();
    return;
  }
  while (accumulator >= FIXED_DT && steps < 12) {
    previous = run;
    run = stepRun(run, { axis: axis() }, FIXED_DT, viewTransform().fallLimit);
    best = Math.max(best, run.score);
    accumulator -= FIXED_DT;
    steps++;
    if (run.player.landed) {
      streak = run.player.y < lastLandY - 1 ? streak + 1 : 0;
      lastLandY = run.player.y;
    }
    for (const cue of cuesFor(previous, run)) sound.cue(cue, streak);
    if (newBestAt === null && bestAtStart > 0 && run.score > bestAtStart) {
      newBestAt = run.player.timeMs;
      sound.cue('best');
    }
    if (run.status === 'over') {
      endedAt = now;
      previous = run;
      accumulator = 0;
      sound.danger(0);
      break;
    }
  }
  if (endedAt === null) sound.danger(danger(run.hazardY, run.player.y));
  draw();
  if (running) raf = requestAnimationFrame(tick);
}
const touch = bindTouchSteering(canvas, {
  enabled: (e) =>
    e.pointerType === 'touch' || matchMedia('(max-width:720px), (pointer:coarse)').matches,
  canSteer: () => run.status !== 'over',
  onStart: () => {
    if (!running) start();
    canvas.focus({ preventScroll: true });
  },
  onTap: (direction) => {
    pulseAxis = direction;
    pulseUntil = performance.now() + 90;
  },
});
$('play-toggle').addEventListener('click', () => (running ? pause() : start()));
function syncSound() {
  $('sound-toggle').textContent = sound.muted ? 'SOUND OFF' : 'SOUND ON';
  $('sound-toggle').setAttribute('aria-pressed', String(sound.muted));
}
$('sound-toggle').addEventListener('click', () => {
  sound.toggle();
  syncSound();
  if (running) canvas.focus({ preventScroll: true });
});
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyM' || e.metaKey || e.ctrlKey || e.altKey) return;
  sound.toggle();
  syncSound();
});
syncSound();
$('restart').addEventListener('click', () => {
  reset();
  start();
});
const gameKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'Space']);
canvas.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') {
    e.preventDefault();
    if (running) pause();
    return;
  }
  if (!gameKeys.has(e.code)) return;
  e.preventDefault();
  if (run.status === 'over' && e.code !== 'Space') return;
  if (!running) start();
  if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
canvas.addEventListener('blur', clearInputs);
for (const [id, direction] of [
  ['left-control', -1],
  ['right-control', 1],
]) {
  const button = $(id);
  let pressedAt = 0,
    activePointer = null;
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (run.status === 'over') return;
    if (!running) start();
    canvas.focus({ preventScroll: true });
    pressedAt = performance.now();
    activePointer = e.pointerId;
    pointerAxis = direction;
    button.setPointerCapture(e.pointerId);
  });
  button.addEventListener('pointerup', (e) => {
    if (e.pointerId !== activePointer) return;
    pointerAxis = 0;
    if (performance.now() - pressedAt < 100) {
      pulseAxis = direction;
      pulseUntil = performance.now() + 90;
    }
    activePointer = null;
  });
  const cancel = () => {
    pointerAxis = 0;
    pulseAxis = 0;
    pulseUntil = 0;
    activePointer = null;
  };
  button.addEventListener('pointercancel', cancel);
  button.addEventListener('lostpointercapture', () => {
    if (activePointer !== null) cancel();
  });
  button.addEventListener('click', (e) => {
    if (e.detail === 0 && run.status !== 'over') {
      if (!running) start();
      canvas.focus({ preventScroll: true });
      pulseAxis = direction;
      pulseUntil = performance.now() + 90;
    }
  });
}
addEventListener('blur', () => {
  if (running) pause();
  else clearInputs();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
addEventListener('pagehide', pause);
window.puffDemoGame = Object.freeze({ start, pause, reset });
document.addEventListener(
  'pointerdown',
  () => (document.documentElement.dataset.modality = 'pointer'),
  true,
);
document.addEventListener(
  'keydown',
  (e) => {
    if (e.key === 'Tab') document.documentElement.dataset.modality = 'keyboard';
    else if (gameKeys.has(e.code)) document.documentElement.dataset.modality = 'game';
  },
  true,
);
syncUI();
draw();

import { WORLD, DEFAULT_TUNING, FIXED_DT } from './physics.js';
import {
  createRun,
  climbFrom,
  stepRun,
  platformAtTime,
  REBUILD_MS,
  fallenY,
  lineSpeed,
  zoneForScore,
  FALL_MIN_MS,
  FALL_CAP_MS,
  STREAK_FOR_STAR,
  ROCKET_METRES,
  ROCKET_STREAK,
} from './climb.js';
import { ANIMATIONS, renderPuff, samplePose } from './puff-motion.js';
import { sampleFlightMotion } from './flight-pose.js';
import { sampleGameVisual } from './game-visual.js';
import { bindTouchSteering } from './touch-steering.js';
import { createAutopilot } from './autopilot.js';
import { createSound, cuesFor } from './audio.js';
import {
  danger,
  drawBanner,
  drawBeam,
  drawBest,
  bannerShows,
  CALLOUT_HIGH_Y,
  CALLOUT_LOW_Y,
  CALLOUT_Y,
  drawCallout,
  drawDust,
  drawGateLabel,
  drawGauge,
  drawKicker,
  drawRebuild,
  drawRocket,
  drawRocketFlame,
  drawSpark,
  drawStreaks,
  drawTouchdown,
  drawUfo,
  shake,
  squash,
  ufoAt,
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
// Local testing only: ?stars=3 on localhost starts each climb with a charged rescue,
// ?from=1180 starts it that many metres up, and ?streak=49 starts it that far into a streak.
const testStars =
    location.hostname === 'localhost'
      ? Math.min(3, Number(new URLSearchParams(location.search).get('stars')) || 0)
      : 0,
  testFrom =
    location.hostname === 'localhost'
      ? Math.max(0, Number(new URLSearchParams(location.search).get('from')) || 0)
      : 0,
  testStreak =
    location.hostname === 'localhost'
      ? Math.max(0, Number(new URLSearchParams(location.search).get('streak')) || 0)
      : 0;
const freshRun = (seed) => (testFrom ? climbFrom(seed, testFrom) : createRun(seed));
// draw() blends `previous` (the state before the latest fixed step) into `run`.
let run = freshRun(nextSeed()),
  previous = run,
  running = false,
  started = false,
  best = 0,
  // The ★ hands the next climb to the bot; `pilot` steers this one if it was handed over. A bot's
  // climb never counts toward the best.
  botNext = false,
  pilot = null;
// bestAtStart is the record this climb chases. Moments for the low card: a new best, a charged
// rescue, a streak milestone; the latest shows.
let bestAtStart = 0,
  newBestAt = null,
  readyAt = null,
  streakCard = null,
  endedAt = null,
  // Where Puff was and how fast he was falling when the climb ended.
  fallFrom = null;
// What a streak milestone says. The first earns a star.
const STREAK_WORDS = { 25: 'On a roll', 50: 'Unstoppable', 100: 'Puff Up!' };
const sound = createSound();
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
      bot: pilot !== null,
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
    airborne = ['jump', 'fall', 'boost', 'rocket'].includes(animation);
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
  shownStars = null,
  shownStreak = null,
  shownRocket = false,
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
    ending = endedAt === null ? 0 : performance.now() - endedAt,
    puffX = mix(previous.player.x, player.x, a),
    puffY =
      endedAt === null
        ? mix(previous.player.y, player.y, a)
        : fallenY(fallFrom.y, fallFrom.vy, ending),
    // How long since the line caught Puff, for the jolt as he goes: an ending or a rescue.
    caughtAge = endedAt !== null ? ending : run.rescue ? t - run.rescue.at : null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.translate(left, top);
  ctx.scale(scale, scale);
  const [shakeX, shakeY] = shake(run.effects, t, reduced, run.rocket),
    caught = reduced || caughtAge === null || caughtAge > 300 ? 0 : 6 * (1 - caughtAge / 300) ** 2;
  ctx.translate(
    shakeX + Math.sin(caughtAge * 0.09) * caught,
    shakeY + Math.cos(caughtAge * 0.11) * caught,
  );
  ctx.imageSmoothingEnabled = false;
  ctx.font = '9px Plex,monospace';
  // The whole canvas in world units, wider and taller than the world on most screens.
  const view = {
    left: -left / scale,
    top: -top / scale,
    right: (cssWidth - left) / scale,
    bottom: (cssHeight - top) / scale,
  };
  drawStreaks(ctx, run.rocket, run.player.vy, cameraY, view, reduced);
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
      drawRebuild(ctx, repair, t, REBUILD_MS, cameraY);
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
    } else if (effect.type === 'touchdown') drawTouchdown(ctx, effect, t, cameraY);
    ctx.restore();
  }
  drawBest(ctx, run.score <= bestAtStart ? bestAtStart : 0, cameraY);
  // The rising line: touch it and the climb ends. It glows as it closes in, and cools to blue
  // while a spark holds it. In a surge it pulses while it rushes and dims while it holds.
  const hazardY = mix(previous.hazardY, run.hazardY, a),
    hazard = Math.round(hazardY - cameraY),
    bottom = (cssHeight - top) / scale,
    calm = t < run.calmUntil,
    zone = zoneForScore(run.score, run.seed),
    surge = zone.surge && !calm ? (lineSpeed(zone, 1, t) > 0 ? 'rushing' : 'holding') : null,
    close = surge === 'rushing' ? Math.max(0.6, danger(hazardY, puffY)) : danger(hazardY, puffY),
    rgb = calm ? '130,181,203' : surge === 'holding' ? '118,120,110' : '217,145,119',
    pulse = reduced || calm ? 0 : close * (0.5 + 0.5 * Math.sin(t / 90));
  if (hazard < bottom) {
    const haze = ctx.createLinearGradient(0, hazard, 0, hazard + 160);
    haze.addColorStop(0, `rgba(${rgb},${0.24 + close * 0.22})`);
    haze.addColorStop(1, `rgba(${rgb},0.05)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, hazard, WORLD.width, bottom - hazard);
    ctx.fillStyle = `rgba(${rgb},${0.85 + pulse * 0.15})`;
    ctx.fillRect(0, hazard - Math.round(close * 2), WORLD.width, 2 + Math.round(close * 2));
    if (surge) {
      ctx.textAlign = 'right';
      ctx.fillText(`SURGE · ${surge.toUpperCase()}`, WORLD.width - 10, hazard - 8);
      ctx.textAlign = 'left';
    }
  } else if (run.status === 'playing')
    drawGauge(ctx, Math.round((hazardY - puffY) / 10), (gaugeTop - top) / scale - 14, surge);
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
  if (run.rocket) drawRocket(ctx, run.rocket, t, puffX, puffY, cameraY, view);
  const ufo = ufoAt(run.rescue, t, puffX, puffY, cameraY, (gaugeTop - top) / scale);
  drawBeam(ctx, ufo, puffX, puffY, cameraY, t);
  const falling = endedAt !== null,
    v = falling ? { animation: 'fall', time: player.timeMs + ending } : sampleGameVisual(run),
    flight = ['jump', 'fall'].includes(v.animation)
      ? sampleFlightMotion(
          falling ? { vx: 0, vy: fallFrom.vy + (DEFAULT_TUNING.gravity * ending) / 1000 } : player,
          DEFAULT_TUNING,
        )
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
  if (run.rocket) drawRocketFlame(ctx, run.rocket, t, puffX, puffY, cameraY, view);
  drawUfo(ctx, ufo, cameraY, t);
  drawBanner(ctx, run.banner, t);
  // In the zone card's place, or below it if it was up when the moment came. A rescue made ready
  // by a streak's star says so, not the streak.
  const low = [
    streakCard,
    readyAt !== null && { kicker: 'THREE STARS', title: 'Rescue ready', at: readyAt },
    newBestAt !== null && { kicker: 'PAST YOUR BEST', title: 'New best', at: newBestAt },
  ]
    .filter(Boolean)
    .reduce((a, b) => (b.at >= a.at ? b : a), { at: Number.NEGATIVE_INFINITY });
  if (low.title)
    drawCallout(
      ctx,
      low.kicker,
      low.title,
      t - low.at,
      1800,
      low.high ? CALLOUT_HIGH_Y : bannerShows(run.banner, low.at) ? CALLOUT_LOW_Y : CALLOUT_Y,
    );
  // Writing the HUD invalidates its layout and paint even when the text is unchanged.
  if (run.score !== shownScore) {
    shownScore = run.score;
    $('height-score').textContent = shownScore;
  }
  // The streak shows from three landings; gold as it nears the star.
  if (run.streak !== shownStreak) {
    const meter = $('streak-meter'),
      grew = run.streak > (shownStreak ?? 0);
    shownStreak = run.streak;
    meter.hidden = shownStreak < 3;
    meter.textContent = `×${shownStreak}`;
    meter.classList.toggle('hot', shownStreak >= STREAK_FOR_STAR - 3);
    if (grew && !meter.hidden && !reduced)
      meter.animate([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 180);
  }
  // The pill glows gold while the rocket flies.
  if ((run.status === 'rocket') !== shownRocket) {
    shownRocket = run.status === 'rocket';
    document.querySelector('.height-hud').classList.toggle('rocket', shownRocket);
  }
  if (run.stars !== shownStars) {
    shownStars = run.stars;
    const meter = $('star-meter');
    meter.textContent = '★'.repeat(shownStars) + '☆'.repeat(3 - shownStars);
    meter.classList.toggle('charged', shownStars === 3);
    meter.setAttribute(
      'aria-label',
      `${shownStars} of 3 stars${shownStars === 3 ? ', rescue ready' : ''}`,
    );
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
const touchLayout = matchMedia(
  '(max-width: 720px), (pointer: coarse), (max-width: 1000px) and (max-height: 500px)',
);
touchLayout.addEventListener('change', syncUI);
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
  const beaten = over && !pilot && bestAtStart > 0 && run.score > bestAtStart;
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
  $('overlay-copy').textContent = touchLayout.matches
    ? started
      ? 'Tap Resume to keep climbing.'
      : 'Hold either side to steer. Puff hops.'
    : started
      ? 'Space to resume.'
      : '← → to steer. Puff hops.';
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
  pilot?.stop();
  pilot = null;
  run = previous = freshRun(nextSeed(run.seed));
  running = false;
  started = false;
  endedAt = null;
}
function start() {
  if (running) return;
  if (run.status === 'over') reset();
  if (!started) {
    bestAtStart = best;
    newBestAt = null;
    readyAt = null;
    streakCard = null;
    if (testStars) run = previous = { ...run, stars: testStars };
    if (testStreak) run = previous = { ...run, streak: testStreak };
    if (botNext) pilot = createAutopilot(run, viewTransform().fallLimit);
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
  // After a climb ends Puff falls out of view (a jolt as he goes), then the results show.
  if (endedAt !== null) {
    const { scale, top } = viewTransform(),
      spriteTop = fallenY(fallFrom.y, fallFrom.vy, now - endedAt) - 144 - run.cameraY,
      inView = spriteTop < (cssHeight - top) / scale;
    const elapsed = now - endedAt;
    if (!reduced && (inView || elapsed < FALL_MIN_MS) && elapsed < FALL_CAP_MS) {
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
    if (pilot && !pilot.ready(run)) {
      accumulator = Math.min(accumulator, FIXED_DT);
      break;
    }
    previous = run;
    run = stepRun(run, { axis: pilot ? pilot.axis : axis() }, FIXED_DT, viewTransform().fallLimit);
    pilot?.stepped(run);
    if (!pilot) best = Math.max(best, run.score);
    accumulator -= FIXED_DT;
    steps++;
    for (const cue of cuesFor(previous, run)) sound.cue(cue, run.streak);
    const rocket = run.status === 'rocket' && previous.status !== 'rocket';
    if (
      run.streak > previous.streak &&
      (run.streak === STREAK_FOR_STAR || STREAK_WORDS[run.streak] || rocket)
    )
      streakCard = {
        kicker: `STREAK ×${run.streak}${rocket ? ` · ROCKET +${(ROCKET_METRES * run.streak) / ROCKET_STREAK} M` : ''}`,
        title:
          STREAK_WORDS[run.streak] ??
          (rocket ? 'Lift-off' : run.stars > previous.stars ? 'Star earned' : 'Stars full'),
        at: run.player.timeMs,
        high: rocket,
      };
    if (run.stars === 3 && previous.stars < 3) {
      readyAt = run.player.timeMs;
      sound.cue('ready');
    }
    if (!pilot && newBestAt === null && bestAtStart > 0 && run.score > bestAtStart) {
      newBestAt = run.player.timeMs;
      sound.cue('best');
    }
    if (run.status === 'over') {
      endedAt = now;
      fallFrom = { y: run.player.y, vy: Math.max(0, run.player.vy) };
      previous = run;
      accumulator = 0;
      sound.danger(0);
      // The music fades as Puff falls away and the context suspends once it is quiet.
      sound.rest();
      break;
    }
  }
  // Quiet while Puff falls away and the UFO works, as after an ending, and while the rocket flies.
  if (endedAt === null)
    sound.danger(
      run.status === 'rescue' || run.status === 'rocket' ? 0 : danger(run.hazardY, run.player.y),
    );
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
}
$('sound-toggle').addEventListener('click', () => {
  sound.toggle();
  syncSound();
  // Hand focus back so Space keeps meaning start/resume, not "press this button again".
  canvas.focus({ preventScroll: true });
});
// A context the browser held suspended (no gesture at start) resumes on the next real input.
for (const type of ['pointerdown', 'keydown']) addEventListener(type, () => sound.unlock(), true);
addEventListener('keydown', (e) => {
  if (e.code !== 'KeyM' || e.metaKey || e.ctrlKey || e.altKey) return;
  sound.toggle();
  syncSound();
});
syncSound();
$('bot-toggle').addEventListener('click', (e) => {
  botNext = !botNext;
  e.currentTarget.setAttribute('aria-pressed', String(botNext));
  canvas.focus({ preventScroll: true });
});
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

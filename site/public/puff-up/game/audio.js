// Synthesized sound: no files to load. The AudioContext is made on the first Start and
// suspended while paused; after a climb the music fades out before it is suspended. A browser
// can still hold it suspended when the portfolio starts the game for the player, so any later
// tap or key resumes it. The mute choice persists like the best height. Muted, there is no
// AudioContext at all: the music's reverb alone holds ~37 MB, too much to keep running silent.
import { createMusic } from './music.js';
import { ROCKET_IGNITE_MS, ROCKET_CLIMB_MS, ROCKET_CUTOFF, ROCKET_STREAK } from './climb.js';
const MUTE_KEY = 'puff-up:muted:v1';
const LEVEL = 0.42;
// The music sits just under the effects.
const MUSIC_LEVEL = 3.2;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Cue names for what changed between two consecutive run states. Pure, so it is testable. */
export function cuesFor(previous, run) {
  const cues = [];
  if (run.status === 'over' && previous.status !== 'over') return ['caught'];
  // A rescue opens with the same catch as an ending; the UFO comes once Puff has fallen away.
  if (run.status === 'rescue') {
    if (previous.status !== 'rescue') return ['caught'];
    const arrives = run.rescue.at + run.rescue.fallMs;
    return previous.player.timeMs < arrives && run.player.timeMs >= arrives ? ['ufo'] : [];
  }
  // The rocket lights on a landing (below), blasts off once, and lands with a touchdown.
  if (run.status === 'rocket' && previous.status === 'rocket') {
    const blast = run.rocket.at + ROCKET_IGNITE_MS;
    return previous.player.timeMs < blast && run.player.timeMs >= blast ? ['blast'] : [];
  }
  const fresh = (type) => run.effects.some((e) => e.at === run.player.timeMs && e.type === type);
  if (run.player.landed) cues.push('hop');
  if (fresh('break')) cues.push('crack');
  if (fresh('spring')) cues.push('boing');
  if (fresh('kick')) cues.push('kick');
  if (fresh('spark')) cues.push('spark');
  if (fresh('streak')) cues.push('streak');
  if (run.banner && run.banner !== previous.banner) cues.push('chime');
  if (run.status === 'rocket') cues.push('ignite');
  if (fresh('touchdown')) cues.push('touchdown');
  return cues;
}

export function createSound() {
  let ctx = null,
    master = null,
    music = null,
    resting = null,
    droneGain = null,
    noiseBuffer = null,
    droneLevel = 0,
    paused = true,
    muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {}
  function ready() {
    if (ctx) return true;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    // Nearly all of it sits under 5 kHz; at 24 kHz only the noise clicks lose their top octave,
    // and the reverb's memory and every node's work halve.
    ctx = new Context({ sampleRate: 24000 });
    master = ctx.createGain();
    master.gain.value = LEVEL;
    master.connect(ctx.destination);
    music = createMusic(ctx, master);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    // The drone under everything: silent until the rising line closes in.
    const drone = ctx.createOscillator(),
      low = ctx.createBiquadFilter();
    drone.type = 'sawtooth';
    drone.frequency.value = 55;
    low.type = 'lowpass';
    low.frequency.value = 180;
    droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    drone.connect(low).connect(droneGain).connect(master);
    drone.start();
    return true;
  }
  // Muting fades out over a few ms, then closes the context, which frees the whole graph.
  function release() {
    if (!ctx) return;
    const closing = ctx;
    music.stop(0.05);
    master.gain.setTargetAtTime(0, closing.currentTime, 0.02);
    setTimeout(() => closing.close().catch(() => {}), 400);
    ctx = master = music = droneGain = noiseBuffer = null;
    droneLevel = 0;
  }
  function start() {
    paused = false;
    clearTimeout(resting);
    if (muted || !ready()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    music.start(MUSIC_LEVEL);
  }
  function tone(
    frequency,
    { type = 'sine', gain = 0.12, decay = 0.14, slide = 1, delay = 0 } = {},
  ) {
    const t = ctx.currentTime + delay,
      osc = ctx.createOscillator(),
      env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(frequency * slide, t + decay);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(env).connect(master);
    osc.start(t);
    osc.stop(t + decay + 0.02);
  }
  function burst({ frequency = 1800, q = 1.2, gain = 0.14, decay = 0.08, type = 'bandpass' } = {}) {
    const t = ctx.currentTime,
      src = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      env = ctx.createGain();
    src.buffer = noiseBuffer;
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(env).connect(master);
    src.start(t);
    src.stop(t + decay + 0.02);
  }
  // Looped noise that swells over `attack`, holds, and dies over `decay` while its filter sweeps
  // from `from` to `to` Hz: the rocket's rumble and roar.
  function roar({ from, to, gain, attack = 0.02, hold = 0, decay, q = 0.9, type = 'bandpass' }) {
    const t = ctx.currentTime,
      end = t + attack + hold + decay,
      src = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      env = ctx.createGain();
    src.buffer = noiseBuffer;
    src.loop = true;
    filter.type = type;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, end);
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + attack);
    env.gain.setValueAtTime(gain, t + attack + hold);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(filter).connect(env).connect(master);
    src.start(t);
    src.stop(end + 0.02);
  }
  const play = {
    // A faint soft note from the chord the music is on, climbing it with the streak.
    hop: (streak) => {
      const tones = music.chordTones(),
        step = Math.min(streak, tones.length * 2 - 1);
      tone(hz(tones[step % tones.length] + 12 * (1 + Math.floor(step / tones.length))), {
        gain: 0.04,
        decay: 0.16,
      });
    },
    crack: () => burst({ frequency: 2200, gain: 0.16, decay: 0.09 }),
    boing: () => tone(220, { gain: 0.14, decay: 0.22, slide: 3 }),
    kick: () => {
      burst({ frequency: 900, type: 'highpass', gain: 0.1, decay: 0.12 });
      tone(330, { type: 'square', gain: 0.05, decay: 0.08, slide: 1.5 });
    },
    spark: () => {
      tone(1319, { gain: 0.08, decay: 0.18 });
      tone(1760, { gain: 0.07, decay: 0.24, delay: 0.06 });
    },
    // A streak's star: the hop's notes run up the chord at once.
    streak: () =>
      music
        .chordTones()
        .slice(0, 3)
        .forEach((note, i) => tone(hz(note + 24), { gain: 0.05, decay: 0.3, delay: i * 0.06 })),
    chime: () => {
      tone(659, { gain: 0.1, decay: 0.5 });
      tone(988, { gain: 0.08, decay: 0.7, delay: 0.12 });
    },
    best: () =>
      [1047, 1319, 1568].forEach((f, i) => tone(f, { gain: 0.08, decay: 0.4, delay: i * 0.08 })),
    // The UFO: a warbling rise, like an old sci-fi saucer arriving.
    ufo: () => {
      for (const [f, delay] of [
        [440, 0],
        [554, 0.03],
      ]) {
        const t = ctx.currentTime + delay,
          osc = ctx.createOscillator(),
          wobble = ctx.createOscillator(),
          depth = ctx.createGain(),
          env = ctx.createGain();
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 2, t + 1.1);
        wobble.frequency.value = 9;
        depth.gain.value = f * 0.04;
        wobble.connect(depth).connect(osc.frequency);
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.045, t + 0.15);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
        osc.connect(env).connect(master);
        for (const node of [osc, wobble]) {
          node.start(t);
          node.stop(t + 1.45);
        }
      }
    },
    // The rocket: a low rumble building while it is held down, a thump as it is let go and a roar
    // that climbs with him until the engine cuts out, a whistle rising over it, then a thud on
    // touchdown and the chord's notes run up high.
    ignite: () =>
      roar({ from: 90, to: 360, gain: 0.16, attack: 0.7, decay: 0.12, q: 0.7, type: 'lowpass' }),
    blast: (streak) => {
      // As long as the engine burns: longer for a higher rocket (see climb.js).
      const burn =
        (ROCKET_CUTOFF * ROCKET_CLIMB_MS * Math.sqrt(Math.max(1, streak / ROCKET_STREAK))) / 1000;
      tone(70, { gain: 0.22, decay: 0.8, slide: 0.5 });
      roar({ from: 300, to: 2400, gain: 0.18, attack: 0.2, hold: burn - 0.5, decay: 0.3 });
      tone(330, { type: 'triangle', gain: 0.03, decay: burn, slide: 4 });
    },
    touchdown: () => {
      tone(98, { gain: 0.22, decay: 0.4, slide: 0.5 });
      burst({ frequency: 380, type: 'lowpass', gain: 0.18, decay: 0.3 });
      music
        .chordTones()
        .slice(0, 3)
        .forEach((note, i) =>
          tone(hz(note + 24), { gain: 0.05, decay: 0.35, delay: 0.08 + i * 0.07 }),
        );
    },
    ready: () =>
      [784, 988, 1175].forEach((f, i) => tone(f, { gain: 0.07, decay: 0.5, delay: i * 0.07 })),
    caught: () => {
      tone(110, { gain: 0.22, decay: 0.42, slide: 0.4 });
      burst({ frequency: 300, type: 'lowpass', gain: 0.18, decay: 0.3 });
    },
  };
  return {
    get muted() {
      return muted;
    },
    /** Call from a user gesture; resumes a paused context. */
    start,
    /** After a climb: let the music fade, then suspend. */
    rest() {
      paused = true;
      music?.stop(1.5);
      clearTimeout(resting);
      resting = setTimeout(() => ctx?.state === 'running' && ctx.suspend().catch(() => {}), 1700);
    },
    /** Resume a context the browser held suspended; never creates one. */
    unlock() {
      if (ctx && ctx.state === 'suspended' && !paused) ctx.resume().catch(() => {});
    },
    pause() {
      paused = true;
      if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
    },
    cue(name, streak = 0) {
      if (ctx && !muted && ctx.state === 'running') play[name]?.(streak);
    },
    /** 0..1 closeness of the rising line; the drone swells with its square. */
    danger(level) {
      // Reschedule only when the quantized level changes: an automation event per frame piles
      // up on the parameter's timeline and slows every later insert.
      const target = Math.round(level * level * 16) / 100;
      if (!ctx || !droneGain || target === droneLevel) return;
      droneLevel = target;
      droneGain.gain.cancelScheduledValues(ctx.currentTime);
      droneGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
      } catch {}
      // Unmuting is a tap or key press, so a mid-climb context may be made here.
      if (muted) release();
      else if (!paused) start();
      return muted;
    },
  };
}

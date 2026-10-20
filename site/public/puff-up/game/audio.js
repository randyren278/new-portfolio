// Synthesized sound: no files to load. The AudioContext is made on the first Start and
// suspended while paused or after a climb. A browser can still hold it suspended when the
// portfolio starts the game for the player, so any later tap or key resumes it. The mute choice
// persists like the best height.
const MUTE_KEY = 'puff-up:muted:v1';
const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

/** Cue names for what changed between two consecutive run states. Pure, so it is testable. */
export function cuesFor(previous, run) {
  const cues = [];
  if (run.status === 'over' && previous.status !== 'over') return ['caught'];
  const fresh = (type) => run.effects.some((e) => e.at === run.player.timeMs && e.type === type);
  if (run.player.landed) cues.push('hop');
  if (fresh('break')) cues.push('crack');
  if (fresh('spring')) cues.push('boing');
  if (fresh('kick')) cues.push('kick');
  if (fresh('spark')) cues.push('spark');
  if (run.banner && run.banner !== previous.banner) cues.push('chime');
  return cues;
}

export function createSound() {
  let ctx = null,
    master = null,
    droneGain = null,
    noiseBuffer = null,
    droneLevel = 0,
    paused = false,
    muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {}
  function ready() {
    if (ctx) return true;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    ctx = new Context();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.42;
    master.connect(ctx.destination);
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
  const play = {
    hop: (streak) => {
      const step = PENTATONIC[Math.min(streak, PENTATONIC.length - 1)];
      tone(392 * 2 ** (step / 12), { type: 'triangle', gain: 0.07, decay: 0.09 });
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
    chime: () => {
      tone(659, { gain: 0.1, decay: 0.5 });
      tone(988, { gain: 0.08, decay: 0.7, delay: 0.12 });
    },
    best: () =>
      [1047, 1319, 1568].forEach((f, i) => tone(f, { gain: 0.08, decay: 0.4, delay: i * 0.08 })),
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
    start() {
      paused = false;
      if (ready() && ctx.state !== 'running') ctx.resume().catch(() => {});
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
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.42, ctx.currentTime, 0.02);
      return muted;
    },
  };
}

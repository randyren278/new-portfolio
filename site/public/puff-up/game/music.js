// Endless generative space track, synthesized live: a drone, slow chord pads, a soft felt piano
// that leaves room to breathe, and the odd high bell, all in one long reverb. Original music in
// a gentle, spacious style; nothing is sampled. Seeded, so a variant always unfolds the same way.
const BPM = 64,
  BAR = (4 * 60) / BPM;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
// The chords, in open voicings around the middle register: Cadd9, Am7, Fmaj7, Gsus2. pad voices
// the chord; tones are its melody-range notes.
const PROGRESSION = [
  { pad: [60, 67, 74, 76], tones: [60, 62, 64, 67, 72] },
  { pad: [57, 64, 67, 72], tones: [57, 60, 64, 67, 69] },
  { pad: [53, 60, 64, 69], tones: [57, 60, 64, 65, 69] },
  { pad: [55, 62, 67, 69], tones: [55, 57, 62, 67, 69] },
];
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81]; // C major pentatonic
const RHYTHMS = [[0, 1.5, 2], [0, 2], [1, 2, 3], [0], [0, 0.5, 1, 3], [0, 3], []];
// The mix ("Drift × Hush"): pads and a soft drone as the bed, a felt piano coming and going in
// waves. waves is the piano's chance to rest in each of a cycle of 8-bar sections; the last
// section of every cycle swells the pads. The reference this was tuned against has almost
// nothing under 130 Hz, hence the high-pass on the bed.
const TRACK = Object.freeze({
  barsPerChord: 1,
  register: [62, 81],
  pianoDecay: 5,
  felt: 4.5,
  spread: 0.9,
  waves: [0.7, 0.5, 0.4, 0.55],
  swell: 1.5,
  droneNotes: [57, 64],
  highpass: 150,
  piano: 0.6,
  pad: 0.62,
  padTone: 1300,
  drone: 0.18,
  bells: 0.16,
  reverb: 5.5,
  wet: 0.58,
});

function impulse(ctx, seconds) {
  const length = Math.round(ctx.sampleRate * seconds),
    buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.4;
  }
  return buffer;
}

// lookahead: how far ahead bars are scheduled; an offline render passes its whole length.
export function createMusic(ctx, output, seed = 0x5ace, lookahead = 1.5) {
  const v = TRACK;
  let rng = seed >>> 0;
  const random = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 4294967296;
  };
  const bus = ctx.createGain(),
    mix = ctx.createGain(),
    verb = ctx.createConvolver(),
    wet = ctx.createGain(),
    dry = ctx.createGain(),
    echo = ctx.createDelay(1),
    echoBack = ctx.createGain();
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = 'highpass';
  lowCut.frequency.value = v.highpass;
  bus.gain.value = 0;
  bus.connect(lowCut).connect(output);
  verb.buffer = impulse(ctx, v.reverb);
  wet.gain.value = v.wet;
  dry.gain.value = 1 - v.wet * 0.6;
  mix.connect(dry).connect(bus);
  mix.connect(verb).connect(wet).connect(bus);
  // A soft echo just for the piano and bells.
  echo.delayTime.value = BAR / 4 + 0.03;
  echoBack.gain.value = 0.28;
  echo.connect(echoBack).connect(echo);
  echo.connect(mix);
  let drone = null,
    timer = null,
    nextBar = 0,
    bar = 0,
    lastNote = (v.register[0] + v.register[1]) >> 1,
    playing = false;
  const chordAt = (index) => PROGRESSION[Math.floor(index / v.barsPerChord) % PROGRESSION.length];

  function startDrone() {
    const gain = ctx.createGain(),
      low = ctx.createBiquadFilter(),
      wobble = ctx.createOscillator(),
      depth = ctx.createGain();
    low.type = 'lowpass';
    low.frequency.value = Math.max(320, hz(v.droneNotes[0]) * 3);
    gain.gain.value = 0.05 * v.drone;
    wobble.frequency.value = 0.07;
    depth.gain.value = 0.02 * v.drone;
    wobble.connect(depth).connect(gain.gain);
    const voices = v.droneNotes.map((midi, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = hz(midi) * (1 + (i - 1) * 0.0015);
      osc.connect(low);
      osc.start();
      return osc;
    });
    low.connect(gain).connect(mix);
    wobble.start();
    return [...voices, wobble];
  }
  function pad(chord, t, length, level) {
    const filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(v.padTone * 0.6, t);
    filter.frequency.linearRampToValueAtTime(v.padTone, t + length * 0.5);
    filter.frequency.linearRampToValueAtTime(v.padTone * 0.7, t + length + 2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.022 * level, t + 2.5);
    gain.gain.setValueAtTime(0.022 * level, t + length);
    gain.gain.linearRampToValueAtTime(0.0001, t + length + 3);
    filter.connect(gain).connect(mix);
    // Each note's two detuned voices sit left and right, which widens the pad.
    for (const midi of chord.pad)
      for (const [detune, side] of [
        [-6, -1],
        [7, 1],
      ]) {
        const osc = ctx.createOscillator(),
          pan = ctx.createStereoPanner();
        osc.type = 'sawtooth';
        osc.frequency.value = hz(midi);
        osc.detune.value = detune;
        pan.pan.value = side * v.spread;
        osc.connect(pan).connect(filter);
        osc.start(t);
        osc.stop(t + length + 3.1);
      }
  }
  // A felt piano: a soft (not striking) attack, quick bloom of overtones that darkens as it rings.
  function piano(t, midi, velocity) {
    const f = hz(midi),
      gain = ctx.createGain(),
      felt = ctx.createBiquadFilter(),
      pan = ctx.createStereoPanner();
    felt.type = 'lowpass';
    felt.frequency.setValueAtTime(f * v.felt, t);
    felt.frequency.exponentialRampToValueAtTime(f * 1.4, t + 1.6);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.11 * velocity * v.piano, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + v.pianoDecay);
    pan.pan.value = (midi - (v.register[0] + v.register[1]) / 2) / 30;
    felt.connect(gain).connect(pan);
    pan.connect(mix);
    pan.connect(echo);
    for (const [multiple, level, type] of [
      [1, 1, 'triangle'],
      [2, 0.22, 'sine'],
      [3, 0.06, 'sine'],
    ]) {
      const osc = ctx.createOscillator(),
        partial = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f * multiple;
      partial.gain.value = level;
      osc.connect(partial).connect(felt);
      osc.start(t);
      osc.stop(t + v.pianoDecay + 0.1);
    }
  }
  function bell(t, midi) {
    const gain = ctx.createGain(),
      pan = ctx.createStereoPanner();
    pan.pan.value = random() * 1.4 - 0.7;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.03, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
    gain.connect(pan);
    pan.connect(mix);
    pan.connect(echo);
    for (const [multiple, level] of [
      [1, 1],
      [2.76, 0.18],
    ]) {
      const osc = ctx.createOscillator(),
        partial = ctx.createGain();
      osc.frequency.value = hz(midi) * multiple;
      partial.gain.value = level;
      osc.connect(partial).connect(gain);
      osc.start(t);
      osc.stop(t + 4.6);
    }
  }
  function phrase(t, chord, rest) {
    if (random() < rest) return;
    const [low, high] = v.register,
      rhythm = RHYTHMS[Math.floor(random() * RHYTHMS.length)];
    for (const beat of rhythm) {
      // Wander the scale by small steps, leaning toward the chord on downbeats.
      const options = beat % 2 === 0 ? chord.tones.map((n) => n + 12) : SCALE;
      const near = options
        .map((n) => [n, Math.abs(n - lastNote) + random() * 5])
        .sort((a, b) => a[1] - b[1]);
      lastNote = near[Math.min(near.length - 1, Math.floor(random() * 3))][0];
      if (lastNote > high) lastNote -= 12;
      if (lastNote < low) lastNote += 12;
      piano(t + (beat * BAR) / 4, lastNote, 0.55 + random() * 0.45);
    }
  }
  function scheduleBar(t, index) {
    const chord = chordAt(index),
      section = Math.floor(index / 8),
      rest = v.waves[section % v.waves.length],
      swelling = section % v.waves.length === v.waves.length - 1;
    if (index % v.barsPerChord === 0)
      pad(chord, t, BAR * v.barsPerChord, v.pad * (swelling ? v.swell : 1));
    phrase(t, chord, rest);
    if (random() < v.bells) bell(t + random() * BAR, chord.tones[Math.floor(random() * 5)] + 24);
  }
  // Bars are scheduled `lookahead` seconds ahead; a timer tops the queue up four times a second.
  function tick() {
    while (nextBar < ctx.currentTime + lookahead) {
      scheduleBar(nextBar, bar++);
      nextBar += BAR;
    }
  }
  return {
    get playing() {
      return playing;
    },
    /** Pitches (MIDI) of the chord sounding now, for effects that should sit in key. */
    chordTones() {
      // nextBar is when bar index `bar` will start, so the bar sounding now is this many back.
      return chordAt(Math.max(0, bar - Math.ceil((nextBar - ctx.currentTime) / BAR))).tones;
    },
    start(level = 1, fadeSeconds = 3) {
      if (!playing) {
        playing = true;
        drone = startDrone();
        nextBar = ctx.currentTime + 0.1;
        tick();
        timer = setInterval(tick, 250);
      }
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(level, ctx.currentTime, fadeSeconds / 3);
    },
    stop(fadeSeconds = 1.5) {
      if (!playing) return;
      playing = false;
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds / 3);
      clearInterval(timer);
      const ending = drone;
      drone = null;
      setTimeout(
        () => {
          for (const osc of ending ?? []) osc.stop();
        },
        fadeSeconds * 1000 + 200,
      );
    },
  };
}

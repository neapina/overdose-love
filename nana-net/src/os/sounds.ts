// Synthesised Windows-style system sounds via WebAudio (no audio files needed).
import { getState } from '../state/store';

export type SoundName =
  | 'startup'
  | 'logon'
  | 'logoff'
  | 'shutdown'
  | 'error'
  | 'notify'
  | 'online'
  | 'offline'
  | 'message'
  | 'open'
  | 'close'
  | 'minimize'
  | 'click'
  | 'camera'
  | 'recycle'
  | 'typing';

let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  a: AudioContext,
  freq: number,
  start: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; attack?: number; release?: number; detune?: number; lp?: number } = {},
) {
  const { type = 'sine', gain = 0.18, attack = 0.01, release = dur * 0.6, detune = 0, lp } = opts;
  const o = a.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  const g = a.createGain();
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + attack);
  g.gain.setValueAtTime(gain, a.currentTime + start + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  let node: AudioNode = o;
  if (lp) {
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = lp;
    o.connect(f);
    node = f;
  }
  node.connect(g);
  g.connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

function chord(a: AudioContext, freqs: number[], start: number, dur: number, gain = 0.1) {
  freqs.forEach((f) => {
    tone(a, f, start, dur, { type: 'sine', gain, attack: 0.05, release: dur * 0.7 });
    tone(a, f * 2, start, dur, { type: 'triangle', gain: gain * 0.25, attack: 0.05, release: dur * 0.7, lp: 3000 });
  });
}

export function playSound(name: SoundName) {
  if (getState().muted) return;
  let a: AudioContext;
  try {
    a = ac();
  } catch {
    return;
  }
  switch (name) {
    case 'startup': {
      // soft Aero-like ascending pad
      chord(a, [392, 494], 0, 1.2, 0.08);
      chord(a, [523, 659], 0.35, 1.4, 0.08);
      chord(a, [587, 784], 0.7, 1.8, 0.08);
      chord(a, [784, 988, 1175], 1.1, 2.4, 0.07);
      break;
    }
    case 'logon':
      chord(a, [523, 659, 784], 0, 0.9, 0.09);
      chord(a, [659, 784, 1047], 0.3, 1.4, 0.08);
      break;
    case 'logoff':
      chord(a, [784, 988], 0, 0.7, 0.08);
      chord(a, [659, 784], 0.3, 0.8, 0.08);
      chord(a, [523, 659], 0.6, 1.2, 0.08);
      break;
    case 'shutdown':
      chord(a, [659, 784], 0, 0.8, 0.08);
      chord(a, [523, 659], 0.4, 0.9, 0.08);
      chord(a, [392, 494], 0.8, 1.6, 0.08);
      break;
    case 'error':
      tone(a, 330, 0, 0.18, { type: 'square', gain: 0.06, lp: 1200 });
      tone(a, 262, 0.18, 0.28, { type: 'square', gain: 0.06, lp: 1200 });
      break;
    case 'notify':
      tone(a, 1047, 0, 0.22, { gain: 0.14 });
      tone(a, 1319, 0.12, 0.35, { gain: 0.12 });
      break;
    case 'online':
      tone(a, 880, 0, 0.12, { gain: 0.14 });
      tone(a, 1175, 0.1, 0.14, { gain: 0.14 });
      tone(a, 1568, 0.2, 0.3, { gain: 0.12 });
      break;
    case 'offline':
      tone(a, 1175, 0, 0.12, { gain: 0.12 });
      tone(a, 880, 0.1, 0.14, { gain: 0.12 });
      tone(a, 659, 0.2, 0.3, { gain: 0.1 });
      break;
    case 'message':
      tone(a, 1568, 0, 0.09, { gain: 0.12 });
      tone(a, 2093, 0.08, 0.18, { gain: 0.1 });
      break;
    case 'open':
      tone(a, 700, 0, 0.06, { type: 'triangle', gain: 0.05, lp: 2000 });
      break;
    case 'close':
      tone(a, 500, 0, 0.07, { type: 'triangle', gain: 0.05, lp: 2000 });
      break;
    case 'minimize':
      tone(a, 600, 0, 0.05, { type: 'triangle', gain: 0.04, lp: 2000 });
      tone(a, 420, 0.05, 0.06, { type: 'triangle', gain: 0.04, lp: 2000 });
      break;
    case 'click':
      tone(a, 1800, 0, 0.025, { type: 'square', gain: 0.03, lp: 3000 });
      break;
    case 'camera': {
      // shutter: noise burst
      const buf = a.createBuffer(1, a.sampleRate * 0.12, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length / 6));
      const src = a.createBufferSource();
      src.buffer = buf;
      const g = a.createGain();
      g.gain.value = 0.2;
      src.connect(g);
      g.connect(a.destination);
      src.start();
      tone(a, 2400, 0.02, 0.05, { type: 'square', gain: 0.03 });
      break;
    }
    case 'recycle': {
      const buf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length / 4)) * 0.5;
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1800;
      const g = a.createGain();
      g.gain.value = 0.15;
      src.connect(f);
      f.connect(g);
      g.connect(a.destination);
      src.start();
      break;
    }
    case 'typing':
      tone(a, 3000, 0, 0.015, { type: 'square', gain: 0.012, lp: 4000 });
      break;
  }
}

export function unlockAudio() {
  try {
    ac();
  } catch {
    /* ignore */
  }
}

// ───────── generative lo-fi music (for the Music app) ─────────

const SCALES: Record<string, number[]> = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  pent: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
};

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGain: GainNode | null = null;

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain && ctx) {
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    const g = musicGain;
    setTimeout(() => g.disconnect(), 500);
  }
  musicGain = null;
}

export function playMusic(seed: number, dark = false) {
  stopMusic();
  let a: AudioContext;
  try {
    a = ac();
  } catch {
    return;
  }
  const master = a.createGain();
  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(0.5, a.currentTime + 1.2);
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = dark ? 900 : 1800;
  master.connect(lp);
  lp.connect(a.destination);
  musicGain = master;

  let st = seed * 7919 + 13;
  const rnd = () => ((st = (st * 9301 + 49297) % 233280) / 233280);
  const scale = SCALES[dark ? 'minor' : seed % 2 ? 'pent' : 'dorian'];
  const root = dark ? 110 : [131, 147, 165, 175][seed % 4];
  const bpm = dark ? 64 : 78 + (seed % 3) * 6;
  const beat = 60 / bpm;
  let step = 0;

  function note(freq: number, start: number, dur: number, gain: number, type: OscillatorType) {
    const o = a.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(0, a.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
    o.connect(g);
    g.connect(master);
    o.start(a.currentTime + start);
    o.stop(a.currentTime + start + dur + 0.05);
  }

  function bar() {
    if (getState().muted) return;
    // bass
    const chordIdx = [0, 3, 4, 5][Math.floor(step / 4) % 4];
    const bass = root * Math.pow(2, scale[chordIdx % scale.length] / 12);
    note(bass, 0, beat * 3.5, 0.25, 'triangle');
    note(bass * 2, 0, beat * 3.5, 0.06, 'sine');
    // chord pad
    [0, 2, 4].forEach((k) => {
      const deg = scale[(chordIdx + k) % scale.length] + (chordIdx + k >= scale.length ? 12 : 0);
      note(root * 2 * Math.pow(2, deg / 12), 0, beat * 4, 0.05, 'sine');
    });
    // melody
    for (let i = 0; i < 4; i++) {
      if (rnd() < (dark ? 0.35 : 0.7)) {
        const deg = scale[Math.floor(rnd() * scale.length)] + (rnd() < 0.3 ? 12 : 0);
        note(root * 4 * Math.pow(2, deg / 12), i * beat + (rnd() < 0.3 ? beat / 2 : 0), beat * (0.6 + rnd()), 0.09, dark ? 'sine' : 'triangle');
      }
    }
    // hat / vinyl tick
    for (let i = 0; i < 8; i++) {
      if (rnd() < 0.55) note(6000 + rnd() * 2000, (i * beat) / 2, 0.02, 0.012, 'square');
    }
    step++;
  }
  bar();
  musicTimer = setInterval(bar, beat * 4 * 1000);
}

export function musicPlaying() {
  return musicTimer !== null;
}

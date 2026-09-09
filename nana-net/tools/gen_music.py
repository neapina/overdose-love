"""Procedural lo-fi tracks for NANA.NET.

Renders WAV with numpy, then encodes to MP3 with ffmpeg (libmp3lame).
    python3 tools/gen_music.py            -> public/assets/music/*.mp3
Everything here is synthesised from scratch; nothing is sampled.
"""

from __future__ import annotations

import os
import subprocess
import sys
import wave
from dataclasses import dataclass, field

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'music')

# ---------------------------------------------------------------- dsp helpers


def midi(n: float) -> float:
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n: int, a: float, d: float, s: float, r: float, sustain_len: float) -> np.ndarray:
    """ADSR in seconds -> array of n samples."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    a_n, d_n, s_n = int(a * SR), int(d * SR), int(sustain_len * SR)
    r_n = n - a_n - d_n - s_n
    i = 0
    if a_n > 0:
        out[i : i + a_n] = np.linspace(0, 1, a_n)
        i += a_n
    if d_n > 0:
        out[i : i + d_n] = np.linspace(1, s, d_n)
        i += d_n
    if s_n > 0:
        out[i : i + s_n] = s
        i += s_n
    if r_n > 0:
        out[i:] = s * np.exp(-4 * np.linspace(0, 1, r_n))
    return out * (t >= 0)


def lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """one-pole low-pass, cheap and warm."""
    rc = 1.0 / (2 * np.pi * cutoff)
    alpha = (1 / SR) / (rc + 1 / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha * (x[i] - acc)
        y[i] = acc
    return y


def lowpass_fast(x: np.ndarray, cutoff: float) -> np.ndarray:
    # vectorised via FFT — fine for offline rendering
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (f / cutoff) ** 4)
    return np.fft.irfft(X * H, n=len(x))


def highpass_fast(x: np.ndarray, cutoff: float) -> np.ndarray:
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    H = 1 / np.sqrt(1 + (cutoff / np.maximum(f, 1e-6)) ** 4)
    return np.fft.irfft(X * H, n=len(x))


def reverb(x: np.ndarray, decay: float = 2.2, mix: float = 0.35, rng: np.random.Generator | None = None) -> np.ndarray:
    """simple convolution with exponentially decaying noise."""
    rng = rng or np.random.default_rng(7)
    n = int(decay * SR)
    ir = rng.standard_normal(n) * np.exp(-5 * np.linspace(0, 1, n))
    ir = lowpass_fast(ir, 3500)
    ir /= np.sqrt(np.sum(ir**2)) + 1e-9
    wet = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[: len(x)]
    return x * (1 - mix) + wet * mix * 3


def wow(x: np.ndarray, depth: float = 0.0025, rate: float = 0.35) -> np.ndarray:
    """tape wow/flutter — slow pitch wobble via resampling."""
    n = len(x)
    t = np.arange(n)
    mod = depth * SR / (2 * np.pi * rate) * np.sin(2 * np.pi * rate * t / SR)
    idx = np.clip(t + mod, 0, n - 1)
    return np.interp(idx, t, x)


def soft_clip(x: np.ndarray, drive: float = 1.2) -> np.ndarray:
    return np.tanh(x * drive) / np.tanh(drive)


# ---------------------------------------------------------------- instruments


def pluck(freq: float, dur: float, vel: float = 1.0, tone: float = 1.0) -> np.ndarray:
    """soft electric-piano-ish pluck."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    det = 1 + 0.0015 * np.sin(2 * np.pi * 0.7 * t)
    x = np.sin(2 * np.pi * freq * det * t)
    x += 0.35 * tone * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-6 * t)
    x += 0.15 * tone * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-9 * t)
    x += 0.08 * np.sin(2 * np.pi * freq * 0.5 * t)
    e = np.exp(-2.8 * t) * (1 - np.exp(-200 * t))
    return x * e * vel * 0.5


def pad(freqs: list[float], dur: float, vel: float = 1.0, cutoff: float = 900) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in freqs:
        for d in (-0.4, 0.0, 0.4):
            ff = f * 2 ** (d / 1200 * 6)
            saw = 2 * ((ff * t) % 1) - 1
            x += saw * 0.18
        x += 0.25 * np.sin(2 * np.pi * f * t)
    x = lowpass_fast(x, cutoff)
    e = env(n, 0.9, 0.4, 0.8, 0.0, max(0.0, dur - 1.3 - 1.2))
    return x * e * vel * 0.28


def bass(freq: float, dur: float, vel: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-3 * t)
    e = np.exp(-1.6 * t) * (1 - np.exp(-300 * t))
    return soft_clip(x * e * vel * 0.7, 1.6)


def kick(vel: float = 1.0) -> np.ndarray:
    n = int(0.28 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-28 * t) + 42
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-11 * t)
    return soft_clip(x * vel * 0.9, 1.8)


def hat(rng: np.random.Generator, vel: float = 1.0, closed: bool = True) -> np.ndarray:
    n = int((0.05 if closed else 0.18) * SR)
    x = rng.standard_normal(n) * np.exp(-(70 if closed else 18) * np.arange(n) / SR)
    return highpass_fast(x, 6500) * vel * 0.18


def snare(rng: np.random.Generator, vel: float = 1.0) -> np.ndarray:
    n = int(0.16 * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-22 * t) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-30 * t) * 0.5
    return highpass_fast(x, 400) * vel * 0.45


def vinyl(n: int, rng: np.random.Generator, amount: float = 1.0) -> np.ndarray:
    crackle = rng.standard_normal(n) * 0.004
    pops = np.zeros(n)
    for i in rng.integers(0, n, size=int(n / SR * 2.5)):
        L = min(n - i, int(0.004 * SR))
        pops[i : i + L] += rng.standard_normal(L) * np.exp(-np.linspace(0, 8, L)) * 0.08
    return (lowpass_fast(crackle, 5000) + pops) * amount


def rain(n: int, rng: np.random.Generator, amount: float = 1.0) -> np.ndarray:
    x = rng.standard_normal(n)
    x = highpass_fast(lowpass_fast(x, 6000), 900)
    slow = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * np.arange(n) / SR)
    return x * slow * 0.012 * amount


# ---------------------------------------------------------------- composition


@dataclass
class Track:
    name: str
    bpm: float
    root: int  # midi
    scale: list[int]
    chords: list[list[int]]  # degrees per bar, relative to scale
    seconds: float
    drums: bool = True
    swing: float = 0.0
    pad_cut: float = 900
    dark: bool = False
    rain: float = 0.0
    seed: int = 1
    melody_density: float = 0.55
    extra: dict = field(default_factory=dict)


def place(buf: np.ndarray, x: np.ndarray, at: float) -> None:
    i = int(at * SR)
    if i >= len(buf):
        return
    L = min(len(x), len(buf) - i)
    buf[i : i + L] += x[:L]


def render(tr: Track) -> np.ndarray:
    rng = np.random.default_rng(tr.seed)
    n = int(tr.seconds * SR)
    beat = 60 / tr.bpm
    bar = beat * 4
    bars = int(np.ceil(tr.seconds / bar)) + 1

    pads = np.zeros(n)
    keys = np.zeros(n)
    low = np.zeros(n)
    drums = np.zeros(n)

    def deg(d: int, octave: int = 0) -> float:
        return midi(tr.root + tr.scale[d % len(tr.scale)] + 12 * (d // len(tr.scale)) + 12 * octave)

    prev_note = None
    for b in range(bars):
        chord = tr.chords[b % len(tr.chords)]
        t0 = b * bar
        # pad: chord tones
        pads_f = [deg(d) for d in chord]
        place(pads, pad(pads_f, bar * 1.05, 0.9 if not tr.dark else 0.7, tr.pad_cut), t0)
        # bass: root, sometimes fifth on beat 3
        place(low, bass(deg(chord[0], -2), beat * 1.8, 0.9), t0)
        if rng.random() < 0.5:
            place(low, bass(deg(chord[0] + (2 if not tr.dark else 0), -2), beat * 1.4, 0.6), t0 + beat * 2.5)
        # keys: arpeggio / broken chord with melody on top
        steps = 8
        for k in range(steps):
            t = t0 + k * beat / 2 + (tr.swing * beat / 2 if k % 2 else 0)
            if rng.random() < tr.melody_density:
                if rng.random() < 0.55:
                    d = chord[rng.integers(len(chord))]
                    octv = 0
                else:
                    # melodic step from previous note within scale
                    base = prev_note if prev_note is not None else chord[0] + len(tr.scale)
                    d = base + int(rng.integers(-2, 3))
                    d = max(chord[0], min(chord[0] + 2 * len(tr.scale), d))
                    octv = 0
                prev_note = d
                vel = 0.55 + 0.35 * rng.random()
                place(keys, pluck(deg(d, octv + 1), beat * (1.5 + rng.random()), vel, tone=0.6 if tr.dark else 1.0), t)
        # drums
        if tr.drums:
            for k in range(4):
                t = t0 + k * beat
                if k in (0, 2) or (k == 3 and rng.random() < 0.25):
                    place(drums, kick(0.9 if k == 0 else 0.7), t + (0.012 if k == 2 else 0))
                if k in (1, 3):
                    place(drums, snare(rng, 0.55), t + 0.01)
                for h in range(2):
                    th = t + h * beat / 2 + (tr.swing * beat / 2 if h else 0)
                    place(drums, hat(rng, 0.5 + 0.3 * rng.random(), closed=not (k == 3 and h == 1)), th)

    mix = pads + keys * 0.9 + low + drums * (0.75 if not tr.dark else 0.45)
    mix = wow(mix, depth=0.003 if not tr.dark else 0.006, rate=0.3)
    mix = reverb(mix, decay=2.4 if not tr.dark else 4.0, mix=0.3 if not tr.dark else 0.45, rng=rng)
    mix = lowpass_fast(mix, 6500 if not tr.dark else 4200)
    mix += vinyl(n, rng, 1.0 if not tr.dark else 0.6)
    if tr.rain:
        mix += rain(n, rng, tr.rain)
    if tr.dark:
        # slow sub drone + faint reversed swells
        t = np.arange(n) / SR
        drone = np.sin(2 * np.pi * midi(tr.root - 24) * t) * 0.12 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * t))
        mix += drone
        rev = reverb(keys[::-1], decay=3.0, mix=1.0, rng=rng)[::-1] * 0.25
        mix += rev
    # fades
    fade_in = int(1.5 * SR)
    fade_out = int(4.0 * SR)
    mix[:fade_in] *= np.linspace(0, 1, fade_in)
    mix[-fade_out:] *= np.linspace(1, 0, fade_out)
    mix = soft_clip(mix / (np.max(np.abs(mix)) + 1e-9) * 0.9, 1.1)
    return mix


def write_wav(path: str, x: np.ndarray) -> None:
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    stereo = np.stack([pcm, pcm], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())


MAJ = [0, 2, 4, 5, 7, 9, 11]
MIN = [0, 2, 3, 5, 7, 8, 10]
DOR = [0, 2, 3, 5, 7, 9, 10]

TRACKS = [
    Track('01_yoru_no_machi', 78, 57, DOR, [[0, 2, 4, 6], [3, 5, 7], [4, 6, 8], [1, 3, 5]], 96, swing=0.12, seed=11, rain=0.0),
    Track('02_after_the_rain', 70, 60, MAJ, [[0, 2, 4, 6], [5, 7, 9], [3, 5, 7, 9], [4, 6, 8]], 88, drums=False, seed=22, rain=0.8, pad_cut=1200, melody_density=0.45),
    Track('03_kaeri_michi', 84, 62, MAJ, [[3, 5, 7], [4, 6, 8], [0, 2, 4, 6], [5, 7, 9]], 92, swing=0.08, seed=33, pad_cut=1000),
    Track('04_sleepless', 66, 55, MIN, [[0, 2, 4], [5, 7, 9], [3, 5, 7], [4, 6, 8]], 100, drums=True, seed=44, pad_cut=700, melody_density=0.4),
    Track('track07', 58, 50, MIN, [[0, 2, 4], [0, 2, 4], [5, 7, 9], [1, 3, 5]], 104, drums=False, dark=True, seed=77, pad_cut=500, melody_density=0.3),
]


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or None
    for tr in TRACKS:
        if only and tr.name not in only:
            continue
        print('rendering', tr.name)
        x = render(tr)
        wav = os.path.join(OUT, tr.name + '.wav')
        write_wav(wav, x)
        mp3 = os.path.join(OUT, tr.name + '.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-q:a', '5', mp3], check=True)
        os.remove(wav)
        print('  ->', mp3, os.path.getsize(mp3) // 1024, 'KB')


if __name__ == '__main__':
    main()

"""Makes an original French-house-style test track (123 BPM, about 62 s) for
the screenshots, so the visualiser reacts to something that sounds like real
music instead of the plain test tone. Everything here is synthesised.

  python test/song/make-track.py  ->  test/out/song.wav  (48 kHz, 16-bit stereo)

Arrangement (32 bars):
  bars 0-7    intro: filtered chords and hats, the filter slowly opening
  bars 8-15   full groove: kick, bass, claps, chords
  bars 16-19  break: no kick, the filter sweeps up
  bars 20-31  drop: everything, filter wide open
"""
import os
import wave
import numpy as np

SR = 48000
BPM = 123
BEAT = 60 / BPM
BARS = 32
N = int(BARS * 4 * BEAT * SR)
t = np.arange(N) / SR
beat_pos = t / BEAT                       # in beats
bar = (beat_pos // 4).astype(int)
rng = np.random.default_rng(7)


def section(lo, hi):
    return ((bar >= lo) & (bar < hi)).astype(float)


intro, groove, brk, drop = section(0, 8), section(8, 16), section(16, 20), section(20, 32)
kick_on = groove + drop
bar_f = beat_pos / 4

# Filter cutoff for the chord loop (Hz): opens over the intro, wobbles in the
# groove, sweeps up through the break, wide in the drop.
cut = (
    intro * (300 + 900 * (bar_f / 8) ** 2)
    + groove * (1600 + 600 * np.sin(2 * np.pi * bar_f / 4))
    + brk * (500 + 5000 * ((bar_f - 16) / 4) ** 2)
    + drop * 5200
)


def additive(freq_fn, start, length, cutoff, harmonics, shape="saw"):
    """Additive saw/square note with a soft lowpass per harmonic."""
    out = np.zeros(length)
    tt = np.arange(length) / SR
    f0 = freq_fn
    c = cutoff[start:start + length]
    for h in range(1, harmonics + 1):
        if shape == "square" and h % 2 == 0:
            continue
        fh = f0 * h
        if fh > 16000:
            break
        amp = 1 / h
        lp = 1 / np.sqrt(1 + (fh / c) ** 4)
        out += amp * lp * np.sin(2 * np.pi * fh * tt + h * 0.3)
    return out


mix = np.zeros(N)
side = np.ones(N)  # sidechain pump from the kick

# --- kick -----------------------------------------------------------------
klen = int(0.35 * SR)
kt = np.arange(klen) / SR
kfreq = 48 + 110 * np.exp(-kt * 28)
kick = np.sin(2 * np.pi * np.cumsum(kfreq) / SR) * np.exp(-kt * 7.5)
kick[:120] += rng.uniform(-0.6, 0.6, 120) * np.linspace(1, 0, 120)  # click
pump = 1 - 0.75 * np.exp(-np.arange(int(BEAT * SR)) / SR * 9)
for b in range(BARS * 4):
    s = int(b * BEAT * SR)
    if kick_on[min(s, N - 1)]:
        e = min(N, s + klen)
        mix[s:e] += 0.95 * kick[: e - s]
        e2 = min(N, s + len(pump))
        side[s:e2] = np.minimum(side[s:e2], pump[: e2 - s])

# --- chords (disco loop: Am9, D9, Gmaj9, Em9; one bar each) ---------------
def hz(m):
    return 440 * 2 ** ((m - 69) / 12)

chords = [[57, 60, 64, 67, 71], [50, 57, 60, 64, 66], [55, 59, 62, 66, 69], [52, 55, 59, 62, 66]]
step = BEAT / 2  # stabs on every eighth, with a swing-ish pattern
pattern = [1, 0, 1, 1, 0, 1, 0, 1]
for b in range(BARS):
    ch = chords[b % 4]
    for i, on in enumerate(pattern):
        if not on:
            continue
        s = int((b * 4 * BEAT + i * step) * SR)
        ln = int(step * 0.9 * SR)
        if s + ln > N:
            continue
        env = np.minimum(1, np.arange(ln) / 200) * np.exp(-np.arange(ln) / SR * 5)
        note = sum(additive(hz(m), s, ln, cut, 24) for m in ch) / len(ch)
        mix[s:s + ln] += 0.55 * note * env * side[s:s + ln]

# --- bass (16ths, octave funk) -------------------------------------------
roots = [45, 38, 43, 40]
bpat = [0, None, 12, 0, None, 0, 12, None, 0, None, 12, 0, 7, None, 12, 10]
s16 = BEAT / 4
bass_on = groove + drop + 0.5 * brk
for b in range(BARS):
    for i, iv in enumerate(bpat):
        if iv is None:
            continue
        s = int((b * 4 * BEAT + i * s16) * SR)
        ln = int(s16 * 0.85 * SR)
        if s + ln > N or bass_on[s] == 0:
            continue
        env = np.minimum(1, np.arange(ln) / 80) * np.exp(-np.arange(ln) / SR * 9)
        bc = np.full(N, 900.0)
        note = additive(hz(roots[b % 4] + iv), s, ln, bc, 14, "square")
        mix[s:s + ln] += 0.45 * bass_on[s] * note * env * side[s:s + ln]

# --- claps on 2 and 4, hats on the off-beats ------------------------------
def hp_noise(n, cutoff_alpha):
    x = rng.uniform(-1, 1, n)
    return x - np.convolve(x, np.ones(cutoff_alpha) / cutoff_alpha, mode="same")

clen = int(0.18 * SR)
clap = hp_noise(clen, 6)
ce = np.zeros(clen)
for d in (0, 0.011, 0.022):  # three quick hits like a real clap
    o = int(d * SR)
    ce[o:] += np.exp(-np.arange(clen - o) / SR * 30)
clap *= ce * 0.5
hlen = int(0.09 * SR)
hat = hp_noise(hlen, 2) * np.exp(-np.arange(hlen) / SR * 35)
for b in range(BARS * 4):
    s = int(b * BEAT * SR)
    if b % 4 in (1, 3) and (groove + drop + brk * 0.6)[s] > 0:
        e = min(N, s + clen)
        mix[s:e] += clap[: e - s] * (0.6 if brk[s] else 1)
    hs = int((b + 0.5) * BEAT * SR)
    if hs + hlen < N:
        mix[hs:hs + hlen] += 0.35 * hat
    for q in (0.25, 0.75):
        qs = int((b + q) * BEAT * SR)
        if qs + hlen < N and (groove + drop)[qs]:
            mix[qs:qs + hlen // 2] += 0.12 * hat[: hlen // 2]

# --- master: soft clip, normalise, write ----------------------------------
mix = np.tanh(mix * 1.4)
mix /= np.max(np.abs(mix)) * 1.05
out = os.path.join(os.path.dirname(__file__), "..", "out", "song.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
pcm = (mix * 30000).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(stereo.tobytes())
print(out, f"{N / SR:.1f} s")

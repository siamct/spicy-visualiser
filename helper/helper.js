// Spicy Visualiser helper
// Listens to Spotify's audio output on this PC, works out how loud each
// frequency band is, and sends that to the Spicy Visualiser extension inside
// Spotify over a local connection (127.0.0.1 only, nothing leaves your PC).
//
// Run:            node helper.js
// Test (no audio): node helper.js --test-tone

"use strict";

const { execFile } = require("node:child_process");
const os = require("node:os");
const { WebSocketServer } = require("ws");

const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "").split("=")[1]) || 47823; // --port: tests only
const SAMPLE_RATE = 48000;
const BANDS = 64;
const TEST_SONG = process.argv.includes("--test-song"); // fake song with a quiet build-up and a drop
const TEST_TONE = TEST_SONG || process.argv.includes("--test-tone");

// With --log-file the helper runs hidden, so it writes to helper.log instead.
const fs = require("node:fs");
const path = require("node:path");
const LOG_FILE = process.argv.includes("--log-file") ? path.join(__dirname, "helper.log") : null;
// Started from its Start-menu shortcut (which also opens Spotify with
// --open-spotify), it runs in a small minimised window and closes itself once
// Spotify has been closed for IDLE_EXIT_MS. --stay keeps it running (tests).
const IDLE_EXIT_MS = (Number((process.argv.find((a) => a.startsWith("--idle-exit=")) || "").split("=")[1]) || 20) * 1000;
const STAY = TEST_TONE || process.argv.includes("--stay");
const OPEN_SPOTIFY = process.argv.includes("--open-spotify");
if (!LOG_FILE) {
  process.title = "Spicy Visualiser helper";
  console.log("Spicy Visualiser helper - lets the visualiser hear the music.");
  console.log("Close this window to turn it off. It also closes by itself when Spotify closes.");
  console.log("");
}
function log(...args) {
  const line = new Date().toLocaleString() + " - " + args.join(" ");
  if (LOG_FILE) {
    try {
      fs.appendFileSync(LOG_FILE, line + "\n");
    } catch (_) {}
  } else console.log(line);
}

// Hidden (started with Windows): a tiny watcher process runs the real helper
// as a child and starts it again if it ever crashes, so it's always there.
// The last run's log is kept as helper.old.log.
const CHILD = process.argv.includes("--child");
if (LOG_FILE && !CHILD && !TEST_TONE) {
  try {
    if (fs.existsSync(LOG_FILE)) fs.renameSync(LOG_FILE, path.join(__dirname, "helper.old.log"));
  } catch (_) {}
  const args = [__filename, ...process.argv.slice(2), "--child"];
  let starts = [];
  const run = () => {
    const child = require("node:child_process").spawn(process.execPath, args, { stdio: "ignore", windowsHide: true });
    child.on("exit", (code) => {
      if (code === 0) process.exit(0); // closed on purpose (already running, Spotify closed...)
      starts = starts.filter((t) => Date.now() - t < 3600000);
      if (starts.length >= 30) {
        log("The helper keeps crashing - giving up until the next restart.");
        return process.exit(1);
      }
      log(`The helper stopped unexpectedly (code ${code}) - starting it again.`);
      setTimeout(() => { starts.push(Date.now()); run(); }, starts.length < 3 ? 2000 : 15000);
    });
  };
  starts.push(Date.now());
  run();
  process.on("SIGINT", () => process.exit(0));
  return; // the watcher does nothing else
}
// The real helper: any unexpected error is written down, then it exits so the
// watcher starts a fresh copy.
process.on("uncaughtException", (e) => {
  log("Crashed:", (e && e.stack) || e);
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  log("Crashed:", (e && e.stack) || e);
  process.exit(1);
});

// ---------------------------------------------------------------------------
// Audio buffer (mono, most recent samples)
// ---------------------------------------------------------------------------
const RING = 16384;
const ring = new Float32Array(RING);
let onAudio = () => {};
let ringPos = 0;
let lastAudioAt = 0;

function pushPcm(chunk) {
  // 16-bit signed little-endian, stereo interleaved.
  const frames = Math.floor(chunk.length / 4);
  for (let i = 0; i < frames; i++) {
    const l = chunk.readInt16LE(i * 4);
    const r = chunk.readInt16LE(i * 4 + 2);
    ring[ringPos] = (l + r) / 65536;
    ringPos = (ringPos + 1) % RING;
  }
  lastAudioAt = Date.now();
  onAudio();
}

// ---------------------------------------------------------------------------
// FFT. Two sizes: a long one for sharp bass detail, a short one so the
// mids and treble react quickly (the same idea cava uses).
// ---------------------------------------------------------------------------
function makeFFT(n, len = n) {
  // len = how many recent samples to use; the rest is zero padding.
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  const win = new Float32Array(n);
  for (let i = 0; i < len; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (len - 1));
  const rev = new Uint32Array(n);
  const bits = Math.log2(n);
  for (let i = 0; i < n; i++) {
    let x = i, y = 0;
    for (let b = 0; b < bits; b++) { y = (y << 1) | (x & 1); x >>= 1; }
    rev[i] = y;
  }
  const mag = new Float32Array(n / 2);
  function run() {
    // Fill from the newest n samples of the ring buffer.
    const start = (ringPos - len + RING) % RING;
    for (let i = 0; i < n; i++) {
      re[i] = i < len ? ring[(start + i) % RING] * win[i] : 0;
      im[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      const j = rev[i];
      if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = (-2 * Math.PI) / size;
      for (let s = 0; s < n; s += size) {
        for (let k = 0; k < half; k++) {
          const a = step * k, wr = Math.cos(a), wi = Math.sin(a);
          const i = s + k, j = i + half;
          const tr = re[j] * wr - im[j] * wi, ti = re[j] * wi + im[j] * wr;
          re[j] = re[i] - tr; im[j] = im[i] - ti; re[i] += tr; im[i] += ti;
        }
      }
    }
    const norm = 4 / len;
    for (let k = 0; k < n / 2; k++) mag[k] = Math.hypot(re[k], im[k]) * norm;
  }
  // Average magnitude between two frequencies (interpolated when narrower than a bin).
  function band(f0, f1) {
    const hz = SAMPLE_RATE / n;
    const b0 = f0 / hz, b1 = f1 / hz;
    if (b1 - b0 < 1) {
      const c = (b0 + b1) / 2;
      const lo = Math.floor(c), fr = c - lo;
      return mag[lo] * (1 - fr) + mag[Math.min(lo + 1, n / 2 - 1)] * fr;
    }
    let sum = 0, cnt = 0;
    for (let k = Math.floor(b0); k <= Math.min(Math.ceil(b1), n / 2 - 1); k++) { sum += mag[k]; cnt++; }
    return sum / cnt;
  }
  return { run, band, mag };
}
const bigFFT = makeFFT(4096);
const smallFFT = makeFFT(1024);
// Very long FFT for the deep-bass ring (Trap Nation style): ~2.9 Hz per bin,
// 40 bins from ~23 Hz to ~140 Hz, mapped over a narrow loudness range so it
// pumps hard on kicks.
// 6144 recent samples (128 ms, so little delay) zero-padded to 16384 for smooth bins.
const subFFT = makeFFT(16384, 6144);
const LO_START = 8, LO_COUNT = 40;
let loPeak = -18; // dB reference for the deep-bass ring; follows loud parts quickly, falls back very slowly

// Up to 12 kHz: above that most music has almost nothing, which left the
// right-hand side of the bars empty.
const MIN_HZ = 40, MAX_HZ = 12000, SPLIT_HZ = 250;
const edges = [];
for (let b = 0; b <= BANDS; b++) edges.push(MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, b / BANDS));
const centre = (b) => Math.sqrt(edges[b] * edges[b + 1]);
// Gentle lift for higher bands so the treble isn't invisible next to the
// bass, while keeping kicks clearly the biggest thing on screen.
const weight = Array.from({ length: BANDS }, (_, b) => Math.pow(Math.max(1, centre(b) / 80), 0.45));
// Auto balance: learns how loud each band usually is in this song (over ~8 s)
// and lifts the quiet ones (mostly treble) towards the rest, so the right side
// moves too. Kicks still stand out because they jump above their usual level.
const bandAvg = new Float32Array(BANDS).fill(0);
const eq = new Float32Array(BANDS).fill(1);
const KICK_BANDS = [], SNARE_BANDS = [];
for (let b = 0; b < BANDS; b++) {
  const c = centre(b);
  if (c >= 40 && c <= 130) KICK_BANDS.push(b);
  if (c >= 1500 && c <= 7000) SNARE_BANDS.push(b);
}

// ---------------------------------------------------------------------------
// Onset (beat) detector: spectral flux with an adaptive threshold
// ---------------------------------------------------------------------------
function makeOnset(minGapMs, k) {
  const hist = [];
  let prev = 0, lastAt = 0;
  return (value, now) => {
    const flux = Math.max(0, value - prev);
    prev = value;
    hist.push(flux);
    if (hist.length > 60) hist.shift(); // ~1 second
    const mean = hist.reduce((a, b) => a + b, 0) / hist.length;
    const sd = Math.sqrt(hist.reduce((a, b) => a + (b - mean) * (b - mean), 0) / hist.length);
    const max = Math.max(...hist);
    if (flux > mean + k * sd && flux > 0.02 && now - lastAt > minGapMs) {
      lastAt = now;
      return Math.min(1, 0.35 + 0.65 * (flux / (max || 1)));
    }
    return 0;
  };
}
const kickOnset = makeOnset(140, 1.6);
const snareOnset = makeOnset(110, 1.8);

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------
let gain = 4; // auto-sensitivity (like cava's autosens)
let peakLevel = 0.05;

function analyse() {
  let sumSq = 0;
  for (let i = 0; i < 1024; i++) {
    const s = ring[(ringPos - 1 - i + RING) % RING];
    sumSq += s * s;
  }
  const rms = Math.sqrt(sumSq / 1024);
  const silent = rms < 0.0006;
  const now = Date.now();

  bigFFT.run();
  smallFFT.run();
  const raw = new Array(BANDS);
  let max = 0;
  for (let b = 0; b < BANDS; b++) {
    const f = centre(b) < SPLIT_HZ ? bigFFT : smallFFT;
    const m = f.band(edges[b], edges[b + 1]) * weight[b];
    raw[b] = m;
  }
  if (!silent) {
    let all = 0;
    for (let b = 0; b < BANDS; b++) {
      bandAvg[b] += (raw[b] - bandAvg[b]) * 0.002; // ~8 s at 60 updates/s
      all += bandAvg[b];
    }
    all /= BANDS;
    for (let b = 0; b < BANDS; b++) {
      const want = Math.pow(all / (bandAvg[b] + 1e-7), 0.65);
      eq[b] += (Math.max(0.7, Math.min(6, want)) - eq[b]) * 0.01;
    }
  }
  const bands = raw.map((m, b) => {
    const v = Math.pow(m * eq[b] * gain, 0.8);
    if (v > max) max = v;
    return Math.min(1, v);
  });

  // Auto-sensitivity: back off quickly when bars hit the top, creep up
  // slowly in quiet parts. Keeps the shape (so kicks stay tallest).
  if (!silent) {
    if (max > 1) gain *= 0.97;
    else if (max < 0.7) gain *= 1.003;
    gain = Math.max(0.05, Math.min(400, gain));
  }

  peakLevel = rms > peakLevel ? rms : Math.max(0.004, peakLevel * 0.9985);
  const level = silent ? 0 : Math.min(1, rms / peakLevel);

  let kickE = 0, snareE = 0;
  for (const b of KICK_BANDS) kickE += raw[b] * gain;
  for (const b of SNARE_BANDS) snareE += raw[b] * gain;
  kickE /= KICK_BANDS.length;
  snareE /= SNARE_BANDS.length;
  const k = silent ? 0 : kickOnset(kickE, now);
  const s = silent ? 0 : snareOnset(snareE, now);

  // The very long FFT is only worked out when a visible style needs it.
  const wantLo = needLo();
  if (wantLo) subFFT.run();
  const lo = new Array(LO_COUNT);
  let loMax = -200;
  const loDb = [];
  for (let i = 0; i < LO_COUNT; i++) {
    const db = 20 * Math.log10(subFFT.mag[LO_START + i] + 1e-9);
    loDb.push(db);
    if (db > loMax) loMax = db;
  }
  loPeak = loMax > loPeak ? loPeak + (loMax - loPeak) * 0.3 : Math.max(-30, loPeak - 0.004);
  for (let i = 0; i < LO_COUNT; i++) lo[i] = silent ? 0 : Math.max(0, Math.min(1, (loDb[i] - (loPeak - 18)) / 18));

  const r3 = (x) => Math.round(x * 1000) / 1000;
  // Absolute values too (not auto-levelled), so styles like NCS and Trap Nation
  // can use a fixed loudness scale like the originals do:
  //  a  = loudness (RMS of the last ~21 ms, 0..1 where 1 is full scale)
  //  ld = deep-bass ring in dB (0 dB = a full-scale sine)
  return {
    b: silent ? bands.map(() => 0) : bands.map(r3),
    lo: wantLo ? lo.map(r3) : undefined,
    ld: wantLo ? loDb.map((d) => Math.round(Math.max(-90, d) * 10) / 10) : undefined,
    a: r3(silent ? 0 : rms),
    l: r3(level),
    k: r3(k),
    s: r3(s),
  };
}

// ---------------------------------------------------------------------------
// Capturing Spotify
// ---------------------------------------------------------------------------
let capture = null;
let capturedPid = null;
let testTimer = null;

function windowsBuild() {
  const parts = os.release().split(".");
  return parseInt(parts[2] || "0", 10);
}

function findSpotifyPid() {
  return new Promise((resolve) => {
    if (process.platform !== "win32") return resolve(null);
    const ps =
      "Get-CimInstance Win32_Process -Filter \"Name='Spotify.exe'\" | ForEach-Object { \"$($_.ProcessId),$($_.ParentProcessId)\" }";
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { windowsHide: true }, (err, out) => {
      if (err || !out) return resolve(null);
      const rows = out
        .trim()
        .split(/\r?\n/)
        .map((l) => l.split(",").map(Number))
        .filter((r) => r[0]);
      const pids = new Set(rows.map((r) => r[0]));
      // The main Spotify process is the one whose parent isn't Spotify.
      const root = rows.find((r) => !pids.has(r[1]));
      resolve(root ? root[0] : rows.length ? rows[0][0] : null);
    });
  });
}

function startTestTone() {
  // Fake music: a kick drum every 0.5 s plus a wandering chord.
  let t = 0;
  testTimer = setInterval(() => {
    const n = 480; // 10 ms
    const buf = Buffer.alloc(n * 4);
    for (let i = 0; i < n; i++, t++) {
      const sec = t / SAMPLE_RATE;
      const beatPhase = sec % 0.5;
      const kick = Math.sin(2 * Math.PI * (55 + 90 * Math.exp(-beatPhase * 30)) * sec) * Math.exp(-beatPhase * 9);
      const chord =
        0.25 * Math.sin(2 * Math.PI * 220 * sec) +
        0.18 * Math.sin(2 * Math.PI * (330 + 40 * Math.sin(sec)) * sec) +
        0.12 * Math.sin(2 * Math.PI * 1760 * sec) * (0.5 + 0.5 * Math.sin(sec * 3));
      const hat = (Math.random() - 0.5) * 0.15 * Math.exp(-((sec + 0.25) % 0.25) * 40);
      const snarePhase = (sec + 0.5) % 1.0;
      const snare = (Math.random() - 0.5) * 0.7 * Math.exp(-snarePhase * 18);
      // --test-song: 10 s of full beat, 6 s quiet build-up (pads only), then the drop.
      let mixv = 0.6 * kick + chord + hat + snare;
      if (TEST_SONG) {
        const songT = sec % 16;
        if (songT >= 10) mixv = chord * 0.25 * (0.3 + (songT - 10) / 8);
      }
      const v = Math.max(-1, Math.min(1, mixv)) * 20000;
      buf.writeInt16LE(v | 0, i * 4);
      buf.writeInt16LE(v | 0, i * 4 + 2);
    }
    pushPcm(buf);
  }, 10);
  log("Test tone running (fake music).");
}

async function startCapture() {
  if (TEST_TONE) {
    if (!testTimer) startTestTone();
    return;
  }
  if (capture) return;
  let lib;
  try {
    lib = require("loopback-capture");
  } catch (e) {
    log("Couldn't load the audio capture module:", e.message);
    return;
  }
  const perProcess = process.platform === "win32" && windowsBuild() >= 20348;
  const pid = perProcess ? await findSpotifyPid() : null;
  // The visualiser may have been hidden (or another start won) while we looked.
  if (capture || activeClients().length === 0) return;
  try {
    capture = new lib.LoopbackCapture();
    if (pid) {
      capture.start(pid, pushPcm);
      capturedPid = pid;
      log(`Listening to Spotify only (process ${pid}).`);
    } else {
      capture.startSystemAudio(pushPcm);
      capturedPid = null;
      log(
        perProcess
          ? "Spotify isn't open yet - listening to all PC audio for now."
          : "This Windows version can't isolate one app - listening to all PC audio."
      );
    }
  } catch (e) {
    log("Couldn't start capturing audio:", e.message);
    capture = null;
  }
}

function stopCapture(quiet) {
  if (testTimer) {
    clearInterval(testTimer);
    testTimer = null;
  }
  if (capture) {
    try {
      capture.stop();
    } catch (_) {}
    capture = null;
    capturedPid = null;
    if (!quiet) log("Stopped listening (no visualiser open).");
  }
}

// Watchdog: if no sound has arrived for a while (Windows sometimes drops the
// capture when Spotify changes audio device or restarts), start over.
let quietRestarts = 0;
setInterval(() => {
  if (TEST_TONE || activeClients().length === 0) return;
  if (!capture) return startCapture();
  if (Date.now() - lastAudioAt > 10000) {
    if (quietRestarts++ < 3) log("No sound for 10s - restarting the capture.");
    stopCapture(true);
    startCapture();
    lastAudioAt = Date.now();
  } else quietRestarts = 0;
}, 5000);

// If Spotify restarts, its process number changes: follow it.
setInterval(async () => {
  if (TEST_TONE || !capture || activeClients().length === 0) return;
  if (process.platform !== "win32" || windowsBuild() < 20348) return;
  const pid = await findSpotifyPid();
  if (pid && pid !== capturedPid) {
    log("Spotify restarted - reconnecting.");
    stopCapture(true);
    startCapture();
  }
}, 5000);

// ---------------------------------------------------------------------------
// Local server for the extension
// ---------------------------------------------------------------------------
// Only Spotify (or a local tool with no origin) may connect, so websites you
// visit in a browser can't read what you're listening to.
// The shortcut opens Spotify too, if it isn't open yet.
if (OPEN_SPOTIFY && process.platform === "win32") {
  findSpotifyPid().then((pid) => {
    if (!pid) {
      log("Opening Spotify...");
      execFile("explorer.exe", ["spotify:"], () => {});
    }
  });
}

const wss = new WebSocketServer({
  host: "127.0.0.1",
  port: PORT,
  verifyClient: ({ origin }) => !origin || /spotify|^file:|^null$/i.test(origin),
});

wss.on("listening", () => log(`Spicy Visualiser helper ready on 127.0.0.1:${PORT}`));
wss.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    log("The helper is already running. Closing this copy.");
    process.exit(0);
  }
  log("Server error:", e.message);
});

// Power saving: each visualiser says whether it's actually on screen and
// whether it needs the deep-bass ring. When nobody is watching (lyrics view
// closed, Spotify minimised or behind a game, style Off) the helper stops
// capturing and analysing completely.
const activeClients = () => [...wss.clients].filter((c) => c.readyState === 1 && c.lpActive !== false);
const needLo = () => activeClients().some((c) => c.lpLo);
function updateCapture() {
  if (activeClients().length) startCapture();
  else stopCapture(true);
}
wss.on("connection", (ws, req) => {
  log("Visualiser connected.");
  ws.lpActive = true;
  ws.lpLo = true;
  updateCapture();
  ws.on("message", (raw) => {
    try {
      const m = JSON.parse(raw);
      if (m.cmd === "state") {
        const was = ws.lpActive;
        ws.lpActive = !!m.active;
        ws.lpLo = !!m.lo;
        if (was !== ws.lpActive) log(ws.lpActive ? "Visualiser visible - listening." : "Visualiser hidden - resting.");
        updateCapture();
      }
    } catch (_) {}
  });
  ws.on("close", () => {
    log("Visualiser disconnected.");
    updateCapture();
  });
});

// Send as soon as fresh audio arrives (Windows delivers ~10 ms chunks), not on a
// timer: Windows timers tick every ~15.6 ms, which made updates uneven (choppy).
let lastSent = 0;
let sendQueued = false;
function sendNow() {
  sendQueued = false;
  if (activeClients().length === 0) return;
  lastSent = Date.now();
  const msg = JSON.stringify(analyse());
  for (const client of wss.clients) if (client.readyState === 1) client.send(msg);
}
onAudio = () => {
  // ~60 updates a second is plenty and keeps the CPU low.
  if (sendQueued || Date.now() - lastSent < 15) return;
  sendQueued = true;
  setImmediate(sendNow);
};
// Fallback for silence (no audio chunks arrive when nothing plays).
setInterval(() => {
  if (wss.clients.size === 0) return;
  if (Date.now() - lastAudioAt > 400) {
    if (!TEST_TONE) ring.fill(0);
    if (Date.now() - lastSent > 40) sendNow();
  }
}, 50);

// Lives as long as Spotify: it sleeps while the visualiser is hidden, and it
// closes once Spotify has been gone (no connection) for IDLE_EXIT_MS.
// From the shortcut, Spotify may take a while to open: wait longer at first.
let neededAt = Date.now() + (OPEN_SPOTIFY ? 90000 : 0);
setInterval(() => {
  if (wss.clients.size) neededAt = Date.now();
  else if (!STAY && Date.now() - neededAt > IDLE_EXIT_MS) {
    log("Spotify closed - closing too.");
    stopCapture(true);
    process.exit(0);
  }
}, 2000);

process.on("SIGINT", () => {
  stopCapture();
  process.exit(0);
});

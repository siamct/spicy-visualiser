// The Marketplace card: LED Wall, ASCII, Retro Bars and Monstercat in turn,
// all playing the same calm, music-like spectrum (strong bass falling off to
// the treble, a soft kick pulse on every beat, slow ripples). Each style is
// rendered over the whole loop with a faked clock, so tools/make-card.py can
// crossfade between them at the same moment in time.
//   node test/song/card.js  ->  test/out/card/<style>/000.png ...
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "out", "card");
const harness = fs.readFileSync(path.join(__dirname, "..", "harness.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
const W = 1000, H = 810, FPS = 15;
const ALL = ["led", "ascii", "retro", "monstercat"];
const STYLES = process.env.CARD_STYLES ? process.env.CARD_STYLES.split(",") : ALL; // re-render just some
const EACH = 1.5; // seconds on each style
// Per-style sensitivity and size so all four reach about the same height
// (LED Wall, ASCII and Retro top out a little lower than Monstercat can).
const SENS = { led: 1.1, ascii: 1.8, retro: 1.7, monstercat: 1 };
const SIZE = { monstercat: 1.4, ascii: 2.9 };
// About 24 bars in every style (LED Wall gives 24 at its normal size).
const BARS = { monstercat: 24, retro: 48 };
const LOOP = EACH * ALL.length; // whole card loop; the music repeats exactly on it
const COUNT = Math.round(FPS * LOOP);

async function render(b, style) {
  const dir = path.join(OUT, style);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.clock.install({ time: 0 });
  const page = harness
    .replace("</style>", `body{width:${W}px;height:${H}px}.LyricsContainer,.NowBar{display:none}.ViewControls{visibility:hidden}.spicy-dynamic-bg{background:#0c0a12}</style>`)
    .replace('{VIBRANT:"#e0408a",LIGHT_VIBRANT:"#7fd3ff",PROMINENT:"#6a4cff"}', '{VIBRANT:"#e8356f",LIGHT_VIBRANT:"#ffb347",PROMINENT:"#ff6a3d"}')
    .replace('"../spicy-visualiser.js"', '"spicy-visualiser.js"');
  await p.route("http://card.test/**", (r) =>
    r.request().url().endsWith(".js") ? r.fulfill({ body: js, contentType: "text/javascript" }) : r.fulfill({ body: page, contentType: "text/html" })
  );
  await p.addInitScript((LOOP) => {
    const TAU = Math.PI * 2;
    const frame = () => {
      const t = performance.now() / 1000;
      const ph = t / LOOP; // 0..1 over the loop
      const kick = Math.exp(-((t % 0.5) / 0.11)); // 120 BPM, soft decay
      const b = [];
      for (let i = 0; i < 64; i++) {
        const x = i / 63;
        // Bass falling off to the treble, three soft humps gliding along at
        // their own pace (each loops exactly), and a kick lifting the low end.
        let v = 0.3 * Math.exp(-x * 2) + 0.1;
        for (const [c0, sp, a] of [[0.25, 1, 0.3], [0.6, -1, 0.24], [0.85, 2, 0.18]]) {
          const c = c0 + 0.12 * Math.sin(TAU * (sp * ph + c0));
          v += a * Math.exp(-((x - c) ** 2) / (2 * 0.07 ** 2));
        }
        v += 0.25 * kick * Math.exp(-x * 4);
        b.push(+Math.max(0.03, Math.min(0.95, v)).toFixed(3));
      }
      return { b, a: 0.5, l: 0.5, k: 0, s: 0 };
    };
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        this.iv = setInterval(() => this.onmessage && this.onmessage({ data: JSON.stringify(frame()) }), 10);
      }
      send() {}
      close() { clearInterval(this.iv); }
    };
  }, LOOP);
  await p.goto("http://card.test/index.html");
  await p.clock.runFor(500);
  await p.evaluate(([st, SENS, SIZE, BARS]) => {
    const btn = document.querySelector(".lp-button"); btn.click();
    const pick = (k, v) => { const e = document.querySelector(`[data-key=${k}] button[data-v=${v}]`); if (e) e.click(); };
    const set = (k, v) => { const e = document.querySelector(`input[data-key=${k}][data-scope=style]`); if (e) { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); } };
    pick("lyricGlow", "off"); pick("__style", st); pick("mcColor", "frequency"); pick("colorMove", "still");
    set("particles", "0"); set("shake", "0"); set("autoRange", "0"); set("smoothing", "0.6"); set("sensitivity", String(SENS[st] || 1)); set("size", String(SIZE[st] || 1)); if (BARS[st]) set("barCount", String(BARS[st]));
    btn.click();
  }, [style, SENS, SIZE, BARS]);
  // Settle for one whole loop (minus the half second already run), so frame 0
  // of every style lands on the same moment of the music.
  await p.clock.runFor(LOOP * 1000 - 500);
  await p.evaluate(() => document.querySelectorAll(".lp-button,.lp-panel").forEach((e) => (e.style.visibility = "hidden")));
  for (let f = 0; f < COUNT; f++) {
    await p.clock.runFor(1000 / FPS);
    await p.screenshot({ path: path.join(dir, String(f).padStart(3, "0") + ".png") });
  }
  await p.close();
}

(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const st of STYLES) await render(b, st);
  await b.close();
  console.log(STYLES.length, "styles x", COUNT, "frames");
})();

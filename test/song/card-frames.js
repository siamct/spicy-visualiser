// Frames for the moving Marketplace card: three styles, visualiser only, all
// fed the same calm made-up signal (a soft wave rolling slowly across the
// bands, no music, no beats), one frame every 125 ms for one 9 s loop.
//   node test/song/card-frames.js  ->  test/out/card/<style>-<n>.png
// then: python tools/make-card.py
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "out");
const harness = fs.readFileSync(path.join(__dirname, "..", "harness.html"), "utf8");
const LOOP = 9000; // ms: the signal repeats exactly, so the card loops cleanly

const HIDE = ".LyricsContainer,.ViewControls,.lp-nolyr{visibility:hidden!important}.NowBar{display:none!important}";

function page(album) {
  return harness
    .replace("linear-gradient(135deg,#ff4fa0,#5b6cff)", `linear-gradient(135deg,${album.cover[0]},${album.cover[1]} 60%,${album.cover[2]})`)
    .replace("radial-gradient(circle at 30% 30%,#3a1450,#0b0b20 70%)", `radial-gradient(circle at 30% 30%,${album.bg[0]},${album.bg[1]} 70%)`)
    .replace('{VIBRANT:"#e0408a",LIGHT_VIBRANT:"#7fd3ff",PROMINENT:"#6a4cff"}', `{VIBRANT:"${album.cover[0]}",LIGHT_VIBRANT:"${album.cover[1]}",PROMINENT:"${album.cover[2]}"}`)
    .replace('"../spicy-visualiser.js"', '"spicy-visualiser.js"');
}

async function open(b, js, album) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.route("http://song.test/**", (r) => {
    if (r.request().url().endsWith(".js")) return r.fulfill({ body: js, contentType: "text/javascript" });
    return r.fulfill({ body: page(album), contentType: "text/html" });
  });
  await p.addInitScript((LOOP) => {
    // a soft wave rolling across the bands once per loop, breathing gently
    window.__sigT0 = performance.now();
    const sig = () => {
      const ph = (((performance.now() - window.__sigT0) % LOOP) / LOOP) * Math.PI * 2;
      const lv = 0.5 + 0.08 * Math.sin(ph * 2);
      const wave = (x) => Math.max(0, Math.min(1, lv + 0.22 * Math.sin(x * Math.PI * 2 * 1.2 - ph)));
      const b = Array.from({ length: 64 }, (_, i) => wave(i / 63));
      const lo = Array.from({ length: 40 }, (_, i) => wave(i / 39));
      return { b, lo, ld: lo.map((v) => 20 * Math.log10(Math.max(1e-4, v))), a: 0.2, l: lv, k: 0, s: 0 };
    };
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        this.iv = setInterval(() => this.onmessage && this.onmessage({ data: JSON.stringify(sig()) }), 16);
      }
      send() {}
      close() { clearInterval(this.iv); }
    };
  }, LOOP);
  p.on("pageerror", (e) => console.log("ERROR", e.message));
  await p.goto("http://song.test/index.html");
  await p.waitForTimeout(800);
  return p;
}
const setter = (p) => (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);


// all three in the same pinks, to match the card's top bar
const ALBUM = { cover: ["#e8356f", "#ff6f9a", "#c42a62"], bg: ["#3a0f22", "#0d0609"] };
const CARD = ["holospec", "ledm", "led"];
const N = LOOP / 125; // pictures per style, one every 125 ms (the card plays them at that speed)

(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
  const dir = path.join(OUT, "card");
  fs.mkdirSync(dir, { recursive: true });
  for (const style of CARD) {
    const p = await open(b, js, ALBUM);
    const set = setter(p);
    await set("lyricGlow", "off");
    await set("__style", style);
    // full strength for the card, no dimming behind the (hidden) lyrics
    await p.evaluate(() => {
      document.querySelector(".lp-button").click();
      for (const [k, v] of [["opacity", 1], ["lyricDim", 0]]) {
        const i = document.querySelector(`input[data-key=${k}]`);
        i.value = v;
        i.dispatchEvent(new Event("input", { bubbles: true }));
      }
      document.querySelector(".lp-button").click();
    });
    await p.addStyleTag({ content: HIDE + ".lp-button,.lp-modal-wrap{display:none!important}" });
    await p.waitForTimeout(2500);
    // start at the beginning of the wave, so all three styles are in step
    await p.waitForTimeout(await p.evaluate((L) => L - ((performance.now() - window.__sigT0) % L), LOOP));
    // evenly spaced in real time, so the card moves at the real speed
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      const wait = t0 + i * 125 - Date.now();
      if (wait > 0) await p.waitForTimeout(wait);
      await p.screenshot({ path: path.join(dir, `${style}-${i}.png`) });
    }
    console.log(style);
    await p.close();
  }
  await b.close();
})();

// Frames for the moving Marketplace card: a few styles playing the test
// track, visualiser only, one frame every ~70 ms.
//   node test/song/card-frames.js  ->  test/out/card/<style>-<n>.png
// then: python tools/make-card.py
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "out");
const frames = JSON.parse(fs.readFileSync(path.join(OUT, "song-frames.json"), "utf8"));
const harness = fs.readFileSync(path.join(__dirname, "..", "harness.html"), "utf8");
const BEAT = 60 / 123;

const ALBUMS = [
  { cover: ["#ff8a1f", "#ffd34a", "#e0402a"], bg: ["#3a1d08", "#0d0906"] }, // warm orange
  { cover: ["#19c3b0", "#9ff2e0", "#1d5fa8"], bg: ["#07303a", "#050b10"] }, // teal / blue
  { cover: ["#8a3cff", "#33d6ff", "#ff4fd8"], bg: ["#22104a", "#07061a"] }, // purple / cyan
  { cover: ["#ff3355", "#ff9a8a", "#a01a50"], bg: ["#40101c", "#0f0508"] }, // red / rose
  { cover: ["#6fd34a", "#e6f78a", "#1f8a6c"], bg: ["#12301a", "#050c07"] }, // green / lime
];

const HIDE = ".NowBar,.LyricsContainer,.ViewControls,.lp-nolyr{visibility:hidden!important}";

function page(album) {
  return harness
    .replace("linear-gradient(135deg,#ff4fa0,#5b6cff)", `linear-gradient(135deg,${album.cover[0]},${album.cover[1]} 60%,${album.cover[2]})`)
    .replace("radial-gradient(circle at 30% 30%,#3a1450,#0b0b20 70%)", `radial-gradient(circle at 30% 30%,${album.bg[0]},${album.bg[1]} 70%)`)
    .replace('{VIBRANT:"#e0408a",LIGHT_VIBRANT:"#7fd3ff",PROMINENT:"#6a4cff"}', `{VIBRANT:"${album.cover[0]}",LIGHT_VIBRANT:"${album.cover[1]}",PROMINENT:"${album.cover[2]}"}`)
    .replace('"../spicy-visualiser.js"', '"spicy-visualiser.js"');
}

async function open(b, js, album, atBar) {
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.route("http://song.test/**", (r) => {
    if (r.request().url().endsWith(".js")) return r.fulfill({ body: js, contentType: "text/javascript" });
    return r.fulfill({ body: page(album), contentType: "text/html" });
  });
  const start = Math.max(0, Math.round((atBar * 4 * BEAT - 3) * 60));
  await p.addInitScript(([frames]) => {
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        const t0 = performance.now();
        this.iv = setInterval(() => {
          const i = Math.floor((performance.now() - t0) / (1000 / 60));
          this.onmessage && this.onmessage({ data: JSON.stringify(frames[i % frames.length]) });
        }, 16);
      }
      send() {}
      close() { clearInterval(this.iv); }
    };
  }, [frames.slice(start, start + 60 * 12)]);
  p.on("pageerror", (e) => console.log("ERROR", e.message));
  await p.goto("http://song.test/index.html");
  await p.waitForTimeout(800);
  return p;
}
const setter = (p) => (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);


const CARD = [["monstercat", 0, 22], ["ncs", 2, 23], ["aurora", 1, 23], ["plasma", 4, 18]];
const N = 48;

(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
  const dir = path.join(OUT, "card");
  fs.mkdirSync(dir, { recursive: true });
  for (const [style, album, atBar] of CARD) {
    const p = await open(b, js, ALBUMS[album], atBar);
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
    for (let i = 0; i < N; i++) {
      await p.screenshot({ path: path.join(dir, `${style}-${i}.png`) });
      await p.waitForTimeout(25);
    }
    console.log(style);
    await p.close();
  }
  await b.close();
})();

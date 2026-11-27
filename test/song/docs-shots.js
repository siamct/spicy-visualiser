// Pictures for the docs: every style playing the test track, visualiser
// only (no lyrics, album art, song name or buttons), rotating through a few
// made-up "albums" so the colours vary. Also the settings panel tabs.
//   node test/song/docs-shots.js [style ...]  ->  test/out/doc-<style>.png, doc-panel-<tab>.png
// then: python tools/make-doc-images.py
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

// [style, moment in the track (bar)]
const SHOTS = [
  ["monstercat", 22], ["mirror", 9], ["ledm", 12], ["led", 21], ["ascii", 28], ["vu", 24], ["scope", 22], ["holospec", 24], ["ekg", 22], ["rgbsplit", 22],
  ["radial", 26], ["ncs", 23], ["sub", 13], ["trap", 25], ["tunnel", 27],
  ["drumpads", 22], ["geometric", 11], ["bauhaus", 29],
  ["plasma", 18], ["ledplasma", 24], ["tvpixels", 22], ["oil", 20], ["silk", 22], ["dnb", 26],
  ["underwater", 21],
  ["aurora", 23], ["galaxy", 21], ["sunset", 24], ["nightsky", 20], ["ribbon", 27], ["ombre", 25], ["warp", 30], ["particles", 22],
  ["prism", 22], ["rain", 19], ["smoke", 24], ["lava", 20], ["neuro", 14],
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

(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
  let n = 0;
  for (const [style, atBar] of SHOTS) {
    const album = ALBUMS[n++ % ALBUMS.length];
    if (only.length && !only.includes(style) && !only.includes("panel")) continue;
    if (only.length && !only.includes(style)) continue;
    const p = await open(b, js, album, atBar);
    const set = setter(p);
    await set("lyricGlow", "off");
    await set("__style", style);
    await p.addStyleTag({ content: HIDE });
    await p.waitForTimeout(["rain", "lava", "ekg"].includes(style) ? 6000 : 2600);
    const out = path.join(OUT, `doc-${style}.png`);
    await p.screenshot({ path: out });
    console.log(out);
    await p.close();
  }
  if (!only.length || only.includes("panel")) {
    const p = await open(b, js, ALBUMS[2], 22);
    const set = setter(p);
    await set("lyricGlow", "off");
    await set("__style", "plasma");
    await p.addStyleTag({ content: ".NowBar,.LyricsContainer,.lp-nolyr{visibility:hidden!important}" });
    await p.waitForTimeout(1500);
    for (const tab of ["style", "look", "sound", "more"]) {
      await p.evaluate((t) => { document.querySelector(".lp-button").click(); document.querySelector(`.lp-tabs button[data-v=${t}]`).click(); }, tab);
      await p.waitForTimeout(400);
      const box = await p.evaluate(() => { const r = document.querySelector(".lp-panel").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      const out = path.join(OUT, `doc-panel-${tab}.png`);
      await p.screenshot({ path: out, clip: { x: box.x - 16, y: box.y - 6, width: box.width + 32, height: Math.min(720 - box.y + 6, box.height + 22) } });
      console.log(out, JSON.stringify(box));
      await p.evaluate(() => document.querySelector(".lp-button").click());
    }
    await p.close();
  }
  await b.close();
})();

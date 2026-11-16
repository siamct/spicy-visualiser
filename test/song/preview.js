// Clean square tiles of a few styles for the Marketplace card: the test page
// with the lyrics and song bar hidden, playing the test track's analysis.
//   node test/song/preview.js  ->  test/out/preview-<style>.png
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "out");
const frames = JSON.parse(fs.readFileSync(path.join(OUT, "song-frames.json"), "utf8"));
const harness = fs.readFileSync(path.join(__dirname, "..", "harness.html"), "utf8");
const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
const BEAT = 60 / 123;

// [style, setting, value, bar of the track, three album colours]
const TILES = [
  ["monstercat", null, null, 22, ["#ff7a18", "#ffd24a", "#ff3d6e"]],
  ["trap", null, null, 25, ["#ff2e88", "#7a5cff", "#2ee6ff"]],
  ["neuro", null, null, 23, ["#2ee6ff", "#7a5cff", "#ff2e88"]],
  ["ledplasma", null, null, 24, ["#7a5cff", "#2ee6ff", "#ff7ad9"]],
];

(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [style, key, val, atBar, cols] of TILES) {
    const p = await b.newPage({ viewport: { width: 640, height: 640 } });
    const page = harness
      .replace("</style>", "body{width:640px;height:640px}.LyricsContainer,.NowBar,.ViewControls{visibility:hidden}.spicy-dynamic-bg{background:#07070c}</style>")
      .replace('{VIBRANT:"#e0408a",LIGHT_VIBRANT:"#7fd3ff",PROMINENT:"#6a4cff"}', `{VIBRANT:"${cols[0]}",LIGHT_VIBRANT:"${cols[1]}",PROMINENT:"${cols[2]}"}`)
      .replace('"../spicy-visualiser.js"', '"spicy-visualiser.js"');
    await p.route("http://prev.test/**", (r) =>
      r.request().url().endsWith(".js") ? r.fulfill({ body: js, contentType: "text/javascript" }) : r.fulfill({ body: page, contentType: "text/html" })
    );
    const start = Math.max(0, Math.round((atBar * 4 * BEAT - 3) * 60));
    await p.addInitScript(([fr]) => {
      window.WebSocket = class {
        constructor() {
          this.readyState = 1;
          setTimeout(() => this.onopen && this.onopen(), 10);
          const t0 = performance.now();
          this.iv = setInterval(() => {
            const i = Math.floor((performance.now() - t0) / (1000 / 60));
            this.onmessage && this.onmessage({ data: JSON.stringify(fr[i % fr.length]) });
          }, 16);
        }
        send() {}
        close() { clearInterval(this.iv); }
      };
    }, [frames.slice(start, start + 60 * 12)]);
    await p.goto("http://prev.test/index.html");
    await p.waitForTimeout(800);
    const set = (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);
    await set("__style", style);
    if (key) await set(key, val);
    await p.waitForTimeout(2600);
    await p.evaluate(() => document.querySelectorAll(".lp-button,.lp-panel").forEach((e) => (e.style.visibility = "hidden")));
    await p.screenshot({ path: path.join(OUT, `preview-${style}.png`) });
    await p.close();
  }
  await b.close();
})();

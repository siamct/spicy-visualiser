// Screenshots of every style playing the test track (test/out/song-frames.json,
// made by make-track.py + analyse.js) instead of the plain fake beat.
// Each shot jumps to a different moment of the track and uses one of a few
// made-up "albums" (own title, lyrics and cover colours) so they don't all
// look the same.
//   node test/song/shots.js [style ...]   ->  test/out/song-<style>.png
"use strict";
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = path.join(__dirname, "..", "out");
const frames = JSON.parse(fs.readFileSync(path.join(OUT, "song-frames.json"), "utf8"));
const harness = fs.readFileSync(path.join(__dirname, "..", "harness.html"), "utf8");
const BEAT = 60 / 123;

const ALBUMS = [
  { title: "Disco Circuit", artist: "Night Shift Club", cover: ["#ff9a1f", "#ffd34a", "#1fb5a8"], bg: ["#3a2108", "#0d0a06"],
    lines: ["Turn the lights down low", "Feel the bassline glow", "Every night we ride", "On a disco tide"] },
  { title: "Midnight Arcade", artist: "Pixel Coast", cover: ["#8a3cff", "#33d6ff", "#ff4fd8"], bg: ["#22104a", "#07061a"],
    lines: ["Coins in the machine", "Neon on the screen", "One more round tonight", "Chasing city light"] },
  { title: "Ruby Static", artist: "Velvet Signal", cover: ["#ff3355", "#ff8a8a", "#ffc2d1"], bg: ["#40101c", "#0f0508"],
    lines: ["Static on the line", "Your voice in my mind", "Spinning out of time", "Hold on, it's fine"] },
];

// [style, setting, value, moment in the track (bar)]
const SHOTS = [
  ["monstercat", null, null, 22], ["monstercat", "mcColor", "height", 24], ["mirror", null, null, 9], ["radial", null, null, 26],
  ["retro", null, null, 12], ["ascii", null, null, 28], ["led", null, null, 21], ["ncs", null, null, 23],
  ["trap", null, null, 25], ["sub", null, null, 13], ["ribbon", null, null, 27], ["geometric", null, null, 11],
  ["bauhaus", null, null, 29], ["particles", null, null, 22], ["plasma", null, null, 18], ["ledplasma", null, null, 24],
  ["warp", null, null, 30], ["dnb", null, null, 26], ["neuro", null, null, 14],
  ["neuro", "neuroLook", "ridges", 23],
];

function page(album) {
  const words = (s) => s.split(" ").map((w) => `<span class="word">${w}</span>`).join(" ");
  let h = harness
    .replace(/<div class="line">.*<\/div>\r?\n/g, "")
    .replace('<div class="LyricsContent">', '<div class="LyricsContent">' + album.lines.map((l) => `<div class="line">${words(l)}</div>`).join("\n"))
    .replace("<h2>Test Song</h2>", `<h2>${album.title}</h2><div style="opacity:.7">${album.artist}</div>`)
    .replace("linear-gradient(135deg,#ff4fa0,#5b6cff)", `linear-gradient(135deg,${album.cover[0]},${album.cover[1]} 60%,${album.cover[2]})`)
    .replace("radial-gradient(circle at 30% 30%,#3a1450,#0b0b20 70%)", `radial-gradient(circle at 30% 30%,${album.bg[0]},${album.bg[1]} 70%)`)
    .replace('name:"Neon Motorway",artists:[{name:"Test Artist"}]', `name:${JSON.stringify(album.title)},artists:[{name:${JSON.stringify(album.artist)}}]`)
    .replace('{VIBRANT:"#e0408a",LIGHT_VIBRANT:"#7fd3ff",PROMINENT:"#6a4cff"}', `{VIBRANT:"${album.cover[0]}",LIGHT_VIBRANT:"${album.cover[1]}",PROMINENT:"${album.cover[2]}"}`)
    .replace('"../spicy-visualiser.js"', '"spicy-visualiser.js"');
  return h;
}

(async () => {
  const only = process.argv.slice(2);
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const js = fs.readFileSync(path.join(__dirname, "..", "..", "spicy-visualiser.js"));
  let n = 0;
  for (const [style, key, val, atBar] of SHOTS) {
    const name = [style, val].filter(Boolean).join("-");
    if (only.length && !only.includes(name) && !only.includes(style)) continue;
    const album = ALBUMS[n++ % ALBUMS.length];
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await p.route("http://song.test/**", (r) => {
      const u = r.request().url();
      if (u.endsWith(".js")) return r.fulfill({ body: js, contentType: "text/javascript" });
      return r.fulfill({ body: page(album), contentType: "text/html" });
    });
    // Replay the helper's analysis of the track, starting 3 s before the shot moment.
    const start = Math.max(0, Math.round((atBar * 4 * BEAT - 3) * 60));
    await p.addInitScript(([frames]) => {
      window.WebSocket = class {
        constructor() {
          this.readyState = 1;
          setTimeout(() => this.onopen && this.onopen(), 10);
          const t0 = performance.now();
          this.iv = setInterval(() => {
            const i = Math.floor((performance.now() - t0) / (1000 / 60));
            const f = frames[i % frames.length];
            this.onmessage && this.onmessage({ data: JSON.stringify(f) });
          }, 16);
        }
        send() {}
        close() { clearInterval(this.iv); }
      };
    }, [frames.slice(start, start + 60 * 12)]);
    p.on("pageerror", (e) => console.log("ERROR", name, e.message));
    await p.goto("http://song.test/index.html");
    await p.waitForTimeout(800);
    const set = (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);
    await set("__style", style);
    if (key) await set(key, val);
    await p.waitForTimeout(2200);
    const out = path.join(OUT, `song-${name}.png`);
    await p.screenshot({ path: out });
    console.log(out, "-", album.title);
    await p.close();
  }
  await b.close();
})();

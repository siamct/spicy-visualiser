// Helper source: a helper that connects but hears nothing leaves the visual
// empty (and the panel says why). Switching the source to Spotify data closes
// the helper connection and draws from the song's data instead.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    window.__ws = { opened: 0, closed: 0 };
    window.WebSocket = class {
      constructor() {
        window.__ws.opened++;
        setTimeout(() => { this.readyState = 1; this.onopen && this.onopen(); }, 5);
        this.t = setInterval(() => this.onmessage && this.onmessage({ data: JSON.stringify({ b: new Array(64).fill(0), a: 0, l: 0 }) }), 16);
      }
      send() {}
      close() { clearInterval(this.t); window.__ws.closed++; this.readyState = 3; setTimeout(() => this.onclose && this.onclose(), 1); }
    };
    const beats = [], segments = [];
    for (let i = 0; i < 400; i++) beats.push({ start: i * 0.5 });
    for (let i = 0; i < 1600; i++) {
      const onBeat = i % 4 === 0;
      segments.push({ start: i * 0.125, duration: 0.125, loudness_start: onBeat ? -30 : -14, loudness_max: onBeat ? -6 : -12, loudness_max_time: 0.02,
        pitches: Array.from({ length: 12 }, (_, k) => (k === i % 12 ? 1 : 0.2)), timbre: [40, onBeat ? 0 : 60, 10, 30, 0, 0, 0, 0, 0, 0, 0, 0] });
    }
    window.__songData = { beats, bars: beats.filter((_, i) => i % 4 === 0), segments, track: { tempo: 120 } };
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.evaluate(() => { Spicetify.getAudioData = async () => window.__songData; Spicetify.Player.data.item.uri = "spotify:track:quiet"; });
  await p.waitForTimeout(5500);
  const st = await p.evaluate(() => window.SpicyVisualiser.state());
  await p.evaluate(() => document.querySelector(".lp-button").click());
  await p.evaluate(() => document.querySelector('.lp-tabs [data-v="more"]').click());
  const quietText = await p.evaluate(() => document.querySelector(".lp-status-text").textContent);
  const drawn = () => p.evaluate(() => { const c = document.querySelector("canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
  const px1 = await drawn();
  const r1 = st.helper === "live" && px1 === 0 && /hears no sound/.test(quietText);
  console.log(r1 ? "PASS" : "FAIL", "silent helper: nothing drawn, panel says why", JSON.stringify({ helper: st.helper, px1, quietText }));
  await p.evaluate(() => document.querySelector('[data-key="source"] button[data-v="spotify"]').click());
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({ ws: window.__ws, st: window.SpicyVisualiser.state(), text: document.querySelector(".lp-status-text").textContent, install: !document.querySelector(".lp-get-helper").classList.contains("lp-hidden") }));
  const px2 = await drawn();
  const r2 = r.ws.closed >= 1 && r.ws.opened === 1 && r.st.helper !== "live" && /Spotify's data/.test(r.text) && !r.install && px2 > 0;
  console.log(r2 ? "PASS" : "FAIL", "Sound source Spotify data: closes the helper, draws from song data", JSON.stringify({ ws: r.ws, helper: r.st.helper, text: r.text, install: r.install, px2 }));
  if (errors.length) console.log("ERRORS", errors);
  await b.close();
  process.exit(r1 && r2 && !errors.length ? 0 : 1);
})();

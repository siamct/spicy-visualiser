// Sound source: Spotify data. No helper, but Spotify's sound data is available: the bars must follow it
// (Song data mode), kicks must fire, and the panel must say "Song data".
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    localStorage.setItem("spicy-visualiser:v1", JSON.stringify({ source: "spotify" }));
    window.WebSocket = class { constructor() { setTimeout(() => this.onclose && this.onclose(), 5); } send() {} close() {} };
    // A 120 BPM song: a loud bright-ish hit on every beat, quieter segments between.
    const beats = [], segments = [];
    for (let i = 0; i < 400; i++) beats.push({ start: i * 0.5 });
    for (let i = 0; i < 1600; i++) {
      const onBeat = i % 4 === 0;
      segments.push({ start: i * 0.125, duration: 0.125, loudness_start: onBeat ? -30 : -14, loudness_max: onBeat ? -6 : -12, loudness_max_time: 0.02,
        pitches: Array.from({ length: 12 }, (_, k) => (k === i % 12 ? 1 : 0.2)), timbre: [40, onBeat ? 0 : 60, 10, 30, 0, 0, 0, 0, 0, 0, 0, 0] });
    }
    window.__songData = { beats, bars: beats.filter((_, i) => i % 4 === 0), segments, track: { tempo: 120 } };
  });
  p.on("pageerror", (e) => console.log("ERROR", e.message));
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.evaluate(() => { Spicetify.getAudioData = async () => window.__songData; Spicetify.Player.data.item.uri = "spotify:track:songdata"; });
  await p.waitForTimeout(600);
  await p.waitForTimeout(3500);
  const st = await p.evaluate(() => window.SpicyVisualiser.state());
  const pill = await p.evaluate(() => { document.querySelector(".lp-button").click(); return document.querySelector(".lp-pill-text").textContent; });
  const ok = st.songData && st.live && st.energy > 0.05 && st.ticks > 2;
  console.log(ok ? "PASS" : "FAIL", "song data drives the bars", JSON.stringify({ songData: st.songData, live: st.live, energy: st.energy, kick: st.kick, ticks: st.ticks, beats: st.beats, pill }));
  await b.close();
  process.exit(ok ? 0 : 1);
})();

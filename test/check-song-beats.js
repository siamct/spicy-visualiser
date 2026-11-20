// Checks the song beat grid: when Spotify hands out its analysis of the song
// (beat and bar start times), beats must come from it in time with the
// playback position, with no kicks needed at all; bars every 4 beats; a
// pause stops the beats; and a song without analysis falls back to kicks.
// Run: node test/check-song-beats.js   (LP_BROWSER=msedge to use Edge)
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    // Live helper, but silent: no kicks at all, so any beat is from the grid.
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        this.iv = setInterval(() => {
          const b = Array.from({ length: 64 }, () => 0.3);
          this.onmessage && this.onmessage({ data: JSON.stringify({ b, l: 0.5, a: 0.3, k: 0 }) });
        }, 10);
      }
      send() {}
      close() {}
    };
  });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  const st = () => p.evaluate(() => window.SpicyVisualiser.state());
  let fails = 0;
  const check = (name, ok, extra) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra || ""}`); if (!ok) fails++; };

  // Give Spotify's analysis for a new song: 120 BPM, bars of 4.
  await p.evaluate(() => {
    const beats = [], bars = [];
    for (let i = 0; i < 8000; i++) {
      beats.push({ start: i * 0.5, duration: 0.5, confidence: 0.9 });
      if (i % 4 === 0) bars.push({ start: i * 0.5, duration: 2, confidence: 0.9 });
    }
    Spicetify.getAudioData = async () => ({ track: { tempo: 120 }, beats, bars });
    Spicetify.Player.data.item.uri = "spotify:track:withbeats";
  });
  await p.waitForTimeout(2600); // the song check runs every 2 s
  let s = await st();
  check("uses the song's beat grid", s.beats === "song" && s.tempo === 120, `beats ${s.beats} tempo ${s.tempo}`);
  let a = s.ticks, br = s.bars;
  await p.waitForTimeout(4000);
  s = await st();
  check("one beat every 0.5 s with no kicks (~8 in 4 s)", Math.abs(s.ticks - a - 8) <= 1, "beats " + (s.ticks - a));
  check("a bar every 4 beats (~2 in 4 s)", Math.abs(s.bars - br - 2) <= 1, "bars " + (s.bars - br));

  // Pause: no beats.
  await p.evaluate(() => { const t = Spicetify.Player.getProgress(); Spicetify.Player.isPlaying = () => false; Spicetify.Player.getProgress = () => t; });
  s = await st();
  a = s.ticks;
  await p.waitForTimeout(1500);
  s = await st();
  check("paused: no beats", s.ticks === a, "beats " + (s.ticks - a));
  // Resume: beats again, without a burst for the time spent paused.
  await p.evaluate(() => { const t0 = Spicetify.Player.getProgress(), w0 = performance.now(); Spicetify.Player.isPlaying = () => true; Spicetify.Player.getProgress = () => t0 + performance.now() - w0; });
  a = (await st()).ticks;
  await p.waitForTimeout(2000);
  s = await st();
  check("resumes on time (~4 in 2 s)", Math.abs(s.ticks - a - 4) <= 1, "beats " + (s.ticks - a));

  // A song with no analysis falls back to the kick clock.
  await p.evaluate(() => {
    Spicetify.getAudioData = async () => { throw new Error("gone"); };
    Spicetify.Player.data.item.uri = "spotify:track:nobeats";
  });
  await p.waitForTimeout(2600);
  s = await st();
  check("no analysis: back to kicks", s.beats === "kicks", "beats " + s.beats);

  console.log(fails ? `\n${fails} song beat check(s) failed` : "\nAll song beat checks passed");
  await b.close();
  process.exit(fails ? 1 : 0);
})();

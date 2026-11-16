// Songs with no lyrics: the visual should ease up to its fuller look
// (noLyr -> 1), and without the helper it must keep moving on a beat (it
// normally gets its hits from the lyric lines). With lyrics it stays at 0.
// Run: node test/check-no-lyrics.js   (LP_BROWSER=msedge to use Edge)
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    // No helper: the socket never connects.
    window.WebSocket = class { constructor() { setTimeout(() => this.onclose && this.onclose(), 10); } send() {} close() {} };
  });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  const st = () => p.evaluate(() => window.SpicyVisualiser.state());
  let fails = 0;
  const check = (name, ok, extra) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra || ""}`); if (!ok) fails++; };
  await p.waitForTimeout(5000);
  let s = await st();
  check("with lyrics: normal look", s.noLyr < 0.05, "noLyr " + s.noLyr);
  await p.evaluate(() => document.querySelectorAll(".LyricsContent .line").forEach((l) => l.remove()));
  let maxKick = 0;
  for (let i = 0; i < 30; i++) {
    await p.waitForTimeout(200);
    maxKick = Math.max(maxKick, (await st()).kick);
  }
  s = await st();
  check("no lyrics: fuller look", s.noLyr > 0.6, "noLyr " + s.noLyr);
  check("no lyrics, no helper: still moves on a beat", maxKick > 0.2, "max kick " + maxKick.toFixed(2));
  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : "\nAll no-lyrics checks passed");
  process.exit(fails ? 1 : 0);
})();

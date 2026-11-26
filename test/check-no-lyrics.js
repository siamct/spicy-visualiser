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
  // Spicy Lyrics' "No lyrics" box: swapped for the song name, click brings it back.
  await p.evaluate(() => {
    const n = document.createElement("div");
    n.className = "LyricsNotice";
    n.dataset.notice = "lyrics-not-found";
    n.style.cssText = "margin:120px auto;width:480px;text-align:center";
    n.innerHTML = '<p class="notice-title">No lyrics for this song yet</p><p class="notice-body">We could not find lyrics.</p>';
    document.querySelector(".LyricsContent").appendChild(n);
  });
  await p.waitForTimeout(5000);
  const card = () => p.evaluate(() => {
    const c = document.querySelector(".lp-nolyr"), n = document.querySelector(".LyricsNotice");
    return { shown: !!c && c.classList.contains("lp-show") && getComputedStyle(c).opacity > 0.9, title: c ? c.firstChild.textContent : "", notice: +getComputedStyle(n).opacity };
  });
  let c = await card();
  check("no lyrics: song name shown instead of the notice", c.shown && c.title.length > 0 && c.notice < 0.05, JSON.stringify(c));
  await p.screenshot({ path: path.join(__dirname, "out", "no-lyrics-card.png") });
  await p.click(".lp-nolyr");
  await p.waitForTimeout(1200);
  c = await card();
  check("no lyrics: clicking the card brings the notice back", !c.shown && c.notice > 0.95, JSON.stringify(c));
  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : "\nAll no-lyrics checks passed");
  process.exit(fails ? 1 : 0);
})();

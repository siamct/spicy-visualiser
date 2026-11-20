// Checks the beat clock with fake music at 120 BPM (a kick every 0.5 s):
// it should find the tempo, give one beat per kick, keep going on time
// through a 2 s gap with no kicks, and not double-count extra hits.
// Run: node test/check-beat-clock.js   (LP_BROWSER=msedge to use Edge)
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    window.__kicks = true;
    window.__extra = false;
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        const t0 = performance.now();
        let lastBeat = -1;
        this.iv = setInterval(() => {
          const t = (performance.now() - t0) / 1000, n = Math.floor(t / 0.5);
          let k = 0;
          if (n !== lastBeat) { lastBeat = n; k = window.__kicks ? 1 : 0; }
          // an extra off-beat hit 120 ms after the kick (should be ignored)
          if (window.__extra && Math.abs((t % 0.5) - 0.12) < 0.009) k = 0.8;
          const b = Array.from({ length: 64 }, () => 0.4);
          this.onmessage && this.onmessage({ data: JSON.stringify({ b, l: 0.6, a: 0.4, k }) });
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
  await p.waitForTimeout(6000);
  let s = await st();
  check("finds the tempo (~120 BPM)", Math.abs(s.bpm - 120) <= 2, "bpm " + s.bpm);
  let a = s.ticks;
  await p.waitForTimeout(4000);
  s = await st();
  check("one beat per kick (~8 in 4 s)", Math.abs(s.ticks - a - 8) <= 1, "beats " + (s.ticks - a));
  await p.evaluate(() => (window.__extra = true));
  a = s.ticks;
  await p.waitForTimeout(4000);
  s = await st();
  check("extra off-beat hits don't double-count", Math.abs(s.ticks - a - 8) <= 1, "beats " + (s.ticks - a));
  await p.evaluate(() => { window.__extra = false; window.__kicks = false; });
  a = s.ticks;
  await p.waitForTimeout(2000);
  s = await st();
  check("keeps the beat through a 2 s gap (~4)", Math.abs(s.ticks - a - 4) <= 1, "beats " + (s.ticks - a));
  await p.waitForTimeout(6000);
  a = (await st()).ticks;
  await p.waitForTimeout(2000);
  s = await st();
  check("stops after a long silence", s.ticks - a === 0, "beats " + (s.ticks - a));
  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : "\nAll beat clock checks passed");
  process.exit(fails ? 1 : 0);
})();

// Tap to the beat: 5 taps 500 ms apart must set 120 BPM and then keep
// beats coming at that rate with no kicks at all (a silent helper).
// Run: node test/check-tap.js   (LP_BROWSER=msedge to use Edge)
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => {
    window.WebSocket = class {
      constructor() {
        this.readyState = 1;
        setTimeout(() => this.onopen && this.onopen(), 10);
        this.iv = setInterval(() => this.onmessage && this.onmessage({ data: JSON.stringify({ b: Array(64).fill(0.3), l: 0.5, a: 0.3, k: 0 }) }), 10);
      }
      send() {}
      close() {}
    };
  });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  let fails = 0;
  const check = (name, ok, extra) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${extra || ""}`); if (!ok) fails++; };
  await p.waitForTimeout(1500);
  await p.click(".lp-button");
  await p.click('.lp-tabs button:has-text("Sound")');
  // timed inside the page (Playwright's own clicks take a variable time)
  await p.evaluate(() => new Promise((res) => {
    let i = 0;
    const iv = setInterval(() => { document.querySelector(".lp-tap").click(); if (++i === 5) { clearInterval(iv); res(); } }, 500);
  }));
  const st = () => p.evaluate(() => window.SpicyVisualiser.state());
  const a = await st();
  check("tap sets the tempo", Math.abs(a.bpm - 120) <= 2, "bpm " + a.bpm + " beats " + a.beats);
  const info = await p.textContent(".lp-beatinfo");
  check("panel says it's tapped", /Tapped/.test(info), info);
  await p.waitForTimeout(3000);
  const c = await st();
  const n = c.ticks - a.ticks;
  check("beats keep coming with no kicks", n >= 5 && n <= 7, n + " beats in 3 s");
  await b.close();
  console.log(fails ? `\n${fails} check(s) failed` : "\nAll tap checks passed");
  process.exit(fails ? 1 : 0);
})();

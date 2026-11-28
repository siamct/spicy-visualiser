// No helper sound: the styles that suit Spotify's data come first and the
// rest fold under "More styles" (with the helper live, run-tests covers all).
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.addInitScript(() => { window.WebSocket = class { constructor() { setTimeout(() => this.onclose && this.onclose(), 5); } send() {} close() {} }; });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector(".lp-button").click());
  const visible = () => p.evaluate(() => [...document.querySelectorAll(".lp-panel .lp-cards button")].filter((x) => x.offsetParent).length);
  await p.waitForTimeout(600);
  const def = await p.evaluate(() => window.SpicyVisualiser.state().style);
  const sd = await visible();
  const cat = await p.evaluate(() => [...document.querySelectorAll(".lp-panel .lp-cards .lp-cat")].filter((x) => x.offsetParent).map((x) => x.textContent));
  await p.evaluate(() => document.querySelector(".lp-panel .lp-sd-more").click());
  const opened = await visible();
  const ok = sd === 28 && opened === 48 && cat.join() === "Works with Spotify data" && def === "plasma";
  console.log(ok ? "PASS" : "FAIL", "style groups by sound source", JSON.stringify({ sd, opened, cat, def }));
  await b.close();
  process.exit(ok ? 0 : 1);
})();

// Sound source "Spotify data": styles that suit it come first and the rest
// fold under "More styles"; with the helper every style shows in its group.
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
  const all = await visible();
  const def = await p.evaluate(() => window.SpicyVisualiser.state().style);
  await p.evaluate(() => { document.querySelector('.lp-tabs [data-v="more"]').click(); document.querySelector('[data-key="source"] button[data-v="spotify"]').click(); document.querySelector('.lp-tabs [data-v="style"]').click(); });
  const sd = await visible();
  const cat = await p.evaluate(() => [...document.querySelectorAll(".lp-panel .lp-cards .lp-cat")].filter((x) => x.offsetParent).map((x) => x.textContent));
  await p.evaluate(() => document.querySelector(".lp-panel .lp-sd-more").click());
  const opened = await visible();
  const ok = all === 20 && sd === 12 && opened === 20 && cat.join() === "Works with Spotify data" && def === "plasma";
  console.log(ok ? "PASS" : "FAIL", "style groups by sound source", JSON.stringify({ all, sd, opened, cat, def }));
  await b.close();
  process.exit(ok ? 0 : 1);
})();

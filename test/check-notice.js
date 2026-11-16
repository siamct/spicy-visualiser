// No helper: a one-time notice explains why the visualiser is empty, and it
// never comes back after a reload.
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.WebSocket = class { constructor() { setTimeout(() => this.onclose && this.onclose(), 5); } send() {} close() {} }; });
  const url = "file://" + path.join(__dirname, "harness.html");
  await p.goto(url);
  await p.waitForTimeout(7000);
  const first = await p.evaluate(() => { const n = document.querySelector(".lp-notice"); return n ? n.textContent : null; });
  if (first) await p.click(".lp-notice-no");
  await p.reload();
  await p.waitForTimeout(7000);
  const again = await p.evaluate(() => !!document.querySelector(".lp-notice"));
  const ok = !!first && /stays empty/.test(first) && !again;
  console.log(ok ? "PASS" : "FAIL", "one-time helper notice", JSON.stringify({ first, again }));
  await b.close();
  process.exit(ok ? 0 : 1);
})();

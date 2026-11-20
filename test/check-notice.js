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
  // "Install helper" opens the install window with the download button.
  if (first) await p.click(".lp-notice-go");
  const win = await p.evaluate(() => { const w = document.querySelector(".lp-install-wrap"); return w ? w.textContent : null; });
  if (win) await p.click(".lp-install-no");
  await p.reload();
  await p.waitForTimeout(7000);
  const again = await p.evaluate(() => !!document.querySelector(".lp-notice"));
  // Installed before (helper seen) but not running: says how to turn it on.
  await p.evaluate(() => localStorage.setItem("spicy-visualiser:helper-seen", "1"));
  await p.reload();
  await p.waitForTimeout(7000);
  const remind = await p.evaluate(() => { const n = document.querySelector(".lp-notice"); return n ? n.textContent : null; });
  const ok = !!first && /Spotify's data/.test(first) && !again && /starts with Windows/.test(remind || "") && /Download helper/.test(win || "");
  console.log(ok ? "PASS" : "FAIL", "one-time helper notice", JSON.stringify({ first, again, remind, win: !!win }));
  await b.close();
  process.exit(ok ? 0 : 1);
})();

// Screenshots of each lyric highlight style -> test/out/highlights.png
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.waitForTimeout(1000);
  const set = (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);
  await set("__style", "aurora");
  const names = ["soft", "fade", "sweep", "underline"];
  for (const n of names) { await set("glowStyle", n); await p.waitForTimeout(900); await p.screenshot({ path: path.join(__dirname, "out", `hl-${n}.png`), clip: { x: 380, y: 110, width: 640, height: 345 } }); }
  await b.close();
})();

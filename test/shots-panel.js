// Screenshots of the settings panel tabs and key styles -> test/out/
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.waitForTimeout(1000);
  const set = (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);
  await set("__style", "particles");
  await p.waitForTimeout(2500);
  await p.screenshot({ path: path.join(__dirname, "out", "style-particles.png") });
  await set("__style", "plasma");
  await p.waitForTimeout(2000);
  await p.screenshot({ path: path.join(__dirname, "out", "style-plasma.png") });
  await set("__style", "monstercat");
  for (const tab of ["style", "look", "sound", "lyrics", "more"]) {
    await p.evaluate((t) => { document.querySelector(".lp-button").click(); document.querySelector(`.lp-tabs button[data-v=${t}]`).click(); }, tab);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(__dirname, "out", `panel-${tab}.png`), clip: { x: 900, y: 60, width: 380, height: 620 } });
    await p.evaluate(() => document.querySelector(".lp-button").click());
  }
  await b.close();
})();

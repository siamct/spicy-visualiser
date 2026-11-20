// Screenshots of the full settings window (opened with the panel's expand button).
//   node test/shots-settings.js  ->  test/out/settings-<tab>.png
"use strict";
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "harness.html"));
  await p.waitForTimeout(1200);
  await p.click(".lp-button");
  await p.click(".lp-panel .lp-expand");
  await p.waitForTimeout(400);
  for (const t of ["style", "look", "more", "about"]) {
    await p.click(`.lp-modal-wrap .lp-tabs button[data-v=${t}]`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, "out", `settings-${t}.png`) });
  }
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  console.log("modal gone:", !(await p.$(".lp-modal-wrap")), "errors:", errs);
  await b.close();
})();

// Screenshots of each lyric highlight look -> test/out/hl-<look>.png
// (tools/make-doc-images.py puts them together as docs/screenshots/highlights.png)
// Picture only: the glow is made much brighter than in the app so the looks
// are easy to tell apart. Each look gets a fresh page, and the words are
// frozen on one word just before the picture so the glow can settle.
const { chromium } = require("playwright");
const path = require("path");
// [line, word] for each look (sweep stops mid-line to show the fill)
const AT = { soft: [1, 2], fade: [0, 4], sweep: [2, 2], underline: [3, 1] };
(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined });
  for (const [look, [li, wi]] of Object.entries(AT)) {
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await p.goto("file://" + path.join(__dirname, "harness.html"));
    await p.waitForTimeout(1000);
    await p.evaluate((look) => {
      const btn = document.querySelector(".lp-button");
      btn.click();
      document.querySelector(`[data-key=glowStyle] button[data-v=${look}]`).click();
      for (const [k, v] of [["opacity", 1], ["lyricDim", 0], ["glowStrength", 2]]) {
        const i = document.querySelector(`input[data-key=${k}]`);
        i.value = v;
        i.dispatchEvent(new Event("input", { bubbles: true }));
      }
      btn.click();
    }, look);
    await p.addStyleTag({ content: ".lp-modal-wrap{display:none!important}#SpicyLyricsPage .lp-canvas{filter:brightness(1.8) saturate(1.3)!important;opacity:1!important}" });
    await p.waitForTimeout(1000);
    await p.evaluate(([li, wi]) => {
      window.__hold = true;
      document.querySelectorAll(".Active").forEach((e) => e.classList.remove("Active"));
      const l = document.querySelectorAll(".line")[li];
      l.classList.add("Active");
      l.querySelectorAll(".word")[wi].classList.add("Active");
    }, [li, wi]);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(__dirname, "out", `hl-${look}.png`), clip: { x: 380, y: 110, width: 640, height: 345 } });
    await p.close();
  }
  await b.close();
})();

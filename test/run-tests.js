// Automated checks for Spicy Visualiser using a fake Spicy Lyrics page and a fake
// Spicetify player (test/harness.html). Run: node test/run-tests.js
// Optional: start the helper with fake music first: node helper/helper.js --test-tone
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });

const STYLES = ["particles", "monstercat", "ncs", "radial", "mirror", "plasma", "warp", "dnb", "ascii", "geometric", "bauhaus", "sub", "trap", "retro", "neuro", "ink", "motion", "led", "ledplasma"];
// Extra looks of a style: [style, setting key, value]
const VARIANTS = [["geometric", "variant", "brutalist"], ["neuro", "neuroLook", "lines"], ["neuro", "neuroLook", "ridges"], ["monstercat", "mcColor", "height"], ["monstercat", "mcColor", "solid"], ["monstercat", "mcColor", "bar"], ["trap", "circleAt", "art"], ["motion", "motionLook", "sweep"], ["motion", "motionLook", "radar"]];
const HIGHLIGHTS = ["soft", "fade", "sweep", "underline"];
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failed++;
};

(async () => {
  const browser = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [file, vp] of [["harness.html", { width: 1280, height: 720 }], ["harness-popout.html", { width: 380, height: 300 }]]) {
    const page = await browser.newPage({ viewport: vp });
    // LP_PORT: talk to a test helper on another port (when the real one is running).
    if (process.env.LP_PORT) await page.addInitScript((port) => {
      const WS = window.WebSocket;
      window.WebSocket = class extends WS { constructor(u, ...r) { super(String(u).replace(":47823", ":" + port), ...r); } };
    }, process.env.LP_PORT);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && !m.text().includes("WebSocket") && errors.push(m.text()));
    await page.goto("file://" + path.join(__dirname, file));
    await page.waitForTimeout(1200);
    const set = (key, val) =>
      page.evaluate(([k, v]) => {
        const btn = document.querySelector(".lp-button");
        btn.click();
        const b = document.querySelector(`[data-key=${k}] button[data-v=${v}]`);
        b.click();
        btn.click();
      }, [key, val]);
    const animating = () =>
      page.evaluate(() => new Promise((r) => {
        const c = document.querySelector("canvas.lp-canvas");
        const a = c.toDataURL();
        setTimeout(() => r(a !== c.toDataURL()), 300);
      }));
    const tag = file.replace(".html", "");

    check(`${tag}: button added to Spicy's view controls`, await page.$(".ViewControls .lp-button") !== null);
    for (const s of STYLES) {
      await set("__style", s);
      await page.waitForTimeout(700);
      check(`${tag}: style ${s} animates`, await animating());
      await page.screenshot({ path: path.join(OUT, `${tag}-${s}.png`) });
    }
    for (const [st, key, val] of VARIANTS) {
      await set("__style", st);
      await set(key, val);
      await page.waitForTimeout(700);
      check(`${tag}: style ${st} (${val}) animates`, await animating());
      await page.screenshot({ path: path.join(OUT, `${tag}-${st}-${val}.png`) });
    }
    await set("__style", "particles");
    for (const h of HIGHLIGHTS) {
      await set("glowStyle", h);
      await page.waitForTimeout(500);
      check(`${tag}: highlight ${h} runs`, errors.length === 0);
    }
    await page.waitForTimeout(1500);
    check(`${tag}: lyrics left untouched`,
      await page.evaluate(() => ![...document.querySelectorAll(".LyricsContent *")].some((e) => e.getAttribute("style"))));
    await set("__style", "off");
    await page.waitForTimeout(300);
    check(`${tag}: Off stops drawing`, !(await animating()));
    // Every tab of the panel renders.
    for (const tab of ["style", "look", "sound", "lyrics", "more"]) {
      await page.evaluate((t) => { document.querySelector(".lp-button").click(); document.querySelector(`.lp-tabs button[data-v=${t}]`).click(); }, tab);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(OUT, `${tag}-panel-${tab}.png`) });
      const visible = await page.$eval(`.lp-page[data-page=${tab}]`, (e) => !e.classList.contains("lp-hidden"));
      await page.evaluate(() => document.querySelector(".lp-button").click());
      check(`${tag}: panel tab ${tab} shows`, visible);
    }
    await set("__style", "monstercat");
    await page.waitForTimeout(500);
    // Break measuring for a few frames: the loop must recover.
    await page.evaluate(() => {
      const orig = Element.prototype.getBoundingClientRect;
      let n = 0;
      Element.prototype.getBoundingClientRect = function () {
        if (n++ < 5) throw new Error("boom");
        return orig.call(this);
      };
    });
    await page.waitForTimeout(600);
    check(`${tag}: keeps going after errors`, await animating());
    // Bluetooth delay: frames are held back but still arrive.
    await page.evaluate(() => { const r = document.querySelector("input[data-key=syncDelay]"); r.value = 200; r.dispatchEvent(new Event("input")); });
    await page.waitForTimeout(600);
    const st = await page.evaluate(() => window.SpicyVisualiser.state());
    check(`${tag}: audio delay holds frames back and stays live`, st.queued > 3 && st.live, JSON.stringify(st));
    await page.evaluate(() => { const r = document.querySelector("input[data-key=syncDelay]"); r.value = 0; r.dispatchEvent(new Event("input")); });
    // Resize the window: should keep drawing without errors.
    await set("__style", "particles");
    await page.setViewportSize({ width: Math.round(vp.width * 0.6), height: Math.round(vp.height * 0.7) });
    await page.waitForTimeout(500);
    await page.setViewportSize(vp);
    await page.waitForTimeout(500);
    check(`${tag}: survives resizing`, await animating());
    // Pause: should dim, not vanish.
    await page.evaluate(() => (window.Spicetify.Player.isPlaying = () => false));
    await page.waitForTimeout(1200);
    const op = await page.$eval("canvas.lp-canvas", (c) => parseFloat(c.style.opacity));
    check(`${tag}: dims when paused`, op > 0.1 && op < 0.6, "opacity " + op);
    await page.evaluate(() => (window.Spicetify.Player.isPlaying = () => true));
    const real = errors.filter((e) => !e.includes("boom"));
    check(`${tag}: no unexpected errors`, real.length === 0, real.slice(0, 3).join(" | "));
    await page.close();
  }
  await browser.close();
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
})();

// Screenshots of one style in the main view (1280x720) and the popout
// (420x340 with Spicy's song bar) -> test/out/shot-<name>-main.png / -popout.png
// Usage: node test/shots-style.js <style> [key=value ...]
//   e.g. node test/shots-style.js geometric variant=brutalist
// LP_LOUD=1: a loud, dense master (every band near the top), to check headroom.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });
const style = process.argv[2] || "particles";
const extra = process.argv.slice(3).map((a) => a.split("="));
const name = [style, ...extra.map(([, v]) => v)].join("-");

(async () => {
  const b = await chromium.launch({ channel: process.env.LP_BROWSER || undefined, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [file, vp, tag] of [["harness.html", { width: 1280, height: 720 }, "main"], ["harness-popout.html#bar", { width: 420, height: 340 }, "popout"]]) {
    const p = await b.newPage({ viewport: vp });
    // Fake loud music with a kick every 0.5 s instead of the real helper
    // (so the shots aren't of a quiet or paused Spotify).
    await p.addInitScript((loud) => {
      window.__loud = loud;
      window.WebSocket = class {
        constructor() {
          this.readyState = 1;
          setTimeout(() => this.onopen && this.onopen(), 10);
          const t0 = performance.now();
          this.iv = setInterval(() => {
            const t = (performance.now() - t0) / 1000, beat = t % 0.5;
            const kick = beat < 0.02 ? 1 : 0;
            const b = Array.from({ length: 64 }, (_, i) => Math.max(0, Math.min(1, (0.55 - i * 0.004) * (0.6 + 0.4 * Math.sin(t * 3 + i * 0.7)) + (i < 12 ? 0.5 * Math.exp(-beat * 8) : 0) + 0.15 * Math.random() + (window.__loud ? 0.55 : 0))));
            this.onmessage && this.onmessage({ data: JSON.stringify({ b, l: 0.7, a: 0.4, k: kick, s: beat > 0.25 && beat < 0.27 ? 0.6 : 0 }) });
          }, 16);
        }
        send() {}
        close() { clearInterval(this.iv); }
      };
    }, !!process.env.LP_LOUD);
    p.on("pageerror", (e) => console.log("ERROR", tag, e.message));
    await p.goto("file://" + path.join(__dirname, file));
    await p.waitForTimeout(1000);
    const set = (k, v) => p.evaluate(([k, v]) => { const btn = document.querySelector(".lp-button"); btn.click(); document.querySelector(`[data-key=${k}] button[data-v=${v}]`).click(); btn.click(); }, [k, v]);
    await set("__style", style);
    for (const [k, v] of extra) await set(k, v);
    await p.waitForTimeout(2500);
    const out = path.join(OUT, `shot-${name}-${tag}.png`);
    await p.screenshot({ path: out });
    console.log(out);
    await p.close();
  }
  await b.close();
})();

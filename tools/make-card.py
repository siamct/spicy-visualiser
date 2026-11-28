"""Builds the Marketplace card, docs/screenshots/card.webp, from pictures
made by test/song/card-frames.js: a coloured bar on top with the name and
the bars icon, and styles side by side below, each fading softly into the
next. Only the icon moves: its bars rise and fall slowly and smoothly (the
styles stay still, so nothing flickers).
  node test/song/card-frames.js && python tools/make-card.py"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "test", "out", "card")
OUT = os.path.join(ROOT, "docs", "screenshots", "card.webp")
IDS = ["monstercat", "ncs", "aurora", "plasma"]
FOCUS = {"monstercat": 0.3, "ncs": 0.5, "aurora": 0.5, "plasma": 0.6}
N = 60  # frames in the loop (6 s at 100 ms each)
S = 600
BH = 100  # the bar on top
PINK = (232, 53, 111)
BG = (12, 11, 16)


def font(size):
    for f in ("seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def masks(W, H, n):
    step = W / n
    over = step * 0.55
    out = []
    for i in range(n):
        w = round(step + over)
        m = Image.new("L", (w, 1))
        for x in range(w):
            a = 1.0
            if i > 0 and x < over:
                a = min(a, x / over)
            if i < n - 1 and x > w - over:
                a = min(a, (w - x) / over)
            m.putpixel((x, 0), round(255 * (a * a * (3 - 2 * a))))
        out.append((round(i * step - over / 2), w, m.resize((w, H))))
    return out


H = S - BH
MASKS = masks(S, H, len(IDS))
F = font(34)
still = Image.new("RGB", (S, S), BG)
for (x0, w, m), sid in zip(MASKS, IDS):
    im = Image.open(os.path.join(SRC, f"{sid}-24.png")).convert("RGB")
    s = H / im.height
    im = im.resize((round(im.width * s), H), Image.LANCZOS)
    left = max(0, min(im.width - w, round(im.width * FOCUS[sid] - w / 2)))
    still.paste(im.crop((left, 0, left + w, H)), (x0, BH), m)
frames = []
for k in range(N):
    card = still.copy()
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, S, BH), fill=PINK)
    # the icon: five bars, each bouncing a little at its own pace (loops cleanly)
    base, bw, gap = BH // 2 + 22, 9, 5
    for i, (hh, sp, ph) in enumerate(((30, 1, 0.1), (48, 2, 1.7), (36, 1, 3.1), (54, 1, 4.4), (24, 2, 2.2))):
        t = k / N * 2 * math.pi
        h = hh * (0.75 + 0.25 * (0.5 + 0.5 * math.sin(t * sp + ph)))
        x = 30 + i * (bw + gap)
        d.rounded_rectangle((x, base - h, x + bw, base), 3, fill=(255, 255, 255))
    d.text((112, BH // 2 + 1), "Spicy Visualiser", fill=(255, 255, 255), font=F, anchor="lm")
    frames.append(card)
frames[0].save(OUT, save_all=True, append_images=frames[1:], duration=100, loop=0, quality=80, method=6)
frames[0].save(os.path.join(ROOT, "docs", "screenshots", "card.png"), optimize=True)
print(OUT, os.path.getsize(OUT) // 1024, "KB")

"""Builds the Marketplace card, docs/screenshots/card.webp, from pictures
made by test/song/card-frames.js: a coloured bar on top with the name and
the bars icon, and below it Spectrum, Meters and Wall side by side, blended
softly into each other and lined up along the bottom. They all move with the
same slow, calm wave; the icon's bars rise and fall gently.
  node test/song/card-frames.js && python tools/make-card.py"""
import math
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageOps

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "test", "out", "card")
OUT = os.path.join(ROOT, "docs", "screenshots", "card.webp")
IDS = ["holospec", "ledm", "led"]  # Spectrum, Meters, Wall
FOCUS = {"holospec": 0.35, "ledm": 0.5, "led": 0.6}
N = 72  # frames in the loop, 125 ms each (9 s, the same as the wave)
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
FLOOR = H - 26  # where every style's drawing ends, so they line up along the bottom


def content_bottom(im):
    """The lowest row with clearly bright pixels in it (the bottom of the drawing)."""
    r, g_, b_ = im.split()
    g = ImageChops.lighter(ImageChops.lighter(r, g_), b_).point(lambda v: 255 if v > 120 else 0)  # brightest channel, so dark greens count
    px, (W2, H2) = g.load(), g.size
    for y in range(H2 - 1, -1, -1):
        if sum(1 for x in range(0, W2, 3) if px[x, y]) > W2 / 3 * 0.02:
            return y
    return H2 - 1


def aligned(im, floor=None):
    """Shift the picture up or down so its drawing ends on FLOOR; the space
    that opens up is filled with the picture's own dark background."""
    dy = (FLOOR if floor is None else floor) - content_bottom(im)
    out = Image.new("RGB", im.size)
    out.paste(im, (0, dy))
    if dy > 0:
        out.paste(im.crop((0, 0, im.width, 1)).resize((im.width, dy)), (0, 0))
    elif dy < 0:
        out.paste(im.crop((0, 0, im.width, 1)).resize((im.width, -dy)), (0, im.height + dy))  # dark background, not the bars
    return out


# each style's pictures cropped to its column, all moved by the same amount so
# the drawing ends on FLOOR (the same line for every style)
COLS = []
for (x0, w, m), sid in zip(MASKS, IDS):
    pics = []
    for n in range(N):
        im = Image.open(os.path.join(SRC, f"{sid}-{n}.png")).convert("RGB")
        s = H / im.height
        im = im.resize((round(im.width * s), H), Image.LANCZOS)
        left = max(0, min(im.width - w, round(im.width * FOCUS[sid] - w / 2)))
        # one pink for all three (Meters has its own fixed colours in the app)
        g = ImageOps.grayscale(im.crop((left, 0, left + w, H)))
        pics.append(ImageOps.colorize(g, black=BG, mid=PINK, white=(255, 214, 228), midpoint=110))
    floor = max(content_bottom(p) for p in pics)
    COLS.append([aligned(p, FLOOR - floor + content_bottom(p)) for p in pics])


frames = []
for k in range(N):
    pic = Image.new("RGB", (S, H), BG)
    for (x0, w, m), col in zip(MASKS, COLS):
        pic.paste(col[k], (x0, 0), m)
    card = Image.new("RGB", (S, S), BG)
    card.paste(pic, (0, BH))
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, S, BH), fill=PINK)
    # the icon: five bars, each bouncing a little at its own pace (loops cleanly)
    base, bw, gap = BH // 2 + 22, 9, 5
    for i, (hh, sp, ph) in enumerate(((30, 1, 0.1), (48, 2, 1.7), (36, 1, 3.1), (54, 1, 4.4), (24, 2, 2.2))):
        t = k / N * 2 * math.pi * 2  # two slow swings per loop
        h = hh * (0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * sp + ph)))
        x = 30 + i * (bw + gap)
        d.rounded_rectangle((x, base - h, x + bw, base), 3, fill=(255, 255, 255))
    d.text((112, BH // 2 + 1), "Spicy Visualiser", fill=(255, 255, 255), font=F, anchor="lm")
    frames.append(card)
OUTS = 480  # saved size: the Marketplace shows cards small, and it keeps the file light
small = [fr.resize((OUTS, OUTS), Image.LANCZOS) for fr in frames]
small[0].save(OUT, save_all=True, append_images=small[1:], duration=125, loop=0, quality=70, method=6)
frames[0].save(os.path.join(ROOT, "docs", "screenshots", "card.png"), optimize=True)
print(OUT, os.path.getsize(OUT) // 1024, "KB")

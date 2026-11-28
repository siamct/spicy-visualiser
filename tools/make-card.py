"""Builds the Marketplace card, docs/screenshots/card.webp, from pictures
made by test/song/card-frames.js: a coloured bar on top with the name and
the bars icon, and below it one style at a time, each zooming in very
slowly and then fading softly into the next. The style pictures themselves
play at their real speed while they show; the icon's bars rise and fall.
  node test/song/card-frames.js && python tools/make-card.py"""
import math
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "test", "out", "card")
OUT = os.path.join(ROOT, "docs", "screenshots", "card.webp")
IDS = ["holospec", "ledm", "led"]  # Spectrum, Meters, Wall
FOCUS = {"holospec": 0.35, "ledm": 0.5, "led": 0.6}
EACH, FADE = 36, 8  # frames per style and frames of fade into the next (125 ms each)
N = EACH * len(IDS)  # the whole loop: 13.5 s
ZOOM = 0.08  # how far each style zooms in while it's showing
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


still = Image.new("RGB", (S, S), BG)
for (x0, w, m), sid in zip(MASKS, IDS):
    im = Image.open(os.path.join(SRC, f"{sid}-24.png")).convert("RGB")
    s = H / im.height
    im = im.resize((round(im.width * s), H), Image.LANCZOS)
    left = max(0, min(im.width - w, round(im.width * FOCUS[sid] - w / 2)))
    still.paste(aligned(im.crop((left, 0, left + w, H))), (x0, BH), m)
# each style's pictures, cropped to fill the space under the bar (with room
# to zoom), all moved by the same amount so every style ends on the same line
def prep(sid, n):
    im = Image.open(os.path.join(SRC, f"{sid}-{n}.png")).convert("RGB")
    sc = H * (1 + ZOOM) / im.height
    im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    w = round(S * (1 + ZOOM))
    left = max(0, min(im.width - w, round(im.width * 0.5 - w / 2)))
    return im.crop((left, 0, left + w, im.height))


FULL = []
for sid in IDS:
    pics = [prep(sid, n) for n in range(EACH + FADE)]
    ch = pics[0].height
    dy = ch - round(40 * (1 + ZOOM)) - max(content_bottom(p) for p in pics)
    FULL.append([aligned(p, content_bottom(p) + dy) for p in pics])


def view(i, z, n):
    """Style i, picture n, zoomed in by z (0..ZOOM), held to the bottom so the bars stay put."""
    im = FULL[i][n]
    cw, ch = im.width / (1 + z), im.height / (1 + z)
    x0 = (im.width - cw) / 2
    return im.crop((round(x0), round(im.height - ch), round(x0 + cw), im.height)).resize((S, H), Image.LANCZOS)


def ease(t):
    return t * t * (3 - 2 * t)


frames = []
for k in range(N):
    i, f = divmod(k, EACH)
    z = ZOOM * (f + FADE) / (EACH + FADE)  # zooms the whole time it shows, fade included
    pic = view(i, z, f + FADE)
    if f >= EACH - FADE:  # fade into the next one, which starts zoomed out
        nxt = view((i + 1) % len(IDS), ZOOM * (f - (EACH - FADE)) / (EACH + FADE), f - (EACH - FADE))
        pic = Image.blend(pic, nxt, ease((f - (EACH - FADE) + 1) / (FADE + 1)))
    card = Image.new("RGB", (S, S), BG)
    card.paste(pic, (0, BH))
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, S, BH), fill=PINK)
    # the icon: five bars, each bouncing a little at its own pace (loops cleanly)
    base, bw, gap = BH // 2 + 22, 9, 5
    for i, (hh, sp, ph) in enumerate(((30, 1, 0.1), (48, 2, 1.7), (36, 1, 3.1), (54, 1, 4.4), (24, 2, 2.2))):
        t = k / N * 2 * math.pi * 4  # four swings per loop
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

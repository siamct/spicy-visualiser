"""Builds the docs pictures from test/out/doc-*.png (made by
test/song/docs-shots.js):
  docs/screenshots/styles/<style>.jpg   one per style (styles guide)
  docs/screenshots/all-styles.jpg       labelled grid of every style
  docs/screenshots/styles.jpg           README header: styles blending into each other, with the name
  docs/screenshots/panel.png            settings panel tabs side by side
  node test/song/docs-shots.js && python tools/make-doc-images.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "test", "out")
DOCS = os.path.join(ROOT, "docs", "screenshots")

GROUPS = [
    ("Bars", [("monstercat", "Monstercat"), ("mirror", "Mirror Bars"), ("holospec", "Spectrum"), ("ledm", "Meters"), ("led", "Wall"), ("ascii", "ASCII"), ("rgbsplit", "Chroma")]),
    ("Meters & lines", [("vu", "VU Meters"), ("scope", "Oscilloscope"), ("crt", "CRT"), ("ekg", "EKG"), ("flowline", "Flow Line"), ("ribbon", "Ribbon"), ("dnb", "Liquid")]),
    ("Circles", [("radial", "Radial Bars"), ("ncs", "Sphere"), ("holoring", "Holo Ring"), ("sub", "Subwoofer"), ("trap", "Trap"), ("tunnel", "Starfield Tunnel")]),
    ("On the beat", [("drumpads", "Drum Pads"), ("geometric", "Geometric"), ("bauhaus", "Bauhaus"), ("particles", "Particles")]),
    ("Liquid & water", [("plasma", "Plasma"), ("ledplasma", "LED"), ("tvpixels", "TV"), ("oil", "Oil Slick"), ("silk", "Silk"), ("lava", "Lava Lamp"), ("underwater", "Underwater")]),
    ("Nature & magic", [("lanterns", "Lanterns"), ("runes", "Runes")]),
    ("Sky & space", [("aurora", "Aurora"), ("galaxy", "Galaxy"), ("nebula", "Nebula Drift"), ("sunset", "Sunset"), ("nightsky", "Night Sky"), ("constellations", "Constellations"), ("warp", "Warp"), ("ombre", "Ombre")]),
    ("Textures", [("prism", "Graphite"), ("rain", "Rain"), ("smoke", "Smoke"), ("neuro", "Mesh")]),
]
BG = (12, 11, 16)


def font(bold, size):
    for f in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    return ImageFont.load_default()


def shot(sid):
    return Image.open(os.path.join(SRC, f"doc-{sid}.png")).convert("RGB")


# 1. one picture per style
os.makedirs(os.path.join(DOCS, "styles"), exist_ok=True)
for _, items in GROUPS:
    for sid, _ in items:
        shot(sid).resize((720, 720), Image.LANCZOS).save(os.path.join(DOCS, "styles", f"{sid}.jpg"), quality=84)

# 2. labelled grid, in the panel's group order
TW, TH, COLS, LAB, PAD = 280, 280, 5, 34, 10
cells = [(sid, name) for _, items in GROUPS for sid, name in items]
rows = (len(cells) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * (TW + PAD) + PAD, rows * (TH + LAB + PAD) + PAD), BG)
d = ImageDraw.Draw(sheet)
f = font(True, 19)
for i, (sid, name) in enumerate(cells):
    x = PAD + (i % COLS) * (TW + PAD)
    y = PAD + (i // COLS) * (TH + LAB + PAD)
    d.text((x + 2, y + 6), name, fill=(232, 232, 236), font=f)
    sheet.paste(shot(sid).resize((TW, TH), Image.LANCZOS), (x, y + LAB))
sheet.save(os.path.join(DOCS, "all-styles.jpg"), quality=84)


def blend(ids, W, H, focus):
    """Styles side by side, each fading softly into the next."""
    n = len(ids)
    step = W / n
    over = step * 0.55
    out = Image.new("RGB", (W, H), BG)
    for i, sid in enumerate(ids):
        im = shot(sid)
        s = H / im.height
        im = im.resize((round(im.width * s), H), Image.LANCZOS)
        x0 = round(i * step - over / 2)
        w = round(step + over)
        fx = focus.get(sid, 0.5)
        left = max(0, min(im.width - w, round(im.width * fx - w / 2)))
        piece = im.crop((left, 0, left + w, H))
        mask = Image.new("L", (w, 1))
        for x in range(w):
            a = 1.0
            if i > 0 and x < over:
                a = min(a, x / over)
            if i < n - 1 and x > w - over:
                a = min(a, (w - x) / over)
            mask.putpixel((x, 0), round(255 * (a * a * (3 - 2 * a))))
        out.paste(piece, (x0, 0), mask.resize((w, H)))
    return out


def title(img, size, sub_size, sub):
    W, H = img.size
    # darken a soft band in the middle so the name reads over anything
    shade = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shade).ellipse((W * 0.12, H * 0.22, W * 0.88, H * 0.78), fill=175)
    shade = shade.filter(ImageFilter.GaussianBlur(H * 0.16))
    img = Image.composite(Image.new("RGB", (W, H), (6, 6, 9)), img, shade)
    t, s = font(True, size), font(False, sub_size)
    name = "Spicy Visualiser"
    d = ImageDraw.Draw(img)
    tw = d.textlength(name, font=t)
    sw = d.textlength(sub, font=s)
    gap = round(size * 0.25)
    total = size + gap + sub_size
    ty = (H - total) / 2 - size * 0.12
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).text(((W - tw) / 2, ty), name, fill=140, font=t)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.18))
    img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, glow)
    d = ImageDraw.Draw(img)
    d.text(((W - tw) / 2, ty), name, fill=(255, 255, 255), font=t)
    d.text(((W - sw) / 2, ty + size + gap), sub, fill=(214, 214, 222), font=s)
    return img


FOCUS = {"monstercat": 0.3, "aurora": 0.45, "ncs": 0.5, "aurora": 0.5, "oil": 0.75, "prism": 0.5, "vu": 0.25, "galaxy": 0.5, "ribbon": 0.5}
# 3. README header
head = blend(["monstercat", "ncs", "galaxy", "aurora", "oil"], 1760, 440, FOCUS)
title(head, 96, 30, "A music visualiser for Spicy Lyrics").save(os.path.join(DOCS, "styles.jpg"), quality=88)
# 4. The Marketplace card is made by tools/make-card.py (it moves).

# 5. settings panel tabs side by side
tabs = [Image.open(os.path.join(SRC, f"doc-panel-{t}.png")).convert("RGB") for t in ("style", "look", "sound", "more")]
pw, ph = tabs[0].size
panel = Image.new("RGB", (pw * 4 + 12 * 3, ph), BG)
for i, im in enumerate(tabs):
    panel.paste(im, (i * (pw + 12), 0))
panel.save(os.path.join(DOCS, "panel.png"), optimize=True)

# 6. lyric highlight looks, 2x2 with names (from test/shots-highlights.js)
looks = [("soft", "Soft"), ("fade", "Fade"), ("sweep", "Sweep"), ("underline", "Underline")]
if all(os.path.exists(os.path.join(SRC, f"hl-{n}.png")) for n, _ in looks):
    (W, H), LB = Image.open(os.path.join(SRC, "hl-soft.png")).size, 40
    hl = Image.new("RGB", (W * 2 + 12, (H + LB) * 2 + 12), BG)
    d = ImageDraw.Draw(hl)
    for i, (n, name) in enumerate(looks):
        x, y = (i % 2) * (W + 12), (i // 2) * (H + LB + 12)
        d.text((x + 4, y + 6), name, fill=(235, 235, 240), font=font(True, 22))
        hl.paste(Image.open(os.path.join(SRC, f"hl-{n}.png")).convert("RGB"), (x, y + LB))
    hl.save(os.path.join(DOCS, "highlights.png"), optimize=True)
print("ok")

"""Builds the Marketplace card, docs/screenshots/card.gif (plus card.png, one
frame): a banner with the name over LED Wall, ASCII, Retro Bars and
Monstercat in turn, crossfading between them.
  node test/song/card.js && python tools/make-card.py

Each style is measured in its own frames (where its bars stand and how tall
they get) and framed so all four share one baseline and one height."""
import glob, os
from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "test", "out", "card")
STYLES = ["led", "ascii", "retro", "monstercat"]
S = 1000                     # laid out at the other Spicy add-ons' scale
OUT = 600                    # saved smaller: same shape, sensible file size
BH = 190                     # banner height
COL = (232, 53, 111)         # one solid banner colour
BG = (12, 10, 18)            # page background behind the bars
BODY = S - BH
BASE = BODY - 4              # bars stand right on the bottom edge, like the LED panel
# Side margins some styles leave (fraction of the width), stretched away so
# every style runs edge to edge like the LED panel.
MARGIN = {"monstercat": 0.06, "retro": 0.04}
FADE = 6                     # crossfade length in frames

banner = Image.new("RGB", (S, BH), COL)
d = ImageDraw.Draw(banner)
for i, h in enumerate((52, 88, 64, 104, 40)):
    x = 72 + i * 24
    d.rounded_rectangle((x, BH // 2 + 52 - h, x + 15, BH // 2 + 52), 6, fill=(255, 255, 255))
font = ImageFont.truetype("seguisb.ttf", 84)
d.text((228, BH // 2 - 2), "Spicy Visualiser", fill=(255, 255, 255), font=font, anchor="lm")

frames = {s: [Image.open(f).convert("RGB") for f in sorted(glob.glob(os.path.join(SRC, s, "*.png")))] for s in STYLES}
N = len(frames[STYLES[0]])


def measure(ims):
    """Baseline row and typical peak row of the bright bars across frames."""
    base, tops = 0, []
    for im in ims[::3]:
        # bright in any channel (Retro's bottom rows are a deep blue)
        r, gg, b = im.split()
        g = ImageChops.lighter(ImageChops.lighter(r, gg), b).point(lambda v: 255 if v > 110 else 0)
        rows = [y for y in range(g.height) if g.crop((0, y, g.width, y + 1)).getbbox()]
        if rows:
            base = max(base, rows[-1])
            tops.append(rows[0])
    tops.sort()
    return base, tops[len(tops) // 10]  # near the tallest, ignoring one-offs


def framer(name, ims):
    """Full width, moved up or down so every style stands on BASE (heights
    are matched in the render, see SENS and SIZE in test/song/card.js)."""
    base, top = measure(ims)
    print(f"{name}: base {base} top {top} height {base - top}")
    y0 = base - BASE

    def frame(im):
        canvas = Image.new("RGB", (S, BODY), BG)
        m = round(im.width * MARGIN.get(name, 0))
        part = im.crop((m, max(0, y0), im.width - m, min(im.height, y0 + BODY)))
        canvas.paste(part.resize((S, part.height), Image.LANCZOS) if part.width != S else part, (0, max(0, -y0)))
        return canvas
    return frame


bodies = {}
for s in STYLES:
    fr = framer(s, frames[s])
    bodies[s] = [fr(im) for im in frames[s]]

# Which style owns each frame, with a crossfade around every change
# (including the wrap from the last style back to the first).
edges = [round(i * N / len(STYLES)) for i in range(len(STYLES))] + [N]
half = FADE // 2
cards = []
for f in range(N):
    k = max(i for i in range(len(STYLES)) if edges[i] <= f)
    body = bodies[STYLES[k]][f]
    if f >= edges[k + 1] - half:                 # fading into the next style
        a = (f - (edges[k + 1] - half) + 1) / (FADE + 1)
        body = Image.blend(body, bodies[STYLES[(k + 1) % len(STYLES)]][f], a)
    elif f < edges[k] + FADE - half:             # finishing the fade from the last one
        a = (f - edges[k] + half + 1) / (FADE + 1)
        body = Image.blend(bodies[STYLES[k - 1]][f], body, a)
    card = Image.new("RGB", (S, S), BG)
    card.paste(banner, (0, 0))
    card.paste(body, (0, BH))
    cards.append(card.resize((OUT, OUT), Image.LANCZOS))

# One palette per style section (blends included), no dithering: nothing
# shimmers from frame to frame.
q = []
for i in range(len(STYLES)):
    seg = cards[edges[i]:edges[i + 1]]
    sheet = Image.new("RGB", (OUT, OUT * 4))
    for j, c in enumerate((seg[0], seg[len(seg) // 3], seg[2 * len(seg) // 3], seg[-1])):
        sheet.paste(c, (0, j * OUT))
    pal = sheet.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    q += [c.quantize(palette=pal, dither=Image.Dither.NONE) for c in seg]

gif = os.path.join(ROOT, "docs", "screenshots", "card.gif")
q[0].save(gif, save_all=True, append_images=q[1:], duration=67, loop=0, optimize=True)
cards[N // 8].save(os.path.join(ROOT, "docs", "screenshots", "card.png"), optimize=True)
print(gif, f"{os.path.getsize(gif) / 1e6:.2f} MB", len(q), "frames")

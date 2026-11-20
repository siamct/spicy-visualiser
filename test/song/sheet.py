"""Joins test/out/song-*.png into docs/screenshots/all-styles-song.jpg (labelled grid)."""
import glob, os
from PIL import Image, ImageDraw, ImageFont
root = os.path.join(os.path.dirname(__file__), "..", "..")
order = ["monstercat", "monstercat-height", "mirror", "radial", "retro", "ascii", "led", "ncs", "trap", "sub", "motion",
         "geometric", "bauhaus", "particles", "plasma", "ledplasma", "ink", "warp", "dnb", "neuro", "neuro-ridges"]
names = {"monstercat-height": "monstercat (area colour)", "neuro-ridges": "neuro (ridges)", "ledplasma": "led plasma", "ncs": "ncs circle", "trap": "trap circle", "sub": "sub circle", "motion": "beat motion"}
W, H, COLS = 480, 270, 3
rows = (len(order) + COLS - 1) // COLS
sheet = Image.new("RGB", (W * COLS, (H + 30) * rows), "#111")
d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype("arialbd.ttf", 18)
except OSError: font = ImageFont.load_default()
for i, n in enumerate(order):
    im = Image.open(os.path.join(root, "test", "out", f"song-{n}.png")).convert("RGB").resize((W, H), Image.LANCZOS)
    x, y = (i % COLS) * W, (i // COLS) * (H + 30)
    sheet.paste(im, (x, y + 30))
    d.text((x + 10, y + 5), names.get(n, n).title(), fill="#eee", font=font)
out = os.path.join(root, "docs", "screenshots", "all-styles-song.jpg")
sheet.save(out, quality=85)
print(out, sheet.size, os.path.getsize(out) // 1024, "KB")

# Builds spicy-visualiser.js from the template: inlines the stylesheet.
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
tpl = (root / "src/spicy-visualiser.template.js").read_text(encoding="utf-8")
css = (root / "src/style.css").read_text(encoding="utf-8")

def esc(s):
    assert "${" not in s
    return s.replace("\\", "\\\\").replace("`", "\\`")

sub = {}
sub["__CSS__"] = esc(css)
for k, v in sub.items():
    assert k in tpl, k
    tpl = tpl.replace(k, v)
# Plain ASCII output (\uXXXX for anything else), so it reads the same
# however Spotify loads it.
tpl = "".join(c if ord(c) < 128 else "\\u%04x" % ord(c) if ord(c) < 0x10000 else "\\u{%x}" % ord(c) for c in tpl)
(root / "spicy-visualiser.js").write_text(tpl, encoding="ascii")
print("built", len(tpl), "bytes")

# Builds spicy-visualiser.js from the template: inlines the NCS shaders
# (Konsl/spicetify-visualizer, MIT) and the stylesheet.
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
kv = root / "src/vendor/konsl-ncs"
tpl = (root / "src/spicy-visualiser.template.js").read_text()
css = (root / "src/style.css").read_text()

def shaders(name):
    src = (kv / f"{name}.ts").read_text()
    parts = re.findall(r"export const (\w+) = `(.*?)`;", src, re.S)
    return dict(parts)

def esc(s):
    assert "${" not in s
    return s.replace("\\", "\\\\").replace("`", "\\`")

sub = {}
for key, name in [("PARTICLE", "particle"), ("DOT", "dot"), ("BLUR", "blur"), ("FIN", "finalize")]:
    sh = shaders(name)
    sub[f"__{key}_VS__"] = esc(sh["vertexShader"])
    sub[f"__{key}_FS__"] = esc(sh["fragmentShader"])
sub["__CSS__"] = esc(css)
for k, v in sub.items():
    assert k in tpl, k
    tpl = tpl.replace(k, v)
(root / "spicy-visualiser.js").write_text(tpl)
print("built", len(tpl), "bytes")

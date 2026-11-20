"""Builds setup/SpicyVisualiserHelper.zip: extract it and double-click
"Install helper.bat" to install the helper (with its own Node.js) for the
current Windows user. No .exe.

    python tools/make-setup.py
"""
import os
import shutil
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HELPER = os.path.join(ROOT, "helper")
SETUP = os.path.join(ROOT, "setup")
OUT = os.path.join(SETUP, "SpicyVisualiserHelper.zip")


def skip(rel):
    rel = rel.replace("\\", "/")
    return (
        rel.endswith(".log")
        or "/prebuilds/linux" in rel
        or "/prebuilds/darwin" in rel
        or "/src/" in rel and "loopback-capture" in rel
        or rel.startswith("node_modules/.bin")
    )


def main():
    work = tempfile.mkdtemp(prefix="sv-setup-")
    try:
        zpath = os.path.join(work, "helper.zip")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
            for base, _, files in os.walk(HELPER):
                for f in files:
                    full = os.path.join(base, f)
                    rel = os.path.relpath(full, HELPER)
                    if not skip(rel):
                        z.write(full, rel)
        # One zip: extract it, double-click "Install helper.bat". Like the
        # original repo installer, with no .exe.
        if os.path.exists(OUT):
            os.remove(OUT)
        with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(os.path.join(SETUP, "Install helper.bat"), "SpicyVisualiserHelper/Install helper.bat")
            z.write(os.path.join(SETUP, "setup.ps1"), "SpicyVisualiserHelper/setup.ps1")
            z.write(os.path.join(SETUP, "uninstall-helper.ps1"), "SpicyVisualiserHelper/uninstall-helper.ps1")
            z.write(zpath, "SpicyVisualiserHelper/helper.zip")
        print("built", OUT, os.path.getsize(OUT) // 1024, "KB")
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()

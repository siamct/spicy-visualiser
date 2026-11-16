"""Builds setup/SpicyVisualiserHelperSetup.exe: one file that installs the
helper (with its own Node.js) for the current Windows user.

Packs helper/ (helper.js, package.json, node_modules) into helper.zip, then
uses Windows' own IExpress to wrap setup.ps1, uninstall-helper.ps1 and the zip
into a self-extracting .exe that runs setup.ps1.

    python tools/make-setup.py
"""
import os
import shutil
import subprocess
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HELPER = os.path.join(ROOT, "helper")
SETUP = os.path.join(ROOT, "setup")
OUT = os.path.join(SETUP, "SpicyVisualiserHelperSetup.exe")


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
        for f in ("setup.ps1", "uninstall-helper.ps1"):
            shutil.copy(os.path.join(SETUP, f), work)
        files = ["setup.ps1", "uninstall-helper.ps1", "helper.zip"]
        sed = os.path.join(work, "setup.sed")
        lines = [
            "[Version]", "Class=IEXPRESS", "SEDVersion=3",
            "[Options]", "PackagePurpose=InstallApp", "ShowInstallProgramWindow=0", "HideExtractAnimation=1",
            "UseLongFileName=1", "InsideCompressed=0", "CAB_FixedSize=0", "CAB_ResvCodeSigning=0", "RebootMode=N",
            "InstallPrompt=%InstallPrompt%", "DisplayLicense=%DisplayLicense%", "FinishMessage=%FinishMessage%",
            "TargetName=%TargetName%", "FriendlyName=%FriendlyName%", "AppLaunched=%AppLaunched%",
            "PostInstallCmd=%PostInstallCmd%", "AdminQuietInstCmd=%AdminQuietInstCmd%", "UserQuietInstCmd=%UserQuietInstCmd%",
            "SourceFiles=SourceFiles",
            "[Strings]", "InstallPrompt=", "DisplayLicense=", "FinishMessage=",
            f"TargetName={OUT}", "FriendlyName=Spicy Visualiser helper setup",
            "AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File setup.ps1",
            "PostInstallCmd=<None>", "AdminQuietInstCmd=", "UserQuietInstCmd=",
        ]
        lines += [f'FILE{i}="{f}"' for i, f in enumerate(files)]
        lines += ["[SourceFiles]", f"SourceFiles0={work}\\", "[SourceFiles0]"]
        lines += [f"%FILE{i}%=" for i in range(len(files))]
        with open(sed, "w", encoding="ascii") as fh:
            fh.write("\r\n".join(lines) + "\r\n")
        if os.path.exists(OUT):
            os.remove(OUT)
        subprocess.run([os.path.join(os.environ["WINDIR"], "System32", "iexpress.exe"), "/N", "/Q", sed], check=True)
        print("built", OUT, os.path.getsize(OUT) // 1024, "KB")
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()

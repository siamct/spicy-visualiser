#!/usr/bin/env bash
# Builds spicy-visualiser.js and a ready-to-install zip in dist/.
# The zip includes the helper's node_modules, so installing needs no npm.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 src/build.py
node --check spicy-visualiser.js
(cd helper && npm install --omit=dev --no-audit --no-fund >/dev/null)
rm -rf dist && mkdir -p dist/Spicy-Visualiser
cp -r spicy-visualiser.js install.ps1 uninstall.ps1 "Install Spicy Visualiser.bat" "Uninstall Spicy Visualiser.bat" README.md dist/Spicy-Visualiser/
mkdir -p dist/Spicy-Visualiser/helper
cp -r helper/helper.js helper/package.json helper/package-lock.json helper/node_modules dist/Spicy-Visualiser/helper/
# Windows only needs the Windows build of the audio module.
rm -rf dist/Spicy-Visualiser/helper/node_modules/loopback-capture/prebuilds/linux-x64 dist/Spicy-Visualiser/helper/node_modules/loopback-capture/src
(cd dist && zip -qr Spicy-Visualiser.zip Spicy-Visualiser)
echo "dist/Spicy-Visualiser.zip ready"

#!/bin/sh
# Renders og/banner.html to public/og.png (1200x630) with headless Chrome.
cd "$(dirname "$0")/.." || exit 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=6000 \
  --screenshot="$PWD/public/og.png" "file://$PWD/og/banner.html" 2>/dev/null

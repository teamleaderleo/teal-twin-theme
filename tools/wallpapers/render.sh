#!/bin/bash
# Draws one wallpaper with headless Chrome and writes it as WebP.
#   tools/wallpapers/render.sh KIND MODE WIDTH HEIGHT QUALITY OUT
#   KIND: waves | soundwave | notes | ribbons | halftone | header;  MODE: dark | light
# Every wallpaper in this repo: 2560x1600 at 0.86, panes 1280x800 at 0.84, header 1200x360 at 0.88.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
chrome="${CHROME:-google-chrome}"
url="file://$here/art.html?kind=$1&mode=$2&w=$3&h=$4&q=$5"
$chrome ${CHROME_FLAGS:-} --headless=new --disable-gpu --allow-file-access-from-files \
  --virtual-time-budget=20000 --dump-dom "$url" 2>/dev/null \
  | grep -o 'data:image/webp;base64,[A-Za-z0-9+/=]*' | sed 's/^data:image\/webp;base64,//' | base64 -d > "$6"

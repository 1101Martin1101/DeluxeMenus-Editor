#!/usr/bin/env bash
# Build the DeluxeMenus Editor as the private test build (/dm-editor/test/).
#
# The production build (/dm-editor/) is untouched: this script temporarily
# changes the CRA homepage, builds into build/, copies the result to
# ../public/dm-editor-test and restores package.json afterwards.
set -euo pipefail

cd "$(dirname "$0")"
DEST="${1:-$(cd "$(dirname "$0")/.." && pwd)/public/dm-editor-test}"

cp package.json package.json.bak
restore() {
  mv -f package.json.bak package.json
}
trap restore EXIT

sed -i 's#"homepage": "/dm-editor/"#"homepage": "/dm-editor/test/"#' package.json

export NODE_OPTIONS=--openssl-legacy-provider
npm run build

# Source maps are useless in production and roughly double the deploy size.
find build -name '*.map' -delete

rm -rf "$DEST"
mkdir -p "$DEST"
cp -a build/. "$DEST/"

echo "Deployed DeluxeMenus Editor test build -> $DEST"
echo "Live at https://mc-api.kulih.eu/dm-editor/test/"

#!/usr/bin/env bash
# Build the DeluxeMenus Editor and publish it into the mc-api site.
#
# The editor source lives inside mc-api (dm-editor-src/), so the built bundle
# goes straight into mc-api's public/dm-editor unless a destination is given:
#
#   ./deploy.sh                 # -> ../public/dm-editor
#   ./deploy.sh /some/other/dir # custom destination
#
# The editor is a static CRA bundle, so no server restart is needed: mc-api
# serves /dm-editor/ from public/dm-editor and templates the shell per request.
set -euo pipefail

cd "$(dirname "$0")"
DEST="${1:-$(cd "$(dirname "$0")/.." && pwd)/public/dm-editor}"

export NODE_OPTIONS=--openssl-legacy-provider
npm run build

# Source maps are useless in production and roughly double the deploy size.
find build -name '*.map' -delete

rm -rf "$DEST"
mkdir -p "$DEST"
cp -a build/. "$DEST/"

echo "Deployed DeluxeMenus Editor -> $DEST"
echo "Live at https://mc-api.kulih.eu/dm-editor/"

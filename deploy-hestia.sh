#!/usr/bin/env bash
set -euo pipefail

: "${HESTIA_TARGET:?Set HESTIA_TARGET, e.g. user@server}"
: "${HESTIA_WEBROOT:?Set HESTIA_WEBROOT, e.g. /home/user/web/signalspiral.norgan.net/public_html}"

FILES=(
  index.html
  styles.css
  app.js
  relationship-obfuscation.js
  arc-v2.js
  harmonics432.js
  tone-engine.js
)

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required production file: $file" >&2
    exit 1
  fi
done

echo "Deploying Signal Spiral static bundle to ${HESTIA_TARGET}:${HESTIA_WEBROOT%/}/"
rsync -avz --checksum --protect-args \
  "${FILES[@]}" \
  "${HESTIA_TARGET}:${HESTIA_WEBROOT%/}/"

echo
 echo "Remote bundle hashes:"
ssh "$HESTIA_TARGET" \
  "cd \"${HESTIA_WEBROOT%/}\" && sha256sum ${FILES[*]}"

echo
 echo "Deployment complete. Verify https://signalspiral.norgan.net/ in a fresh browser session."

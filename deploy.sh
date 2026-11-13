#!/bin/sh
# Deploy the site to Vercel (project "babelon") from a copy without .git.
# The copy keeps the Git author out of the Vercel deployment record.
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)/babelon"
mkdir -p "$TMP"
cp -R "$SRC/index.html" "$SRC/styles.css" "$SRC/main.js" "$SRC/assets" "$TMP/"
[ -f "$SRC/vercel.json" ] && cp "$SRC/vercel.json" "$TMP/"
cd "$TMP"
vercel link --yes --project babelon >/dev/null
vercel deploy --prod --yes

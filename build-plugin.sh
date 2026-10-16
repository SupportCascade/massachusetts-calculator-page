#!/bin/sh
# Builds dist/massachusetts-calculator-<version>.zip, ready for Plugins > Add New > Upload Plugin.
# The plugin has no build step: the CSS and JS in assets/ are the files WordPress serves.
set -e
cd "$(dirname "$0")"
VERSION=$(sed -n 's/^ \* Version: *//p' wordpress-plugin/massachusetts-calculator/massachusetts-calculator.php | tr -d '[:space:]')
CONST=$(sed -n "s/^define( 'MACALC_VERSION', '\(.*\)' );/\1/p" wordpress-plugin/massachusetts-calculator/massachusetts-calculator.php)
if [ "$VERSION" != "$CONST" ]; then echo "Version header ($VERSION) and MACALC_VERSION ($CONST) differ" >&2; exit 1; fi
mkdir -p dist
OUT="dist/massachusetts-calculator-$VERSION.zip"
rm -f "$OUT"
(cd wordpress-plugin && zip -rqX "../$OUT" massachusetts-calculator -x '*.DS_Store')
echo "$(pwd)/$OUT"

#!/usr/bin/env bash
# Verify the poster you are about to print.
#
#   1. the word list matches the canonical BIP-39 file, byte for byte
#   2. the committed index.html is exactly what scripts/build.py produces
#   3. all 2048 words are present in the built page
#
# Run this before trusting a copy you did not build yourself.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CANONICAL_SHA="2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda"

pass() { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; exit 1; }

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  else shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

echo "verifying $ROOT"

# 1. word list integrity
actual="$(sha256 "$ROOT/data/english.txt")"
[[ "$actual" == "$CANONICAL_SHA" ]] \
  || fail "word list sha256 is $actual, expected $CANONICAL_SHA"
pass "word list matches bitcoin/bips bip-0039/english.txt"

count="$(wc -w < "$ROOT/data/english.txt" | tr -d ' ')"
[[ "$count" == "2048" ]] || fail "expected 2048 words, found $count"
pass "2048 words"

# 2. reproducible build — rebuilt into a temp file, never over the audited one
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
python3 "$ROOT/scripts/build.py" --out "$tmp/index.rebuilt.html" >/dev/null
diff -q "$ROOT/index.html" "$tmp/index.rebuilt.html" >/dev/null \
  || fail "committed index.html does not match a fresh build"
pass "committed index.html reproduces exactly"

# 3. every word actually reached the page
missing=0
while read -r word; do
  grep -q "\"$word\"" "$ROOT/index.html" || { echo "    missing: $word"; missing=$((missing + 1)); }
done < "$ROOT/data/english.txt"
[[ "$missing" == "0" ]] || fail "$missing words missing from index.html"
pass "all 2048 words embedded in index.html"

echo "verified."

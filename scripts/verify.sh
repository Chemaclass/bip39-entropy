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
# One read, one pass. Grepping the file once per word took four seconds and,
# worse, reported phantom misses whenever anything rebuilt index.html mid-run.
if python3 "$ROOT/scripts/embedded.py" "$ROOT"; then
  pass "all 2048 words embedded in index.html"
else
  fail "words missing from index.html"
fi

# 4. the page claims it cannot talk to a network, so hold it to that
net_hits=""
for pattern in 'fetch(' 'XMLHttpRequest' 'WebSocket' 'sendBeacon' 'EventSource' \
               'serviceWorker' 'new Worker(' 'importScripts' '<form' 'navigator.connection'; do
  if grep -qF "$pattern" "$ROOT/index.html"; then
    net_hits="$net_hits $pattern"
  fi
done
[[ -z "$net_hits" ]] || fail "index.html contains network-capable code:$net_hits"
pass "no network-capable code in index.html"

# 5. the voice guide, for the half of it a machine can read
# Readers told us the prose sounded machine-written and named the tell, so the
# tell is a build failure now rather than a matter of taste.
if python3 "$ROOT/scripts/style.py" --strict > /tmp/style.$$ 2>&1; then
  pass "prose follows the voice guide"
else
  cat /tmp/style.$$
  rm -f /tmp/style.$$
  fail "prose breaks the voice guide"
fi
rm -f /tmp/style.$$

echo "verified."

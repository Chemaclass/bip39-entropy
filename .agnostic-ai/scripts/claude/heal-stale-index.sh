#!/usr/bin/env bash
# Stop: catch an index.html that no longer reproduces from src/ + data/.
#
# The PostToolUse hook covers edits made through Write/Edit; this covers
# everything else (a shell heredoc, a manual edit, an interrupted build) so a
# stale index.html can never reach a commit. index.html is a pure function of
# its inputs, so regenerating it is safe and matches what CI recomputes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

python3 "$ROOT/scripts/build.py" --out "$tmp/index.html" >/dev/null 2>&1 || exit 0
cmp -s "$ROOT/index.html" "$tmp/index.html" && exit 0

cp "$tmp/index.html" "$ROOT/index.html"
jq -nc '{systemMessage: "index.html was stale and has been rebuilt from src/template.html"}'

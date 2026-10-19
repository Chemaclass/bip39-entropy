#!/usr/bin/env bash
# PostToolUse(Write|Edit): regenerate index.html when a build input changes.
#
# index.html is committed and CI fails if it drifts from a fresh build, so the
# rebuild has to happen at the moment the source is edited — not at commit time.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

file="$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')"
[[ -n "$file" ]] || exit 0

case "$file" in
  "$ROOT"/src/*|"$ROOT"/data/*) ;;
  *) exit 0 ;;
esac

if out="$(python3 "$ROOT/scripts/build.py" 2>&1)"; then
  jq -nc --arg m "rebuilt index.html — ${out%%$'\n'*}" \
    '{systemMessage: $m, suppressOutput: true}'
else
  jq -nc --arg m "$out" '{
    systemMessage: "scripts/build.py failed — index.html is now stale",
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("scripts/build.py failed after this edit:\n" + $m)
    }
  }'
fi

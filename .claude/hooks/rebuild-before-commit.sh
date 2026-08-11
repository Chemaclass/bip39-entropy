#!/usr/bin/env bash
# PreToolUse(Bash, git commit): never commit a source change with a stale
# index.html beside it.
#
# The PostToolUse hook rebuilds on edit, but anything that changes a source
# between that rebuild and `git add` — a background agent, a second session, a
# manual edit — commits a mismatched pair, and CI fails on a diff that is
# already fixed by the next build. Rebuilding here closes that window.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

staged="$(git diff --cached --name-only)"
grep -qE '^(src/|data/)' <<<"$staged" || exit 0

before="$(git hash-object index.html)"
python3 scripts/build.py >/dev/null 2>&1 || {
  jq -nc '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "scripts/build.py fails, so index.html cannot be regenerated. Fix the build before committing."
    }
  }'
  exit 0
}
after="$(git hash-object index.html)"

[[ "$before" == "$after" ]] && exit 0

git add index.html
jq -nc '{systemMessage: "index.html was stale against the staged sources; rebuilt and staged it with the commit"}'

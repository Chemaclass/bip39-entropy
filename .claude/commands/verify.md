---
description: Run the full poster audit (word-list hash, reproducible build, 2048 words, no remote assets)
allowed-tools: Bash(./scripts/verify.sh:*), Bash(python3 scripts/build.py:*), Bash(grep:*), Read, Edit
---

Run `./scripts/verify.sh`, then run the same remote-asset check CI does:

```bash
grep -Eqi '<(script|link|img)[^>]+(src|href)="https?://' index.html \
  && echo "FAIL: remote asset" || echo "ok    no remote assets"
```

Report each check as pass or fail. If the reproducible-build check fails, run
`python3 scripts/build.py` and say what changed in `index.html` — do not edit
`index.html` by hand.

#!/usr/bin/env python3
"""Every word of the list must appear in the built page. Used by verify.sh."""
import pathlib
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
page = (root / "index.html").read_text()
missing = [w for w in (root / "data" / "english.txt").read_text().split()
           if f'"{w}"' not in page]
for w in missing[:5]:
    print(f"    missing: {w}")
if len(missing) > 5:
    print(f"    … {len(missing) - 5} more")
sys.exit(1 if missing else 0)

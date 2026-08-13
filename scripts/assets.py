#!/usr/bin/env python3
"""No remote assets, and no bytes that make the page look binary.

Both checks used to be a grep. Grep stopped checking anything the day a NUL byte
landed in the prose, because it decided the file was binary and matched nothing
in silence. Python reads the bytes and says so.
"""
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
raw = (root / "index.html").read_bytes()
page = raw.decode("utf-8")
bad = []

control = [i for i, b in enumerate(raw) if b < 9 or 13 < b < 32]
if control:
    i = control[0]
    bad.append(f"{len(control)} control byte(s), first at offset {i}: "
               f"{raw[max(0, i - 40):i + 20].decode('utf-8', 'replace')!r}")

# A tag that fetches something. rel=canonical and rel=alternate are metadata:
# they name a URL, they never request it.
for m in re.finditer(r'<(script|link|img|iframe|source|video|audio|embed)\b[^>]*>',
                     page, re.I):
    tag = m.group(0)
    if not re.search(r'(src|href)\s*=\s*"https?://', tag, re.I):
        continue
    if re.search(r'rel\s*=\s*"(canonical|alternate)"', tag, re.I):
        continue
    bad.append("remote asset: " + tag[:110])

for line in bad:
    print("    " + line)
sys.exit(1 if bad else 0)

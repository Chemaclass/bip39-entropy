#!/usr/bin/env python3
"""Render index.html from src/template.html and data/english.txt.

The word list is embedded at build time so the poster is a single
self-contained file that works offline, with no network and no
dependencies. Run scripts/verify.sh to confirm the committed
index.html is exactly what this script produces.
"""
import argparse
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORDLIST = ROOT / "data" / "english.txt"
TEMPLATE = ROOT / "src" / "template.html"
DEFAULT_OUTPUT = ROOT / "index.html"

# SHA-256 of bip-0039/english.txt from github.com/bitcoin/bips
CANONICAL_SHA = "2f5eed53a4727b4bf8880d8f3f199efc90e58503646d9ff8eff3a2ed3b24dbda"

# The word shown in the poster's decoder legend by default.
LEGEND_INDEX = 837


def load_words() -> tuple[list[str], str]:
    raw = WORDLIST.read_text()
    digest = hashlib.sha256(raw.encode()).hexdigest()
    words = raw.split()

    if digest != CANONICAL_SHA:
        sys.exit(f"word list sha256 mismatch\n  expected {CANONICAL_SHA}\n  actual   {digest}")
    if len(words) != 2048:
        sys.exit(f"expected 2048 words, found {len(words)}")
    if words != sorted(words):
        sys.exit("word list is not in lexicographic order")
    if len({w[:4] for w in words}) != 2048:
        sys.exit("four-letter prefixes are not unique")

    return words, digest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o", "--out", type=pathlib.Path, default=DEFAULT_OUTPUT,
        help="where to write the rendered page (default: index.html)",
    )
    out = parser.parse_args().out

    words, digest = load_words()
    html = TEMPLATE.read_text()

    for placeholder in ("__WORDS__", "__SHA__", "__SHA_SHORT__"):
        if placeholder not in html:
            sys.exit(f"template is missing placeholder {placeholder}")

    html = html.replace("__WORDS__", json.dumps(words, separators=(",", ":")))
    html = html.replace("__SHA__", digest)
    html = html.replace("__SHA_SHORT__", f"{digest[:8]}\u2026{digest[-8:]}")

    out.write_text(html)
    print(f"built {out}  {len(words)} words  {out.stat().st_size:,} bytes")
    print(f"legend word: {words[LEGEND_INDEX]} (index {LEGEND_INDEX})")


if __name__ == "__main__":
    main()

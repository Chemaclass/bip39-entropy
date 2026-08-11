#!/usr/bin/env python3
"""Render index.html from src/ and data/english.txt.

src/css/*.css and src/js/*.js are concatenated in filename order and
inlined into src/template.html, along with the word list and its hash.
The output is a single self-contained file that works offline, with no
network and no dependencies. Run scripts/verify.sh to confirm the
committed index.html is exactly what this script produces.
"""
import argparse
import hashlib
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORDLIST = ROOT / "data" / "english.txt"
TEMPLATE = ROOT / "src" / "template.html"
CSS_DIR = ROOT / "src" / "css"
JS_DIR = ROOT / "src" / "js"
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


def concat(directory: pathlib.Path, suffix: str) -> tuple[str, list[str]]:
    """Join every file in the directory, in filename order.

    Filenames are numbered because concatenation order is load order:
    10-data.js has to define WORDS before 90-boot.js first renders.
    """
    parts = sorted(directory.glob(f"*{suffix}"))
    if not parts:
        sys.exit(f"no {suffix} files in {directory.relative_to(ROOT)}")

    chunks = []
    for p in parts:
        chunks.append(f"/* {p.relative_to(ROOT)} */\n{p.read_text().strip()}")
    return "\n\n".join(chunks), [p.name for p in parts]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o", "--out", type=pathlib.Path, default=DEFAULT_OUTPUT,
        help="where to write the rendered page (default: index.html)",
    )
    out = parser.parse_args().out

    words, digest = load_words()
    html = TEMPLATE.read_text()

    for placeholder in ("__CSS__", "__JS__"):
        if placeholder not in html:
            sys.exit(f"src/template.html is missing placeholder {placeholder}")

    css, css_parts = concat(CSS_DIR, ".css")
    js, js_parts = concat(JS_DIR, ".js")

    # CSS and JS first: __WORDS__ and the hashes live inside the JS sources.
    html = html.replace("__CSS__", css).replace("__JS__", js)

    for placeholder in ("__WORDS__", "__SHA__", "__SHA_SHORT__"):
        if placeholder not in html:
            sys.exit(f"no source file uses placeholder {placeholder}")

    html = html.replace("__WORDS__", json.dumps(words, separators=(",", ":")))
    html = html.replace("__SHA__", digest)
    html = html.replace("__SHA_SHORT__", f"{digest[:8]}\u2026{digest[-8:]}")

    out.write_text(html)
    print(f"built {out}  {len(words)} words  {out.stat().st_size:,} bytes")
    print(f"  css: {' '.join(css_parts)}")
    print(f"  js:  {' '.join(js_parts)}")
    print(f"legend word: {words[LEGEND_INDEX]} (index {LEGEND_INDEX})")


if __name__ == "__main__":
    main()

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
CONTENT_DIR = ROOT / "src" / "content"
I18N_DIR = ROOT / "src" / "i18n"
BASE_LANG = "en"
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


def concat(directory: pathlib.Path, suffix: str, comment: str = "/* {} */") -> tuple[str, list[str]]:
    """Join every file in the directory, in filename order.

    Filenames are numbered because concatenation order is load order:
    10-data.js has to define WORDS before 90-boot.js first renders.
    """
    parts = sorted(directory.glob(f"*{suffix}"))
    if not parts:
        sys.exit(f"no {suffix} files in {directory.relative_to(ROOT)}")

    chunks = []
    for p in parts:
        chunks.append(comment.format(p.relative_to(ROOT)) + "\n" + p.read_text().strip())
    return "\n\n".join(chunks), [p.name for p in parts]


def check_house_style(paths: list[pathlib.Path]) -> None:
    """No em dash in anything a reader sees. House rule: write two sentences.

    Enforced at build time because the rule only holds if it holds in every
    language, and a translator reaching for one is the easiest thing to miss.
    """
    offenders = []
    for path in paths:
        for n, line in enumerate(path.read_text().splitlines(), 1):
            if "—" in line:
                offenders.append(f"  {path.relative_to(ROOT)}:{n}: {line.strip()[:70]}")
    if offenders:
        sys.exit("em dash found in reader-facing text; rewrite as separate statements:\n"
                 + "\n".join(offenders[:12]))


def load_i18n() -> tuple[dict, list[dict]]:
    """Read src/i18n/*.json. Adding a language is adding a file, never code.

    Missing keys are reported but not fatal: a translation lands over several
    commits, and the runtime falls back to the base language key by key.
    """
    bundles = {}
    for path in sorted(I18N_DIR.glob("*.json")):
        code = path.stem
        try:
            bundles[code] = json.loads(path.read_text())
        except json.JSONDecodeError as e:
            sys.exit(f"{path.relative_to(ROOT)} is not valid JSON: {e}")
        if bundles[code].get("_code", code) != code:
            sys.exit(f"{path.relative_to(ROOT)} declares _code "
                     f"{bundles[code].get('_code')!r} but is named {code}.json")

    if BASE_LANG not in bundles:
        sys.exit(f"src/i18n/{BASE_LANG}.json is required as the fallback language")

    base = {k for k in bundles[BASE_LANG] if not k.startswith("_")}
    for code, bundle in bundles.items():
        if code == BASE_LANG:
            continue
        keys = {k for k in bundle if not k.startswith("_")}
        missing, extra = sorted(base - keys), sorted(keys - base)
        if missing:
            print(f"  note: {code}.json is missing {len(missing)} key(s): "
                  f"{', '.join(missing[:6])}{' …' if len(missing) > 6 else ''}")
        if extra:
            print(f"  note: {code}.json has {len(extra)} key(s) not in {BASE_LANG}.json: "
                  f"{', '.join(extra[:6])}{' …' if len(extra) > 6 else ''}")

    langs = [{"code": c, "name": b.get("_name", c)} for c, b in bundles.items()]
    langs.sort(key=lambda l: (l["code"] != BASE_LANG, l["name"]))
    return bundles, langs


def load_content(langs: list[dict]) -> tuple[str, list[str]]:
    """Turn src/content/<name>.<lang>.html into one view per name.

    Each view holds a pane per language and the runtime shows one of them, so a
    new section of the site is a set of files plus a tab in the template.
    """
    known = {l["code"] for l in langs}
    groups: dict[str, list[tuple[str, pathlib.Path]]] = {}
    for path in sorted(CONTENT_DIR.glob("*.html")):
        parts = path.stem.rsplit(".", 1)
        if len(parts) != 2 or parts[1] not in known:
            sys.exit(f"{path.relative_to(ROOT)} must be named <name>.<lang>.html "
                     f"with lang one of {sorted(known)}")
        groups.setdefault(parts[0], []).append((parts[1], path))

    if not groups:
        sys.exit("no content files in src/content")

    views, names = [], []
    for name, items in sorted(groups.items()):
        panes = []
        for lang, path in sorted(items):
            panes.append(f'<!-- {path.relative_to(ROOT)} -->\n'
                         f'<div class="pane" data-pane="{name}" data-lang="{lang}" hidden>\n'
                         f'{path.read_text().strip()}\n</div>')
            names.append(path.name)
        views.append(f'<div class="view" id="view-{name}" hidden>\n'
                     + "\n\n".join(panes) + "\n</div>")
    return "\n\n".join(views), names


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "-o", "--out", type=pathlib.Path, default=DEFAULT_OUTPUT,
        help="where to write the rendered page (default: index.html)",
    )
    out = parser.parse_args().out

    words, digest = load_words()
    html = TEMPLATE.read_text()

    for placeholder in ("__CSS__", "__JS__", "__CONTENT__"):
        if placeholder not in html:
            sys.exit(f"src/template.html is missing placeholder {placeholder}")

    css, css_parts = concat(CSS_DIR, ".css")
    js, js_parts = concat(JS_DIR, ".js")
    check_house_style(sorted(I18N_DIR.glob("*.json")) +
                      sorted(CONTENT_DIR.glob("*.html")) + [TEMPLATE])
    bundles, langs = load_i18n()
    content, content_parts = load_content(langs)

    # CSS, JS and prose first: __WORDS__ and the hashes live inside the JS sources.
    html = html.replace("__CSS__", css).replace("__JS__", js)
    html = html.replace("__CONTENT__", content)
    html = html.replace("__I18N__", json.dumps(bundles, ensure_ascii=False,
                                               separators=(",", ":"), sort_keys=True))
    html = html.replace("__LANGS__", json.dumps(langs, ensure_ascii=False,
                                                separators=(",", ":")))

    for placeholder in ("__WORDS__", "__SHA__", "__SHA_SHORT__"):
        if placeholder not in html:
            sys.exit(f"no source file uses placeholder {placeholder}")

    html = html.replace("__WORDS__", json.dumps(words, separators=(",", ":")))
    html = html.replace("__SHA__", digest)
    html = html.replace("__SHA_SHORT__", f"{digest[:8]}\u2026{digest[-8:]}")

    out.write_text(html)
    print(f"built {out}  {len(words)} words  {out.stat().st_size:,} bytes")
    print(f"  css:     {' '.join(css_parts)}")
    print(f"  js:      {' '.join(js_parts)}")
    print(f"  content: {' '.join(content_parts)}")
    print(f"  i18n:    {' '.join(l['code'] for l in langs)}")
    print(f"legend word: {words[LEGEND_INDEX]} (index {LEGEND_INDEX})")


if __name__ == "__main__":
    main()

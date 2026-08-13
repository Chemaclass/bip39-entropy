#!/usr/bin/env python3
"""Check reader-facing text against the owner's voice guide.

The rules that can be machined are here. The ones that cannot, fragments for
punch, two-way contrast, an ending that stamps, are left to a person. See
.claude/rules/writing-style.md, which points at the canonical guide.

    python3 scripts/style.py            # report
    python3 scripts/style.py --strict   # exit 1 if anything is found
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Never, per the guide. Word-boundary matched, case-insensitive.
FILLER = ["just", "really", "basically", "actually", "simply", "very", "quite"]
HEDGES = ["i think", "perhaps", "it seems", "arguably", "in my opinion",
          "we believe", "sort of", "kind of"]
FANCY = {"utilize": "use", "utilise": "use", "facilitate": "help",
         "regarding": "about", "sufficient": "enough", "commence": "start",
         "demonstrate": "show", "leverage": "use", "additionally": "also",
         "furthermore": "and", "prior to": "before", "in order to": "to",
         "a number of": "several", "at this point in time": "now"}
JARGON = ["load-bearing", "table stakes", "north star", "boil the ocean",
          "move the needle", "low-hanging fruit", "paradigm", "synergy"]
HYPE = ["revolutionary", "game-changing", "cutting-edge", "seamless",
        "unlock the power", "world-class", "best-in-class"]

LONG_SENTENCE = 34          # words; the guide asks for one idea per sentence
SPANISH_ONLY = {"usted", "computadora", "celular", "ordenadores portátiles"}

# Rhythm, per the guide's "never more than 2-3 in a row before a longer sentence
# resets" and "expand, then contract". Uniform short sentences are what readers
# name as machine-written, and the page cannot afford that impression.
SHORT_SENTENCE = 8          # words or fewer counts as short
MAX_RUN = 2                 # short sentences in a row before a longer one resets
MAX_SHORT_SHARE = 0.34      # of all sentences in a file
MAX_ANTITHESIS = 4          # "it isn't X, it's Y" reversals per file

# The reversal, in the two shapes the site actually used: negated copula then a
# positive restatement, either across a full stop or after a comma.
ANTITHESIS = re.compile(
    r"\b(?:is|are|was|were|isn't|aren't|wasn't|weren't)\s+not\b[^.;:]{0,70},\s*(?:it|that|they|this)?\s*\b(?:is|are|was|were)\b"
    r"|\b(?:isn't|aren't|wasn't|weren't|doesn't|don't|didn't)\b[^.]{0,90}[.]\s+(?:It|That|They|This)\s+(?:is|are|was|were)\b"
    r"|\bno\s+es\b[^.;:]{0,70}[.,]\s*(?:Es|es)\b",
    re.I)


def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


BLOCK = re.compile(r"<(p|li|td|th|h1|h2|h3|caption|figcaption)\b[^>]*>(.*?)</\1>",
                   re.S | re.I)


PROSE = {"p", "li"}          # rhythm lives here; a table cell is a label


def blocks(html: str) -> list[tuple[str, str]]:
    """Tagged text per block element.

    Reading the whole file as one string turns a table into a 60-word
    "sentence" and a contents list into another. Sentence length only means
    something inside the block that holds it, and it means nothing at all
    inside a one-word table cell.
    """
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    out = []
    for tag, inner in BLOCK.findall(html):
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", inner)).strip()
        if text:
            out.append((tag.lower(), text))
    return out


def scan(label: str, text: str, lang: str) -> list[str]:
    hits = []
    low = text.lower()

    for w in FILLER:
        for m in re.finditer(rf"\b{re.escape(w)}\b", low):
            hits.append(f"filler '{w}': …{text[max(0, m.start()-40):m.start()+40]}…")
    for h in HEDGES:
        if h in low:
            hits.append(f"hedge '{h}'")
    for w, better in FANCY.items():
        if re.search(rf"\b{re.escape(w)}\b", low):
            hits.append(f"fancy '{w}' (use '{better}')")
    for w in JARGON + HYPE:
        if w in low:
            hits.append(f"off-voice '{w}'")
    if "!" in re.sub(r"&\w+;", "", text):
        hits.append("exclamation mark")
    if "—" in text or "–" in text:
        hits.append("dash")
    if lang == "es":
        for w in SPANISH_ONLY:
            if re.search(rf"\b{re.escape(w)}\b", low):
                hits.append(f"non-Peninsular '{w}'")

    for s in sentences(text):
        n = len(s.split())
        if n > LONG_SENTENCE:
            hits.append(f"long sentence ({n} words): {s[:90]}…")
    return hits


def rhythm(chunks: list[str]) -> list[str]:
    """Rhythm reads across a whole page, not inside one sentence.

    A run is counted inside its own paragraph, because that is where a reader
    hears it. The share is counted over the file, because that is what makes a
    page sound the same all the way down.
    """
    hits = []
    lengths = []
    for chunk in chunks:
        run = []
        for s in sentences(chunk):
            n = len(s.split())
            lengths.append(n)
            if n <= SHORT_SENTENCE:
                run.append(s)
                continue
            if len(run) > MAX_RUN:
                hits.append(f"{len(run)} short sentences in a row: {' '.join(run)[:110]}…")
            run = []
        if len(run) > MAX_RUN:
            hits.append(f"{len(run)} short sentences in a row: {' '.join(run)[:110]}…")

    if lengths:
        share = sum(n <= SHORT_SENTENCE for n in lengths) / len(lengths)
        if share > MAX_SHORT_SHARE:
            hits.append(f"{share:.0%} of {len(lengths)} sentences are {SHORT_SENTENCE} "
                        f"words or fewer (max {MAX_SHORT_SHARE:.0%})")

    found = ANTITHESIS.findall(" ".join(chunks))
    if len(found) > MAX_ANTITHESIS:
        hits.append(f"{len(found)} 'it isn't X, it's Y' reversals (max {MAX_ANTITHESIS})")
    return hits


def main() -> None:
    findings: dict[str, list[str]] = {}

    for path in sorted((ROOT / "src" / "content").glob("*.html")):
        lang = path.stem.rsplit(".", 1)[1]
        hits = []
        chunks = blocks(path.read_text())
        for _, block in chunks:
            hits += scan(path.name, block, lang)
        hits += rhythm([text for tag, text in chunks if tag in PROSE])
        if hits:
            findings[str(path.relative_to(ROOT))] = hits

    for path in sorted((ROOT / "src" / "i18n").glob("*.json")):
        lang = path.stem
        bundle = json.loads(path.read_text())
        hits = []
        for key, value in bundle.items():
            if key.startswith("_") or not isinstance(value, str):
                continue
            hits += [f"{key}: {h}" for h in scan(key, value, lang)]
        if hits:
            findings[str(path.relative_to(ROOT))] = hits

    total = sum(len(v) for v in findings.values())
    for path, hits in findings.items():
        print(f"\n{path}  ({len(hits)})")
        for h in hits[:14]:
            print(f"  {h}")
        if len(hits) > 14:
            print(f"  … {len(hits) - 14} more")

    print(f"\n{total} finding(s) across {len(findings)} file(s)."
          if total else "\nclean: nothing the guide forbids.")
    if total and "--strict" in sys.argv:
        sys.exit(1)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Break each invariant on purpose and prove the guard notices.

The page tells readers they can check it themselves, so the checks are part of
the product. On 13 August 2026 one of them stopped working in silence: a NUL byte
landed in the prose, grep decided index.html was binary, matched nothing, and
reported the offline guarantee as intact. A green tick from a check that has quit
is worse than no check, because it ends the investigation.

So every guard gets a defect built for it, in a throwaway copy of the tree, and
has to fail. A guard that passes a broken page fails here instead.

    python3 scripts/selfcheck.py            # report
    python3 scripts/selfcheck.py -v         # show each guard's own output
"""
import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERBOSE = "-v" in sys.argv
SKIP = {".git", "__pycache__", ".DS_Store"}

PASS, FAIL = 0, 1


def scratch(tmp: pathlib.Path) -> pathlib.Path:
    """A copy of the tree, minus history. Small enough that copying is cheaper
    than being clever about which files a given guard reads."""
    dst = tmp / "repo"
    shutil.copytree(ROOT, dst, ignore=shutil.ignore_patterns(*SKIP))
    return dst


def run(cmd, cwd) -> tuple[int, str]:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr


# ── the defects ────────────────────────────────────────────────────
# Each takes the scratch repo and plants one fault. The name says what a reader
# would lose if the guard ever stopped catching it.

def flip_a_word(repo):
    f = repo / "data" / "english.txt"
    f.write_text(f.read_text().replace("abandon", "abandoned", 1))


def drop_a_word(repo):
    f = repo / "data" / "english.txt"
    f.write_text("\n".join(f.read_text().split()[:-1]) + "\n")


def edit_the_built_page(repo):
    f = repo / "index.html"
    f.write_text(f.read_text().replace("</body>", "<!-- hand edit --></body>", 1))


def lose_a_word_from_the_page(repo):
    f = repo / "index.html"
    f.write_text(f.read_text().replace('"hamster"', '"hamstre"', 1))


def plant_a_control_byte(repo):
    """The 13 August defect, exactly."""
    f = repo / "index.html"
    raw = f.read_bytes()
    i = raw.index(b"<body>")
    f.write_bytes(raw[:i] + b"\x00" + raw[i:])


def plant_a_remote_asset(repo):
    f = repo / "index.html"
    f.write_text(f.read_text().replace(
        "<body>", '<body><script src="https://example.com/x.js"></script>', 1))


def plant_a_canonical_link(repo):
    """Not a defect. rel=canonical names a URL and never fetches it, so a guard
    that fails here is too strict to live with."""
    f = repo / "index.html"
    f.write_text(f.read_text().replace(
        "</head>", '<link rel="canonical" href="https://example.com/"></head>', 1))


def plant_an_em_dash(repo):
    f = repo / "src" / "content" / "start.en.html"
    f.write_text(f.read_text().replace("<p>", "<p>A dash — here.", 1))


def plant_a_wall_of_text(repo):
    f = repo / "src" / "content" / "start.en.html"
    wall = " ".join(["Entropy counts how many numbers yours could have been."] * 12)
    f.write_text(f.read_text().replace("<p>", f"<p>{wall}", 1))


def plant_a_staccato_run(repo):
    f = repo / "src" / "content" / "start.en.html"
    run_of = "Short. Very short. Shorter still. Yet another. And one more."
    f.write_text(f.read_text().replace("<p>", f"<p>{run_of}", 1))


def plant_a_filler_word(repo):
    f = repo / "src" / "content" / "start.en.html"
    f.write_text(f.read_text().replace("<p>", "<p>This is basically fine.", 1))


# ── the cases ──────────────────────────────────────────────────────
# (what a reader loses, the defect, the command, the exit code it must give)
VERIFY = ["./scripts/verify.sh"]
ASSETS = [sys.executable, "scripts/assets.py", "."]
EMBED = [sys.executable, "scripts/embedded.py", "."]
STYLE = [sys.executable, "scripts/style.py", "--strict"]

CASES = [
    ("a word list that is not BIP-39", flip_a_word, VERIFY, FAIL),
    ("a word list missing a word", drop_a_word, VERIFY, FAIL),
    ("a page nobody can reproduce", edit_the_built_page, VERIFY, FAIL),
    ("a word that never reached the page", lose_a_word_from_the_page, EMBED, FAIL),
    ("a control byte hiding the page from grep", plant_a_control_byte, ASSETS, FAIL),
    ("a page that fetches from the network", plant_a_remote_asset, ASSETS, FAIL),
    ("a canonical link, which is not a fetch", plant_a_canonical_link, ASSETS, PASS),
    ("an em dash in the prose", plant_an_em_dash, STYLE, FAIL),
    ("a paragraph past the block cap", plant_a_wall_of_text, STYLE, FAIL),
    ("five short sentences in a row", plant_a_staccato_run, STYLE, FAIL),
    ("a filler word the guide forbids", plant_a_filler_word, STYLE, FAIL),
]


def main() -> None:
    print(f"self-checking the guards in {ROOT}")
    bad = 0
    for label, defect, cmd, want in CASES:
        with tempfile.TemporaryDirectory() as tmp:
            repo = scratch(pathlib.Path(tmp))
            defect(repo)
            code, out = run(cmd, repo)
            caught = (code != 0)
            ok = caught == (want == FAIL)
            verb = "catches" if want == FAIL else "allows"
            print(f"  {'ok  ' if ok else 'FAIL'}  {verb} {label}")
            if not ok:
                bad += 1
                print(f"        expected exit {'non-zero' if want == FAIL else '0'}, "
                      f"got {code}")
                print("        " + (out.strip().replace("\n", "\n        ") or "(no output)"))
            elif VERBOSE and out.strip():
                print("        " + out.strip().replace("\n", "\n        "))

    if bad:
        print(f"\n{bad} guard(s) did not do their job.")
        sys.exit(1)
    print(f"\nall {len(CASES)} guards proved themselves.")


if __name__ == "__main__":
    main()

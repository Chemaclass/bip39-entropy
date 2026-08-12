# bip39-entropy

An educational site about the number behind a BIP-39 seed phrase, with two tools
attached. Guide sections: Start here, Entropy (including when entropy failed),
Protect (passphrase and multisig), Questions. Tools: the printable poster of the
2048-word list as an eleven-bit address space, and the dice/coin roller. All in
one `index.html`: self-contained, no build step to view it, no dependencies,
**no network code of any kind**. The page tells readers
that nothing they type or throw leaves it, so that has to stay literally true:
no fetch, no XHR, no beacons, no remote fonts, no analytics, ever.

## The one rule

`index.html` is **generated**. Edit the sources under `src/` and run the build:

```bash
python3 scripts/build.py
```

Never hand-edit `index.html`. CI fails the moment it stops being byte-identical to
a fresh build. Permission rules in `.claude/settings.json` deny writes to it, and a
hook rebuilds it whenever anything under `src/` or `data/` changes.

`build.py` concatenates `src/css/*.css`, `src/js/*.js` and `src/content/*.html` in
filename order into one `<style>`, one `<script>` and the body. Numbering is load
order: `10-data.js` defines `WORDS` before `90-boot.js` first renders, so a new
module's prefix decides when it runs. Everything shares one top-level scope.

## Layout

```
index 837  =  column 768  +  row 69  =  hamster
              high 4 bits    low 7 bits
```

Eleven bits split either 4+7 (16 × 128 grid) or 5+6 (32 × 64). Both are correct;
the page computes both and picks whichever yields larger type for the chosen paper.
Do not hardcode one split.

The first four letters of every word are `<b>`-wrapped because all 2048 four-letter
prefixes are unique. `scripts/build.py` asserts that invariant at build time.

## Invariants the build and CI enforce

- `data/english.txt` matches `bip-0039/english.txt` from bitcoin/bips by SHA-256
  (`2f5eed53…3b24dbda`), is 2048 words, lexicographically sorted, unique 4-prefixes
- the committed `index.html` reproduces exactly from `scripts/build.py`
- **no remote assets**. A `<script>`, `<link>` or `<img>` pointing at `http(s)://`
  fails CI. Everything inlines: CSS, JS, fonts fall back to system stacks
- print correctness depends on `print-color-adjust: exact` and `@page { margin: 0 }`;
  changing either prints the decoder legend blank
- the BIP-39 encoder must keep passing `SEED.selfTest()`, official vectors plus a
  deterministic property test. Never weaken it to make a change pass
- never write a generated phrase into a downloaded file; the worksheet PDF records
  throws, never results
- no em dash in reader-facing text. `build.py` fails on one in `src/i18n/`,
  `src/content/` or the template. Write two sentences
- no language is named in JavaScript. Adding one is adding `src/i18n/<lang>.json`
  and `src/content/<name>.<lang>.html`, nothing else
- the language lives in the URL as `#<lang>/<view>` and is never stored, because
  the page tells readers it keeps nothing

## Commands

```bash
git config core.hooksPath .githooks   # once per clone: rebuilds index.html on commit
python3 scripts/build.py              # regenerate index.html
python3 scripts/build.py -o /tmp/x.html
./scripts/verify.sh                   # full audit (~4s): hash, reproducibility, 2048 words
open index.html                       # preview
```

Run `./scripts/verify.sh` before committing anything that touches `src/`, `data/`
or `scripts/`.

## Files

```
index.html            the site, self-contained and committed (generated)
src/template.html     HTML shell: __CSS__ / __JS__ / __CONTENT__ placeholders
src/css/*.css         10 poster · 20 site chrome · 30 roller · 40 explainer · 90 print
src/js/*.js           10 data · 20 layout · 30 sheet · 40 render · 50 find
                      60 sha256+bip39 · 70 pdf · 75 poster pdf · 76 worksheet
                      80 roller · 85 views · 90 boot
src/i18n/<lang>.json  interface strings, one file per language
src/content/*.<lang>.html  long-form prose (__WORDS__ / __SHA__ live in the JS)
data/english.txt      canonical BIP-39 English word list
scripts/build.py      render index.html
scripts/verify.sh     audit the word list and the build
```

## Style

- No build tooling, no bundler, no minifier, no package manager. Keep it that way.
- Vanilla JS in the template, no framework, no polyfills.
- Two-space indent everywhere except Python (four). See `.editorconfig`.
- Conventional commits. `ref:` rather than `refactor:`.

# bip39-poster

Four things about BIP-39 seed phrases, in one HTML file that works with the
network cable pulled:

- **a start-here guide** for a first phrase: what is at stake, where randomness
  can come from, a procedure to follow, and what "offline" actually means
- **a printable poster** of the complete English word list, laid out as what it
  actually is, an **eleven-bit address space**
- **a field guide to entropy**, with the arithmetic shown rather than asserted
- **a dice and coin roller** that builds a phrase one throw at a time, and prints
  a worksheet so you can do it at a table with no computer

English and Spanish, chosen in the URL. **Save offline** in the header downloads
the page itself.

**→ [chemaclass.github.io/bip39-poster](https://chemaclass.github.io/bip39-poster/)**

One file, no build step to view it, no dependencies, no network, no analytics.
Nothing you type or throw ever leaves the page. There is no code in it that
could send anything anywhere.

---

## The poster

BIP-39 indices run 0–2047, which is exactly eleven bits. Rather than printing an
alphabetical column list, the poster arranges the words on a grid where **the high
bits choose the column and the low bits choose the row**, so a word's index is
literally its coordinate on the paper.

```
index 837  =  column 768  +  row 69  =  hamster
              ^^^^^^^^^^     ^^^^^^
              high 4 bits    low 7 bits
```

The grid shape is a genuine choice, not a cosmetic one. Splitting eleven bits as
4 + 7 gives a 16 × 128 grid; as 5 + 6 it gives 32 × 64. Both are correct, and which
one yields larger type depends entirely on the paper's aspect ratio. The page
computes both and picks the better fit.

The second idea is typographic: **the first four letters of every word are set in
black, the rest in grey.** All 2048 four-letter prefixes are unique, which is why
hardware wallets only ever ask you for four characters. The poster shows you that
fact instead of asserting it in a footnote.

### Printing

Either press **PDF**, which produces the sheet directly and is the reliable path,
or press **Print** and set the printer to **100 % scale** with **background
graphics enabled**. Without those two settings the decoder legend prints blank.

The control bar reports the exact resulting type size, and warns you below 4.6 pt.

| Paper | Portrait | Landscape |
|---|---|---|
| A1 | 12.7 pt · 16 × 128 | **13.2 pt · 32 × 64** |
| A2 | 9.0 pt · 16 × 128 | **9.2 pt · 32 × 64** |
| A3 | 6.3 pt · 16 × 128 | **6.5 pt · 32 × 64** |
| A4 | **4.8 pt · 16 × 128** | 4.7 pt · 32 × 64 |
| Letter | **4.5 pt · 16 × 128** | 4.4 pt · 32 × 64 |
| Tabloid | **6.6 pt · 16 × 128** | 6.6 pt · 32 × 64 |

Type size is bounded by whichever runs out first, the row height or the column
width. A column has to hold the widest word in the list without clipping it, so
the solver sizes the type from `(usable width − padding) / (columns × 4.8 em +
gutters)` as well as from the row box, and takes the smaller. The 4.8 em is the
widest word, eight glyphs, in the widest face on offer, the monospace one.

A4 gets all 2048 words onto one sheet, but at roughly map-legend size. It is a
desk reference rather than a wall piece. A3 or larger is where it becomes readable
across a room. If you would rather have big type on small paper, the **Grid**
selector splits the list across 2, 4, or 8 sheets.

The PDF is written by hand against the base-14 fonts, so it embeds nothing and
fetches nothing: a one-sheet A2 poster is about 320 KB.

## Rolling your own

A seed phrase is a number. **Roll your own** lets you produce that number yourself
and watch it become words: a die gives two bits per accepted throw (`1 2 3 4` are
`00 01 10 11`; `5` and `6` are rerolled, which is what keeps the four outcomes
equally likely), a coin gives one bit per flip. 64 throws or 128 flips is 128 bits,
which is a 12-word phrase.

Generating a phrase in a browser tab is for **learning and verification**. For
money you intend to keep, use a hardware wallet, or run this offline on a machine
that stays offline.

The worksheet button prints a blank sheet for doing it away from any computer. It
records throws, never results. Nothing generated on the page is ever written into
a file. With a 12-word phrase the checksum occupies only 4 bits, so the first
eleven words follow from your entropy alone and can be read straight off the
poster; only the last word mixes in SHA-256 and needs a machine.

## Verifying it

The word list is data, not something typed out by hand, and the build is
reproducible. Before trusting a copy you did not build yourself:

```bash
./scripts/verify.sh
```

That checks three things:

1. `data/english.txt` matches `bip-0039/english.txt` from
   [bitcoin/bips](https://github.com/bitcoin/bips), by SHA-256
   (`2f5eed53…3b24dbda`, also printed in the poster's colophon)
2. the committed `index.html` is byte-identical to a fresh `scripts/build.py` run
3. all 2048 words actually made it into the page

CI runs the same script on every push, and additionally fails the build if
`index.html` ever gains a remote asset. The page must keep working with the
network cable pulled.

Every deploy also publishes `index.html.sha256` and `english.txt.sha256` beside
the page, so a copy downloaded for offline use can be checked before it is
opened. That check is only as trustworthy as the server that served both, which
is why the reproducible build above is the one that matters.

The BIP-39 encoder carries its own test vectors: `SEED.selfTest()` in the browser
console re-derives the official mnemonics (all-zero entropy must give
`abandon` × 11 + `about`) and re-checks the checksum of 200 deterministic
entropies. It runs against the same SHA-256 the page uses, written from scratch
because `crypto.subtle` is not guaranteed on a `file://` URL.

## Building

```bash
git config core.hooksPath .githooks   # once per clone, see below
python3 scripts/build.py              # regenerate index.html from src/ and data/
python3 scripts/build.py -o /tmp/out.html
```

`index.html` is committed and CI diffs it against a fresh build, so a commit
that stages a source change beside an older generated file fails CI for a
difference that is already fixed. The pre-commit hook rebuilds and stages
`index.html` whenever anything under `src/` or `data/` is staged. It is opt-in
because git does not run hooks from a repository without `core.hooksPath`.

Edit the sources, never `index.html`, which is generated. `build.py`
concatenates `src/css/*.css`, `src/js/*.js` and `src/content/*.<lang>.html` in
filename order (numbered, because concatenation order is load order) and inlines
them into the template along with the word list and the translations. There is no
minifier and no bundler.

```
index.html                 the site, self-contained and committed
src/template.html          HTML shell: __CSS__ / __JS__ / __CONTENT__ placeholders
src/css/*.css              poster, site chrome, roller, explainer, print rules
src/js/*.js                layout solver, sheet renderer, SHA-256 + BIP-39, PDF writer
src/i18n/<lang>.json       interface strings
src/content/*.<lang>.html  long-form prose
data/english.txt           canonical BIP-39 English word list
scripts/build.py           render index.html
scripts/verify.sh          audit the word list and the build
scripts/probe.py           headless-browser layout and engine checks
```

### Adding a language

Two files, no code:

```
src/i18n/fr.json           copy en.json, translate the values, set _name and _code
src/content/learn.fr.html  copy learn.en.html, translate the prose
```

Rebuild. The language appears in the selector, named by its own `_name`. Keys a
translation has not reached yet fall back to English one at a time, and an
untranslated prose file falls back whole, so a partial language is still usable
and the build only prints a note about what is missing.

The choice lives in the URL as `#<lang>/<view>`, for example
`#es/learn`. Nothing is stored on the reader's machine. With no language in the
URL the browser's own preferences decide.

House style, enforced by the build: no em dash in any string a reader sees.
Write two sentences instead.

## A word of caution

This is the **public** BIP-39 standard list. Every wallet ships it and anyone can
download it, so there is nothing sensitive about hanging it on a wall.

Your recovery phrase is a different matter. Do not circle, underline, tick or
otherwise mark your own words on a printed copy. A poster with twelve marks on it
is a plaintext backup of your seed, and a far easier one to read than you would
like.

## License

[MIT](LICENSE) © Chemaclass

The BIP-39 word list itself is from
[bitcoin/bips](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt).

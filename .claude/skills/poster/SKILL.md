---
name: poster
description: Build, preview and audit the BIP-39 site: poster layout, entropy explainer, dice/coin roller, PDF output. Use when changing anything under src/, the grid or typography, the word list, the seed engine, or when asked to run, open, screenshot or print-check the page.
---

# Working on the site

`index.html` is generated from `src/` + `data/english.txt`. Three views behind
hash routing (`#poster`, `#learn`, `#roll`), in one offline file.

## Loop

```bash
python3 scripts/build.py    # after every source change (a hook also does this)
open index.html             # preview
./scripts/verify.sh         # ~4s: word-list hash, reproducible build, 2048 words
python3 scripts/probe.py    # ~90s: headless Chrome, all 252 layout combinations
```

No dev server, nothing to install. Reload the tab after a rebuild.

`build.py` concatenates `src/css/*.css`, `src/js/*.js`, `src/content/*.html` in
filename order into one scope. The number prefix is load order: `10-data.js`
defines `WORDS` before `90-boot.js` renders. New module, new prefix.

## What breaks, and how it hides

Both of these shipped, and neither is visible on A4:

- **`.sheet{overflow:hidden}` zeroes a flex item's automatic minimum size.** On
  paper wider than the viewport the sheet flex-shrinks and silently cuts off its
  right-hand columns. Invariant: no `.sheet` has `scrollWidth > clientWidth`.
- **The type solver's word-width estimate.** A column must fit the widest word,
  8 glyphs at 4.8 em in the monospace face, plus the 0.5 mm cell padding.
  Invariant: no `.w` cell has `scrollWidth > clientWidth`.

`scripts/probe.py` asserts both across every paper × orientation × grid × face,
plus no JS errors and a passing `SEED.selfTest()`. Run it after any layout or
engine change. It needs Chrome, which is why it is not in `verify.sh` or CI.

## Reference type sizes

Portrait / landscape, in points, at 100 % scale:

| Paper | Portrait (16 × 128) | Landscape (32 × 64) |
|---|---|---|
| A1 | 12.7 | 13.2 |
| A2 | 9.0 | 9.2 |
| A3 | 6.3 | 6.5 |
| A4 | 4.8 | 4.7 |
| Letter | 4.5 | 4.4 |
| Tabloid | 6.6 | 6.6 |

Both bit splits must stay reachable: 4+7 → 16 × 128, 5+6 → 32 × 64. If these
numbers move, update `README.md` too.

## Preview checklist

The page is a print artifact, so screen appearance is not the deliverable.

1. **Control bar**. Paper, Orientation, Grid, faces and toggles all apply live.
2. **Readout**. Type size, amber below 4.6 pt, and the preview scale when the
   sheet is shrunk to fit the window.
3. **Search**. Highlights, and the decoder legend follows the pin.
4. **PDF**. The reliable output path; `Print` depends on the user setting 100 %
   scale and background graphics.
5. **Roller**. Dice and coin, 12 and 24 words, Undo, keyboard entry, worksheet.

## Verifying PDFs

The writer is hand-rolled, so a broken xref shows up as a file that opens
nowhere. Generate in headless Chrome with `PDF.save` stubbed to capture the
blob, read it back with `FileReader`, then check the bytes (`%PDF-1.4`, `xref`,
`%%EOF`) and render with `qlmanage -t -s 1200 -o . file.pdf` and *look* at it.
For the worksheet, wrap `d.text`/`d.rect`/`d.line` to assert nothing is drawn
outside the margins, because `qlmanage` only ever renders page one.

## Things that break the build

- Hand-editing `index.html`, which is generated and diffed by CI against a fresh build.
- Dropping `__CSS__`, `__JS__`, `__CONTENT__` from the template, or `__WORDS__`,
  `__SHA__`, `__SHA_SHORT__` from the sources. `build.py` exits non-zero.
- Any `http(s)://` asset. CI greps for it, and the page's central claim is that
  it has no network code at all.
- Removing `print-color-adjust: exact` or `@page { margin: 0 }`.

## Touching the word list or the seed engine

Don't touch `data/english.txt` unless BIP-39 itself changed: it is pinned by
SHA-256 in `build.py`, in `verify.sh`, and in the poster's colophon.

`src/js/60-seed.js` carries the official BIP-39 vectors plus a deterministic
property test. If a change makes `SEED.selfTest()` fail, the change is wrong.
Never adjust the vectors to suit it.

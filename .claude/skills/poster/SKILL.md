---
name: poster
description: Build, preview and audit the BIP-39 poster. Use when changing src/template.html, the grid/typography/print layout, the word list, or when asked to run, open, screenshot or print-check the page.
---

# Working on the poster

`index.html` is generated from `src/template.html` + `data/english.txt`. Everything
below assumes the repo root as the working directory.

## Loop

```bash
python3 scripts/build.py    # after every template change (a hook also does this)
open index.html             # preview in the default browser
./scripts/verify.sh         # ~4s full audit, before committing
```

There is no dev server and nothing to install — `index.html` is a file URL and the
page has no network dependencies. Reload the browser tab after a rebuild.

## Preview checklist

The page is a print artifact, so screen appearance is not the deliverable. After a
layout change, check in the browser:

1. **Control bar** — Paper, Orientation, Grid and the toggles all still apply live.
2. **Readout** — reports the resulting type size, and turns amber below 4.6 pt.
3. **Search** — typing a word highlights it; the decoder legend follows the pin.
4. **Print preview** (⌘P) — one sheet per selected grid slice, no blank trailing
   page, legend rendered (needs *background graphics* on, 100 % scale).

Both bit splits must stay reachable: 4+7 → 16 × 128, 5+6 → 32 × 64. The page
measures both and keeps whichever gives larger type on the selected paper, so a
change that only looks right on A3 landscape is not done.

## Reference type sizes

Portrait / landscape, in points, at 100 % scale:

| Paper | Portrait (16 × 128) | Landscape (32 × 64) |
|---|---|---|
| A1 | 12.7 | 14.5 |
| A2 | 9.0 | 10.2 |
| A3 | 6.3 | 7.2 |
| A4 | 4.8 | 5.4 |
| Letter | 4.6 | 5.0 |
| Tabloid | 6.6 | 7.4 |

If a change moves these numbers, update the table in `README.md` too.

## Things that break the build

- Hand-editing `index.html` — it is regenerated and CI diffs it against a fresh build.
- Dropping any of `__WORDS__`, `__SHA__`, `__SHA_SHORT__` from the template;
  `scripts/build.py` exits non-zero if a placeholder goes missing.
- Any `<script src=…>`, `<link href=…>` or `<img src=…>` on `http(s)://`. CI greps
  for it. Fonts must resolve through the system stacks already in `:root`.
- Removing `print-color-adjust: exact` or `@page { margin: 0 }` — the decoder legend
  then prints blank and the sheet gains printer margins.

## Touching the word list

Don't, unless BIP-39 itself changed. `data/english.txt` is pinned by SHA-256
(`2f5eed53…3b24dbda`) in both `scripts/build.py` and `scripts/verify.sh`, and the
digest is printed in the poster's colophon. Changing the file means updating both
constants and re-checking the four-letter-prefix uniqueness the layout depends on.

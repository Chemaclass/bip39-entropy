# bip39-poster

A printable poster of the complete BIP-39 English word list, laid out as what it
actually is: an **eleven-bit address space**.

**→ [chemaclass.github.io/bip39-poster](https://chemaclass.github.io/bip39-poster/)**

All 2048 words fit on a single sheet, down to A4. One HTML file, no build step to
view it, no dependencies, no network.

---

## The idea

BIP-39 indices run 0–2047, which is exactly eleven bits. Rather than printing an
alphabetical column list, the poster arranges the words on a grid where **the high
bits choose the column and the low bits choose the row** — so a word's index is
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
black, the rest in grey.** All 2048 four-letter prefixes are unique — that is why
hardware wallets only ever ask you for four characters. The poster shows you that
fact instead of asserting it in a footnote.

## Printing

Open the page, choose your paper, press **Print**. Set the printer to **100 % scale**
with **background graphics enabled**, or the decoder legend prints blank.

The control bar reports the exact resulting type size, and warns you below 4.6 pt.

| Paper | Portrait | Landscape |
|---|---|---|
| A1 | 12.7 pt · 16 × 128 | **14.5 pt** · 32 × 64 |
| A2 | 9.0 pt · 16 × 128 | **10.2 pt** · 32 × 64 |
| A3 | 6.3 pt · 16 × 128 | **7.2 pt** · 32 × 64 |
| A4 | 4.8 pt · 16 × 128 | **5.4 pt** · 32 × 64 |
| Letter | 4.6 pt · 16 × 128 | **5.0 pt** · 32 × 64 |
| Tabloid | 6.6 pt · 16 × 128 | **7.4 pt** · 32 × 64 |

A4 gets all 2048 words onto one sheet, but at roughly map-legend size — a desk
reference rather than a wall piece. A3 or larger is where it becomes readable
across a room. If you would rather have big type on small paper, the **Grid**
selector splits the list across 2, 4, or 8 sheets.

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
`index.html` ever gains a remote asset — the page must keep working with the
network cable pulled.

## Building

```bash
python3 scripts/build.py          # regenerate index.html from src/ and data/
python3 scripts/build.py -o /tmp/out.html
```

Edit `src/template.html`, never `index.html` — the latter is generated. The build
only inlines the word list and its hash; there is no minifier and no bundler.

```
index.html            the poster, self-contained and committed
src/template.html     source, with __WORDS__ / __SHA__ placeholders
data/english.txt      canonical BIP-39 English word list
scripts/build.py      render index.html
scripts/verify.sh     audit the word list and the build
```

## A word of caution

This is the **public** BIP-39 standard list. Every wallet ships it and anyone can
download it, so there is nothing sensitive about hanging it on a wall.

Your recovery phrase is a different matter. Do not circle, underline, tick or
otherwise mark your own words on a printed copy — a poster with twelve marks on it
is a plaintext backup of your seed, and a far easier one to read than you would
like.

## License

[MIT](LICENSE) © Jose Maria Valera Reales

The BIP-39 word list itself is from
[bitcoin/bips](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt).

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: a newcomer about to create or back up their first seed phrase, usually because a wallet told them to "write down twelve words". They read on a phone, often between other things, often in their second language (English or Spanish).

Secondary: technical readers (developers, long-time holders) who want the arithmetic and the failure history checked rather than asserted.

## Product Purpose

Explain the number behind a BIP-39 seed phrase: what entropy measures, why the list holds 2048 words, how wallets were emptied when the number was small, and how to protect a phrase after the paper backup. Two tools make it concrete: a printable poster of the 2048-word list laid out as an eleven-bit address space, and a dice and coin roller that builds a phrase one throw at a time.

Success: the reader generates their phrase from a process they can trust, writes it on paper by hand, restores from that paper before funding, and never types it anywhere.

## Positioning

One offline HTML file with no network code of any kind. The page tells readers nothing they type or throw leaves it, and that is literally true and checkable: read the source or pull the cable. The poster is the word list as it actually is, an eleven-bit grid where a word's index is its coordinate.

## Operating Context

- Read on a phone first, desktop second. The poster is printed on paper (A4 to A1, Letter, Tabloid) or saved as PDF.
- The roller is used at a table with physical dice or a coin, or with a printed worksheet away from any computer.
- Language lives in the URL (`#<lang>/<view>`), never stored.

## Capabilities and Constraints

- Views: Start here (landing), Entropy, Protect, Questions, Poster, Roll your own.
- `index.html` is generated from `src/` by `scripts/build.py`; no build tooling, bundler, framework or package manager.
- No network code, no remote assets, no remote fonts, no analytics. Fonts are system stacks.
- The printed poster sheet design is fixed; only the chrome around it may change.
- Print correctness depends on `print-color-adjust: exact` and `@page { margin: 0 }`.
- Dark and light themes both ship, following the system unless forced (not stored).
- English and Spanish at parity. Adding a language is a JSON file plus content files, never code.
- Never write a generated phrase into a downloaded file.

## Brand Commitments

- Voice guide in `.claude/rules/writing-style.md`: plain, blunt, earned. Short sentences, `you` while teaching, no em dash, no hedging, no filler, no exclamation marks, no emoji.
- The eleven-bit structure (837 = hamster, 4+7 or 5+6 split) is the site's recurring idea.
- Author: Chemaclass. MIT licence.

## Evidence on Hand

- The word list (`data/english.txt`, pinned by SHA-256) and the BIP-39 test vectors in `src/js/60-seed.js`.
- Real failure history told in the guide: brainwallets, Android SecureRandom 2013, Randstorm, Milk Sad, Trust Wallet extension.
- No testimonials, user counts or press. Do not invent any.

## Product Principles

- Every claim the page makes about itself must be literally true and checkable.
- The newcomer comes first: never make them reread a sentence or hunt for the next step.
- Show the arithmetic instead of asserting it.
- The reader's own hands (dice, pen, paper) are the trusted path; the page is a guide, not a custodian.

## Accessibility & Inclusion

- Readable at 320px, thumb-sized targets (44px) on phones, 16px controls to avoid iOS zoom.
- Honors `prefers-reduced-motion` and `prefers-color-scheme`.
- Readers in a second language: B2-level plain English, Spanish in informal `tú`.

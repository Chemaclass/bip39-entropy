# Writing style for every word on this site

Canonical source, and the tie-breaker if this file drifts:
<https://github.com/Chemaclass/chemaclass.com/blob/main/.claude/skills/writing-style/SKILL.md>
Spanish reference:
<https://github.com/Chemaclass/chemaclass.com/blob/main/.claude/skills/writing-style/references/spanish.md>

This applies to all reader-facing text: `src/content/*.html`, every string in
`src/i18n/*.json`, and the words printed on the poster and the worksheet.

## Voice in one line

Plain, blunt, earned. Short sentences with deliberate fragments for punch. Teach
the reader directly. Stamp the ending.

## Plain language first

The reader skims on a phone, between meetings, often in their second language.
They should never have to reread a sentence.

- One idea per sentence. If it needs a second read, split it.
- Plain word over fancy: "use" not "utilize", "about" not "regarding", "enough"
  not "sufficient", "show" not "demonstrate".
- No metaphor-jargon a B2 English speaker would miss: no "moat", "table stakes",
  "north star", "load-bearing", "compound" as a verb.
- Concrete over abstract. A real example beats a definition.
- One idea per sentence is not one clause per sentence. A comma, a colon or a
  pair of parentheses can carry the second half of a thought.

## Rhythm

The half of the guide this site kept forgetting, and the half readers notice
first. Uniform short sentences read as machine-made, which is the one impression
a page about trusting your own hands cannot afford.

- Baseline is 6 to 15 words. Almost never over 35.
- **A block caps at 70 words**, whether it is a paragraph or a list item. A reader
  meets the wall one paragraph at a time.
- **Never more than two short sentences in a row.** A longer one has to reset the
  rhythm before you go short again.
- Expand, then contract. The paragraph explains at length, then a fragment
  carries the point.
- Two-way contrast is the engine, so keep it for the moments that deserve it.
  Four "it isn't X, it's Y" reversals on one page is a tic, not a voice.
- `python3 scripts/style.py` measures all of this. Run it before you commit prose.

## Diction

- `you` while teaching. `we` for shared responsibility. `I` only for personal
  narration, which this site has none of.
- Contractions freely: isn't, don't, you'll, that's. This is technical writing,
  not an essay.
- Name technical terms precisely and gloss them in the same breath.
- Backticks for every file, command and flag.
- **Bold** for the punchline of an argument and for inline list labels.

## Openings and closings

- Open with a fact, a scene, or a claim. Never throat-clearing.
- Close with a stamp: a one-line aphorism, a two or three word imperative
  cluster, or a hard one-liner that calls back to the opening. Never trail off.

## Never

- No em dash or en dash. The build fails on the em dash. Period, comma, colon,
  or parentheses.
- No hedging: "I think", "perhaps", "it seems", "arguably".
- No filler adverbs: "just", "really", "basically", "actually", "simply".
- No exclamation marks, no emoji, no corporate hype.
- No unexplained jargon.

## Spanish

Spanish is derived from English. When they drift, fix Spanish to match.

- Informal `tú` throughout, never `usted`. Peninsular vocabulary.
- Keep borrowed tool nouns in English: `prompt`, `setup`, `output`, `hooks`,
  `open source`, `trade-offs`, `bug`, `build`.
- Translate idiomatically, not literally. Keep the paragraph count, the heading
  structure and the fragment rhythm.
- Quotes are `"..."`, never `«...»`.

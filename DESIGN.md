---
name: BIP-39 Entropy
description: The number behind a seed phrase, set on a Swiss grid in ink and one red.
colors:
  signal-red: "#d4211b"
  ink: "#111111"
  field: "#ffffff"
  field-grey: "#f0f0ec"
  hairline: "#d6d6d0"
  text-1: "#1c1c1a"
  text-2: "#3a3a37"
  text-3: "#5c5c58"
  text-4: "#66665f"
  signal-red-dark: "#ff5a4a"
  ink-dark: "#f2f2ee"
  field-dark: "#121212"
  field-grey-dark: "#1e1e1c"
  hairline-dark: "#34342f"
  text-1-dark: "#dcdcd6"
  text-2-dark: "#c4c4bd"
  text-3-dark: "#a3a39c"
  text-4-dark: "#8e8e87"
typography:
  display:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "clamp(38px, 6vw, 80px)"
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "clamp(22px, 2.3vw, 30px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "clamp(18px, 1.7vw, 22px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "clamp(18px, 1.7vw, 22px)"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "clamp(16px, 1.15vw, 17.5px)"
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "\"Helvetica Neue\", Helvetica, Arial, \"Liberation Sans\", system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
  mono:
    fontFamily: "ui-monospace, \"SF Mono\", SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
    fontFeature: "\"tnum\""
rounded:
  none: "0"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "24px"
  sp-6: "32px"
  sp-7: "48px"
  sp-8: "72px"
  sp-9: "112px"
  gutter: "32px"
  measure: "1200px"
components:
  button:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "9px 11px"
    height: "38px"
  button-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.field}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.field}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "9px 11px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.field}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "9px 11px"
    height: "38px"
  tab:
    textColor: "{colors.text-3}"
    padding: "0 12px"
  tab-active:
    textColor: "{colors.ink}"
  roll-key:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    size: "68px"
  roll-key-pressed:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.field}"
  warning-block:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.field}"
    typography: "{typography.body}"
    padding: "{spacing.sp-6}"
  tool-panel:
    backgroundColor: "{colors.field-grey}"
    padding: "{spacing.sp-5}"
  seed-card:
    backgroundColor: "{colors.field-grey}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
---

# Design System: BIP-39 Entropy

## Overview

**Creative North Star: "The Address Space"**

The page is a Swiss grid that treats a seed phrase as what it is: one number, laid out in cells. A white field, near-black ink and one signal red. Heavy system Helvetica, tight negative tracking, sentence case. The figures (2048, 128, 11, 837) are set as loud as the headlines, and the prose sits flush left beside them on two shared column edges.

Density is editorial rather than dashboard. Every block on a guide page is the same object: a 2px ink rule, a name in the narrow left column, the substance in the wide right column. The reader learns that shape once and reads the rest of the site with it. Structure comes from rules and grey fields, never from lifted cards, so the page feels printed even on a phone.

The red is scarce on purpose. It marks the checksum, where you are, and what to do next. Everything else is ink or a step of grey. The page rejects the crypto-hype look (neon, glow, gradients) and the terminal-mono dark page.

**Key Characteristics:**
- White field, near-black ink, one red with three jobs.
- Heavy system grotesk (800 display, 700 headings), negative tracking, sentence case.
- Square corners everywhere; the grid is the structure.
- 2px ink rules open blocks, 1px hairlines divide rows.
- Mono only for figures, bits, hex and code.
- Flat; only a menu or a floating button lifts.
- Light and dark ship as a palette swap, following the system unless forced.

## Colors

A monochrome ink-and-paper palette with warm neutral greys and a single signal red.

### Primary
- **Signal Red** (`signal-red`, dark theme `signal-red-dark`): the checksum cells and bytes, the active tab bar, the active rail entry, the focus ring, the text caret, the reading-progress line, link hover, the primary button on hover, a pressed dice key, the chosen last word. Prose link underlines use neutral grey.

### Neutral
- **Ink** (`ink` / `ink-dark`): headings, button outlines, 2px block rules, the filled bit cells, the reversed warning block, selection background.
- **Field** (`field` / `field-dark`): the page and every control surface at rest.
- **Field Grey** (`field-grey` / `field-grey-dark`): tool panels (scale widget, checklist offer), seed cards, inline code, the error wash, the stage the poster sits on.
- **Hairline** (`hairline` / `hairline-dark`): 1px row dividers, control borders, the empty-cell outline, scrollbar thumb.
- **Text 1 to 4** (`text-1` ... `text-4`, with `-dark` pairs): body copy, leads and secondary copy, captions and inactive tabs, then the quietest step for section numbers, placeholders and figure row numbers.

### Named Rules
**The Three Jobs Rule.** Red marks the checksum, where you are, and what to do next. Nothing else is red: no decorative red, no red headings, no red backgrounds larger than a key or a byte.

**The Palette Swap Rule.** A theme is a value swap on the same custom properties, set in `:root`, `:root[data-theme="dark"]` and `prefers-color-scheme: dark` together. A component never carries its own hex.

## Typography

**Display Font:** Helvetica Neue (with Helvetica, Arial, Liberation Sans, system-ui)
**Body Font:** the same stack, one family for the whole chrome
**Label/Mono Font:** ui-monospace (with SF Mono, Menlo, Consolas, Liberation Mono)

**Character:** One heavy grotesk carries everything from 12px labels to 80px headlines, differentiated by weight and tracking rather than by a second face. Mono appears only where the content is a figure a reader might compare digit by digit.

### Hierarchy
- **Display** (800, fluid 38 to 80px, 0.96, -0.035em): the one page headline (guide pages, the roller). Balanced line wrap.
- **Headline** (700, fluid 22 to 30px, 1.15, -0.02em): section headings and the block names in the left column ("The short version", the warning, the doors).
- **Title** (700, fluid 18 to 22px, 1.2, -0.01em): headings inside a tool (scale widget, roller sections). The seed-card word uses the same size at 800.
- **Lead** (400, fluid 18 to 22px, 1.45): the paragraph under a headline, capped at 34em, in Text 2.
- **Body** (400, fluid 16 to 17.5px, 1.55 to 1.65): prose capped at 40em, in Text 1, pretty wrap.
- **Small** (500, 14px, 1.5): controls, contents list, door descriptions, table cells, captions.
- **Label** (700, 12px, 1): control labels and table column heads. Sentence case, no tracking.
- **Mono** (400, 14px, 0.04em, tabular): bits, bytes, hex, the throw field, the poster readout, inline code at 0.86em.

### Named Rules
**The One Face Rule.** The chrome uses one sans stack, all system, nothing downloaded. Hierarchy comes from weight (400 to 800) and negative tracking, never from a second display face.

**The Figures Are Mono Rule.** Mono is for values the reader compares: bits, bytes, hex, code. A number inside prose or a big display figure stays in the sans with tabular numerals.

## Layout

One column for every view: `measure` wide, centered, with `gutter` padding (16px under 560px). The header, the poster control bar, the prose and the footer share its edges, so switching tabs moves nothing.

Guide pages run a two-column grid, 4fr and 8fr, with a `sp-7` gap. The left column names the block and the right column holds it. Section headings are sticky in the left column (top 84px) while their prose scrolls. The landing inverts the ratio for its head (8fr headline, 4fr number figure, aligned to the bottom). Under 900px everything drops to one column and the sticky headings go static.

Spacing is a 4px rhythm (`sp-1` to `sp-9`). Blocks open with `sp-8` above and `sp-4` between their rule and their content; sections open with `sp-9`. Prose paragraphs stack at `sp-4`.

Breakpoints: 560px (phone: 16px controls, 44px targets, full-bleed warning), 900px (one column), 1000px (tabs take their own scrolling row), 1100px (the section rail appears in the left margin).

**The Shared Edge Rule.** Every block hangs off the same two column edges. A new block uses the 4fr/8fr grid and the `measure` column, never its own width.

**The Rhythm Rule.** Space comes from the `sp-*` scale. A value between two steps is a mistake.

## Elevation & Depth

Flat. Depth is carried by rules, grey fields and the one reversed block. Only the rail's contents panel and the back-to-top button carry a site UI shadow. The sticky header keeps its 2px ink rule. Inset box-shadows draw lines (the 4px red tab bar, the 2px red ring on the chosen last word, empty-cell outlines), not elevation. The poster sheet keeps its separate paper-on-desk shadow on screen.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 8px 28px rgba(0,0,0,.14)`, dark `rgba(0,0,0,.5)`): rail panel and back-to-top only.

### Named Rules
**The Only Floats Lift Rule.** A shadow means the thing is over the page. Cards, panels, keys and the warning never carry one.

## Shapes

Square corners, all of them (`rounded.none`): controls, keys, cards, panels, cells, the bit figure's SVG rects. The recurring shape is the cell: a solid square. It is the eleven-bit cell of the number figure, the 9px ink bullet of the short version, and the key swatches under the figure. Rules come in two weights: 2px ink to open a block or frame the header and footer, 1px hairline to divide rows. Doors end in a stroked 2px arrow drawn as inline SVG.

**The Cell Mark Rule.** When a list needs a marker, it is a filled square in ink, or red when it marks the checksum. No round bullets, no glyph icons.

## Components

### Buttons
Outlined blocks that fill with ink under the pointer and drop 1px when pressed.
- **Shape:** square (0).
- **Default:** field background, 1px ink border, ink text at 700 14px, 9px 11px padding, 38px minimum height (44px and 16px text under 560px).
- **Hover:** fills ink, text turns field. **Active:** `translateY(1px)`. **Disabled:** 40% opacity, no fill.
- **Primary:** the one action a panel exists for (print, download) is solid ink and turns red on hover.
- **Focus:** a 2px red outline at 2px offset, everywhere, inset to -2px where a scroller would clip it.

### Inputs / Fields
- **Style:** the same object as a button: field background, 1px hairline border, 500 14px, 9px 11px padding, 38px minimum. Selects draw their chevron as two gradients on the element.
- **Hover:** border turns ink. **Caret:** red. **Placeholder:** Text 4.
- **Error:** a message in ink on a grey wash, with text that explains the problem.

### Navigation
- **Header:** sticky, 96% opaque field veil, 2px ink bottom rule, 60px minimum. Brand in 800 18px, turns red on hover.
- **Tabs:** 500 15px in Text 3; hover to ink; active is ink at 700 with a 4px red bar standing on the header rule. Guide and tools are two groups split by a hairline and a 12px word; on narrow screens the word becomes the divider.
- **Progress:** a 2px red line draws along the header rule as you scroll (where the browser supports scroll timelines; the poster has none).
- **Rail:** from 1100px, a 40 by 56px outlined mark in the left margin opens a contents panel (1px ink border, overlay shadow, 2px rule under its heading, active entry red on grey).
- **Footer:** 2px ink top rule; links in Text 2 gain a 2px red underline on hover.

### Blocks
- **Short version:** 2px ink rule, headline-size name left, list right with 1px hairline rows and 9px ink cell bullets.
- **Warning:** the one reversed block (ink field, field text, `sp-6` padding). Full bleed on phones.
- **Note:** a 1px ink left rule and 14px Text 2, for caveats.
- **Table:** 2px ink top rule, 12px bold column heads over a 1px ink line, hairline rows, right-aligned tabular figures, first column left.

### Tool Panels
A grey field with controls on it, so it reads as something you operate: the scale widget and the checklist offer (`field-grey`, `sp-5` padding, no border, no shadow).

### Doors
The landing's "which way is yours" list. Each row: a 700 19 to 23px name, a 14px Text 2 line under it, and a 22px stroked arrow on the right, divided by hairlines. Hover turns the name and arrow red and moves the arrow 4px right.

### Number Figure (signature)
Twelve rows of eleven square cells with a 3px gap and a small row number, the phrase drawn as the number it is. The last four cells of the last row are red: the checksum. The caption sets "128 + 4" at 800 44 to 68px with the 4 in red, then a 14px summary and a cell-swatch key. The cells never carry values. With motion allowed, the cells fill row by row from hairline outlines (0.6s, `cubic-bezier(.16,1,.3,1)`) and the checksum lands last; with reduced motion they are simply filled.

### Dice Keys
68px square keys (58px on phones) with a drawn die or coin face in `currentColor` and a mono 11px bit label. Hover fills ink; press fills red and drops 1px. Faces that buy no entropy sit on grey; spent keys go flat to a faint tint.

### Seed Cards
Grey cards in an auto-fill grid (212px minimum): index in 12px, the word in 800 at lead size, the eleven bits in mono 11px. In the last-word block, fifteen candidates fade to 60% and the checksum's pick is a field card with a 2px red inset ring, red word and a red bit badge.

## Do's and Don'ts

### Do:
- **Do** take every colour, size and space from the `:root` custom properties; add a theme by swapping values, not by adding hex to a component.
- **Do** open every guide block with a 2px ink rule and put its name in the 4fr column and its content in the 8fr column.
- **Do** keep red to the checksum, the current location and the next action (The Three Jobs Rule).
- **Do** give every control a 38px minimum on desktop and 44px with 16px text under 560px.
- **Do** use the 2px red focus outline at 2px offset on anything focusable.
- **Do** gate every transition and animation on `prefers-reduced-motion: no-preference`, and make every state readable without it.
- **Do** use system font stacks only, inline SVG for any drawn mark, and nothing loaded from the network.

### Don't:
- **Don't** round a corner. The radius tokens are zero on purpose.
- **Don't** put a drop shadow on anything that sits on the page; the overlay shadow is for floating menus and the back-to-top button only.
- **Don't** use neon, glow or gradients as decoration, or a dark terminal-mono look.
- **Don't** set prose, headings or display figures in mono; mono is for bits, bytes, hex and code.
- **Don't** use uppercase tracked labels in the chrome; labels are sentence case at 700 12px.
- **Don't** print bit values into the number figure, or any value a reader could copy into a wallet.
- **Don't** add a second display face, a remote font or an icon font.
- **Don't** restyle the poster sheet from this system; it is a fixed print artifact with its own palette and mm geometry.

## Out of scope: the poster sheet

The printed poster (the sheet, its masthead, decoder, grid, axis and colophon) is a fixed print artifact drawn in millimetres with its own tokens: `--paper`, `--ink` (#14161c), `--ghost`, `--verdigris`, `--rule`, `--rule-strong`, `--hair`, and the `--grot` / `--face` / `--serif` stacks the type solver measures against. It does not invert in dark mode, and it depends on `print-color-adjust: exact` and `@page { margin: 0 }`. Its uppercase tracked mono labels and verdigris accent belong to that sheet only and are not part of the chrome system. The one chrome rule that touches it: the sheet sits on the `field-grey` stage with a soft paper-on-desk shadow on screen, removed in print.

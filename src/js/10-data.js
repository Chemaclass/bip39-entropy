const WORDS = __WORDS__;
const SHA = "__SHA__", SHA_SHORT = "__SHA_SHORT__";
const MM = 96 / 25.4, PT = 2.83465;

const PAPER = {
  A1:[594,841], A2:[420,594], A3:[297,420], A4:[210,297],
  Letter:[215.9,279.4], Tabloid:[279.4,431.8]
};
const FACES = { grot:"var(--grot)", serif:"var(--serif)", mono:"var(--mono)" };

// Width of the widest word, in em. BIP-39 English tops out at 8 glyphs, and the
// widest face offered is the monospace one at 0.6em per glyph. Holding every
// face to that bound costs the proportional faces ~2 % of type size and buys a
// column that cannot clip a word, whichever face and paper are selected.
const NEED = 8 * 0.6;
const PAD = 0.5;         // .w padding-right, mm

const $ = id => document.getElementById(id);
const stage = $("stage");
let L = null;

const bin = (n, w) => n.toString(2).padStart(w, "0");
const log2 = n => Math.round(Math.log2(n));

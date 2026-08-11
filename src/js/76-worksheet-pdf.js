/* ── by-hand worksheet ──────────────────────────────────────────── */
// A blank sheet to carry to a table with dice and no computer. It records
// throws, never results: nothing generated here is ever written into a PDF,
// because a downloaded file with a live phrase in it is exactly the artifact
// this whole page argues against.
const WS_INK = [0.078, 0.086, 0.110];
const WS_VERD = [0.180, 0.420, 0.369];
const WS_RULE = [0.655, 0.690, 0.706];
const WS_FAINT = [0.855, 0.870, 0.882];
const WS_SUB = [0.353, 0.380, 0.412];

function wsBoxes(d, x, y, cols, rows, bw, bh, n, label){
  for (let i = 0; i < n; i++){
    const c = i % cols, r = Math.floor(i / cols);
    const bx = x + c * bw, by = y + r * bh;
    d.rect(bx, by, bw, bh, { stroke: WS_RULE, lw: 0.15 });
    if (label && i % label === 0)
      d.text(bx + 0.8, by + 2.4, String(i + 1),
             { size: 4.2, font: "cour", rgb: WS_SUB });
  }
  return y + rows * bh;
}

function wsHead(d, title, sub){
  d.text(15, 20, "BIP-39 BY HAND",
         { size: 7, font: "cour", rgb: WS_VERD, tracking: 0.3 });
  d.text(15, 30, title, { size: 19, font: "courB", rgb: WS_INK });
  d.text(15, 37.5, sub, { size: 8.5, font: "helv", rgb: WS_SUB });
  d.line(15, 41, 195, 41, { rgb: WS_INK, lw: 0.3 });
}

function wsSection(d, y, n, title, note){
  d.text(15, y, n, { size: 8, font: "courB", rgb: WS_VERD, tracking: 0.1 });
  d.text(24, y, title, { size: 8, font: "courB", rgb: WS_INK, tracking: 0.1 });
  if (note) d.text(15, y + 5.5, note, { size: 7.4, font: "helv", rgb: WS_SUB });
  return y + (note ? 11 : 6);
}

function worksheetPDF(){
  const coin = ROLL.method === "coin";
  const spec = rollSpec();
  const throws = coin ? spec.entBits : spec.entBits / 2;
  const d = PDF.doc({ w: 210, h: 297 });

  wsHead(d,
    coin ? "Coin worksheet" : "Dice worksheet",
    spec.words + " words · " + spec.entBits + " bits of entropy · " +
    throws + (coin ? " flips" : " accepted throws"));

  let y = wsSection(d, 50, "01", coin ? "FLIP" : "THROW",
    coin
      ? "One coin, " + throws + " times. Heads is 1, tails is 0. Write each result in a box, in order — " +
        "a flip is already a bit, so there is nothing to convert."
      : "One die, until " + throws + " boxes are full. Write 1, 2, 3 or 4 in the next box. " +
        "A 5 or a 6 fills no box — throw again. Rejecting them is what keeps the four outcomes equally likely.");

  const bw = 180 / 16;
  y = wsBoxes(d, 15, y, 16, throws / 16, bw, 7.2, throws, 16) + 9;

  // A coin needs no transcription step; a die does, two bits at a time.
  if (!coin){
    y = wsSection(d, y, "02", "TRANSCRIBE",
      "Each throw is two bits: 1 is 00, 2 is 01, 3 is 10, 4 is 11. " +
      "Fill the cells left to right, top to bottom.");
    for (let r = 0; r < spec.entBits / 16; r++){
      const ry = y + r * 6.4;
      for (let c = 0; c < 16; c++)
        d.rect(15 + c * bw, ry, bw, 6.4,
               { stroke: c % 8 === 0 ? WS_RULE : WS_FAINT, lw: c % 8 === 0 ? 0.18 : 0.1 });
    }
    y += (spec.entBits / 16) * 6.4;
  }

  // The word table gets its own page: at 24 words it cannot share one, and a
  // sheet you fill at a table should not need turning back and forth anyway.
  d.page();
  wsHead(d, coin ? "Coin worksheet" : "Dice worksheet",
         spec.words + " words · continued");
  y = wsSection(d, 50, coin ? "02" : "03", "READ OFF THE POSTER",
    "Eleven bits per word. Read the first four bits as a column and the last seven as a row — " +
    "or the first five and last six, on a 32 x 64 sheet. Write the index, then the word.");

  // 24 rows plus the closing notes do not fit at a comfortable row height, so
  // the rows give way rather than the notes: the notes are the safety warning.
  const FOOT = 34, BOTTOM = 282;
  const rowH = Math.min(9.4, (BOTTOM - FOOT - y) / spec.words);
  for (let i = 0; i < spec.words; i++){
    const ry = y + i * rowH;
    const last = i === spec.words - 1;
    d.text(17, ry + rowH * 0.62, String(i + 1).padStart(2, " "),
           { size: 7.5, font: "cour", rgb: WS_SUB });
    for (let b = 0; b < 11; b++)
      d.rect(24 + b * 5.2, ry + 1.4, 5.2, rowH - 2.8,
             { stroke: last ? WS_FAINT : WS_RULE, lw: 0.15 });
    d.line(86, ry + rowH - 1.6, 108, ry + rowH - 1.6, { rgb: WS_RULE, lw: 0.15 });
    d.line(112, ry + rowH - 1.6, 195, ry + rowH - 1.6, { rgb: WS_RULE, lw: 0.15 });
    if (i === 0){
      d.text(86, ry - 0.6, "INDEX", { size: 5.4, font: "cour", rgb: WS_SUB, tracking: 0.14 });
      d.text(112, ry - 0.6, "WORD", { size: 5.4, font: "cour", rgb: WS_SUB, tracking: 0.14 });
    }
    if (last)
      d.text(24, ry + rowH * 0.62,
             "last word carries the checksum — a machine has to finish this one",
             { size: 6.6, font: "helv", rgb: WS_VERD });
  }
  y += spec.words * rowH + 6;

  d.line(15, y, 195, y, { rgb: WS_INK, lw: 0.3 });
  d.text(15, y + 5,
    "The first " + (spec.words - 1) + " words follow from your bits alone, so this sheet and the poster " +
    "are enough for them.", { size: 7.2, font: "helv", rgb: WS_SUB });
  d.text(15, y + 10,
    "The final word mixes the last entropy bits with a SHA-256 checksum: enter your bits into an offline " +
    "tool, or a wallet that accepts dice.", { size: 7.2, font: "helv", rgb: WS_SUB });
  d.text(15, y + 16.5,
    "BURN OR SHRED THIS SHEET ONCE THE PHRASE IS RECORDED. IT IS YOUR SEED IN LONGHAND.",
    { size: 7, font: "courB", rgb: WS_INK, tracking: 0.06 });

  PDF.save(d.blob(), "bip39-" + (coin ? "coin" : "dice") + "-worksheet-" + spec.words + "w.pdf");
}

/* ── poster as PDF ──────────────────────────────────────────────── */
// The same solved layout the screen uses, drawn through PDF.doc instead of the
// DOM. Everything in L is already in millimetres, which is what the writer
// wants, so this is a transcription rather than a second layout engine.
const PDF_INK = [0.078, 0.086, 0.110];
const PDF_GHOST = [0.643, 0.667, 0.702];
const PDF_VERD = [0.180, 0.420, 0.369];
const PDF_RULE = [0.875, 0.890, 0.902];
const PDF_RULE_STRONG = [0.655, 0.690, 0.706];
const PDF_SUB = [0.353, 0.380, 0.412];

const PT_PER_MM = 72 / 25.4;
const pdfSize = mm => mm * PT_PER_MM;

// Text is centred in its row box on screen; in PDF it is placed on a baseline.
// Half the cap height below the middle puts lowercase-heavy words on the same
// optical line the browser lands on.
const pdfBase = (top, boxH, fs) => top + boxH / 2 + fs * 0.36;

function pdfDecoder(d, idx, x2, bottom){
  const col = Math.floor(idx / L.TR), row = idx % L.TR;
  const bits = bin(col, L.colBits) + bin(row, L.rowBits);
  const compact = L.tight || !L.solo;

  const bw = L.fs * 1.05, bh = L.fs * 1.25, gap = L.fs * 0.16, lead = L.fs * 0.85;
  const padX = L.fs * 1.1, padY = L.fs * 0.9, vgap = L.fs * 0.62;
  const bitsW = bits.length * bw + (bits.length - 1) * gap + lead;

  const label = "HOW TO READ A WORD";
  const math = "column " + (col * L.TR) + " + row " + row + " = " + idx;
  const word = WORDS[idx];

  const wLab = d.width(label, pdfSize(L.fs * 0.6), "cour") +
                 (label.length - 1) * 0.18 * L.fs * 0.6;
  const wMath = d.width(math, pdfSize(L.fs * 0.7), "cour");
  const wWord = compact ? 0 : d.width(word, pdfSize(L.fs * 1.85), "helvB");
  const boxW = Math.max(bitsW, wLab, wMath, wWord) + padX * 2;

  const lines = compact ? 3 : 4;
  const boxH = padY * 2 + L.fs * 0.6 + bh + L.fs * 0.7 +
               (compact ? 0 : L.fs * 1.85) + vgap * (lines - 1);
  const x = x2 - boxW, y = bottom - boxH;

  d.rect(x, y, boxW, boxH, { stroke: PDF_RULE_STRONG, lw: 0.2 });

  let cy = y + padY;
  d.text(x + padX, cy + L.fs * 0.6, label,
         { size: pdfSize(L.fs * 0.6), font: "cour", rgb: PDF_VERD, tracking: 0.18 });
  cy += L.fs * 0.6 + vgap;

  let bx = x + padX;
  [...bits].forEach((b, k) => {
    if (k === L.colBits) bx += lead;
    const on = b === "1";
    d.rect(bx, cy, bw, bh,
           on ? { fill: PDF_VERD, stroke: PDF_VERD, lw: 0.2 }
              : { stroke: PDF_RULE_STRONG, lw: 0.2 });
    d.text(bx + bw / 2, pdfBase(cy, bh, L.fs * 0.66), b,
           { size: pdfSize(L.fs * 0.66), font: "cour", align: "c",
             rgb: on ? [1, 1, 1] : PDF_INK });
    bx += bw + gap;
  });
  cy += bh + vgap;

  d.text(x + padX, cy + L.fs * 0.7, math,
         { size: pdfSize(L.fs * 0.7), font: "cour", rgb: PDF_SUB });
  cy += L.fs * 0.7 + vgap;

  if (!compact)
    d.text(x + padX, cy + L.fs * 1.85, word,
           { size: pdfSize(L.fs * 1.85), font: "helvB", rgb: PDF_INK });
}

function pdfMasthead(d, s, colStart, rowStart){
  const top = L.M, x = L.M;
  const titleMM = L.headH * (L.tight ? 0.27 : (L.solo ? 0.26 : 0.30));

  d.text(x, top + L.fs * 0.72, "BIP-39 · ENGLISH · 2048 WORDS",
         { size: pdfSize(L.fs * (L.tight ? 0.78 : 0.72)), font: "cour",
           rgb: PDF_VERD, tracking: 0.3 });

  let ty = top + L.fs * 0.72 + L.fs * 0.45 + titleMM;
  const lines = L.tight
    ? [["THE ELEVEN-BIT ADDRESS ", "SPACE"]]
    : [["THE ELEVEN-BIT", ""], ["ADDRESS ", "SPACE"]];
  for (const [dark, green] of lines){
    d.text(x, ty, dark, { size: pdfSize(titleMM), font: "courB", rgb: PDF_INK });
    if (green)
      d.text(x + d.width(dark, pdfSize(titleMM), "courB"), ty, green,
             { size: pdfSize(titleMM), font: "courB", rgb: PDF_VERD });
    ty += titleMM * 0.95;
  }

  if (L.headH >= 15){
    const size = pdfSize(L.fs * (L.tight ? 0.95 : 0.86));
    const text = "The high " + L.colBits + " bits pick a column, the low " + L.rowBits +
      " pick a row, so every word's index is its coordinate on this sheet. The first " +
      "four letters, set in black, are unique across all 2048; the grey tail is redundant.";
    const maxW = L.CW * 0.52;
    let line = "", ly = ty + L.fs * 0.6;
    for (const word of text.split(" ")){
      const next = line ? line + " " + word : word;
      if (d.width(next, size, "helv") > maxW){
        d.text(x, ly, line, { size, font: "helv", rgb: PDF_SUB });
        ly += L.fs * 1.13;
        line = word;
      } else line = next;
    }
    if (line) d.text(x, ly, line, { size, font: "helv", rgb: PDF_SUB });
  }

  pdfDecoder(d, LEGEND_INDEX, L.W - L.M, L.M + L.headH - (L.sheets > 1 ? L.fs * 1.6 : 0));

  if (L.sheets > 1){
    const lo = colStart * L.TR + rowStart;
    const hi = (colStart + L.cols - 1) * L.TR + rowStart + L.rows - 1;
    d.text(L.W - L.M, L.M + L.headH,
           "SHEET " + (s + 1) + " / " + L.sheets + " · " + lo + "-" + hi,
           { size: pdfSize(L.fs * 0.64), font: "cour", align: "r",
             rgb: PDF_VERD, tracking: 0.18 });
  }
}

function pdfSheet(d, s){
  const colStart = (s % L.colSheets) * L.cols;
  const rowStart = Math.floor(s / L.colSheets) * L.rows;
  const gridTop = L.M + L.headH;
  const gridLeft = L.M + L.gut;
  const gridRight = gridLeft + L.cols * L.colW;
  const bodyTop = gridTop + L.axisH;
  const bodyBottom = bodyTop + L.rows * L.rowH;

  pdfMasthead(d, s, colStart, rowStart);

  /* column axis */
  d.line(L.M, bodyTop, L.W - L.M, bodyTop, { rgb: PDF_INK, lw: 0.3 });
  for (let c = 0; c < L.cols; c++){
    const gc = colStart + c;
    const x = gridLeft + c * L.colW;
    d.text(x, bodyTop - 0.8 - L.fs * 1.15, bin(gc, L.colBits),
           { size: pdfSize(L.fs * 0.6), font: "cour", rgb: PDF_VERD, tracking: 0.1 });
    d.text(x, bodyTop - 0.8, String(gc * L.TR),
           { size: pdfSize(L.fs * 1.0), font: "courB", rgb: PDF_INK });
  }

  /* vertical separators */
  if (L.rules)
    for (let c = 0; c < L.cols; c += L.vsep){
      const x = gridLeft + c * L.colW;
      d.line(x, bodyTop, x, bodyBottom, { rgb: PDF_RULE, lw: 0.12 });
    }

  const labSize = pdfSize(L.dense ? L.fs * 1.02 : L.fs * 0.72);
  const wordSize = pdfSize(L.fs);

  for (let r = 0; r < L.rows; r++){
    const gr = rowStart + r;
    const top = bodyTop + r * L.rowH;
    const base = pdfBase(top, L.rowH, L.fs);

    if (L.rules && r !== 0 && gr % 8 === 0){
      const strong = gr % L.major === 0;
      d.line(L.M, top, L.W - L.M, top,
             { rgb: strong ? PDF_RULE_STRONG : PDF_RULE, lw: strong ? 0.2 : 0.12 });
    }

    if (!L.dense || gr % 8 === 0){
      const lab = String(gr);
      const oct = gr % 8 === 0;
      const grey = oct ? [0.247, 0.278, 0.302] : [0.545, 0.576, 0.604];
      d.text(gridLeft - 1, pdfBase(top, L.rowH, L.fs * 0.72), lab,
             { size: labSize, font: oct ? "courB" : "cour", align: "r", rgb: grey });
      d.text(gridRight + 1, pdfBase(top, L.rowH, L.fs * 0.72), lab,
             { size: labSize, font: oct ? "courB" : "cour", rgb: grey });
    }

    for (let c = 0; c < L.cols; c++){
      const gc = colStart + c;
      const word = WORDS[gc * L.TR + gr];
      const x = gridLeft + c * L.colW;
      const head = word.slice(0, 4), tail = word.slice(4);
      const plain = !$("prefix").checked;
      d.text(x, base, head, { size: wordSize, font: "helv", rgb: PDF_INK });
      if (tail)
        d.text(x + d.width(head, wordSize, "helv"), base, tail,
               { size: wordSize, font: "helv", rgb: plain ? PDF_INK : PDF_GHOST });
    }
  }

  /* colophon */
  const fy = L.H - L.M - L.footH;
  d.line(L.M, fy, L.W - L.M, fy, { rgb: PDF_INK, lw: 0.3 });
  const fsz = pdfSize(L.fs * (L.tight ? 0.72 : 0.68));
  const fb = fy + L.footH * 0.2 + L.fs * 0.6;
  d.text(L.M, fb, "FIRST FOUR LETTERS ARE UNIQUE",
         { size: fsz, font: "courB", rgb: PDF_INK, tracking: 0.14 });
  d.text(L.W / 2, fb, "sha256 " + SHA_SHORT,
         { size: fsz, font: "cour", align: "c", rgb: PDF_SUB, tracking: 0.03 });
  d.text(L.W - L.M, fb, "bitcoin/bips · bip-0039 · english.txt",
         { size: fsz, font: "cour", align: "r", rgb: PDF_SUB, tracking: 0.03 });
}

function posterPDF(){
  const d = PDF.doc({ w: L.W, h: L.H });
  for (let s = 0; s < L.sheets; s++){
    if (s) d.page();
    pdfSheet(d, s);
  }
  const name = "bip39-" + L.paper.toLowerCase() + "-" + (L.land ? "landscape" : "portrait") +
               "-" + L.cols + "x" + L.rows + ".pdf";
  PDF.save(d.blob(), name);
}

/* ── layout solver, millimetres throughout ──────────────────────── */
function fit(paper, land, TC, TR, cols, rows){
  const [pw, ph] = PAPER[paper];
  const W = land ? ph : pw, H = land ? pw : ph;

  const colSheets = TC / cols, rowSheets = TR / rows;
  const sheets = colSheets * rowSheets, solo = sheets === 1;

  // Small paper gets tight chrome — every millimetre goes to the words.
  const tight = Math.min(W, H) <= 230;
  const M = tight ? 8 : Math.max(9, Math.round(W * 0.05));
  const headH = Math.round(H * (tight ? 0.058 : (solo ? 0.095 : 0.075)));
  const footH = Math.round(H * (tight ? 0.019 : 0.026));

  const CW = W - 2 * M;
  const gridH = H - 2 * M - headH - footH;
  const axisRatio = tight ? 2.0 : 2.3;
  const rowH = gridH / (rows + axisRatio);

  const digits = TR > 100 ? 3 : 2;
  const gutK = digits * 0.78 + 1.15;

  // Vertical bound: the row box. Horizontal bound: solving
  //   fs·NEED + PAD ≤ colW(fs) = (CW − 2·fs·gutK) / cols
  // for fs, since the gutters that carry the row labels scale with the type.
  const fsRow = rowH * 0.86;
  const fsCol = (CW - cols * PAD) / (cols * NEED + 2 * gutK);
  const fs = Math.min(fsRow, fsCol);

  const gut = fs * gutK;
  const colW = (CW - 2 * gut) / cols;
  const dense = rowH < 2.4;

  return { paper, land, W, H, M, CW, TC, TR, cols, rows, colSheets, rowSheets,
           sheets, solo, tight, dense, headH, footH, gridH, rowH,
           axisH: rowH * axisRatio, fs, gut, colW,
           colBits: log2(TC), rowBits: log2(TR),
           major: TR >= 128 ? 64 : 32, vsep: TC >= 32 ? 8 : 4 };
}

function computeLayout(){
  const paper = $("paper").value, land = $("orient").value === "l";
  const v = $("split").value;
  if (v === "auto"){
    const a = fit(paper, land, 16, 128, 16, 128);
    const b = fit(paper, land, 32, 64, 32, 64);
    return b.fs > a.fs ? b : a;
  }
  const [g, s] = v.split(":");
  const [TC, TR] = g.split("x").map(Number);
  const [cols, rows] = s.split("x").map(Number);
  return fit(paper, land, TC, TR, cols, rows);
}

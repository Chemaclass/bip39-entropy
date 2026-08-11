/* ── decoder legend ─────────────────────────────────────────────── */
function decoder(idx, compact){
  const col = Math.floor(idx / L.TR), row = idx % L.TR;
  const box = document.createElement("div");
  box.className = "decoder";
  box.style.padding = (L.fs * 0.9) + "mm " + (L.fs * 1.1) + "mm";
  box.style.gap = (L.fs * 0.62) + "mm";

  const lab = document.createElement("div");
  lab.className = "dec-label";
  lab.style.fontSize = (L.fs * 0.6) + "mm";
  lab.textContent = "how to read a word";

  const bits = document.createElement("div");
  bits.className = "bits";
  bits.style.gap = (L.fs * 0.16) + "mm";
  const mk = (b, lead) => {
    const s = document.createElement("span");
    s.className = "bit" + (b === "1" ? " on" : "");
    s.style.width = (L.fs * 1.05) + "mm";
    s.style.height = (L.fs * 1.25) + "mm";
    s.style.fontSize = (L.fs * 0.66) + "mm";
    if (lead) s.style.marginLeft = (L.fs * 0.85) + "mm";
    s.textContent = b;
    return s;
  };
  bin(col, L.colBits).split("").forEach(b => bits.appendChild(mk(b, false)));
  bin(row, L.rowBits).split("").forEach((b, k) => bits.appendChild(mk(b, k === 0)));

  const math = document.createElement("div");
  math.className = "dec-math";
  math.style.fontSize = (L.fs * 0.7) + "mm";
  math.innerHTML = "column <b>" + (col * L.TR) + "</b> + row <b>" + row +
                   "</b> = <b>" + idx + "</b>";

  box.append(lab, bits, math);
  if (!compact){
    const word = document.createElement("div");
    word.className = "dec-word";
    word.style.fontSize = (L.fs * 1.85) + "mm";
    word.textContent = WORDS[idx];
    box.appendChild(word);
  }
  return box;
}

/* ── masthead ───────────────────────────────────────────────────── */
function masthead(s, colStart, rowStart){
  const h = document.createElement("header");
  h.className = "masthead";
  h.style.height = L.headH + "mm";
  h.style.paddingBottom = (L.headH * 0.14) + "mm";

  const left = document.createElement("div");
  left.className = "mh-l";

  const eb = document.createElement("div");
  eb.className = "eyebrow";
  eb.style.fontSize = (L.fs * (L.tight ? 0.78 : 0.72)) + "mm";
  eb.style.marginBottom = (L.fs * 0.45) + "mm";
  eb.textContent = "BIP-39 · English · 2048 words";

  const t = document.createElement("div");
  t.className = "title";
  t.style.fontSize = (L.headH * (L.tight ? 0.27 : (L.solo ? 0.26 : 0.30))) + "mm";
  t.innerHTML = L.tight
    ? "The Eleven-Bit Address <em>Space</em>"
    : "The Eleven-Bit<br>Address <em>Space</em>";
  left.append(eb, t);

  if (L.headH >= 15){
    const sub = document.createElement("p");
    sub.className = "subtitle";
    sub.style.fontSize = (L.fs * (L.tight ? 0.95 : 0.86)) + "mm";
    sub.style.margin = (L.fs * 0.6) + "mm 0 0";
    sub.style.maxWidth = (L.CW * 0.52) + "mm";
    sub.textContent = "The high " + L.colBits + " bits pick a column, the low " +
      L.rowBits + " pick a row, so every word's index is its coordinate on this sheet. " +
      "The first four letters, set in black, are unique across all 2048; the grey tail is redundant.";
    left.appendChild(sub);
  }

  const right = document.createElement("div");
  right.className = "mh-r";
  right.appendChild(decoder(837, L.tight || !L.solo));

  if (L.sheets > 1){
    const tag = document.createElement("div");
    tag.className = "dec-label";
    tag.style.fontSize = (L.fs * 0.64) + "mm";
    const lo = colStart * L.TR + rowStart;
    const hi = (colStart + L.cols - 1) * L.TR + rowStart + L.rows - 1;
    tag.textContent = "sheet " + (s + 1) + " / " + L.sheets + " · " + lo + "–" + hi;
    right.appendChild(tag);
  }

  h.append(left, right);
  return h;
}

/* ── one sheet ──────────────────────────────────────────────────── */
function buildSheet(s, scale){
  const colStart = (s % L.colSheets) * L.cols;
  const rowStart = Math.floor(s / L.colSheets) * L.rows;

  const wrap = document.createElement("div");
  wrap.className = "sheetwrap";
  wrap.style.width = (L.W * MM * scale) + "px";
  wrap.style.height = (L.H * MM * scale) + "px";

  const sheet = document.createElement("section");
  sheet.className = "sheet";
  sheet.style.width = L.W + "mm";
  sheet.style.height = L.H + "mm";
  sheet.style.padding = L.M + "mm";
  sheet.style.transform = "scale(" + scale + ")";
  sheet.appendChild(masthead(s, colStart, rowStart));

  const g = document.createElement("div");
  g.className = "grid";
  g.style.gridTemplateColumns = L.gut + "mm repeat(" + L.cols + "," + L.colW + "mm) " + L.gut + "mm";
  g.style.gridTemplateRows = L.axisH + "mm repeat(" + L.rows + "," + L.rowH + "mm)";

  const blank = () => { const d = document.createElement("div"); d.className = "cell axis"; return d; };

  g.appendChild(blank());
  for (let c = 0; c < L.cols; c++){
    const gc = colStart + c;
    const d = document.createElement("div");
    d.className = "cell axis" + (c % L.vsep === 0 ? " vsep" : "");
    d.innerHTML =
      '<div><div class="nib" style="font-size:' + (L.fs * 0.6) + 'mm">' + bin(gc, L.colBits) + '</div>' +
      '<div class="base" style="font-size:' + (L.fs * 1.0) + 'mm">' + (gc * L.TR) + '</div></div>';
    g.appendChild(d);
  }
  g.appendChild(blank());

  const labSize = (L.dense ? L.fs * 1.02 : L.fs * 0.72) + "mm";

  for (let r = 0; r < L.rows; r++){
    const gr = rowStart + r;
    const oct = gr % 8 === 0;
    let rule = "";
    if (L.rules && oct && r !== 0) rule = " rule8";
    if (L.rules && gr % L.major === 0 && r !== 0) rule = " rule64";

    const lab = document.createElement("div");
    lab.className = "cell rl" + rule + (oct ? " oct" : "");
    lab.style.fontSize = labSize;
    lab.textContent = (!L.dense || oct) ? String(gr) : "";
    g.appendChild(lab);

    for (let c = 0; c < L.cols; c++){
      const gc = colStart + c;
      const idx = gc * L.TR + gr;
      const word = WORDS[idx];
      const d = document.createElement("div");
      d.className = "cell w" + rule + (c % L.vsep === 0 ? " vsep" : "");
      d.dataset.i = idx;
      d.style.fontSize = L.fs + "mm";
      d.innerHTML = "<b>" + word.slice(0, 4) + "</b>" + word.slice(4);
      g.appendChild(d);
    }

    const labR = lab.cloneNode(true);
    labR.style.justifyContent = "flex-start";
    g.appendChild(labR);
  }
  sheet.appendChild(g);

  const f = document.createElement("footer");
  f.className = "colophon";
  f.style.height = L.footH + "mm";
  f.style.fontSize = (L.fs * (L.tight ? 0.72 : 0.68)) + "mm";
  f.style.paddingTop = (L.footH * 0.2) + "mm";
  f.innerHTML =
    '<span class="lead">First four letters are unique</span>' +
    '<span>sha256 ' + SHA_SHORT + '</span>' +
    '<span>bitcoin/bips · bip-0039 · english.txt</span>';
  sheet.appendChild(f);

  wrap.appendChild(sheet);
  return wrap;
}

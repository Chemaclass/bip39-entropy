/* ── PDF writer ─────────────────────────────────────────────────── */
// A minimal PDF 1.4 producer. Only the base-14 fonts are used, so nothing has
// to be embedded and nothing is fetched: the page keeps working offline from a
// file:// URL. Streams are left uncompressed — the output stays auditable in a
// text editor, which matters more here than file size.
const PDF = (() => {
  const K = 72 / 25.4;      // millimetres -> PostScript points

  /* Adobe AFM advance widths, 1/1000 em, ASCII 32..126 in order. Codes 39 and
     96 are quotesingle and grave, not StandardEncoding's quoteright and
     quoteleft — the fonts below are declared /WinAnsiEncoding. */
  const HELV = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
  ];
  const HELVB = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
  ];
  const MONO = Array(95).fill(600);   // Courier is 600 in both weights, every glyph

  // WinAnsi punctuation above 126 that the poster's labels use.
  const EX = { 0x85: 1000, 0x91: 222, 0x92: 222, 0x93: 333, 0x94: 333,
               0x95: 350, 0x96: 556, 0x97: 1000, 0xB7: 278, 0xD7: 584 };
  const EXB = { 0x85: 1000, 0x91: 278, 0x92: 278, 0x93: 500, 0x94: 500,
                0x95: 350, 0x96: 556, 0x97: 1000, 0xB7: 333, 0xD7: 584 };

  const FONTS = {
    helv:  { n: "Helvetica",       w: HELV,  x: EX,  d: 500 },
    helvB: { n: "Helvetica-Bold",  w: HELVB, x: EXB, d: 556 },
    cour:  { n: "Courier",         w: MONO,  x: {},  d: 600 },
    courB: { n: "Courier-Bold",    w: MONO,  x: {},  d: 600 }
  };
  const KEYS = Object.keys(FONTS);

  // The fonts are declared /WinAnsiEncoding, so Latin-1 maps to itself and the
  // few smart-punctuation code points the poster uses have a byte each.
  const WIN = { "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94,
                "•": 0x95, "–": 0x96, "—": 0x97, "…": 0x85 };
  const byteOf = ch => {
    const c = ch.codePointAt(0);
    if (c < 128 || (c >= 0xA0 && c <= 0xFF)) return c;
    return WIN[ch] || 63;              // 63 = '?', the fallback for anything else
  };

  const num = v => String(Math.round(v * 1000) / 1000);

  const esc = str => {
    let out = "";
    for (const ch of str){
      const b = byteOf(ch);
      if (b < 32 || b > 126) out += "\\" + b.toString(8).padStart(3, "0");
      else out += (b === 40 || b === 41 || b === 92 ? "\\" : "") + String.fromCharCode(b);
    }
    return out;
  };

  const advance = (str, size, font) => {          // -> points
    const f = FONTS[font] || FONTS.helv;
    let u = 0;
    for (const ch of str){
      const b = byteOf(ch);
      u += (b >= 32 && b <= 126) ? f.w[b - 32] : (f.x[b] || f.d);
    }
    return u * size / 1000;
  };

  const col = (v, up) => Array.isArray(v)
    ? v.map(num).join(" ") + " " + (up ? "RG" : "rg")
    : num(v) + " " + (up ? "G" : "g");

  const ink = o => o.rgb !== undefined ? o.rgb : (o.gray !== undefined ? o.gray : 0);

  /* ── document ─────────────────────────────────────────────────── */
  const doc = ({ w, h }) => {
    const pages = [];
    let cur = null;

    const X = v => num(v * K);
    const Y = v => num((h - v) * K);      // y arrives measured from the top edge

    const d = {};

    d.page = () => { cur = []; pages.push(cur); return d; };

    d.text = (x, y, str, o = {}) => {
      const size = o.size || 10, f = FONTS[o.font] ? o.font : "helv";
      const tc = (o.tracking || 0) * size;
      // Tc opens a gap after every glyph including the last; that trailing gap
      // carries no ink, so alignment measures the string without it.
      const wpt = advance(str, size, f) + tc * Math.max(0, [...str].length - 1);
      const ax = x * K - (o.align === "c" ? wpt / 2 : o.align === "r" ? wpt : 0);
      cur.push("BT " + col(ink(o), false) + " /" + f + " " + num(size) + " Tf " +
               num(tc) + " Tc 1 0 0 1 " + num(ax) + " " + Y(y) +
               " Tm (" + esc(str) + ") Tj ET");
      return d;
    };

    d.rect = (x, y, ww, hh, o = {}) => {
      const ops = [];
      if (o.fill !== undefined) ops.push(col(o.fill, false));
      if (o.stroke !== undefined)
        ops.push(col(o.stroke, true), num((o.lw === undefined ? 0.2 : o.lw) * K) + " w");
      ops.push(X(x) + " " + Y(y + hh) + " " + num(ww * K) + " " + num(hh * K) + " re");
      ops.push(o.fill !== undefined ? (o.stroke !== undefined ? "B" : "f") : "S");
      cur.push(ops.join(" "));
      return d;
    };

    d.line = (x1, y1, x2, y2, o = {}) => {
      cur.push(col(ink(o), true) + " " +
               num((o.lw === undefined ? 0.2 : o.lw) * K) + " w " +
               X(x1) + " " + Y(y1) + " m " + X(x2) + " " + Y(y2) + " l S");
      return d;
    };

    d.width = (str, size, font) => advance(str, size, font) / K;

    /* Objects: 1 catalog, 2 page tree, 3..6 fonts, then a dict and a content
       stream per page. Offsets are read off the assembled string, never
       predicted — a stale xref is the one error no viewer forgives. */
    const bytes = () => {
      const first = 3 + KEYS.length;
      const res = "<< /Font << " +
        KEYS.map((k, i) => "/" + k + " " + (3 + i) + " 0 R").join(" ") + " >> >>";
      const objs = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Count " + pages.length + " /Kids [" +
          pages.map((_, i) => (first + i * 2) + " 0 R").join(" ") + "] >>"
      ];
      KEYS.forEach(k => objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /" +
        FONTS[k].n + " /Encoding /WinAnsiEncoding >>"));
      pages.forEach((ops, i) => {
        const s = ops.join("\n");
        objs.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
          num(w * K) + " " + num(h * K) + "] /Resources " + res +
          " /Contents " + (first + i * 2 + 1) + " 0 R >>");
        objs.push("<< /Length " + s.length + " >>\nstream\n" + s + "\nendstream");
      });

      let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
      const off = [];
      objs.forEach((o, i) => {
        off.push(out.length);
        out += (i + 1) + " 0 obj\n" + o + "\nendobj\n";
      });
      const xref = out.length;
      out += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" +
             off.map(p => String(p).padStart(10, "0") + " 00000 n \n").join("") +
             "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\n" +
             "startxref\n" + xref + "\n%%EOF\n";

      // Latin-1 out, byte for byte: a UTF-8 encode of the whole string would
      // widen the binary marker and every octal escape, and shift every offset.
      const buf = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) buf[i] = out.charCodeAt(i) & 0xff;
      return buf;
    };

    d.blob = () => new Blob([bytes()], { type: "application/pdf" });

    return d.page();
  };

  const save = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    // Safari reads the URL after the click returns, so it outlives the handler.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return { doc, save };
})();

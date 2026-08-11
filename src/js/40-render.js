/* ── render ─────────────────────────────────────────────────────── */
function render(){
  L = computeLayout();
  L.rules = $("rules").checked;

  const root = document.documentElement.style;
  root.setProperty("--face", FACES[$("face").value]);
  root.setProperty("--hair", L.dense ? "0.12mm" : "0.2mm");
  root.setProperty("--ghost", L.dense ? "#7d858d" : "#a4aab3");
  document.body.classList.toggle("plain", !$("prefix").checked);

  const avail = Math.min(stage.clientWidth || window.innerWidth, 1500) - 32;
  const scale = Math.max(0.05, Math.min(1, avail / (L.W * MM)));
  L.scale = scale;

  $("pagestyle").textContent = "@page { size: " + L.W + "mm " + L.H + "mm; margin: 0; }";

  stage.replaceChildren();
  const frag = document.createDocumentFragment();
  for (let s = 0; s < L.sheets; s++) frag.appendChild(buildSheet(s, scale));
  stage.appendChild(frag);

  writeReadout();
  applyFind();
}

function writeReadout(){
  const pt = L.fs * PT;
  const r = $("readout");
  r.replaceChildren();
  const spec = document.createElement("span");
  spec.className = "spec";
  spec.textContent = L.paper + " " + (L.land ? "landscape" : "portrait") + " · " +
    L.cols + " × " + L.rows + " · " +
    (L.sheets === 1 ? "one sheet" : L.sheets + " sheets") + " · " +
    L.colBits + "+" + L.rowBits + " bit split";
  const size = document.createElement("span");
  size.className = "pt" + (pt < 4.6 ? " small" : "");
  size.textContent = "word type " + pt.toFixed(1) + " pt";
  const tip = document.createElement("span");
  tip.textContent = pt < 4.6
    ? "Small. Try landscape, or A3, or split across sheets."
    : "Print at 100 % scale with background graphics on.";
  const prev = document.createElement("span");
  if (L.scale < 0.995)
    prev.textContent = "preview at " + Math.round(L.scale * 100) + " % — prints full size";
  const warn = document.createElement("span");
  warn.textContent = "Public standard list — never mark your own recovery words on it.";
  r.append(spec, size, prev, tip, warn);
}

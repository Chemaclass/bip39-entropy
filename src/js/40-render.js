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
  spec.textContent = L.paper + " " + t(L.land ? "readout.landscape" : "readout.portrait") +
    " · " + L.cols + " × " + L.rows + " · " +
    (L.sheets === 1 ? t("readout.oneSheet") : t("readout.sheets", { n: L.sheets })) + " · " +
    t("readout.split", { a: L.colBits, b: L.rowBits });
  const size = document.createElement("span");
  size.className = "pt" + (pt < 4.6 ? " small" : "");
  size.textContent = t("readout.type", { pt: pt.toFixed(1) });
  const tip = document.createElement("span");
  tip.textContent = t(pt < 4.6 ? "readout.small" : "readout.printTip");
  const prev = document.createElement("span");
  if (L.scale < 0.995)
    prev.textContent = t("readout.preview", { pct: Math.round(L.scale * 100) });
  const warn = document.createElement("span");
  warn.textContent = t("readout.warn");
  r.append(spec, size, prev, tip, warn);
}

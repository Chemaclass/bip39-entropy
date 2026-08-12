/* ── roll your own entropy ──────────────────────────────────────── */
// Throws are kept raw, never as accumulated bits, so Undo can take back the
// physical event rather than a derived one — a rejected 5 costs a keypress and
// no entropy, and the display has to be able to say so.
const ROLL = { method:"dice", strength:12, throws:[] };

const rollReady = () => typeof SEED !== "undefined";

const rollSpec = () => SEED.STRENGTHS.find(s => s.words === ROLL.strength);

function rollBits(){
  if (ROLL.method === "coin") return { bits: SEED.coinBits(ROLL.throws), rejected: 0 };
  const d = SEED.diceBits(ROLL.throws);
  return { bits: d.bits, rejected: d.rejected };
}

function rollPad(){
  const pad = $("rollpad");
  pad.replaceChildren();
  const reroll = t("roll.keyReroll");
  const keys = ROLL.method === "coin"
    ? [["H", "1", false], ["T", "0", false]]
    : [["1", "00", false], ["2", "01", false], ["3", "10", false],
       ["4", "11", false], ["5", reroll, true], ["6", reroll, true]];

  for (const [face, sub, rej] of keys){
    const b = document.createElement("button");
    b.className = "roll-key" + (rej ? " rej" : "");
    b.type = "button";
    b.innerHTML = face + "<span>" + sub + "</span>";
    b.addEventListener("click", () => rollPush(face));
    pad.appendChild(b);
  }

  $("rollhint").textContent = t(ROLL.method === "coin" ? "roll.hintCoin" : "roll.hintDice");
}

// Two sentences carry inline markup. They are assembled from parts rather than
// injected as HTML, so a translation file stays plain text and cannot smuggle tags.
function rollText(){
  const link = document.createElement("a");
  link.href = "#" + LANG + "/learn";
  link.textContent = t("roll.leadLinkText");
  const lead = t("roll.leadLink").split("{link}");
  $("rollleadlink").replaceChildren(lead[0] || "", link, lead[1] || "");

  const em = document.createElement("em");
  em.textContent = t("roll.warnEm");
  const warn = t("roll.warn").split("{em}");
  $("rollwarntext").replaceChildren(warn[0] || "", em, warn[1] || "");
}

function rollPush(face){
  const v = ROLL.method === "coin"
    ? (face === "H" ? 1 : 0)
    : Number(face);
  const { bits } = rollBits();
  if (bits.length >= rollSpec().entBits) return;   // already full
  ROLL.throws.push(v);
  rollRender();
}

function rollRender(){
  if (!rollReady()) return;
  const spec = rollSpec();
  const { bits, rejected } = rollBits();
  const have = Math.min(bits.length, spec.entBits);
  const full = have >= spec.entBits;
  const entBits = bits.slice(0, spec.entBits);

  $("rollfill").style.width = (100 * have / spec.entBits) + "%";
  $("rollcount").textContent =
    t("roll.count", { have, need: spec.entBits, throws: ROLL.throws.length,
                      unit: t(ROLL.method === "coin" ? "roll.flips" : "roll.throws") }) +
    (rejected ? t("roll.rerolled", { n: rejected }) : "");

  const cs = full ? SEED.checksumBits(SEED.bitsToBytes(entBits)) : "";
  const all = entBits + cs;
  const bytes = $("rollbits");
  bytes.replaceChildren();
  for (let i = 0; i < all.length; i += 8){
    const s = document.createElement("span");
    s.className = "byte" + (i >= spec.entBits ? " cs" : "");
    s.textContent = all.slice(i, i + 8);
    bytes.appendChild(s);
  }

  const out = $("rollout");
  out.replaceChildren();
  if (!full) return;

  const entropy = SEED.bitsToBytes(entBits);
  const words = SEED.entropyToWords(entropy);
  const hex = [...entropy].map(b => b.toString(16).padStart(2, "0")).join("");

  const add = (cls, html) => {
    const d = document.createElement("div");
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
    return d;
  };

  add("roll-sec", t("roll.entropyLabel", { n: spec.entBits }));
  add("roll-fact", "<b>" + hex + "</b>");
  add("roll-sec", t("roll.checksumLabel", { n: spec.csBits }));
  add("roll-fact", "<b>" + cs + "</b>");
  add("roll-sec", t("roll.wordsLabel", { n: spec.words,
                                         total: spec.entBits + spec.csBits }));

  const grid = document.createElement("div");
  grid.className = "seed";
  words.forEach((w, i) => {
    const chunk = all.slice(i * 11, i * 11 + 11);
    const cell = document.createElement("div");
    cell.className = "seed-w";
    cell.innerHTML = '<span class="seed-n">' + (i + 1) + '</span>' +
      '<span class="seed-t">' + w + '</span>' +
      '<span class="seed-b">' + chunk + " · " + parseInt(chunk, 2) + '</span>';
    grid.appendChild(cell);
  });
  out.appendChild(grid);

  add("roll-fact", t("roll.footnote"));
}

function rollReset(){
  ROLL.throws = [];
  rollRender();
}

function rollInit(){
  if (!rollReady()){
    $("view-roll").querySelector(".roll-warn").textContent = t("roll.disabled");
    return;
  }
  $("strength").addEventListener("change", () => {
    ROLL.strength = Number($("strength").value);
    rollReset();
  });
  $("method").addEventListener("change", () => {
    ROLL.method = $("method").value;
    rollReset();
    rollPad();
  });
  $("rollundo").addEventListener("click", () => { ROLL.throws.pop(); rollRender(); });
  $("rollclear").addEventListener("click", rollReset);
  if (typeof worksheetPDF === "function")
    $("rollsheet").addEventListener("click", worksheetPDF);
  else $("rollsheet").hidden = true;

  document.addEventListener("keydown", e => {
    if ($("view-roll").hidden) return;
    if (e.target.matches("input,select,textarea")) return;
    const k = e.key.toLowerCase();
    if (k === "backspace"){ e.preventDefault(); ROLL.throws.pop(); rollRender(); return; }
    if (ROLL.method === "coin"){
      if (k === "h" || k === "1") rollPush("H");
      if (k === "t" || k === "0") rollPush("T");
    } else if (/^[1-6]$/.test(k)){
      rollPush(k);
    }
  });

  rollText();
  rollPad();
  rollRender();
}

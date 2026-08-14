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

// Pip layouts on a three-by-three grid, and a disc for a coin. A die you can
// see beats a digit that names one, and the face is the thing on the table.
const PIPS = {
  "1": [[15, 15]],
  "2": [[9, 9], [21, 21]],
  "3": [[9, 9], [15, 15], [21, 21]],
  "4": [[9, 9], [21, 9], [9, 21], [21, 21]],
  "5": [[9, 9], [21, 9], [15, 15], [9, 21], [21, 21]],
  "6": [[9, 9], [21, 9], [9, 15], [21, 15], [9, 21], [21, 21]],
};

function faceSvg(face){
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 30 30");
  svg.setAttribute("class", "roll-face");
  svg.setAttribute("aria-hidden", "true");
  const add = (tag, attrs) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.appendChild(el);
  };
  if (face === "H" || face === "T"){
    add("circle", { cx: 15, cy: 15, r: 10, class: "roll-coin" });
    // Heads takes the filled disc, tails the ring. One is the other's absence,
    // which is what one bit is.
    if (face === "H") add("circle", { cx: 15, cy: 15, r: 4.5, class: "roll-pip" });
    return svg;
  }
  add("rect", { x: 2, y: 2, width: 26, height: 26, rx: 5, class: "roll-die" });
  for (const [cx, cy] of PIPS[face]) add("circle", { cx, cy, r: 2.4, class: "roll-pip" });
  return svg;
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
    // The face is a drawing now, so the name has to be said out loud somewhere.
    b.setAttribute("aria-label", t("roll.face." + face) + ", " + sub);
    const s = document.createElement("span");
    s.textContent = sub;
    b.append(faceSvg(face), s);
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

// Typing in a worksheet. The field accepts throws (1 to 6) or bits (0 and 1),
// and nothing else: letters are refused, so a recovery phrase cannot be pasted
// here even by accident. Returns null when the text is not one of the two.
function rollParseInput(text){
  const s = text.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
  if (!s) return null;
  if (/[^0-6HT]/.test(s)) return null;

  if (/[HT]/.test(s)){
    if (/[2-6]/.test(s)) return null;                 // heads or tails, not dice
    return { method: "coin", throws: [...s].map(c => (c === "H" || c === "1" ? 1 : 0)) };
  }
  if (/[2-6]/.test(s)){
    if (s.includes("0")) return null;                 // a die has no zero face
    return { method: "dice", throws: [...s].map(Number) };
  }
  if (s.includes("0")) return { method: "coin", throws: [...s].map(Number) };
  // Only ones: valid as bits and as dice faces alike, so the selected source
  // decides rather than the input silently switching it.
  return { method: ROLL.method, throws: [...s].map(Number) };
}

function rollLoad(){
  const parsed = rollParseInput($("rollload").value);
  const err = $("rollerr");
  if (!parsed){
    err.textContent = t("roll.loadBad");
    err.hidden = false;
    return;
  }

  ROLL.method = parsed.method;
  $("method").value = parsed.method;
  ROLL.throws = parsed.throws;
  rollPad();
  rollRender();

  const spec = rollSpec();
  const over = rollBits().bits.length > spec.entBits;
  const unit = t(parsed.method === "coin" ? "roll.flips" : "roll.throws");
  err.textContent = over
    ? t("roll.loadLong", { need: spec.entBits })
    : t("roll.loadDone", { n: parsed.throws.length, unit });
  err.hidden = false;
  err.classList.toggle("bad", over);
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
  // A full phrase takes no more throws, and a key that does nothing should
  // look like it. Undo and Clear stay live: they are how you leave this state.
  $("rollpad").querySelectorAll(".roll-key").forEach(b => { b.disabled = full; });
  // The meter says how far; this says how much longer. A coin is one bit per
  // flip. A die is two bits per accepted throw, and a third of throws reject,
  // so each accepted pair costs one and a half throws on average.
  const left = spec.entBits - have;
  const togo = ROLL.method === "coin"
    ? t("roll.togoCoin", { n: left })
    : t("roll.togoDice", { n: Math.round(Math.ceil(left / 2) * 1.5) });
  $("rollcount").textContent =
    t("roll.count", { have, need: spec.entBits, throws: ROLL.throws.length,
                      unit: t(ROLL.method === "coin" ? "roll.flips" : "roll.throws") }) +
    (rejected ? t("roll.rerolled", { n: rejected }) : "") +
    (full ? "" : togo);

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

  // Each cell's chunk and the poster's coordinates are the same number. Said
  // here, where the words land, with the link doing the pointing. Assembled
  // from parts like the lead, so the translation stays plain text.
  const readoff = add("roll-fact", "");
  const plink = document.createElement("a");
  plink.href = "#" + LANG + "/poster";
  plink.textContent = t("roll.readOffLinkText");
  const roParts = t("roll.readOff").split("{link}");
  readoff.replaceChildren(roParts[0] || "", plink, roParts[1] || "");

  // How far from even the throws landed. Any single result is as likely as any
  // other, so this says nothing about the phrase. It says something about the
  // coin, and about whether the hand got bored.
  const ones = [...entBits].filter(c => c === "1").length;
  const zeros = entBits.length - ones;
  const sd = Math.sqrt(entBits.length) / 2;
  add("roll-sec", t("roll.balance", { ones, zeros }));
  if (Math.abs(ones - entBits.length / 2) > 2.5 * sd)
    add("roll-fact scale-warn", t("roll.balanceOdd"));

  // The last word of a twelve-word phrase carries seven entropy bits and four
  // checksum bits, so it is always inside a block of sixteen consecutive
  // indices. On the poster that is sixteen rows of one column, which is what
  // makes finishing by hand possible.
  if (spec.words === 12){
    const lo = parseInt(entBits.slice(121, 128), 2) * 16;
    add("roll-sec", t("roll.lastTitle"));
    add("roll-fact", t("roll.lastNote", { lo, hi: lo + 15 }));
    const strip = document.createElement("div");
    strip.className = "seed lastblock";
    for (let i = lo; i <= lo + 15; i++){
      const cell = document.createElement("div");
      cell.className = "seed-w" + (i === lo + parseInt(cs, 2) ? " is-yours" : "");
      cell.innerHTML = '<span class="seed-n">' + i + '</span>' +
        '<span class="seed-t">' + WORDS[i] + '</span>' +
        (i === lo + parseInt(cs, 2)
          ? '<span class="seed-b">' + t("roll.lastYours") + '</span>' : '');
      strip.appendChild(cell);
    }
    out.appendChild(strip);
  }

  add("roll-fact", t("roll.footnote"));
}

function rollReset(){
  ROLL.throws = [];
  $("rollload").value = "";
  $("rollerr").hidden = true;
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
  $("rollloadgo").addEventListener("click", rollLoad);
  $("rollload").addEventListener("keydown", e => { if (e.key === "Enter") rollLoad(); });
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

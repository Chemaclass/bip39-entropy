/* ── find ───────────────────────────────────────────────────────── */
function applyFind(){
  const q = $("find").value.trim().toLowerCase();
  document.querySelectorAll(".w.found,.w.pinned").forEach(e => e.classList.remove("found", "pinned"));
  $("readout").querySelectorAll(".hit").forEach(e => e.remove());
  if (!q) return;

  let hits = [];
  if (/^\d+$/.test(q) && +q >= 0 && +q <= 2047) hits = [+q];
  else WORDS.forEach((w, i) => { if (w.includes(q)) hits.push(i); });

  hits.forEach(i => {
    const el = document.querySelector('.w[data-i="' + i + '"]');
    if (el) el.classList.add("found");
  });
  if (hits.length === 1){
    const el = document.querySelector('.w[data-i="' + hits[0] + '"]');
    if (el){ el.classList.add("pinned"); el.scrollIntoView({ block:"center", behavior:"smooth" }); }
    updateDecoders(hits[0]);
  }
  const tag = document.createElement("span");
  tag.className = "hit";
  tag.textContent = hits.length + " match" + (hits.length === 1 ? "" : "es") +
    (hits.length === 1 ? " — index " + hits[0] + " · " + WORDS[hits[0]] : "");
  $("readout").appendChild(tag);
}

function updateDecoders(idx){
  const col = Math.floor(idx / L.TR), row = idx % L.TR;
  const b = bin(col, L.colBits) + bin(row, L.rowBits);
  document.querySelectorAll(".decoder").forEach(d => {
    d.querySelectorAll(".bit").forEach((c, k) => {
      c.textContent = b[k];
      c.classList.toggle("on", b[k] === "1");
    });
    d.querySelector(".dec-math").innerHTML =
      "column <b>" + (col * L.TR) + "</b> + row <b>" + row + "</b> = <b>" + idx + "</b>";
    const w = d.querySelector(".dec-word");
    if (w) w.textContent = WORDS[idx];
  });
}

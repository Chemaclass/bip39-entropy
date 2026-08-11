/* ── events ─────────────────────────────────────────────────────── */
["paper","orient","split","face","prefix","rules"].forEach(id => $(id).addEventListener("change", render));
$("find").addEventListener("input", applyFind);
$("print").addEventListener("click", () => window.print());

if (typeof posterPDF === "function") $("pdf").addEventListener("click", posterPDF);
else $("pdf").hidden = true;

stage.addEventListener("click", e => {
  const w = e.target.closest(".w");
  if (!w) return;
  document.querySelectorAll(".w.pinned").forEach(x => x.classList.remove("pinned"));
  w.classList.add("pinned");
  updateDecoders(+w.dataset.i);
});

let t;
window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(render, 140); });

navInit();
rollInit();

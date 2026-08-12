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

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(render, 140);
});

// The save link fetches index.html from the server it was served by. On a
// file:// URL the reader already has the file, and the relative href would
// point at a name that need not exist.
if (location.protocol === "file:") $("save").hidden = true;

langInit();
rollInit();
navInit();

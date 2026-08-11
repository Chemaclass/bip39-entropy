/* ── views ──────────────────────────────────────────────────────── */
const VIEWS = ["poster", "learn", "roll"];

function showView(name){
  if (!VIEWS.includes(name)) name = "poster";
  VIEWS.forEach(v => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll("#tabs a").forEach(a =>
    a.classList.toggle("on", a.dataset.view === name));
  $("bar").hidden = name !== "poster";
  // The stage measures itself, so it can only be laid out while it is visible.
  if (name === "poster") render();
}

function navInit(){
  addEventListener("hashchange", () => showView(location.hash.slice(1)));
  showView(location.hash.slice(1));
}

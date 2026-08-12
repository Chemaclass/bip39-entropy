/* ── views and routing ──────────────────────────────────────────── */
// The hash carries both: #<lang>/<view>, e.g. #es/learn. A bare #learn still
// works, so older links keep resolving.
const VIEWS = ["poster", "learn", "roll"];

function parseHash(){
  const parts = location.hash.slice(1).split("/").filter(Boolean);
  return langKnown(parts[0])
    ? { lang: parts[0], view: parts[1] }
    : { lang: null, view: parts[0] };
}

function showView(name){
  if (!VIEWS.includes(name)) name = "poster";
  VIEWS.forEach(v => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll("#tabs a").forEach(a =>
    a.classList.toggle("on", a.dataset.view === name));
  $("bar").hidden = name !== "poster";
  // The stage measures itself, so it can only be laid out while it is visible.
  if (name === "poster") render();
}

function route(){
  const { lang, view } = parseHash();
  LANG = pickLang(lang);
  $("lang").value = LANG;
  applyI18n();
  showPanes();
  // Keep the language in every tab link, so switching section does not drop it.
  document.querySelectorAll("#tabs a").forEach(a => {
    a.href = "#" + LANG + "/" + a.dataset.view;
  });
  $("brandlink").href = "#" + LANG + "/poster";
  if (rollReady()){ rollText(); rollPad(); rollRender(); }
  showView(VIEWS.includes(view) ? view : "poster");
}

function setLang(code){
  const { view } = parseHash();
  location.hash = "#" + code + "/" + (VIEWS.includes(view) ? view : "poster");
  if (LANG === code) route();     // hash unchanged, so no hashchange to wait for
}

function navInit(){
  addEventListener("hashchange", route);
  route();
}

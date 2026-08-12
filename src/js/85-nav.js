/* ── views and routing ──────────────────────────────────────────── */
// The hash carries both: #<lang>/<view>, e.g. #es/learn. A bare #learn still
// works, so older links keep resolving. The list of views is read off the tabs
// rather than repeated here: a new section is a tab plus its content files.
// Only tabs whose view actually exists count. A section is a tab plus its
// content files, and the tab is allowed to land first: it hides until the
// prose does, rather than routing to nothing.
const VIEWS = [...document.querySelectorAll("#tabs a")]
  .map(a => a.dataset.view)
  .filter(v => document.getElementById("view-" + v));

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

  // A hash that names neither a language nor a view may be an anchor inside a
  // section, like #en-learn-checksum from a table of contents. Follow it to the
  // view that contains it instead of treating it as an unknown view and
  // bouncing the reader to the poster.
  const anchor = view && !VIEWS.includes(view) ? document.getElementById(view) : null;
  const pane = anchor && anchor.closest(".pane");
  const host = anchor && anchor.closest(".view");

  LANG = pickLang(pane ? pane.dataset.lang : lang);
  $("lang").value = LANG;
  applyI18n();
  showPanes();
  // Keep the language in every tab link, so switching section does not drop it.
  document.querySelectorAll("#tabs a").forEach(a => {
    a.href = "#" + LANG + "/" + a.dataset.view;
  });
  $("brandlink").href = "#" + LANG + "/poster";
  if (rollReady()){ rollText(); rollPad(); rollRender(); }

  if (host){
    showView(host.id.slice("view-".length));
    anchor.scrollIntoView({ block: "start" });
    return;
  }
  showView(VIEWS.includes(view) ? view : "poster");
}

function setLang(code){
  const { view } = parseHash();
  location.hash = "#" + code + "/" + (VIEWS.includes(view) ? view : "poster");
  if (LANG === code) route();     // hash unchanged, so no hashchange to wait for
}

function navInit(){
  document.querySelectorAll("#tabs a").forEach(a => {
    a.hidden = !VIEWS.includes(a.dataset.view);
  });
  addEventListener("hashchange", route);
  route();
}

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

// The site is a guide with two tools attached, so an unaddressed visit opens
// the guide. The tools are one click away and keep their own links.
const HOME = VIEWS.includes("start") ? "start" : VIEWS[0];

function parseHash(){
  const parts = location.hash.slice(1).split("/").filter(Boolean);
  return langKnown(parts[0])
    ? { lang: parts[0], view: parts[1] }
    : { lang: null, view: parts[0] };
}

// A phone shows the tab track a few tabs at a time. Land on #roll there and the
// current tab is off to the right, which reads as no current tab at all.
function centreTab(){
  const track = $("tabs"), on = track.querySelector("a.on");
  if (!on || track.scrollWidth <= track.clientWidth) return;
  const off = on.getBoundingClientRect().left - track.getBoundingClientRect().left;
  track.scrollLeft += off - (track.clientWidth - on.offsetWidth) / 2;
}

function showView(name, keepScroll){
  if (!VIEWS.includes(name)) name = HOME;
  VIEWS.forEach(v => { $("view-" + v).hidden = v !== name; });
  document.querySelectorAll("#tabs a").forEach(a => {
    const here = a.dataset.view === name;
    a.classList.toggle("on", here);
    // A colour is not an announcement. Screen readers get the same "you are
    // here" the pill gives everyone else.
    if (here) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  centreTab();
  // The stylesheet reads the current view off the body: the reading-progress
  // bar hides on the poster, which is an artefact rather than a read.
  document.body.dataset.view = name;
  $("bar").hidden = name !== "poster";
  // The stage measures itself, so it can only be laid out while it is visible.
  if (name === "poster") render();
  // Arriving halfway down a section you have never seen reads as a broken
  // page. "instant" holds while html{scroll-behavior:smooth} animates anchors:
  // a tab switch is a place change, not a journey.
  if (!keepScroll) scrollTo({ top: 0, behavior: "instant" });
  readingInit(name);
}

function route(){
  const { lang, view } = parseHash();

  // A hash that names neither a language nor a view may be an anchor inside a
  // section: #en-learn-checksum from a table of contents, or the same target
  // written as #en/learn-checksum from another section's prose. Follow it to
  // the view that contains it instead of treating it as an unknown view and
  // bouncing the reader to the poster.
  const anchor = view && !VIEWS.includes(view)
    ? document.getElementById(view) ||
      (lang ? document.getElementById(lang + "-" + view) : null)
    : null;
  const pane = anchor && anchor.closest(".pane");
  const host = anchor && anchor.closest(".view");

  // A bare #learn carries no language. On the first route the browser picks;
  // after that the reader's current language holds, so a prose link written as
  // #poster cannot silently drop an es reader back into en.
  LANG = pickLang(pane ? pane.dataset.lang : lang || (route.done ? LANG : null));
  route.done = true;
  $("lang").value = LANG;
  applyI18n();
  showPanes();
  // Keep the language in every tab link, so switching section does not drop it.
  document.querySelectorAll("#tabs a").forEach(a => {
    a.href = "#" + LANG + "/" + a.dataset.view;
  });
  $("brandlink").href = "#" + LANG + "/" + HOME;
  // Only the language reaches into the roller's text; its state does not
  // change with the hash. Without the guard, every anchor click rebuilt a
  // rendered phrase's DOM for nothing.
  if (rollReady() && route.lang !== LANG){
    rollText(); rollPad(); rollRender();
    route.lang = LANG;
  }

  if (host){
    showView(host.id.slice("view-".length), true);
    anchor.scrollIntoView({ block: "start" });
    return;
  }
  showView(VIEWS.includes(view) ? view : HOME);
}

function setLang(code){
  const { view } = parseHash();

  // Keep the reader's place. Section ids carry their language as a prefix, so
  // the same section in another language is one substitution away. Losing your
  // position halfway down a long page is a reason not to switch at all.
  if (railCurrent){
    const twin = code + railCurrent.slice(railCurrent.indexOf("-"));
    if (document.getElementById(twin)){
      location.hash = "#" + twin;
      if (LANG === code) route();
      return;
    }
  }

  location.hash = "#" + code + "/" + (VIEWS.includes(view) ? view : HOME);
  if (LANG === code) route();     // hash unchanged, so no hashchange to wait for
}

function navInit(){
  document.querySelectorAll("#tabs a").forEach(a => {
    a.hidden = !VIEWS.includes(a.dataset.view);
  });
  // A sentinel above the bar, watched rather than polled: the observer fires
  // twice per page rather than on every scroll tick.
  const chrome = document.querySelector(".chrome");
  const mark = document.createElement("div");
  mark.setAttribute("aria-hidden", "true");
  mark.style.cssText = "position:absolute;top:0;left:0;height:4px;width:1px";
  document.body.insertBefore(mark, document.body.firstChild);
  new IntersectionObserver(
    ([e]) => chrome.classList.toggle("lift", !e.isIntersecting)
  ).observe(mark);
  addEventListener("hashchange", route);
  route();
}

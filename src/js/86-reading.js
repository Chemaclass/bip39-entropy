/* ── reading: section rail and pager ────────────────────────────── */
// Both are built from whatever is on the page rather than written into it, so
// a new section or a new language needs no work here: the rail reads the
// headings of the visible pane, the pager reads the tabs.

const RAIL_OFFSET = 130;        // px of chrome above the reading line

function railFor(view){
  const host = $("view-" + view);
  const pane = [...host.querySelectorAll(".pane")].find(p => !p.hidden);
  if (!pane) return null;

  const secs = [...pane.querySelectorAll(".learn-sec[id]")]
    .map(s => ({ id: s.id, el: s, label: (s.querySelector("h2") || {}).textContent || "" }))
    .filter(s => s.label);
  if (secs.length < 2) return null;      // one section is a page, not a contents list

  let rail = host.querySelector(".rail");
  if (!rail){
    rail = document.createElement("nav");
    rail.className = "rail";
    host.insertBefore(rail, host.firstChild);
  }
  rail.replaceChildren();
  rail.setAttribute("aria-label", t("nav.aria"));

  // Name the page. Four reading pages share one layout, and a list of section
  // titles alone does not say which page you are on.
  const head = document.createElement("p");
  head.className = "rail-head";
  head.textContent = t("nav." + view);
  rail.appendChild(head);

  for (const s of secs){
    const a = document.createElement("a");
    a.href = "#" + s.id;
    // The number is already in the heading; the rail wants the words alone.
    a.textContent = s.label.replace(/^\s*\d+\s*/, "");
    a.dataset.for = s.id;
    rail.appendChild(a);
  }
  host.classList.add("has-rail");
  return secs;
}

let railSecs = null;
let railCurrent = null;      // the section the reader is looking at

function railSpy(){
  if (!railSecs || !railSecs.length) return;
  let current = railSecs[0].id;
  for (const s of railSecs){
    if (s.el.getBoundingClientRect().top <= RAIL_OFFSET) current = s.id;
  }
  railCurrent = current;
  document.querySelectorAll(".rail a").forEach(a =>
    a.classList.toggle("on", a.dataset.for === current));
}

function pagerFor(view){
  const host = $("view-" + view);
  const i = VIEWS.indexOf(view);
  let pager = host.querySelector(".pager");
  if (!pager){
    pager = document.createElement("nav");
    pager.className = "pager";
    host.appendChild(pager);
  }
  pager.replaceChildren();

  const link = (target, kind) => {
    const a = document.createElement("a");
    a.className = "pager-" + kind;
    a.href = "#" + LANG + "/" + target;
    a.innerHTML = '<span>' + t("pager." + kind) + '</span>' + t("nav." + target);
    return a;
  };
  if (i > 0) pager.appendChild(link(VIEWS[i - 1], "prev"));
  if (i >= 0 && i < VIEWS.length - 1) pager.appendChild(link(VIEWS[i + 1], "next"));
  pager.hidden = !pager.childElementCount;
}

// Called by the router once the view and language are settled.
function readingInit(view){
  railCurrent = null;
  railSecs = railFor(view);
  if (!railSecs) $("view-" + view).classList.remove("has-rail");
  pagerFor(view);
  if (typeof scaleInit === "function") scaleInit();
  if (typeof checklistInit === "function") checklistInit();
  if (typeof pathsInit === "function") pathsInit();
  railSpy();
}

addEventListener("scroll", () => {
  if (railSpy.pending) return;
  railSpy.pending = true;
  requestAnimationFrame(() => { railSpy.pending = false; railSpy(); });
}, { passive: true });


/* ── back to the top ────────────────────────────────────────────── */
// The rail only exists where there is room beside the column. On a phone a
// section can run several screens, and the tabs are at the top of the document.
function topInit(){
  const b = document.createElement("button");
  b.type = "button";
  b.id = "totop";
  b.className = "totop";
  b.hidden = true;
  b.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(b);

  const sync = () => {
    b.textContent = t("nav.top");
    b.setAttribute("aria-label", t("nav.top"));
    b.hidden = scrollY < 900;
  };
  addEventListener("scroll", () => {
    if (sync.pending) return;
    sync.pending = true;
    requestAnimationFrame(() => { sync.pending = false; sync(); });
  }, { passive: true });
  sync();
}

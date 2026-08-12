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

function railSpy(){
  if (!railSecs || !railSecs.length) return;
  let current = railSecs[0].id;
  for (const s of railSecs){
    if (s.el.getBoundingClientRect().top <= RAIL_OFFSET) current = s.id;
  }
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
  railSecs = railFor(view);
  if (!railSecs) $("view-" + view).classList.remove("has-rail");
  pagerFor(view);
  railSpy();
}

addEventListener("scroll", () => {
  if (railSpy.pending) return;
  railSpy.pending = true;
  requestAnimationFrame(() => { railSpy.pending = false; railSpy(); });
}, { passive: true });

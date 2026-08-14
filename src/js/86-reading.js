/* ── reading: the section rail ───────────────────────────────────── */
// Built from whatever is on the page rather than written into it, so a new
// section or a new language needs no work here: it reads the headings of the
// visible pane.

const RAIL_OFFSET = 130;        // px of chrome above the reading line

// One reading of the page feeds the rail and the contents list both, so the
// two can never disagree about what is on it.
function secsFor(view){
  const host = $("view-" + view);
  const pane = [...host.querySelectorAll(".pane")].find(p => !p.hidden);
  if (!pane) return { pane: null, secs: [] };
  const secs = [...pane.querySelectorAll(".learn-sec[id]")]
    .map(s => ({ id: s.id, el: s, label: (s.querySelector("h2") || {}).textContent || "" }))
    .filter(s => s.label);
  return { pane, secs };
}

function railFor(view, pane, secs){
  const host = $("view-" + view);
  if (!pane) return null;
  if (secs.length < 2) return null;      // one section is a page, not a contents list

  let rail = host.querySelector(".rail");
  if (!rail){
    rail = document.createElement("div");
    rail.className = "rail";
    rail.append(railButton(), document.createElement("nav"));
    rail.lastChild.className = "rail-panel";
    rail.lastChild.hidden = true;
    host.insertBefore(rail, host.firstChild);
  }
  const btn = rail.firstChild, panel = rail.lastChild;
  btn.setAttribute("aria-label", t("nav.aria"));
  panel.replaceChildren();
  panel.setAttribute("aria-label", t("nav.aria"));

  // Name the page. Four reading pages share one layout, and a list of section
  // titles alone does not say which page you are on.
  const head = document.createElement("p");
  head.className = "rail-head";
  head.textContent = t("nav." + view);
  panel.appendChild(head);

  for (const s of secs){
    const a = document.createElement("a");
    a.href = "#" + s.id;
    // The number is already in the heading; the rail wants the words alone.
    a.textContent = s.label.replace(/^\s*\d+\s*/, "");
    a.dataset.for = s.id;
    a.title = a.textContent;
    a.addEventListener("click", () => railOpen(rail, false));
    panel.appendChild(a);
  }
  host.classList.add("has-rail");
  return secs;
}

// The contents list at the top of a page, read off the same headings as the
// rail. The content files used to carry their own copy of this list, one per
// language, and keeping eight lists true to their sections was hand work that
// failed silently. Now there is nothing to keep true.
function tocFor(pane, secs){
  if (!pane) return;
  pane.querySelectorAll(".learn-toc").forEach(n => n.remove());
  if (secs.length < 2) return;

  const nav = document.createElement("nav");
  nav.className = "learn-toc";
  nav.setAttribute("aria-label", t("nav.toc"));
  const ol = document.createElement("ol");
  for (const s of secs){
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = "#" + s.id;
    // The list numbers itself in CSS; the heading's number would double it.
    a.textContent = s.label.replace(/^\s*\d+\s*/, "");
    li.appendChild(a);
    ol.appendChild(li);
  }
  nav.appendChild(ol);
  const first = pane.querySelector(".learn-sec");
  first.parentNode.insertBefore(nav, first);
}

// Hover is enough for a mouse, and CSS does that on its own. This is the path
// for a keyboard or a thumb, which have no hover to give.
function railOpen(rail, open){
  rail.classList.toggle("open", open);
  rail.firstChild.setAttribute("aria-expanded", String(open));
  rail.lastChild.hidden = !open;
}

function railButton(){
  const b = document.createElement("button");
  b.type = "button";
  b.className = "rail-btn";
  b.setAttribute("aria-expanded", "false");
  b.addEventListener("click", e => {
    e.stopPropagation();
    railOpen(b.parentNode, !b.parentNode.classList.contains("open"));
  });
  return b;
}

// Anywhere else, and Escape, closes it. A contents list that stays open over the
// prose is worse than one that costs a click.
addEventListener("click", e => {
  document.querySelectorAll(".rail.open").forEach(r => {
    if (!r.contains(e.target)) railOpen(r, false);
  });
});
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".rail.open").forEach(r => {
    railOpen(r, false);
    r.firstChild.focus();
  });
});

let railSecs = null;
let railCurrent = null;      // the section the reader is looking at

function railSpy(){
  if (!railSecs || !railSecs.length) return;
  let current = railSecs[0].id;
  for (const s of railSecs){
    if (s.el.getBoundingClientRect().top <= RAIL_OFFSET) current = s.id;
  }
  railCurrent = current;
  document.querySelectorAll(".rail a").forEach(a => {
    const on = a.dataset.for === current;
    a.classList.toggle("on", on);
    // The highlight is a colour; a screen reader needs the same "you are here".
    if (on) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
}

// Called by the router once the view and language are settled.
function readingInit(view){
  railCurrent = null;
  const { pane, secs } = secsFor(view);
  tocFor(pane, secs);
  railSecs = railFor(view, pane, secs);
  if (!railSecs) $("view-" + view).classList.remove("has-rail");
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

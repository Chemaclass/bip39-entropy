/* ── where to go next ───────────────────────────────────────────── */
// The landing page opened with a paragraph and left the rest of the site to be
// discovered in the tab bar. This states it: what is here, and which door is
// yours. Built from the same nav labels as the tabs, so it cannot drift.
const PATHS = [
  { view: "learn", key: "paths.learn" },
  { view: "protect", key: "paths.protect" },
  { view: "roll", key: "paths.roll" },
  { view: "poster", key: "paths.poster" },
];

function pathsInit(){
  for (const box of document.querySelectorAll('[data-widget="paths"]')){
    box.replaceChildren();
    box.className = "paths";

    const grid = document.createElement("div");
    grid.className = "paths-grid";
    for (const p of PATHS){
      if (!VIEWS.includes(p.view)) continue;
      const a = document.createElement("a");
      a.className = "path";
      a.href = "#" + LANG + "/" + p.view;
      const h = document.createElement("b");
      h.textContent = t("nav." + p.view);
      const d = document.createElement("span");
      d.textContent = t(p.key);
      a.append(h, d);
      grid.appendChild(a);
    }

    const trust = document.createElement("p");
    trust.className = "paths-trust";
    trust.textContent = t("paths.trust");

    box.append(grid, trust);
  }
}

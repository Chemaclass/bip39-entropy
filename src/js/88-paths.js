/* ── where to go next ───────────────────────────────────────────── */
// The landing page opened with a paragraph and left the rest of the site to be
// discovered in the tab bar. This states it: what is here, and which door is
// yours. Built from the same nav labels as the tabs, so it cannot drift.
const PATHS = [
  { view: "learn", key: "paths.learn" },
  { view: "protect", key: "paths.protect" },
  { view: "faq", key: "paths.faq" },
  { view: "roll", key: "paths.roll" },
  { view: "poster", key: "paths.poster" },
];

const SVG_NS = "http://www.w3.org/2000/svg";

function pathArrow(){
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 22 22");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(SVG_NS, "path");
  p.setAttribute("d", "M3 11h15M12 5l6 6-6 6");
  svg.appendChild(p);
  return svg;
}

function pathsInit(){
  for (const box of document.querySelectorAll('[data-widget="paths"]')){
    box.replaceChildren();
    box.className = "paths";

    const head = document.createElement("p");
    head.className = "paths-head";
    head.textContent = t("paths.head");

    const list = document.createElement("div");
    list.className = "paths-list";
    for (const p of PATHS){
      if (!VIEWS.includes(p.view)) continue;
      const a = document.createElement("a");
      a.className = "path";
      a.href = "#" + LANG + "/" + p.view;
      const h = document.createElement("b");
      h.textContent = t("nav." + p.view);
      const d = document.createElement("span");
      d.textContent = t(p.key);
      a.append(h, d, pathArrow());
      list.appendChild(a);
    }

    const trust = document.createElement("p");
    trust.className = "paths-trust";
    trust.textContent = t("paths.trust");

    box.append(head, list, trust);
  }
}

/* ── the number, drawn ──────────────────────────────────────────── */
// Twelve words, eleven bits each, the last four of them checksum. The cells
// carry no values: bits printed on this page would be a phrase someone could
// copy into a wallet.
const NUM_WORDS = 12, NUM_BITS = 11, NUM_CHECKSUM = 4;

function numberInit(){
  for (const box of document.querySelectorAll('[data-widget="number"]')){
    const fig = document.createElement("figure");
    fig.className = "numfig";
    fig.setAttribute("role", "img");
    fig.setAttribute("aria-label", t("fig.aria"));

    const grid = document.createElement("div");
    grid.className = "numfig-grid";
    grid.setAttribute("aria-hidden", "true");
    for (let r = 0; r < NUM_WORDS; r++){
      const row = document.createElement("div");
      row.className = "numfig-row";
      const n = document.createElement("span");
      n.className = "numfig-n";
      n.textContent = r + 1;
      row.appendChild(n);
      for (let c = 0; c < NUM_BITS; c++){
        const cell = document.createElement("i");
        const cs = r === NUM_WORDS - 1 && c >= NUM_BITS - NUM_CHECKSUM;
        if (cs) cell.className = "cs";
        cell.style.setProperty("--r", r);
        cell.style.setProperty("--c", cs ? c - (NUM_BITS - NUM_CHECKSUM) : c);
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }

    const cap = document.createElement("figcaption");
    cap.className = "numfig-cap";
    cap.setAttribute("aria-hidden", "true");
    const big = document.createElement("b");
    big.className = "numfig-big";
    const cs = document.createElement("em");
    cs.textContent = String(NUM_CHECKSUM);
    big.append((NUM_WORDS * NUM_BITS - NUM_CHECKSUM) + " + ", cs);
    const sum = document.createElement("p");
    sum.className = "numfig-sum";
    sum.textContent = t("fig.sum");
    const key = document.createElement("p");
    key.className = "numfig-key";
    const kr = document.createElement("span");
    kr.textContent = t("fig.random");
    const kc = document.createElement("span");
    kc.className = "cs";
    kc.textContent = t("fig.checksum");
    key.append(kr, kc);
    cap.append(big, sum, key);

    fig.append(grid, cap);
    box.replaceWith(fig);
  }
  // A language switch re-renders the strings, not the cells, so the fill does
  // not replay under the reader.
  for (const fig of document.querySelectorAll("figure.numfig")){
    fig.setAttribute("aria-label", t("fig.aria"));
    const [sum, key] = fig.querySelectorAll(".numfig-sum, .numfig-key");
    sum.textContent = t("fig.sum");
    key.children[0].textContent = t("fig.random");
    key.children[1].textContent = t("fig.checksum");
  }
}

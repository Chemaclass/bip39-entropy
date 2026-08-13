/* ── the procedure, on one page ─────────────────────────────────── */
// The site tells you to work offline, then leaves the steps on a screen you are
// supposed to walk away from. This prints them. Blank sheet, no secrets on it,
// safe to print anywhere and safe to keep afterwards.
const CL_INK = [0.078, 0.086, 0.110];
const CL_VERD = [0.180, 0.420, 0.369];
const CL_RULE = [0.655, 0.690, 0.706];
const CL_SUB = [0.353, 0.380, 0.412];
const CL_BOX = 4.2;                    // tick box, mm

const CHECKLIST = [
  { head: "cl.s1", items: ["cl.s1a", "cl.s1b", "cl.s1c", "cl.s1d"] },
  { head: "cl.s2", items: ["cl.s2a", "cl.s2b", "cl.s2c"] },
  { head: "cl.s3", items: ["cl.s3a", "cl.s3b", "cl.s3c"] },
  { head: "cl.s4", items: ["cl.s4a", "cl.s4b", "cl.s4c"] },
  { head: "cl.s5", items: ["cl.s5a", "cl.s5b", "cl.s5c"] },
  { head: "cl.s6", items: ["cl.s6a", "cl.s6b"] },
];

function checklistPDF(){
  const d = PDF.doc({ w: 210, h: 297 });
  const L = 15, R = 195, W = R - L;

  d.text(L, 19, t("cl.eyebrow"), { size: 7, font: "cour", rgb: CL_VERD, tracking: 0.3 });
  d.text(L, 30, t("cl.title"), { size: 19, font: "courB", rgb: CL_INK });
  d.text(L, 37.5, t("cl.sub"), { size: 8.5, font: "helv", rgb: CL_SUB });
  d.line(L, 41, R, 41, { rgb: CL_INK, lw: 0.3 });

  let y = 51;
  CHECKLIST.forEach((sec, i) => {
    d.text(L, y, String(i + 1).padStart(2, "0"),
           { size: 8, font: "courB", rgb: CL_VERD, tracking: 0.1 });
    d.text(L + 9, y, t(sec.head), { size: 8, font: "courB", rgb: CL_INK, tracking: 0.1 });
    y += 6.5;

    for (const key of sec.items){
      d.rect(L + 0.4, y - 3.1, CL_BOX, CL_BOX, { stroke: CL_RULE, lw: 0.2 });
      // Wrapped by hand: a translated line runs longer than the English it replaced.
      let line = "";
      const words = t(key).split(" ");
      const maxW = W - 9;
      for (const word of words){
        const next = line ? line + " " + word : word;
        if (line && d.width(next, 8, "helv") > maxW){
          d.text(L + 9, y, line, { size: 8, font: "helv", rgb: CL_INK });
          y += 4.4;
          line = word;
        } else line = next;
      }
      if (line){ d.text(L + 9, y, line, { size: 8, font: "helv", rgb: CL_INK }); y += 4.4; }
      y += 1.6;
    }
    y += 4;
  });

  d.line(L, y, R, y, { rgb: CL_INK, lw: 0.3 });
  d.text(L, y + 5.5, t("cl.foot1"), { size: 7.4, font: "helv", rgb: CL_SUB });
  d.text(L, y + 10.5, t("cl.foot2"), { size: 7.4, font: "helv", rgb: CL_SUB });
  d.text(L, y + 17, t("cl.foot3"), { size: 7, font: "courB", rgb: CL_INK, tracking: 0.06 });

  PDF.save(d.blob(), "bip39-checklist.pdf");
}

// Rendered from a slot the prose declares: <div data-widget="checklist"></div>
function checklistInit(){
  for (const box of document.querySelectorAll('[data-widget="checklist"]')){
    box.replaceChildren();
    box.className = "cl-widget";
    const p = document.createElement("p");
    p.className = "cl-note";
    p.textContent = t("cl.blurb");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn-print";
    b.textContent = t("cl.button");
    b.addEventListener("click", checklistPDF);
    box.append(p, b);
  }
}

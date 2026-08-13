/* ── theme ──────────────────────────────────────────────────────── */
// Light, dark, or whatever the system says. The choice is not stored: this page
// tells readers it keeps nothing, and a preference in localStorage would make
// that untrue for the sake of one colour. It holds for the visit, because
// nothing here reloads, and falls back to the system on the next one.
const THEMES = ["system", "light", "dark"];
let THEME = "system";

function applyTheme(){
  if (THEME === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", THEME);
}

function themeInit(){
  const sel = $("theme");
  sel.replaceChildren();
  for (const name of THEMES){
    const o = document.createElement("option");
    o.value = name;
    o.dataset.t = "theme." + name;
    o.textContent = t("theme." + name);
    if (name === THEME) o.selected = true;
    sel.appendChild(o);
  }
  sel.addEventListener("change", () => { THEME = sel.value; applyTheme(); });
  applyTheme();
}

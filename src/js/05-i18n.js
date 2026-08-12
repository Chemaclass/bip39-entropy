/* ── i18n ───────────────────────────────────────────────────────── */
// Strings live in src/i18n/<lang>.json, prose in src/content/<name>.<lang>.html.
// Nothing below names a language, so adding one means adding those two files
// and rebuilding. Keys missing from a translation fall back to the base
// language one at a time, which lets a translation land over several commits.
const I18N = __I18N__;
const LANGS = __LANGS__;
const BASE_LANG = "en";
let LANG = BASE_LANG;

const t = (key, vars) => {
  const s = (I18N[LANG] || {})[key] ?? I18N[BASE_LANG][key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
};

const langKnown = code => LANGS.some(l => l.code === code);

// Preference order: the URL, then the browser, then the base language. Nothing
// is stored. The page promises it keeps nothing, and a language in the URL is
// shareable, which a hidden preference is not.
function pickLang(wanted){
  if (wanted && langKnown(wanted)) return wanted;
  for (const tag of navigator.languages || [navigator.language || ""]){
    const code = String(tag).toLowerCase().split("-")[0];
    if (langKnown(code)) return code;
  }
  return BASE_LANG;
}

function applyI18n(){
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t(el.dataset.t); });
  document.querySelectorAll("[data-t-attr]").forEach(el => {
    for (const pair of el.dataset.tAttr.split(";")){
      const [attr, key] = pair.split(":").map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
  document.documentElement.lang = LANG;
}

// A pane is a block of translated prose. Fall back to the base language rather
// than showing nothing, so a half-translated language is still usable.
function showPanes(){
  const names = new Set([...document.querySelectorAll(".pane")].map(p => p.dataset.pane));
  for (const name of names){
    const all = [...document.querySelectorAll('.pane[data-pane="' + name + '"]')];
    const wanted = all.find(p => p.dataset.lang === LANG) ||
                   all.find(p => p.dataset.lang === BASE_LANG);
    all.forEach(p => { p.hidden = p !== wanted; });
  }
}

function langInit(){
  const sel = $("lang");
  sel.replaceChildren();
  for (const l of LANGS){
    const o = document.createElement("option");
    o.value = l.code;
    o.textContent = l.name;
    sel.appendChild(o);
  }
  sel.hidden = LANGS.length < 2;
  sel.addEventListener("change", () => setLang(sel.value));
}

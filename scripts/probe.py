#!/usr/bin/env python3
"""Drive index.html in headless Chrome and fail on anything the eye would miss.

Three classes of defect this catches, all of which have actually shipped here:

  * a word clipped inside its cell, because the type solver over-estimated how
    much room a column has
  * a whole sheet cut off, because .sheet{overflow:hidden} zeroes the automatic
    minimum size of a flex item and lets it shrink below its own grid
  * a JS error or a failing BIP-39 self-test, which the page cannot report itself

Needs Chrome (set CHROME to override the path). Not part of verify.sh or CI,
both of which stay dependency-free; run this after touching layout or the
entropy engine.

    python3 scripts/probe.py            # full sweep, 252 combinations
    python3 scripts/probe.py --quick    # smoke test only
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGE = ROOT / "index.html"
BASE_LANG_NOTE = "the base language"

CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "google-chrome", "chromium", "chromium-browser",
]

SMOKE = """
<script>
(function(){
  const say = { errors: window.__errs, seed: null, views: {} };
  try { say.seed = SEED.selfTest(); } catch (e){ say.seed = { pass:false, failures:[e.message] }; }
  // Computed display, not the hidden attribute: a CSS rule can override the
  // attribute and leave a "hidden" view painted on the page.
  const painted = () => VIEWS.filter(v =>
    getComputedStyle(document.getElementById("view-" + v)).display !== "none");
  for (const v of VIEWS){
    location.hash = "#" + v;
    showView(v);
    const p = painted();
    say.views[v] = p.length === 1 && p[0] === v;
    if (!say.views[v]) say.paintedFor = say.paintedFor || {};
    if (!say.views[v]) say.paintedFor[v] = p;
  }
  // The theme control must change what is painted, and the sheet must stay a
  // sheet in both, because it is the printed artifact.
  const bg = () => getComputedStyle(document.body).backgroundColor;
  const sheetBg = () => { const s = document.querySelector(".sheet");
    return s ? getComputedStyle(s).backgroundColor : null; };
  const sel = document.getElementById("theme");
  showView("poster");
  sel.value = "dark"; sel.dispatchEvent(new Event("change"));
  const dark = { page: bg(), sheet: sheetBg() };
  sel.value = "light"; sel.dispatchEvent(new Event("change"));
  const light = { page: bg(), sheet: sheetBg() };
  sel.value = "system"; sel.dispatchEvent(new Event("change"));
  say.theme = { changed: dark.page !== light.page,
                sheetStable: dark.sheet === light.sheet,
                dark: dark.page, light: light.page, sheet: light.sheet };

  say.sheets = document.querySelectorAll(".sheet").length;
  say.words = document.querySelectorAll(".w").length;
  document.title = "PROBE" + JSON.stringify(say);
})();
</script>
"""

LANGS = """
<script>
(function(){
  const out = [];
  // A failed lookup renders the key itself. Test for exactly that rather than
  // for anything key-shaped: "chemaclass.com" is a value, not a leak.
  const KEYS = new Set(Object.keys(I18N[BASE_LANG]));
  for (const l of LANGS){          // a top-level const is not a window property
    setLang(l.code);
    route();
    const shown = [...document.querySelectorAll(".pane")].filter(p => !p.hidden);
    const leaked = [];
    for (const el of document.querySelectorAll("[data-t], .roll-sec, .roll-count, #rollhint")){
      const s = (el.textContent || "").trim();
      if (!s || KEYS.has(s)) leaked.push(el.dataset.t || el.id || el.className);
    }
    const missing = Object.keys(I18N[BASE_LANG])
      .filter(k => !k.startsWith("_") && !(k in (I18N[l.code] || {})));
    out.push({ code: l.code, name: l.name, htmlLang: document.documentElement.lang,
               hash: location.hash, panes: shown.map(p => p.dataset.pane + ":" + p.dataset.lang),
               leaked: leaked.slice(0, 5), leakedCount: leaked.length,
               missing: missing.slice(0, 5), missingCount: missing.length });
  }
  document.title = "PROBE" + JSON.stringify(out);
})();
</script>
"""

PDFS = """
<script>
(function(){
  // A translated string is longer than the English it replaced, and an
  // unwrapped line simply walks off the paper. Measure every drawn string.
  const out = [];
  const MM = 25.4 / 72;
  PDF.save = () => {};
  const realDoc = PDF.doc;
  for (const l of LANGS){
    setLang(l.code); route();
    for (const job of ["poster", "checklist", "dice12", "dice24", "coin12", "coin24"]){
      let box = null;
      PDF.doc = (o) => {
        const d = realDoc(o);
        box = { w: o.w, h: o.h, minX: 1e9, maxX: -1e9, maxY: -1e9, worst: "" };
        const text = d.text, rect = d.rect, line = d.line;
        d.text = (x, y, s, op = {}) => {
          const size = op.size || 10;
          const w = d.width(s, size, op.font) +
                    (op.tracking || 0) * size * MM * Math.max(0, s.length - 1);
          const l0 = op.align === "c" ? x - w / 2 : op.align === "r" ? x - w : x;
          if (l0 + w > box.maxX){ box.maxX = l0 + w; box.worst = s.slice(0, 46); }
          box.minX = Math.min(box.minX, l0);
          box.maxY = Math.max(box.maxY, y);
          return text(x, y, s, op);
        };
        d.rect = (x, y, w, h, op) => {
          box.maxX = Math.max(box.maxX, x + w); box.minX = Math.min(box.minX, x);
          box.maxY = Math.max(box.maxY, y + h);
          return rect(x, y, w, h, op);
        };
        d.line = (a, b, c, e, op) => {
          box.maxX = Math.max(box.maxX, a, c); box.minX = Math.min(box.minX, a, c);
          box.maxY = Math.max(box.maxY, b, e);
          return line(a, b, c, e, op);
        };
        return d;
      };
      if (job === "checklist"){
        checklistPDF();
      } else if (job === "poster"){
        document.getElementById("paper").value = "A4";
        document.getElementById("orient").value = "p";
        document.getElementById("split").value = "auto";
        render();
        posterPDF();
      } else {
        ROLL.method = job.startsWith("coin") ? "coin" : "dice";
        ROLL.strength = job.endsWith("24") ? 24 : 12;
        worksheetPDF();
      }
      out.push({ lang: l.code, job, w: box.w, h: box.h,
                 minX: +box.minX.toFixed(1), maxX: +box.maxX.toFixed(1),
                 maxY: +box.maxY.toFixed(1), worst: box.worst });
    }
  }
  PDF.doc = realDoc;
  document.title = "PROBE" + JSON.stringify(out);
})();
</script>
"""

ANCHORS = """
<script>
(function(){
  // Every in-page link must land somewhere inside a view. A table of contents
  // entry that routes to an unknown view silently bounces to the poster.
  const bad = [], seen = new Set();
  for (const a of document.querySelectorAll('a[href^="#"]')){
    // The skip link points at <main> on purpose and never routes.
    if (a.classList.contains("skip")) continue;
    const id = a.getAttribute("href").slice(1);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (LANGS.some(l => l.code === id) || VIEWS.includes(id)) continue;
    const parts = id.split("/");
    if (LANGS.some(l => l.code === parts[0]) && VIEWS.includes(parts[1])) continue;
    const el = document.getElementById(id);
    if (!el){ bad.push(id + ": no such id"); continue; }
    const host = el.closest(".view");
    if (!host){ bad.push(id + ": not inside a view"); continue; }
    location.hash = "#" + id;
    route();
    if (document.getElementById(host.id).hidden) bad.push(id + ": view stayed hidden");
  }
  document.title = "PROBE" + JSON.stringify({ checked: seen.size, bad });
})();
</script>
"""

SWEEP = """
<script>
(function(){
  const out = [];
  const splits = [...document.getElementById("split").options].map(o => o.value);
  for (const paper of ["A4","A3","A2","A1","Letter","Tabloid"])
    for (const o of ["p","l"])
      for (const s of splits)
        for (const face of ["grot","serif","mono"]){
          document.getElementById("paper").value = paper;
          document.getElementById("orient").value = o;
          document.getElementById("split").value = s;
          document.getElementById("face").value = face;
          render();
          const sheet = document.querySelector(".sheet");
          const doc = document.documentElement;
          let clipped = 0, worst = "";
          for (const el of document.querySelectorAll(".w"))
            if (el.scrollWidth - el.clientWidth > 1){ clipped++; worst = el.textContent; }
          out.push({
            combo: [paper, o, s, face].join(" "),
            pt: +(L.fs * 2.83465).toFixed(1),
            cut: sheet.scrollWidth - sheet.clientWidth,
            scroll: doc.scrollWidth - doc.clientWidth,
            clipped, worst
          });
        }
  document.title = "PROBE" + JSON.stringify(out);
})();
</script>
"""

CATCH = ('<script>window.__errs=[];'
         'addEventListener("error",e=>window.__errs.push(e.message+" @"+e.lineno));'
         '</script>')

# Headless Chrome refuses to size its window below ~500px, so a narrow viewport
# has to come from an iframe. Anything else screenshots at 500 and crops, which
# looks exactly like a layout bug and is not one.
MOBILE = """<!doctype html><meta charset=utf-8><body style="margin:0">
<iframe id="f" src="__PAGE__" style="width:375px;height:1600px;border:0"></iframe>
<script>
addEventListener("load", () => setTimeout(() => {
  const out = [];
  for (const w of [375, 320]){
    f.style.width = w + "px";
    for (const view of ["poster", "learn", "roll"]){
      f.contentWindow.showView(view);
      const d = f.contentDocument, vw = d.documentElement.clientWidth;
      // Content inside a deliberate scroll container (wide tables) is allowed to
      // exceed the viewport — that is what the container is for. Only content
      // that widens the page itself counts.
      const scrolls = el => {
        for (let n = el.parentElement; n && n !== d.body; n = n.parentElement){
          const ox = f.contentWindow.getComputedStyle(n).overflowX;
          if (ox === "auto" || ox === "scroll") return true;
        }
        return false;
      };
      const over = [];
      for (const el of d.querySelectorAll("body *")){
        const r = el.getBoundingClientRect();
        if (r.right > vw + 1 && !scrolls(el))
          over.push(el.tagName + "." + (el.className || "-") +
                    " +" + Math.round(r.right - vw) + "px");
      }
      out.push({ w, view, vw, scroll: d.documentElement.scrollWidth, over: over.slice(0, 4),
                 count: over.length });
    }
  }
  document.title = "PROBE" + JSON.stringify(out);
}, 800));
</script>"""


def run_mobile() -> object:
    with tempfile.TemporaryDirectory() as td:
        page = pathlib.Path(td) / "page.html"
        page.write_text(PAGE.read_text())
        harness = pathlib.Path(td) / "mobile.html"
        harness.write_text(MOBILE.replace("__PAGE__", page.name))
        dom = subprocess.run(
            [chrome(), "--headless=new", "--disable-gpu", "--no-sandbox",
             "--allow-file-access-from-files", "--dump-dom",
             "--window-size=900,1700", "--virtual-time-budget=60000", harness.as_uri()],
            capture_output=True, text=True, timeout=300).stdout
    m = re.search(r"<title>PROBE(.*?)</title>", dom, re.S)
    if not m:
        sys.exit("the narrow-viewport harness did not run")
    return json.loads(m.group(1).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))


def chrome() -> str:
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for c in CANDIDATES:
        if pathlib.Path(c).exists() or shutil.which(c):
            return c
    sys.exit("no Chrome found — set CHROME=/path/to/chrome")


def run(script: str) -> object:
    html = PAGE.read_text().replace("<body>", "<body>" + CATCH, 1)
    html = html.replace("</body>", script + "</body>")
    with tempfile.TemporaryDirectory() as td:
        page = pathlib.Path(td) / "probe.html"
        page.write_text(html)
        dom = subprocess.run(
            [chrome(), "--headless=new", "--disable-gpu", "--no-sandbox", "--dump-dom",
             "--window-size=1400,1000", "--virtual-time-budget=120000", page.as_uri()],
            capture_output=True, text=True, timeout=600).stdout
    m = re.search(r"<title>PROBE(.*?)</title>", dom, re.S)
    if not m:
        sys.exit("the page did not finish running — no PROBE title in the dumped DOM")
    return json.loads(m.group(1).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">"))


def main() -> None:
    fail = 0
    smoke = run(SMOKE)

    if smoke["errors"]:
        print(f"  FAIL  {len(smoke['errors'])} JS error(s): {smoke['errors'][:3]}")
        fail += 1
    else:
        print("  ok    no JS errors")

    if smoke["seed"]["pass"]:
        print("  ok    BIP-39 self-test")
    else:
        print(f"  FAIL  BIP-39 self-test: {smoke['seed']['failures'][:3]}")
        fail += 1

    missing = [v for v, shown in smoke["views"].items() if not shown]
    print(f"  {'ok   ' if not missing else 'FAIL '} views render: {list(smoke['views'])}")
    fail += bool(missing)

    th = smoke.get("theme", {})
    ok_theme = th.get("changed") and th.get("sheetStable")
    print(f"  {'ok   ' if ok_theme else 'FAIL '} theme: page {th.get('dark')} -> {th.get('light')}, "
          f"sheet stays {th.get('sheet')}")
    fail += not ok_theme

    if smoke["words"] != 2048:
        print(f"  FAIL  {smoke['words']} word cells on the default sheet, expected 2048")
        fail += 1
    else:
        print("  ok    2048 word cells")

    for row in run(LANGS):
        bad = row["leakedCount"] or not row["panes"] or row["htmlLang"] != row["code"]
        print(f"  {'ok   ' if not bad else 'FAIL '} {row['code']} ({row['name']}): "
              f"{row['hash']}  panes {row['panes']}  "
              f"{row['missingCount']} key(s) falling back to {BASE_LANG_NOTE}")
        if row["leakedCount"]:
            print(f"        untranslated or empty in the page: {row['leaked']}")
        if row["missingCount"]:
            print(f"        missing keys: {row['missing']}")
        fail += bool(bad)

    for row in run(PDFS):
        # 5 mm of slack: the worksheet margin is 15 mm and the poster's is its own
        over = row["maxX"] > row["w"] - 5 or row["minX"] < 5 or row["maxY"] > row["h"] - 5
        print(f"  {'ok   ' if not over else 'FAIL '} pdf {row['lang']}/{row['job']}: "
              f"x [{row['minX']}, {row['maxX']}] of {row['w']}mm, "
              f"lowest ink {row['maxY']} of {row['h']}mm")
        if over:
            print(f"        widest string: {row['worst']!r}")
        fail += bool(over)

    anchors = run(ANCHORS)
    print(f"  {'ok   ' if not anchors['bad'] else 'FAIL '} "
          f"{anchors['checked']} in-page links resolve into a view")
    for b in anchors["bad"][:8]:
        print(f"        {b}")
    fail += bool(anchors["bad"])

    narrow = run_mobile()
    spill = [r for r in narrow if r["count"] or r["scroll"] > r["vw"]]
    print(f"  {'ok   ' if not spill else 'FAIL '} narrow viewports: "
          f"{sorted({r['w'] for r in narrow})} px, all three views")
    for r in spill:
        print(f"        {r['w']}px {r['view']}: scrollWidth={r['scroll']} "
              f"{r['count']} element(s) past the edge {r['over']}")
    fail += bool(spill)

    if "--quick" not in sys.argv:
        rows = run(SWEEP)
        bad = [r for r in rows if r["clipped"] or r["cut"] > 1 or r["scroll"] > 0]
        print(f"  {'ok   ' if not bad else 'FAIL '} {len(rows)} paper/orientation/grid/face combinations")
        for r in bad[:12]:
            print(f"        {r['combo']:34} {r['pt']:>5}pt  clipped={r['clipped']} "
                  f"({r['worst']}) sheetcut={r['cut']} scroll={r['scroll']}")
        if len(bad) > 12:
            print(f"        … {len(bad) - 12} more")
        fail += bool(bad)

    print("probe failed." if fail else "probe passed.")
    sys.exit(1 if fail else 0)


if __name__ == "__main__":
    main()

/* ── how big is the number ──────────────────────────────────────── */
// A slot the prose can drop in: <div data-widget="scale"></div>. Pick a secret
// and a rate, and the sentence underneath does the arithmetic. Switching from
// 128 bits to the 32-bit seed of a real wallet bug is the whole argument of the
// page in one control, so the weak options are on the list deliberately.

const YEAR_S = 31556952;              // seconds in a Julian year
const UNIVERSE_Y = 13.8e9;            // years, current best estimate
const UNIVERSE_S = UNIVERSE_Y * YEAR_S;

const SCALE_SECRETS = [
  { key: "scale.secret.b128", bits: 128 },
  { key: "scale.secret.b256", bits: 256 },
  { key: "scale.secret.chosen", bits: 60 },
  { key: "scale.secret.b32", bits: 32 },
];
const SCALE_RATES = [
  { key: "scale.rate.laptop", rate: 1e9 },
  { key: "scale.rate.botnet", rate: 1e15 },
  { key: "scale.rate.earth", rate: 1e19 },
  { key: "scale.rate.bitcoin", rate: 1e21 },
];

// Powers of ten rather than scale words: "quintillion" does not survive
// translation, and the rest of the page already writes numbers this way.
function sci(n, digits){
  if (n === 0) return "0";
  const e = Math.floor(Math.log10(n));
  if (e >= -3 && e < 4) return String(Number(n.toPrecision(digits || 2)));
  const m = Number((n / Math.pow(10, e)).toPrecision(digits || 2));
  return m + " × 10^" + e;
}

function humanTime(seconds){
  if (seconds < 1) return t("scale.instant");
  if (seconds < 60) return t("scale.unit.s", { n: sci(seconds) });
  if (seconds < 3600) return t("scale.unit.min", { n: sci(seconds / 60) });
  if (seconds < 86400) return t("scale.unit.h", { n: sci(seconds / 3600) });
  if (seconds < YEAR_S) return t("scale.unit.d", { n: sci(seconds / 86400) });
  return t("scale.unit.y", { n: sci(seconds / YEAR_S) });
}

function scaleRender(box){
  const bits = Number(box.querySelector(".scale-secret").value);
  const rate = Number(box.querySelector(".scale-rate").value);
  const space = Math.pow(2, bits);
  const seconds = space / rate;
  const covered = Math.min(1, (rate * UNIVERSE_S) / space);

  const out = box.querySelector(".scale-out");
  out.replaceChildren();

  const line = (cls, html) => {
    const d = document.createElement("p");
    d.className = cls;
    d.innerHTML = html;
    out.appendChild(d);
  };

  line("scale-line", t("scale.space", { n: "<b>2^" + bits + "</b>", approx: sci(space) }));
  line("scale-line", t("scale.takes", { time: "<b>" + humanTime(seconds) + "</b>" }));

  // Reachable means reachable by a person, not merely shorter than cosmology.
  // A search of eleven billion years is not an attack, and neither is it a
  // comfortable margin worth boasting about, so the three cases are separate.
  const LIFETIME_S = 100 * YEAR_S;
  if (seconds <= LIFETIME_S){
    line("scale-line scale-warn",
         t("scale.reachable", { time: "<b>" + humanTime(seconds) + "</b>" }));
  } else if (seconds <= UNIVERSE_S){
    line("scale-line", t("scale.beyondLife"));
  } else {
    line("scale-line", t("scale.ages", { n: "<b>" + sci(seconds / UNIVERSE_S) + "</b>" }));
    // A percentage with thirty leading zeros says less than the plain fraction.
    line("scale-line scale-dim",
         t("scale.covered", { pct: "<b>" + sci(covered * 100, 2) + " %</b>" }));
  }

  // Every rate here counts one hash as one full attempt, which no attacker gets.
  line("scale-line scale-dim", t("scale.trialNote"));
}

function scaleInit(){
  for (const box of document.querySelectorAll('[data-widget="scale"]')){
    box.replaceChildren();
    box.classList.add("scale");

    const head = document.createElement("p");
    head.className = "scale-head";
    head.textContent = t("scale.title");

    const ctl = document.createElement("div");
    ctl.className = "scale-ctl";

    const mk = (cls, label, items, valueOf, selected) => {
      const wrap = document.createElement("label");
      wrap.className = "scale-field";
      const cap = document.createElement("span");
      cap.textContent = t(label);
      const sel = document.createElement("select");
      sel.className = cls;
      for (const it of items){
        const o = document.createElement("option");
        o.value = valueOf(it);
        o.textContent = t(it.key);
        if (valueOf(it) === selected) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener("change", () => scaleRender(box));
      wrap.append(cap, sel);
      return wrap;
    };

    ctl.append(
      mk("scale-secret", "scale.secretLabel", SCALE_SECRETS, s => s.bits, 128),
      mk("scale-rate", "scale.rateLabel", SCALE_RATES, r => r.rate, 1e21));

    const out = document.createElement("div");
    out.className = "scale-out";

    box.append(head, ctl, out);
    scaleRender(box);
  }
}

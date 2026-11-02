// Builds the animated SVGs for the profile README: the banner (assets/banner.svg)
// and the pixel Guru badge (assets/guru.svg). Guru is the same 12×16 sprite as
// on the portfolio (js/mascot/sprite.js there). Run: node scripts/make-art.mjs

import { writeFileSync, mkdirSync } from "node:fs";

const PAL = { K: "#16171b", L: "#a5a1f0", T: "#5eead4", W: "#ecfffa", P: "#c9c6ff", R: "#fb7185" };
const HEAD = [
  "....LLLL....", "..LLKKKKLL..", ".LKKKKKKKKL.", ".LKKKKKKKKL.", "LKWWWKKWWWKL",
  "LKKWWKKWWKKL", ".LKKWKKWKKL.", ".LKKKKKKKKL.", "..LKKKKKKL..", "...LLKKLL...",
];
const BODIES = {
  idle: ["...TLLLLT...", "..KLLWWLLK..", "...LLTTLL...", "...LL..LL...", "...KK..KK...", "..KKK..KKK.."],
  runA: ["...TLLLLT...", ".KLLLWWLLLK.", "...LLTTLL...", "..LL....LL..", ".KK......KK.", ".KK......KK."],
  runB: ["...TLLLLT...", "...KLWWLK...", "...LLTTLL...", "....LLLL....", "....KKKK....", "...KK..KK..."],
  jump: ["K..TLLLLT..K", ".LLLLWWLLLL.", "...LLTTLL...", "...LLLLLL...", "...KK..KK...", "............"],
  sitA: ["...TLLLLT...", "..KLLWWLLK..", "...LLTTLL...", "...LL..LL...", "...KK..LL...", ".......KK..."],
  sitB: ["...TLLLLT...", "..KLLWWLLK..", "...LLTTLL...", "...LL..LL...", "...LL..KK...", "...KK......."],
};
const LENS_ROWS = [4, 5, 6];
const WINK_EYES = [[4, 2], [4, 3], [4, 4], [5, 3], [5, 4], [6, 4], [5, 7], [5, 8], [5, 9]];
const BLUSH = [[6, 2], [6, 9]];
const BUBBLE = [
  ".KKKKKKKKKKK.", "KWWWWWWWWWWWK", "KWWWWWWWWWWWK", "KWWWWWWWWWWWK", "KWWWWWWWWWWWK", "KWWWWWWWWWWWK",
  "KWWWWWWWWWWWK", "KWWWWWWWWWWWK", ".KKWKKKKKKKK.", "..KWK........", "...K.........",
];
const HI = ["K...K.K", "K.....K", "KK..K.K", "K.K.K..", "K.K.K.K"];

const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const r1 = (n) => Math.round(n * 10) / 10;

/** Pixel cells of a sprite frame: "x,y" -> colour. A wink closes the right lens and blushes. */
function frameCells(body, { wink = false } = {}) {
  const cells = new Map();
  [...HEAD, ...BODIES[body]].forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === ".") return;
    cells.set(`${c},${r}`, PAL[wink && ch === "W" && LENS_ROWS.includes(r) ? "K" : ch]);
  }));
  if (wink) {
    WINK_EYES.forEach(([r, c]) => cells.set(`${c},${r}`, PAL.W));
    BLUSH.forEach(([r, c]) => cells.set(`${c},${r}`, PAL.R));
  }
  return cells;
}

/** Closed lenses, drawn over an open-eyed frame for a blink. */
function blinkCells() {
  const cells = new Map();
  LENS_ROWS.forEach((r) => [...HEAD[r]].forEach((ch, c) => {
    if (ch === "W") cells.set(`${c},${r}`, r === 5 ? PAL.P : PAL.K);
  }));
  return cells;
}

function rowsToCells(rows, colour) {
  const cells = new Map();
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== ".") cells.set(`${c},${r}`, colour ?? PAL[ch]); }));
  return cells;
}

/** SVG rects for pixel cells, merging runs of one colour along each row. */
function rects(cells, px, ox = 0, oy = 0) {
  const rows = new Map();
  for (const [key, colour] of cells) {
    const [x, y] = key.split(",").map(Number);
    rows.set(y, [...(rows.get(y) ?? []), [x, colour]]);
  }
  const out = [];
  for (const [y, list] of [...rows].sort((a, b) => a[0] - b[0])) {
    const sorted = list.sort((a, b) => a[0] - b[0]);
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1][0] === sorted[j][0] + 1 && sorted[j + 1][1] === sorted[i][1]) j++;
      out.push(`<rect x="${ox + sorted[i][0] * px}" y="${oy + y * px}" width="${(j - i + 1) * px}" height="${px}" fill="${sorted[i][1]}"/>`);
      i = j + 1;
    }
  }
  return out.join("");
}

function bubble(glyph, px, ox, oy) {
  const left = Math.floor((13 - glyph[0].length) / 2);
  return rects(rowsToCells(BUBBLE), px, ox, oy) + rects(rowsToCells(glyph, PAL.K), px, ox + left * px, oy + 2 * px);
}

const sparkle = (x, y, colour) =>
  `<g class="spark" style="transform-origin:${x + 2}px ${y + 2}px"><rect x="${x}" y="${y - 4}" width="4" height="12" fill="${colour}"/><rect x="${x - 4}" y="${y}" width="12" height="4" fill="${colour}"/></g>`;

const FONT = `font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif`;

/* ---------- banner ---------- */
function banner() {
  const W = 1280, H = 350, PX = 4, GROUND = 330;
  const phrases = ["production LLM backends.", "RAG systems with access control.", "multi-agent AI systems.", "deep learning models in PyTorch.", "real-time data pipelines."];
  const nodes = Array.from({ length: 34 }, (_, i) => ({ x: r1(i < 22 ? 660 + rand(i) * 600 : 30 + rand(i) * 1220), y: r1(18 + rand(i + 50) * 290) }));
  const links = nodes.flatMap((a, i) => nodes.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 150).map((b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`));
  const dots = nodes.map((n, i) => `<circle class="${i % 4 ? "" : "pulse"}" style="animation-delay:-${r1(rand(i + 9) * 4)}s" cx="${n.x}" cy="${n.y}" r="${i % 5 ? 1.6 : 2.4}"/>`);
  const guru = (body, opts) => rects(frameCells(body, opts), PX);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Likhith Nagaralu Gurumurthy, AI/ML engineer. I build production LLM backends, RAG systems with access control, multi-agent AI systems, deep learning models in PyTorch and real-time data pipelines.">
<style>
text{${FONT}}
.net line{stroke:#a5a1f0;stroke-opacity:.12;stroke-width:1}
.net circle{fill:#a5a1f0;fill-opacity:.4}
.net .pulse{fill:#5eead4;animation:pulse 4s ease-in-out infinite}
@keyframes pulse{0%,100%{fill-opacity:.25}50%{fill-opacity:.95}}
.lead{font-size:26px;fill:#a3a4b0}
.phrase{font-size:54px;font-weight:700;opacity:0;animation:phrase 15s infinite}
${phrases.map((_, i) => `.phrase:nth-of-type(${i + 1}){animation-delay:${i * 3}s}`).join("\n")}
@keyframes phrase{0%{opacity:0;transform:translateY(10px)}2%,17%{opacity:1;transform:none}20%,100%{opacity:0;transform:translateY(-8px)}}
.roles{font-size:20px;fill:#c9c6ff}
.pill{font-size:16px;fill:#ececf1}
.dot{animation:pulse 2.4s ease-in-out infinite}
.guru{animation:walk 12s linear infinite}
@keyframes walk{0%{transform:translate(-60px,${GROUND - 64}px)}35%{transform:translate(1100px,${GROUND - 64}px)}80%{transform:translate(1100px,${GROUND - 64}px)}90%,100%{transform:translate(1340px,${GROUND - 64}px)}}
.run{animation:show-run 12s steps(1,end) infinite,bob .24s steps(1,end) infinite}
@keyframes show-run{0%{opacity:1}35%{opacity:0}80%{opacity:1}90%{opacity:0}100%{opacity:0}}
@keyframes bob{0%{transform:none}50%{transform:translateY(-4px)}}
.legA,.legB{animation:legs .24s steps(1,end) infinite}
.legB{animation-delay:-.12s}
@keyframes legs{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
.stand{opacity:0;animation:show-stand 12s steps(1,end) infinite}
@keyframes show-stand{0%{opacity:0}35%{opacity:1}45%{opacity:0}60%{opacity:1}80%{opacity:0}100%{opacity:0}}
.blink{opacity:0;animation:blink 3s steps(1,end) infinite}
@keyframes blink{0%{opacity:0}90%{opacity:1}96%{opacity:0}}
.wink{opacity:0;animation:show-wink 12s steps(1,end) infinite}
@keyframes show-wink{0%{opacity:0}45%{opacity:1}60%{opacity:0}100%{opacity:0}}
.spark{animation:spark .6s steps(3,end) infinite}
.spark+.spark{animation-delay:-.3s}
@keyframes spark{0%,100%{transform:scale(0)}50%{transform:scale(1.2)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.phrase:nth-of-type(1),.stand{opacity:1}.guru{transform:translate(1100px,${GROUND - 64}px)}.run{opacity:0}}
</style>
<defs>
<linearGradient id="ink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ececf1"/><stop offset=".45" stop-color="#a5a1f0"/><stop offset="1" stop-color="#5eead4"/></linearGradient>
<radialGradient id="glowA" cx=".78" cy=".1" r=".55"><stop offset="0" stop-color="#a5a1f0" stop-opacity=".16"/><stop offset="1" stop-color="#a5a1f0" stop-opacity="0"/></radialGradient>
<radialGradient id="glowB" cx=".05" cy="1" r=".5"><stop offset="0" stop-color="#5eead4" stop-opacity=".09"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="#1d1e23"/>
<rect width="${W}" height="${H}" fill="url(#glowA)"/>
<rect width="${W}" height="${H}" fill="url(#glowB)"/>
<g class="net">${links.join("")}${dots.join("")}</g>
<text class="lead" x="72" y="88">Hi, I'm Likhith Nagaralu Gurumurthy. I build</text>
<g>${phrases.map((p) => `<text class="phrase" x="72" y="156" fill="url(#ink)">${p}</text>`).join("")}</g>
<text class="roles" x="72" y="198">AI/ML Engineering · LLM &amp; Generative AI · Data Engineering &amp; Analytics</text>
<rect x="72" y="220" width="606" height="36" rx="18" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".1"/>
<circle class="dot" cx="94" cy="238" r="5" fill="#5eead4"/>
<text class="pill" x="110" y="244">Graduating December 2026 · open to full-time roles from January 2027</text>
<line x1="0" y1="${GROUND + 1}" x2="${W}" y2="${GROUND + 1}" stroke="#a5a1f0" stroke-opacity=".2" stroke-dasharray="4 8"/>
<g class="guru">
<g class="run"><g class="legA">${guru("runA")}</g><g class="legB">${guru("runB")}</g></g>
<g class="stand">${guru("idle")}<g class="blink">${rects(blinkCells(), PX)}</g></g>
<g class="wink">${guru("idle", { wink: true })}${bubble(HI, 3, 40, -40)}${sparkle(-18, 20, "#5eead4")}${sparkle(58, 52, "#c9c6ff")}</g>
</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
</svg>
`;
}

/* ---------- the badge at the bottom: Guru sitting on an "Ask Guru" button ---------- */
function badge() {
  const W = 340, H = 112, PX = 4, PILL = { x: 40, y: 64, w: 290, h: 40 };
  const sit = (body, opts) => rects(frameCells(body, opts), PX);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Pixel Guru sitting on an Ask Guru button">
<style>
text{${FONT}}
.legA,.legB{animation:legs .76s steps(1,end) infinite}
.legB{animation-delay:-.38s}
@keyframes legs{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
.blink{opacity:0;animation:blink 4.2s steps(1,end) infinite}
@keyframes blink{0%{opacity:0}95%{opacity:1}98%{opacity:0}}
.wink{opacity:0;animation:wink 7s steps(1,end) infinite}
@keyframes wink{0%{opacity:0}70%{opacity:1}86%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.legB,.wink,.blink{opacity:0}}
</style>
<rect x="${PILL.x}" y="${PILL.y}" width="${PILL.w}" height="${PILL.h}" rx="20" fill="#25262c" stroke="#ffffff" stroke-opacity=".12"/>
<text x="${PILL.x + 66}" y="${PILL.y + 26}" font-size="16" font-weight="500" fill="#ececf1">Ask Guru on my portfolio ↗</text>
<g transform="translate(${PILL.x + 4} ${PILL.y - 13 * PX})">
<g class="legA">${sit("sitA")}</g><g class="legB">${sit("sitB")}</g>
<g class="blink">${rects(blinkCells(), PX)}</g>
<g class="wink">${sit("sitA", { wink: true })}</g>
</g>
</svg>
`;
}

/* ---------- shared timing helpers ---------- */
const pct = (t, loop) => `${Math.round((t / loop) * 10000) / 100}%`;
/** Keyframes from [seconds, declarations] stops over a loop of `loop` seconds. */
const keyframes = (name, loop, stops) => `@keyframes ${name}{${stops.map(([t, d]) => `${pct(t, loop)}{${d}}`).join("")}}`;
/** Visible only between the given [from, to] windows (in seconds), switched on and off sharply. */
const windows = (name, loop, spans) => keyframes(name, loop, [[0, "opacity:0"], ...spans.flatMap(([a, b]) => [[a, "opacity:1"], [b, "opacity:0"]]), [loop, "opacity:0"]]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/* ---------- the journey: pixel Guru jumping up from one milestone to the next ---------- */
function journey() {
  const W = 1280, H = 392, PX = 4, LOOP = 13;
  const steps = [
    { role: "B.E. Information Science", org: "BNM Institute of Technology", when: "Aug 2019 – May 2023" },
    { role: "Data Analyst Intern", org: "Compsoft Technologies", when: "Aug 2022 – Jan 2023" },
    { role: "Data Engineer Intern", org: "Bharat Electronics Limited", when: "Jul 2023 – Dec 2023" },
    { role: "MS Information Systems", org: "Northeastern University", when: "Sep 2024 – Dec 2026" },
    { role: "AI/ML Engineering Intern", org: "IPSER Labs", when: "Jan 2026 – Jun 2026" },
    { role: "Open to full-time roles", org: "AI/ML · LLM · data engineering", when: "from January 2027", goal: true },
  ];
  const plat = steps.map((s, i) => ({ ...s, x: 22 + i * 206, y: 302 - i * 38, w: 196 }));
  const feetX = (p) => p.x + 98;
  // Timeline: fall onto the first platform, then a hop every 1.3 s up to the last one.
  const LANDS = [0.5, ...plat.slice(1).map((_, i) => 1.4 + i * 1.3 + 0.55)];
  const JUMP = 0.55;
  const path = [[0, feetX(plat[0]), -20], [0.5, feetX(plat[0]), plat[0].y]];
  plat.slice(1).forEach((p, i) => {
    const from = plat[i], start = LANDS[i + 1] - JUMP, lift = 36 + (from.y - p.y) / 2;
    path.push([start, feetX(from), from.y]);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      path.push([start + JUMP * t, feetX(from) + (feetX(p) - feetX(from)) * t, from.y + (p.y - from.y) * t - 4 * lift * t * (1 - t)]);
    }
  });
  path.push([LOOP, feetX(plat[5]), plat[5].y]);
  const move = keyframes("route", LOOP, path.map(([t, x, y]) => [t, `transform:translate(${Math.round(x - 24)}px,${Math.round(y - 64)}px)`]));
  const air = [[0, 0.5], ...plat.slice(1).map((_, i) => [LANDS[i + 1] - JUMP, LANDS[i + 1]])];
  const WINK = [LANDS[5] + 0.2, 11.6];
  const lit = plat.map((_, i) => windows(`lit${i}`, LOOP, [[LANDS[i], 12.4]]));
  const cards = plat.map((p, i) => `<g>
<rect x="${p.x}" y="${p.y}" width="${p.w}" height="72" rx="12" fill="${p.goal ? "#173a36" : "#24252c"}" fill-opacity="${p.goal ? ".55" : "1"}" stroke="${p.goal ? "#5eead4" : "#ffffff"}" stroke-opacity="${p.goal ? ".6" : ".1"}"/>
<rect class="lit" style="animation-name:lit${i}" x="${p.x + 10}" y="${p.y - 1}" width="${p.w - 20}" height="3" rx="1.5" fill="${p.goal ? "#5eead4" : "#a5a1f0"}"/>
<text x="${p.x + 12}" y="${p.y + 25}" class="role">${esc(p.role)}</text>
<text x="${p.x + 12}" y="${p.y + 44}" class="org">${esc(p.org)}</text>
<text x="${p.x + 12}" y="${p.y + 61}" class="when">${esc(p.when)}</text>
</g>`).join("\n");
  const goal = plat[5];
  const flag = `<g transform="translate(${goal.x + goal.w - 26} ${goal.y - 40})"><rect width="3" height="40" fill="#c9c6ff"/><g class="flagA">${rects(rowsToCells(["TTTT", "TTTTT", "TTTT"], PAL.T), 4, 3, 0)}</g><g class="flagB">${rects(rowsToCells(["TTTTT", "TTTT.", "TTTTT"], PAL.T), 4, 3, 0)}</g></g>`;
  const guru = (body, opts) => rects(frameCells(body, opts), PX);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Likhith's journey: B.E. Information Science at BNM Institute of Technology (2019 to 2023), Data Analyst Intern at Compsoft Technologies, Data Engineer Intern at Bharat Electronics Limited, MS Information Systems at Northeastern University (2024 to 2026), AI/ML Engineering Intern at IPSER Labs (2026), and open to full-time roles from January 2027.">
<style>
text{${FONT}}
.role{font-size:13px;font-weight:600;fill:#ececf1}
.org{font-size:11.5px;fill:#a3a4b0}
.when{font-size:10.5px;fill:#5eead4;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.lit{opacity:0;animation:${LOOP}s steps(1,end) infinite}
${lit.join("\n")}
.guru{animation:route ${LOOP}s linear infinite}
${move}
.air{animation:air ${LOOP}s steps(1,end) infinite}
.ground{animation:ground ${LOOP}s steps(1,end) infinite}
.wink{opacity:0;animation:wink ${LOOP}s steps(1,end) infinite}
${windows("air", LOOP, air)}
${keyframes("ground", LOOP, [[0, "opacity:0"], ...air.flatMap(([a, b]) => [[a, "opacity:0"], [b, "opacity:1"]]), [WINK[0], "opacity:0"], [WINK[1], "opacity:1"], [LOOP, "opacity:1"]])}
${windows("wink", LOOP, [WINK])}
.blink{opacity:0;animation:blink 2.6s steps(1,end) infinite}
@keyframes blink{0%{opacity:0}92%{opacity:1}97%{opacity:0}}
.spark{animation:spark .6s steps(3,end) infinite}
.spark+.spark{animation-delay:-.3s}
@keyframes spark{0%,100%{transform:scale(0)}50%{transform:scale(1.2)}}
.flagA,.flagB{animation:flag .6s steps(1,end) infinite}
.flagB{animation-delay:-.3s}
@keyframes flag{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.lit,.ground{opacity:1}.air,.wink,.flagB{opacity:0}.guru{transform:translate(${feetX(goal) - 24}px,${goal.y - 64}px)}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="#1d1e23" stroke="#ffffff" stroke-opacity=".08"/>
${cards}
${flag}
<g class="guru">
<g class="air">${guru("jump")}</g>
<g class="ground">${guru("idle")}<g class="blink">${rects(blinkCells(), PX)}</g></g>
<g class="wink">${guru("idle", { wink: true })}${bubble(HI, 3, 44, -40)}${sparkle(-18, 18, "#5eead4")}${sparkle(60, 46, "#c9c6ff")}</g>
</g>
</svg>
`;
}

/* ---------- impact: the portfolio's four headline numbers, rolling up like an odometer ---------- */
function impact() {
  const W = 1280, H = 182, LOOP = 10, ROLL = 1.6, DIGIT = 34, LH = 64;
  const stats = [
    { value: "94", suffix: "%", lines: ["receipt-scanning accuracy", "at IPSER Labs"] },
    { value: "1", suffix: "M+", lines: ["options records processed in", "Snowflake in under 5 minutes"] },
    { value: "30", suffix: "%", lines: ["less unplanned aircraft downtime", "at Bharat Electronics"] },
    { value: "120", suffix: "", lines: ["question RAG eval with zero", "unauthorized retrievals"] },
  ];
  const styles = [];
  const tiles = stats.map((s, i) => {
    const x = 24 + i * 312, top = 16, numX = x + 24, base = top + 82;
    const digits = [...s.value].map((d, k) => {
      const name = `roll${i}${k}`, target = (10 + Number(d)) * LH, delay = 0.12 * k + 0.1 * i;
      styles.push(keyframes(name, LOOP, [[0, "transform:translateY(0)"], [delay, "transform:translateY(0)"], [delay + ROLL, `transform:translateY(-${target}px)`], [LOOP, `transform:translateY(-${target}px)`]]));
      const strip = Array.from({ length: 20 }, (_, n) => `<text x="${numX + k * DIGIT}" y="${base + n * LH}" class="num">${n % 10}</text>`).join("");
      return `<g clip-path="url(#win${i}${k})"><g class="strip" style="animation-name:${name}">${strip}</g></g>`;
    });
    const clips = [...s.value].map((_, k) => `<clipPath id="win${i}${k}"><rect x="${numX + k * DIGIT - 2}" y="${base - 54}" width="${DIGIT + 4}" height="66"/></clipPath>`).join("");
    return `<defs>${clips}</defs>
<rect x="${x}" y="${top}" width="296" height="150" rx="16" fill="#24252c" stroke="#ffffff" stroke-opacity=".08"/>
<rect x="${x + 24}" y="${top - 1}" width="56" height="3" rx="1.5" fill="${i % 2 ? "#5eead4" : "#a5a1f0"}"/>
${digits.join("")}
<text x="${numX + s.value.length * DIGIT + 2}" y="${base}" class="suffix">${s.suffix}</text>
${s.lines.map((l, k) => `<text x="${x + 24}" y="${top + 112 + k * 20}" class="label">${esc(l)}</text>`).join("")}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="94% receipt-scanning accuracy at IPSER Labs. 1M+ options records processed in Snowflake in under 5 minutes. 30% less unplanned aircraft downtime at Bharat Electronics. A 120-question RAG eval with zero unauthorized retrievals.">
<style>
text{${FONT}}
.num,.suffix{font-size:56px;font-weight:700;fill:url(#ink);font-variant-numeric:tabular-nums}
.suffix{font-size:40px}
.label{font-size:14px;fill:#a3a4b0}
.strip{animation:${LOOP}s cubic-bezier(.2,.8,.2,1) infinite}
${styles.join("\n")}
@media (prefers-reduced-motion:reduce){.strip{animation:none!important}${stats.flatMap((s, i) => [...s.value].map((d, k) => `.strip[style*="roll${i}${k}"]{transform:translateY(-${(10 + Number(d)) * LH}px)}`)).join("")}}
</style>
<defs><linearGradient id="ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ececf1"/><stop offset=".5" stop-color="#a5a1f0"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs>
${tiles.join("\n")}
</svg>
`;
}

mkdirSync(new URL("../assets/", import.meta.url), { recursive: true });
const ART = { "banner.svg": banner, "guru.svg": badge, "journey.svg": journey, "impact.svg": impact };
for (const [file, make] of Object.entries(ART)) writeFileSync(new URL(`../assets/${file}`, import.meta.url), make());
console.log(`wrote ${Object.keys(ART).map((f) => `assets/${f}`).join(", ")}`);

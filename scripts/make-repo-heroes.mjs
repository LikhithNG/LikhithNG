// Draws the hero image at the top of each project repo's README: the project's
// neon logo, name and stack beside its animated drawing from the portfolio.
// Writes docs/readme/hero.svg into each repo checkout.
//   node scripts/make-repo-heroes.mjs ../portfolio ../repos

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { loadPortfolio, FONT } from "./portfolio-source.mjs";
import { REPOS } from "./project-repos.mjs";
// How each name breaks into a big title and a smaller line under it.
const TITLES = {
  youtube: ["YouTube Trending", "Data Pipeline on AWS"],
  travelbuddy: ["TravelBuddy", "Multi-Agent Travel Planner"],
  medvault: ["MedVault", "Medical Records and Bill Checker"],
  greekshield: ["Greek Shield", "AI-Enhanced Options Risk", "Intelligence System"],
  hydroponic: ["Smart Hydroponic", "Farm Management System"],
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** The portfolio logo's own SVG, nested in place, with its ids prefixed so they can't clash. */
function logo(root, id, x, y, size) {
  const svg = readFileSync(`${root}/assets/logos/${id}.svg`, "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")
    .replace(/id="([^"]+)"/g, 'id="logo-$1"').replace(/url\(#([^)]+)\)/g, "url(#logo-$1)").replace(/href="#([^"]+)"/g, 'href="#logo-$1"');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${viewBox}">${inner}</svg>`;
}

function hero({ root, project, sceneCss, sceneInner }, id) {
  const p = project(id);
  const [c1, c2] = p.colors;
  const [title, ...sub] = TITLES[id];
  const W = 1200, H = 300, SCENE = { x: 470, y: 48, scale: 1.35 };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(p.name)}: ${esc(p.points[0])}" style="--c1:${c1};--c2:${c2}">
<style>
text{font-family:${FONT}}
${sceneCss}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
<radialGradient id="glow1" cx=".05" cy="0" r=".6"><stop offset="0" stop-color="${c1}" stop-opacity=".18"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
<radialGradient id="glow2" cx="1" cy="1" r=".6"><stop offset="0" stop-color="${c2}" stop-opacity=".12"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#ffffff" fill-opacity=".06"/></pattern>
<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>
<clipPath id="tile"><rect width="520" height="150" rx="10"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="#1d1e23"/><rect width="${W}" height="${H}" fill="url(#glow1)"/><rect width="${W}" height="${H}" fill="url(#glow2)"/>
${logo(root, id, 44, 40, 64)}
${p.date ? `<text x="124" y="80" font-size="13" font-weight="600" letter-spacing="2" fill="#5eead4">${esc(p.date.toUpperCase())}</text>` : ""}
<text x="44" y="164" font-size="38" font-weight="700" fill="#ececf1">${esc(title)}</text>
${sub.map((line, i) => `<text x="44" y="${198 + i * 27}" font-size="21" font-weight="500" fill="#c9c6ff">${esc(line)}</text>`).join("")}
<text x="44" y="${222 + sub.length * 27}" font-size="14" fill="#9a9ba6">${esc(p.stack.join(" · "))}</text>
<g transform="translate(${SCENE.x} ${SCENE.y}) scale(${SCENE.scale})">
<g clip-path="url(#tile)"><rect width="520" height="150" fill="#0b0d14"/><rect width="520" height="150" fill="url(#dots)"/>${sceneInner(id)}</g>
<rect x=".5" y=".5" width="519" height="149" rx="10" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
</g>
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".08"/>
</svg>
`;
}

const source = await loadPortfolio(process.argv[2]);
const reposDir = resolve(process.argv[3] ?? "../repos");
for (const [id, repo] of Object.entries(REPOS)) {
  mkdirSync(`${reposDir}/${repo}/docs/readme`, { recursive: true });
  writeFileSync(`${reposDir}/${repo}/docs/readme/hero.svg`, hero(source, id));
}
console.log(`wrote docs/readme/hero.svg into ${Object.values(REPOS).join(", ")}`);

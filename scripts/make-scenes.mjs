// Exports the portfolio's animated project drawings (js/project-scenes.js in
// LikhithNG/portfolio) as standalone SVGs for this README. On the site a drawing
// only moves while its card is hovered or on screen; here it always moves.
// Run with a checkout of the portfolio repo next to this one:
//   node scripts/make-scenes.mjs ../portfolio

import { writeFileSync, mkdirSync } from "node:fs";
import { loadPortfolio } from "./portfolio-source.mjs";

const FEATURED = ["youtube", "travelbuddy", "medvault", "greekshield", "finsight", "transit"];
const { project, sceneCss, sceneInner } = await loadPortfolio(process.argv[2]);

function sceneSvg(id) {
  const p = project(id);
  const [c1, c2] = p.colors;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 150" width="520" height="150" role="img" aria-label="Animated drawing of how ${p.name.replace(/&/g, "&amp;")} works" style="--c1:${c1};--c2:${c2}">
<style>
${sceneCss}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
<radialGradient id="a" cx=".1" cy="0" r=".75"><stop offset="0" stop-color="${c1}" stop-opacity=".22"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient>
<radialGradient id="b" cx=".95" cy="1" r=".7"><stop offset="0" stop-color="${c2}" stop-opacity=".14"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
<pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#ffffff" fill-opacity=".06"/></pattern>
<clipPath id="tile"><rect width="520" height="150" rx="10"/></clipPath>
</defs>
<g clip-path="url(#tile)">
<rect width="520" height="150" fill="#0b0d14"/><rect width="520" height="150" fill="url(#a)"/><rect width="520" height="150" fill="url(#b)"/><rect width="520" height="150" fill="url(#dots)"/>
${sceneInner(id)}
</g>
</svg>
`;
}

mkdirSync(new URL("../assets/scenes/", import.meta.url), { recursive: true });
for (const id of FEATURED) writeFileSync(new URL(`../assets/scenes/${id}.svg`, import.meta.url), sceneSvg(id));
console.log(`wrote ${FEATURED.length} scenes to assets/scenes/`);

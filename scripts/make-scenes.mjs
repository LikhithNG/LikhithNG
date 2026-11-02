// Exports the portfolio's animated project drawings (js/project-scenes.js in
// LikhithNG/portfolio) as standalone SVGs for this README. On the site a drawing
// only moves while its card is hovered or on screen; here it always moves.
// Run with a checkout of the portfolio repo next to this one:
//   node scripts/make-scenes.mjs ../portfolio

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FEATURED = ["youtube", "travelbuddy", "medvault", "greekshield", "finsight", "transit"];
const FONT = `"Segoe UI",-apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif`;
const LIVE = ".card.project:is(:hover, :has(:focus-visible), .is-live) ";

const portfolio = resolve(process.argv[2] ?? "../portfolio");
const { projectScene } = await import(pathToFileURL(`${portfolio}/js/project-scenes.js`));
const { PROFILE } = await import(pathToFileURL(`${portfolio}/js/profile.js`));

/** Top-level CSS blocks ("selector { ... }", including @keyframes) of a stylesheet. */
function cssBlocks(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === "{") depth++;
    if (clean[i] === "}" && --depth === 0) {
      blocks.push(clean.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  return blocks;
}

/** The drawing styles, with the "only while looked at" condition removed. */
function sceneCss() {
  const css = readFileSync(`${portfolio}/projects.css`, "utf8");
  return cssBlocks(css)
    .filter((b) => (b.includes(".sc-") && !b.startsWith("@")) || b.startsWith("@keyframes sc-"))
    .map((b) => b.replaceAll(LIVE, "").replaceAll("var(--font)", FONT))
    .join("\n");
}

function sceneSvg(id, css) {
  const project = PROFILE.projects.find((p) => p.id === id);
  const [c1, c2] = project.colors;
  const inner = projectScene(id).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 150" width="520" height="150" role="img" aria-label="Animated drawing of how ${project.name.replace(/&/g, "&amp;")} works" style="--c1:${c1};--c2:${c2}">
<style>
${css}
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
${inner}
</g>
</svg>
`;
}

const css = sceneCss();
mkdirSync(new URL("../assets/scenes/", import.meta.url), { recursive: true });
for (const id of FEATURED) writeFileSync(new URL(`../assets/scenes/${id}.svg`, import.meta.url), sceneSvg(id, css));
console.log(`wrote ${FEATURED.length} scenes to assets/scenes/`);

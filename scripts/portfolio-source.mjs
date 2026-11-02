// Reads what the README art borrows from a checkout of LikhithNG/portfolio:
// the profile data, the animated project drawings, and the drawings' CSS with
// the site's "only while looked at" condition removed, so they always move.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FONT = `"Segoe UI",-apple-system,BlinkMacSystemFont,Inter,Helvetica,Arial,sans-serif`;
const LIVE = ".card.project:is(:hover, :has(:focus-visible), .is-live) ";

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

export async function loadPortfolio(path = "../portfolio") {
  const root = resolve(path);
  const { projectScene } = await import(pathToFileURL(`${root}/js/project-scenes.js`));
  const { PROFILE } = await import(pathToFileURL(`${root}/js/profile.js`));
  const sceneCss = cssBlocks(readFileSync(`${root}/projects.css`, "utf8"))
    .filter((b) => (b.includes(".sc-") && !b.startsWith("@")) || b.startsWith("@keyframes sc-"))
    .map((b) => b.replaceAll(LIVE, "").replaceAll("var(--font)", FONT))
    .join("\n");
  const project = (id) => PROFILE.projects.find((p) => p.id === id);
  /** A project's drawing without its outer <svg>, ready to place inside another SVG. */
  const sceneInner = (id) => projectScene(id).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return { root, PROFILE, project, sceneCss, sceneInner };
}

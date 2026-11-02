// Puts a themed header at the top of each project repo's README: the hero
// image (scripts/make-repo-heroes.mjs), links to the portfolio and profile, and
// an "At a glance" summary taken from the portfolio's profile data. Everything
// already in the README stays, unchanged, below it. Safe to run again.
//   node scripts/add-repo-headers.mjs ../portfolio ../repos

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadPortfolio } from "./portfolio-source.mjs";
import { REPOS } from "./project-repos.mjs";

const START = "<!-- themed-header:start -->";
const END = "<!-- themed-header:end -->";
const PORTFOLIO = "https://likhith-ng-portfolio.vercel.app";
const badge = (label, message, colour) =>
  `https://img.shields.io/badge/${encodeURIComponent(label.replace(/-/g, "--"))}-${encodeURIComponent(message.replace(/-/g, "--"))}-${colour}?style=for-the-badge&labelColor=1d1e23`;
const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

function header(p) {
  const page = `${PORTFOLIO}/#proj-${p.id}`;
  const links = [
    `<a href="${page}"><img alt="See it on my portfolio" src="${badge("see it on", "my portfolio", "a5a1f0")}"></a>`,
    p.app && `<a href="${p.app}"><img alt="Try the live app" src="${badge("live app", "try it", "fb7185")}"></a>`,
    `<a href="https://github.com/LikhithNG"><img alt="More of my work" src="${badge("more of my work", "github.com/LikhithNG", "5eead4")}"></a>`,
  ].filter(Boolean);
  return `${START}
<a href="${page}"><img src="docs/readme/hero.svg" width="100%" alt="${attr(`${p.name}: ${p.points[0]}`)}"></a>

<p align="center">
  ${links.join("\n  ")}
</p>

**At a glance**

${p.points.map((point) => `- ${point}`).join("\n")}

---
${END}

`;
}

const { project } = await loadPortfolio(process.argv[2]);
const reposDir = resolve(process.argv[3] ?? "../repos");
for (const [id, repo] of Object.entries(REPOS)) {
  const file = `${reposDir}/${repo}/README.md`;
  const readme = readFileSync(file, "utf8");
  const body = readme.includes(START) ? readme.slice(readme.indexOf(END) + END.length).replace(/^\s+/, "") : readme;
  writeFileSync(file, header(project(id)) + body);
}
console.log(`added the themed header to ${Object.values(REPOS).join(", ")}`);

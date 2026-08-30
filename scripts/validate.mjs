import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

import { loadRegistry, validateRegistry } from "../src/registry.mjs";
import { validateSvg } from "../src/svg.mjs";

const root = process.cwd();
const dist = join(root, "dist");

async function mustExist(path) {
  await access(path);
}

const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
const errors = validateRegistry(projects);
for (const project of projects) {
  for (const variant of ["color", "monochrome", "reversed"]) {
    const path = join(dist, project.id, `glyph-${variant}.svg`);
    try {
      const svg = await readFile(path, "utf8");
      errors.push(...validateSvg(`${project.id}/glyph-${variant}.svg`, svg, project));
    } catch (error) {
      errors.push(`${project.id}: missing readable glyph-${variant}.svg (${error.code ?? error.message})`);
    }
  }
  for (const file of ["favicon.ico", "favicon.svg", "og.png", "readme-header.png", "checksums.txt"]) {
    try { await mustExist(join(dist, project.id, file)); }
    catch { errors.push(`${project.id}: missing ${file}`); }
  }
}

try {
  const index = JSON.parse(await readFile(join(dist, "index.json"), "utf8"));
  if (index.version !== 1) errors.push("dist/index.json must declare registry version 1");
  if (!Array.isArray(index.projects) || index.projects.length !== 12) errors.push("dist/index.json must contain 12 projects");
} catch (error) {
  errors.push(`dist/index.json is invalid: ${error.message}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`validation: ${error}`);
  process.exitCode = 1;
} else {
  console.log("Structural and security validation passed: 12 OSS projects");
}

import { getGlyphDefinition } from "./glyphs.mjs";
import { resolveCanonicalProject } from "./svg.mjs";
import { buildWordmark } from "./wordmark.mjs";

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function glyphGroup(project) {
  const glyph = getGlyphDefinition(project.registryId);
  return `<g transform="translate(4 8) scale(1)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph.paths.map((d) => `<path d="${d}" />`).join("")}</g>`;
}

function outlinedName(name, x, y) {
  const raw = buildWordmark(name);
  const inner = raw.match(/<g[^>]*>([\s\S]*)<\/g>/)?.[1] ?? "";
  return `<g transform="translate(${x} ${y}) scale(2.25)" fill="currentColor">${inner}</g>`;
}

export { buildWordmark };

export function buildProjectLockup(project, { endorsement = false } = {}) {
  const canonical = resolveCanonicalProject(project);
  const runtime = canonical.relationships.runtime === "javascript";
  const accessibleParts = [canonical.name, runtime ? "JavaScript implementation" : null, endorsement ? "Open source by DevsLab" : null]
    .filter(Boolean).join(", ");
  const endorsementGroup = endorsement
    ? `<g data-endorsement="Open source by DevsLab" aria-label="Open source by DevsLab"><path d="M48 39H202" stroke="currentColor" stroke-width="1" opacity=".35" />${outlinedName("Open source by DevsLab", 48, 40)}</g>`
    : "";
  const runtimeGroup = runtime
    ? `<g data-runtime-layer="neutral" data-runtime-label="JavaScript implementation" aria-label="JavaScript implementation"><path d="M48 8H77V20H48Z" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M56 12H69M64 10L69 12L64 14" fill="none" stroke="currentColor" stroke-width="1.5" /></g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 64" role="img" aria-label="${escapeAttribute(accessibleParts)}" data-oss-lockup="${canonical.registryId}">${glyphGroup(canonical)}${outlinedName(canonical.name, 48, 18)}${runtimeGroup}${endorsementGroup}</svg>`;
}

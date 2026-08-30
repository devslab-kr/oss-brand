import { buildGlyphSvg, resolveCanonicalProject } from "./svg.mjs";

const CANVASES = Object.freeze({ og: { width: 1200, height: 630 }, readme: { width: 1280, height: 320 } });

function escapeText(value) {
  return String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

function glyph(project, x, y, size) {
  const svg = buildGlyphSvg(project, { variant: "color" });
  const group = svg.match(/(<g[^>]*>[\s\S]*<\/g>)<\/svg>$/)?.[1] ?? "";
  return `<g transform="translate(${x} ${y}) scale(${size / 32})">${group}</g>`;
}

export function buildSocialSvg(project, { kind = "og" } = {}) {
  const canonical = resolveCanonicalProject(project);
  const canvas = CANVASES[kind];
  if (!canvas) throw new RangeError(`Unsupported social asset kind: ${kind}`);
  const name = escapeText(canonical.name);
  const artifact = escapeText(canonical.artifact.coordinate);
  const markSize = kind === "og" ? 176 : 128;
  const markY = kind === "og" ? 118 : 88;
  const textX = kind === "og" ? 280 : 232;
  const nameY = kind === "og" ? 270 : 156;
  const metaY = kind === "og" ? 332 : 206;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" role="img" aria-label="${name} — Open source by DevsLab"><rect width="${canvas.width}" height="${canvas.height}" fill="#18181B"/><path d="M0 ${canvas.height - 56}H${canvas.width}" stroke="#0E7490" stroke-width="2" opacity=".45"/>${glyph(canonical, 72, markY, markSize)}<text x="${textX}" y="${nameY}" fill="#FAFAFA" font-family="Geist, Arial, sans-serif" font-size="${kind === "og" ? 58 : 42}" font-weight="600">${name}</text><text x="${textX}" y="${metaY}" fill="#A1A1AA" font-family="ui-monospace, monospace" font-size="${kind === "og" ? 24 : 18}">${artifact}</text><text x="${textX}" y="${metaY + (kind === "og" ? 44 : 34)}" fill="#22D3EE" font-family="Geist, Arial, sans-serif" font-size="${kind === "og" ? 22 : 17}">Open source by DevsLab</text></svg>`;
}

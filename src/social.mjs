import { buildGlyphSvg, resolveCanonicalProject } from "./svg.mjs";
import { buildWordmark } from "./wordmark.mjs";

const CANVASES = Object.freeze({
  og: { width: 1200, height: 630, mark: [72, 118, 176], textX: 280, name: [194, 58], artifact: [292, 24], endorsement: [338, 22] },
  readme: { width: 1280, height: 320, mark: [72, 88, 128], textX: 232, name: [116, 42], artifact: [180, 18], endorsement: [216, 17] },
  "store-small": { width: 440, height: 280, mark: [28, 72, 96], textX: 150, name: [76, 34], artifact: [132, 13], endorsement: [160, 13] },
  "store-marquee": { width: 1400, height: 560, mark: [92, 156, 184], textX: 334, name: [170, 56], artifact: [264, 23], endorsement: [308, 22] },
  "store-screenshot": { width: 1280, height: 800, mark: [84, 220, 188], textX: 334, name: [220, 54], artifact: [312, 22], endorsement: [358, 21] },
});

function escapeText(value) {
  return String(value).replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
}

function glyph(project, x, y, size) {
  const svg = buildGlyphSvg(project, { variant: "color" });
  const group = svg.match(/(<g[^>]*>[\s\S]*<\/g>)<\/svg>$/)?.[1] ?? "";
  return `<g transform="translate(${x} ${y}) scale(${size / 32})">${group}</g>`;
}

export function buildOutlinedLabel(label, { x, top, height, fill }) {
  const source = buildWordmark(label);
  const [, y, viewHeight] = source.match(/viewBox="0\s+(-?[\d.]+)\s+[\d.]+\s+([\d.]+)"/) ?? [];
  const group = source.match(/(<g[^>]*>[\s\S]*<\/g>)<\/svg>$/)?.[1];
  if (!y || !viewHeight || !group) throw new Error("Could not read outlined Geist wordmark");
  const scale = height / Number(viewHeight);
  return `<g transform="translate(${x} ${top - Number(y) * scale}) scale(${scale})" color="${fill}">${group}</g>`;
}

export function buildSocialSvg(project, { kind = "og" } = {}) {
  const canonical = resolveCanonicalProject(project);
  const canvas = CANVASES[kind];
  if (!canvas) throw new RangeError(`Unsupported social asset kind: ${kind}`);
  const name = escapeText(canonical.name);
  const [markX, markY, markSize] = canvas.mark;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}" role="img" aria-label="${name} — Open source by DevsLab"><rect width="${canvas.width}" height="${canvas.height}" fill="#18181B"/><path d="M0 ${canvas.height - 56}H${canvas.width}" stroke="#0E7490" stroke-width="2" opacity=".45"/>${glyph(canonical, markX, markY, markSize)}${buildOutlinedLabel(canonical.name, { x: canvas.textX, top: canvas.name[0], height: canvas.name[1], fill: "#FAFAFA" })}${buildOutlinedLabel(canonical.artifact.coordinate, { x: canvas.textX, top: canvas.artifact[0], height: canvas.artifact[1], fill: "#A1A1AA" })}${buildOutlinedLabel("Open source by DevsLab", { x: canvas.textX, top: canvas.endorsement[0], height: canvas.endorsement[1], fill: "#22D3EE" })}</svg>`;
}

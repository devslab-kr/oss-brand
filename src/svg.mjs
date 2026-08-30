import { getGlyphDefinition } from "./glyphs.mjs";

const VARIANT_COLORS = Object.freeze({
  monochrome: "#18181B",
  reversed: "#FFFFFF",
});
const PROHIBITED_ELEMENTS = ["script", "foreignObject", "image", "iframe", "object", "embed", "use", "style"];
const GRAPHICS = /<(?:path|rect|circle|line|polyline|polygon)\b[^>]*>/gi;

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function colorFor(project, variant) {
  if (variant === "color") return project?.ossAccent?.light ?? "#0E7490";
  if (variant in VARIANT_COLORS) return VARIANT_COLORS[variant];
  throw new RangeError(`Unsupported glyph variant: ${variant}`);
}

export function buildGlyphSvg(project, { variant = "color" } = {}) {
  if (!project?.registryId || !project?.id) throw new TypeError("A registered OSS project is required");
  const glyph = getGlyphDefinition(project.registryId);
  const color = colorFor(project, variant);
  const titleId = `oss-${project.registryId}-title`;
  const paths = glyph.paths.map((d) => `<path d="${d}" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${glyph.viewBox}" role="img" aria-labelledby="${titleId}" data-oss-project="${escapeAttribute(project.registryId)}" data-variant="${variant}"><title id="${titleId}">${escapeAttribute(project.name)}</title><g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}

function geometryNumbers(svg) {
  const numbers = [];
  for (const tag of svg.match(GRAPHICS) ?? []) {
    const d = tag.match(/\bd="([^"]*)"/i)?.[1];
    if (d) numbers.push(...(d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
    for (const attribute of ["x", "y", "x1", "x2", "y1", "y2", "cx", "cy"]) {
      const value = tag.match(new RegExp(`\\b${attribute}="(-?\\d+(?:\\.\\d+)?)"`, "i"))?.[1];
      if (value !== undefined) numbers.push(Number(value));
    }
  }
  return numbers;
}

export function validateSvg(fileName, svg, project) {
  const errors = [];
  const prefix = `${fileName}:`;
  if (typeof svg !== "string") return [`${prefix} SVG must be a string`];
  if (!/^<svg\b/i.test(svg)) errors.push(`${prefix} root element must be svg`);
  if (!/\bviewBox="0 0 32 32"/i.test(svg)) errors.push(`${prefix} must use viewBox \"0 0 32 32\"`);
  if (!/\bstroke-width="2"/i.test(svg)) errors.push(`${prefix} must use a 2-unit primary outline`);
  if (/\bstroke-width="(?!2(?:\.0+)?")/i.test(svg)) errors.push(`${prefix} must use a 2-unit primary outline`);
  if (!/\bdata-oss-project="O\d{2}"/.test(svg) && project?.registryId) errors.push(`${prefix} missing OSS project identity`);

  for (const element of PROHIBITED_ELEMENTS) {
    if (new RegExp(`<${element}\\b`, "i").test(svg)) errors.push(`${prefix} prohibited element: ${element}`);
  }
  if (/<(?:animate|set)\b/i.test(svg)) errors.push(`${prefix} prohibited animation element`);
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push(`${prefix} prohibited event handler`);
  if (/\b(?:href|xlink:href)="(?:https?:|data:|javascript:)/i.test(svg)) errors.push(`${prefix} external resource is not allowed`);
  if (/\b(?:font-family|@font-face)\b/i.test(svg)) errors.push(`${prefix} runtime font dependency is not allowed`);

  const coordinates = geometryNumbers(svg);
  if (coordinates.some((coordinate) => coordinate < 4 || coordinate > 28)) {
    errors.push(`${prefix} geometry must remain inside the 4-unit safety margin`);
  }
  return errors;
}

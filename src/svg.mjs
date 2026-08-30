import { getGlyphDefinition } from "./glyphs.mjs";
import { APPROVED_REGISTRY_CONTRACT } from "./registry-contract.mjs";

const VARIANT_COLORS = Object.freeze({
  monochrome: "#18181B",
  reversed: "#FFFFFF",
});
const PROHIBITED_ELEMENTS = ["script", "foreignObject", "image", "iframe", "object", "embed", "use", "style"];
const GRAPHICS = /<(?:path|rect|circle|line|polyline|polygon)\b[^>]*>/gi;

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

export function resolveCanonicalProject(project) {
  if (!project || typeof project !== "object") throw new TypeError("A registered OSS project is required");
  const canonical = APPROVED_REGISTRY_CONTRACT.find(({ registryId }) => registryId === project.registryId);
  if (!canonical) throw new RangeError(`Unknown approved OSS registry id: ${project.registryId ?? "missing"}`);
  if (project.id !== canonical.id) {
    throw new TypeError(`Project id ${project.id ?? "missing"} does not match approved registry id ${canonical.registryId}`);
  }
  return canonical;
}

function colorFor(project, variant) {
  if (variant === "color") return project.ossAccent.light;
  if (variant in VARIANT_COLORS) return VARIANT_COLORS[variant];
  throw new RangeError(`Unsupported glyph variant: ${variant}`);
}

export function buildGlyphSvg(project, { variant = "color" } = {}) {
  const canonical = resolveCanonicalProject(project);
  const glyph = getGlyphDefinition(canonical.registryId);
  const color = colorFor(canonical, variant);
  const titleId = `oss-${canonical.registryId}-title`;
  const paths = glyph.paths.map((d) => `<path d="${d}" />`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${glyph.viewBox}" role="img" aria-labelledby="${titleId}" data-oss-project="${canonical.registryId}" data-variant="${variant}"><title id="${titleId}">${escapeAttribute(canonical.name)}</title><g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
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
  let canonical;
  try {
    canonical = resolveCanonicalProject(project);
  } catch (error) {
    return [`${prefix} ${error.message}`];
  }
  if (typeof svg !== "string") return [`${prefix} SVG must be a string`];
  if (!/^<svg\b/i.test(svg)) errors.push(`${prefix} root element must be svg`);
  if (!/\bviewBox="0 0 32 32"/i.test(svg)) errors.push(`${prefix} must use viewBox \"0 0 32 32\"`);
  if (!/\bstroke-width="2"/i.test(svg)) errors.push(`${prefix} must use a 2-unit primary outline`);
  if (/\bstroke-width="(?!2(?:\.0+)?")/i.test(svg)) errors.push(`${prefix} must use a 2-unit primary outline`);
  const emittedProject = svg.match(/\bdata-oss-project="([^"]+)"/i)?.[1];
  if (!emittedProject) errors.push(`${prefix} missing OSS project identity`);
  if (emittedProject && emittedProject !== canonical.registryId) {
    errors.push(`${prefix} OSS project identity must equal ${canonical.registryId}`);
  }

  for (const element of PROHIBITED_ELEMENTS) {
    if (new RegExp(`<${element}\\b`, "i").test(svg)) errors.push(`${prefix} prohibited element: ${element}`);
  }
  if (/<(?:linearGradient|radialGradient)\b/i.test(svg)) errors.push(`${prefix} prohibited gradient`);
  if (/<(?:animate|set)\b/i.test(svg)) errors.push(`${prefix} prohibited animation element`);
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push(`${prefix} prohibited event handler`);
  if (/\b(?:href|xlink:href)="(?:https?:|data:|javascript:)/i.test(svg)) errors.push(`${prefix} external resource is not allowed`);
  if (/\b(?:font-family|@font-face)\b/i.test(svg)) errors.push(`${prefix} runtime font dependency is not allowed`);

  const variant = svg.match(/\bdata-variant="([^"]+)"/i)?.[1];
  const paint = svg.match(/\bstroke="(#[0-9A-Fa-f]{6})"/i)?.[1]?.toUpperCase();
  const expectedPaint = variant === "color"
    ? canonical.ossAccent.light
    : variant === "monochrome"
      ? VARIANT_COLORS.monochrome
      : variant === "reversed"
        ? VARIANT_COLORS.reversed
        : undefined;
  if (!variant || !expectedPaint) errors.push(`${prefix} invalid glyph variant`);
  else if (paint !== expectedPaint.toUpperCase()) errors.push(`${prefix} invalid ${variant} paint`);

  const coordinates = geometryNumbers(svg);
  if (coordinates.some((coordinate) => coordinate < 4 || coordinate > 28)) {
    errors.push(`${prefix} geometry must remain inside the 4-unit safety margin`);
  }
  return errors;
}

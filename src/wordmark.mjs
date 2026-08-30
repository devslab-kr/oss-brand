import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as fontkit from "fontkit";

const require = createRequire(import.meta.url);
const FONT_PACKAGE_PATH = "@fontsource/geist/files/geist-latin-400-normal.woff2";
const FONT_FILE = require.resolve(FONT_PACKAGE_PATH);
const FONT = fontkit.create(readFileSync(FONT_FILE));
const SCALE = 1 / FONT.unitsPerEm;

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function glyphPath(character, offset) {
  const glyph = FONT.glyphForCodePoint(character.codePointAt(0));
  if (!glyph || glyph.id === 0) throw new RangeError(`Geist does not provide an outline for ${JSON.stringify(character)}`);
  const path = glyph.path.toSVG();
  if (!path) return { path: "", advance: glyph.advanceWidth * SCALE };
  return {
    path: `<path d="${path}" transform="matrix(${SCALE} 0 0 ${-SCALE} ${offset} 0)" />`,
    advance: glyph.advanceWidth * SCALE,
  };
}

export function buildWordmark(name) {
  if (typeof name !== "string" || name.trim() === "") throw new TypeError("A non-empty project name is required");
  let cursor = 0;
  const paths = [...name].map((character) => {
    const outline = glyphPath(character, cursor);
    cursor += outline.advance;
    return outline.path;
  }).join("");
  const width = Math.max(1, Math.ceil(cursor * 1000) / 1000);
  const label = escapeAttribute(name);
  const ascent = FONT.ascent * SCALE;
  const descent = Math.abs(FONT.descent * SCALE);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-ascent} ${width} ${ascent + descent}" role="img" aria-label="${label}" data-wordmark="geist-outline" data-font-source="${FONT_PACKAGE_PATH}" data-font-license="OFL-1.1"><g fill="currentColor">${paths}</g></svg>`;
}

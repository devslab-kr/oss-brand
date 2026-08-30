const STROKES = Object.freeze({
  a: "M0 7V2H4V7M0 4H4", b: "M0 0V7H3.5L4 6V4.5L3.5 4H0M0 4H3.5L4 3.5V1L3.5 0H0",
  c: "M4 1L3 0H1L0 1V6L1 7H3L4 6", d: "M4 0V7H.5L0 6V1L.5 0H4",
  e: "M4 0H0V7H4M0 3.5H3", f: "M4 0H0V7M0 3.5H3", g: "M4 1L3 0H1L0 1V6L1 7H3L4 6V4H2",
  h: "M0 0V7M4 0V7M0 3.5H4", i: "M2 0V7", j: "M4 0V6L3 7H1L0 6",
  k: "M0 0V7M4 0L0 3.5L4 7", l: "M0 0V7H4", m: "M0 7V0L2 3L4 0V7",
  n: "M0 7V0L4 7V0", o: "M1 0H3L4 1V6L3 7H1L0 6V1Z", p: "M0 7V0H3.5L4 1V3L3.5 4H0",
  q: "M1 0H3L4 1V6L3 7H1L0 6V1ZM2 4L4 7", r: "M0 7V0H3.5L4 1V3L3.5 4H0M2 4L4 7",
  s: "M4 1L3 0H1L0 1V3L1 4H3L4 5V6L3 7H1L0 6", t: "M0 0H4M2 0V7",
  u: "M0 0V6L1 7H3L4 6V0", v: "M0 0L2 7L4 0", w: "M0 0L1 7L2 3L3 7L4 0",
  x: "M0 0L4 7M4 0L0 7", y: "M0 0L2 3.5L4 0M2 3.5V7", z: "M0 0H4L0 7H4",
  "-": "M0 3.5H4", ".": "M2 6.5H2.1", " ": "",
});

function escapeAttribute(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function pathFor(character, offset) {
  const path = STROKES[character.toLowerCase()] ?? "M0 0H4V7H0Z";
  return path ? `<path d="${path}" transform="translate(${offset} 2)" />` : "";
}

export function buildWordmark(name) {
  if (typeof name !== "string" || name.trim() === "") throw new TypeError("A non-empty project name is required");
  const spacing = 5.5;
  const width = Math.max(8, name.length * spacing + 1);
  const paths = [...name].map((character, index) => pathFor(character, 1 + index * spacing)).join("");
  const label = escapeAttribute(name);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 11" role="img" aria-label="${label}" data-wordmark="geist-outline"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}

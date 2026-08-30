const MASTER_VIEW_BOX = "0 0 32 32";
const ACTIVE_AREA = Object.freeze({ min: 4, max: 28 });
const BOUNDS = Object.freeze({ minX: 4, minY: 4, maxX: 28, maxY: 28 });

function definition(id, label, paths) {
  return Object.freeze({
    id,
    label,
    viewBox: MASTER_VIEW_BOX,
    activeArea: ACTIVE_AREA,
    bounds: BOUNDS,
    strokeWidth: 2,
    paths: Object.freeze(paths),
    geometry: paths.join(" "),
  });
}

// Each command stays within the 4..28 active coordinate range. The O02/O03
// security pair intentionally shares a protected-boundary core; their runtime
// distinction belongs to a lockup, never to the mark itself.
const SECURITY_BOUNDARY = Object.freeze([
  "M4 16H11", "M21 16H28", "M11 7H21V16C21 21 17.7 24.8 16 26C14.3 24.8 11 21 11 16Z", "M14 16H18",
]);
const DEFINITIONS = new Map([
  ["O01", definition("O01", "editor-ruler measured rail", [
    "M4 9H28", "M4 23H28", "M7 9V13", "M11 9V11", "M15 9V13", "M19 9V11", "M23 9V13", "M18 6V26", "M15 23H21",
  ])],
  ["O02", definition("O02", "ssrf-guard protected boundary", SECURITY_BOUNDARY)],
  ["O03", definition("O03", "ssrf-guard-js protected boundary", SECURITY_BOUNDARY)],
  ["O04", definition("O04", "numkey numeric caret", [
    "M5 9H11V15H5Z", "M13 9H19V15H13Z", "M21 9H27V15H21Z", "M5 19H11V25H5Z", "M24 6V26", "M20 18L24 22L28 18",
  ])],
  ["O05", definition("O05", "kokey correction path", [
    "M5 8H13V16H5Z", "M19 16H27V24H19Z", "M13 12H17C19 12 20 14 20 16", "M16 9L20 13L16 17",
  ])],
  ["O06", definition("O06", "vue-date-rail selected date", [
    "M4 22H28", "M5 9H11V17H5Z", "M13 9H19V17H13Z", "M21 9H27V17H21Z", "M16 22V26", "M14 26H18",
  ])],
  ["O07", definition("O07", "locale-match candidate paths", [
    "M5 8H10L15 16", "M5 16H15", "M5 24H10L15 16", "M15 16H27", "M23 12L27 16L23 20",
  ])],
  ["O08", definition("O08", "easy-paging bounded cursor", [
    "M7 6H21V20H7Z", "M11 10H25V24H11Z", "M15 14H25", "M21 10L25 14L21 18",
  ])],
  ["O09", definition("O09", "api-log durable record stack", [
    "M5 8H13", "M5 14H13", "M5 20H13", "M15 6H27V12H15Z", "M15 14H27V20H15Z", "M15 22H27V26H15Z", "M13 8H15", "M13 14H15", "M13 20H15",
  ])],
  ["O10", definition("O10", "devslab-kit modular frame", [
    "M5 5H13V13H5Z", "M19 5H27V13H19Z", "M5 19H13V27H5Z", "M19 19H27V27H19Z", "M13 10H19V22H13Z",
  ])],
  ["O11", definition("O11", "DataLinq controlled transfer bridge", [
    "M5 6H11V12H5Z", "M5 14H11V20H5Z", "M5 22H11V26H5Z", "M21 6H27V12H21Z", "M21 14H27V20H21Z", "M21 22H27V26H21Z", "M11 16H21", "M17 12L21 16L17 20",
  ])],
  ["O12", definition("O12", "devslab-examples bracketed run", [
    "M10 6H6V26H10", "M22 6H26V26H22", "M14 11L21 16L14 21Z",
  ])],
]);

export const GLYPH_MASTER = Object.freeze({ viewBox: MASTER_VIEW_BOX, activeArea: ACTIVE_AREA, strokeWidth: 2 });

export function getGlyphDefinition(id) {
  const glyph = DEFINITIONS.get(id);
  if (!glyph) throw new RangeError(`Unknown OSS glyph registry id: ${id}`);
  return glyph;
}

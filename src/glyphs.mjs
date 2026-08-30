import { Q_FRAME, ROUTE_CONTRACT, getRouteDefinition } from "./q-line.mjs";

export const GLYPH_MASTER = Object.freeze({
  viewBox: Q_FRAME.viewBox,
  activeArea: Object.freeze({ min: 5, max: 27 }),
  strokeWidth: ROUTE_CONTRACT.strokeWidth,
});

export function getGlyphDefinition(id) {
  const route = getRouteDefinition(id);
  return Object.freeze({
    id,
    label: route.meaning,
    viewBox: Q_FRAME.viewBox,
    activeArea: GLYPH_MASTER.activeArea,
    bounds: Object.freeze({ minX: 5, minY: 5, maxX: 27, maxY: 27 }),
    strokeWidth: ROUTE_CONTRACT.strokeWidth,
    frame: Q_FRAME,
    paths: route.paths,
    geometry: route.paths.join(" "),
  });
}

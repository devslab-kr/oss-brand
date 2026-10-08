function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export const Q_FRAME = deepFreeze({
  viewBox: "0 0 32 32",
  rear: { x: 5, y: 5, width: 16, height: 16, radius: 2 },
  front: { x: 11, y: 11, width: 16, height: 16, radius: 2 },
});

function validatePath(path) {
  if (typeof path !== "string" || !/^M[0-9 .MLHVZ-]+$/.test(path)) {
    throw new TypeError(`Invalid Q-line route path: ${path}`);
  }
  const coordinates = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (coordinates.some((value) => value < 13 || value > 25)) {
    throw new RangeError(`Q-line route leaves the 13..25 safety area: ${path}`);
  }
  return true;
}

export const ROUTE_CONTRACT = deepFreeze({
  min: 13,
  max: 25,
  strokeWidth: 2.4,
  maxPrimitives: 3,
  linecap: "round",
  linejoin: "round",
  validatePath,
});

const SECURITY_ROUTE = deepFreeze({
  meaning: "inbound path interrupted at a boundary",
  paths: ["M13 18H17", "M21 14V22"],
});

const ROUTES = new Map([
  ["O01", { meaning: "measured rail with unequal stops", paths: ["M13 16H25", "M16 16V22", "M22 16V19"] }],
  ["O02", SECURITY_ROUTE],
  ["O03", SECURITY_ROUTE],
  ["O04", { meaning: "numeric value stepped up and down", paths: ["M15 16L19 13L23 16", "M15 20L19 23L23 20"] }],
  ["O05", { meaning: "single confirmed correction stroke", paths: ["M14 19L18 23L25 14"] }],
  ["O06", { meaning: "one raised selection on a date rail", paths: ["M13 22H25", "M16 22V15H22V22"] }],
  ["O07", { meaning: "candidate paths resolving to one output", paths: ["M13 14L18 18H25", "M13 22L18 18"] }],
  ["O08", { meaning: "repeated forward page steps", paths: ["M15 14L19 18L15 22", "M21 14L25 18L21 22"] }],
  ["O09", { meaning: "three event records entering one stack", paths: ["M13 14H23", "M13 18H25", "M13 22H21"] }],
  ["O10", { meaning: "modular assembly cross", paths: ["M19 14V24", "M14 19H24"] }],
  ["O11", { meaning: "opposing transfer lanes", paths: ["M13 15H25L22 13", "M25 21H13L16 23"] }],
  ["O12", { meaning: "forward run marker", paths: ["M16 14L24 19L16 24Z"] }],
  ["O13", { meaning: "connected workspace panes joined by one internal route", paths: ["M14 21V15H19V18H24V23H14", "M14 18H19"] }],
].map(([id, route]) => {
  const frozen = deepFreeze(route);
  if (frozen.paths.length > ROUTE_CONTRACT.maxPrimitives) throw new RangeError(`${id} has too many route primitives`);
  for (const path of frozen.paths) ROUTE_CONTRACT.validatePath(path);
  return [id, frozen];
}));

export function getRouteDefinition(id) {
  const route = ROUTES.get(id);
  if (!route) throw new RangeError(`Unknown OSS route registry id: ${id}`);
  return route;
}

export function routeSignature(route) {
  return route.paths.join(" ");
}

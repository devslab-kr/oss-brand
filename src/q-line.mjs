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
  strokeWidth: 1.8,
  maxPrimitives: 4,
  linecap: "round",
  linejoin: "round",
  validatePath,
});

const SECURITY_ROUTE = deepFreeze({
  meaning: "inbound path interrupted at a boundary",
  paths: ["M13 18H17", "M21 18H25", "M19 14V22"],
});

const ROUTES = new Map([
  ["O01", { meaning: "measured rail with unequal stops", paths: ["M13 16H25", "M15 16V22", "M19 16V19", "M23 16V22"] }],
  ["O02", SECURITY_ROUTE],
  ["O03", SECURITY_ROUTE],
  ["O04", { meaning: "grouped numeric positions crossed by a caret", paths: ["M14 14V18", "M19 14V18", "M24 14V18", "M19 20L22 23L25 20"] }],
  ["O05", { meaning: "correction path between input states", paths: ["M13 15L18 20L25 13", "M22 13H25V16"] }],
  ["O06", { meaning: "three positions with one raised selection", paths: ["M13 20H25", "M14 18V22", "M19 14V20", "M24 18V22"] }],
  ["O07", { meaning: "three candidate paths resolving to one output", paths: ["M13 14L18 18", "M13 18H18", "M13 22L18 18H25"] }],
  ["O08", { meaning: "bounded forward page step", paths: ["M14 15H22", "M19 13L23 16L19 19", "M14 22H22"] }],
  ["O09", { meaning: "three event records entering one stack", paths: ["M13 14H23", "M13 18H25", "M13 22H21"] }],
  ["O10", { meaning: "modular assembly cross", paths: ["M19 13V23", "M14 18H24"] }],
  ["O11", { meaning: "controlled bidirectional data transfer", paths: ["M13 15H24", "M21 13L24 15L21 17", "M25 21H14"] }],
  ["O12", { meaning: "bracketed run path", paths: ["M15 13V23", "M23 13V23", "M18 15L22 18L18 21Z"] }],
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

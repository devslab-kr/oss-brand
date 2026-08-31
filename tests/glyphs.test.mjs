import assert from "node:assert/strict";
import test from "node:test";

import { getGlyphDefinition } from "../src/glyphs.mjs";
import { Q_FRAME, ROUTE_CONTRACT, getRouteDefinition, routeSignature } from "../src/q-line.mjs";
import { buildGlyphSvg } from "../src/svg.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);

test("Q-frame geometry is immutable across every OSS project", async () => {
  const projects = await loadRegistry(registryUrl);

  assert.deepEqual(Q_FRAME, {
    viewBox: "0 0 32 32",
    rear: { x: 5, y: 5, width: 16, height: 16, radius: 2 },
    front: { x: 11, y: 11, width: 16, height: 16, radius: 2 },
  });
  assert.equal(ROUTE_CONTRACT.strokeWidth, 2.4);

  for (const project of projects) {
    const definition = getGlyphDefinition(project.registryId);
    assert.equal(definition.viewBox, "0 0 32 32", project.id);
    assert.deepEqual(definition.frame, Q_FRAME, project.id);
    assert.equal(definition.strokeWidth, 2.4, project.id);
    assert.ok(definition.paths.length > 0, project.id);
  }
});

test("security implementations are the only approved shared Q-line route", async () => {
  const projects = await loadRegistry(registryUrl);
  const signatures = projects.map((project) => routeSignature(getRouteDefinition(project.registryId)));

  assert.equal(new Set(signatures).size, 11, "O02/O03 are the one approved shared-route exception");
  assert.deepEqual(getRouteDefinition("O02"), getRouteDefinition("O03"));
});

test("glyph variants are limited to approved accessible color roles", async () => {
  const [project] = await loadRegistry(registryUrl);

  assert.match(buildGlyphSvg(project, { variant: "color" }), new RegExp(project.accent.dark));
  assert.match(buildGlyphSvg(project, { variant: "dark" }), new RegExp(project.accent.light));
  assert.match(buildGlyphSvg(project, { variant: "monochrome" }), /#18181B/);
  assert.match(buildGlyphSvg(project, { variant: "reversed" }), /#FFFFFF/);
  assert.throws(() => buildGlyphSvg(project, { variant: "gradient" }), /Unsupported glyph variant/);
});

test("every route stays inside the product-route safety area", () => {
  for (const id of Array.from({ length: 12 }, (_, index) => `O${String(index + 1).padStart(2, "0")}`)) {
    const route = getRouteDefinition(id);
    assert.ok(route.paths.length <= ROUTE_CONTRACT.maxPrimitives, id);
    for (const path of route.paths) assert.doesNotThrow(() => ROUTE_CONTRACT.validatePath(path), `${id}: ${path}`);
  }
});

test("ruler, numeric input, and date rail keep distinct route rhythms", () => {
  assert.deepEqual(getRouteDefinition("O01").paths, ["M13 16H25", "M16 16V22", "M22 16V19"]);
  assert.deepEqual(getRouteDefinition("O04").paths, ["M15 16L19 13L23 16", "M15 20L19 23L23 20"]);
  assert.deepEqual(getRouteDefinition("O06").paths, ["M13 22H25", "M16 22V15H22V22"]);
});

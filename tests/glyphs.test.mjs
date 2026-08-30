import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { getGlyphDefinition } from "../src/glyphs.mjs";
import { buildGlyphSvg } from "../src/svg.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);

function canonicalGeometry(geometry) {
  return geometry.trim().split(/\s+(?=M)/).toSorted().join(" ");
}

test("each project emits a 32 by 32 glyph on the approved safety grid", async () => {
  const projects = await loadRegistry(registryUrl);

  for (const project of projects) {
    const definition = getGlyphDefinition(project.registryId);
    const svg = buildGlyphSvg(project, { variant: "color" });

    assert.equal(definition.viewBox, "0 0 32 32", project.id);
    assert.deepEqual(definition.activeArea, { min: 4, max: 28 }, project.id);
    assert.equal(definition.strokeWidth, 2, project.id);
    assert.match(svg, /viewBox="0 0 32 32"/, project.id);
    assert.match(svg, /stroke-width="2"/, project.id);
    assert.deepEqual(definition.bounds, { minX: 4, minY: 4, maxX: 28, maxY: 28 }, project.id);
  }
});

test("glyph output provides an individual deterministic identity for all twelve projects", async () => {
  const projects = await loadRegistry(registryUrl);
  const geometryHashes = projects.map((project) => createHash("sha256")
    .update(canonicalGeometry(getGlyphDefinition(project.registryId).geometry))
    .digest("hex"));

  assert.equal(new Set(geometryHashes).size, 12);
  assert.notEqual(
    getGlyphDefinition("O02").geometry,
    getGlyphDefinition("O03").geometry,
    "the JavaScript implementation has an actual, meaningful guard-route variation",
  );
});

test("glyph variants are limited to approved accessible color roles", async () => {
  const [project] = await loadRegistry(registryUrl);

  assert.match(buildGlyphSvg(project, { variant: "color" }), /#0E7490/);
  assert.match(buildGlyphSvg(project, { variant: "monochrome" }), /#18181B/);
  assert.match(buildGlyphSvg(project, { variant: "reversed" }), /#FFFFFF/);
  assert.throws(() => buildGlyphSvg(project, { variant: "gradient" }), /Unsupported glyph variant/);
});

test("numkey uses a caret, rather than an X, across grouped numeric units", () => {
  const numkey = getGlyphDefinition("O04").geometry;

  assert.match(numkey, /M5 19H11V25H5Z/);
  assert.match(numkey, /M20 18L24 22L28 18/);
  assert.doesNotMatch(numkey, /M22 24L27 19|M22 19L27 24/);
});

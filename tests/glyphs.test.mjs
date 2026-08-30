import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { getGlyphDefinition } from "../src/glyphs.mjs";
import { buildGlyphSvg } from "../src/svg.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);

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
  const hashes = projects.map((project) => createHash("sha256")
    .update(buildGlyphSvg(project, { variant: "monochrome" }))
    .digest("hex"));

  assert.equal(new Set(hashes).size, 12);
  const geometryHashes = projects.map((project) => createHash("sha256")
    .update(getGlyphDefinition(project.registryId).geometry)
    .digest("hex"));
  assert.equal(new Set(geometryHashes).size, 12);
  assert.equal(
    getGlyphDefinition("O02").paths.toSorted().join(" "),
    getGlyphDefinition("O03").paths.toSorted().join(" "),
    "the security siblings deliberately share their protected-boundary core while retaining deterministic project serialization",
  );
});

test("glyph variants are limited to approved accessible color roles", async () => {
  const [project] = await loadRegistry(registryUrl);

  assert.match(buildGlyphSvg(project, { variant: "color" }), /#0E7490/);
  assert.match(buildGlyphSvg(project, { variant: "monochrome" }), /#18181B/);
  assert.match(buildGlyphSvg(project, { variant: "reversed" }), /#FFFFFF/);
  assert.throws(() => buildGlyphSvg(project, { variant: "gradient" }), /Unsupported glyph variant/);
});

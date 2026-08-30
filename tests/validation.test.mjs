import assert from "node:assert/strict";
import test from "node:test";

import { validateSvg } from "../src/svg.mjs";
import { loadRegistry } from "../src/registry.mjs";

test("validates generated glyph SVGs as deterministic and safe", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  for (const project of projects) {
    const { buildGlyphSvg } = await import("../src/svg.mjs");
    const svg = buildGlyphSvg(project, { variant: "color" });
    assert.deepEqual(validateSvg(`${project.id}.svg`, svg, project), [], project.id);
  }
});

test("rejects unsafe SVG constructs and invalid master geometry", () => {
  const project = { id: "sample", registryId: "O01" };
  const invalid = [
    ["script.svg", '<svg viewBox="0 0 32 32"><script>alert(1)</script></svg>', /prohibited element: script/],
    ["foreign.svg", '<svg viewBox="0 0 32 32"><foreignObject /></svg>', /prohibited element: foreignObject/],
    ["image.svg", '<svg viewBox="0 0 32 32"><image href="https:\/\/example.com\/x.png" /></svg>', /prohibited element: image/],
    ["link.svg", '<svg viewBox="0 0 32 32"><path href="https:\/\/example.com" /></svg>', /external resource/],
    ["bad-grid.svg", '<svg viewBox="0 0 24 24"><path stroke-width="2" /></svg>', /must use viewBox/],
    ["bad-stroke.svg", '<svg viewBox="0 0 32 32"><path stroke-width="1" /></svg>', /must use a 2-unit/],
  ];

  for (const [fileName, svg, expected] of invalid) {
    assert.ok(validateSvg(fileName, svg, project).some((error) => expected.test(error)), fileName);
  }
});

test("rejects glyph geometry outside the 4-unit safety margin", () => {
  const svg = '<svg viewBox="0 0 32 32"><path d="M2 4H28" fill="none" stroke="currentColor" stroke-width="2" /></svg>';
  assert.ok(validateSvg("outside.svg", svg, { id: "sample", registryId: "O01" })
    .some((error) => error.includes("4-unit safety margin")));
});

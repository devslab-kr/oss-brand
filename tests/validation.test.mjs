import assert from "node:assert/strict";
import test from "node:test";

import { buildGlyphSvg, validateSvg } from "../src/svg.mjs";
import { loadRegistry } from "../src/registry.mjs";

test("validates generated glyph SVGs as deterministic and safe", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  for (const project of projects) {
    const { buildGlyphSvg } = await import("../src/svg.mjs");
    const svg = buildGlyphSvg(project, { variant: "color" });
    assert.deepEqual(validateSvg(`${project.id}.svg`, svg, project), [], project.id);
    assert.match(svg, /<rect x="5" y="5" width="16" height="16" rx="2"/);
    assert.match(svg, /<rect x="11" y="11" width="16" height="16" rx="2"/);
    assert.match(svg, /stroke-width="1\.8"/);
  }
});

test("rejects unsafe SVG constructs and invalid master geometry", () => {
  const project = { id: "editor-ruler", registryId: "O01" };
  const invalid = [
    ["script.svg", '<svg viewBox="0 0 32 32"><script>alert(1)</script></svg>', /prohibited element: script/],
    ["foreign.svg", '<svg viewBox="0 0 32 32"><foreignObject /></svg>', /prohibited element: foreignObject/],
    ["image.svg", '<svg viewBox="0 0 32 32"><image href="https:\/\/example.com\/x.png" /></svg>', /prohibited element: image/],
    ["link.svg", '<svg viewBox="0 0 32 32"><path href="https:\/\/example.com" /></svg>', /external resource/],
    ["bad-grid.svg", '<svg viewBox="0 0 24 24"><path stroke-width="2" /></svg>', /must use viewBox/],
    ["bad-stroke.svg", '<svg viewBox="0 0 32 32"><path stroke-width="1" /></svg>', /must use a 1.8-unit route/],
    ["linear.svg", '<svg viewBox="0 0 32 32"><linearGradient id="a" /></svg>', /prohibited gradient/],
    ["radial.svg", '<svg viewBox="0 0 32 32"><radialGradient id="a" /></svg>', /prohibited gradient/],
  ];

  for (const [fileName, svg, expected] of invalid) {
    assert.ok(validateSvg(fileName, svg, project).some((error) => expected.test(error)), fileName);
  }
});

test("binds generated project identity and variant paint to the registered project", async () => {
  const [project] = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const color = buildGlyphSvg(project, { variant: "color" });
  const dark = buildGlyphSvg(project, { variant: "dark" });
  const monochrome = buildGlyphSvg(project, { variant: "monochrome" });
  const reversed = buildGlyphSvg(project, { variant: "reversed" });

  assert.deepEqual(validateSvg("color.svg", color, project), []);
  assert.deepEqual(validateSvg("dark.svg", dark, project), []);
  assert.deepEqual(validateSvg("monochrome.svg", monochrome, project), []);
  assert.deepEqual(validateSvg("reversed.svg", reversed, project), []);
  assert.ok(validateSvg("wrong-project.svg", color.replace('data-oss-project="O01"', 'data-oss-project="O02"'), project)
    .some((error) => error.includes("must equal O01")));
  assert.ok(validateSvg("wrong-color.svg", color.replace(project.accent.dark, "#FF0000"), project)
    .some((error) => error.includes("invalid color paint")));
  assert.ok(validateSvg("wrong-mono.svg", monochrome.replace("#18181B", "#FFFFFF"), project)
    .some((error) => error.includes("invalid monochrome paint")));
  assert.ok(validateSvg("wrong-reversed.svg", reversed.replace("#FFFFFF", "#18181B"), project)
    .some((error) => error.includes("invalid reversed paint")));
});

test("rejects spoofed identity and prevents caller-controlled XML paint injection", async () => {
  const [project] = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const mismatchedIdentity = { ...project, id: 'editor-ruler" /><script>bad()</script>' };
  const poisonedColor = { ...project, ossAccent: { ...project.ossAccent, light: '" onload="bad()' } };
  const canonicalSvg = buildGlyphSvg(project, { variant: "color" });

  assert.throws(() => buildGlyphSvg(mismatchedIdentity, { variant: "color" }), /does not match approved registry id/);
  assert.throws(() => buildGlyphSvg(poisonedColor, { variant: "color" }), /ossAccent does not match approved registry id O01/);
  assert.doesNotMatch(canonicalSvg, /onload|<script|bad\(/i);
  assert.ok(validateSvg("spoofed.svg", canonicalSvg, mismatchedIdentity)
    .some((error) => error.includes("does not match approved registry id")));
  assert.ok(validateSvg("contract-paint.svg", canonicalSvg.replace(project.accent.dark, "#FF0000"), project)
    .some((error) => error.includes("invalid color paint")));
  assert.ok(validateSvg("poisoned.svg", canonicalSvg, poisonedColor)
    .some((error) => error.includes("ossAccent does not match approved registry id O01")));
});

test("rejects glyph geometry outside the 4-unit safety margin", () => {
  const svg = '<svg viewBox="0 0 32 32"><path d="M2 4H28" fill="none" stroke="currentColor" stroke-width="2" /></svg>';
  assert.ok(validateSvg("outside.svg", svg, { id: "editor-ruler", registryId: "O01" })
    .some((error) => error.includes("4-unit safety margin")));
});

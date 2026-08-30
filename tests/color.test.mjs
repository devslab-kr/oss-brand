import assert from "node:assert/strict";
import test from "node:test";

import { contrastRatio, validateProjectColors } from "../src/color.mjs";
import { loadRegistry } from "../src/registry.mjs";

test("uses the approved OSS cyan anchors", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  for (const project of projects) {
    assert.deepEqual(project.ossAccent, {
      raw: "#06B6D4",
      light: "#0E7490",
      dark: "#22D3EE",
    });
  }
});

test("all recorded project accent anchors meet WCAG AA on their declared surfaces", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  for (const project of projects) {
    assert.equal(validateProjectColors(project).length, 0, project.id);
    assert.ok(contrastRatio(project.accent.light, "#FFFFFF") >= 4.5, project.id);
    assert.ok(contrastRatio(project.accent.dark, "#09090B") >= 4.5, project.id);
  }
});

test("reports a color that fails its declared usage and rejects malformed hex", () => {
  assert.deepEqual(
    validateProjectColors({ id: "low-contrast", accent: { light: "#777777", dark: "#FFFFFF" } }),
    ["low-contrast accent.light contrast 4.48:1 is below 4.5:1 on #FFFFFF"],
  );

  for (const color of ["#fff", "#FFFFFF80", "white", "transparent"]) {
    assert.throws(() => contrastRatio(color, "#FFFFFF"), /Expected #RRGGBB color/);
  }
});

import assert from "node:assert/strict";
import test from "node:test";

import { buildProjectLockup, buildWordmark } from "../src/assets.mjs";
import { loadRegistry } from "../src/registry.mjs";

test("builds outlined wordmarks without runtime font dependencies", () => {
  const svg = buildWordmark("DataLinq");

  assert.match(svg, /<path /);
  assert.doesNotMatch(svg, /<(?:text|style)\b|font-family|@font-face/i);
  assert.match(svg, /aria-label="DataLinq"/);
});

test("builds project lockups with sibling and DevsLab endorsement behavior", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const jsGuard = projects.find((project) => project.registryId === "O03");
  const javaGuard = projects.find((project) => project.registryId === "O02");

  const jsLockup = buildProjectLockup(jsGuard, { endorsement: true });
  const javaLockup = buildProjectLockup(javaGuard, { endorsement: false });

  assert.match(jsLockup, /ssrf-guard-js/);
  assert.match(jsLockup, /JavaScript implementation/);
  assert.match(jsLockup, /Open source by DevsLab/);
  assert.match(javaLockup, /ssrf-guard/);
  assert.doesNotMatch(javaLockup, /JavaScript implementation/);
  assert.doesNotMatch(javaLockup, /Open source by DevsLab/);
});

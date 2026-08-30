import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { buildProjectLockup, buildWordmark } from "../src/assets.mjs";
import { loadRegistry } from "../src/registry.mjs";

test("builds outlined wordmarks without runtime font dependencies", () => {
  const svg = buildWordmark("DataLinq");

  assert.match(svg, /<path /);
  assert.match(svg, /data-font-source="@fontsource\/geist\/.*\.woff2"/);
  assert.match(svg, /data-font-license="OFL-1\.1"/);
  assert.match(svg, /[CQ]/, "actual font outlines include curve commands from the source font");
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
  assert.match(jsLockup, /data-runtime-layer="neutral"/);
  assert.match(jsLockup, /JavaScript implementation/);
  assert.match(jsLockup, /Open source by DevsLab/);
  assert.match(javaLockup, /ssrf-guard/);
  assert.doesNotMatch(javaLockup, /JavaScript implementation/);
  assert.doesNotMatch(javaLockup, /Open source by DevsLab/);
});

test("complete lockups retain twelve non-confusable identities despite the shared security core", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const geometry = projects.map((project) => {
    const lockup = buildProjectLockup(project, { endorsement: false });
    return [...lockup.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1]).join("|");
  });
  const hashes = geometry.map((paths) => createHash("sha256").update(paths).digest("hex"));

  assert.equal(new Set(hashes).size, 12);
});

test("canonicalizes lockups and rejects spoofed names, colors, and runtime relationships", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const javaGuard = projects.find((project) => project.registryId === "O02");
  const jsGuard = projects.find((project) => project.registryId === "O03");

  assert.throws(
    () => buildProjectLockup({ ...javaGuard, relationships: { runtime: "javascript" } }),
    /Project relationships does not match approved registry id O02/,
    "O02 cannot be given an O03 runtime attachment",
  );
  assert.throws(
    () => buildProjectLockup({ ...jsGuard, relationships: { sharedGlyphWith: "O02" } }),
    /Project relationships does not match approved registry id O03/,
    "O03 cannot lose its runtime attachment",
  );
  assert.throws(
    () => buildProjectLockup({ ...jsGuard, name: 'other" /><script>bad()</script>' }),
    /Project name does not match approved registry id O03/,
  );
  assert.throws(
    () => buildProjectLockup({ ...javaGuard, ossAccent: { ...javaGuard.ossAccent, light: "#FF0000" } }),
    /Project ossAccent does not match approved registry id O02/,
  );
});

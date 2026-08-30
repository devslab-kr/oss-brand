import assert from "node:assert/strict";
import test from "node:test";

import { buildSocialSvg } from "../src/social.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);

test("social SVGs use the approved OG and README canvases", async () => {
  const [project] = await loadRegistry(registryUrl);

  const og = buildSocialSvg(project, { kind: "og" });
  const readme = buildSocialSvg(project, { kind: "readme" });

  assert.match(og, /viewBox="0 0 1200 630"/);
  assert.match(readme, /viewBox="0 0 1280 320"/);
  assert.match(og, /editor-ruler/);
  assert.match(og, /Open source by DevsLab/);
  assert.match(og, new RegExp(`fill="${project.accent.dark}"`), "social marks preserve the registered rear plane");
  assert.match(og, new RegExp(`fill="${project.accent.light}"`), "social marks preserve the registered front plane");
  assert.match(og, /data-layer="product-route"[^>]*stroke="#FFFFFF"/, "social marks preserve the Q-line route");
  assert.doesNotMatch(og, /linearGradient|radialGradient/);
  assert.doesNotMatch(og, /<text\b|font-family/i, "social typography is outlined at build time");
  assert.doesNotMatch(readme, /<text\b|font-family/i, "README typography is outlined at build time");
  assert.equal(buildSocialSvg(project, { kind: "og" }), og, "social SVG serialization is repeatable");
});

test("social generator rejects non-canonical project identities", () => {
  assert.throws(
    () => buildSocialSvg({ id: "editor-ruler", registryId: "O01", name: "spoof" }, { kind: "og" }),
    /name does not match approved registry id O01/,
  );
});

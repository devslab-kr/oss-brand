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
  assert.match(og, /<g[^>]*stroke="#0E7490"/, "social marks preserve the approved OSS cyan stroke");
  assert.doesNotMatch(og, /linearGradient|radialGradient/);
});

test("social generator rejects non-canonical project identities", () => {
  assert.throws(
    () => buildSocialSvg({ id: "editor-ruler", registryId: "O01", name: "spoof" }, { kind: "og" }),
    /name does not match approved registry id O01/,
  );
});

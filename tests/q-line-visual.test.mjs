import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { generate } from "../scripts/generate.mjs";

test("Q-line family review includes 128, 32, 16, and monochrome proofs", async () => {
  const root = await mkdtemp(join(tmpdir(), "oss-q-line-review-"));
  await generate(pathToFileURL(root));
  const review = await readFile(join(root, "q-line-family-review.svg"), "utf8");

  for (const label of ["128 PX", "32 PX", "16 PX", "MONOCHROME"]) assert.match(review, new RegExp(label));
  for (const id of Array.from({ length: 13 }, (_, index) => `O${String(index + 1).padStart(2, "0")}`)) assert.match(review, new RegExp(`data-review-project="${id}"`));

  const index = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
  assert.deepEqual(index.qLine.frame, {
    viewBox: "0 0 32 32",
    rear: { x: 5, y: 5, width: 16, height: 16, radius: 2 },
    front: { x: 11, y: 11, width: 16, height: 16, radius: 2 },
  });
  assert.ok(index.projects.every((project) => project.route?.paths?.length > 0));
  const signatures = [];
  for (const project of index.projects) {
    const bytes = await readFile(join(root, project.id, "icons", "icon-16.png"));
    signatures.push([project.registryId, createHash("sha256").update(bytes).digest("hex")]);
  }
  assert.equal(new Set(signatures.map(([, signature]) => signature)).size, 12);
  assert.equal(signatures[1][1], signatures[2][1], "the SSRF runtime pair shares its 16px mark");
});

test("family review keeps the appended Workspace row inside its canvas", async () => {
  const review = await readFile(new URL("../dist/q-line-family-review.svg", import.meta.url), "utf8");
  const height = Number(review.match(/viewBox="0 0 1600 ([0-9]+)"/)[1]);
  const workspaceY = Number(review.match(/data-review-project="O13" transform="translate\(60 ([0-9]+)\)"/)[1]);
  assert.ok(workspaceY + 232 <= height);
});

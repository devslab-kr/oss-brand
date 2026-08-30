import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { generate } from "../scripts/generate.mjs";

async function fileHashes(root) {
  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await visit(fullPath));
      else files.push(fullPath);
    }
    return files;
  }

  const files = await visit(root);
  return Object.fromEntries(await Promise.all(files.sort().map(async (file) => [
    relative(root, file).split(sep).join("/"),
    createHash("sha256").update(await readFile(file)).digest("hex"),
  ])));
}

test("generation produces the same sorted file hashes in separate directories", async () => {
  const first = await mkdtemp(join(tmpdir(), "oss-brand-first-"));
  const second = await mkdtemp(join(tmpdir(), "oss-brand-second-"));

  try {
    await generate(pathToFileURL(`${first}${sep}`));
    await generate(pathToFileURL(`${second}${sep}`));
    assert.deepEqual(await fileHashes(first), await fileHashes(second));
  } finally {
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
});

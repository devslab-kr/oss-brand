import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { generate } from "./generate.mjs";

async function hashes(root) {
  async function files(directory) {
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = join(directory, entry.name);
      if (entry.isDirectory()) result.push(...await files(full));
      else result.push(full);
    }
    return result;
  }
  const result = {};
  for (const file of (await files(root)).sort()) {
    result[relative(root, file).split(sep).join("/")] = createHash("sha256").update(await readFile(file)).digest("hex");
  }
  return result;
}

const first = await mkdtemp(join(tmpdir(), "oss-brand-determinism-a-"));
const second = await mkdtemp(join(tmpdir(), "oss-brand-determinism-b-"));
try {
  await generate(pathToFileURL(`${first}${sep}`));
  await generate(pathToFileURL(`${second}${sep}`));
  const firstHashes = await hashes(first);
  const secondHashes = await hashes(second);
  if (JSON.stringify(firstHashes) !== JSON.stringify(secondHashes)) throw new Error("Generated file paths or SHA-256 hashes differ between runs");
  console.log(`Determinism passed: ${Object.keys(firstHashes).length} generated files`);
} finally {
  await rm(first, { recursive: true, force: true });
  await rm(second, { recursive: true, force: true });
}

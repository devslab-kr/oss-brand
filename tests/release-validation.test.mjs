import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { requiredProjectFiles, validateArchivePath, validateProjectAssetMatrix } from "../src/release-validation.mjs";

const commonProject = { id: "editor-ruler", surfaces: { extension: false, terminal: false } };
const extensionProject = { id: "kokey", surfaces: { extension: true, terminal: false } };
const terminalProject = { id: "datalinq", surfaces: { extension: false, terminal: true } };

async function writeAssetMatrix(root, project) {
  for (const file of requiredProjectFiles(project)) {
    const target = join(root, file);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, "asset");
  }
}

test("rejects archive traversal and Windows-equivalent unsafe paths", () => {
  for (const name of ["..\\evil", "assets\\..\\evil", "C:\\brand\\evil", "\\\\server\\share\\evil", "assets/mixed\\..\\evil", "", ".", "assets//icon.png"]) {
    assert.throws(() => validateArchivePath(name), /unsafe archive path/i, name);
  }
  assert.equal(validateArchivePath("icons/icon-32.png"), "icons/icon-32.png");
  assert.equal(validateArchivePath("icons\\icon-32.png"), "icons/icon-32.png");
});

test("requires every common, extension, and terminal asset class", async () => {
  const root = await mkdtemp(join(tmpdir(), "oss-brand-matrix-"));
  try {
    for (const project of [commonProject, extensionProject, terminalProject]) {
      const projectRoot = join(root, project.id);
      const files = requiredProjectFiles(project);
      await writeAssetMatrix(projectRoot, project);
      assert.deepEqual(await validateProjectAssetMatrix(projectRoot, project), [], project.id);
      for (const file of files) {
        await rm(join(projectRoot, file));
        assert.ok((await validateProjectAssetMatrix(projectRoot, project)).some((error) => error.endsWith(`missing ${file}`)), `${project.id}: ${file}`);
        await writeAssetMatrix(projectRoot, project);
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

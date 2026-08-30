import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));

test("release dry-run accepts a complete deterministic O01-O12 package", () => {
  const result = spawnSync(process.execPath, ["scripts/release-dry-run.mjs"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Release dry-run passed: 12 project ZIPs/);
});

test("structural and release checks reject a removed required asset", async () => {
  const temporary = await mkdtemp(join(tmpdir(), "oss-brand-release-package-"));
  const dist = join(temporary, "dist");
  try {
    await cp(join(root, "dist"), dist, { recursive: true });
    await rm(join(dist, "editor-ruler", "apple-touch-icon.png"));
    for (const script of ["scripts/validate.mjs", "scripts/release-dry-run.mjs"]) {
      const result = spawnSync(process.execPath, [script], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, OSS_BRAND_DIST: dist },
      });
      assert.notEqual(result.status, 0, script);
      assert.match(result.stderr, /editor-ruler: missing apple-touch-icon\.png/);
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

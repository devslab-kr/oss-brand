import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

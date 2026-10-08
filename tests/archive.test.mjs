import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { unzipSync, strFromU8 } from "fflate";

import { createDeterministicZip, sha256 } from "../src/archive.mjs";

test("deterministic ZIPs sort entries and retain byte-identical hashes", () => {
  const entries = [
    { name: "z.txt", data: "z" },
    { name: "a.txt", data: "a" },
  ];
  const first = createDeterministicZip(entries);
  const second = createDeterministicZip([...entries].reverse());

  assert.deepEqual(first, second);
  assert.equal(sha256(first), sha256(second));
  const contents = unzipSync(first);
  assert.deepEqual(Object.keys(contents), ["a.txt", "z.txt"]);
  assert.equal(strFromU8(contents["a.txt"]), "a");
});

test("deterministic ZIPs reject unsafe and duplicate paths", () => {
  assert.throws(() => createDeterministicZip([{ name: "../escape.txt", data: "x" }]), /safe relative path/);
  assert.throws(() => createDeterministicZip([{ name: "same.txt", data: "x" }, { name: "same.txt", data: "y" }]), /unique/);
});

test("archive timestamps stay identical across release host time zones", () => {
  const code = `import {createDeterministicZip, sha256} from "./src/archive.mjs"; console.log(sha256(createDeterministicZip([{name:"a.txt",data:"a"}])));`;
  const hashes = ["UTC", "Asia/Seoul", "America/Los_Angeles"].map((TZ) => execFileSync(process.execPath, ["--input-type=module", "-e", code], {cwd: new URL("..", import.meta.url), env: {...process.env, TZ}, encoding:"utf8"}).trim());
  assert.equal(new Set(hashes).size, 1);
});

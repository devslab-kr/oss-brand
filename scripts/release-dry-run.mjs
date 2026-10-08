import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync } from "fflate";

import { loadRegistry } from "../src/registry.mjs";
import { requiredProjectFiles, validateArchiveEntryNames, validateArchivePath, validateProjectAssetMatrix } from "../src/release-validation.mjs";

const root = process.cwd();
const dist = process.env.OSS_BRAND_DIST ?? join(root, "dist");
const downloads = join(dist, "downloads");
const secret = /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|(?:ghp|github_pat|npm)_[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fail(message) { throw new Error(`Release dry-run failed: ${message}`); }
function bytesToText(bytes) { return new TextDecoder().decode(bytes); }

for (const file of ["README.md", "LICENSE", "BRAND-LICENSE.md", "package.json"]) {
  try { await access(join(root, file)); } catch { fail(`missing required release file ${file}`); }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(packageJson.version)) fail(`package version is not valid semver: ${packageJson.version}`);
const index = JSON.parse(await readFile(join(dist, "index.json"), "utf8"));
if (index.version !== 1) fail("dist/index.json must declare registry version 1");

const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
for (const project of projects) {
  for (const error of await validateProjectAssetMatrix(join(dist, project.id), project)) fail(error);
}
const ids = projects.map((project) => project.id);
const files = await readdir(downloads);
const zips = files.filter((file) => file.endsWith(".zip")).sort();
const expectedZips = ids.map((id) => `${id}.zip`).sort();
if (zips.length !== projects.length || JSON.stringify(zips) !== JSON.stringify(expectedZips)) fail(`downloads must contain exactly the ${projects.length} registered project ZIPs`);

const checksums = new Map();
for (const line of (await readFile(join(downloads, "SHA256SUMS.txt"), "utf8")).trim().split(/\r?\n/)) {
  const match = /^([a-f0-9]{64})  ([a-z0-9-]+\.zip)$/.exec(line);
  if (!match || checksums.has(match?.[2])) fail("SHA256SUMS.txt contains an invalid or duplicate entry");
  checksums.set(match[2], match[1]);
}
if (checksums.size !== projects.length || [...checksums.keys()].sort().join("|") !== expectedZips.join("|")) fail(`SHA256SUMS.txt must list exactly the ${projects.length} ZIPs`);

for (const file of zips) {
  const archive = await readFile(join(downloads, file));
  if (sha256(archive) !== checksums.get(file)) fail(`checksum mismatch for ${file}`);
  const entries = unzipSync(archive);
  const names = Object.keys(entries).sort();
  try { validateArchiveEntryNames(names); }
  catch (error) { fail(`${file} contains ${error.message}`); }
  for (const name of names) {
    if (secret.test(bytesToText(entries[name]))) fail(`${file} contains a potential secret in ${name}`);
  }
  const project = projects.find((candidate) => `${candidate.id}.zip` === file);
  for (const required of requiredProjectFiles(project)) if (!Object.hasOwn(entries, required)) fail(`${file} is missing ${required}`);
  const projectChecksums = new Map();
  for (const line of bytesToText(entries["checksums.txt"]).trim().split("\n")) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) fail(`${file} has invalid project checksums`);
    let path;
    try { path = validateArchivePath(match[2]); }
    catch { fail(`${file} has invalid project checksum path`); }
    if (projectChecksums.has(path.toLowerCase())) fail(`${file} has invalid project checksums`);
    projectChecksums.set(path.toLowerCase(), match[1]);
  }
  for (const name of names.filter((name) => name !== "checksums.txt")) {
    const path = validateArchivePath(name);
    if (projectChecksums.get(path.toLowerCase()) !== sha256(entries[name])) fail(`${file} project checksum mismatch for ${name}`);
  }
}

console.log(`Release dry-run passed: ${projects.length} project ZIPs, checksums, licenses, registry version, and safe paths verified`);

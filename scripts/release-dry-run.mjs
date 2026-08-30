import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import { join, posix } from "node:path";
import { unzipSync } from "fflate";

import { loadRegistry } from "../src/registry.mjs";

const root = process.cwd();
const dist = join(root, "dist");
const downloads = join(dist, "downloads");
const requiredArchiveFiles = [
  "checksums.txt", "favicon.ico", "favicon.svg", "glyph-color.svg", "glyph-monochrome.svg",
  "glyph-reversed.svg", "lockup.svg", "lockup-endorsed.svg", "og.png", "readme-header.png", "wordmark.svg",
  "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
];
const unsafePath = /^(?:\/|.*(?:^|\/)\.\.(?:\/|$))/;
const secret = /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|(?:ghp|github_pat|npm)_[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function fail(message) { throw new Error(`Release dry-run failed: ${message}`); }
function bytesToText(bytes) { return new TextDecoder().decode(bytes); }

for (const file of ["README.md", "LICENSE", "BRAND-LICENSE.md", "package.json"]) {
  try { await access(join(root, file)); } catch { fail(`missing required release file ${file}`); }
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
if (packageJson.version !== "0.1.0") fail(`expected package version 0.1.0, found ${packageJson.version}`);
const index = JSON.parse(await readFile(join(dist, "index.json"), "utf8"));
if (index.version !== 1) fail("dist/index.json must declare registry version 1");

const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
const ids = projects.map((project) => project.id);
const files = await readdir(downloads);
const zips = files.filter((file) => file.endsWith(".zip")).sort();
const expectedZips = ids.map((id) => `${id}.zip`).sort();
if (zips.length !== 12 || JSON.stringify(zips) !== JSON.stringify(expectedZips)) fail("downloads must contain exactly the 12 registered project ZIPs");

const checksums = new Map();
for (const line of (await readFile(join(downloads, "SHA256SUMS.txt"), "utf8")).trim().split("\n")) {
  const match = /^([a-f0-9]{64})  ([a-z0-9-]+\.zip)$/.exec(line);
  if (!match || checksums.has(match?.[2])) fail("SHA256SUMS.txt contains an invalid or duplicate entry");
  checksums.set(match[2], match[1]);
}
if (checksums.size !== 12 || [...checksums.keys()].sort().join("|") !== expectedZips.join("|")) fail("SHA256SUMS.txt must list exactly the 12 ZIPs");

for (const file of zips) {
  const archive = await readFile(join(downloads, file));
  if (sha256(archive) !== checksums.get(file)) fail(`checksum mismatch for ${file}`);
  const entries = unzipSync(archive);
  const names = Object.keys(entries).sort();
  for (const name of names) {
    if (unsafePath.test(name) || posix.normalize(name) !== name) fail(`${file} contains unsafe archive path ${name}`);
    if (secret.test(bytesToText(entries[name]))) fail(`${file} contains a potential secret in ${name}`);
  }
  for (const required of requiredArchiveFiles) if (!Object.hasOwn(entries, required)) fail(`${file} is missing ${required}`);
  const projectChecksums = new Map();
  for (const line of bytesToText(entries["checksums.txt"]).trim().split("\n")) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match || projectChecksums.has(match?.[2])) fail(`${file} has invalid project checksums`);
    projectChecksums.set(match[2], match[1]);
  }
  for (const name of names.filter((name) => name !== "checksums.txt")) {
    if (projectChecksums.get(name) !== sha256(entries[name])) fail(`${file} project checksum mismatch for ${name}`);
  }
}

console.log("Release dry-run passed: 12 project ZIPs, checksums, licenses, registry version, and safe paths verified");

import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import sharp from "sharp";

import { generate, generateProject } from "../scripts/generate.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);
const REQUIRED_ICON_SIZES = [16, 32, 48, 180, 192, 512];

async function metadata(file) {
  return sharp(await readFile(file)).metadata();
}

test("generator creates the complete cross-platform image matrix", async () => {
  const [project] = await loadRegistry(registryUrl);
  const root = await mkdtemp(join(tmpdir(), "oss-brand-assets-"));
  await generateProject(project, pathToFileURL(`${root}\\`));
  const assets = join(root, project.id);

  for (const size of REQUIRED_ICON_SIZES) {
    const image = await metadata(join(assets, "icons", `icon-${size}.png`));
    assert.equal(image.width, size);
    assert.equal(image.height, size);
  }
  for (const [file, width, height] of [["og.png", 1200, 630], ["readme-header.png", 1280, 320], ["apple-touch-icon.png", 180, 180], ["pwa-192.png", 192, 192], ["pwa-512.png", 512, 512], ["maskable-512.png", 512, 512]]) {
    const image = await metadata(join(assets, file));
    assert.equal(image.width, width, file);
    assert.equal(image.height, height, file);
  }
  const favicon = await readFile(join(assets, "favicon.ico"));
  assert.equal(favicon.readUInt16LE(4), 3, "favicon has 16, 32, and 48 pixel frames");
  assert.ok((await stat(join(assets, "checksums.txt"))).size > 0);
});

test("Kokey and DataLinq receive their relationship-specific derivatives", async () => {
  const projects = await loadRegistry(registryUrl);
  const root = await mkdtemp(join(tmpdir(), "oss-brand-specific-"));
  const kokey = projects.find((project) => project.id === "kokey");
  const datalinq = projects.find((project) => project.id === "datalinq");
  await generateProject(kokey, pathToFileURL(`${root}\\`));
  await generateProject(datalinq, pathToFileURL(`${root}\\`));
  for (const size of [16, 48, 128]) {
    const image = await metadata(join(root, "kokey", "extension", `icon-${size}.png`));
    assert.equal(image.width, size);
    assert.equal(image.height, size);
  }
  const terminal = await readFile(join(root, "datalinq", "terminal", "datalinq.txt"), "utf8");
  const noColor = await readFile(join(root, "datalinq", "terminal", "datalinq-no-color.txt"), "utf8");
  assert.match(terminal, /^DataLinq\n/m);
  assert.match(noColor, /^[\x00-\x7F]+$/);
  assert.doesNotMatch(noColor, /\x1B\[/);
});

test("generator cannot write outside a supplied file output root", async () => {
  const [project] = await loadRegistry(registryUrl);
  await assert.rejects(() => generateProject(project, new URL("https://example.com/assets/")), /file output URL/);
});

test("portfolio generation creates twelve archives and the portable CSS contract", async () => {
  const root = await mkdtemp(join(tmpdir(), "oss-brand-portfolio-"));
  await generate(pathToFileURL(`${root}\\`));
  const index = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
  const atmosphere = await readFile(join(root, "atmosphere.css"), "utf8");
  assert.equal(index.projects.length, 12);
  assert.match(atmosphere, /86% 22%/);
  assert.match(atmosphere, /pointer-events: none/);
  assert.match(atmosphere, /forced-colors/);
  assert.equal((await stat(join(root, "downloads", "SHA256SUMS.txt"))).size > 0, true);
});

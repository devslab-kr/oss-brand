import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, posix, resolve, win32 } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import sharp from "sharp";
import { unzipSync } from "fflate";

import { generate, generateProject, isPathInside, projectOutputUrl } from "../scripts/generate.mjs";
import { loadRegistry } from "../src/registry.mjs";

const registryUrl = new URL("../registry/oss-projects.json", import.meta.url);
const REQUIRED_ICON_SIZES = [16, 32, 48, 180, 192, 512];

async function metadata(file) {
  return sharp(await readFile(file)).metadata();
}

async function opaqueBounds(file) {
  const { data, info } = await sharp(await readFile(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) for (let x = 0; x < info.width; x += 1) {
    if (data[(y * info.width + x) * 4 + 3] > 0) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY, width: info.width, height: info.height };
}

test("generator creates the complete cross-platform image matrix", async () => {
  const [project] = await loadRegistry(registryUrl);
  const root = await mkdtemp(join(tmpdir(), "oss-brand-assets-"));
  const projectUrl = await generateProject(project, pathToFileURL(root));
  const assets = join(root, project.id);
  assert.equal(resolve(fileURLToPath(projectUrl)), resolve(assets), "returned file URL resolves to the generated project directory");
  assert.equal((await stat(fileURLToPath(projectUrl))).isDirectory(), true);

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
  const colorSvg = await readFile(join(assets, "glyph-color.svg"), "utf8");
  const darkSvg = await readFile(join(assets, "glyph-dark.svg"), "utf8");
  const monochromeSvg = await readFile(join(assets, "glyph-monochrome.svg"), "utf8");
  for (const svg of [colorSvg, darkSvg, monochromeSvg]) {
    assert.match(svg, /x="5" y="5" width="16" height="16" rx="2"/);
    assert.match(svg, /x="11" y="11" width="16" height="16" rx="2"/);
    assert.match(svg, /stroke-width="2\.4"/);
  }
  for (const size of [192, 512]) {
    const bounds = await opaqueBounds(join(assets, `maskable-${size}.png`));
    const lower = Math.ceil(size * .2);
    const upper = Math.floor(size * .8) - 1;
    assert.ok(bounds.minX >= lower && bounds.minY >= lower && bounds.maxX <= upper && bounds.maxY <= upper, `maskable-${size}.png stays in the central safe zone`);
  }
});

test("Kokey and DataLinq receive their relationship-specific derivatives", async () => {
  const projects = await loadRegistry(registryUrl);
  const root = await mkdtemp(join(tmpdir(), "oss-brand-specific-"));
  const kokey = projects.find((project) => project.id === "kokey");
  const datalinq = projects.find((project) => project.id === "datalinq");
  await generateProject(kokey, pathToFileURL(root));
  await generateProject(datalinq, pathToFileURL(root));
  for (const size of [16, 32, 48, 128]) {
    const image = await metadata(join(root, "kokey", "extension", `icon-${size}.png`));
    assert.equal(image.width, size);
    assert.equal(image.height, size);
  }
  for (const [file, width, height] of [["store/promo-small-440x280.png", 440, 280], ["store/promo-marquee-1400x560.png", 1400, 560], ["store/screenshot-1280x800.png", 1280, 800]]) {
    const image = await metadata(join(root, "kokey", "extension", file));
    assert.equal(image.width, width, file);
    assert.equal(image.height, height, file);
  }
  const storeManifest = JSON.parse(await readFile(join(root, "kokey", "extension", "store", "manifest.json"), "utf8"));
  assert.deepEqual(storeManifest, {
    icon: "../icon-128.png",
    marquee: "promo-marquee-1400x560.png",
    screenshot: "screenshot-1280x800.png",
    smallPromo: "promo-small-440x280.png",
  });
  const manifestDirectory = dirname(join(root, "kokey", "extension", "store", "manifest.json"));
  for (const [name, reference] of Object.entries(storeManifest)) {
    const target = resolve(manifestDirectory, reference);
    assert.equal((await stat(target)).isFile(), true, `${name} resolves from the manifest directory to a generated local file`);
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

test("path boundary checks use native, POSIX, and Windows semantics without separator literals", () => {
  assert.equal(isPathInside("/tmp/assets", "/tmp/assets/editor-ruler", posix), true);
  assert.equal(isPathInside("/tmp/assets", "/tmp/escape", posix), false);
  assert.equal(isPathInside("C:\\assets", "C:\\assets\\editor-ruler", win32), true);
  assert.equal(isPathInside("C:\\assets", "C:\\outside", win32), false);
});

test("project output URLs preserve a POSIX directory path without appending a Windows separator", () => {
  const inputs = [];
  const href = projectOutputUrl("/tmp/oss-brand/editor-ruler", (path) => {
    inputs.push(path);
    return { href: "file:///tmp/oss-brand/editor-ruler" };
  });
  assert.equal(href, "file:///tmp/oss-brand/editor-ruler");
  assert.deepEqual(inputs, ["/tmp/oss-brand/editor-ruler"]);
});

test("portfolio generation creates thirteen archives and the portable CSS contract", async () => {
  const root = await mkdtemp(join(tmpdir(), "oss-brand-portfolio-"));
  await generate(pathToFileURL(root));
  const index = JSON.parse(await readFile(join(root, "index.json"), "utf8"));
  const atmosphere = await readFile(join(root, "atmosphere.css"), "utf8");
  assert.equal(index.projects.length, 13);
  assert.match(atmosphere, /86% 22%/);
  assert.match(atmosphere, /pointer-events: none/);
  assert.match(atmosphere, /forced-colors/);
  assert.match(atmosphere, /\[aria-hidden="true"\]\.hero-atmosphere__glow/);
  assert.match(atmosphere, /:not\(\[aria-hidden="true"\]\.hero-atmosphere__glow\).*z-index: 1/s);
  assert.match(atmosphere, /Markup:/);
  assert.match(await readFile(join(root, "atmosphere-usage.md"), "utf8"), /aria-hidden="true"/);
  const kokeyZip = unzipSync(await readFile(join(root, "downloads", "kokey.zip")));
  assert.ok(kokeyZip["extension/store/promo-marquee-1400x560.png"], "Kokey store collateral is included in its deterministic ZIP");
  const repeatRoot = await mkdtemp(join(tmpdir(), "oss-brand-repeat-"));
  await generateProject(index.projects[0], pathToFileURL(repeatRoot));
  assert.deepEqual(await readFile(join(root, index.projects[0].id, "og.png")), await readFile(join(repeatRoot, index.projects[0].id, "og.png")), "outlined social PNG output is byte-stable");
  assert.equal((await stat(join(root, "downloads", "SHA256SUMS.txt"))).size > 0, true);
});

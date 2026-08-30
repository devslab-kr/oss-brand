import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { basename, dirname, join, relative, resolve } from "node:path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

import { createDeterministicZip, sha256 } from "../src/archive.mjs";
import { buildProjectLockup } from "../src/assets.mjs";
import { loadRegistry } from "../src/registry.mjs";
import { buildSocialSvg } from "../src/social.mjs";
import { buildGlyphSvg, resolveCanonicalProject } from "../src/svg.mjs";
import { buildWordmark } from "../src/wordmark.mjs";

const ICON_SIZES = [16, 32, 48, 180, 192, 512];
const ROOT = new URL("../", import.meta.url);

function assertOutputUrl(outputUrl) {
  if (!(outputUrl instanceof URL) || outputUrl.protocol !== "file:") throw new TypeError("A file output URL is required");
  return fileURLToPath(outputUrl);
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function renderSvg(svg, output, width, height) {
  await write(output, await sharp(Buffer.from(svg)).png({ compressionLevel: 9, adaptiveFiltering: false }).resize(width, height, { fit: "fill" }).toBuffer());
}

function glyphInner(project, variant = "color") {
  const source = buildGlyphSvg(project, { variant });
  return source.match(/(<g[^>]*>[\s\S]*<\/g>)<\/svg>$/)?.[1] ?? "";
}

function maskableSvg(project) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g transform="translate(4 4) scale(.75)">${glyphInner(project)}</g></svg>`;
}

async function allFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await allFiles(full));
    else result.push(full);
  }
  return result;
}

async function writeChecksums(projectDir) {
  const files = (await allFiles(projectDir)).filter((file) => basename(file) !== "checksums.txt").sort();
  const lines = [];
  for (const file of files) lines.push(`${sha256(await readFile(file))}  ${relative(projectDir, file).replaceAll("\\", "/")}`);
  await write(join(projectDir, "checksums.txt"), `${lines.join("\n")}\n`);
}

export async function generateProject(project, outputUrl) {
  const canonical = resolveCanonicalProject(project);
  const root = assertOutputUrl(outputUrl);
  const resolvedRoot = resolve(root);
  const projectDir = resolve(resolvedRoot, canonical.id);
  if (!projectDir.startsWith(`${resolvedRoot}${"\\"}`) && projectDir !== resolvedRoot) throw new RangeError("Project output must remain inside the output root");
  await rm(projectDir, { recursive: true, force: true });
  await mkdir(projectDir, { recursive: true });
  for (const variant of ["color", "monochrome", "reversed"]) await write(join(projectDir, `glyph-${variant}.svg`), buildGlyphSvg(canonical, { variant }));
  await write(join(projectDir, "favicon.svg"), buildGlyphSvg(canonical, { variant: "color" }));
  await write(join(projectDir, "wordmark.svg"), buildWordmark(canonical.name));
  await write(join(projectDir, "lockup.svg"), buildProjectLockup(canonical));
  await write(join(projectDir, "lockup-endorsed.svg"), buildProjectLockup(canonical, { endorsement: true }));

  const colorSvg = buildGlyphSvg(canonical, { variant: "color" });
  const iconPaths = [];
  for (const size of ICON_SIZES) {
    const iconPath = join(projectDir, "icons", `icon-${size}.png`);
    await renderSvg(colorSvg, iconPath, size, size);
    iconPaths.push(iconPath);
  }
  await write(join(projectDir, "favicon.ico"), await pngToIco(iconPaths.slice(0, 3)));
  await renderSvg(colorSvg, join(projectDir, "apple-touch-icon.png"), 180, 180);
  await renderSvg(colorSvg, join(projectDir, "pwa-192.png"), 192, 192);
  await renderSvg(colorSvg, join(projectDir, "pwa-512.png"), 512, 512);
  await renderSvg(maskableSvg(canonical), join(projectDir, "maskable-512.png"), 512, 512);
  await renderSvg(buildSocialSvg(canonical, { kind: "og" }), join(projectDir, "og.png"), 1200, 630);
  await renderSvg(buildSocialSvg(canonical, { kind: "readme" }), join(projectDir, "readme-header.png"), 1280, 320);
  if (canonical.surfaces.extension) for (const size of [16, 48, 128]) await renderSvg(colorSvg, join(projectDir, "extension", `icon-${size}.png`), size, size);
  if (canonical.surfaces.terminal) {
    const terminal = "DataLinq\n========\n[ source ] ===> [ target ]\nOpen source by DevsLab\n";
    await write(join(projectDir, "terminal", "datalinq.txt"), terminal);
    await write(join(projectDir, "terminal", "datalinq-no-color.txt"), terminal);
  }
  await writeChecksums(projectDir);
  return pathToFileURL(`${projectDir}${"\\"}`).href;
}

function tokensCss() {
  return `:root {\n  --oss-cyan-raw: #06B6D4;\n  --oss-cyan-light: #0E7490;\n  --oss-cyan-dark: #22D3EE;\n}\n`;
}

function atmosphereCss() {
  return `.hero-atmosphere { position: relative; isolation: isolate; }\n.hero-atmosphere__glow { position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse 46% 68% at 86% 22%, rgb(6 182 212 / .11), transparent 72%); }\n[data-atmosphere="oss"] .hero-atmosphere__glow { background: radial-gradient(ellipse 38% 58% at 86% 22%, rgb(6 182 212 / .11), transparent 72%); }\n[data-theme="dark"] .hero-atmosphere__glow { background-color: transparent; background-image: radial-gradient(ellipse 46% 68% at 86% 22%, rgb(34 211 238 / .10), transparent 72%); }\n[data-atmosphere="project"] .hero-atmosphere__glow::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 30% 42% at 86% 22%, var(--project-accent, #06B6D4) 0%, transparent 72%); opacity: .08; pointer-events: none; }\n@media (forced-colors: active), print { .hero-atmosphere__glow, .hero-atmosphere__glow::after { display: none; } }\n`;
}

async function generatePortfolio(root, projects) {
  const cells = projects.map((project, index) => {
    const x = 80 + (index % 4) * 280;
    const y = 150 + Math.floor(index / 4) * 150;
    return `<g transform="translate(${x} ${y}) scale(2.5)">${glyphInner(project)}</g><text x="${x - 12}" y="${y + 100}" fill="#D4D4D8" font-family="ui-monospace, monospace" font-size="16">${project.name}</text>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#18181B"/><text x="72" y="78" fill="#FAFAFA" font-family="Geist, Arial, sans-serif" font-size="42">DevsLab Open Source</text><text x="72" y="112" fill="#22D3EE" font-family="ui-monospace, monospace" font-size="18">O01–O12 · Open source by DevsLab</text>${cells}</svg>`;
  await renderSvg(svg, join(root, "og-portfolio.png"), 1200, 630);
}

export async function generate(outputUrl = new URL("../dist/", import.meta.url)) {
  const root = assertOutputUrl(outputUrl);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  const projects = await loadRegistry(new URL("registry/oss-projects.json", ROOT));
  for (const project of projects) await generateProject(project, pathToFileURL(`${root}${"\\"}`));
  await write(join(root, "index.json"), `${JSON.stringify({ version: 1, projects }, null, 2)}\n`);
  await write(join(root, "tokens.css"), tokensCss());
  await write(join(root, "atmosphere.css"), atmosphereCss());
  await generatePortfolio(root, projects);
  const downloads = join(root, "downloads");
  await mkdir(downloads, { recursive: true });
  const checksums = [];
  for (const project of projects) {
    const projectDir = join(root, project.id);
    const files = await allFiles(projectDir);
    const zip = createDeterministicZip(await Promise.all(files.map(async (file) => ({ name: relative(projectDir, file).replaceAll("\\", "/"), data: await readFile(file) }))));
    const fileName = `${project.id}.zip`;
    await write(join(downloads, fileName), zip);
    checksums.push(`${sha256(zip)}  ${fileName}`);
  }
  await write(join(downloads, "SHA256SUMS.txt"), `${checksums.join("\n")}\n`);
  return root;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) generate().catch((error) => { console.error(error); process.exitCode = 1; });

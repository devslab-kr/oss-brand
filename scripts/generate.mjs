import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import pngToIco from "png-to-ico";
import sharp from "sharp";

import { createDeterministicZip, sha256 } from "../src/archive.mjs";
import { buildProjectLockup } from "../src/assets.mjs";
import { loadRegistry } from "../src/registry.mjs";
import { Q_FRAME, ROUTE_CONTRACT, getRouteDefinition } from "../src/q-line.mjs";
import { buildOutlinedLabel, buildSocialSvg } from "../src/social.mjs";
import { buildGlyphSvg, resolveCanonicalProject } from "../src/svg.mjs";
import { buildWordmark } from "../src/wordmark.mjs";

const ICON_SIZES = [16, 32, 48, 180, 192, 512];
const ROOT = new URL("../", import.meta.url);

function assertOutputUrl(outputUrl) {
  if (!(outputUrl instanceof URL) || outputUrl.protocol !== "file:") throw new TypeError("A file output URL is required");
  return fileURLToPath(outputUrl);
}

export function isPathInside(root, target, pathApi = { isAbsolute, relative, sep }) {
  const relativePath = pathApi.relative(root, target);
  return relativePath !== "" && relativePath !== ".." && !relativePath.startsWith(`..${pathApi.sep}`) && !pathApi.isAbsolute(relativePath);
}

export function projectOutputUrl(projectDir, toFileUrl = pathToFileURL) {
  return toFileUrl(projectDir).href;
}

function archivePath(path) {
  return path.split(sep).join("/");
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g transform="translate(5 5) scale(.6875)">${glyphInner(project)}</g></svg>`;
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
  for (const file of files) lines.push(`${sha256(await readFile(file))}  ${archivePath(relative(projectDir, file))}`);
  await write(join(projectDir, "checksums.txt"), `${lines.join("\n")}\n`);
}

export async function generateProject(project, outputUrl) {
  const canonical = resolveCanonicalProject(project);
  const root = assertOutputUrl(outputUrl);
  const resolvedRoot = resolve(root);
  const projectDir = resolve(resolvedRoot, canonical.id);
  if (!isPathInside(resolvedRoot, projectDir)) throw new RangeError("Project output must remain inside the output root");
  await rm(projectDir, { recursive: true, force: true });
  await mkdir(projectDir, { recursive: true });
  for (const variant of ["color", "dark", "monochrome", "reversed"]) await write(join(projectDir, `glyph-${variant}.svg`), buildGlyphSvg(canonical, { variant }));
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
  await renderSvg(maskableSvg(canonical), join(projectDir, "maskable-192.png"), 192, 192);
  await renderSvg(maskableSvg(canonical), join(projectDir, "maskable-512.png"), 512, 512);
  await renderSvg(buildSocialSvg(canonical, { kind: "og" }), join(projectDir, "og.png"), 1200, 630);
  await renderSvg(buildSocialSvg(canonical, { kind: "readme" }), join(projectDir, "readme-header.png"), 1280, 320);
  if (canonical.surfaces.extension) {
    for (const size of [16, 32, 48, 128]) await renderSvg(colorSvg, join(projectDir, "extension", `icon-${size}.png`), size, size);
    const extensionAssets = [
      ["promo-small-440x280.png", "store-small", 440, 280],
      ["promo-marquee-1400x560.png", "store-marquee", 1400, 560],
      ["screenshot-1280x800.png", "store-screenshot", 1280, 800],
    ];
    for (const [fileName, kind, width, height] of extensionAssets) await renderSvg(buildSocialSvg(canonical, { kind }), join(projectDir, "extension", "store", fileName), width, height);
    await write(join(projectDir, "extension", "store", "manifest.json"), `${JSON.stringify({ icon: "../icon-128.png", marquee: "promo-marquee-1400x560.png", screenshot: "screenshot-1280x800.png", smallPromo: "promo-small-440x280.png" }, null, 2)}\n`);
  }
  if (canonical.surfaces.terminal) {
    const terminal = "DataLinq\n========\n[ source ] ===> [ target ]\nOpen source by DevsLab\n";
    await write(join(projectDir, "terminal", "datalinq.txt"), terminal);
    await write(join(projectDir, "terminal", "datalinq-no-color.txt"), terminal);
  }
  await writeChecksums(projectDir);
  return projectOutputUrl(projectDir);
}

function tokensCss() {
  return `:root {\n  --oss-cyan-raw: #06B6D4;\n  --oss-cyan-light: #0E7490;\n  --oss-cyan-dark: #22D3EE;\n}\n`;
}

function atmosphereCss() {
  return `/* Markup: <section class="hero-atmosphere" data-atmosphere="oss"><div class="hero-atmosphere__glow" aria-hidden="true"></div><div class="hero-atmosphere__content">…</div></section>. The glow is decorative; content remains above it. */\n.hero-atmosphere { position: relative; isolation: isolate; }\n.hero-atmosphere > [aria-hidden="true"].hero-atmosphere__glow { position: absolute; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 46% 68% at 86% 22%, rgb(6 182 212 / .11), transparent 72%); }\n.hero-atmosphere > :not([aria-hidden="true"].hero-atmosphere__glow) { position: relative; z-index: 1; }\n[data-atmosphere="oss"] > [aria-hidden="true"].hero-atmosphere__glow { background: radial-gradient(ellipse 38% 58% at 86% 22%, rgb(6 182 212 / .11), transparent 72%); }\n[data-theme="dark"] > [aria-hidden="true"].hero-atmosphere__glow { background-color: transparent; background-image: radial-gradient(ellipse 46% 68% at 86% 22%, rgb(34 211 238 / .10), transparent 72%); }\n[data-atmosphere="project"] > [aria-hidden="true"].hero-atmosphere__glow::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse 30% 42% at 86% 22%, var(--project-accent, #06B6D4) 0%, transparent 72%); opacity: .08; pointer-events: none; }\n@media (forced-colors: active), print { .hero-atmosphere > [aria-hidden="true"].hero-atmosphere__glow, .hero-atmosphere > [aria-hidden="true"].hero-atmosphere__glow::after { display: none; } }\n`;
}

function atmosphereUsage() {
  return `# Hero atmosphere markup\n\nUse a decorative glow child with \`aria-hidden="true"\`, then put all meaningful hero content in a sibling child. The CSS raises non-glow children over the glow.\n\n\`\`\`html\n<section class="hero-atmosphere" data-atmosphere="oss">\n  <div class="hero-atmosphere__glow" aria-hidden="true"></div>\n  <div class="hero-atmosphere__content">…</div>\n</section>\n\`\`\`\n\nThe glow remains on the physical right at 86% 22%, ignores pointer events, and is disabled for forced colors and print.\n`;
}

async function generatePortfolio(root, projects) {
  const cells = projects.map((project, index) => {
    const x = 80 + (index % 4) * 280;
    const y = 150 + Math.floor(index / 4) * 150;
    return `<g transform="translate(${x} ${y}) scale(2.5)">${glyphInner(project)}</g>${buildOutlinedLabel(project.name, { x: x - 12, top: y + 78, height: 16, fill: "#D4D4D8" })}`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#18181B"/>${buildOutlinedLabel("DevsLab Open Source", { x: 72, top: 38, height: 42, fill: "#FAFAFA" })}${buildOutlinedLabel("O01-O12 - Open source by DevsLab", { x: 72, top: 96, height: 18, fill: "#22D3EE" })}${cells}</svg>`;
  await renderSvg(svg, join(root, "og-portfolio.png"), 1200, 630);
}

function familyReviewSvg(projects) {
  const cells = projects.map((project, index) => {
    const x = 60 + (index % 4) * 385;
    const y = 150 + Math.floor(index / 4) * 270;
    return `<g data-review-project="${project.registryId}" transform="translate(${x} ${y})"><rect width="350" height="232" rx="16" fill="#14191D" stroke="#2A3339"/><g transform="translate(20 28) scale(4)">${glyphInner(project)}</g><g transform="translate(178 42)">${glyphInner(project)}</g><g transform="translate(235 50) scale(.5)">${glyphInner(project)}</g><g transform="translate(282 42)">${glyphInner(project, "monochrome")}</g><text x="20" y="190" fill="#F4F7F8" font-family="Arial, sans-serif" font-size="17" font-weight="700">${project.name}</text><text x="20" y="215" fill="#7E8B93" font-family="monospace" font-size="12">${project.registryId}</text></g>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="DevsLab OSS Q-line family review"><rect width="1600" height="1000" fill="#0B0F12"/><text x="60" y="62" fill="#F4F7F8" font-family="Arial, sans-serif" font-size="34" font-weight="700">DevsLab OSS Q-line Family</text><text x="60" y="102" fill="#7E8B93" font-family="monospace" font-size="13">FIXED Q FRAME · PRODUCT ROUTES · v0.2.0</text><text x="80" y="136" fill="#7E8B93" font-family="monospace" font-size="11">128 PX</text><text x="238" y="136" fill="#7E8B93" font-family="monospace" font-size="11">32 PX</text><text x="295" y="136" fill="#7E8B93" font-family="monospace" font-size="11">16 PX</text><text x="342" y="136" fill="#7E8B93" font-family="monospace" font-size="11">MONOCHROME</text>${cells}</svg>\n`;
}

export async function generate(outputUrl = new URL("../dist/", import.meta.url)) {
  const root = assertOutputUrl(outputUrl);
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  const projects = await loadRegistry(new URL("registry/oss-projects.json", ROOT));
  for (const project of projects) await generateProject(project, pathToFileURL(root));
  const publicProjects = projects.map((project) => ({ ...project, route: getRouteDefinition(project.registryId) }));
  const qLine = { version: 1, frame: Q_FRAME, route: { min: ROUTE_CONTRACT.min, max: ROUTE_CONTRACT.max, strokeWidth: ROUTE_CONTRACT.strokeWidth, maxPrimitives: ROUTE_CONTRACT.maxPrimitives, linecap: ROUTE_CONTRACT.linecap, linejoin: ROUTE_CONTRACT.linejoin } };
  await write(join(root, "index.json"), `${JSON.stringify({ version: 1, qLine, projects: publicProjects }, null, 2)}\n`);
  await write(join(root, "tokens.css"), tokensCss());
  await write(join(root, "atmosphere.css"), atmosphereCss());
  await write(join(root, "atmosphere-usage.md"), atmosphereUsage());
  await write(join(root, "q-line-family-review.svg"), familyReviewSvg(projects));
  await generatePortfolio(root, projects);
  const downloads = join(root, "downloads");
  await mkdir(downloads, { recursive: true });
  const checksums = [];
  for (const project of projects) {
    const projectDir = join(root, project.id);
    const files = await allFiles(projectDir);
    const zip = createDeterministicZip(await Promise.all(files.map(async (file) => ({ name: archivePath(relative(projectDir, file)), data: await readFile(file) }))));
    const fileName = `${project.id}.zip`;
    await write(join(downloads, fileName), zip);
    checksums.push(`${sha256(zip)}  ${fileName}`);
  }
  await write(join(downloads, "SHA256SUMS.txt"), `${checksums.join("\n")}\n`);
  return root;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) generate().catch((error) => { console.error(error); process.exitCode = 1; });

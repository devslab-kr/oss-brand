import { access } from "node:fs/promises";
import { join } from "node:path";

const commonFiles = [
  "checksums.txt", "favicon.ico", "favicon.svg",
  "glyph-color.svg", "glyph-dark.svg", "glyph-monochrome.svg", "glyph-reversed.svg",
  "wordmark.svg", "lockup.svg", "lockup-endorsed.svg",
  "apple-touch-icon.png", "pwa-192.png", "pwa-512.png", "maskable-192.png", "maskable-512.png",
  "og.png", "readme-header.png",
  "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png",
];
const extensionFiles = [
  "extension/icon-16.png", "extension/icon-32.png", "extension/icon-48.png", "extension/icon-128.png",
  "extension/store/manifest.json", "extension/store/promo-small-440x280.png",
  "extension/store/promo-marquee-1400x560.png", "extension/store/screenshot-1280x800.png",
];
const terminalFiles = ["terminal/datalinq.txt", "terminal/datalinq-no-color.txt"];
const portableRelativePath = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export function requiredProjectFiles(project) {
  const files = [...commonFiles];
  if (project?.surfaces?.extension) files.push(...extensionFiles);
  if (project?.surfaces?.terminal) files.push(...terminalFiles);
  return files;
}

export function validateArchivePath(name) {
  if (typeof name !== "string" || name.length === 0 || name.includes("\0")) throw new RangeError(`Unsafe archive path: ${String(name)}`);
  if (/^[A-Za-z]:[\\/]/.test(name) || /^(?:\\\\|\/\/|[\\/])/.test(name)) throw new RangeError(`Unsafe archive path: ${name}`);
  const normalized = name.replaceAll("\\", "/");
  const segments = normalized.split("/");
  if (!portableRelativePath.test(normalized) || segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new RangeError(`Unsafe archive path: ${name}`);
  }
  return normalized;
}

export function validateArchiveEntryNames(names) {
  const normalized = new Set();
  for (const name of names) {
    const path = validateArchivePath(name);
    const collisionKey = path.toLowerCase();
    if (normalized.has(collisionKey)) throw new RangeError(`Unsafe archive path collision: ${name}`);
    normalized.add(collisionKey);
  }
}

export async function validateProjectAssetMatrix(projectRoot, project) {
  const errors = [];
  for (const file of requiredProjectFiles(project)) {
    try { await access(join(projectRoot, file)); }
    catch { errors.push(`${project.id}: missing ${file}`); }
  }
  return errors;
}

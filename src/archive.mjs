import { createHash } from "node:crypto";
import { strToU8, zipSync } from "fflate";

const DOS_EPOCH = new Date(1980, 0, 1, 0, 0, 0);
const SAFE_ARCHIVE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function toBytes(value) {
  if (typeof value === "string") return strToU8(value);
  if (value instanceof Uint8Array) return value;
  if (Buffer.isBuffer(value)) return new Uint8Array(value);
  throw new TypeError("Archive entry data must be a string or Uint8Array");
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export function createDeterministicZip(entries) {
  if (!Array.isArray(entries)) throw new TypeError("Archive entries must be an array");
  const names = new Set();
  const zippable = {};
  for (const entry of [...entries].sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry || typeof entry.name !== "string" || !SAFE_ARCHIVE_PATH.test(entry.name)) throw new RangeError("Archive entries must use a safe relative path");
    if (names.has(entry.name)) throw new RangeError("Archive entry names must be unique");
    names.add(entry.name);
    zippable[entry.name] = [toBytes(entry.data), { level: 9, mtime: DOS_EPOCH }];
  }
  return zipSync(zippable, { level: 9, mtime: DOS_EPOCH });
}

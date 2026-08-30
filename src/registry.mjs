import { readFile } from "node:fs/promises";

import { validateProjectColors } from "./color.mjs";

const REQUIRED_SURFACES = ["readme", "github", "docs", "demo", "npm", "maven", "terminal", "extension"];
const OSS_ACCENT = { raw: "#06B6D4", light: "#0E7490", dark: "#22D3EE" };
const EXPECTED_REGISTRY_IDS = Array.from({ length: 12 }, (_, index) => `O${String(index + 1).padStart(2, "0")}`);
const REGISTRY_ID = /^O\d{2}$/;
const PROJECT_ID = /^[a-z][a-z0-9-]*$/;
const ARTIFACT = /^(?:@[a-z0-9-]+\/[a-z0-9-]+|[a-z][a-z0-9.-]*:[a-z][a-z0-9.-]*)$/;

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function relationTargets(relationships) {
  return Object.values(relationships ?? {}).flatMap((value) => Array.isArray(value) ? value : [value]);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function loadRegistry(url) {
  if (url instanceof URL && url.protocol === "file:") {
    return deepFreeze(JSON.parse(await readFile(url, "utf8")));
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load OSS registry: ${response.status} ${response.statusText}`);
  return deepFreeze(await response.json());
}

export function validateRegistry(projects) {
  const errors = [];
  if (!Array.isArray(projects)) return ["Registry must be an array"];
  if (projects.length !== EXPECTED_REGISTRY_IDS.length) errors.push("Registry must contain exactly 12 projects");

  for (const [index, expectedRegistryId] of EXPECTED_REGISTRY_IDS.entries()) {
    if (projects[index]?.registryId !== expectedRegistryId) {
      errors.push(`Registry order ${index + 1} must use ${expectedRegistryId}, received ${projects[index]?.registryId ?? "missing"}`);
    }
  }

  const registryIds = new Set();
  const projectIds = new Set();
  const knownRegistryIds = new Set(projects.map((project) => project?.registryId));

  for (const project of projects) {
    const id = project?.id ?? "unknown";
    const registryId = project?.registryId;

    if (registryIds.has(registryId)) errors.push(`Duplicate registry id: ${registryId}`);
    registryIds.add(registryId);
    if (projectIds.has(id)) errors.push(`Duplicate project id: ${id}`);
    projectIds.add(id);

    if (!REGISTRY_ID.test(registryId ?? "")) errors.push(`Invalid registry id: ${registryId}`);
    if (!PROJECT_ID.test(id)) errors.push(`Invalid project id: ${id}`);
    if (typeof project?.name !== "string" || project.name.trim() === "") errors.push(`Invalid project name for ${id}: ${project?.name ?? ""}`);
    if (!ARTIFACT.test(project?.artifact?.coordinate ?? "")) errors.push(`Invalid artifact coordinate for ${id}: ${project?.artifact?.coordinate ?? ""}`);
    if (typeof project?.category !== "string" || project.category.trim() === "") errors.push(`Missing category for ${id}`);
    if (typeof project?.glyphConcept !== "string" || project.glyphConcept.trim() === "") errors.push(`Missing glyph concept for ${id}`);
    if (project?.status !== "active") errors.push(`Invalid status for ${id}: ${project?.status}`);

    if (!isPlainObject(project?.links)) errors.push(`Invalid links for ${id}`);
    if (!isUrl(project?.links?.repository)) errors.push(`Invalid repository URL for ${id}: ${project?.links?.repository ?? ""}`);
    for (const [name, link] of Object.entries(project?.links ?? {})) {
      if (!isUrl(link)) errors.push(`Invalid ${name} URL for ${id}: ${link}`);
    }

    if (!isPlainObject(project?.surfaces)) errors.push(`Invalid surfaces for ${id}`);
    for (const surface of REQUIRED_SURFACES) {
      if (typeof project?.surfaces?.[surface] !== "boolean") errors.push(`Invalid surface ${surface} for ${id}`);
    }

    if (!isPlainObject(project?.relationships)) errors.push(`Invalid relationships for ${id}`);
    for (const target of relationTargets(project?.relationships)) {
      if (typeof target === "string" && REGISTRY_ID.test(target) && !knownRegistryIds.has(target)) {
        errors.push(`Unknown relationship target for ${id}: ${target}`);
      }
    }

    for (const [role, value] of Object.entries(OSS_ACCENT)) {
      if (project?.ossAccent?.[role] !== value) errors.push(`Invalid OSS accent.${role} for ${id}: ${project?.ossAccent?.[role] ?? ""}`);
    }

    errors.push(...validateProjectColors(project));
  }

  return errors;
}

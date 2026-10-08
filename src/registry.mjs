import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";

import { validateProjectColors } from "./color.mjs";
import { APPROVED_REGISTRY_CONTRACT } from "./registry-contract.mjs";

const REQUIRED_SURFACES = ["readme", "github", "docs", "demo", "npm", "maven", "terminal", "extension"];
const OSS_ACCENT = { raw: "#06B6D4", light: "#0E7490", dark: "#22D3EE" };
const EXPECTED_REGISTRY_IDS = APPROVED_REGISTRY_CONTRACT.map(({ registryId }) => registryId);
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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateReference(project, key, target, knownRegistryIds, errors) {
  if (typeof target !== "string" || !REGISTRY_ID.test(target)) {
    errors.push(`Invalid relationship reference for ${project.id}.${key}`);
    return false;
  }
  if (!knownRegistryIds.has(target)) {
    errors.push(`Unknown relationship target for ${project.id}: ${target}`);
    return false;
  }
  if (target === project.registryId) {
    errors.push(`Self relationship for ${project.id}: ${target}`);
    return false;
  }
  return true;
}

function validateRelationships(project, expectedRelationships, knownRegistryIds, errors) {
  const relationships = project?.relationships;
  if (!isPlainObject(relationships)) {
    errors.push(`Invalid relationships for ${project.id}`);
    return;
  }

  for (const key of Object.keys(relationships)) {
    if (!(key in expectedRelationships)) {
      errors.push(`Invalid relationship key for ${project.id}: ${key}`);
      const value = relationships[key];
      for (const target of Array.isArray(value) ? value : [value]) {
        if (typeof target === "string" && REGISTRY_ID.test(target) && !knownRegistryIds.has(target)) {
          errors.push(`Unknown relationship target for ${project.id}: ${target}`);
        }
      }
    }
  }

  for (const [key, expectedValue] of Object.entries(expectedRelationships)) {
    const value = relationships[key];
    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(value)) {
        errors.push(`Invalid relationship collection for ${project.id}.${key}`);
        continue;
      }
      const seen = new Set();
      for (const target of value) {
        if (!validateReference(project, key, target, knownRegistryIds, errors)) continue;
        if (seen.has(target)) errors.push(`Duplicate relationship target for ${project.id}: ${target}`);
        seen.add(target);
      }
      if (isDeepStrictEqual(value, expectedValue) === false) {
        errors.push(`Invalid relationship topology for ${project.id}.${key}`);
      }
      continue;
    }

    if (REGISTRY_ID.test(expectedValue)) {
      if (validateReference(project, key, value, knownRegistryIds, errors) && value !== expectedValue) {
        errors.push(`Invalid relationship topology for ${project.id}.${key}`);
      }
      continue;
    }

    if (value !== expectedValue) errors.push(`Invalid relationship value for ${project.id}.${key}`);
  }
}

const CONTRACT_GROUPS = [
  "registryId",
  "id",
  "name",
  "artifact",
  "category",
  "links",
  "relationships",
  "surfaces",
  "glyphConcept",
  "status",
  "ossAccent",
  "accent",
];

function validateContract(project, expected, errors) {
  const actualKeys = Object.keys(project ?? {}).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (!isDeepStrictEqual(actualKeys, expectedKeys)) {
    errors.push(`Registry contract mismatch for ${expected.registryId}: record`);
  }

  for (const group of CONTRACT_GROUPS) {
    if (!isDeepStrictEqual(project?.[group], expected[group])) {
      errors.push(`Registry contract mismatch for ${expected.registryId}: ${group}`);
    }
  }
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
  if (projects.length !== EXPECTED_REGISTRY_IDS.length) errors.push(`Registry must contain exactly ${EXPECTED_REGISTRY_IDS.length} projects`);

  for (const [index, expectedRegistryId] of EXPECTED_REGISTRY_IDS.entries()) {
    if (projects[index]?.registryId !== expectedRegistryId) {
      errors.push(`Registry order ${index + 1} must use ${expectedRegistryId}, received ${projects[index]?.registryId ?? "missing"}`);
    }
  }

  const registryIds = new Set();
  const projectIds = new Set();
  const knownRegistryIds = new Set(EXPECTED_REGISTRY_IDS);

  for (const [index, project] of projects.entries()) {
    const id = project?.id ?? "unknown";
    const registryId = project?.registryId;
    const expected = APPROVED_REGISTRY_CONTRACT[index];

    if (expected) validateContract(project, expected, errors);

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

    if (expected) validateRelationships(project, expected.relationships, knownRegistryIds, errors);
    else if (!isPlainObject(project?.relationships)) errors.push(`Invalid relationships for ${id}`);

    for (const [role, value] of Object.entries(OSS_ACCENT)) {
      if (project?.ossAccent?.[role] !== value) errors.push(`Invalid OSS accent.${role} for ${id}: ${project?.ossAccent?.[role] ?? ""}`);
    }

    errors.push(...validateProjectColors(project));
  }

  return errors;
}

import assert from "node:assert/strict";
import test from "node:test";

import { loadRegistry, validateRegistry } from "../src/registry.mjs";

const approved = [
  ["O01", "editor-ruler", "@devslab/editor-ruler", "editor-ui", "measured rail with a movable stop"],
  ["O02", "ssrf-guard", "kr.devslab:ssrf-guard", "security", "protected boundary interrupting an inbound path"],
  ["O03", "ssrf-guard-js", "@devslab/ssrf-guard-js", "security", "O02 core plus a neutral runtime attachment in lockups, not inside the glyph"],
  ["O04", "numkey", "@devslab/numkey", "input", "stable caret crossing grouped numeric units"],
  ["O05", "kokey", "@devslab/kokey", "input", "two key surfaces connected by a correction path"],
  ["O06", "vue-date-rail", "@devslab/vue-date-rail", "vue-ui", "three date cells on a horizontal rail with one selected position"],
  ["O07", "locale-match", "@devslab/locale-match", "i18n", "multiple candidate paths resolving into one matched line"],
  ["O08", "easy-paging", "kr.devslab:easy-paging-spring-boot-starter", "pagination", "a page stack advanced by a bounded cursor"],
  ["O09", "api-log", "kr.devslab:api-log-core", "logging", "event lines entering a durable record stack"],
  ["O10", "devslab-kit", "kr.devslab:devslab-kit-spring-boot-starter", "platform-starter", "modular blocks assembling into one platform frame"],
  ["O11", "DataLinq", "kr.devslab:datalinq", "data-migration", "two data columns connected by a controlled transfer bridge"],
  ["O12", "devslab-examples", "kr.devslab:devslab-examples", "demos", "a bracketed run/play symbol representing a collection"],
];

const ossAccent = { raw: "#06B6D4", light: "#0E7490", dark: "#22D3EE" };
const approvedDetails = [
  ["O01", { links: { repository: "https://github.com/devslab-kr/editor-ruler", package: "https://www.npmjs.com/package/@devslab/editor-ruler", demo: "https://devslab-kr.github.io/editor-ruler/" }, relationships: { role: "parent identity for editor adapters" }, surfaces: { readme: true, github: true, docs: false, demo: true, npm: true, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#1D4ED8", dark: "#8AACF8" } }],
  ["O02", { links: { repository: "https://github.com/devslab-kr/ssrf-guard", package: "https://central.sonatype.com/artifact/kr.devslab/ssrf-guard" }, relationships: { sharedGlyphWith: "O03" }, surfaces: { readme: true, github: true, docs: false, demo: false, npm: false, maven: true, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#1B6B4A", dark: "#6EE7B7" } }],
  ["O03", { links: { repository: "https://github.com/devslab-kr/ssrf-guard-js", package: "https://www.npmjs.com/package/@devslab/ssrf-guard-js", docs: "https://devslab-kr.github.io/ssrf-guard-js/" }, relationships: { sharedGlyphWith: "O02", runtime: "javascript" }, surfaces: { readme: true, github: true, docs: true, demo: false, npm: true, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#1B6B4A", dark: "#6EE7B7" } }],
  ["O04", { links: { repository: "https://github.com/devslab-kr/numkey", package: "https://www.npmjs.com/package/@devslab/numkey", demo: "https://devslab-kr.github.io/numkey/" }, relationships: { siblingWith: "O05" }, surfaces: { readme: true, github: true, docs: false, demo: true, npm: true, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#7C3AED", dark: "#C4B5FD" } }],
  ["O05", { links: { repository: "https://github.com/devslab-kr/kokey", package: "https://www.npmjs.com/package/@devslab/kokey", demo: "https://devslab-kr.github.io/kokey/" }, relationships: { siblingWith: "O04" }, surfaces: { readme: true, github: true, docs: false, demo: true, npm: true, maven: false, terminal: false, extension: true }, status: "active", ossAccent, accent: { light: "#B45309", dark: "#FBBF24" } }],
  ["O06", { links: { repository: "https://github.com/devslab-kr/vue-date-rail", package: "https://www.npmjs.com/package/@devslab/vue-date-rail", demo: "https://devslab-kr.github.io/vue-date-rail/" }, relationships: { tokenBoundary: "consumer --vdr-* tokens remain independent" }, surfaces: { readme: true, github: true, docs: false, demo: true, npm: true, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#7E22CE", dark: "#D8B4FE" } }],
  ["O07", { links: { repository: "https://github.com/devslab-kr/locale-match", package: "https://www.npmjs.com/package/@devslab/locale-match", demo: "https://devslab-kr.github.io/locale-match/" }, relationships: { role: "independent locale utility" }, surfaces: { readme: true, github: true, docs: false, demo: true, npm: true, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#0E7490", dark: "#22D3EE" } }],
  ["O08", { links: { repository: "https://github.com/devslab-kr/easy-paging-spring-boot-starter", package: "https://central.sonatype.com/artifact/kr.devslab/easy-paging-spring-boot-starter", docs: "https://easy-paging.devslab.kr/" }, relationships: { role: "independent backend library" }, surfaces: { readme: true, github: true, docs: true, demo: false, npm: false, maven: true, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#1D4ED8", dark: "#8AACF8" } }],
  ["O09", { links: { repository: "https://github.com/devslab-kr/api-log", package: "https://central.sonatype.com/artifact/kr.devslab/api-log-core" }, relationships: { role: "independent backend library" }, surfaces: { readme: true, github: true, docs: false, demo: false, npm: false, maven: true, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#BE123C", dark: "#FDA4AF" } }],
  ["O10", { links: { repository: "https://github.com/devslab-kr/devslab-kit", package: "https://central.sonatype.com/artifact/kr.devslab/devslab-kit-spring-boot-starter", docs: "https://devslab-kit.devslab.kr/" }, relationships: { role: "independent backend platform" }, surfaces: { readme: true, github: true, docs: true, demo: false, npm: false, maven: true, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#4D7C0F", dark: "#BEF264" } }],
  ["O11", { links: { repository: "https://github.com/devslab-kr/datalinq", releases: "https://github.com/devslab-kr/datalinq/releases/latest" }, relationships: { role: "terminal application" }, surfaces: { readme: true, github: true, docs: false, demo: false, npm: false, maven: false, terminal: true, extension: false }, status: "active", ossAccent, accent: { light: "#0F766E", dark: "#5EEAD4" } }],
  ["O12", { links: { repository: "https://github.com/devslab-kr/devslab-examples", discussions: "https://github.com/devslab-kr/devslab-examples/discussions" }, relationships: { collectionOf: ["O01", "O02", "O03", "O04", "O05", "O06", "O07", "O08", "O09", "O10", "O11"] }, surfaces: { readme: true, github: true, docs: false, demo: false, npm: false, maven: false, terminal: false, extension: false }, status: "active", ossAccent, accent: { light: "#334155", dark: "#CBD5E1" } }],
];

test("loads exactly O01 through O12 in approved order", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  assert.deepEqual(
    projects.map(({ registryId, name, artifact, category, glyphConcept }) => [
      registryId,
      name,
      artifact.coordinate,
      category,
      glyphConcept,
    ]),
    approved,
  );
  assert.deepEqual(validateRegistry(projects), []);
  assert.deepEqual(
    projects.map(({ registryId, links, relationships, surfaces, status, ossAccent: currentOssAccent, accent }) => [
      registryId,
      { links, relationships, surfaces, status, ossAccent: currentOssAccent, accent },
    ]),
    approvedDetails,
  );
});

test("exposes immutable unique project and registry identifiers", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));

  assert.ok(Object.isFrozen(projects));
  assert.ok(projects.every(Object.isFrozen));
  assert.equal(new Set(projects.map((project) => project.registryId)).size, 12);
  assert.equal(new Set(projects.map((project) => project.id)).size, 12);
});

test("rejects malformed metadata, links, relationships, and surfaces", () => {
  const errors = validateRegistry([
    {
      registryId: "O01",
      id: "bad id",
      name: "",
      artifact: { coordinate: "bad coordinate" },
      category: "",
      links: { repository: "not-a-url" },
      relationships: { securityCore: "O99" },
      surfaces: { github: "yes", docs: false },
      glyphConcept: "",
      status: "draft",
      accent: { light: "#FFFFFF80", dark: "blue" },
    },
    {
      registryId: "O01",
      id: "bad id",
      name: "Duplicate",
      artifact: { coordinate: "kr.devslab:duplicate" },
      category: "test",
      links: { repository: "https://github.com/devslab-kr/duplicate" },
      relationships: {},
      surfaces: { github: true },
      glyphConcept: "test glyph",
      status: "active",
      accent: { light: "#0E7490", dark: "#22D3EE" },
    },
  ]);

  assert.ok(errors.some((error) => error.includes("Duplicate registry id: O01")));
  assert.ok(errors.some((error) => error.includes("Duplicate project id: bad id")));
  assert.ok(errors.some((error) => error.includes("Invalid project id: bad id")));
  assert.ok(errors.some((error) => error.includes("Invalid repository URL for bad id")));
  assert.ok(errors.some((error) => error.includes("Unknown relationship target for bad id: O99")));
  assert.ok(errors.some((error) => error.includes("Invalid surface github for bad id")));
  assert.ok(errors.some((error) => error.includes("Invalid accent.light for bad id")));
  assert.ok(errors.some((error) => error.includes("Invalid accent.dark for bad id")));
});

test("requires the complete ordered registry and relationship objects", () => {
  const errors = validateRegistry([
    {
      registryId: "O02",
      id: "valid-project",
      name: "valid-project",
      artifact: { coordinate: "kr.devslab:valid-project" },
      category: "test",
      links: { repository: "https://github.com/devslab-kr/valid-project" },
      relationships: [],
      surfaces: { readme: true, github: true, docs: false, demo: false, npm: false, maven: true, terminal: false, extension: false },
      glyphConcept: "test glyph",
      status: "active",
      ossAccent: { raw: "#06B6D4", light: "#0E7490", dark: "#22D3EE" },
      accent: { light: "#0E7490", dark: "#22D3EE" },
    },
  ]);

  assert.ok(errors.includes("Registry must contain exactly 12 projects"));
  assert.ok(errors.includes("Registry order 1 must use O01, received O02"));
  assert.ok(errors.includes("Invalid relationships for valid-project"));
});

test("rejects valid-looking mutations of every immutable approved contract group", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const mutations = {
    record: (project) => { project.unapproved = true; },
    registryId: (project) => { project.registryId = "O99"; },
    id: (project) => { project.id = "other-project"; },
    name: (project) => { project.name = "Other project"; },
    artifact: (project) => { project.artifact.coordinate = "kr.devslab:other-project"; },
    category: (project) => { project.category = "other-category"; },
    links: (project) => { project.links.repository = "https://github.com/devslab-kr/other-project"; },
    relationships: (project) => { project.relationships = {}; },
    surfaces: (project) => { project.surfaces.readme = !project.surfaces.readme; },
    glyphConcept: (project) => { project.glyphConcept = "other functional glyph"; },
    status: (project) => { project.status = "inactive"; },
    ossAccent: (project) => { project.ossAccent.raw = "#000000"; },
    accent: (project) => { project.accent.light = project.accent.light === "#1D4ED8" ? "#0F766E" : "#1D4ED8"; },
  };

  for (const [index, project] of projects.entries()) {
    for (const [group, mutate] of Object.entries(mutations)) {
      const altered = structuredClone(projects);
      mutate(altered[index]);
      assert.ok(
        validateRegistry(altered).some((error) => error === `Registry contract mismatch for ${project.registryId}: ${group}`),
        `${project.registryId} ${group}`,
      );
    }
  }
});

test("rejects malformed relationship keys, references, and collection topology", async () => {
  const projects = await loadRegistry(new URL("../registry/oss-projects.json", import.meta.url));
  const invalidCases = [
    ["unknown key", (registry) => { registry[1].relationships.unexpected = "O03"; }, "Invalid relationship key for ssrf-guard: unexpected"],
    ["number reference", (registry) => { registry[1].relationships.sharedGlyphWith = 3; }, "Invalid relationship reference for ssrf-guard.sharedGlyphWith"],
    ["null reference", (registry) => { registry[1].relationships.sharedGlyphWith = null; }, "Invalid relationship reference for ssrf-guard.sharedGlyphWith"],
    ["unknown reference", (registry) => { registry[1].relationships.sharedGlyphWith = "O99"; }, "Unknown relationship target for ssrf-guard: O99"],
    ["self reference", (registry) => { registry[1].relationships.sharedGlyphWith = "O02"; }, "Self relationship for ssrf-guard: O02"],
    ["wrong but known target", (registry) => { registry[1].relationships.sharedGlyphWith = "O04"; }, "Invalid relationship topology for ssrf-guard.sharedGlyphWith"],
    ["non-array collection", (registry) => { registry[11].relationships.collectionOf = "O01"; }, "Invalid relationship collection for devslab-examples.collectionOf"],
    ["number collection member", (registry) => { registry[11].relationships.collectionOf = [1]; }, "Invalid relationship reference for devslab-examples.collectionOf"],
    ["null collection member", (registry) => { registry[11].relationships.collectionOf = [null]; }, "Invalid relationship reference for devslab-examples.collectionOf"],
    ["duplicate collection member", (registry) => { registry[11].relationships.collectionOf[1] = "O01"; }, "Duplicate relationship target for devslab-examples: O01"],
    ["unknown collection member", (registry) => { registry[11].relationships.collectionOf[0] = "O99"; }, "Unknown relationship target for devslab-examples: O99"],
    ["self collection member", (registry) => { registry[11].relationships.collectionOf[0] = "O12"; }, "Self relationship for devslab-examples: O12"],
  ];

  for (const [name, mutate, expectedError] of invalidCases) {
    const altered = structuredClone(projects);
    mutate(altered);
    assert.ok(validateRegistry(altered).includes(expectedError), name);
  }
});

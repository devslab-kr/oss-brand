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

# DevsLab OSS Q-line Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, publish, document, and deploy the DevsLab OSS Q-line identity across the central asset package, DDS, the DevsLab website, the OSS hub, and all 12 registered repositories.

**Architecture:** `oss-brand` owns immutable Q-frame geometry, registered product routes, colors, and deterministic generated assets. DDS supplies a framework-neutral presentation contract without copying product data; public sites and repositories consume a pinned `oss-brand` v0.2.0 release and point to the DevsLab canonical guidance.

**Tech Stack:** Node.js ESM, SVG, Sharp, png-to-ico, Vitest/Node test runner, pnpm DDS monorepo, Astro/React DevsLab site, static GitHub Pages hub, GitHub Actions, GitHub Releases.

**Spec:** `docs/superpowers/specs/2026-08-31-oss-q-line-identity-design.md`

## Global Constraints

- The Q master canvas is `0 0 32 32`; rear plane is `5 5 16 16 rx=2`; front plane is `11 11 16 16 rx=2`.
- Product routes remain within `x=13..25`, `y=13..23`, use a `1.8` round stroke, at most four path primitives, and at most three directional changes.
- Linq marks have no internal route; OSS marks always have one.
- `ssrf-guard` and `ssrf-guard-js` share route and color; no other v0.2 pair may duplicate both.
- `oss-brand` is the single source of registry and generated product assets.
- Existing v0.1.1 remains the rollback baseline.
- Never overwrite unrelated uncommitted changes; consumer work uses isolated worktrees.
- Production rollout starts only after the 128/32/16-pixel and monochrome family review passes.

---

### Task 1: Q-frame and route contracts

**Files:**
- Create: `src/q-line.mjs`
- Modify: `src/glyphs.mjs`
- Modify: `src/registry-contract.mjs`
- Modify: `registry/oss-projects.json`
- Modify: `tests/glyphs.test.mjs`
- Modify: `tests/registry.test.mjs`

**Interfaces:**
- Consumes: current O01–O12 registry IDs, names, relationships, and accent pairs.
- Produces: `Q_FRAME`, `ROUTE_CONTRACT`, `getRouteDefinition(registryId)`, and registry `route` objects used by all generators.

- [ ] **Step 1: Add failing Q-frame and route tests**

Assert the exact geometry, bounds, stroke, O02/O03 equality, nonempty route geometry, and uniqueness of every other 16-pixel signature:

```js
assert.deepEqual(Q_FRAME, {
  viewBox: "0 0 32 32",
  rear: { x: 5, y: 5, width: 16, height: 16, radius: 2 },
  front: { x: 11, y: 11, width: 16, height: 16, radius: 2 },
});
assert.equal(ROUTE_CONTRACT.strokeWidth, 1.8);
assert.deepEqual(getRouteDefinition("O02"), getRouteDefinition("O03"));
```

- [ ] **Step 2: Run contract tests and confirm failure**

Run: `npm test -- --test-name-pattern="Q-frame|route"`

Expected: FAIL because `src/q-line.mjs` and registry routes do not exist.

- [ ] **Step 3: Implement the immutable geometry and 12 registered routes**

`src/q-line.mjs` exports frozen frame/contract objects and validates coordinates, primitive count, and allowed commands. `src/glyphs.mjs` becomes a compatibility adapter returning Q-frame plus route data instead of unrelated silhouettes. Store each route's `paths`, `meaning`, and optional `optical16` in `registry/oss-projects.json`.

- [ ] **Step 4: Run route and registry tests**

Run: `npm test -- --test-name-pattern="Q-frame|route|registry"`

Expected: PASS; only O02/O03 share a route signature.

- [ ] **Step 5: Commit**

```bash
git add src/q-line.mjs src/glyphs.mjs src/registry-contract.mjs registry/oss-projects.json tests/glyphs.test.mjs tests/registry.test.mjs
git commit -m "feat: define OSS Q-line geometry and routes"
```

### Task 2: Deterministic Q-line asset generation

**Files:**
- Modify: `src/svg.mjs`
- Modify: `src/assets.mjs`
- Modify: `src/social.mjs`
- Modify: `src/color.mjs`
- Modify: `scripts/generate.mjs`
- Modify: `tests/generated-assets.test.mjs`
- Modify: `tests/color.test.mjs`
- Modify: `tests/determinism.test.mjs`
- Create: `tests/q-line-visual.test.mjs`
- Regenerate: `dist/**`

**Interfaces:**
- Consumes: `Q_FRAME`, `ROUTE_CONTRACT`, and `getRouteDefinition(registryId)` from Task 1.
- Produces: stable color/dark/monochrome/reversed SVG, raster icons, favicons, social assets, checksums, archives, and `dist/q-line-family-review.svg`.

- [ ] **Step 1: Add failing generated-asset tests**

Require each color SVG to contain the two exact rectangles and a white `stroke-width="1.8"` route; require monochrome and reversed variants to contain the route; require 16-pixel PNGs to exist and differ for all unrelated projects.

```js
assert.match(svg, /x="5" y="5" width="16" height="16" rx="2"/);
assert.match(svg, /x="11" y="11" width="16" height="16" rx="2"/);
assert.match(svg, /stroke-width="1\.8"/);
```

- [ ] **Step 2: Run generation tests and confirm failure**

Run: `npm test -- --test-name-pattern="generated|Q-line visual|color"`

Expected: FAIL because the current generator emits legacy glyph paths.

- [ ] **Step 3: Implement SVG variants and optical 16-pixel rendering**

Generate rear/front planes from the project accent pair, overlay the route, use a contrast-selected route for dark assets, and use outline/solid separation for monochrome. Use `optical16 ?? paths` only for the 16-pixel raster. Build a review board containing all projects at 128, 32, 16, and monochrome sizes.

- [ ] **Step 4: Regenerate and run the complete central suite**

Run: `npm run generate && npm test && npm run validate && npm run check:determinism && npm run release:dry-run`

Expected: every command exits 0 and a second generation produces no diff.

- [ ] **Step 5: Review the board and commit**

Open `dist/q-line-family-review.svg`; reject routes that collide at 16 pixels, then adjust only registered route data and rerun Step 4.

```bash
git add src scripts registry tests dist
git commit -m "feat: generate OSS Q-line asset family"
```

### Task 3: Publish `oss-brand` v0.2.0

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `dist/index.json`
- Modify: `dist/downloads/**`

**Interfaces:**
- Consumes: validated deterministic artifacts from Task 2.
- Produces: Git tag `v0.2.0` and a public GitHub Release with per-project archives, manifest, checksums, and the family review board.

- [ ] **Step 1: Update release metadata and usage documentation**

Set version `0.2.0`, document the Q-line distinction from Linq marks, the canonical URL, archive pinning, accessibility usage, and v0.1.1 rollback link.

- [ ] **Step 2: Validate the exact release payload**

Run: `npm ci && npm run generate && npm test && npm run validate && npm run release:dry-run`

Expected: exit 0; archive names are unique; checksums match regenerated files.

- [ ] **Step 3: Commit, push, tag, and publish**

```bash
git add package.json package-lock.json README.md dist
git commit -m "release: prepare OSS brand v0.2.0"
git push origin HEAD
git tag -a v0.2.0 -m "DevsLab OSS Q-line identity v0.2.0"
git push origin v0.2.0
gh release create v0.2.0 dist/downloads/*.zip dist/downloads/SHA256SUMS.txt dist/index.json dist/q-line-family-review.svg --title "DevsLab OSS Brand v0.2.0" --notes "Introduces the shared Q-line OSS identity. v0.1.1 remains the rollback baseline."
```

- [ ] **Step 4: Verify the public release**

Run: `gh release view v0.2.0 --json isDraft,isPrerelease,assets,url`

Expected: public, not draft, not prerelease, with 12 project archives plus index, checksums, and review board.

### Task 4: DDS presentation contract and guidance

**Files:**
- Create: `packages/site-kit/src/solid/oss-product-mark.tsx`
- Modify: `packages/site-kit/src/solid/index.ts`
- Modify: `packages/site-kit/styles.css`
- Modify: `tests/site-kit-contracts.test.mjs`
- Modify: `packages/site-kit/tests/solid.test.tsx`
- Modify: `brand/index.html`

**Interfaces:**
- Consumes: a caller-supplied versioned Q-line SVG URL or inline SVG and exact accessible project name.
- Produces: `OssProductMarkProps { name: string; src: string; size?: "sm" | "md" | "lg"; decorative?: boolean }` and `OssProductMark` without embedding registry data.

- [ ] **Step 1: Add failing export, SSR, and accessibility tests**

Assert that `decorative=true` produces empty alternative text and that an identifying mark uses `alt={name}`. Assert the export exists and no O01–O12 route data appears in DDS.

- [ ] **Step 2: Run focused DDS tests and confirm failure**

Run: `pnpm test --filter site-kit`

Expected: FAIL because `OssProductMark` is not exported.

- [ ] **Step 3: Implement the component, CSS sizes, and documentation section**

Use an `<img>` with fixed intrinsic dimensions, `decoding="async"`, no animation, and DDS focus/layout tokens. Add a brand-guide section explaining that `oss-brand` is the source and linking to `https://devslab.kr/brand/open-source/`.

- [ ] **Step 4: Run DDS verification and commit**

Run: `pnpm install --frozen-lockfile && pnpm test && pnpm build`

Expected: exit 0.

```bash
git add packages/site-kit tests brand/index.html
git commit -m "feat: document and present OSS Q-line marks"
```

- [ ] **Step 5: Push and publish the affected DDS package through its existing release workflow**

Push a branch, open a PR, wait for required checks, merge it, and run the repository's existing site-kit release workflow. Verify the published package version and the public DDS brand page.

### Task 5: Canonical DevsLab pages and OSS hub

**Files:**
- Modify in `jlc488/devlab.kr`: the existing `/brand/products` and `/brand/open-source` page source, route tests, and vendored `public/brand/oss/v0.2.0/**` assets.
- Modify in `devslab-kr/devslab-kr.github.io`: `index.html`, vendored v0.2.0 marks, favicon, and OG asset.

**Interfaces:**
- Consumes: public `oss-brand` v0.2.0 release manifest and checksums.
- Produces: canonical rules at `/brand/open-source/`, Linq-vs-OSS relationship copy at `/brand/products/`, and an updated public hub.

- [ ] **Step 1: Add failing page/link/version tests**

Require the canonical page to contain Q-frame construction, route rules, color assignments, light/dark/monochrome examples, accessibility, prohibited uses, downloads, `v0.2.0`, and `v0.1.1` rollback. Require DDS and hub links to target the canonical URL.

- [ ] **Step 2: Vendor and verify central release assets**

Download the v0.2.0 release manifest and required archives into isolated worktrees; run SHA-256 verification before extracting. Record `v0.2.0` in each vendor manifest.

- [ ] **Step 3: Implement page and hub updates**

Keep the full rule set only on the canonical page. Add short summaries and canonical links elsewhere. Preserve the approved right-origin hero color atmosphere and update favicons/OG imagery to the Q-line system.

- [ ] **Step 4: Run local builds and browser checks**

Run each repository's documented install, test, and build commands; serve the built output and verify desktop/mobile light/dark screenshots, keyboard navigation, no horizontal overflow, and successful asset requests.

- [ ] **Step 5: Commit, push, open PRs, wait for checks, and merge**

Use one PR per repository. Merge only after all required checks succeed.

- [ ] **Step 6: Verify production**

Require HTTP 200 for `https://devslab.kr/brand/products/`, `https://devslab.kr/brand/open-source/`, `https://devslab-kr.github.io/`, and representative v0.2.0 SVG/OG assets. Confirm page copy reports v0.2.0.

### Task 6: Roll out to all 12 registered OSS repositories

**Files:**
- Modify per repository: vendored brand asset directory, README header/reference, favicon/PWA/app/extension assets where present, OG metadata, and the repository's brand-version manifest.

**Interfaces:**
- Consumes: the matching archive from the public `oss-brand` v0.2.0 release.
- Produces: 12 isolated PRs pinned to v0.2.0 with unchanged product behavior.

- [ ] **Step 1: Resolve every canonical repository and dirty-worktree state**

Map O01–O12 from `dist/index.json`. Record `git status --short` for each canonical checkout and create an isolated `oss-q-line-v0.2.0` worktree from the remote default branch.

- [ ] **Step 2: Verify and apply each versioned archive**

Validate each archive against `SHA256SUMS.txt`, extract only the matching project directory, and update the local version manifest. Do not copy another project's assets or touch source behavior.

- [ ] **Step 3: Run repository-specific validation**

Run each repository's existing lint, test, build, and asset-reference checks. For browser surfaces, confirm favicon/manifest/OG requests. For Maven projects, run the existing wrapper; for npm projects, use the lockfile-selected package manager.

- [ ] **Step 4: Commit and open 12 PRs**

Use commit subject `chore: adopt OSS Q-line brand v0.2.0`. PR bodies identify the central release, canonical guidance, checks performed, and v0.1.1 rollback source.

- [ ] **Step 5: Wait for all hosted checks and merge successful PRs**

Do not merge a PR with failed or pending required checks. Reproduce and fix failures only in the isolated worktree for that repository.

### Task 7: Final live verification and rollout report

**Files:**
- Create in the task workspace: `outputs/oss-q-line-v0.2.0-rollout-report.md`

**Interfaces:**
- Consumes: GitHub release, merged PRs, hosted CI results, and live URLs from Tasks 3–6.
- Produces: an auditable table of repository, PR, merge commit, checks, deployed URL, asset version, and rollback link.

- [ ] **Step 1: Verify release and PR states**

Use `gh release view`, `gh pr view --json state,mergeCommit,statusCheckRollup,url`, and repository default-branch heads. Require release public and every intended PR merged.

- [ ] **Step 2: Verify live HTTP and metadata**

Request all official pages and representative assets. Require HTTP 200, v0.2.0 version text/manifest, canonical links, correct content types, and nonzero asset sizes.

- [ ] **Step 3: Verify canonical worktrees were preserved**

Compare the pre-rollout dirty-status records with the final canonical checkout status. Report any pre-existing changes unchanged and do not delete user worktrees.

- [ ] **Step 4: Write the rollout report**

Record exact URLs, tag, release assets, PRs, merge commits, CI state, local-only limitations, and the v0.1.1 rollback reference. A deployment is complete only when the report contains no pending required checks or unknown live status.

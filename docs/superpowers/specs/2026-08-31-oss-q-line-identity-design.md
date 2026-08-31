# DevsLab OSS Q-line Identity Design

## Purpose

Replace the unrelated O01–O12 glyph silhouettes with one extensible DevsLab OSS family. Every OSS project uses the same offset-square Q frame; the product-specific route inside the frame and the approved product color identify the project.

The system must support current and future OSS projects without inventing a new logo architecture for each addition. `oss-brand` remains the single source of truth. DevsLab brand pages, DDS documentation, the OSS hub, and project repositories consume versioned outputs and link back to the canonical guidance.

## Brand relationship

- DevsLab is the owner and endorsement layer.
- Linq products keep the existing two filled offset squares without an internal route.
- DevsLab OSS uses the same geometric lineage plus a mandatory internal route. The route is the visible distinction between a Linq product mark and an OSS project mark.
- OSS lockups retain the project name and the endorsement `Open source by DevsLab`. They never use a Linq product wordmark.
- `ssrf-guard` and `ssrf-guard-js` share one route and color. Runtime is expressed only in the wordmark or adjacent text.

## Fixed Q frame

The master canvas is `0 0 32 32`.

- Rear plane: `x=5`, `y=5`, `width=16`, `height=16`, `rx=2`.
- Front plane: `x=11`, `y=11`, `width=16`, `height=16`, `rx=2`.
- The offset is exactly 6 units on both axes.
- Plane positions, dimensions, offset, corner radius, and view box are immutable across projects.
- Color marks use the project light accent on the rear plane and the project dark accent on the front plane.
- No enclosing tile, shield, circle, letter badge, drop shadow, bevel, or gradient is part of the mark.

## Product route contract

Each project owns one route definition rendered over the Q frame.

- Route coordinates stay within `x=13..25` and `y=13..23` on the 32-unit master.
- Standard route stroke is `2.4` units with round caps and round joins.
- A route uses at most three simple path primitives and at most three directional changes; one or two primitives are the target (see the v0.3.0 route simplification spec).
- Routes may use straight orthogonal or 45-degree diagonal segments. Curves, text, numerals, tiny dots, and enclosed micro-shapes are prohibited.
- The route represents the primary product action, not its implementation language or framework.
- The route must remain recognizable in the monochrome mark and in the dedicated 16-pixel rendering.
- Two unrelated projects may not use routes that become indistinguishable at 16 pixels. Shared routes require an explicit registry relationship such as the SSRF runtime pair.

Initial action assignments:

| Registry | Project | Route meaning |
| --- | --- | --- |
| O01 | editor-ruler | measured rail with unequal stops |
| O02/O03 | ssrf-guard / ssrf-guard-js | inbound path interrupted at a boundary |
| O04 | numkey | numeric value stepped up and down |
| O05 | kokey | single confirmed correction stroke |
| O06 | vue-date-rail | one raised selection on a date rail |
| O07 | locale-match | candidate paths resolving to one output |
| O08 | easy-paging | repeated forward page steps |
| O09 | api-log | three event records entering one stack |
| O10 | devslab-kit | modular assembly cross |
| O11 | DataLinq | opposing transfer lanes |
| O12 | devslab-examples | forward run marker |

## Color allocation

Existing project impressions are preserved through their current light/dark accent pairs. Color is secondary to the route, so every mark must still work without color.

- Each registry entry stores `accent.light` and `accent.dark`.
- A future project receives the nearest semantically appropriate unused hue slot, then a distinct route.
- Adjacent projects on portfolio and hub grids must not share both hue family and route rhythm.
- New colors require a light-theme foreground/background contrast check and a dark-theme foreground/background contrast check. Accompanying text and interactive boundaries meet WCAG 2.2 AA; icon-only controls meet the 3:1 non-text contrast requirement.
- The SSRF runtime pair is the only approved duplicate color/route pair in v0.2.

## Variants and accessibility

Generated assets include color, dark, monochrome, reversed, favicon, 16/32/48/180/192/512 pixel icons, maskable icons, OG images, README headers, lockups, and per-project archives.

- Color: light rear plane, dark front plane, white route.
- Dark: dark-theme accent planes with a high-contrast route selected by the generator.
- Monochrome: one foreground color; plane separation and the route remain visible through outline/solid treatment and negative space.
- Reversed: white or near-white planes on a dark surface with a dark route.
- The 16-pixel asset may use an explicitly registered optical route variant, but it may not change the route meaning.
- Decorative marks use empty alternative text or `aria-hidden=true`. Linked or standalone identifying marks use the exact project name as their accessible name.
- Product identity must never rely on color alone; registry and generation tests compare monochrome and 16-pixel route signatures.

## Source and consumer architecture

`oss-brand` owns:

- Q-frame geometry and route validation;
- the project registry, colors, relationships, and route definitions;
- deterministic SVG/PNG/social/lockup generation;
- downloadable ZIP archives, checksums, and the release manifest;
- visual regression fixtures for the full family at 16, 32, and 128 pixels.

DDS owns only reusable presentation behavior:

- an `OssProductMark` presentation contract accepting an asset URL or inline SVG, accessible name, and size;
- spacing, focus, theme, and reduced-motion behavior;
- documentation pointing to the canonical DevsLab OSS brand page and versioned `oss-brand` release.

DDS does not copy the registry or author product routes. The DevsLab website and OSS hub vendor a pinned `oss-brand` release with its checksum manifest. Individual project repositories vendor only their project archive and record the source release version.

## Official documentation

The canonical public source is `https://devslab.kr/brand/open-source/`.

It documents the relationship to DevsLab and Linq, Q-frame construction, route rules, current project colors, light/dark/monochrome examples, favicon/OG/app-icon behavior, accessibility, prohibited uses, downloads, and the current release version.

`https://devslab.kr/brand/products/` adds a short comparison between the route-free Linq mark and the routed OSS mark. DDS, the OSS hub, and each project provide a concise usage summary and link to the canonical page rather than duplicating the full rules.

## Prohibited uses

- Changing, rotating, stretching, cropping, or enclosing the Q frame.
- Removing the internal route from an OSS mark.
- Adding a route to a Linq product mark.
- Recoloring a project with another project's registered pair.
- Using letters, runtime labels, framework logos, flags, globes, shields, or decorative effects inside the frame.
- Publishing an unregistered route or color as an official DevsLab OSS identity.
- Using a detailed asset where the dedicated 16-pixel optical variant is required.

## Release and rollout

The central deliverable is `oss-brand` v0.2.0 because the visible identity and generated file contents change while paths remain stable. Existing v0.1.1 assets remain the rollback baseline.

Rollout order:

1. Implement and validate Q-line generation in `oss-brand`.
2. Review the complete 12-project board at 128, 32, 16, and monochrome sizes.
3. Publish `oss-brand` v0.2.0 and its checksum manifest.
4. Update the DevsLab canonical pages and DDS usage documentation/component contract.
5. Update the OSS hub.
6. Update each project from the pinned v0.2.0 archive without overwriting unrelated local changes.
7. Verify hosted CI, live favicons, OG images, README assets, and canonical links.

No production consumer is updated before the central visual board and generated-asset validation pass.

## Acceptance criteria

- All 12 projects use the identical fixed Q frame.
- Every unrelated project remains distinguishable by route in monochrome at 16 pixels.
- Color, dark, monochrome, and reversed variants pass automated geometry and contrast contracts.
- Generation is deterministic and release archives/checksums validate.
- The canonical website, DDS, OSS hub, and project summaries agree on the v0.2.0 source version and canonical URL.
- Existing uncommitted changes in every consumer repository are preserved.
- v0.1.1 remains available as a documented rollback source.

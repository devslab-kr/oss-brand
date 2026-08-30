# DevsLab OSS Brand

Public, deterministic source assets for the DevsLab Open Source portfolio.
The portfolio contains the immutable registry IDs O01–O12: editor-ruler,
ssrf-guard, ssrf-guard-js, numkey, kokey, vue-date-rail, locale-match,
easy-paging, api-log, devslab-kit, DataLinq, and devslab-examples.

DevsLab is the owner/endorsement layer. Version 0.2 uses the Linq family's
offset-square geometry as a fixed Q frame, then adds a mandatory product route
inside it. Linq product marks never contain that route; OSS marks always do.
Use project glyphs with the project name and the standard `Open source by
DevsLab` endorsement where room permits.

The Q frame is immutable: a 32-unit canvas, a 16-unit rear plane at `(5,5)`,
a 16-unit front plane at `(11,11)`, a 6-unit offset, and 2-unit corner radii.
Only the registered internal route and the registered light/dark product color
pair change. Runtime labels and framework logos belong in adjacent copy, never
inside the mark.

## Consumers and downloads

Download the versioned project ZIP matching the registered project ID from the
GitHub Release. Vendor the extracted snapshot in a consumer repository and
first verify the downloaded ZIP bytes against the release `SHA256SUMS.txt`,
then extract it and verify every extracted file against its internal
`checksums.txt`; do not add this repository as a runtime dependency. Official rules live at
https://devslab.kr/brand/open-source/ and discovery/demos live at
https://devslab-kr.github.io/.

Each project ZIP contains color, dark, monochrome, and reversed SVG glyphs; project
lockups; favicons; app icons; OG and README headers; and project checksums.
Use the registered product pair, use monochrome/reversed variants for
constrained surfaces, and never remove the route, recolor the project, alter
the Q frame, or put a gradient inside a mark. Decorative marks use empty alt
text; identifying marks use the exact project name.

## Generation and validation

Node 20+ is required. `npm ci` installs pinned tools. `npm run generate`
rebuilds `dist/`; `npm test` runs the unit/integration tests; and `npm run
check` regenerates assets, tests them, validates SVG/registry structure,
compares independent generations, and performs a release dry-run.

The canonical registry is `registry/oss-projects.json`. Its order and O01–O12
identifiers are immutable. Q geometry and routes are defined in
`src/q-line.mjs` and exported in `dist/index.json`. Generated archives use
fixed metadata and lexically ordered inputs so release artifacts are
reproducible. `dist/q-line-family-review.svg` is the required 128/32/16-pixel
and monochrome review surface.

## Hero atmosphere contract

Use `.hero-atmosphere` with a decorative
`.hero-atmosphere__glow[aria-hidden="true"]` child and put meaningful content
in a sibling above it. Set `data-atmosphere="corporate|oss|linq|project"`.
The glow is on the physical right at 86% 22%, ignores pointer events, uses at
most .11 opacity on light surfaces and .10 on dark surfaces, allows at most .08
for an optional project accent, and is disabled in forced-colors and print.
See `dist/atmosphere.css` and `dist/atmosphere-usage.md` for portable markup.

## Versioning

Git tags and GitHub Releases use `vMAJOR.MINOR.PATCH`. A release is created
only after `npm run check` succeeds and includes twelve deterministic project
ZIPs plus `SHA256SUMS.txt`, `index.json`, and the family review board. The
release package is not published to npm. Version `v0.1.1` remains the rollback
source for the pre-Q-line identity.

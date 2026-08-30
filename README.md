# DevsLab OSS Brand

Public, deterministic source assets for the DevsLab Open Source portfolio.
The portfolio contains the immutable registry IDs O01–O12: editor-ruler,
ssrf-guard, ssrf-guard-js, numkey, kokey, vue-date-rail, locale-match,
easy-paging, api-log, devslab-kit, DataLinq, and devslab-examples.

DevsLab is the owner/endorsement layer. This OSS glyph family is separate from
the DevsLab corporate notched mark and the Linq Product Family two-square mark.
Use project glyphs with the project name and the standard `Open source by
DevsLab` endorsement where room permits.

## Consumers and downloads

Download the versioned project ZIP matching the registered project ID from the
GitHub Release. Vendor the extracted snapshot in a consumer repository and
verify its `checksums.txt` against the release `SHA256SUMS.txt`; do not add this
repository as a runtime dependency. Official rules live at
https://devslab.kr/brand/open-source/ and discovery/demos live at
https://devslab-kr.github.io/.

Each project ZIP contains color, monochrome, and reversed SVG glyphs; project
lockups; favicons; app icons; OG and README headers; and project checksums.
Use the color glyph only with its approved OSS cyan, use monochrome/reversed
variants for constrained surfaces, and never put a gradient inside a mark.

## Generation and validation

Node 20+ is required. `npm ci` installs pinned tools. `npm run generate`
rebuilds `dist/`; `npm test` runs the unit/integration tests; and `npm run
check` regenerates assets, tests them, validates SVG/registry structure,
compares independent generations, and performs a release dry-run.

The canonical registry is `registry/oss-projects.json`. Its order and O01–O12
identifiers are immutable. Generated archives use fixed metadata and lexically
ordered inputs so release artifacts are reproducible.

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
ZIPs plus `SHA256SUMS.txt`. The release package is not published to npm.

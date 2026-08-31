# Q-line Route Simplification (v0.3.0)

## Problem

Owner review of the published v0.2.0 family on `https://devslab.kr/brand/open-source/`:
the internal route strokes read as visual noise — "too complex".

The critique holds up quantitatively:

- The route safety area is 12×12 units of a 32-unit canvas (~14% of the icon
  area). At a 16-pixel rendering that area is 6×6 device pixels.
- Seven of twelve routes used 3–4 primitives; a 1.8-unit stroke maps to
  0.9 px at 16 px, with inter-stroke gaps down to 1 px. Parallel strokes
  merged into mush at 32 px and below (editor-ruler, numkey, vue-date-rail,
  locale-match, easy-paging).
- Several routes were miniature diagrams narrating behavior ("three candidate
  paths resolving to one output") instead of a single readable motif. A mark
  needs distinctness, not narrative.

## Change

One motif per project, fewer and thicker strokes. Contract deltas:

| Contract | v0.2.0 | v0.3.0 |
| --- | --- | --- |
| Route stroke | 1.8 | 2.4 |
| Max primitives per route | 4 | 3 |
| Target primitives | — | 1–2 (3 only where the motif requires it) |
| Min parallel-stroke separation | — | 4 units (guideline) |

Route revisions (frame, colors, safety area, caps/joins unchanged):

| Registry | Project | v0.3.0 motif | Primitives |
| --- | --- | --- | --- |
| O01 | editor-ruler | rail with two unequal stops | 3 |
| O02/O03 | ssrf-guard(-js) | inbound line stopped at one boundary bar | 2 |
| O04 | numkey | stepper chevrons (up / down) | 2 |
| O05 | kokey | single confirmation/correction check | 1 |
| O06 | vue-date-rail | one raised selection block on a rail | 2 |
| O07 | locale-match | two candidates merging into one output | 2 |
| O08 | easy-paging | double forward chevron | 2 |
| O09 | api-log | three record lines (unchanged) | 3 |
| O10 | devslab-kit | assembly cross, recentered on the front plane | 2 |
| O11 | DataLinq | two opposing half-arrow transfer lanes | 2 |
| O12 | devslab-examples | single run/play triangle | 1 |

Route meanings and `glyphConcept` strings were updated where the motif
changed. Distinctness at 16 px was re-verified across the family board;
O02/O03 remain the only approved shared route.

## Not changed

- Q-frame geometry, offsets, radii, view box, plane colors.
- Variant model (color / dark / monochrome / reversed) and paint rules.
- File layout of `dist/` — consumers re-pin the release, paths are stable.

## Rollout

Same order as v0.2.0: validate here → publish v0.3.0 + checksums → re-sync
devslab.kr pinned snapshot → OSS hub → per-project archives. v0.2.0 becomes
the rollback baseline.

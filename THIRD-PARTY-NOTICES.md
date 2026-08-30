# Third-party notices

## Geist

Outlined wordmarks are generated at build time from `@fontsource/geist` version
`5.3.0`, specifically its `geist-latin-400-normal.woff2` source file. Geist is
licensed under the SIL Open Font License 1.1 (OFL-1.1). The source package and
its complete license text are distributed at `node_modules/@fontsource/geist/LICENSE`
after `npm ci`; generated SVGs embed only path data and never a font file.

## fontkit

`fontkit` version `2.0.4` parses the pinned Geist source and converts glyphs
to deterministic SVG paths. fontkit is licensed under the MIT License.

## Raster and archive generation

Generated PNG assets use `sharp` version `0.35.4` (Apache-2.0) with its
documented bundled/libvips notices. Deterministic ZIP archives use `fflate`
version `0.8.3` (MIT). Multi-frame ICO assets use `png-to-ico` version `3.0.2`
(MIT). These packages are build-time dependencies only and are not embedded in
the distributed brand assets.

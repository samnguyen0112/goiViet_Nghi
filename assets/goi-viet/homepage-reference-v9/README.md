# Preview 3 · P1 per-depth palette

Source: all 64 original layers in `homepage-reference-v8`, separately for 2K/4K.
48 layers are graded; 16 protected layers are copied as identical encoded bytes.
All 64 decoded alpha planes per quality are byte-identical to v8. Geometry, z order,
occlusion masks, animation timings and paths remain unchanged.

`tools/grade-home-reference-p1.py` includes the supplied P1 `grade`, color conversion,
weight, ramp and tier functions verbatim. Grading happens at build time, per original
layer; no runtime color filter or composited screenshot is used for animation.
The poster is separately rendered at 12 seconds for reduced-motion/load fallback.

## Encoding decision

The plan's suggested lossy WebP 96/97 introduced decoded hues below the 115-degree
boundary through chroma subsampling. Even quality 100 did not satisfy the
non-increase check. A separate hue-safe RGB quantization prepass (12-unit lattice)
followed by **lossless WebP** avoids that chroma bleed. This is the compression
stage, not a replacement of the supplied P1 grading formula. Original alpha is
copied unchanged. Protected layers bypass both grading and compression entirely.
The quality gates are measured on the decoded, rendered output, not pre-encode
arrays: per-channel reference MAE <2/255, all six P1 color thresholds, and bundle
size within ±10%. Input neutral pixels are also audited before compression.

## Rebuild and verify

Requires Node, Python with NumPy/Pillow, and the workspace Sharp/Playwright/canvas
runtime used by the existing build tools.

```
node tools/build-home-reference-v9.cjs
python -I tools/check-home-p1-colors.py
node tools/check-home-reference-v9.cjs
```

Color verification uses the user-approved `P1-t12.png` copied to
`verification/t2-p1-upgrade/P1-reference-t12.png`. Browser baseline comparison uses
the pre-upgrade Preview 3 snapshot and source hashes in the same verification
directory. Reports and screenshots are written there. `build-report.json` records
per-layer alpha and protected-byte checks for both bundles.

Only Preview 3 uses `homepage-layered-scene-3.js`. Changing its body's
`data-home-art` back to `reference-v8` selects both old bundles and old posters.
The original adapter, v8 files, main index and earlier previews stay unchanged.

Per the approved P1 scope, invitation corner artwork and the memory chapter remain
unchanged. The existing seam samples the newly rendered homepage; no new screenshot
layer is introduced. The separate experimental falling-leaf demos are not installed.

Performance verification compares the same warmed poses and render budget, with
the existing crane compositor active. Headless RAF throughput under background-tab
suspension/idle-cache rebuilding is not a reliable physical-display FPS benchmark.

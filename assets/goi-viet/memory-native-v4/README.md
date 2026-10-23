# Native artwork for the middle chapter, revision 4

The user approved `references/approved-station-bay.png` and requested independently generated detail across the entire chapter, including the final bay and rural station. This replaces the old pipeline that enlarged small reference crops.

There are 29 individually generated production images. Built-in `image_gen` was used for each semantic component; the complete prompts are in `generation-prompts-complete.json`. Reference images guide the design and style; their old small pixels are not enlarged to create the new objects.

- `sources/`: untouched native PNG generations, including original transparency.
- `*.webp`: native lossless WebP exports. Only unused transparent outer margins are trimmed. No enlargement or artificial sharpening.
- `*-640.webp`, `*-1280.webp`: smaller responsive variants, produced only when the original is wider, at quality 96 with full alpha quality.
- `assets.json`: actual generated dimensions, trimmed native dimensions, source hashes, encoding, responsive variants, and bytes.
- `composition.json`: canonical coordinates, shared wheel/rail baseline, station placement and component counts.
- `references/approved-station-bay.png`: the approved combined composition, kept as a reference rather than a flattened page background.

Integration lives in `tools/integrate-memory-native-v4.cjs` and the additive `memory-native-v4.css`. Live headings, captions, card questions and buttons remain selectable, accessible HTML. The final scene is composited from a separate background, map, boats, clouds, bridge/track, embankment, station, four coaches, locomotive and foreground foliage.

The final heading and map-entry ticket are centered in the pale upper sky. The train stays on one horizontal wheel baseline and decelerates into the station in 6.8 seconds. Reduced-motion preferences use the final stationary arrangement. On mobile, the artwork is reframed so the engine, station and CTA remain visible.

These are real native image-generation outputs, not an advertised interpolated 4K master. For example, the bay background was generated at 1672 × 941, while individual close-up assets have their own native pixel dimensions listed in the manifest. The source PNGs preserve all generated detail. Large displays use the largest available native export, while foreground detail comes from separately authored close-ups.

Review and validation artifacts are in `verification/memory-native-v4/`, including complete desktop/mobile chapters, final-scene screenshots, an asset contact sheet, image-quality audit, responsive checks and motion checks.

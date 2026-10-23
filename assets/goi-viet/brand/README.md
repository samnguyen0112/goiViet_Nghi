# Gói Việt shared logo

Regenerated with the built-in `image_gen` tool using the existing Gói Việt logo as
the identity reference. The PNG preserves the original generated alpha channel;
the WebP is a lossless encoding at the same native resolution. No background box,
upscaling, hand-drawn trace, sharpening or recoloring is applied by the build script.

The map, postcard, main index and earlier preview pages use this shared logo. Responsive WebP copies
at 512 and 1024 px keep small placements light while `srcset` retains the native
1850 px artwork for larger displays. The postcard's offline
canvas payload is generated from the exact PNG master in `postcard-logo-data.js`.

## Preview 3 homepage: ivory and red-pink ribbon logo

The `map-surroundings-preview-3.html` homepage logo placements use the user-approved one-line ivory
lettering, red-pink silk ribbons and conical hat supplied on 23 October 2026.
Versioned assets keep the approved artwork independent of the shared map/postcard
logo: `goi-viet-logo-ivory-ribbon-v2.webp` (1902 × 827) and responsive 512/1024 px
copies. All three are lossless WebP with alpha; the native copy preserves every
visible RGB pixel and every alpha value of the supplied PNG. No recoloring,
sharpening, background removal or upscaling is applied. All homepage placements
declare the new intrinsic dimensions so the logo keeps its aspect ratio while
the existing entrance, hover and reduced-motion controls continue to apply.

Verification: `node tools/check-preview3-logo-ivory.cjs` and
`node tools/check-home-crane-rig.cjs`. The logo check can additionally compare ten
entrance/ambient checkpoints when `verification/preview3-logo-ivory/preview3.before.html`
contains the pre-change Preview 3 page. Reports and screenshots are written under
`verification/preview3-logo-ivory/`.

Preview 3's waiting screen shares these same responsive assets. Its centered
logo, tagline, start action and loading state are styled separately in
`map-surroundings-preview/home-gate-3.css`. Only the visible native start button owns the gesture; its paper container and
logo are passive. Initial autofocus is omitted to avoid an unsolicited focus ring.
The first-frame paper background and the existing opening timeline are retained.
Run `node tools/check-preview3-home-gate.cjs` to verify responsive fitting,
keyboard controls, slow/failed scene loading, reduced motion and fallback when
the opening controller fails. Evidence is in `verification/home-gate-3/`.

Final generation prompt:

> Edit this Gói Việt logo. Keep exactly the same silhouette, lettering, spelling
> 'Gói Việt', Vietnamese accent marks, composition, leaf flourishes, hat and relative
> proportions. One targeted correction: replace the current embossed/glowing/textured
> rendering and its scattered pixel debris with extremely CLEAN smooth flat 2D
> vector-style fills, subtle burgundy-to-red gradients only within the solid letters.
> Remove every glowing red/pink outer fringe and all isolated dots and specks around
> and inside the logo. No etched outline, no double contour, no shiny bevel, no brush
> grain. Every glyph is one crisp connected calligraphic shape with finely
> anti-aliased solid boundary. Hat has tidy ivory/tan flat illustration detail and red
> strap, no surrounding border. All non-logo pixels including letter counters are
> fully transparent alpha. Pure, precise web logo, sharp at small scale on dark jade
> or cream. Preserve the recognizable calligraphic identity, not a font substitution.
> Wide landscape canvas, entire mark visible, modest transparent margin. This must
> be an actually transparent PNG; no background and no container.

Rebuild: `node tools/build-brand-logo.cjs <generated-logo.png>`.

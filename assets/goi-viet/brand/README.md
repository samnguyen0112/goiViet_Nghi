# Gói Việt shared logo

Regenerated with the built-in `image_gen` tool using the existing Gói Việt logo as
the identity reference. The PNG preserves the original generated alpha channel;
the WebP is a lossless encoding at the same native resolution. No background box,
upscaling, hand-drawn trace, sharpening or recoloring is applied by the build script.

All active website logo placements use this shared logo. Responsive WebP copies
at 512 and 1024 px keep small placements light while `srcset` retains the native
1850 px artwork for larger displays. The postcard's offline
canvas payload is generated from the exact PNG master in `postcard-logo-data.js`.

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

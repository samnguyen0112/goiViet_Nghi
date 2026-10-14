# Departure scene

`departure-3d.mjs` is the editable source. `departure-3d.bundle.js` is the browser-ready,
locally bundled asset loaded by `index.html`. Keep `assets/` beside the HTML when copying
the app. No CDN, remote models, remote images, or runtime network requests are needed.

The locomotive and three carriages are real rigid meshes, with beveled bodies, cylindrical
boilers, domed roofs, spoked wheels, connecting rods, brass trim and procedural steam.
The original welcome illustration remains unchanged. Departure reconstructs its gold roofs,
four-window carriages, colors and side star in rigid 3D geometry, initially aligned to the
on-page train rectangle. The departure has no railway or separate landscape. The SVG is
hidden only during the ride and restored on exit.

The scene uses Three.js **0.186.1**, MIT license in `THREE-LICENSE.txt`.
Rendering uses [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html),
[PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html) and
[MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html).
WebGL2 is required for the 3D scene. If unavailable, the normal map remains accessible
through a short text transition. Reduced motion bypasses the scene.

## Rebuild

Install `three@0.186.1` and `esbuild@0.25.12` in a build-only folder, then run:

```powershell
node tools/build-departure.cjs "<build-folder>/node_modules"
node verification/check-departure-3d.cjs
```

The source hash in the bundle header verifies that source and output agree. The build
dependencies are not required to open the page. The implementation caps pixel ratio,
merges static geometry by material, and disposes meshes/materials/textures, listeners,
animation frames and the WebGL context when the scene ends or is skipped.

## Evidence limits

`verification/render-3d-preview.cjs` renders geometry/camera contact sheets using a local
Canvas library. Its lighting is an approximation; those images are **not** browser
screenshots or evidence of WebGL performance. See `verification/departure-3d.md`.

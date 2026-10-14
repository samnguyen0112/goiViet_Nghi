# Local regional geography preview

This folder is used only by the cloned HTML preview. Production `index.html`
and all existing assets are untouched by the geography builder.

Load `regional-geometry.js` before the preview renderer. The asset exposes
`window.GoiVietRegionalGeometry` and performs no runtime external requests.

- `land`: continuous anonymous background land polygons, including Vietnam.
- `countries`: only `laos` (Lào), `cambodia` (Campuchia), `thailand` (Thái Lan). Their `polygons`
  support a restrained land tint; `borders` contains inland boundaries only.
- `coastlines`: source physical coastlines, with Vietnam's sourced coast omitted
  around the existing exact foreground Vietnam coast to avoid double outlines.
- `vietnamOuter`: a union of the existing `DATA.arcs` decoded through
  `DATA.provinces34`; useful as a sea exclusion mask. Its points are authoritative.
- `bounds`: the complete overscan extent in world units.
- `navBounds`: the more restrained suggested camera-center bounds.
- `labels`: the sea label. Country label anchors are in each country's `anchor`.
- `borders`: the flattened inland borders of the three named neighbours.

Coordinates use the existing DEM transform:

```js
x = (longitude - 101.5) * 60;
y = (23.8 - latitude) * 62.5;
```

Every polygon is an array of rings: outer ring first, followed by holes. Add all rings to a Canvas
path and fill/clip with the `evenodd` rule. Holes are explicit and should never
be filled by treating them as additional shells. Coordinates are already world
coordinates, and must go through the same map projection as the VN foreground.

The land bounds have generous overscan: longitude 75–140, latitude -12–46.
Suggested navigation centers span longitude 95–121, latitude 4–29. The renderer
must account for viewport size, zoom, and camera angle before allowing a center
near those edges. Do not stroke the land crop's exterior bounding edges. The
separate `coastlines` data avoids those artificial edges.

Natural Earth's VN polygon is replaced in the anonymous land wash with the
existing foreground VN geometry. A four-world-unit inland stitch overlaps
neighbour land into the sourced VN footprint, beneath the foreground, so a small
source mismatch cannot create a false water slit on the shared land border. This
overlap is restricted to sourced VN and does not grow a land halo around the VN
ocean coast. The preview still draws the existing VN geometry on top unchanged.
This is a generalized illustration backdrop, not a surveyed boundary dataset.

The reproducible builder and the downloaded source ZIPs live in
`verification/map-surroundings-preview-20261014/`. Run the builder with
`--download` for the first acquisition, or without flags for an offline rebuild.
It uses Python, Shapely and pyshp. Exact source hashes, official URLs, versions,
processing parameters and source VN geometry hash are in `source-manifest.json`.

Made with Natural Earth. Land and Admin 0 Countries v5.1.1, plus the official
Coastline ZIP (whose embedded VERSION metadata reads `5.0.0-pre9`), at 1:10m
scale are public domain. Exact downloaded hashes are retained. Source and licensing:

- https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-coastline/
- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/
- https://www.naturalearthdata.com/about/terms-of-use/

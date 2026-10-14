# Gói Việt editable map illustration layers

These six independent image layers were produced with the built-in imagegen tool using the approved homepage-palette map demo as the sole visual reference. They are approximate generative extractions/reconstructions, not pixel-exact crops. Original selected output pixels are preserved, including true alpha.

| Asset | Size | Layer purpose |
| --- | --- | --- |
| `logo-calligraphy-stack.png` | 1597 × 985 | Large red two-line brand mark; independent from all interface text |
| `crane-flight.png` | 1536 × 1024 | Ivory flying crane with red crown; independent position/scale |
| `hanoi-lake-illustration.png` | 2020 × 778 | Local destination illustration with no title, badges, or UI baked in |
| `mountains-left.png` | 821 × 1916 | Jade mountain/cloud/lotus framing along the left edge |
| `mountains-right.png` | 1774 × 887 | Independent lower-right mountain framing |
| `clouds-bottom.png` | 2172 × 724 | Low ivory cloud ribbons that bridge the lower border |

`manifest.json` records generation prompts, alpha bounds, suggested source rectangles and normalized placements against the 1597 × 985 reference. Source rectangles can be applied during native rendering to avoid near-invisible isolated alpha speckles and transparent padding. The hidden RGB colors outside the crane have alpha zero and do not create a glow when correctly composited.

Each illustration remains independently replaceable and positionable. The country geometry, province fills, islands, railway, moving vehicles, landmark miniatures, labels, cards, controls and typography must be rendered as their own editable website components. Do not use the source demo as a full-screen flattened background. Decorative layers should use `pointer-events: none` and must not block map interactions. On small screens, hide or reposition decoration through layout configuration instead of shrinking every layer together.

Generated source originals were also preserved under `C:/Users/Uy/.codex/generated_images/01a130ee-db58-7bf1-ad33-410f1314c4ab/`; the selected project files above are the durable paths used by the website.

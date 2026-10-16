# Approved homepage invitation

This directory contains only decorative fragments and icons from the approved
1962 × 801 design. The running page never displays the complete mockup.

- Eight border pieces adapt independently to the card dimensions.
- Four corner illustrations retain the approved mountain, cloud and lotus artwork.
  Alpha masks exclude the original feature bar and controls, and soften the inner seams.
- Four icon fragments are decorative; headings, descriptions, features and buttons
  are real semantic HTML in `map-surroundings-preview.html`.
- The existing IDs, click handlers, entrance timing and focus behavior are retained.
- `invitation-design.css` follows the reference proportions on desktop and uses
  stacked features and buttons on mobile.
- The desktop card retains the previous 880 px width and bottom position.
  Compact laptop spacing preserves its approximately 250 px height; normal desktop
  spacing preserves its approximately 345 px height, keeping the bridge visible.

The features use **36 điểm hẹn di sản**, **Lật thẻ, mở chuyện Việt**, and
**Cả nhà chung hành trình**, each with its own secondary description.
The first description remains explicit: **34 tỉnh thành & 2 quần đảo**.
This is consistent with the journey data's 34 land nodes and 2 islands.

`manifest.json` records the approved source hash and each exact crop rectangle.
Rebuild with `node tools/build-invitation-design-assets.cjs <approved-mockup.png>`.

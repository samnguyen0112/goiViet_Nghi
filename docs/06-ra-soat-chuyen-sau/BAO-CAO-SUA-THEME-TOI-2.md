# Báo cáo sửa theme tối đợt 2 (`T-07` – `T-17`) trên preview-5

- **Ngày thực hiện:** 2026-11-27
- **Nơi làm:** worktree `D:\HCMUS\vh2-p5-05`, nhánh `p5-05`, nền so sánh `HEAD = 29bf515` (đã gộp PR #15). Máy chủ thử `tools/perf/server.cjs` ở cổng `8772`.
- **Phạm vi:**
  - Đúng 11 mục `T-07` – `T-17` của [BAO-CAO-THEME-TOI.md](BAO-CAO-THEME-TOI.md), trên `map-surroundings-preview-5.html`, ở 4 cấu hình `1920×1080` / `1366×768` × `VI` / `EN`.
  - Không sửa `T-01` – `T-06`, `index.html`, các bản preview khác, `card-testing.html`, `i18n-ui-5.js` hay bất kỳ tệp CSS dùng chung nào.
- **Tệp đã đổi:**

| Tệp | Thay đổi |
| --- | --- |
| `assets/goi-viet/map-surroundings-preview/dark-theme-5.css` | Thêm khối đợt 2 (L404–520) |
| `assets/goi-viet/postcard-design-5.js` | Màu chữ bưu thiếp, cho `T-13` |
| `map-surroundings-preview-5.html` | Đúng 2 dòng `?v=` (L4215, L4254) |
| `offline-manifest-5.js` | Dựng lại |
| Báo cáo này | Mới |

## Tóm tắt (`đã đo` / `đã tái hiện`)

- **Tương phản:** mọi phần tử nêu trong `T-09` – `T-17` (trừ nút `:disabled` được miễn trừ) đều đạt ngưỡng WCAG 2.2 AA ở cả 4 cấu hình. Ngưỡng là `≥ 4,5:1` cho chữ và `≥ 3,0:1` cho viền/biểu tượng.
- **`T-07` và `T-08`** là mục thị giác (logo và khung tranh), có số đo kèm theo:
  - Màu đỏ thân chữ logo so với nền header: `1,37` → `2,14–2,17`.
  - Độ sáng trung bình dải khung: `0,556–0,579` → `0,149–0,156`.
- **Theme sáng không đổi:**
  - Theo cấu trúc: `112/112` selector trong `dark-theme-5.css` bắt đầu bằng `html[data-theme="dark"]`. Phần đợt 2 không có `!important` nào.
  - Đo: computed style của `128.004` phần tử trên `68` trạng thái (17 màn × 4 cấu hình) chỉ khác ở `3` phần tử. Cả 3 thuộc đúng các loại nhiễu đã thấy khi so hai lượt chụp của cùng bản `HEAD` (mục 3).
  - Ngoại lệ duy nhất là ảnh bưu thiếp của `T-13`, đổi đúng như dự định.
- **Chuyển theme sống** Tối → Sáng → Tối không tải lại trang: `60/60` lượt, cộng `16/16` lượt ở lần đo lại bộ bài. Mọi lượt khớp computed style và có `0` `pageerror`.
- **Hiệu năng:** A/B `n = 10` mỗi bên cho hai kịch bản bay Hà Nội → Huế và kéo bản đồ. Không chỉ số nào khác thật theo luật `|Δ trung vị| ≥ IQR bản gốc` **và** `p < 0,05`.
- **Gói ngoại tuyến và 8 bộ kiểm:** xem mục 7.

---

## 1. Thay đổi theo từng mục

| Mục | Tệp:dòng | Nội dung |
| --- | --- | --- |
| **T-07** | [dark-theme-5.css:412](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L412) | Logo header bản đồ: `filter: brightness(1.3) saturate(.95)` cộng hai `drop-shadow` sáng ngà (viền 1 px và quầng 5 px). Giữ màu đỏ thương hiệu, không đổi ảnh. Đã thử 3 phương án trên ảnh chụp trước khi chọn. |
| **T-08** | [dark-theme-5.css:417](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L417) | Khung tranh 4 cạnh (`.hf-original-art`): `filter: brightness(.55) contrast(1.08) saturate(.8)`, chỉ dùng CSS, không tạo ảnh khung mới. Ghi chú: `--hf-paper` vốn đã là `#34463b` ở theme tối (`heritage-frame.css:133`), phần chói là tranh khung. |
| **T-09** | [dark-theme-5.css:422](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L422) | Mốc đã đóng `.heritage-progress-stamp.is-stamped`: nền `#7c5928`, dấu ✓ `#ffffff`, viền `#c9a96b`. Mốc chưa đóng giữ màu `#ddcba5` của `arrival-journal.css:130`. |
| **T-10** | [dark-theme-5.css:430](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L430) | Chỉ viền ô tìm (`.prov-search-input`) và nút ga trong nhật ký (`.gv-station-journal-stop`) lên `#7d917e`. Các đường kẻ mảnh dùng `--station-rule` giữ nguyên. |
| **T-11** | [dark-theme-5.css:436](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L436) | Đổi viền: nút quần đảo `#a59469`; nút cài đặt `#a89970` (hover/mở `#c4a56a`); `#previewPanelOpen` `#a9976c`. Thêm hover cho "Bưu thiếp" (`#5b3f39`, viền `#d4ad7c`) và "Danh sách ga" (`#354e42`, viền `#c4a56a`). Trước đây khối tối có specificity cao hơn `:hover` nên nuốt mất hover. |
| **T-12** | [dark-theme-5.css:459](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L459) | "Mở sách →": nền `#266558`, viền `#89c7a1`. Viền `.gvb-chapter` và `.gvb-toc-item`: `#8ba28b`. Nút màn sắp ra mắt Hải Phòng: `#a4906a`; nút fanpage nền đỏ: viền `#e0a58c`. |
| **T-13** | [postcard-design-5.js:13–15](../../assets/goi-viet/postcard-design-5.js#L13), [L21](../../assets/goi-viet/postcard-design-5.js#L21), [L34–35](../../assets/goi-viet/postcard-design-5.js#L34), [L47](../../assets/goi-viet/postcard-design-5.js#L47) | Tách `goldText = '#7c5d26'` (chữ) khỏi `gold = '#b2945a'` (nét khung, giữ nguyên). `muted`: `#64715e` → `#556250`. Giữ nền giấy kem; không thêm bảng màu nền tối. |
| **T-14** | [dark-theme-5.css:474](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L474) | Bộ bài: `.option-letter` nền `rgba(0,0,0,.28)`. Hộp hoạt động `#fffaf0e6`, chú thích `#3d4c3e`. Viền `.card-review-button` `#8f6c30`, viền `#btnFlipToBack` `#75202c`. Tab Canva chưa chọn: nền `#3b4d3f`, chữ `#f0e2bf`, đường viền bằng `box-shadow: inset 0 0 0 1px #8ba28b` để không đổi kích thước tab. |
| **T-15** | [dark-theme-5.css:489](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L489) | Dấu ga `.arrival-stamp`: nền `#2d3f35f0`, mực `#f3b3a6`. Nút phóng ảnh `.gv-station-art-cue`: nền `#20332ce6`, icon `#f6eed9`, thêm hover tối. Mã QR: nền `#efe5ce` và `filter: sepia(.18) brightness(.93)`, vì `fanpage-qr.svg` tự vẽ lề trắng nên chỉ đổi `background` thì chỉ được dải 3 px. `.gvb-call-postcard` giữ nguyên (bưu thiếp in cố ý). |
| **T-16** | [dark-theme-5.css:506](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L506) | Hải đồ: nền dự phòng `.natural-detail-map` `#16404c`. `.island-chart-scale` thêm nền `#174c54b3`, đệm `3px 7px`, bo `4px`. Viền `.island-chart-minimap` `#d4d5aad9`. |
| **T-17** | [dark-theme-5.css:515](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L515) | `#btnReducedMotion:disabled`: đặt lại biến `--gv3-disabled-border: #76876f` ngay trên nút, vì quy tắc dùng chung dùng `var(--gv3-disabled-border) !important` (không thêm `!important` mới). `.gvb-btn:disabled` `opacity: .52`. Viền `#btnDownloadPostcardPng` `#d8b77c`. |
| **Nạp & bộ nhớ đệm** | [map-surroundings-preview-5.html:4215, 4254](../../map-surroundings-preview-5.html#L4215) · [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | `?v=20261127-dark-2` cho `postcard-design-5.js` và `dark-theme-5.css`, ngoài ra không đổi dòng html nào. Dựng lại gói ngoại tuyến bằng `python tools/build-preview-5-offline.py` (`643` tài nguyên, `180,04 MB`); xem ghi chú CRLF ở mục 8. |

## 2. Bảng tương phản Trước → Sau (theme tối)

**Cách đo (`đã đo`):**
- Đo trên DOM, ghép nền alpha từ tổ tiên, đủ 4 cấu hình; khoảng giá trị là min–max qua 4 cấu hình.
- Cột "pixel" lấy màu nền thật ngay ngoài viền trên ảnh chụp (trung vị 3×3), dùng cho phần tử có nền ảnh hoặc gradient.
- "Trước" là `HEAD 29bf515`: các tệp HEAD được phục vụ qua `page.route` với `routedHead = 3` lượt khớp mỗi phiên. "Sau" là worktree.

| Mục | Màn | Phần tử | Trước | Sau | Pixel trước → sau | Ngưỡng | Kết luận |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-09 | 12 | ✓ mốc đã đóng (`#fff` / `#7c5928`) | **2,79** | **6,33** | — | 4,5 | Đạt |
| T-10 | 05 | Viền `#provSearchInput` | **2,08** | **3,96** (3,39 với nền ô) | 2,08 → 3,96 | 3,0 | Đạt |
| T-10 | 12 | Viền nút ga đã ghé / đã đóng dấu | **2,08** | **3,96** | 1,60–2,08 → 3,05–3,96 | 3,0 | Đạt |
| T-11 | 03 | Viền `#btnIslandHoangSa` / `#btnIslandTruongSa` | **2,09** | **3,38** | 2,39–2,45 → 3,86–3,97 | 3,0 | Đạt |
| T-11 | 03 | Viền `#headerSettings > summary` | **2,48** | **3,58** | 2,78 → 4,00 | 3,0 | Đạt |
| T-11 | 13 | Viền nút cài đặt khi mở | **2,27** | **4,29** | 2,53 → 4,79 | 3,0 | Đạt |
| T-11 | 03 | Viền `#previewPanelOpen` | **2,87** | **3,52** | 3,40 → 4,17 | 3,0 | Đạt |
| T-11 | 03 | Hover "Bưu thiếp" / "Danh sách ga" | nền **không đổi** khi hover | `#49332f → #5b3f39` / `#293e35 → #354e42`, viền sáng hơn | — | Có phản hồi | Đạt |
| T-12 | 10a | Viền "Mở sách →" | **1,30** | **5,50** | 1,32 → 5,58 | 3,0 | Đạt |
| T-12 | 10a | Chữ "Mở sách →" | 9,09 | 6,27 | — | 4,5 | Đạt (nền sáng hơn nên tỉ lệ giảm, vẫn trên ngưỡng) |
| T-12 | 10b | Viền `.gvb-chapter` (kể cả `[aria-current]`) | **1,68** | **3,91** | 1,68 → 3,91 | 3,0 | Đạt |
| T-12 | 10c | Viền `.gvb-toc-item` | **2,02** | **4,70** | 2,02 → 4,70 | 3,0 | Đạt |
| T-12 | 15 | Viền `.gvb-btn` ("← Về bản đồ", "Chơi thẻ…") | **2,54** | **4,02** | 2,54 → 4,02 | 3,0 | Đạt |
| T-12 | 15 | Viền nút fanpage (nền đỏ) | **1,96** | **5,89** | 1,96 → 5,89 | 3,0 | Đạt |
| T-13 | 11b | Chữ vàng (kicker, `01`/`02`, số thứ tự) trên `#fff9ec` / `#f9f3e5` / `#f5efdf` | **2,75 / 2,61 / 2,51** | **5,80 / 5,50 / 5,30** | — | 4,5 | Đạt (công thức WCAG, xem mục 3.3) |
| T-13 | 11b | Chữ phụ `muted` trên `#fff9ec` / `#f9f3e5` / `#f5efdf` | 4,92 / 4,67 / **4,50** | 6,16 / 5,84 / **5,63** | — | 4,5 | Đạt, có biên an toàn |
| T-14 | 07 | `.option-letter` khi đang chọn | **4,26** | **10,30** | — | 4,5 | Đạt |
| T-14 | 08a | `.option-letter` khi hiện đáp án đúng | **4,32** | **10,29** | — | 4,5 | Đạt |
| T-14 | 08a | `#activityGentleNote` | **3,89** | **7,23** | — | 4,5 | Đạt |
| T-14 | 08a | Viền `.card-review-button` | **2,27** | **4,55** | 2,27 → 4,55 | 3,0 | Đạt |
| T-14 | 08a | Viền `#btnFlipToBack` | **1,22** | **9,91** | 1,12 → 9,09 | 3,0 | Đạt |
| T-14 | 09 | Tab Canva chưa chọn | nền `#e9d6a8` (L = 0,682), chữ 5,59 | nền `#3b4d3f` (L = 0,066), chữ **7,04**, đường viền 5,69 | — | Giảm chói, chữ 4,5 | Đạt |
| T-15 | 04 | `.arrival-stamp` | nền L = **0,846**, mực 6,38 | nền L = **0,043**, mực 6,37 | — | Giảm chói | Đạt |
| T-15 | 04 | `.gv-station-art-cue` | nền L = **0,84**, icon 9,89 | nền L = **0,029**, icon 11,55 | — | Giảm chói | Đạt |
| T-15 | 15 | Lề mã QR | `#ffffff`, mô-đun/lề 12,35 | `#ededea`, mô-đun/lề **11,14** | đo trên ảnh | Bớt gắt, vẫn quét được | Đạt |
| T-16 | 14c | Chữ `.island-chart-scale` | **2,91** (trên nền dự phòng) | **8,89** | — | 4,5 | Đạt |
| T-16 | 14c | Viền `.island-chart-minimap` | **1,53** (trên nền dự phòng) | **5,05** | 4,44–5,00 → 4,28–4,82 (trên biển canvas thật) | 3,0 | Đạt |
| T-16 | 14c | Nền dự phòng `.natural-detail-map` | `#4c99a5` (L = 0,27) | `#16404c` (L = 0,044) | — | Nền tối | Đạt |
| T-17 | 13 | Viền `#btnReducedMotion:disabled` | 1,98 | 3,10 | 1,98 → 3,10 | Miễn trừ | Rõ hơn |
| T-17 | 10a | `.gvb-nav-btn:disabled` chữ / viền | 2,85 / 1,67 | 4,06 / 2,03 | 1,67 → 2,03 | Miễn trừ | Rõ hơn |
| T-17 | 11 | Viền `#btnDownloadPostcardPng` | **1,60** | **6,17** | 1,60 → 6,17 | 3,0 | Đạt |

**Mục thị giác (`đã đo` trên ảnh chụp, theme tối, 4 cấu hình):**
- **T-07, logo:**
  - Trung vị màu đỏ thân chữ: `#ac162a` → `#db3448`.
  - Tương phản với nền header `#30483e`: `1,37` → `2,14–2,17`.
  - Logo là logotype nên được WCAG 1.4.3 miễn trừ. Bản sửa tăng độ nổi mà không đổi màu thương hiệu.
- **T-08, khung tranh:** độ sáng tương đối trung bình của dải trái và dải trên giảm `0,579` → `0,156` (1920) và `0,556` → `0,149` (1366).

Dữ liệu gốc:
- [contrast-table.json](../../verification/audit-06/dark-theme-fix-2/contrast-table.json)
- [deck-contrast-table.json](../../verification/audit-06/dark-theme-fix-2/deck-contrast-table.json)
- [image-metrics.json](../../verification/audit-06/dark-theme-fix-2/image-metrics.json)

## 3. Theme sáng không đổi

### 3.1. Theo cấu trúc (`suy luận từ mã` + `đã đo`)
- `112/112` selector trong `dark-theme-5.css` bắt đầu bằng `html[data-theme="dark"]`. Phép tách selector có xét dấu ngoặc của `:is()`, kể cả các selector trong `@media`.
- Phần đợt 2 có `0` `!important`.
- Ở theme sáng không quy tắc nào của đợt này khớp được.

### 3.2. Computed style (`đã đo`)
- **Cách đo:** ở mỗi trạng thái của theme sáng, ghi 26 thuộc tính hiển thị của **mọi** phần tử, gồm màu, nền, viền, `outline`, `box-shadow`, `filter`, `opacity`, cỡ chữ, `transform` và kích thước.
- **So bản mới với HEAD:** `128.004` phần tử trên `68` trạng thái, **`3` phần tử khác**:
  - `CANVAS#regionalLandSeaCanvas`, `CANVAS#regionalWavesCanvas` (`transform`);
  - `SPAN.island-chart-scale` (`width`, do thang tỉ lệ đổi theo camera);
  - cả 3 ở `14c` `1920×1080 EN`.
- **Mức nhiễu nền:** so hai lượt chụp của cùng bản `HEAD` (`before2` với `before2-repeat`) cũng ra `5` phần tử khác cùng loại:
  - `transform` của hai canvas vùng nói trên;
  - `CANVAS#terrainWebGL3` bật/tắt;
  - ảnh nền tải chậm.
- Không có thuộc tính màu, viền hay filter nào khác nhau.
- Dữ liệu: [style-diff3.json](../../verification/audit-06/dark-theme-fix-2/style-diff3.json) · [style-noise.json](../../verification/audit-06/dark-theme-fix-2/style-noise.json).

### 3.3. Pixel (`đã đo`) và ngoại lệ `T-13`
- **72 ảnh theme sáng:** `52/72` ảnh giống hệt pixel.
  - Hai lượt của cùng bản HEAD chỉ giống hệt `55/72` ảnh.
  - Phần còn lệch là ảnh và canvas tải hoặc giải mã ở thời điểm khác nhau. Ví dụ ảnh ga lúc nét lúc mờ, logo chọn ảnh 512 hay 1024, nhiễu rải đều trên trang sách. Đã kiểm bằng mắt trên ảnh cắt.
  - Vì vậy đợt này **không** khẳng định "0 pixel khác" như đợt 1; bằng chứng chính là mục 3.1 và 3.2.
- **Ngoại lệ dự kiến (`T-13`):** ảnh xuất bưu thiếp đổi `8.323–8.864` pixel ở cả hai theme, trong khi mức nhiễu của ảnh này là `0`.
  - Vùng đổi nằm ở chữ vàng và chữ phụ; ví dụ kicker từ `#b2945a` thành `#7c5d26`.
  - Ảnh xem trước trong modal bưu thiếp đổi `4.160–8.106` pixel trong vùng canvas.
  - Không có vùng nào khác của trang đổi.

## 4. Chuyển theme sống (`đã tái hiện`)

- **Cách làm:** ở từng trạng thái theme tối × 4 cấu hình, gọi `toggleMaterialTheme()` hai lần (Tối → Sáng → Tối) không tải lại trang.
- **Hai điều kiện:**
  1. Computed style của các phần tử đo quay về đúng như ban đầu.
  2. Ở bước Sáng, giá trị khớp lượt chạy theme sáng riêng.
- **Kết quả:** `60/60` lượt đạt, cộng `16/16` lượt ở lần đo lại bộ bài; `0` `pageerror` trên mọi lượt chụp.
- Dữ liệu: [toggle.json](../../verification/audit-06/dark-theme-fix-2/toggle.json) · [deck-toggle.json](../../verification/audit-06/dark-theme-fix-2/deck-toggle.json).

## 5. Ảnh Trước / Sau (theme tối, `1920×1080 VI`)

Toàn bộ ảnh của 4 cấu hình × 2 theme nằm ở [before2/](../../verification/audit-06/dark-theme-fix-2/before2/) (HEAD) và [after3/](../../verification/audit-06/dark-theme-fix-2/after3/) (bản mới).

| Màn | Trước | Sau |
| --- | --- | --- |
| `03-map-overview` (T-07, T-08, T-11) | [before](../../verification/audit-06/dark-theme-fix-2/before2/03-map-overview-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/03-map-overview-1920x1080-vi-dark.png) |
| `13-settings` (T-11, T-17) | [before](../../verification/audit-06/dark-theme-fix-2/before2/13-settings-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/13-settings-1920x1080-vi-dark.png) |
| `05-station-list` (T-10) | [before](../../verification/audit-06/dark-theme-fix-2/before2/05-station-list-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/05-station-list-1920x1080-vi-dark.png) |
| `04-arrival-sheet` (T-15) | [before](../../verification/audit-06/dark-theme-fix-2/before2/04-arrival-sheet-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/04-arrival-sheet-1920x1080-vi-dark.png) |
| `07` / `08a` bộ bài (T-14) | [before 07](../../verification/audit-06/dark-theme-fix-2/deck-before/07-deck-quiz-sealed-1920x1080-vi-dark.png) · [before 08a](../../verification/audit-06/dark-theme-fix-2/deck-before/08a-deck-quiz-answer-conn-1920x1080-vi-dark.png) | [after 07](../../verification/audit-06/dark-theme-fix-2/deck-after/07-deck-quiz-sealed-1920x1080-vi-dark.png) · [after 08a](../../verification/audit-06/dark-theme-fix-2/deck-after/08a-deck-quiz-answer-conn-1920x1080-vi-dark.png) |
| `09-deck-canva` (T-14) | [before](../../verification/audit-06/dark-theme-fix-2/before2/09-deck-canva-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/09-deck-canva-1920x1080-vi-dark.png) |
| `10a` / `10b` / `10c` sách (T-12, T-17) | [10a](../../verification/audit-06/dark-theme-fix-2/before2/10a-book-cover-1920x1080-vi-dark.png) · [10b](../../verification/audit-06/dark-theme-fix-2/before2/10b-book-spread-1920x1080-vi-dark.png) · [10c](../../verification/audit-06/dark-theme-fix-2/before2/10c-book-toc-1920x1080-vi-dark.png) | [10a](../../verification/audit-06/dark-theme-fix-2/after3/10a-book-cover-1920x1080-vi-dark.png) · [10b](../../verification/audit-06/dark-theme-fix-2/after3/10b-book-spread-1920x1080-vi-dark.png) · [10c](../../verification/audit-06/dark-theme-fix-2/after3/10c-book-toc-1920x1080-vi-dark.png) |
| `15-coming-soon-hp` (T-12, T-15) | [before](../../verification/audit-06/dark-theme-fix-2/before2/15-coming-soon-hp-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/15-coming-soon-hp-1920x1080-vi-dark.png) |
| `12-journal` (T-09, T-10) | [before](../../verification/audit-06/dark-theme-fix-2/before2/12-journal-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/12-journal-1920x1080-vi-dark.png) |
| `11` / `11b` bưu thiếp (T-13, T-17) | [11](../../verification/audit-06/dark-theme-fix-2/before2/11-postcard-1920x1080-vi-dark.png) · [11b](../../verification/audit-06/dark-theme-fix-2/before2/11b-postcard-export-1920x1080-vi-dark.png) | [11](../../verification/audit-06/dark-theme-fix-2/after3/11-postcard-1920x1080-vi-dark.png) · [11b](../../verification/audit-06/dark-theme-fix-2/after3/11b-postcard-export-1920x1080-vi-dark.png) |
| `14c-island-hoang-sa-atlas` (T-16) | [before](../../verification/audit-06/dark-theme-fix-2/before2/14c-island-hoang-sa-atlas-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix-2/after3/14c-island-hoang-sa-atlas-1920x1080-vi-dark.png) |

## 6. A/B hiệu năng (`đã đo`)

**Cách đo:**
- Theme tối, `1920×1080`; bản mới so với `HEAD 29bf515`. HEAD được phục vụ qua `ctx.route` từ bản `git show`, `routed ≥ 3` mỗi mẫu.
- Mỗi mẫu một Chrome mới, hai bản xen kẽ, `n = 10` mỗi bên cho mỗi kịch bản.
- Hai kịch bản: (a) bay Hà Nội → Huế đến khi phiếu ga Huế mở; (b) kéo bản đồ khoảng 7,5 giây.
- Luật "khác thật": `|Δ trung vị| ≥ IQR bản gốc` **và** Mann–Whitney `p < 0,05`.

| Kịch bản | Chỉ số | Trung vị gốc | Trung vị mới | IQR gốc | p | Khác thật? |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Bay HN → Huế | FPS | 19,40 | 18,70 | 1,72 | 0,570 | Không |
| Bay HN → Huế | frame ms (trung vị) | 50,00 | 50,00 | 0,00 | 0,647 | Không |
| Bay HN → Huế | p95 ms | 100,05 | 125,00 | 29,02 | 0,109 | Không |
| Bay HN → Huế | maxGap ms | 283,35 | 216,65 | 120,85 | 0,596 | Không |
| Kéo bản đồ | FPS | 31,55 | 30,95 | 11,50 | 0,850 | Không |
| Kéo bản đồ | frame ms (trung vị) | 16,70 | 16,70 | 0,07 | 0,330 | Không |
| Kéo bản đồ | p95 ms | 83,30 | 83,30 | 12,72 | 0,938 | Không |
| Kéo bản đồ | maxGap ms | 225,00 | 225,00 | 62,45 | 0,596 | Không |

**Ghi chú minh bạch:**
- **Máy bận:** `7/40` mẫu bắt đầu khi CPU bận `22–29,7 %`, vượt mốc `20 %` đặt ra. Bỏ 7 mẫu đó thì kết luận không đổi: bay `n = 9/9`, kéo `n = 8/7`, không chỉ số nào khác thật. Lượt lọc này dưới `n = 10` nên chỉ dùng để đối chiếu.
- **Kịch bản bay chạy lại:** lần đầu kịch bản bay xuất phát ngay tại Hà Nội nên không có chuyến bay (0–2 khung hình). Đã sửa thành Hà Nội → Huế và chạy lại riêng kịch bản này; kịch bản kéo giữ từ lần đầu, cùng mã CSS cuối.
- Dữ liệu: [ab-final.json](../../verification/audit-06/dark-theme-fix-2/ab/ab-final.json) · [ab-final-summary.json](../../verification/audit-06/dark-theme-fix-2/ab/ab-final-summary.json) · [ab-final-busy20-summary.json](../../verification/audit-06/dark-theme-fix-2/ab/ab-final-busy20-summary.json).

## 7. Gói ngoại tuyến và 8 bộ kiểm

**Gói ngoại tuyến (`đã tái hiện`):**
- `python tools/build-preview-5-offline.py --check`: **PASS**. Phiên bản `f01e9efbeae6e56b` → `ccb6e591c5f2f8b1`, `643` tài nguyên (danh sách giữ nguyên), `180,04 MB`.
- `86` hash đổi: `3` tệp của đợt này (`dark-theme-5.css`, `postcard-design-5.js`, html) và `83` tệp chỉ đổi do CRLF của worktree (mục 8).

**8 bộ kiểm** (đều chạy với `PORT=8772`, tuần tự, có ghi mức bận CPU trước mỗi bộ):

| # | Bộ kiểm | Kết quả cuối | Lượt chạy | Log |
| --- | --- | --- | --- | --- |
| 1 | `check-books-5` | **PASS** (`0` lỗi, chỉ cảnh báo bản nháp có sẵn) | lượt 1 | [log](../../verification/audit-06/dark-theme-fix-2/suites-run1/check-books-5.log) |
| 2 | `check-i18n-5` | **PASS** (260 markup keys, 245 code keys VI/EN) | lượt 1 | [log](../../verification/audit-06/dark-theme-fix-2/suites-run1/check-i18n-5.log) |
| 3 | `check-memory-v5` | **PASS** | lượt 1 FAIL vì thiếu thư mục ghi `verification/memory-reference-v5/` (lỗi `ENOENT` khi ghi `checks.json`, sau khi mọi kiểm đã qua); tạo thư mục trống rồi chạy lại thì PASS | [log](../../verification/audit-06/dark-theme-fix-2/suites/check-memory-v5.log) |
| 4 | `verify-preview5-conversation-cards` | **PASS** | lượt 1 | [log](../../verification/audit-06/dark-theme-fix-2/suites-run1/verify-preview5-conversation-cards.log) |
| 5 | `check-station-panel-5` | **PASS** | lượt 1 | [log](../../verification/audit-06/dark-theme-fix-2/suites-run1/check-station-panel-5.log) |
| 6 | `check-family-voyage-5` | **PASS** (11 nhóm) | 3 lượt, xem ghi chú dưới bảng | [log](../../verification/audit-06/dark-theme-fix-2/suites/check-family-voyage-5.log) |
| 7 | `check-station-photos-5` | **PASS** (35 ảnh + biểu tượng Hoàng Sa, 6 cỡ × 2 ngôn ngữ, 72 khung offline lạnh) | PASS ở cả 3 lượt: lượt 1, lượt có 2 tệp LF, và trạng thái cuối | [log](../../verification/audit-06/dark-theme-fix-2/suites/check-station-photos-5.log) |
| 8 | `check-arrival-demo-5 --preview-5` | **PASS** (`61/61` ca, `0` lỗi) | lượt 1 | [log](../../verification/audit-06/dark-theme-fix-2/suites-run1/check-arrival-demo-5--preview-5.log) |

**Ghi chú về bộ 6 `check-family-voyage-5`:**
- **Lượt 1 FAIL:** bộ này so hash byte của 6 tệp được bảo vệ với `baseline.json`, vốn chụp theo byte của thư mục chính. `island-chart.css` và `natural.css` ở thư mục chính là LF, còn worktree checkout ra CRLF. Hai tệp này không bị sửa (`git diff` rỗng).
- **Lượt 2:** ghi lại đúng byte LF trong git cho 2 tệp đó thì qua được bước kiểm tệp bảo vệ. Sau đó lại thiếu đầu vào `verification/sea-postoffice-5/before-source/`.
- **Lượt 3 PASS:** chép nguyên thư mục đó từ thư mục chính, so byte giống hệt.
- **Trạng thái cuối:** 2 tệp được trả về trạng thái checkout (`git checkout --`) để `git status` chỉ còn các tệp thật sự sửa. Ở đúng trạng thái đó, manifest được dựng lại và bộ 7 chạy lại vẫn PASS.

Tóm tắt thời gian và mức bận CPU: [suites-run1/summary.json](../../verification/audit-06/dark-theme-fix-2/suites-run1/summary.json). Lượt chạy lại: [suites-run2.log](../../verification/audit-06/dark-theme-fix-2/suites-run2.log).

## 8. Ghi chú phương pháp và vấn đề ngoài phạm vi

1. **CRLF và gói ngoại tuyến (`đã đo`, có sẵn từ trước):**
   - Máy dùng `core.autocrlf=true`, nên worktree mới checkout toàn bộ tệp văn bản ở dạng CRLF.
   - Ngay trên worktree sạch, `build-preview-5-offline.py --check` đã FAIL: `84` tệp lệch hash chỉ vì xuống dòng.
   - Vì vậy diff của `offline-manifest-5.js` lần này có thêm `83` hash loại đó.
   - Cùng nguyên nhân làm bộ 6 FAIL giả (mục 7).
   - Khi gộp với nhánh khác, phải dựng lại manifest **ở thư mục chính**: chạy `python tools/build-preview-5-offline.py` rồi `--check`.
2. **Tệp mốc bị gitignore:** worktree không có `verification/`. Đã chép nguyên bản (so byte giống hệt) các đầu vào mà bộ kiểm đọc:
   - `station-photos-5/baseline-page-hashes.json`
   - `arrival-demo-5/tracked-baseline.json`
   - `family-voyage-5/baseline.json`
   - thư mục `sea-postoffice-5/before-source/`
   - Thêm thư mục trống `verification/memory-reference-v5/` cho tệp `check-memory-v5` ghi ra.
3. **Ba sai sót trong quá trình đo, đã sửa trước khi chốt số:**
   - Script so pixel ban đầu dùng `getbbox()` của PIL; hàm này mặc định chỉ xét kênh alpha nên luôn báo `0`. Đã sửa để xét cả 4 kênh và tự kiểm lại trên ảnh bưu thiếp (ra `36.561` pixel khác).
   - Lượt chụp đầu rút lá bài ngẫu nhiên nên bị nhiễu. Lượt chốt cố định `Math.random` bằng seed (chỉ trong script kiểm) và chỉ chụp khi hai ảnh liên tiếp giống hệt.
   - Với seed đó, lá rút ở Hà Nội là lá câu hỏi mở, không có `.option-letter`. Đã đo lại riêng bộ bài với một lá trắc nghiệm (`deck-before` / `deck-after`).
4. **Trang `map-surroundings-preview-5-arrival-demo.html`:**
   - Trang này không nạp `dark-theme-5.css`, nên các sửa đổi CSS của đợt này không áp dụng ở đó. Đây là trang thử nghiệm, phạm vi đợt này là preview-5.
   - Trang vẫn nạp `postcard-design-5.js` với `?v=` cũ; không đổi html của trang này.
5. **Còn mở từ đợt 1:** vòng focus trong `#answerExplanationBox` ở **theme sáng** vẫn `1,01:1`. Đợt này giữ nguyên vì thuộc theme sáng.
6. **`T-16`:** trên biển canvas thật, viền minimap vốn đã đạt `4,4–5,0:1`. Phần sửa chủ yếu bảo vệ trường hợp canvas chưa vẽ (nền dự phòng).

Tệp tạm của đợt này nằm ở `verification/audit-06/dark-theme-fix-2/` (gitignore). Không commit, push hay xóa tệp đã theo dõi nào.

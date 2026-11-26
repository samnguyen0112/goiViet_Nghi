# Báo cáo sửa theme tối đợt 1 (`T-01` – `T-06`) trên preview-5

- **Ngày thực hiện:** 2026-11-26
- **Nhánh / nền so sánh:** `p5-05` (`HEAD = f534258`, đã gộp `A-01`)
- **Phạm vi:** chỉ sửa **6 lỗi mức Cao (`T-01` – `T-06`)** từ [BAO-CAO-THEME-TOI.md](BAO-CAO-THEME-TOI.md) trên `map-surroundings-preview-5.html` và tài nguyên dành riêng cho `preview-5`. **Không sửa `T-07` – `T-17`**, không đụng `index.html`, các bản preview trước (`preview-2/3/4`), `card-testing.html`, các tệp CSS dùng chung (`homepage-native.css`, `homepage-opening.css`, `homepage-content.css`, `invitation-design.css`, `memory-reference-v2.css`, `home-controls-3.css`, `fortune-ritual.css`), và không đổi vòng focus toàn cục (`--son-red` / `button:focus-visible`).
- **Tóm tắt kết quả (`đã đo` & `đã tái hiện`):**
  - Toàn bộ **6/6 lỗi `T-01` – `T-06`** đạt chuẩn tương phản **WCAG 2.2 AA** (`≥ 4,5:1` chữ thường; `≥ 3,0:1` chữ lớn, viền UI, biểu tượng và vòng `:focus-visible`) trên cả **4 cấu hình** (`1920×1080` & `1366×768`, `VI` & `EN`).
  - **Theme sáng bất biến 100%:** so sánh từng pixel trước và sau sửa trên **32/32 ảnh PNG** (8 màn hình × 4 cấu hình) cho đúng **`0` pixel khác biệt**.
  - **Chuyển theme sống không tải lại trang (`Sáng ↔ Tối`):** **`32/32` lượt chuyển** (8 màn hình × 4 cấu hình) cập nhật tức thì và khớp màu nền/viền giữa hai trạng thái, **`0` lỗi `pageerror`**.
  - **Gói ngoại tuyến & kiểm thử tự động:** `build-preview-5-offline.py --check` **PASS** (`643` tài nguyên, đã gộp `dark-theme-5.css`) và **8/8 suite kiểm thử** của `preview-5` đều **PASS**.

---

## 1. Thay đổi theo từng mục (`T-01` – `T-06`)

| Mã mục | Tệp:dòng | Nội dung sửa |
| --- | --- | --- |
| **T-01** | [dark-theme-5.css](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L6-L173) | Tạo khối `html[data-theme="dark"]` cho cổng mở đầu (`#introScreen`, `#introWelcomeStage`, `#homeOpeningGate`, `.gv-gate-logo`, `.gv-gate-tagline`, `#homeOpeningHint`, `.gv-gate-action`), thanh công cụ góc phải (`.gv-home-opening-tools`, `.gv-lang-toggle-home`) và bảng chọn nhạc (`.gv-home-music-panel`, nút chọn nhạc, ô nhập số, nút `:disabled`, ghi chú). Đặt nền xanh rêu đậm `#152720` / `#20362c`, hào quang ấm sau `.gv-gate-logo` và `--focus-ring: #ffeaba` cục bộ. |
| **T-02** | [dark-theme-5.css](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L175-L305) | Giữ nguyên tranh phong cảnh và bố cục mở đầu; chuyển bề mặt thư mời (`#homepageContent` → `#1e332a`), dải tính năng (`.gv-home-features` → `#263e34`, viền vàng đồng), nút `#btnHomeExploreMemory` (`#274035`, viền `#c9a662`), dải mây 3 ga (`.gv-home-station-mist` → `#172a22`), màu chữ/ghim/mũi tên 3 ga (`Hà Nội`, `Cố đô Huế`, `TP.HCM`), đóng khung bán trong suốt tối cho `.gv-home-opening-tools` + `.gv-lang-toggle-home` trên nền núi, làm dịu họa tiết góc (`.gv-invitation-ornament`) và bo khung mề-đay ấm cho 4 biểu tượng nền kem (`.gv-invitation-train`, `.gv-invitation-feature-icon`). Đặt `--focus-ring: #ffeaba` cho toàn khu vực thư mời, 3 ga và thanh công cụ. |
| **T-03** | [dark-theme-5.css](../../assets/goi-viet/map-surroundings-preview/dark-theme-5.css#L307-L402) | Ghi đè block ép nền kem của `fortune-ritual.css:188` bằng bộ biến tối cho `html[data-theme="dark"] body[data-regional-preview] #bambooRollModal.fortune-ritual`: `--ritual-paper: #1e332a`, `--ritual-warm: #294337`, `--ritual-ink: #f7f0de`, `--ritual-muted: #d2d9c6`, `--ritual-red: #f2a996`, `--ritual-gold: #cfa962`, `--ritual-trim: #8ba28b`, `--focus-ring: #ffeaba`. Nâng sáng `.ritual-brand` và chỉnh tương phản đầy đủ cho trạng thái đã rút vé (`.ritual-ticket-top`, `.ritual-steps .is-complete > span`, `.ritual-ticket-seal`). |
| **T-04** | [arrival-demo-5.css](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css#L312) | Thêm `& #arrivalSheet .arrival-close:hover { color: #f6eed9; }` trong khối `html[data-theme='dark']` để biểu tượng `×` không còn chìm màu đỏ thẫm `#9e2835` trên nền hover `#344a3e`. |
| **T-05** | [book-reader-5.css](../../assets/goi-viet/books-5/book-reader-5.css#L66) · [book-reader-5.css](../../assets/goi-viet/books-5/book-reader-5.css#L85) | Đổi `.gvb-badge` và `.gvb-btn-primary` từ `var(--son-red)` sang `var(--son-red-fill)` (`#973C2C` ở theme tối; ở theme sáng cả `--son-red` và `--son-red-fill` đều là `#9E2835` nên theme sáng không đổi 1 pixel). |
| **T-06** | [card-table-5.css](../../assets/goi-viet/map-surroundings-preview/card-table-5.css#L195) | Thêm `html[data-theme=dark] #deckModal #cardFrontState #answerExplanationBox { --focus-ring: #9e2835; }` để mọi nút trong `#answerExplanationBox` (`.card-review-button` và `#btnFlipToBack`) hiển thị vòng `:focus-visible` đỏ son rõ nét trên nền kem `#fff8e6`, đồng thời giữ theme sáng bất biến tuyệt đối. |
| **Nạp & bộ nhớ đệm** | [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html#L4238-L4254) · [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | Tăng `?v=20261126-dark-1` cho `card-table-5.css`, `book-reader-5.css`, `arrival-demo-5.css`; chèn `<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/dark-theme-5.css?v=20261126-dark-1">` ở cuối chuỗi stylesheet (dòng 4254) sau toàn bộ tệp cần ghi đè; dựng lại gói ngoại tuyến (`643` tài nguyên, phiên bản `ce4bd9522857b16a`). |

**Kiểm tra tự động phạm vi CSS (`đã đo`):** toàn bộ **`78/78` selector** trong `assets/goi-viet/map-surroundings-preview/dark-theme-5.css` đều bắt đầu bằng `html[data-theme="dark"]` (`0` ngoại lệ).

---

## 2. Bảng đối chiếu tương phản Trước → Sau sửa (WCAG 2.2 AA)

Tất cả giá trị bên dưới đều **`đã đo`** tự động trực tiếp trên DOM đã ghép nền alpha (`1920×1080 VI` và đối chiếu nhất quán trên cả `1920×1080 EN`, `1366×768 VI`, `1366×768 EN`).

| Mục | Màn hình | Thành phần / Trạng thái | Trước sửa (màu & tỉ lệ) | Sau sửa (màu & tỉ lệ) | Ngưỡng WCAG 2.2 AA | Kết luận |
| --- | --- | --- | --- | --- | --- | --- |
| **T-01** | `01-gate` | Nền `#introScreen` / `#introWelcomeStage` | `#f9efd9` (`L=0,869`) / `#fcf0d8` (`L=0,880`) | `#152720` (`L=0,017`) | Nền tối đồng bộ | **Đạt** |
| **T-01** | `01-gate` | `.gv-gate-tagline` / `#homeOpeningHint` | `#795335` (`6,00:1`) / `#806546` (`4,81:1`) trên nền sáng rò | `#ebd9b4` (`11,26:1`) / `#ccd6c1` (`10,39:1`) trên `#152720` | `≥ 4,5:1` | **Đạt** |
| **T-01** | `01-gate` | `.gv-lang-toggle-home button:focus-visible` | `#f0ab97` trên `#fcf0d8` → **`1,69:1`** | `#ffeaba` trên `#152720` → **`13,20:1`** | `≥ 3,0:1` | **Đạt** |
| **T-01** | `01-gate` | `.gv-home-opening-tools summary:focus-visible` | `#f0ab97` trên `#fcf0d8` → **`1,69:1`** | `#ffeaba` trên `#152720` → **`13,20:1`** | `≥ 3,0:1` | **Đạt** |
| **T-01** | `01-gate` | `#btnHomeOpeningStart` (chữ / viền / focus) | `#fff5df` trên `#a3323d` (`6,29:1`), focus `#a3323d` (`6,04:1` trên nền sáng) | chữ `6,34:1`, viền `#d6a96a` (`7,25:1`), focus `#ffeaba` (**`13,20:1`**) | `≥ 4,5:1` / `≥ 3,0:1` | **Đạt** |
| **T-01** | `01b-gate-music` | Bề mặt & viền `.gv-home-music-panel` | `#fffbed` (`L=0,964`), viền `#cfbb88` (`1,67:1`) | `#20362c` (`L=0,031`), viền `#9e8a5c` (**`4,65:1`**) | Nền tối, viền `≥ 3,0:1` | **Đạt** |
| **T-01** | `01b-gate-music` | `.gv-home-music-file-button:focus-visible` | `#f0ab97` trên `#fffbed` → **`1,85:1`** | `#ffeaba` trên `#20362c` → **`10,91:1`** (chữ `6,12:1`, viền `6,61:1`) | `≥ 3,0:1` / `≥ 4,5:1` | **Đạt** |
| **T-01** | `01b-gate-music` | `#btnHomeMusicPreview:disabled` / `Remove:disabled` | chữ `#948975` trên `#f8f3e7` (`3,11:1`), viền `#dfd3b5` (`1,44:1`) | chữ `#a8b7a5` trên `#1b2f26` (**`6,74:1`**), viền `#5b7160` (`2,45:1`) | Miễn trừ disabled (đã rõ hơn hẳn) | **Đạt** |
| **T-02** | `02-intro-invitation` | Bề mặt `#homepageContent` & `.gv-home-features` | `#fcf3df` (`L=0,901`) & `#fbf6e8` (`L=0,922`, viền `1,30:1`) | `#1e332a` (`L=0,028`) & `#263e34` (`L=0,041`, viền **`4,20:1`**) | Nền tối, viền `≥ 3,0:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | Chữ thư mời (`.gv-home-kicker`, `#homepageHeading`, `.gv-home-description`, `.gv-home-features`) | Nền sáng rò (`4,77–11,57:1`) | `#ffd1b5` (`9,63:1`), `#f7f0de` (`11,83:1`), `#d6decb` (`9,71:1`), mục tính năng `10,14:1` / `7,84:1` | `≥ 4,5:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `#btnHomeExploreMemory` (nền / viền / focus) | `#fef8ea` (`L=0,941`), viền `#ac8e50` (**`2,82:1`**), focus `#f0ab97` (**`1,73:1`**) | `#274035` (`L=0,044`), chữ `9,87:1`, viền `#c9a662` (**`5,83:1`**), focus `#ffeaba` (**`11,35:1`**) | `≥ 4,5:1` / `≥ 3,0:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `#btnQuickStartWelcome:focus-visible` | `#f0ab97` trên `#fcf3df` → **`1,73:1`** | `#ffeaba` trên `#1e332a` → **`11,35:1`** | `≥ 3,0:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `.gv-home-opening-tools` & `.gv-lang-toggle-home` | `#a4553d` không nền trên núi xanh đậm (khó đọc trên ảnh) | Viên nền tối `rgba(21,39,32,0.88)` viền `3,57:1`; `VI`/`EN`/nút công cụ **`11,53–13,20:1`**; focus **`13,20:1`** | `≥ 4,5:1` / `≥ 3,0:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `.gv-home-station-mist` | `#fff3d8` (`L=0,903`) | `#172a22` (`L=0,020`) | Nền tối | **Đạt** |
| **T-02** | `02-intro-invitation` | `#btnHomeStationCentral > svg` (ga Huế) | `#bd922e` trên `#fff3d8` → **`2,61:1`** *(trên `#fcf0d8`: `2,54:1`)* | `#f3ce78` trên `#172a22` → **`10,00:1`** | `≥ 3,0:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `.gv-home-station-arrow` (Bắc / Trung / Nam) | `3,85:1` / `3,43:1` / `3,19:1` trên `#fff3d8` | **`7,71:1`** / **`8,68:1`** / **`8,52:1`** trên `#172a22` (chữ `8,88–10,00:1`) | `≥ 4,5:1` | **Đạt** |
| **T-02** | `02-intro-invitation` | `#btnHomeStation{North,Central,South}:focus-visible` | `#f0ab97` trên `#fcf0d8` → **`1,69:1`** | `#ffeaba` trên `#152720` → **`13,20:1`** | `≥ 3,0:1` | **Đạt** |
| **T-03** | `18-bamboo-ritual` | Bề mặt `#bambooRollModal > .modal-sheet` | `#f7edda` (`L=0,854`) | `#1e332a` (`L=0,028`), viền `#cfa962` (`8,01:1`), chữ `6,97–11,83:1` | Nền tối, `≥ 4,5:1` | **Đạt** |
| **T-03** | `18-bamboo-ritual` | Viền `.ritual-close` & `.ritual-scope button` | `#deca9f` trên `#f7edda` → **`1,39:1`** | `#8ba28b` trên `#1e332a` → **`4,89:1`** (active `#f2a996` → **`6,97:1`**) | `≥ 3,0:1` | **Đạt** |
| **T-03** | `18-bamboo-ritual` | Hover `.ritual-scope button` | `#eddfc1` (`L=0,746`, chữ `4,42:1`, viền `1,39:1`) | `#294337` (`L=0,048`, chữ **`7,42:1`**, viền `#cfa962` **`6,08:1`**) | `≥ 4,5:1` / `≥ 3,0:1` | **Đạt** |
| **T-03** | `18-bamboo-ritual` | `:focus-visible` (`.ritual-close`, `.ritual-scope button`, `.ritual-primary`) | `#f0ab97` trên `#f7edda` → **`1,65:1`** | `#ffeaba` trên `#1e332a` → **`11,35:1`** | `≥ 3,0:1` | **Đạt** |
| **T-03** | `18b-bamboo-ritual-result` | Trạng thái đã rút vé (`.ritual-ticket-top`, tiêu đề, câu thơ, dấu triện, bước hoàn thành) | *(rò nền kem `#f7edda`)* | Đầu vé **`12,30:1`**, điểm đến **`6,97:1`**, câu thơ **`11,83:1`**, triện **`6,97:1`**, bước xong **`6,99:1`**, nút phụ **`11,83:1`** (viền `4,89:1`) | `≥ 4,5:1` / `≥ 3,0:1` | **Đạt** |
| **T-04** | `04-arrival-sheet` | `#arrivalSheet .arrival-close:hover` | `#9e2835` trên `#344a3e` → **`1,28:1`** | `#f6eed9` trên `#344a3e` → **`8,27:1`** | `≥ 3,0:1` / `≥ 4,5:1` | **Đạt** |
| **T-05** | `10a-book-cover`, `10b-book-spread` | `#bookModal .gvb-badge` ("Bản nháp") | `#ffffff` trên `#f0ab97` → **`1,91:1`** | `#ffffff` trên `#973c2c` → **`7,00:1`** | `≥ 4,5:1` | **Đạt** |
| **T-05** | `10a-book-cover` | `#bookModal .gvb-btn-primary` | `#ffffff` trên `#f0ab97` → **`1,91:1`** | `#ffffff` trên `#973c2c` → **`7,00:1`** | `≥ 4,5:1` | **Đạt** |
| **T-06** | `08a-deck-quiz-answer-conn` | `#answerExplanationBox .card-review-button:focus-visible` | `#fff9f3` trên `#fff8e6` → **`1,01:1`** | `#9e2835` trên `#fff8e6` → **`7,06:1`** | `≥ 3,0:1` | **Đạt** |
| **T-06** | `08a-deck-quiz-answer-conn` | `#answerExplanationBox #btnFlipToBack:focus-visible` | `#fff9f3` trên `#fff8e6` → **`1,01:1`** | `#9e2835` trên `#fff8e6` → **`7,06:1`** | `≥ 3,0:1` | **Đạt** |

---

## 3. Kiểm tra theme sáng không đổi pixel & chuyển theme sống

### 3.1. Đối chiếu pixel-by-pixel trên theme sáng (`đã đo`)
- **Phương pháp:** chụp toàn bộ 8 màn hình (`01-gate`, `01b-gate-music`, `02-intro-invitation`, `04-arrival-sheet` có hover `.arrival-close`, `18-bamboo-ritual`, `10a-book-cover`, `10b-book-spread`, `08a-deck-quiz-answer-conn` có Tab focus trong `#answerExplanationBox`) ở theme sáng **trước khi sửa** (`before-light/`) trên `HEAD = f534258` và **sau khi sửa** (`after-light/`) cùng kịch bản tất định trên đủ 4 cấu hình (`1920×1080 VI`, `1920×1080 EN`, `1366×768 VI`, `1366×768 EN`), sau đó so từng kênh RGBA từng pixel bằng `PIL.ImageChops.difference`.
- **Kết quả:** **`32` ảnh so sánh (`8` màn hình × `4` cấu hình) → tổng số pixel khác biệt = `0`**.

### 3.2. Chuyển theme sống không tải lại trang (`đã tái hiện`)
- Trên từng màn hình trong đủ 8 màn hình (thực hiện trên cả 4 cấu hình), bấm nút đổi theme của trang (`#btnIntroTheme` ở intro, `#headerSettings > summary` → `#btnTheme` trên bản đồ, và nút đổi theme trực tiếp ở các modal đang mở mà không reload), chuyển `Tối → Sáng → Tối` và kiểm tra tức thì giá trị computed style quay lại khớp 100% với trạng thái ban đầu:
  - `1920×1080 (VI)`: `8/8` màn hình **PASS**, `0` `pageerror`
  - `1920×1080 (EN)`: `8/8` màn hình **PASS**, `0` `pageerror`
  - `1366×768 (VI)`: `8/8` màn hình **PASS**, `0` `pageerror`
  - `1366×768 (EN)`: `8/8` màn hình **PASS**, `0` `pageerror`
- Dữ liệu chi tiết: [live-toggle.json](../../verification/audit-06/dark-theme-fix/live-toggle.json).

---

## 4. Ảnh chụp đối chiếu Trước / Sau sửa

Toàn bộ ảnh chụp trước và sau sửa cho 4 cấu hình (cả Sáng & Tối, tổng `129` tệp PNG + `3` tệp JSON đo đạc) được lưu tại [verification/audit-06/dark-theme-fix/](../../verification/audit-06/dark-theme-fix/).

| Màn hình | Ảnh Trước sửa (Tối · `1920×1080 VI`) | Ảnh Sau sửa (Tối · `1920×1080 VI`) | Ảnh Sau sửa (Tối · `1366×768 EN` / bổ sung) |
| --- | --- | --- | --- |
| `01-gate` | [before](../../verification/audit-06/dark-theme-fix/before-dark/01-gate-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/01-gate-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/01-gate-1366x768-en-dark.png) |
| `01b-gate-music` | [before](../../verification/audit-06/dark-theme-fix/before-dark/01b-gate-music-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/01b-gate-music-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/01b-gate-music-1366x768-en-dark.png) |
| `02-intro-invitation` | [before](../../verification/audit-06/dark-theme-fix/before-dark/02-intro-invitation-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/02-intro-invitation-1920x1080-vi-dark.png) | [1366 VI](../../verification/audit-06/dark-theme-fix/after-dark/02-intro-invitation-1366x768-vi-dark.png) · [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/02-intro-invitation-1366x768-en-dark.png) |
| `04-arrival-sheet` *(hover `.arrival-close`)* | [before](../../verification/audit-06/dark-theme-fix/before-dark/04-arrival-sheet-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/04-arrival-sheet-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/04-arrival-sheet-1366x768-en-dark.png) |
| `18-bamboo-ritual` | [before](../../verification/audit-06/dark-theme-fix/before-dark/18-bamboo-ritual-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/18-bamboo-ritual-1920x1080-vi-dark.png) | [Đã rút vé `18b`](../../verification/audit-06/dark-theme-fix/after-dark/18b-bamboo-ritual-result-1920x1080-vi-dark.png) · [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/18-bamboo-ritual-1366x768-en-dark.png) |
| `10a-book-cover` | [before](../../verification/audit-06/dark-theme-fix/before-dark/10a-book-cover-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/10a-book-cover-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/10a-book-cover-1366x768-en-dark.png) |
| `10b-book-spread` | [before](../../verification/audit-06/dark-theme-fix/before-dark/10b-book-spread-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/10b-book-spread-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/10b-book-spread-1366x768-en-dark.png) |
| `08a-deck-quiz-answer-conn` *(focus `.card-review-button`)* | [before](../../verification/audit-06/dark-theme-fix/before-dark/08a-deck-quiz-answer-conn-1920x1080-vi-dark.png) | [after](../../verification/audit-06/dark-theme-fix/after-dark/08a-deck-quiz-answer-conn-1920x1080-vi-dark.png) | [1366 EN](../../verification/audit-06/dark-theme-fix/after-dark/08a-deck-quiz-answer-conn-1366x768-en-dark.png) |

---

## 5. Kết quả 8 suite kiểm thử tự động & kiểm tra gói ngoại tuyến

| Kiểm tra | Lệnh chạy | Kết quả | Ghi chú |
| --- | --- | --- | --- |
| Gói ngoại tuyến | `python tools/build-preview-5-offline.py --check` | **PASS** | `643` tài nguyên (`180,01 MB`, `ce4bd9522857b16a`), đã gồm `dark-theme-5.css` |
| Suite 1 | `node tools/check-books-5.cjs` | **PASS** | `0` lỗi trên 4 tập nháp + `_mau` |
| Suite 2 | `node tools/check-i18n-5.cjs` | **PASS** | Đủ 260 markup keys & 245 code keys VI/EN |
| Suite 3 | `node tools/check-memory-v5.cjs` | **PASS** | `errors: []`, 8 bề rộng, 14 assets chuẩn |
| Suite 4 | `node tools/verify-preview5-conversation-cards.cjs` | **PASS** | Đủ 6 kích thước, hoạt ảnh và chu trình chơi thẻ |
| Suite 5 | `node tools/check-station-panel-5.cjs` | **PASS** | 6 kích thước, hành trình, thẻ, sách nháp và chế độ tối |
| Suite 6 | `node tools/check-family-voyage-5.cjs` | **PASS** | Toàn bộ ca kiểm thư đảo, nhóm chơi và 20 lượt lặp |
| Suite 7 | `node tools/check-station-photos-5.cjs` | **PASS** | 35 ảnh + biểu tượng Hoàng Sa, 6 kích thước × 2 ngôn ngữ, 72 khung offline |
| Suite 8 | `node tools/check-arrival-demo-5.cjs --preview-5` | **PASS** | `61/61` ca chức năng PASS (`0` lỗi), hiệu năng `0%` slowdown |

---

## 6. Vấn đề ngoài phạm vi (chỉ ghi nhận, không sửa)

1. **`T-07` – `T-17` (mức Trung bình và Thấp):** giữ nguyên theo đúng phạm vi đợt sửa 1 để xử lý ở đợt sau.
2. **Vòng focus trong `#answerExplanationBox` ở theme sáng:** tương tự theme tối trước sửa, ở theme sáng `#answerExplanationBox` vẫn kế thừa `--focus-ring: var(--card-front-ink)` (`#FFF9F3`) trên nền `#fff8e6` (`1,01:1`). Đợt này cố ý giới hạn bản sửa `T-06` trong `html[data-theme=dark]` để giữ nguyên `0` pixel khác biệt cho theme sáng; đề xuất mở rộng sang cả theme sáng ở đợt tiếp theo nếu được duyệt.
3. **Vệt ánh sáng `.ritual-result-card::after` khi bật `prefers-reduced-motion: reduce`:** trong tệp dùng chung `fortune-ritual.css:115, 193`, khi tắt chuyển động, lớp giả `ritual-ticket-glint` dừng cố định thành vệt sáng mờ chéo qua giữa vé rút xăm (tồn tại sẵn trên cả theme sáng lẫn tối; chữ trên vé tối vẫn đạt `6,97–11,83:1`).
4. **Dải chữ `.gv-home-verse` và `.gv-home-station-hint` trên `02-intro-invitation`:** giữ nguyên chữ xanh rừng/nâu trầm vì nằm trực tiếp trên vùng nền trời sáng của bức tranh mở đầu (bức tranh được giữ nguyên theo yêu cầu); phần dải mây `.gv-home-station-mist` ở theme tối đã thu gọn mép trên (`inset: -24px -5% -26px`) để ôm gọn 3 nút ga và không phủ tối lên dòng `.gv-home-station-hint`.

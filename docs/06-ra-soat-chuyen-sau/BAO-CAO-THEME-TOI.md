# Báo cáo rà soát theme tối trên preview-5

- **Ngày thực hiện:** 2026-11-25
- **Phạm vi:** chỉ rà soát, đo tương phản và đề xuất phương án sửa cho `map-surroundings-preview-5.html` và các stylesheet riêng của `preview-5`; **không sửa mã nguồn** (đúng yêu cầu đợt 3 phần 2).
- **Cấu hình đã kiểm tra (`đã đo` & `đã tái hiện`):**
  - 4 tổ hợp viewport × ngôn ngữ: `1920×1080 (VI)`, `1920×1080 (EN)`, `1366×768 (VI)`, `1366×768 (EN)` trên Chromium.
  - **29 màn hình / trạng thái giao diện** bao phủ toàn bộ luồng: cổng mở đầu (`01-gate`), bảng nhạc cổng (`01b-gate-music`), intro & thư mời (`02-intro-invitation`), bản đồ tổng quan (`03-map-overview`), tùy chọn góc nhìn (`03b-map-view-options`), phiếu ga (`04-arrival-sheet`), danh sách ga & tìm kiếm (`05-station-list`), quạt bộ bài (`06-deck-fan`), lá bài trắc nghiệm còn dấu sen (`07-deck-quiz-sealed`), lá bài sau đáp án đúng + giải thích + mặt gắn kết (`08a-deck-quiz-answer-conn`), ngăn kéo ghi kỷ niệm (`08b-deck-memory-drawer`), lá bài Canva (`09-deck-canva`), trình đọc sách — bìa / trang đôi / mục lục (`10a`, `10b`, `10c`), bưu thiếp & ảnh PNG xuất ra (`11-postcard`, `11b-postcard-export`), nhật ký hành trình (`12-journal`), cài đặt (`13-settings`), modal biển đảo — Hoàng Sa phong thư / bàn thư / hải đồ / Trường Sa / sổ thư (`14a`–`14e`), màn sắp ra mắt Hải Phòng (`15-coming-soon-hp`), mốc 3 lá (`16-milestone-3cards`), modal đặt lại (`17-reset-modal`), ống xăm rút vé (`18-bamboo-ritual`), thanh tuyến đi (`19a-route-preview`), banner & tooltip (`19b-banner-tooltip`).
  - **94 phần tử tương tác** kiểm đủ trạng thái `hover`, `focus-visible`, `disabled`, `selected` trên mỗi cấu hình; **`0` lỗi `pageerror`** trên cả 4 cấu hình.
  - **Ảnh chụp đối chiếu Sáng & Tối (`116` ảnh PNG):** lưu tại [verification/audit-06/dark-theme/](../../verification/audit-06/dark-theme/).

---

## 1. Phương pháp đo và tiêu chuẩn WCAG 2.2

- **Ngưỡng tương phản WCAG 2.2 AA:**
  - Chữ thường: `≥ 4,5:1`.
  - Chữ lớn (`≥ 24 px` hoặc `≥ 18,66 px` đậm `font-weight ≥ 700`): `≥ 3,0:1`.
  - Thành phần UI không phải chữ (viền nút/ô nhập, vòng `:focus-visible`, biểu tượng có nghĩa): `≥ 3,0:1`.
  - Lưu ý: thành phần bị vô hiệu hóa (`:disabled`) được WCAG 2.2 miễn trừ bắt buộc về tương phản, nhưng các trường hợp quá mờ trên nền tối vẫn được ghi rõ ở mức `Thấp` để cải thiện khả năng nhận diện.
- **Ghép màu nền thực (compositing):** thuật toán đo ghép tuần tự các lớp `background-color` có alpha (`rgba`) từ tổ tiên gần nhất có nền đục trở xuống; mọi phần tử có nền `linear-gradient` / `radial-gradient` / ảnh nền / pseudo-element (`::before`) được gắn cờ **`cần xem ảnh`** và **đối chiếu trực tiếp trên ảnh chụp PNG** để loại trừ cảnh báo giả trước khi đưa vào danh sách lỗi.
- **Nguyên tắc đề xuất sửa cho preview-5:** vì `preview-5` dùng chung một số stylesheet gốc với bản trước (như `homepage-opening.css`, `homepage-content.css`, `heritage-frame.css`, `heritage-command-bar.css`, `arrival-journal.css`, `fortune-ritual.css`, `island-controls.css`, `natural.css`), khi triển khai sửa ở đợt sau nên đặt lớp ghi đè `[data-theme="dark"]` trong **tệp CSS dành riêng cho preview-5** (hoặc các tệp đuôi `-5.css` hiện có) để không làm thay đổi `index.html` và `preview-2/3/4`.

---

## 2. Danh sách lỗi và đề xuất (`T-01` – `T-17`)

### T-01 · Cổng mở đầu và bảng chọn nhạc giữ nguyên nền sáng, vòng focus dưới 2:1
- **Mức độ:** `Cao`
- **Màn hình:** `01-gate`, `01b-gate-music` (cả `1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#introScreen`, `#introWelcomeStage`, `#homeOpeningGate`, `.gv-home-music-panel`, `.gv-lang-toggle-home button`, `.gv-home-opening-tools summary`, `.gv-home-music-file-button`, `#btnHomeMusicPreview:disabled`, `#btnHomeMusicRemove:disabled`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/homepage-native.css:6` (`#introScreen[data-intro-stage="welcome"] { background: #f8ebd0; }`)
  - `assets/goi-viet/homepage-opening.css:16–22, 45–51, 70` (nền cổng gradient `#fae1c6 → #fff1cf → #f5e6c8`; bảng nhạc `#fffbed`; nút disabled `#948975` / viền `#dfd3b5`)
  - `assets/goi-viet/map-surroundings-preview/memory-reference-v2.css:3` (`background: #f9efd9`)
  - `map-surroundings-preview-5.html:337, 430` (`--son-red: #F0AB97` làm màu `outline` toàn cục `button:focus-visible`)
- **Màu chữ / viền và nền (`đã đo` & đối chiếu ảnh):**
  - Bề mặt rò sáng: `#introScreen` `#f9efd9` (luminance `0,869`), `#introWelcomeStage` `#fcf0d8` (`0,880`), `.gv-home-music-panel` `#fffbed` (`0,964`).
  - Vòng `:focus-visible` trên `.gv-lang-toggle-home button` và `.gv-home-opening-tools summary`: `#f0ab97` trên `#fcf0d8` → **`1,69:1`**.
  - Vòng `:focus-visible` trên `.gv-home-music-file-button`: `#f0ab97` trên `#fffbed` → **`1,85:1`**.
  - Nút disabled `#btnHomeMusicPreview` / `#btnHomeMusicRemove`: chữ `#948975` trên `#f8f3e7` → **`3,11:1`**; viền `#dfd3b5` trên `#fffbed` → **`1,44:1`** *(miễn trừ WCAG nhưng mờ hẳn trên nền sáng rò)*.
- **Mức yêu cầu:** `≥ 3,0:1` (vòng focus & viền UI); nền phải chuyển tối khi `data-theme="dark"`.
- **Ảnh chụp:** [01-gate-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/01-gate-1920x1080-vi-dark.png) · [01b-gate-music-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/01b-gate-music-1920x1080-vi-dark.png) (so với bản sáng [01-gate-1920x1080-vi-light.png](../../verification/audit-06/dark-theme/01-gate-1920x1080-vi-light.png) gần như y hệt).
- **Đề xuất sửa:** Tạo bộ biến nền/chữ riêng cho màn mở đầu trong CSS riêng của preview-5 dưới `html[data-theme="dark"]` (chẳng hạn `--home-gate-bg: #152720`, `--home-panel-bg: #20362c`, `--home-panel-ink: #f7f0de`, `--home-panel-border: #8ba28b`), áp bộ lọc dịu cho logo cổng (hoặc đặt hào quang sáng nhẹ sau `.gv-gate-logo`), và đảm bảo `--focus-ring` đổi sang `#ffeaba` trên nền tối (hoặc `#8c1d28` nếu giữ nền sáng cục bộ).

---

### T-02 · Màn Intro và Thư mời chưa chuyển theme tối; nút ngôn ngữ, biểu tượng ga Huế và vòng focus kém tương phản
- **Mức độ:** `Cao`
- **Màn hình:** `02-intro-invitation` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#homepageContent`, `.gv-home-station-mist`, `.gv-home-features`, `#btnHomeExploreMemory`, `.gv-lang-toggle-home`, `#btnHomeStationCentral > svg`, `.gv-home-station-arrow`, `#btnQuickStartWelcome:focus-visible`, `#btnHomeStation{North,Central,South}:focus-visible`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/memory-reference-v2.css:9` (`#homepageContent { background-color: #fcf3df; }`)
  - `assets/goi-viet/map-surroundings-preview/invitation-design.css:8–24, 84–91` (`--inv-paper: #faf6e8`, `--inv-ink: #073b32`, `.gv-home-features { background: #fbf6e5; }`)
  - `assets/goi-viet/homepage-content.css:69–82, 125, 136` (`#btnHomeStationCentral`, `.gv-home-station-arrow`, `.gv-home-guide`)
  - `assets/goi-viet/map-surroundings-preview/i18n-ui-5.css:79–84` (`.gv-lang-toggle-home { --lang-ink: #a4553d; }`)
  - `assets/goi-viet/map-surroundings-preview/home-controls-3.css:2–23` (`.gv-home-opening-tools` màu `#a4553d` không nền)
  - `map-surroundings-preview-5.html:337, 430` (vòng `:focus-visible` dùng `--son-red: #F0AB97` có `!important` ghi đè `#125448` của `homepage-content.css:137`)
- **Màu chữ / viền và nền (`đã đo` & đối chiếu ảnh):**
  - Bề mặt rò sáng: `#homepageContent` `#fcf3df` (luminance `0,901`), `.gv-home-station-mist` `#fff3d8` (`0,903`), `.gv-home-features` `#fbf6e8` (`0,924`), `#btnHomeExploreMemory` `#fef8ea` (`0,943`).
  - Vòng `:focus-visible`: `#f0ab97` trên `#fcf0d8` (3 nút ga) → **`1,69:1`**; `#f0ab97` trên `#fcf3df` (`#btnQuickStartWelcome`, `.gv-home-guide`) → **`1,73:1`**.
  - Biểu tượng ga Huế `#btnHomeStationCentral > svg`: `#bd922e` trên `#fcf0d8` → **`2,54:1`**.
  - Viền nút `#btnHomeExploreMemory` ("Xem cách chơi"): `#ac8e50` trên `#fcf3df` → **`2,82:1`** (`cần xem ảnh`, đã xác nhận mờ nhẹ trên ảnh).
  - Mũi tên `.gv-home-station-arrow` trên 3 nút ga: `#ca5359` (`3,80:1`), `#988052` (`3,37:1`), `#549292` (`3,14:1`) trên `#fcf0d8`.
  - Nút `VI / EN` (`.gv-lang-toggle-home`, `#a4553d`) và `.gv-home-opening-tools`: nằm không khung trên nền tranh núi xanh đậm góc phải trên → rất khó đọc (`cần xem ảnh`, đã xác nhận trực quan rõ trên ảnh `02-intro-invitation-1920x1080-vi-dark.png`).
- **Mức yêu cầu:** `≥ 4,5:1` (chữ/mũi tên thường), `≥ 3,0:1` (icon, viền nút, vòng focus).
- **Ảnh chụp:** [02-intro-invitation-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/02-intro-invitation-1920x1080-vi-dark.png) · [02-intro-invitation-1366x768-vi-dark.png](../../verification/audit-06/dark-theme/02-intro-invitation-1366x768-vi-dark.png) (đối chiếu sáng [02-intro-invitation-1920x1080-vi-light.png](../../verification/audit-06/dark-theme/02-intro-invitation-1920x1080-vi-light.png)).
- **Đề xuất sửa:** Ghi đè các biến `--inv-paper: #1e332a`, `--inv-ink: #f7f0de`, `--inv-body: #d2d9c6`, `--inv-gold: #d6b26f` cho `#homepageContent` trong `[data-theme="dark"]`; đổi `.gv-home-features` sang `#263e34`, `#btnHomeExploreMemory` sang nền `#263e34` viền `#c4aa73`; thêm tấm nền bán trong suốt tối (`rgba(21, 39, 32, 0.84)`) hoặc chữ sáng `#f7f0de` cho `.gv-home-opening-tools` & `.gv-lang-toggle-home`; đổi màu `--station-ink` / `--station-border` của 3 nút ga sang bộ tương phản tối hoặc làm đậm màu mũi tên/icon trên nền kem.

---

### T-03 · Modal ống xăm rút vé bị ép cứng nền kem sáng ngay trong block `[data-theme='dark']`
- **Mức độ:** `Cao`
- **Màn hình:** `18-bamboo-ritual` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#bambooRollModal > .modal-sheet`, `.ritual-close`, `.ritual-scope button`, `.ritual-primary:focus-visible`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/fortune-ritual.css:188` (`html[data-theme='dark'] body[data-regional-preview] #bambooRollModal.fortune-ritual { --ritual-paper: #f7edda; --ritual-warm: #eddfc1; }`)
  - `map-surroundings-preview-5.html:337, 430` (vòng `:focus-visible` dùng `--son-red: #F0AB97`)
- **Màu chữ / viền và nền (`đã đo` & đối chiếu ảnh):**
  - Toàn bộ `.modal-sheet` sáng rực `#f7edda` (luminance `0,854`) nổi gắt trên bản đồ tối.
  - Viền `.ritual-close` và `.ritual-scope button`: `#deca9f` trên `#f7edda` → **`1,39:1`**.
  - Vòng `:focus-visible` trên `.ritual-close`, `.ritual-scope button`, `.ritual-primary`: `#f0ab97` trên `#f7edda` → **`1,65:1`**.
  - Hover `.ritual-scope button` & `.ritual-close` sáng `#eddfc1` (luminance `0,746`).
- **Mức yêu cầu:** `≥ 3,0:1` cho viền nút & vòng focus; bề mặt modal cần tuân thủ theme tối.
- **Ảnh chụp:** [18-bamboo-ritual-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/18-bamboo-ritual-1920x1080-vi-dark.png) · [18-bamboo-ritual-1366x768-vi-dark.png](../../verification/audit-06/dark-theme/18-bamboo-ritual-1366x768-vi-dark.png) (đối chiếu sáng [18-bamboo-ritual-1920x1080-vi-light.png](../../verification/audit-06/dark-theme/18-bamboo-ritual-1920x1080-vi-light.png)).
- **Đề xuất sửa:** Trong CSS riêng của preview-5, đặt lại biến cho `html[data-theme="dark"] #bambooRollModal.fortune-ritual`: `--ritual-paper: #1e332a`, `--ritual-warm: #274035`, `--ritual-ink: #f7f0de`, `--ritual-muted: #d2d9c6`, `--ritual-line: #8ba28b` (đạt `> 3,5:1` trên `#1e332a`), và nâng sáng `.ritual-brand` (logo) bằng `filter: brightness(1.6) saturate(0.85)`. Khi nền modal đã tối, vòng `:focus-visible` `#f0ab97` tự đạt `~7,4:1`.

---

### T-04 · Nút đóng phiếu ga (`.arrival-close`) gần như tàng hình khi di chuột
- **Mức độ:** `Cao`
- **Màn hình:** `04-arrival-sheet` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#arrivalSheet .arrival-close:hover`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css:224–226` (`.arrival-close:hover { color: var(--station-red); background: var(--station-soft); }`)
  - `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css:304, 308` (trong `html[data-theme='dark']`: `--station-soft: #344a3e`, `--station-red: #9e2835`)
- **Màu chữ / viền và nền (`đã đo`):** `#9e2835` trên `#344a3e` → **`1,28:1`** (biểu tượng `×` chìm hoàn toàn vào nền nút khi hover!).
- **Mức yêu cầu:** `≥ 3,0:1` (biểu tượng giao diện) / `≥ 4,5:1`.
- **Ảnh chụp:** [04-arrival-sheet-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/04-arrival-sheet-1920x1080-vi-dark.png) (đối chiếu sáng [04-arrival-sheet-1920x1080-vi-light.png](../../verification/audit-06/dark-theme/04-arrival-sheet-1920x1080-vi-light.png)).
- **Đề xuất sửa:** Trong `arrival-demo-5.css` (tệp riêng preview-5), tách `--station-red-ink: #f3c6a4` (hoặc đổi `#arrivalSheet .arrival-close:hover { color: #f6eed9; }` trong block `html[data-theme='dark']` dòng `311`, vì `--station-red: #9e2835` đang dùng làm màu nền nút đỏ `.gv-station-play`). Khi dùng `#f6eed9` trên `#344a3e`, tương phản đạt `~8,5:1`.

---

### T-05 · Huy hiệu "Bản nháp" và `.gvb-btn-primary` trong trình đọc sách chữ trắng trên nền hồng nhạt (`1,91:1`)
- **Mức độ:** `Cao`
- **Màn hình:** `10a-book-cover`, `10b-book-spread` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#bookModal .gvb-badge`, `#bookModal .gvb-btn-primary`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/books-5/book-reader-5.css:62–70` (`.gvb-badge { background: var(--son-red); color: #fff; }`)
  - `assets/goi-viet/books-5/book-reader-5.css:85` (`.gvb-btn-primary { background: var(--son-red); border-color: var(--son-red); color: #fff; }`)
  - `map-surroundings-preview-5.html:337, 339` (ở theme tối `--son-red: #F0AB97` là màu chữ sáng, còn màu nền đỏ là `--son-red-fill: #973C2C`)
- **Màu chữ và nền (`đã đo` & đối chiếu ảnh):** `#ffffff` trên `#f0ab97` → **`1,91:1`**. Nhìn trực tiếp trên ảnh `10a` và `10b`, nhãn *"Bản nháp"* nhòe, rất khó đọc.
- **Mức yêu cầu:** `≥ 4,5:1` (chữ `12 px` đậm `700`).
- **Ảnh chụp:** [10a-book-cover-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/10a-book-cover-1920x1080-vi-dark.png) · [10a-book-cover-1366x768-vi-dark.png](../../verification/audit-06/dark-theme/10a-book-cover-1366x768-vi-dark.png) · [10b-book-spread-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/10b-book-spread-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `assets/goi-viet/books-5/book-reader-5.css:66, 85` (tệp riêng preview-5), đổi `background: var(--son-red)` sang `background: var(--son-red-fill)` và `border-color: var(--son-red-fill)` (`#973C2C` ở theme tối → `#ffffff` trên `#973C2C` đạt `~6,3:1`, đồng thời ở theme sáng `--son-red-fill` là `#9E2835` không đổi giao diện sáng).

---

### T-06 · Vòng `:focus-visible` tàng hình hoàn toàn (`1,01:1`) trong hộp giải thích đáp án bộ bài
- **Mức độ:** `Cao`
- **Màn hình:** `08a-deck-quiz-answer-conn`, `08b-deck-memory-drawer` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#answerExplanationBox .card-review-button:focus-visible` (và mọi nút bên trong `#answerExplanationBox`)
- **Tệp CSS:dòng:**
  - `map-surroundings-preview-5.html:430, 2810` (`--focus-ring: var(--card-front-ink)` = `#FFF9F3` trên `.card-3d-front`)
  - `assets/goi-viet/map-surroundings-preview/card-table-5.css:66, 73` (`#answerExplanationBox { background: #fff8e6; }`, `.card-review-button { background: #fffdf5; }`)
- **Màu viền focus và nền (`đã đo`):** `#fff9f3` trên `#fff8e6` → **`1,01:1`** (không thể phân biệt bằng mắt khi điều hướng phím `Tab`).
- **Mức yêu cầu:** `≥ 3,0:1` (WCAG 2.2 · Focus Appearance / Non-text Contrast).
- **Ảnh chụp:** [08a-deck-quiz-answer-conn-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/08a-deck-quiz-answer-conn-1920x1080-vi-dark.png) · [08a-deck-quiz-answer-conn-1366x768-vi-dark.png](../../verification/audit-06/dark-theme/08a-deck-quiz-answer-conn-1366x768-vi-dark.png).
- **Đề xuất sửa:** Trong `assets/goi-viet/map-surroundings-preview/card-table-5.css:66` (tệp riêng preview-5), bổ sung `--focus-ring: #9e2835;` cho `#deckModal #cardFrontState #answerExplanationBox` (tương tự cách `.lifeline-box` đã làm tại `map-surroundings-preview-5.html:2990`). Khi đó vòng focus `#9e2835` trên `#fff8e6` đạt `~7,2:1`.

---

### T-07 · Logo Gói Việt trên thanh tiêu đề bản đồ chìm vào nền xanh tối
- **Mức độ:** `Trung bình`
- **Màn hình:** `03-map-overview`, `03b-map-view-options`, `12-journal`, `13-settings`, `19a-route-preview`, `19b-banner-tooltip` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `.top-header .map-brand-logo` (bên trong `button.brand-group`)
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/heritage-command-bar.css:26` (`.map-brand-logo { filter: none; }`)
  - Đối chiếu chuẩn sẵn có: `map-surroundings-preview-5.html:3118` (`[data-theme="dark"] .gv-postcard-logo { filter: brightness(1.8) saturate(.65); }`)
- **Màu & nhận định (`cần xem ảnh` — đã xác nhận trên ảnh chụp):** nét chữ đỏ thẫm của ảnh PNG/WebP logo đặt thẳng trên nền thanh tiêu đề tối `#30483e`–`#283f38` khiến phần thân chữ "Gói Việt" chìm tối và kém nổi bật so với bản sáng.
- **Mức yêu cầu:** Nhận diện thương hiệu rõ trên nền tối (tối thiểu tương đương độ nổi của `.gv-postcard-logo` ở modal bưu thiếp).
- **Ảnh chụp:** [03-map-overview-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/03-map-overview-1920x1080-vi-dark.png) (so với bản sáng [03-map-overview-1920x1080-vi-light.png](../../verification/audit-06/dark-theme/03-map-overview-1920x1080-vi-light.png)).
- **Đề xuất sửa:** Trong CSS riêng preview-5, thêm `html[data-theme="dark"] #mapScene .top-header .map-brand-logo { filter: brightness(1.65) contrast(1.08) drop-shadow(0 0 6px rgba(255, 245, 220, 0.28)); }` hoặc đặt lớp lót mảnh sáng dịu sau logo.

---

### T-08 · Khung trang trí bốn góc bản đồ giữ nguyên tranh ban ngày sáng chói
- **Mức độ:** `Trung bình`
- **Màn hình:** `03-map-overview`, `03b-map-view-options`, `12-journal`, `13-settings`, `19a-route-preview`, `19b-banner-tooltip`
- **Selector:** `#mapScene` (nền `var(--hf-paper)`), `.heritage-frame > .hf-original-art`
- **Tệp CSS:dòng:** `assets/goi-viet/map-surroundings-preview/heritage-frame.css:14–23, 39–50` (`--hf-paper: #f5e9cb; border-image-source: url('frame/reference-original.png');`, không có khối `[data-theme="dark"]`)
- **Màu & nhận định (`cần xem ảnh` — đã xác nhận trên ảnh chụp):** toàn bộ khung tranh 4 cạnh giữ nguyên giấy vàng kem `#f5e9cb`, mây trắng và núi sen ban ngày bao quanh không gian bản đồ đêm tối, gây chói viền mắt.
- **Mức yêu cầu:** Đồng bộ bề mặt khung với không gian tối, tránh viền trắng/kem rực quanh khung nhìn tối.
- **Ảnh chụp:** [03-map-overview-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/03-map-overview-1920x1080-vi-dark.png) · [19a-route-preview-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/19a-route-preview-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong CSS riêng preview-5, thêm cho `html[data-theme="dark"] #mapScene`: `--hf-paper: #162621; --hf-paper-light: #20342d;` và áp `filter: brightness(0.46) contrast(1.12) saturate(0.75);` lên `.heritage-frame .hf-original-art` (hoặc tạo biến thể ảnh khung tối `reference-dark-5.png`).

---

### T-09 · Dấu tiến độ mốc đã đóng (`.heritage-progress-stamp.is-stamped`) trên thanh tiêu đề chỉ đạt `2,79:1`
- **Mức độ:** `Trung bình`
- **Màn hình:** `12-journal`, `19b-banner-tooltip` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `.top-header .heritage-progress-stamp.is-stamped`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/heritage-command-bar.css:5, 49–50` (`--bar-gold: #96713c`, `.is-stamped { background: var(--bar-gold); color: #ffffff; }`)
  - `assets/goi-viet/map-surroundings-preview/arrival-journal.css:130` (`html[data-theme='dark'] ... & .top-header .heritage-progress-stamp { color: #ddcba5; }` vô tình ghi đè luôn màu chữ trắng của `.is-stamped`)
- **Màu chữ và nền (`đã đo` & đối chiếu ảnh):** `#ddcba5` trên `#96713c` → **`2,79:1`**.
- **Mức yêu cầu:** `≥ 4,5:1` (ký tự `✓` kích thước `11 px`) / tối thiểu `≥ 3,0:1` nếu xét là biểu tượng UI.
- **Ảnh chụp:** [12-journal-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/12-journal-1920x1080-vi-dark.png) · [19b-banner-tooltip-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/19b-banner-tooltip-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Giới hạn quy tắc ghi đè cho mốc chưa đóng (`:not(.is-stamped)`), còn `.heritage-progress-stamp.is-stamped` trong theme tối đặt nền `--bar-gold-stamped: #d8b56b` với dấu `✓` màu `#172e26` (`~7,9:1`), hoặc giữ nền `#7c5928` với dấu `#ffffff` (`~6,5:1`).

---

### T-10 · Viền ô tìm kiếm và các nút ga trong danh sách ga / nhật ký dưới ngưỡng `3,0:1`
- **Mức độ:** `Trung bình`
- **Màn hình:** `05-station-list`, `12-journal` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#provSearchInput`, `#arrivalVisitedList .gv-station-journal-stop`, `#arrivalSealedList .gv-station-journal-stop`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css:298, 302, 499` (`--station-paper: #20332c; --station-rule: #526354;`)
  - `assets/goi-viet/map-surroundings-preview/station-panel-5.css:185, 579` (`border: 1px solid var(--station-rule);`)
- **Màu viền và nền (`đã đo` & đối chiếu ảnh):** `#526354` trên `#20332c` → **`2,08:1`**.
- **Mức yêu cầu:** `≥ 3,0:1` (viền ô nhập và nút bấm tương tác).
- **Ảnh chụp:** [05-station-list-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/05-station-list-1920x1080-vi-dark.png) · [12-journal-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/12-journal-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `arrival-demo-5.css:302, 499`, nâng `--station-rule` (hoặc tách riêng `--station-control-border`) lên `#768b78` (`~3,56:1` trên `#20332c`) để ranh giới ô tìm kiếm và nút ga rõ ràng hơn mà vẫn giữ hài hòa tông xanh trầm.

---

### T-11 · Viền nút thanh tiêu đề & hộp quần đảo dưới `3,0:1`; mất hiệu ứng `:hover` trên 2 nút header ở theme tối
- **Mức độ:** `Trung bình`
- **Màn hình:** `03-map-overview`, `13-settings`, `19b-banner-tooltip` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#btnIslandHoangSa`, `#btnIslandTruongSa`, `#headerSettings > summary.craft-btn`, `#previewPanelOpen`, `.top-header .header-actions > .craft-btn-green:hover`, `.top-header #previewPanelOpen:hover`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/island-controls.css:51, 88` (`--island-fine: #7D7151`)
  - `assets/goi-viet/map-surroundings-preview/arrival-journal.css:128` (`--bar-line: #8b7d59`)
  - `assets/goi-viet/map-surroundings-preview/heritage-command-bar.css:5, 62–64` (`--bar-gold: #96713c`)
  - `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css:545, 554, 589–591` (block `html[data-theme='dark']` đặt màu tĩnh nhưng thiếu `:hover`, specificity cao hơn nên nuốt luôn `:hover` ở dòng 545 & 554)
- **Màu viền/nền (`đã đo` & đối chiếu ảnh):**
  - `#btnIslandHoangSa` / `#btnIslandTruongSa`: viền `#7d7151` trên nền ghép `#34463b` → **`2,09:1`** (`cần xem ảnh`, viền mỏng khá chìm trên ảnh `03-map-overview`).
  - `#headerSettings > summary.craft-btn`: viền `#8b7d59` → **`2,48:1`** (khi mở `13-settings`: viền `#96713c` → **`2,27:1`**).
  - `#previewPanelOpen`: viền `#99875e` trên `#34463b` → **`2,87:1`**.
  - Trạng thái `:hover` của `.top-header .craft-btn-green` ("Bưu Thiếp") và `#previewPanelOpen` ("Danh sách ga"): màu nền giữ nguyên y hệt trạng thái thường (`#49332f` và `#293e35`, không có phản hồi hover).
- **Mức yêu cầu:** `≥ 3,0:1` cho viền nút; cần phản hồi trạng thái `:hover` rõ ràng.
- **Ảnh chụp:** [03-map-overview-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/03-map-overview-1920x1080-vi-dark.png) · [13-settings-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/13-settings-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Nâng các biến viền tối lên ngưỡng `≥ 3,2:1` trên `#2b4038`/`#293f32`: `--island-fine: #a59469`, `--bar-line: #a89970`, `--bar-gold: #b59457`, `#previewPanelOpen` `border-color: #a9976c`; đồng thời bổ sung `.craft-btn-green:hover` (`background: #5b3f39`) và `#previewPanelOpen:hover` (`background: #354e42`) vào block `html[data-theme='dark']` tại `arrival-demo-5.css:589–592`.

---

### T-12 · Viền nút điều hướng, mục lục trình đọc sách và màn sắp ra mắt Hải Phòng dưới `3,0:1`
- **Mức độ:** `Trung bình`
- **Màn hình:** `10a-book-cover`, `10b-book-spread`, `10c-book-toc`, `15-coming-soon-hp` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `.gvb-nav[data-cover] .gvb-nav-btn:last-child` ("Mở sách →"), `.gvb-chapter`, `.gvb-toc-item`, `#bookModal.gvb-open-call .gvb-btn`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/books-5/book-reader-5.css:115–121` (`border-color: #23574a; background: #194b43;`)
  - `assets/goi-viet/books-5/book-reader-5.css:139–151, 652` (`border-color: var(--wood-border)` với `--wood-border: #4b6552`)
  - `assets/goi-viet/books-5/book-reader-5.css:725–731, 843–849` (`--call-paper: #25382f; --call-line: #816e4f;`)
- **Màu viền và nền (`đã đo` & đối chiếu ảnh):**
  - Nút "Mở sách →" (`10a`): viền `#23574a` trên `#2a4336` → **`1,30:1`** (trên ảnh `10a`, nền nút `#194b43` khá gần nền thanh điều hướng `#2a4336`).
  - Nút chương `.gvb-chapter` (`10b`): viền `#4b6552` trên `#2a4336` → **`1,68:1`**.
  - Thẻ mục lục `.gvb-toc-item` (`10c`): viền `#4b6552` trên `#20362c` → **`2,02:1`**.
  - Nút `.gvb-btn` ("← Về bản đồ", "Chơi thẻ TP. Hải Phòng") ở `15-coming-soon-hp`: viền `#816e4f` trên `#25382f` → **`2,54:1`**.
- **Mức yêu cầu:** `≥ 3,0:1` (viền thành phần tương tác).
- **Ảnh chụp:** [10a-book-cover-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/10a-book-cover-1920x1080-vi-dark.png) · [10c-book-toc-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/10c-book-toc-1920x1080-vi-dark.png) · [15-coming-soon-hp-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/15-coming-soon-hp-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `book-reader-5.css`: (1) đặt cho `html[data-theme="dark"] .gvb-nav[data-cover] .gvb-nav-btn:last-child` nền `#266558` và viền `#89c7a1` (`> 5:1`); (2) dùng `--wood-border-strong` (`#8ba28b`, `> 4,5:1`) cho viền `.gvb-toc-item` và `.gvb-chapter[aria-current]`; (3) nâng `--call-line` trong `[data-theme="dark"] #bookModal.gvb-open-call` (dòng `845`) từ `#816e4f` lên `#a4906a` (`~3,9:1` trên `#25382f`).

---

### T-13 · Ảnh bưu thiếp PNG xuất ra: chữ vàng `gold` dưới `3:1` (và luôn xuất nền giấy kem sáng)
- **Mức độ:** `Trung bình`
- **Màn hình:** `11-postcard`, `11b-postcard-export` (`1920×1080` và `1366×768`, VI & EN)
- **Selector / Canvas:** `#postcardExportCanvas` và tệp PNG xuất từ `GoiVietPostcardDesign.paint()`
- **Tệp JS:dòng:** `assets/goi-viet/postcard-design-5.js:13, 17, 19, 31–33, 45, 68` (`gold = '#b2945a'`, `muted = '#64715e'`, nền `#fff9ec`, khung cột `#f5efdf` / `#f9f3e5`)
- **Màu chữ và nền (`đã đo` theo công thức WCAG + đối chiếu ảnh PNG xuất ra):**
  - Chữ `GÓI VIỆT · KÝ ỨC GIA ĐÌNH` (`12 px`) dùng `#b2945a` trên `#fff9ec` → **`2,75:1`**.
  - Số thứ tự `01`, `02` (`13 px` / `12 px`) dùng `#b2945a` trên `#f5efdf` → **`2,51:1`**.
  - Chữ phụ `muted = '#64715e'` trên `#f5efdf` → **`4,50:1`** (vừa sát biên, đặc biệt dòng chân trang `10 px` hơi mảnh).
  - Các chữ chính `ink = '#194b40'` (`12,13:1`) và `red = '#a7372d'` (`7,28:1`) đạt tốt.
  - Ngoài ra canvas và PNG xuất ra luôn cố định nền kem sáng `#fff9ec` ngay cả khi đang ở theme tối *(mang tính bưu thiếp in cố ý, nhưng tạo mảng sáng lớn `908×572` trong modal tối)*.
- **Mức yêu cầu:** `≥ 4,5:1` cho chữ nhỏ `10–13 px` trên ảnh xuất ra.
- **Ảnh chụp:** [11-postcard-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/11-postcard-1920x1080-vi-dark.png) · [11b-postcard-export-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/11b-postcard-export-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `assets/goi-viet/postcard-design-5.js:13`, tách màu viền trang trí `goldLine = '#b2945a'` khỏi màu chữ `goldText = '#7c5d26'` (`~5,7:1` trên `#f5efdf` và `~6,3:1` trên `#fff9ec`), đồng thời làm đậm nhẹ `muted` sang `#556250` (`~5,8:1`). Có thể giữ nền giấy kem mặc định cho bưu thiếp in hoặc thêm bảng màu nền tối tùy chọn đọc theo `document.documentElement.dataset.theme`.

---

### T-14 · Bộ bài: chữ cái đáp án `.option-letter`, chú thích `#activityGentleNote`, viền nút ở `1366×768` và tab Canva chưa chọn
- **Mức độ:** `Trung bình`
- **Màn hình:** `07-deck-quiz-sealed`, `08a-deck-quiz-answer-conn`, `08b-deck-memory-drawer`, `09-deck-canva` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#cardOptBtn-0 > .option-letter`, `#activityGentleNote`, `#answerExplanationBox .card-review-button` (viền ở `1366×768`), `#btnFlipToBack` (viền ở `1366×768`), `.canva-role:not([aria-checked="true"])`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/conversation-cards-5.css:53, 90` (`.option-letter { background: #fff3; color: #fffdf8; }`, `#btnFlipToBack` viền `#ffdf8e`)
  - `assets/goi-viet/map-surroundings-preview/card-table-5.css:73, 78, 148, 151, 195` (`.card-review-button` viền `#c9a15a`; `.canva-role` nền `#e9d6a8`; `.activity-prompt-box` nền `#fffaf0b8` với `--ink-secondary: #4b5b4c`)
- **Màu chữ / viền và nền (`đã đo` & đối chiếu ảnh):**
  - `.option-letter` (`A`/`B`/`C`, `13 px`): `#fffdf8` trên lớp bán trong suốt ghép nền đo được **`4,26:1`** (khi chọn ở `07`) và **`4,32:1`** (khi hiện đáp án đúng ở `08a`) — hơi dưới `4,5:1`.
  - `#activityGentleNote` (`11,5 px`): `#4b5b4c` trên nền bán trong suốt ghép đo được **`3,89:1`** (trên giấy kem thực `#f7ecd0` ước tính đạt cao hơn, nhưng lớp bán trong suốt `#fffaf0b8` làm giảm biên an toàn).
  - Ở `1366×768` (VI & EN): viền `.card-review-button` (`#c9a15a` trên `#fff8e6`) → **`2,27:1`**; viền `#btnFlipToBack` (`#ffdf8e` trên `#fff8e6`) → **`1,22:1`**.
  - Tab Canva chưa chọn `.canva-role` (`09-deck-canva`): nền `#e9d6a8` (luminance `0,682`) nổi gắt trên mặt bàn tối `#2f4a3c`.
- **Mức yêu cầu:** `≥ 4,5:1` cho chữ nhỏ; `≥ 3,0:1` cho viền nút; giảm chói cho tab nằm trực tiếp trên mặt bàn tối.
- **Ảnh chụp:** [07-deck-quiz-sealed-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/07-deck-quiz-sealed-1920x1080-vi-dark.png) · [08a-deck-quiz-answer-conn-1366x768-vi-dark.png](../../verification/audit-06/dark-theme/08a-deck-quiz-answer-conn-1366x768-vi-dark.png) · [09-deck-canva-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/09-deck-canva-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `conversation-cards-5.css` & `card-table-5.css`: (1) đổi nền `.option-letter` từ `#fff3` sang `rgba(0, 0, 0, 0.28)` để `#fffdf8` đạt `> 7:1` ở mọi trạng thái; (2) đặt `#activityGentleNote` dùng màu `#3d4c3e` trên `.activity-prompt-box` nền đục hơn (`#fffaf0e6`); (3) đổi viền `.card-review-button` sang `#8f6c30` (`~4,7:1` trên `#fff8e6`) và `#btnFlipToBack` trong `#answerExplanationBox` dùng viền `#75202c`; (4) thêm rule `html[data-theme="dark"] #deckModal #cardFrontState .canva-role:not([aria-checked="true"])` nền trầm `#3b4d3f`, chữ `#f0e2bf`.

---

### T-15 · Các mảng sáng cục bộ trên phiếu ga (`.arrival-stamp`, `.gv-station-art-cue`) và khung mã QR trắng tinh ở màn sắp ra mắt
- **Mức độ:** `Thấp`
- **Màn hình:** `04-arrival-sheet`, `15-coming-soon-hp`, `19b-banner-tooltip`
- **Selector:** `#arrivalSheet .arrival-stamp`, `#arrivalSheet .gv-station-art-cue`, `#bookModal.gvb-open-call .gvb-soon-qr img`, `#bookModal.gvb-open-call .gvb-call-postcard`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css:642` (`.arrival-stamp { background: #fff6e8f2; }`)
  - `assets/goi-viet/map-surroundings-preview/station-panel-5.css:317` (`.gv-station-art-cue { background: #fff6df; }`)
  - `assets/goi-viet/books-5/book-reader-5.css:693, 755` (`.gvb-soon-qr img { background: #fff; }`, `.gvb-call-postcard { background: ..., #fff7e6; }`)
- **Màu & nhận định (`đã đo` & đối chiếu ảnh):**
  - Con dấu `.arrival-stamp` (`#f4ecdf`, luminance `0,846`) và nút tròn phóng ảnh `.gv-station-art-cue` (`#fff6df`) nổi sáng rõ trên phiếu ga tối.
  - Mã QR `.gvb-soon-qr img` có viền đệm `6 px` màu trắng tinh `#ffffff` (luminance `1,0`) khá chói mắt trên nền `#25382f` *(cần giữ nền sáng để camera quét QR đáng tin cậy, nhưng trắng `#ffffff` quá gắt)*. Thẻ `.gvb-call-postcard` (`#fff7e6`) giữ phong cách bưu thiếp in cố ý.
- **Mức yêu cầu:** Hạn chế mảng trắng/kem chói mắt không cần thiết trong giao diện tối.
- **Ảnh chụp:** [19b-banner-tooltip-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/19b-banner-tooltip-1920x1080-vi-dark.png) · [15-coming-soon-hp-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/15-coming-soon-hp-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `arrival-demo-5.css` (`html[data-theme='dark']`), làm dịu `.arrival-stamp` sang nền `#2d3f35f0` chữ/viền `#f3b3a6` (hoặc giấy ngà trầm `#e5d8bd` nếu muốn giữ cảm giác tem mực đỏ); đổi `.gv-station-art-cue` sang nền `#20332ce6` icon `#f6eed9`. Trong `book-reader-5.css`, đổi `.gvb-soon-qr img` ở theme tối sang nền giấy ngà `#efe5ce` (vẫn đủ độ tương phản cho mọi ứng dụng quét QR mà bớt chói hẳn).

---

### T-16 · Hải đồ Hoàng Sa / Trường Sa: nền CSS dự phòng sáng và thiếu nền đệm bảo vệ cho thanh tỉ lệ
- **Mức độ:** `Thấp`
- **Màn hình:** `14c-island-hoang-sa-atlas` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `.natural-detail-map`, `.island-chart-scale`, `canvas.island-chart-minimap`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/natural/natural.css:13` (`.natural-detail-map { background: #4c99a5; }`)
  - `assets/goi-viet/map-surroundings-preview/natural/island-chart.css:24–29` (`.island-chart-north` có nền `#194e57cc`, `.island-chart-position` có `#174c5480`, nhưng `.island-chart-scale` không có nền đệm; `.island-chart-minimap` có `border: 1px solid #d4d5aa99`)
- **Màu và nền (`đã đo` theo DOM + đối chiếu ảnh chụp):**
  - Đo trên nền CSS dự phòng `#4c99a5`: chữ `.island-chart-scale` (`20 km`, `#fff0cf`) chỉ đạt **`2,91:1`**; viền `.island-chart-minimap` (`#95b9a8` sau ghép alpha) đạt **`1,53:1`**.
  - **Đối chiếu ảnh `14c-island-hoang-sa-atlas-1920x1080-vi-dark.png`:** thực tế `<canvas>` vẽ nền biển đêm đậm (`~#184a59`) nên `20 km` vẫn đọc rất rõ (`~8,4:1`), nhưng nếu bản đồ chưa vẽ kịp hoặc người dùng kéo vùng bãi cạn sáng xuống dưới góc trái dưới, thanh tỉ lệ sẽ mất nền đệm bảo vệ.
- **Mức yêu cầu:** `≥ 4,5:1` cho chữ HUD và `≥ 3,0:1` cho viền khung bản đồ nhỏ.
- **Ảnh chụp:** [14c-island-hoang-sa-atlas-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/14c-island-hoang-sa-atlas-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Trong `sea-postoffice-5.css` (tệp riêng preview-5) ở khối `html[data-theme="dark"]`, đổi `.natural-detail-map { background: #16404c; }`, thêm nền mờ `background: #174c54b3; padding: 3px 7px; border-radius: 4px;` cho `.island-chart-scale` (đồng bộ với `.island-chart-north` và `.island-chart-position`), và tăng độ đục viền `.island-chart-minimap` lên `#d4d5aad9`.

---

### T-17 · Trạng thái vô hiệu hóa (`:disabled`) ở Cài đặt / Sách và viền nút lưu bưu thiếp PNG hơi chìm
- **Mức độ:** `Thấp`
- **Màn hình:** `13-settings`, `10a-book-cover`, `11-postcard` (`1920×1080` và `1366×768`, VI & EN)
- **Selector:** `#btnReducedMotion:disabled`, `#bookModal .gvb-nav-btn:disabled`, `#btnDownloadPostcardPng`
- **Tệp CSS:dòng:**
  - `assets/goi-viet/map-surroundings-preview/settings-panel-5.css:78, 137` (`--settings-line: #61705a`)
  - `assets/goi-viet/books-5/book-reader-5.css:83` (`.gvb-btn:disabled { opacity: .38; }`)
  - `assets/goi-viet/heritage-overlays.css:46` (`#postcardModal #btnDownloadPostcardPng { border-color: #9a3129; }`)
- **Màu & tỉ lệ (`đã đo` & đối chiếu ảnh):**
  - `#btnReducedMotion:disabled` (`13-settings`): viền `#5c6654` trên `#233c30` → **`1,98:1`** *(miễn trừ WCAG disabled)*.
  - `.gvb-nav-btn:disabled` ("← Trang trước", `10a`): chữ `#768273`/`#6d776b` trên `#263e32`/`#192d25` → **`2,85–3,13:1`**, viền **`1,74:1`** *(miễn trừ WCAG disabled)*.
  - `#btnDownloadPostcardPng` (`11-postcard`): viền `#9a3129` trên nền modal `#203d35` → **`1,60:1`** *(thân nút gradient đỏ `#b63c2b → #982d26` có chữ `#fff7e5` vẫn nổi bật rõ trên ảnh `11-postcard`, chỉ đường viền ngoài cùng chìm)*.
- **Mức yêu cầu:** Nên đạt `≥ 3,0:1` cho viền nút hoạt động (`#btnDownloadPostcardPng`), và tăng độ rõ nhẹ cho nút bị vô hiệu hóa trên nền tối.
- **Ảnh chụp:** [13-settings-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/13-settings-1920x1080-vi-dark.png) · [10a-book-cover-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/10a-book-cover-1920x1080-vi-dark.png) · [11-postcard-1920x1080-vi-dark.png](../../verification/audit-06/dark-theme/11-postcard-1920x1080-vi-dark.png).
- **Đề xuất sửa:** Nâng `--settings-line` ở `settings-panel-5.css:137` lên `#76876f`; đặt `.gvb-btn:disabled` ở theme tối `opacity: .52`; đổi `border-color` của `#btnDownloadPostcardPng` ở theme tối sang `#d8b77c` (`~5,9:1` trên `#203d35`).

---

## 3. Các khu vực đạt chuẩn tốt & cảnh báo giả đã loại trừ sau đối chiếu ảnh

### 3.1. Khu vực đạt chuẩn tốt trong theme tối (`đã đo` & `đã tái hiện`)
- **Nhãn địa danh trên bản đồ canvas:** kiểm tự động 20 nhãn (`1920×1080`), toàn bộ dùng chữ sáng `#FFF6DE` kèm viền halo đậm `rgba(17, 49, 40, 0.94)` — rất sắc nét trên nền địa hình tối (`03-map-overview`, `19a`, `19b`).
- **Mốc 3 lá (`16-milestone-3cards`) & Modal đặt lại (`17-reset-modal`):** 0 lỗi tương phản, chữ, viền nút và vòng focus đều rõ ràng.
- **Bưu điện biển đảo (`14a`, `14b`, `14d`, `14e`):** đồng bộ hoàn toàn với theme tối, phong thư, bảng tùy chọn, ô ghi chú, sổ thư và nút đóng dấu đều đạt chuẩn.
- **Thanh tuyến đi (`19a-route-preview`), Tooltip ghim ga (`19b-banner-tooltip`, `#arrivalPinTip`) và Toast chuyển lượt (`#turnHandoffToast`):** `#arrivalPinTip` dùng `#f6edcf` trên `#26362e` (`~10,5:1`) viền `#a48d5b`; `#turnHandoffToast` thừa kế chuẩn `var(--paper-elevated)` / `var(--ink-primary)` / `var(--wood-border-strong)`.
- **Sự nhất quán VI / EN và `1920×1080` / `1366×768`:** bộ lỗi cốt lõi trùng khớp giữa VI và EN (không phát sinh lỗi riêng do tiếng Anh); khác biệt duy nhất ở `1366×768` là sự xuất hiện của hai viền nút trong `#answerExplanationBox` đã ghi vào **T-14**.

### 3.2. Các cảnh báo giả từ công cụ đo DOM đã loại trừ nhờ soi ảnh trực tiếp
- **Nút đang chọn trong bộ chuyển ngôn ngữ (`.gv-lang-toggle button.is-active`):** công cụ đo báo `1,03:1` (`#1c3a2f` trên `#20372e`) vì nền vàng sáng nằm trên lớp giả `.gv-lang-toggle::before` (`#eedcaa → #d7c18c`). Trên ảnh chụp (`03`, `06`, `10a`, `11`, `15`), chữ `VI` tối nằm trên thẻ vàng sáng đạt `~9,5:1`, đọc rất rõ.
- **Các nút có nền `linear-gradient`:** `#btnQuickStartWelcome`, `#btnRevealAnswer`, `.canva-open`, `#btnFlipToBack`, `#ritualDrawButton` trả về `backgroundColor: transparent` khi đo DOM nhưng thực tế hiển thị rõ ràng trên nền vàng/đỏ gradient.
- **Thanh trượt `<input type="range">` (`input.gvb-page-range`, `#homeMusicVolume`):** Chromium trả về `background-color: #ffffff` ở computed style nhưng trên ảnh chụp `10b` và `01b` rãnh trượt hiển thị màu tối/đỏ sẫm đúng theo `accent-color`.
- **Mặt giấy in có chủ đích (`#cardBackState`, trang/bìa sách trong trình đọc sách):** mặt gắn kết `#cardBackState` cố tình giữ giấy kem in (`card-table-5.css:195`) và đổi lại `--son-red: #9e2835` cho riêng lá bài đó; do đó vòng focus `#9e2835` nằm trên nền kem `#f4e4bb–#fdf6e0` thực tế đạt **`5,93–6,92:1`** (không phải `2,09:1` khi công cụ so với nền modal `#152720`).

---

## 4. Bảng tổng hợp số lỗi theo mức độ

| Mức độ | Số mục | Danh sách mã mục |
| --- | ---: | --- |
| **Cao** | **6** | `T-01`, `T-02`, `T-03`, `T-04`, `T-05`, `T-06` |
| **Trung bình** | **8** | `T-07`, `T-08`, `T-09`, `T-10`, `T-11`, `T-12`, `T-13`, `T-14` |
| **Thấp** | **3** | `T-15`, `T-16`, `T-17` |
| **Tổng cộng** | **17** | `T-01` – `T-17` |

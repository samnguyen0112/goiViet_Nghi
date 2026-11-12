# Báo cáo P5-03 — Song ngữ toàn website

- **Theo** [plan.md](plan.md) mục P5-03, chia 3 lát: khung song ngữ, tệp dùng chung, nội dung EN.
- **Bằng chứng** `verification/p5-books/` (bị `.gitignore` bỏ qua): `p5-03-slice1/` (ảnh, `overflow.json`), `regress-p5-03s1.log`, `p5-03-scan-en.json`, `gd6-functional-p5-03s1.json`; lát 2: `p5-03-slice2/`, `gd6-functional-p5-03s2.json`; lát 3: `p5-03-slice3/`, `gd6-functional-p5-03s3.json`, `vi-content-fixes.json`, `content-en/units.json`.

## Lát 1 — Khung song ngữ (11/11/2026)

**Trạng thái:** xong, **chưa commit**, nhánh `p5-02`. `node tools/check-i18n-5.cjs --walk` **PASS**.

### 1. Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Nút VI/EN công khai | Ở trang chủ (cạnh Bỏ qua mở đầu, Âm thanh) và header bản đồ (cạnh Tùy chọn). Đổi tại chỗ, nhớ lựa chọn; `?lang=en` vẫn dùng được. |
| `html lang`, tiêu đề trang | Đổi theo ngôn ngữ. Sửa luôn tiêu đề ghi nhầm "Preview 3 WebGL". |
| Markup tĩnh | 191 phần tử, 207 khóa `data-i18n` (cả `aria-label`, `title`, `placeholder`, `alt`). Chữ tiếng Việt vẫn nằm nguyên trong HTML. |
| Chuỗi JS | 73 chỗ trong script chính, cùng `fortune-ritual-5.js`, `journey-system-5.js`, `conversation-cards-5.js`, chuyển sang `t()`. Tổng 191 khóa dùng trong code, đủ VI và EN. |
| Nhãn đi kèm dữ liệu | 4 chủ đề thẻ, 8 loại hoạt động, 6 quân cờ: dữ liệu giữ tiếng Việt, bản EN tra theo bảng. Không sửa dữ liệu gốc. |
| Đổi ngôn ngữ giữ trạng thái | Lá bài đang dở (mặt, ấn sen, lời giải, nháp), lượt, hành trình, bưu thiếp: chỉ đổi chữ. Lời mời đọc sách trên lá bài và nội dung bưu thiếp được vẽ lại tại chỗ. |
| Tìm kiếm | Nhận tên gõ liền (`hanoi`, `danang`, `halong`) và tên tiếng Anh (Saigon, HCMC, Paracel, Spratly). |
| Công cụ `tools/check-i18n-5.cjs` | Kiểm tĩnh khóa VI/EN; `--walk` mở trang từ đĩa với `?lang=en`, đi qua 18 trạng thái, phân loại chữ tiếng Việt còn sót theo nguồn, và kiểm vòng VI → EN → VI. |

**Chữ tiếng Việt còn hiện trên lượt quét tiếng Anh:** từ 284 chuỗi (9.021 ký tự) xuống 110 chuỗi (4.046 ký tự). Phần của lát 1 **không còn chuỗi nào**. Phần còn lại:

| Loại | Số chuỗi | Thuộc |
| --- | --- | --- |
| Tệp dùng chung (13 tệp: `map-reference-ui.js`, `postcard-design-3.js`, `heritage-command-bar-3.js`, `map-controls-island-reference.js`, ghi chú nguồn bản đồ, …) | 37 | Lát 2 |
| Nội dung thẻ, mô tả ga, thơ, sách | 29 | Lát 3 (sách: P5-04) |
| Tên địa lý trên bản đồ (LÀO, THÁI LAN, QUẦN ĐẢO HOÀNG SA, Đảo Phú Quốc…) | 9 | Bảng tên riêng, chờ mục 7 "Điểm cần chốt" |

### 2. Cách làm

- **`i18n-ui-5.js` (mới):** từ điển giao diện và bộ gắn nhãn.
  - `data-i18n="k1|k2"` gắn với các nút chữ trực tiếp của phần tử theo thứ tự, nên không phải bọc thêm thẻ.
  - Bản VI đọc từ chính trang; nếu đoạn mã khác đã tự đổi chữ của một nút, bộ gắn nhãn để yên nút đó.
  - Đồng bộ `lang`, tiêu đề trang và nút VI/EN.
- **Thứ tự nạp:** `i18n-5.js` không còn `defer` trong `<head>`. Nó cùng `i18n-ui-5.js` nạp ngay trước script chính, để script chính dùng `t()` từ lúc khởi động. `?lang=en` vì vậy không lóe tiếng Việt.
- **Trong script chính:**
  - Thêm `uiT()`, `uiLabel()`, `activityKindLabel()`, `pawnText()`.
  - `relabelInterface()` và `refreshDeckLabels()` chạy khi đổi ngôn ngữ và khi mở trang bằng tiếng Anh.
  - Tách `renderCardBookInvite()` và `renderPostcardContent()` để vẽ lại được mà không mở lại hộp thoại.
  - Thêm `statusKey` vào dấu kỷ niệm, giữ nguyên `status` tiếng Việt vì `postcard-design-3.js` vẫn đọc trường này.
- **`fortune-ritual-5.js`, `journey-system-5.js`:** sinh lại bằng `make-fortune-ritual-5.cjs`, `make-journey-system-5.cjs`. Tệp gốc dùng chung không đổi.
- **Các hộp thoại** (bộ thẻ, sách, ống xăm, bưu thiếp) khóa header khi mở, nên chỉ đổi được ngôn ngữ khi không có hộp thoại nào mở. Lá bài dở dang vẫn giữ nguyên và được đổi chữ ở lần mở tiếp.

### 3. Kiểm thử

| Bộ kiểm | Kết quả |
| --- | --- |
| `tools/check-i18n-5.cjs --walk` | PASS: 229 khóa markup đủ EN, 191 khóa code đủ VI/EN; VI → EN → VI không đổi trang (có lá bài dở); không còn chuỗi VI của phần lát 1; 0 lỗi trang |
| Vòng VI → EN → VI ở trang chủ | 318/318 nút chữ và mọi thuộc tính giữ nguyên |
| `verify-p5-02.cjs` | 43/43 |
| `verify-p5-01.cjs` | 20/20 |
| `tools/check-station-panel-5.cjs` | PASS |
| `tools/verify-preview5-conversation-cards.cjs` | PASS |
| `tools/check-books-5.cjs --render` | 0 lỗi |
| `check-file-url.cjs` (mở thẳng tệp) | Đạt |
| Ca chức năng GĐ6 (mốc P5-00 so với hiện tại) | 13 khác biệt, **trùng khớp từng dòng** với trước lát 1 (do khung ga mới của Codex): giao diện tiếng Việt không đổi |
| Ảnh tiếng Anh 1920×1080 và 1366×768 (trang chủ, bản đồ, cài đặt, bộ thẻ, hai mặt lá, ống xăm, bưu thiếp) | Không nút nào tràn chữ; nút VI/EN vừa header ở 1366 |

### 4. Thay đổi nhỏ kèm theo

- Sổ hành trình và bưu thiếp còn câu cũ của trước P5-02 ("Mở một câu chuyện để lưu ga đầu tiên."). Đổi thành "Chơi thẻ hoặc đọc sách để lưu ga đầu tiên.".
- Tải trang: `i18n-ui-5.js` 14,5 KB gzip nạp chặn trước script chính, CSS 0,7 KB, HTML thêm 3,3 KB gzip.

### 5. Còn lại

- **Lát 2:**
  - Nhãn lượt ở header: `heritage-command-bar-3.js` chỉ tô kiểu khi chuỗi bắt đầu bằng "Lượt:", nên ở tiếng Anh nhãn hiện thành dòng chữ thường.
  - "Rút vé ngẫu nhiên" và "Bưu Thiếp" do `map-reference-ui.js` ghi đè.
  - Chú giải, ghi chú nguồn bản đồ.
  - Chữ trên ảnh PNG bưu thiếp.
  - "▾ Mở / ▴ Thu gọn" (CSS `content:`).
  - Câu dưới nút "Tap to begin" ở trang chủ.
- **Lát 3 và các quyết định:** tên địa danh, vùng, danh thắng (mục 7); thơ lục bát (mục 8); nội dung 144 thẻ và 60 hoạt động; sửa lỗi nội dung tiếng Việt trước khi dịch (mục 9).
- Hộp ống xăm cũ trong HTML (`shakeBambooCylinder`) đã bị `fortune-ritual-5.js` thay hẳn, không còn hiện, nên không dịch.
- Bản tiếng Anh của chữ giao diện do Code soạn; nhóm nên đọc duyệt một lượt.

## Lát 2 — Tệp dùng chung (11/11/2026)

**Trạng thái:** xong, **chưa commit** (cùng lát 1). `node tools/check-i18n-5.cjs --walk` **PASS**, phần tệp dùng chung còn **0 chuỗi** tiếng Việt.

### 1. Kết quả

- **18 bản `-5`** sinh bằng `make-shared-i18n-5.cjs` (mỗi chỗ đổi phải khớp đúng một lần). Preview-5 trỏ sang các bản này; `index.html`, preview 1–4 và các tệp gốc **không đổi**.

| Bản `-5` | Phần giao diện |
| --- | --- |
| `map-reference-ui-5.js`, `map-surroundings-preview/heritage-command-bar-5.js` | Nút header (Draw a random ticket, Postcard, Options, Next turn). Nhãn lượt nhận cả "Lượt:" lẫn "Turn:", nên tiếng Anh cũng được tô kiểu như tiếng Việt. |
| `map-controls-island-reference-5.js`, `heritage-overlays-5.js` | Chú giải; menu Tùy chọn, nguồn bản đồ, "Source and licence details". |
| `homepage-opening-controller-5.js`, `homepage-layered-opening-5.js`, `homepage-music-5.js`, `map-surroundings-preview/memory-reference-5.js`, `map-surroundings-preview/home-station-feedback-5.js` | Trang chủ: câu dưới nút bắt đầu, trạng thái cho trình đọc màn hình, bảng nhạc, 9 lời gợi ký ức, ga đã chọn. |
| `postcard-design-5.js` | Chữ trên ảnh PNG bưu thiếp; ngày ghi theo ngôn ngữ. |
| `map-surroundings-preview/province-legibility-5.js` | Đo nhãn kỷ niệm "(Memory)" đúng như chữ vẽ, để tránh chồng nhãn. |
| `natural/archipelago-renderer-5.js`, `natural/landscape-5.js`, `natural/island-chart-5.js` | Nút Zoom ở quần đảo; khung "Explore the islands" (nút, chú giải, danh mục, tìm kiếm); tọa độ °N/°E. |
| `natural/hydrology-5.js`, `natural/terrain-renderer-5.js`, `map-surroundings-preview/preview-5.js`, `map-surroundings-preview/polish-5.js` | Ghi chú nguồn dữ liệu bản đồ, tùy chọn sóng, hướng dẫn bàn phím của bản đồ, nhãn nút di động. |

- **CSS `content:`** ("▾ Mở", "▴ Thu gọn", "Điểm đến · "): ghi đè bằng `html[lang="en"]` trong `i18n-ui-5.css`, không tách tệp CSS dùng chung.
- **Chữ "B" trên la bàn** và trên khung quần đảo thành "N".

### 2. Lỗi tìm ra và đã sửa

1. **Lát 1 làm sai trạng thái nút bật/tắt ở tiếng Anh.** `heritage-overlays-3.js` đọc trạng thái Âm thanh và Giảm chuyển động bằng cách dò chữ "Bật" trong nhãn. Bản `-5` đọc thẳng từ `state`.
2. **Bộ gắn nhãn của lát 1 bỏ dịch khi script khác cắt ký hiệu đầu chữ** (ví dụ "⌖ " trước "Về giữa"), nên đổi ngôn ngữ lúc đang chạy bị sót. Nay bộ gắn nhãn so phần chữ chính và giữ ký hiệu đầu mà script khác đặt. `i18n-5.js` có thêm `get(lang, key)`.
3. **Bảng nhạc trả về "No music chosen" khi đổi lại VI:** chữ dự phòng phải là chữ tiếng Việt, không phải chữ đang hiện.
4. **Ảnh PNG còn câu cũ** "Mở câu chuyện và cùng trải nghiệm…". Đổi thành "Chơi thẻ hoặc đọc sách để lưu dấu hành trình." theo P5-02.
5. **Câu đếm sai số nhiều** ("1 memory stamps"). Đổi sang dạng "Memory stamps: 1", "Players: 3".

### 3. Kiểm thử

| Bộ kiểm | Kết quả |
| --- | --- |
| `tools/check-i18n-5.cjs --walk` | PASS. Đi qua 23 trạng thái (thêm bảng nhạc, chương lời gợi, nguồn bản đồ, khung quần đảo) và một lượt đổi VI → EN khi trang đang chạy. Vòng VI → EN → VI giữ nguyên trang. Không còn chuỗi VI của preview-5 hay tệp dùng chung. 0 lỗi trang |
| `verify-p5-02.cjs` | 43/43 (chạy lại sau lần sửa cuối) |
| `verify-p5-01.cjs` | 20/20 |
| `tools/check-station-panel-5.cjs` | PASS (chạy lại sau lần sửa cuối) |
| `tools/verify-preview5-conversation-cards.cjs` | PASS |
| `tools/check-books-5.cjs --render`, `check-file-url.cjs` | Đạt |
| Ca chức năng GĐ6 | 13 khác biệt, trùng khớp với trước P5-03: giao diện tiếng Việt không đổi |
| Ảnh tiếng Anh 1920 và 1366, ảnh PNG VI/EN | `verification/p5-books/p5-03-slice2/`. Header, chú giải, Tùy chọn, khung quần đảo, bưu thiếp hiển thị gọn |

- **Công cụ kiểm tra** nay còn nhận khóa gắn bằng `dataset.i18n` trong JS và khóa `T(key, chữ VI dự phòng)`. Regex nhận diện chữ Việt giới hạn đúng bộ chữ (trước đó dải `À-Ỹ` bắt nhầm cả `×`).
- **Tải trang:** không thêm lượt tải; `i18n-ui-5.js` lên 18 KB gzip.

### 4. Còn lại sau lát 2

- **Lát 3 (29 chuỗi trên lượt quét):** nội dung thẻ, mô tả ga, thơ, sách.
- **Tên địa lý trên bản đồ (26 chuỗi, chờ mục 7):** LÀO, THÁI LAN, BIỂN ĐÔNG, QUẦN ĐẢO HOÀNG SA, tên đảo và bãi, nhãn "Đất nổi ·" của đất chưa có tên.
- **Không dịch:** `landmark-assets.js` (title của tranh SVG, là tên riêng), `journey-network-data.js` (tên ga), và các tệp chỉ có log hoặc thông báo lỗi nội bộ.

## Lát 3 — Nội dung tiếng Anh (11/11/2026)

**Trạng thái:** **chưa commit** (cùng lát 1–2). Đã qua một vòng sửa sau khi người dùng và Codex duyệt (mục 7): lỗi bố cục do chữ tiếng Anh, sách đổi giao diện khi sang tiếng Anh, đổi ngôn ngữ trong hộp thoại, khóa bản dịch lỗi thời, dữ kiện. `node tools/check-i18n-5.cjs --walk` **PASS**: nội dung ga và thẻ không còn chuỗi tiếng Việt chưa dịch, tên địa lý không còn từ loại tiếng Việt.

**Quyết định của nhóm (11/11):**
- Tên địa danh giữ dấu. Bỏ "Tỉnh", "Thành phố"; riêng TP. HCM là "Hồ Chí Minh City". Quần đảo ghi "Hoàng Sa (Paracel) Islands", "Trường Sa (Spratly) Islands".
- Thơ lục bát giữ tiếng Việt, kèm một dòng giải nghĩa tiếng Anh.
- Lỗi nội dung tiếng Việt: Code sửa luôn, nhóm duyệt sau (mục 3).

### 1. Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| 36 ga | Tên, tên ngắn, vùng, câu giới thiệu, tên ảnh, 3 điểm nhấn |
| 144 thẻ | Câu hỏi, 3 lựa chọn, lời giải, hoạt động. Giữ nguyên thứ tự lựa chọn và chỉ số đáp án. 12 thẻ đã thẩm định (Hà Nội, Huế, TP. HCM) và 8 thẻ quần đảo dịch riêng từng thẻ. 124 thẻ còn lại dịch theo mẫu: 4 mẫu câu hỏi, 5 mẫu lời giải, 91 đáp án, 25 lựa chọn sai, 21 chủ ngữ có chú thích, 13 chú thích |
| 60 hoạt động | Dịch cả nhãn đầu câu: 【Quan sát】 → 【Observation】 |
| Chủ đề mới "Danh thắng" | Nhãn tiếng Anh "Landmarks"; biểu tượng 🏛️ |
| Thơ | Câu thơ vẫn là tiếng Việt, ở mọi ngôn ngữ. Ở tiếng Anh có thêm một dòng nghiêng giải nghĩa: 5 bài riêng (Hà Nội, Huế, TP. HCM, Hoàng Sa, Trường Sa), bài chung theo mẫu cho các ga khác. Dòng này hiện trên vé ống xăm và băng chữ khi tàu tới ga |
| Tên địa lý trên bản đồ | LAOS, CAMBODIA, THAILAND, BIỂN ĐÔNG (EAST SEA), HOÀNG SA (PARACEL) ISLANDS. Tên đảo giữ nguyên, chỉ dịch từ loại: "Đảo Phú Quốc" → "Phú Quốc Island", "Cồn Bắc Sa" → "Bắc Sa Cay", "Đá Bắc" → "Bắc Reef", "Đất nổi ·" → "Land ·". Tên viết với Hòn, Cù Lao giữ nguyên |
| Tìm kiếm | Vẫn tìm được bằng tên, vùng, điểm nhấn tiếng Việt khi đang ở tiếng Anh |

### 2. Cách làm

- **Nguồn bản dịch** `tools/content-en-5/tables.cjs` (theo dõi trong git, để nhóm sửa). `node tools/build-content-en-5.cjs` dựng `assets/goi-viet/map-surroundings-preview/content-en-5.js`.
  - Công cụ dừng và liệt kê nếu còn câu tiếng Việt chưa có bản dịch.
  - Nó cũng dừng nếu đáp án và chủ ngữ của lời giải lệch nhau sau khi bỏ ngoặc.
- **Khóa là chính câu tiếng Việt**, không phải mã thẻ như plan dự kiến. Sau này nhóm sửa một câu tiếng Việt mà chưa dịch lại, thẻ đó hiện tiếng Việt và công cụ kiểm tra báo, chứ không hiện bản tiếng Anh cũ đã sai nghĩa.
- **Dữ liệu gốc giữ tiếng Việt.** `content-en-5.js` nhớ bản gốc của từng trường và chỉ đổi trường hiển thị khi đổi ngôn ngữ. Nó được đăng ký trước các trình nghe khác, nên các phần vẽ lại đều đọc bản đã đổi. `contentVi()` trả bản tiếng Việt cho các chỗ cần:
  - thơ (luôn ghép từ tên và điểm nhấn tiếng Việt);
  - tìm kiếm;
  - so tên ở sổ kỷ niệm;
  - quy tắc "không lặp hoạt động" (ghi theo câu tiếng Việt, nên đổi ngôn ngữ giữa chừng không làm lặp).
- **Dấu kỷ niệm** nhớ thêm mã thẻ và số hoạt động. Khi đổi ngôn ngữ, tên ga và câu hoạt động trên bưu thiếp và ảnh PNG đổi theo.
- **Lá bài đang mở** (câu hỏi, lựa chọn, lời giải, hoạt động) được viết lại tại chỗ khi đổi ngôn ngữ.
- **Tên địa lý:** `GoiVietContent.geo()` dịch tên khi vẽ.
  - Chỗ dùng: nhãn nước, biển và quần đảo trong `preview-5.js`; danh mục, nhãn và ô chọn đảo trong `island-chart-5.js`, `landscape-5.js`; nhãn đảo của bản đồ chính.
  - Ba tệp `-5` sinh lại bằng `make-shared-i18n-5.cjs`; 15 tệp `-5` còn lại không đổi byte nào.
- **`fortune-ritual-5.js`** sinh lại bằng `make-fortune-ritual-5.cjs`, có thêm dòng giải nghĩa dưới câu thơ.
- **Tải trang:** `content-en-5.js` 163 KB, 34 KB gzip, nạp chặn ngay sau `i18n-ui-5.js`. Phải nạp trước script chính, để `?lang=en` hiện tên ga tiếng Anh ngay từ khung hình đầu.

### 3. Sửa nội dung tiếng Việt (nhóm cần duyệt)

Nhật ký từng thay đổi (trước/sau): `verification/p5-books/vi-content-fixes.json`, 405 mục, 4 lượt. Script: `fix-vi-content-5.cjs`, `-5b`, `-5c`, `-5d`.

| Lượt | Sửa gì | Số chỗ |
| --- | --- | --- |
| 1 | 31 câu "địa danh thắng cảnh hoặc di tích" gắn nhầm chủ đề "Lễ hội" → chủ đề mới "Danh thắng" | 31 |
| 1 | Tên đầy đủ viết hoa giữa câu ("vùng đất Tỉnh Thanh Hóa") → "vùng đất Thanh Hóa", "tại tỉnh Thanh Hóa" (câu hỏi và lời giải) | 254 |
| 1 | Câu di sản của Thanh Hóa và Hải Phòng lấy đáp án là một danh thắng → di sản phi vật thể: **Trò Xuân Phả**, **Lễ hội chọi trâu Đồ Sơn** (đáp án, lời giải, điểm nhấn của ga) | 6 |
| 2 | Đáp án bị cắt cụt hoặc ghép nhầm ngoặc của mục khác ("Khu di tích Quốc gia Đặc (Thực hành Then của người)") → dựng lại từ chủ ngữ của lời giải | 62 |
| 2 | Câu nghề truyền thống: một lựa chọn sai gần như trùng đáp án đúng → thay bằng lựa chọn sai rõ ràng ("Dùng máy móc công nghiệp…") | 16 |
| 2 | Hoàng Sa, Trường Sa: chủ đề (8), lựa chọn sai không cùng loại và đáp án bị cắt ("Cột mốc chủ quyền Đảo Trường") (19), lời giải (3) | 30 |
| 2 | Tây Ninh: "Trảng." → "Trảng Bàng." | 2 |
| 3 | Vĩnh Long, Cần Thơ: danh sách dân tộc ghi "Khmer" hai lần | 2 |
| 4 | Trường Sa: bỏ "Hệ thống Nhà giàn DK1" khỏi danh sách đảo (DK1 không thuộc quần đảo, mục 7.5) | 2 |

**Nhóm cần kiểm lại sự thật:**
1. **Trò Xuân Phả** (Thanh Hóa) và **Lễ hội chọi trâu Đồ Sơn** (Hải Phòng) là di sản văn hóa phi vật thể quốc gia: đã đối chiếu ở vòng duyệt (mục 7.4), nhóm chỉ cần xác nhận lại bằng văn bản gốc.
2. **Câu di sản của nhiều tỉnh vẫn lấy đáp án là di tích hoặc danh thắng**, theo đúng lời giải gốc (Tân Trào, ATK Định Hóa, Phố Hiến, Nhà tù Sơn La, Ngũ Hành Sơn…). Ngoặc bị ghép nhầm trước đó gợi ý dữ liệu nguồn từng có di sản phi vật thể (Then, Gầu Tào, Múa Tắc Xình, Hát Xoan, Xòe Thái, Mộc bản Trường Lưu). Code không đoán thay, nhóm nên chọn lại.
3. **Lựa chọn sai mới ở hai quần đảo** (Côn Đảo…, Phú Quốc…, Cột cờ Lũng Cú, Mũi Cà Mau, lá dong, lá chuối) và câu "Trực thuộc …".

### 4. Lỗi tìm ra khi làm lát 3 và đã sửa

1. **Bưu thiếp ghi "Ga #1: Huế" ở tiếng Anh.** Chữ không dấu nên công cụ kiểm tra không thấy; nay có khóa riêng ("Stop 1: Huế").
2. **Đổi ngôn ngữ giữa phiên:** tem cũ vẫn giữ tên ga, câu hoạt động và tên người chơi của lúc chơi. Nay tem nhớ mã thẻ, số hoạt động, số người chơi và được viết lại khi đổi ngôn ngữ.

### 5. Kiểm thử

| Bộ kiểm | Kết quả |
| --- | --- |
| `node tools/build-content-en-5.cjs` | 704 câu tiếng Anh cho 36 ga và 144 thẻ; không thiếu câu nào, không có mục thừa trong bảng |
| `tools/check-i18n-5.cjs --walk` | **PASS**. Nội dung ga và thẻ: 0 chuỗi chưa dịch. Tên địa lý: 0 từ loại tiếng Việt. Vòng VI → EN → VI giữ nguyên trang (có lá bài dở). 0 lỗi trang. Còn 2 dòng thơ tiếng Việt (giữ theo quyết định) và 10 chuỗi trong sách (P5-04) |
| `verify-p5-02.cjs` | 43/43 (chạy lại sau lần sửa cuối) |
| `verify-p5-01.cjs` | 20/20 |
| `tools/check-station-panel-5.cjs` | PASS (chạy lại sau lần sửa cuối) |
| `tools/verify-preview5-conversation-cards.cjs` | PASS (chạy lại sau lần sửa cuối) |
| `tools/check-books-5.cjs --render`, `check-file-url.cjs` | 0 lỗi; mở thẳng tệp như trước |
| Ca chức năng GĐ6 (mốc P5-00 so với hiện tại) | 13 khác biệt, **trùng khớp từng dòng** với lát 2: giao diện tiếng Việt không đổi |
| Ảnh tiếng Anh 1920 và 1366 (`verification/p5-books/p5-03-slice3/`) | Bản đồ (LAOS, BIỂN ĐÔNG (EAST SEA), HOÀNG SA (PARACEL) ISLANDS hai dòng), khung ga Thanh Hóa, hai mặt lá bài mẫu và một lá Hà Nội, vé ống xăm có dòng giải nghĩa, bản đồ đảo Hoàng Sa, bưu thiếp sau khi chơi một lượt bằng tiếng Việt rồi đổi sang tiếng Anh. Không tràn chữ, 0 lỗi trang |
| `index.html`, preview 1–4, tệp gốc dùng chung | Không đổi (`git status`: chỉ tệp của preview-5, báo cáo, plan và công cụ mới) |

### 6. Còn lại

- **Nhóm đọc duyệt bản tiếng Anh**, nhất là 12 thẻ đã thẩm định và 5 dòng giải nghĩa thơ. Sửa trong `tools/content-en-5/tables.cjs` rồi chạy `node tools/build-content-en-5.cjs`.
- **Sách (P5-04):** chữ trong sách Hà Nội (tên sách, "Chương 01…", "Mở đầu", "Lời kết") vẫn tiếng Việt; tiếng Anh đi kèm từng cuốn.
- **Không dịch:** câu chuyện (`stories`) và ảnh (`photos`) trong dữ liệu ga. Preview-5 không còn mở hộp câu chuyện, cũng không hiện danh sách ảnh này.

### 7. Vòng sửa sau duyệt (11/11)

Người dùng gửi 4 ảnh chụp lỗi; Codex nêu thêm 4 điểm. Mỗi lỗi được tái hiện trước khi sửa.

#### 7.1. Lỗi bố cục do chữ tiếng Anh

Công cụ mới `verification/p5-books/scripts/scan-layout-en-5.cjs` đi qua 30 màn hình, gồm:
- trang chủ, 12 khung cuộn của chương ký ức, bản đồ, chú giải, ba khung ga, Tùy chọn, sổ hành trình;
- tới ga, bộ thẻ, hai mặt lá bài, gợi ý, ghi kỷ niệm;
- ống xăm và vé, bưu thiếp, sách, trang Sắp có, bản đồ đảo.

Mỗi màn hình được chạy bằng cả tiếng Việt lẫn tiếng Anh, ở 5 cỡ: 1326×820, 1366×768, 1280×720, 1536×864, 1920×1080. Công cụ chỉ liệt kê lỗi **chỉ có ở tiếng Anh**: chữ bị cắt, bị che, chồng lên chữ khác, hay tràn khỏi cửa sổ. Bản tiếng Việt là mốc so sánh.

| Lỗi (ảnh) | Nguyên nhân | Sửa |
| --- | --- | --- |
| Ảnh 1: tiêu đề chương ký ức chui dưới tranh cổng làng, câu dẫn đè lên số "01" | "Some things / need only a hint to be remembered." xuống thành 3 dòng, trong khi bố cục đặt chỗ cho 2 dòng như "Có những điều / chỉ cần gợi, là nhớ." | Chữ mới đúng 2 dòng: "Some memories / need **only a hint.**" |
| Ảnh 2: số "0 / 3" của bộ đếm tem chui dưới nút đỏ | Cụm nút bên phải rộng hơn bản tiếng Việt 21 px ("Draw a random ticket"), còn dải lượt chơi không tự co lại | "Random ticket", "Stamps: 0 / 3": cụm nút hẹp hơn bản tiếng Việt |

Sau khi sửa, ở cả 5 cỡ, công cụ chỉ còn báo một loại: menu Tùy chọn đang mở đè lên khung ga. Đây là menu thả xuống nên đè là đúng. Có hai lỗi đã có từ trước, ở cả tiếng Việt, nằm ngoài phạm vi này:
- ở 1280×720, bộ đếm tem tiếng Việt vốn chạm mép nút đỏ;
- trong bộ thẻ xòe, các lá chồng lên nhau theo thiết kế.

Công cụ có chế độ tự thử `--old-en`: nạp lại chữ tiếng Anh cũ. Ở chế độ này nó bắt lại đúng hai lỗi trong ảnh 1 và 2, gồm 32 mục ở 1326×820. Chế độ này có vì công cụ từng bị "mù": một lớp che chuyển cảnh trong suốt phủ kín màn hình đã chặn mọi phép thử chạm. Nay công cụ chỉ tính phần tử thật sự được vẽ.

#### 7.2. Sách đổi giao diện khi sang tiếng Anh (ảnh 3, 4)

- **Nguyên nhân:** trình đọc chọn bản minh họa theo ngôn ngữ. Sách Hà Nội chỉ có bản minh họa tiếng Việt (`edition-vi`), nên sang tiếng Anh nó lùi về khung trang chữ dựng sẵn. Đó vẫn là chữ tiếng Việt, kèm dòng "English version in progress", mà mất cả dàn trang.
- **Sửa (`book-reader-5.js`):** trình đọc giữ bản minh họa tiếng Việt cho tới khi **mọi** trang có chữ đều có tiếng Anh. Sách Hà Nội hiện chỉ có một chú thích tiếng Anh ở trang cuối.
- **Thanh trên cùng** có thêm nhãn "Vietnamese edition".
- **Chữ của chính cuốn sách** dùng cùng ngôn ngữ với trang đang hiện: thanh chương, mục lục, chữ lớn. Thanh chương vì vậy không còn lẫn "Lời kết" với "Appendix".
- **Phần khung của trình đọc** (Contents, Large text, Back to map, Pages 3–4 of 26) vẫn theo tiếng Anh.

#### 7.3. Đổi VI/EN ngay trong sách, lá bài và bưu thiếp (Codex)

- **Trước đây:** hộp thoại khóa header nên không đổi được ngôn ngữ.
- **Nay:** mỗi hộp thoại có nút VI/EN riêng, cùng cơ chế `data-set-lang` với nút trên header:
  - bộ thẻ: cạnh "Còn n lá";
  - bưu thiếp: cạnh "← Bản đồ";
  - sách: trên thanh của trình đọc.
- **Đổi ngôn ngữ giữa chừng**, các phần sau được viết lại theo ngôn ngữ mới:
  - **Gợi ý của người nhà:** dựng lại từ một hàm duy nhất.
  - **Lời báo khi lưu kỷ niệm** (đã lưu, đã nối ga, cần nhập địa danh, chọn ga gần đúng, …): nhớ khóa của mình (`setLiveText`).
  - **Tên người chơi và ghi chú mặc định của kỷ niệm:** nhớ số người chơi.
- **Kiểm bằng thao tác bấm thật:** `verification/p5-books/scripts/verify-dialog-lang-5.cjs` đạt **17/17**:
  - **Lá bài:** giữ nguyên lá, đáp án đã chọn, phương án bị gạch, ấn sen, lời giải, hoạt động, ghi chú đang gõ và kỷ niệm đã lưu (lưu đúng một lần). Câu hỏi, lựa chọn, gợi ý và lời báo đổi ngôn ngữ.
  - **Bưu thiếp:** giữ hộp thoại mở và giữ dấu chọn; ga, tem và tên người chơi đổi ngôn ngữ.
  - **Sách:** giữ đúng trang, đúng ảnh `edition-vi`; mục lục bằng tiếng Anh.
- **Riêng sách:** bảng mục lục và bảng chữ lớn phủ kín trình đọc, nên khi chúng đang mở thì không đổi được ngôn ngữ, giống cách hộp thoại che header. Đóng bảng là đổi được.

#### 7.4. Khóa bản dịch lỗi thời (Codex: `hn-c1` vẫn báo đạt dù dùng câu dịch cũ)

- **Nguyên nhân:** bản dịch tra theo đúng câu tiếng Việt, nên một thẻ dịch theo mẫu đổi câu là tự báo thiếu. Còn 20 thẻ dịch riêng, 5 bài thơ, bài thơ chung và tên ga lại được ghép **theo mã**. Câu tiếng Việt của chúng đổi nghĩa thì bản tiếng Anh cũ vẫn được ghép vào mà không báo gì.
- **Sửa:** `tools/content-en-5/sources.json` lưu câu tiếng Việt mà mỗi bản dịch theo mã được viết từ đó.
  - Khi câu tiếng Việt đổi, `node tools/build-content-en-5.cjs` dừng lại, nêu tên mục và in câu cũ, câu mới.
  - Người duyệt sửa bản tiếng Anh rồi chạy `--accept <mã>`.
  - `--check` còn báo khi `content-en-5.js` trên đĩa không khớp với bảng.
- **Kiểm:** `verification/p5-books/scripts/test-stale-en-5.cjs` chạy trên một bản sao của trang, đạt 5/5:
  - trang không đổi: đạt;
  - đổi câu hỏi `hn-c1`: dừng, nêu `hn-c1`;
  - đảo thứ tự lựa chọn `hn-c1`: dừng;
  - đổi thơ Huế: dừng, nêu `verse:hue`;
  - đổi một thẻ dịch theo mẫu: báo thiếu bản dịch.
- **Ví dụ thật:** lượt sửa tiếng Việt số 4 (dưới đây) bị khóa chặn ở `truong-sa-c2` cho tới khi bản tiếng Anh được sửa theo.

#### 7.5. Duyệt dữ kiện (Thanh Hóa, Hải Phòng, hai quần đảo)

| Mục | Kết quả | Nguồn |
| --- | --- | --- |
| Trò Xuân Phả là di sản văn hóa phi vật thể quốc gia | Đúng, vào danh mục tháng 9/2016 | [Đại biểu Nhân dân](https://daibieunhandan.vn/suc-song-truong-ton-cua-tro-dien-xuan-pha-10353638.html), [Nhân Dân](https://nhandan.vn/nghin-nam-tro-dien-xuan-pha-post849052.html) |
| Lễ hội chọi trâu Đồ Sơn là di sản văn hóa phi vật thể quốc gia | Đúng, theo Quyết định 5079/QĐ-BVHTTDL ngày 27/12/2012, đón nhận năm 2013 | [Nhân Dân](https://nhandan.vn/bao-ton-va-phat-huy-gia-tri-le-hoi-choi-trau-do-son-post828336.html), [Tuổi Trẻ](https://tuoitre.vn/hang-van-nguoi-doi-mua-du-hoi-choi-trau-do-son-568871.htm) |
| Bia chủ quyền Hoàng Sa 1816/1938 | Là **một** tấm bia dựng năm 1938 trên đảo Hoàng Sa (Pattle), khắc mốc 1816. Bản tiếng Anh đã sửa từ "steles of 1816 and 1938" thành "stele (1816 – 1938)" | [Tiền Phong](https://tienphong.vn/Phong-Su/560520/Hoang-Sa-cua-An-Nam-la-khong-tranh-cai-tpp.html), [Pattle Island](https://www.Wikipedia.org/wiki/Pattle_Island) |
| Nhà giàn DK1 trong danh sách đảo Trường Sa (`truong-sa-c2`) | **Sai:** DK1 nằm trên thềm lục địa phía Nam, không thuộc quần đảo Trường Sa. Đã bỏ khỏi đáp án và lời giải ở cả hai ngôn ngữ (lượt sửa tiếng Việt số 4, `fix-vi-content-5d.cjs`) | [Nhân Dân, 35 năm DK1](https://special.nhandan.vn/35-nam-DK1-bai-1/index.html) |
| Hoàng Sa thuộc TP. Đà Nẵng, Trường Sa thuộc tỉnh Khánh Hòa | Khớp | — |

**Còn để nhóm duyệt:**
- danh sách đảo Hoàng Sa: Bạch Quy và Tri Tôn thường được kể riêng, không thuộc nhóm Lưỡi Liềm;
- tên 8 cụm đảo Trường Sa;
- Lễ Khao lề thế lính Hoàng Sa: tổ chức ở Lý Sơn (Quảng Ngãi), được dùng làm điểm nhấn di sản của Hoàng Sa;
- các câu di sản lấy đáp án là di tích (mục 3).

#### 7.6. Kiểm thử sau vòng sửa

| Bộ kiểm | Kết quả |
| --- | --- |
| `scan-layout-en-5.cjs`, 5 cỡ × 30 màn hình | Không còn lỗi bố cục nào chỉ có ở tiếng Anh. Còn lại duy nhất: menu Tùy chọn đè lên khung ga, đúng thiết kế. Tự thử `--old-en` bắt lại đúng lỗi của ảnh 1 và 2 |
| `verify-dialog-lang-5.cjs` (bấm thật) | 17/17 |
| `node tools/build-content-en-5.cjs --check`, `test-stale-en-5.cjs` | Đạt; khóa bản dịch đạt 5/5 |
| `tools/check-i18n-5.cjs --walk` | PASS |
| `verify-p5-02.cjs` | 43/43 |
| `verify-p5-01.cjs` | 21/21. Ca D2 đổi theo hành vi mới: sách chưa có tiếng Anh giữ bản minh họa và có nhãn trên thanh. Thêm ca D3: sách không có bản minh họa vẫn đánh dấu trang chưa dịch ngay trên trang |
| `tools/check-station-panel-5.cjs`, `tools/verify-preview5-conversation-cards.cjs` | PASS |
| `tools/check-books-5.cjs --render`, `check-file-url.cjs` | 0 lỗi; mở thẳng tệp như trước |
| Ca chức năng GĐ6 | 13 khác biệt, trùng từng dòng với lát 2; 0 lỗi trang |

Ảnh: `verification/p5-books/p5-03-slice3/layout/` (VI và EN, mỗi cỡ, mỗi màn hình) và `dialog-lang/`.

**Tệp đổi thêm trong vòng này:**
- `assets/goi-viet/books-5/book-reader-5.js`: chỉ preview-5 dùng;
- `i18n-5.js`, `i18n-ui-5.js`, `i18n-ui-5.css`;
- `map-surroundings-preview-5.html`;
- bảng dịch và công cụ dựng: `tools/content-en-5/tables.cjs`, `tools/content-en-5/sources.json` (mới), `tools/build-content-en-5.cjs`;
- `content-en-5.js`.

`index.html`, preview 1–4 và tệp gốc dùng chung không đổi.

# Báo cáo P5-05 — Nghiệm thu gọn và bàn giao preview-5

- **Ngày** 12/11/2026 (Claude).
- **Bản nghiệm thu** `main` tại `b8fa4b4` (sau PR #5); không có thay đổi chưa commit lúc chạy. Lượt nghiệm thu không sửa mã website. Sau đó, theo yêu cầu, đã sửa ba phát hiện ở mục 7 (chỉ trong tệp của preview-5) và chạy lại toàn bộ bộ kiểm (mục 7.4).
- **Phạm vi** đúng mục P5-05 của [plan.md](plan.md). P5-04 (nhập truyện cho 4 tập) do thành viên nhóm làm và chưa giao, nên phần sách được kiểm trên tập Hà Nội nháp (`?sach=nhap`) và ba tập giữ chỗ. Khi nhóm giao nội dung, chạy lại các ca sách ở mục 9.
- **Môi trường** Windows 11, Chrome 157, GPU Intel Arc (thật), CPU ×1. Số đo chỉ so được trong cùng phiên: hôm nay máy chậm hơn ngày đo mốc 09/11 khoảng 0,3 giây ở bước vào bản đồ, ở cả hai bên.
- **Bằng chứng** `verification/p5-books/p5-05/` (thư mục bị git bỏ qua).

## 1. Tóm tắt

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Bốn công cụ bắt buộc và bộ hồi quy | **Đạt** | 15/15 bộ |
| So hiệu năng với mốc P5-00 | **Đạt** | Không chậm đi rõ rệt; mở bộ thẻ nhanh hơn; ít byte hơn 3,65 MiB |
| Mở sách → trang đầu hiển thị | **Đạt** | 331 ms (trung vị) |
| Mạng trước khi mở sách | **Đạt** | 0 yêu cầu dữ liệu và ảnh sách |
| Luồng trình chiếu: 1920 và 1366, VI và EN, sáng và tối | **Đạt** | 8/8 tổ hợp, bấm thật, có tải PNG |
| QR fanpage | **Đạt** trên ảnh chụp màn hình (8/8) | Quét thật bằng điện thoại từ máy chiếu: **Chưa chạy** (cần người) |
| Bản đồ khi không có WebGL, khi GPU phần mềm | **Đạt** | GPU phần mềm vào bản đồ mất 26 giây |
| Phát hiện mới | **3 mục, đã sửa** | Hai lỗi có từ trước P5 và một điểm lệch quy ước tên trong bản EN; sau khi sửa, 15/15 bộ đạt (mục 7) |

## 2. Bốn công cụ bắt buộc và bộ hồi quy

| Bộ kiểm | Kết quả |
| --- | --- |
| `tools/verify-preview5-conversation-cards.cjs` | PASS: 6 cỡ màn hình (1440 → 320 px), hiệu ứng, trọn một lượt chơi |
| `tools/perf/verify-gd6-functional.cjs` (mốc P5-00 so với hiện tại) | 0 lỗi trang. 13 khác biệt, **trùng từng dòng** với lượt P5-03: phần sửa sau P5-03 (bảng Tùy chọn, đầu khung ga) không đổi hành vi nào GĐ6 theo dõi |
| `tools/check-books-5.cjs` và `--render` | 0 lỗi; các tập nháp chỉ có cảnh báo thiếu nội dung |
| `tools/check-i18n-5.cjs --walk` | PASS |
| `tools/build-content-en-5.cjs --check` | `content-en-5.js` khớp bảng dịch |
| `verify-p5-01.cjs`, `verify-p5-02.cjs` | 21/21, 43/43 |
| `tools/check-station-panel-5.cjs` | PASS: 6 cỡ, hành trình, thẻ, kỷ niệm, bưu thiếp, sách nháp, 32 trang mời, nền tối |
| `verify-dialog-lang-5.cjs` | 17/17 |
| `check-file-url.cjs` | Mở thẳng tệp: sách hiện được, 0 lỗi |
| `check-shared-files-p3p4.cjs` | Preview-3 và preview-4 **giống hệt** khi nạp tệp dùng chung cũ hay mới |
| `scan-layout-en-5.cjs` (5 cỡ × 30 màn hình) | 0 lỗi bố cục chỉ có ở tiếng Anh |

Script nằm ở `verification/p5-books/scripts/`, nhật ký ở `p5-05/logs/`.

## 3. Hiệu năng

**Cách chạy:** A là bản sao mốc P5-00, B là preview-5 hiện tại. Hai bên chạy xen kẽ ở 1920×1080, CPU ×1, GPU thật. Trị số ghi dạng trung vị [tứ phân vị 1–3].

**Vào bản đồ.** Lượt n = 5 cho chênh lệch sát biên dao động, nên theo plan đo lại n = 10:

| Chỉ số | A — mốc | B — hiện tại |
| --- | --- | --- |
| **Bấm Mở bản đồ → màn che mở hẳn (ms)** | **2605 [2410–3257]** | **2955 [2428–3403]** |
| Bấm Mở bản đồ → màn che bắt đầu mở (ms) | 2107 [1940–2757] | 2503 [1939–2910] |
| FCP (ms) | 672 [657–681] | 608 [597–648] |
| gateReady (ms) | 408 [398–433] | 397 [373–427] |
| Byte truyền cả luồng tới bản đồ (MiB) | 29,11 | **25,46** |
| Số yêu cầu cả luồng | 204 | 213 |
| Heap sau khi vào bản đồ (MB) | 31,7 | 34,9 |

- **Kết luận:** chưa thấy chậm đi rõ rệt.
  - Ở cả hai bên, thời gian vào bản đồ dồn về hai mức, khoảng 2,4 s và khoảng 3,4 s.
  - B rơi vào mức chậm 5/10 lần, A 3/10 lần. Với n = 10, khác biệt này nằm trong dao động.
  - Lượt n = 5 cùng phiên cho cùng hướng: 3.300 so với 3.701 ms.
- **Tăng thêm:** 9 yêu cầu và 3 MB heap. Đây là phần song ngữ: `i18n-ui-5.js`, `content-en-5.js` (162 KB) và các tệp `-5`.
- Số liệu ở `p5-05/perf-n10/` và `p5-05/perf-n5/`. Kết quả mốc gốc trong `verification/p5-books/perf/` giữ nguyên.

**Mở bộ thẻ** (n = 5, `ab-cards-p5.cjs`):

| Chỉ số | A — mốc | B — hiện tại |
| --- | --- | --- |
| Hàm mở bộ thẻ chạy xong (ms) | 69,4 [56,7–70,1] | **61,4** [58,4–63,5] |
| Rút thẻ → lá sẵn sàng (ms, gồm hiệu ứng) | 2979 | 2960 |
| Rút thẻ: khung hình dài nhất (ms) | 91,7 | **66,8** |
| Heap (MB) | 35,1 | **29,5** |

**Mở sách → trang đầu hiển thị.** Chỉ đo trên B, vì bản mốc chưa có sách. Mỗi lần là một phiên mới, nên lần nào cũng phải tải `book.js` và ảnh trang đầu.

| Mốc tính từ lúc bấm Đọc sách (n = 5) | ms |
| --- | --- |
| Sách hiện (`goiviet:bookshown`) | 103 [96–140] |
| Ảnh trang đầu đã giải mã | 229 [192–280] |
| Trang đầu đã vẽ ra màn hình | 331 [247–337] |

Script: `measure-book-open-p5-05.cjs`.

## 4. Mạng trước khi mở sách

`net-before-book-p5-05.cjs` bấm thật lần lượt: trang chủ → chương ký ức → bản đồ → ga Hà Nội → bộ thẻ, rút một lá → ống xăm → bưu thiếp, rồi mới mở sách.

- **Trước khi mở sách:** 0 yêu cầu tới dữ liệu và ảnh sách (`books-5/<tập>/`, `books-5/postcards/`, QR). Trang chỉ nạp sẵn 5 tệp mã và kiểu dáng: `catalog-5.js`, `layouts-5.js`, `book-reader-5.js`, `book-reader-5.css`, `community-postcards-5.js`.
- **Khi mở sách:** tải `hn/book.js`, ảnh bìa và trang kề (`edition-vi/01.webp`).

## 5. Luồng trình chiếu

`walk-presentation-p5-05.cjs` bấm thật với đầy đủ hiệu ứng, như trên máy lớp, và chỉ cho tải tệp cục bộ. Thứ tự các bước:
- trang chủ (chọn ngôn ngữ ở đây);
- chương ký ức → bản đồ (đợi màn che "Đang chuẩn bị bản đồ…" tắt; nền tối bật bằng Tùy chọn);
- ga Hà Nội có đủ hai nút;
- chơi một lượt:
  - chọn đáp án, mở kết nối;
  - gõ kỷ niệm;
  - **đổi ngôn ngữ ngay trong lá bài rồi đổi lại**;
  - lưu kỷ niệm, xong lượt;
- đọc sách, lật trang, đóng;
- trang Sắp có của Đà Nẵng;
- bưu thiếp, đánh dấu kỷ niệm, **tải PNG**.

| Tổ hợp | Kết quả | Màn che tắt sau |
| --- | --- | --- |
| 1920×1080 · VI · sáng / tối | Đạt / Đạt | 6,0 s (phiên đầu, trình duyệt còn lạnh) / 3,4 s |
| 1920×1080 · EN · sáng / tối | Đạt / Đạt | 3,3 s / 3,2 s |
| 1366×768 · VI · sáng / tối | Đạt / Đạt | 3,4 s / 3,4 s |
| 1366×768 · EN · sáng / tối | Đạt / Đạt | 3,2 s / 3,6 s |

Ở cả 8 tổ hợp đều thấy:
- **Đổi ngôn ngữ giữa chừng** giữ đúng lá bài, đáp án đã chọn, trạng thái đã mở kết nối, địa danh và ghi chú đang gõ (nguyên văn). Câu hỏi đổi ngôn ngữ, và đổi về thì trở lại đúng câu cũ.
- **Sách:**
  - lật sang trang 2 được, không có ảnh lỗi;
  - đóng sách thì tiêu điểm về nút Đọc sách;
  - bản EN hiện nhãn "Vietnamese edition".
- **Trang Sắp có:** đúng link fanpage, QR tải được, có nút chơi thẻ.
- **PNG:** 1080×680, khoảng 120 KB, mở được.
  - Bản VI và bản EN khác nhau, mỗi bản có đúng chữ của ngôn ngữ đó, kèm ghi chú kỷ niệm nguyên văn.
  - Cùng một ngôn ngữ thì PNG giống hệt nhau ở mọi cỡ cửa sổ và cả hai nền.
- **Cập nhật sau đợt ảnh ga và sửa ngoại tuyến (12/11/2026):** preview-5 hiện có 35 ảnh ga cục bộ, có ghi công; Hoàng Sa tạm dùng biểu tượng chờ chọn ảnh phù hợp. Không còn ảnh ga tải từ Wikimedia. Bản chạy với đầy đủ tài nguyên cục bộ vẫn có ảnh khi không có Internet. Với bản qua HTTPS/localhost, chỉ tải bộ ngoại tuyến khi người dùng bấm **Tùy chọn → Chuẩn bị chạy không mạng** (khoảng 164 MB); sau khi báo sẵn sàng có thể mở tab mới và tải lại khi mất mạng. Xem [báo cáo ảnh ga và ngoại tuyến](BAO-CAO-ANH-GA-PREVIEW-5.md) để biết kết quả kiểm thử và chiến lược cache mới.

Ảnh chụp từng bước ở `p5-05/walk/`, PNG ở `p5-05/png/`. Lượt chạy đầu (`p5-05/walk-run1/`) bấm khi màn che còn phủ và dẫn tới phát hiện 7.1.

## 6. QR fanpage

- `decode-qr-p5-05.py` (OpenCV) giải mã đúng `https://www.facebook.com/people/G%C3%B3i-Vi%E1%BB%87t/61594157551043/` trên cả 8 ảnh chụp trang Sắp có.
- Trên màn hình, mã có cạnh 122 px ở cả 1920 và 1366.
- **Còn lại cho người:** quét bằng điện thoại từ màn chiếu thật, ở khoảng cách hàng ghế cuối.

## 7. Phát hiện mới và cách đã sửa

### 7.1. Màn che "Đang chuẩn bị bản đồ…" kẹt 30 giây nếu mở hộp thoại khi nó còn phủ (có từ trước P5)

- **Tái hiện** (`probe-curtain-p5-05.cjs`, 1920×1080, đầy đủ hiệu ứng): bấm Mở bản đồ. Sau 2,5 s chọn ga trong danh sách, sau 4,5 s bấm Chơi thẻ. Màn che chỉ tắt sau **31,2 và 31,4 s**, và console ghi "Hết thời gian chờ chuẩn bị bản đồ; mở bản đồ hiện có."
- **Đối chứng:**
  - không bấm gì thì màn che tắt sau 5,2–6,7 s;
  - chỉ chọn ga thì tắt sau 7,2–7,8 s.
- **Nguyên nhân:**
  - Màn che không chặn chuột, nên vẫn bấm xuyên tới danh sách ga và nút bên dưới.
  - Khi hộp thoại mở, bản đồ dừng vẽ. Còn `map-prewarm-3.js` chỉ tắt màn che khi bản đồ đã vẽ xong, nên phải đợi tới giới hạn an toàn `SAFETY_MS = 30000`.
- **Có từ trước:** `map-prewarm-3.js` giống hệt bản mốc. Đoạn vào bản đồ của `memory-reference-5.js` khớp từng dòng với `memory-reference-v2.js` mà mốc dùng, chỉ khác chữ đi qua `T()`.
- **Ảnh hưởng:** chỉ xảy ra khi bấm "mò" lúc màn che đang phủ. Nhưng nếu xảy ra lúc trình chiếu, màn hình trông như đứng hình nửa phút.
- **Đã sửa** (`map-surroundings-preview-5.html`, khối `<style id="p5-05-curtain-input">`):
  - Trong lúc phủ, màn che nhận chuột (`#memoryMapTransition.is-covering:not(.is-revealing)`).
  - Khi bắt đầu mở, chuột lại xuống tới bản đồ.
  - Tệp CSS dùng chung với preview-3 và preview-4 không đổi.
- **Kiểm lại:**
  - `probe-curtain-block-p5-05.cjs`: một cú bấm chuột thật vào chỗ của ga Hà Nội lúc màn che phủ thì trúng màn che, và ga đang chọn không đổi. Bấm lại sau khi màn che mở thì chọn đúng Hà Nội.
  - Cùng ca tái hiện như trên (chọn ga lúc 2,5 s, Chơi thẻ lúc 4,5 s): màn che tắt sau **5,3 và 6,1 s** thay vì 31 s, và không còn cảnh báo hết giờ chờ.
- **Còn lại về lý thuyết:** bàn phím vẫn đi được tới các nút dưới màn che (Tab nhiều lần rồi Enter khi không nhìn thấy gì). Không tái hiện ca này, vì người dùng khó làm vậy trong vài giây màn che hiện.

### 7.2. Nút "Xem hoạt động gắn kết →" gần như không đọc được (có từ trước P5)

- **Hiện tượng:** chữ trên nút đỏ trong hộp lời giải có màu xám xanh `#4b5b4c`, cỡ 13 px. Độ tương phản **1,18 : 1**, trong khi WCAG AA cần 4,5 : 1. Lỗi có ở cả nền sáng lẫn nền tối (`probe-flip-button-p5-05.cjs`, ảnh `p5-05/flip-button-*.png`).
- **Nguyên nhân:** quy tắc `#deckModal #answerExplanationBox :is(p,span) { … color: #4b5b4c !important }` ở dòng 94 của `conversation-cards-5.css` áp luôn vào `<span>` trong nút `#btnFlipToBack`. Nút tự đặt chữ màu trắng nhưng bị đè.
- **Có từ trước:** dòng này đã có trong commit mốc `52bd8db` và giống bản `conversation-cards-3.css`.
- **Đã sửa** (`conversation-cards-5.css`): quy tắc thành `:is(p,span):not(button *)`, nên nhãn trong nút giữ chữ sáng của nút và cỡ 12 px mà dòng 96 đã định. Đoạn lời giải vẫn như cũ.
- **Kiểm lại:** chữ `rgb(255, 253, 248)` trên nền đỏ, độ tương phản **6,02 : 1** ở cả hai nền, so với điểm sáng nhất của dải màu nền.

### 7.3. Chú thích bưu thiếp cộng đồng tiếng Anh viết tên không dấu (P5-02)

- **Hiện tượng:** **28/32** chú thích tiếng Anh trong `community-postcards-5.js` bỏ dấu tên Việt, ví dụ "Huyen Khong Cave · Marble Mountains", "Ban Gioc Falls", "Ca Mau Cape", "Po Nagar Cham Towers". Như vậy lệch quy ước đã chốt ở plan mục 7: giữ dấu, như "Hà Nội", "Hồ Chí Minh City".
  - Lượt quét đầu chỉ thấy 26 chú thích vì bỏ qua các chữ chỉ có hai ký tự như "Cà" và "Pô".
- **Vì sao chưa bị bắt:** `check-i18n-5.cjs` chỉ tìm chữ có dấu còn sót, không tìm tên thiếu dấu.
- **Đã sửa:**
  - `fix-postcard-captions-en-5.cjs` chỉ thêm lại dấu, giữ nguyên câu chữ, ví dụ "Huyền Không Cave · Marble Mountains", "Bản Giốc Falls", "Cà Mau Cape".
  - Mỗi chú thích phải khớp đúng một lần thì script mới thay.
  - `--check` xác nhận cả 32 chú thích không còn tên thiếu dấu.
- **Tên tệp PNG tải về** nay theo ngôn ngữ, qua khóa mới `js.postcard.filename`: `goi-viet-family-postcard.png` ở bản EN, bản VI giữ tên cũ.
- **Công cụ kiểm tra:** `check-i18n-5.cjs` từng coi chú thích EN có dấu là chữ Việt còn sót. Nay nó cho phép đúng phần chữ `"en"` của các chú thích này, giống cách đã cho phép tên riêng trong `content-en-5.js`. Nếu chú thích tiếng Việt lọt sang trang tiếng Anh, công cụ vẫn báo.
- Nhóm duyệt cách viết các chú thích này cùng toàn bộ bản EN.

### 7.4. Kiểm lại sau khi sửa

| Bộ kiểm | Kết quả |
| --- | --- |
| `walk-presentation-p5-05.cjs` | 8/8. PNG bản EN tên `goi-viet-family-postcard.png`, bản VI tên cũ |
| `check-station-panel-5.cjs`, `verify-preview5-conversation-cards.cjs` | PASS |
| `verify-p5-01.cjs`, `verify-p5-02.cjs`, `verify-dialog-lang-5.cjs` | 21/21, 43/43, 17/17 |
| `check-i18n-5.cjs --walk` | PASS, sau khi cho phép phần chữ EN của chú thích (ở trên) |
| `tools/perf/verify-gd6-functional.cjs` | 13 khác biệt, trùng từng dòng với lượt nghiệm thu; 0 lỗi |
| `scan-layout-en-5.cjs` (5 cỡ) | 0 lỗi bố cục chỉ có ở tiếng Anh |
| `check-books-5.cjs` (thường và `--render`), `build-content-en-5.cjs --check`, `check-file-url.cjs` | Đạt |
| `net-before-book-p5-05.cjs` | 0 yêu cầu tệp sách trước khi mở sách |
| `check-shared-files-p3p4.cjs` | Preview-3 và preview-4 giống hệt |
| QR trên ảnh chụp mới | 8/8 |

Nhật ký ở `p5-05/logs-after-fix/`. Ảnh và PNG trước khi sửa ở `p5-05/walk-before-fix/` và `p5-05/png-before-fix/`.

## 8. Mục tùy chọn

| Mục | Trạng thái |
| --- | --- |
| Tắt WebGL (`fallback.cjs`, kịch bản `webgl-disabled`) | **Đạt**: bản đồ vẽ bằng Canvas, vào bản đồ 10,1 s, 0 lỗi |
| GPU phần mềm SwiftShader (máy không tăng tốc đồ họa) | **Đạt**, nhưng vào bản đồ mất **26,1 s**. Nếu máy lớp yếu, nên mở sẵn bản đồ trước giờ trình bày |
| Cửa sổ 1536×864 và 1280×720 (màn 1920 với Windows phóng 125% và 150%) | **Đạt** qua `scan-layout-en-5.cjs` |
| Điện thoại 390 px | **Một phần**: khung ga 390×844 (EN) và bộ thẻ ở 390 và 320 px đạt. Giao diện điện thoại không phải trọng tâm buổi trình chiếu |
| Màn 4K, zoom 200 %, mạng chậm | **Chưa chạy** |

## 9. Bàn giao

### Tệp của đợt P5 (chỉ preview-5 dùng)

- **Sách (P5-01, P5-02):**
  - `assets/goi-viet/books-5/`: trình đọc `book-reader-5.js/.css`, `catalog-5.js`, `layouts-5.js`, `community-postcards-5.js`, `coming-soon-railway.svg`, `fanpage-qr.svg`;
  - tập `hn/` (50 tệp), `hue/`, `hcm/`, `th/` (giữ chỗ), `_mau/`, `postcards/` (32 ảnh).
- **Khung ga và hành trình (P5-02):** `station-panel-5.js/.css`, `station-hanoi-5.webp`, `journey-system-5.js`, `fortune-ritual-5.js` (tách từ bản 4 và bản gốc).
- **Song ngữ (P5-03):**
  - `i18n-5.js`, `i18n-ui-5.js`, `i18n-ui-5.css`, `content-en-5.js`, `settings-panel-5.css`;
  - 18 bản `-5` tách từ tệp dùng chung: `map-reference-ui-5.js`, `map-controls-island-reference-5.js`, `postcard-design-5.js`, `heritage-overlays-5.js`, `homepage-music-5.js`, `homepage-opening-controller-5.js`, `homepage-layered-opening-5.js`, `heritage-command-bar-5.js`, `home-station-feedback-5.js`, `memory-reference-5.js`, `polish-5.js`, `preview-5.js`, `province-legibility-5.js` và `natural/{archipelago-renderer,hydrology,island-chart,landscape,terrain-renderer}-5.js`.
- **Ảnh ga và ngoại tuyến (chỉ preview-5):** `assets/goi-viet/station-photos-5/` (35 WebP, catalog, ghi công; Hoàng Sa là placeholder); `preview-5-offline-worker.js`; `assets/goi-viet/map-surroundings-preview/offline-control-5.js`, `offline-manifest-5.js`; nút và trạng thái VI/EN trong Tùy chọn.
- **Công cụ ảnh/ngoại tuyến:** `tools/station-photo-source-5.py`, `tools/build-station-photos-5.py`, `tools/build-preview-5-offline.py` (có `--check` không ghi tệp), `tools/check-station-photos-5.cjs`. Các probe `probe-offline-sw-5.cjs`, `probe-offline-stale-5.cjs`, bài mạng trước sách và ca route thử nằm ở `verification/p5-books/scripts/`; thư mục verification bị Git bỏ qua.
- **Công cụ trong repo:** `tools/check-books-5.cjs`, `tools/check-i18n-5.cjs`, `tools/build-content-en-5.cjs`, `tools/content-en-5/` (bảng dịch và khóa bản dịch lỗi thời), `tools/check-station-panel-5.cjs`.
- **Tệp dùng chung có sửa:** `map-reference-ui.js`, `journey-system-4.js`, `polish-3.js` có sửa kèm điều kiện ở commit `9f18f9d` (P5-02, Codex). Hôm nay kiểm lại: preview-3 và preview-4 vẫn giống hệt.
- **Sửa ở P5-05 (mục 7):** khối style `p5-05-curtain-input` và khóa tên tệp PNG trong `map-surroundings-preview-5.html`; `conversation-cards-5.css`; `community-postcards-5.js`; khóa `js.postcard.filename` trong `i18n-ui-5.js`; `tools/check-i18n-5.cjs`. Ba tệp tài nguyên đã tăng số phiên bản trong HTML.
- **Lưu ý bảo trì:** `heritage-overlays-5.js` đã được sửa tay sau P5-03 (bảng Tùy chọn mới). Chạy lại `make-shared-i18n-5.cjs` sẽ ghi đè phần sửa đó. 17 bản `-5` còn lại vẫn khớp với script sinh.

`index.html`, preview-1, preview-2 và preview-4 không đổi từ mốc P5-00. Preview-3 đổi ở commit `9e3bde0`: commit này lưu phần bộ thẻ và trang chủ bản 3 đã làm từ trước đợt P5 (BAO-CAO-P5-00 mục 7), không phải việc của P5.

### Thiết bị và ca chưa kiểm

- máy chiếu thật;
- quét QR bằng điện thoại;
- trình duyệt khác Chrome (Edge, Firefox);
- trình đọc màn hình thật;
- màn 4K, zoom 200 %, mạng chậm.

### Messenger

Chưa kiểm. Người quản trị fanpage cần mở `m.me/61594157551043` để xem có vào đúng khung nhắn tin không (plan, điểm cần chốt 6).

### Việc còn lại

1. **Khi nhóm giao nội dung P5-04**, chạy lại cho mỗi tập:
   - `node tools/check-books-5.cjs --render`;
   - đọc hết tập ở VI và EN;
   - `measure-book-open-p5-05.cjs` và `net-before-book-p5-05.cjs`;
   - chuyển `draft` → `published` trong `catalog-5.js`.
2. **Nhóm duyệt bản EN và các dữ kiện còn mở** (BAO-CAO-P5-03 mục 7.5), gồm cả 32 chú thích bưu thiếp cộng đồng.
3. **Quét QR thật và kiểm Messenger.**

### Chạy lại nghiệm thu

Cần `node tools/perf/server.cjs` đang chạy.

```bash
bash verification/p5-books/scripts/measure-baseline.sh 5
```

Script này ghi đè `verification/p5-books/perf/`, nên chép kết quả cũ sang chỗ khác trước khi chạy (BAO-CAO-P5-00 mục 7).

```bash
node verification/p5-books/scripts/walk-presentation-p5-05.cjs
```

```bash
node verification/p5-books/scripts/net-before-book-p5-05.cjs
```

```bash
node verification/p5-books/scripts/measure-book-open-p5-05.cjs --n 5
```

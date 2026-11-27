# Báo cáo P5-07 — Sổ tay hành khách (giai đoạn 1)

Ngày: 27/11/2026. Nhánh `p5-06-so-tay`, tách từ `main` tại `29bf515`. Chỉ thay đổi preview-5 (`map-surroundings-preview-5.html` và các tệp hậu tố `-5`). Không sửa `index.html`, các preview trước, `card-testing.html` hay tệp dùng chung của các bản khác.

> **Bản 2 (cùng ngày, nhánh `p5-07-so-tay-v2`)** thay đổi bố cục, cỡ chữ, đầu máy, bản đồ ga 1 và cách dẫn từng bước. Xem mục [Bản 2](#bản-2--dễ-đọc-trên-máy-chiếu-làm-lần-lượt-bản-đồ-thật) ở cuối. Phần mô tả giai đoạn 1 bên dưới giữ nguyên để đối chiếu; chỗ nào bản 2 thay thì theo mục Bản 2.

## Mục tiêu

Người xem đi theo luồng "Xem cách chơi" trước đây chỉ gặp chương kể chuyện "Có những điều chỉ cần gợi, là nhớ", không thấy chức năng nào được giải thích. Đợt này thêm **Sổ tay hành khách** ngay sau chương ký ức, trước bản đồ. Người xem chơi thử một lượt qua bốn ga nhỏ rồi lên tàu.

Hướng thiết kế dựa trên phần nghiên cứu đã trao đổi:

- **Cho làm thay vì cho đọc.** Mỗi ga chỉ có một thao tác chính trên đúng dữ liệu thật. Nghiên cứu của NN/g cho thấy các bài hướng dẫn dạng lướt thẻ nhiều chữ không giúp người dùng làm tốt hơn.
- **Ngắn, không chặn.** Nút "Tiếp" luôn bấm được và vé chưa soát đủ vẫn lên tàu được. "Vào thẳng bản đồ" luôn có ở đầu sổ tay và cuối chương.
- **Dùng đúng chữ của giao diện thật**: Khám phá, Chơi thẻ, Đọc sách, Xem gợi ý, Đổi hoạt động, Xong lá này, Lưu kỷ niệm, Rút vé, Bưu thiếp… Nhờ vậy vào bản đồ người xem nhận ra ngay các nút đã gặp.

## Luồng mới

Trang chủ → **Xem cách chơi** → chương ký ức → **Xem sổ tay hành khách** → sổ tay (5 ga) → **Lên tàu** → bản đồ.

Các đường tắt vẫn giữ: nút "Mở bản đồ ký ức" ở trang chủ vào thẳng bản đồ. Ở cuối chương, `#memoryOpenMap` vẫn là nút vào thẳng bản đồ, chỉ đổi hình thức thành liên kết nhỏ "Vào thẳng bản đồ →" nằm dưới nút sổ tay. Giữ nút này để các bộ kiểm cũ (`check-arrival-demo-5`) và người đã quen vẫn dùng được.

## Năm ga

| Ga | Người xem làm gì | Dữ liệu thật dùng lại | Ứng với trên bản đồ |
| --- | --- | --- | --- |
| 1 · Chọn ga | Chạm ga trên bản đồ thu nhỏ → "Khám phá" → tàu chạy dọc đường sắt Bắc–Nam → "Đoàn tàu đang vào ga" → bảng ga. Có nút "Rút vé" gieo một ga mẫu. "Đọc sách" mở ghi chú sách đang biên soạn. | 34 tỉnh (`DATA.provinces34`), đảo và rạn của Hoàng Sa, Trường Sa (`subIslands3D`), vùng, tóm tắt, danh thắng, di sản, hương vị (`ALL_DECKS_MAP`), tên ga theo chip "bắt đầu với" | Chọn ga, "Bạn đang ở đây · Khám phá", bảng ga "Đã đến ga" với "Chơi thẻ · Còn 4 lá" và "Đọc sách · Sắp có · Góp chuyện quê bạn" |
| 2 · Rút bài | Bốn lá xòe với bìa Canva thật. Chọn một lá hoặc "Xáo & Rút". Mặt trước có câu hỏi, A/B/C, "Xem gợi ý" (lược một phương án sai), "Chưa biết, xem giải thích", "Kiểm tra đáp án". | Câu hỏi, đáp án, giải thích của 4 lá ở ga; bìa từ `GoiVietCardCovers.art`; lá Canva hỏi mở từ `GoiVietCanvaCards` | Bộ thẻ trò chuyện, mặt trước "Câu hỏi văn hóa" |
| 3 · Hoa Sen | Chạm dấu sáp Hoa Sen để mở mặt sau. Đổi hoạt động, hẹn giờ 60 giây, Bỏ qua, Xong lá này (đóng dấu kỷ niệm). | Hoạt động thật của lá (thử thách Canva trước, rồi 3 hoạt động của lá, giống `swapCardActivity`) | Mặt sau "Hoạt động gắn kết", dấu Hoa Sen, hẹn giờ |
| 4 · Kỷ niệm | Ghi "Địa danh" (bắt buộc, báo lỗi nếu trống) và "Kỷ niệm (tùy chọn)" → bưu thiếp chơi thử hiện lời ghi bằng nét chữ tay, tiến độ mốc, số kỷ niệm. | Nhãn ô nhập, chỗ gợi ý và chữ bưu thiếp của trang | Ghi kỷ niệm, "Tiến độ mốc n / 3", bưu thiếp PNG |
| 5 · Ga cuối | Sơ đồ màn hình bản đồ đánh số 1–7, kèm danh sách 7 nút. Đi qua lần lượt một vòng, rê chuột để xem từng nút. | Nhãn thật của thanh trên, khu quần đảo, thanh dưới | Tiến độ mốc, Rút vé, Bưu thiếp, Danh sách ga, VI/EN · Tùy chọn, Đi tới quần đảo, Về giữa · Góc nhìn |

Vé lên tàu ở chân sổ tay có 4 lỗ. Lỗ của một ga được bấm khi người xem thực sự làm thử ở ga đó. Kèm theo là dấu "Đã thử" trên bàn chơi và dấu ✓ trên đường ray. Khi bấm "Lên tàu", vé được đóng dấu "Đã soát vé" rồi màn che mở bản đồ. Đoàn tàu nhỏ trên đường ray chạy theo ga đang xem.

## Cách tích hợp

- **Hộp thoại riêng** `#soTayDialog` (`role="dialog"`, `aria-modal`) nằm ngoài `#introScreen`. Khi mở, trang chủ **vẫn mở**, chỉ bị ẩn khỏi nhìn (`body.st-covering`). Nhờ vậy `map-prewarm-5.js` vẫn tiếp tục chuẩn bị bản đồ trong lúc người xem đọc; bộ kiểm xác nhận `preparing` vẫn đúng khi sổ tay mở.
- **Khóa trang dưới:** mọi phần tử khác của `body` được đặt `inert` (giá trị cũ được trả lại khi đóng), Tab chạy vòng trong sổ tay, Esc đóng sổ tay và trả focus về nút "Xem sổ tay hành khách". Phím ← → chuyển ga, trừ khi đang ở ô nhập hoặc nhóm đáp án.
- **Vào bản đồ bằng đường sẵn có:** "Lên tàu" và "Vào thẳng bản đồ" gọi `GoiVietMemoryChapter.enterMap()` (màn che rồi giữ đến khi bản đồ xong), không viết đường vào bản đồ mới. Nếu bản đồ không mở được, sổ tay đóng để người xem thấy thông báo lỗi của chương.
- **Không ghi gì vào hành trình:** sổ tay không động tới `state` (lá đã rút, dấu, kỷ niệm, tiến độ, ga đã ghé), `localStorage` hay `sessionStorage`. Bộ kiểm so ảnh chụp trạng thái trước và sau khi chơi đủ năm ga.
- **Song ngữ:** các khóa `sotay.*` nằm trong `i18n-ui-5.js`. Chữ trùng giao diện thật dùng lại khóa sẵn có (`ui.deck.*`, `ui.postcard.*`, `table.*`, `js.deck.*`). Nội dung thẻ, vùng, tóm tắt theo `GoiVietContent` nên đổi VI ↔ EN ngay trong sổ tay.
- **Theme tối** dùng token của trang (`--paper-*`, `--ink-*`, `--son-red*`…) và thêm vài màu riêng cho bản đồ, vé. **Giảm chuyển động** (cài đặt của hệ thống hoặc nút của trang) tắt mọi hoạt cảnh: tàu tới ngay, rút bài ngay, không có vòng đi qua tự chạy.
- **Kích thước:** cỡ chữ của khung co giãn theo màn hình (14 px ở 1366 × 768, khoảng 16,5 px ở 1920 × 1080). Màn hẹp hơn 860 px chuyển thành một cột cuộn dọc, chân trang dính đáy.

### Tệp

| Tệp | Thay đổi |
| --- | --- |
| [so-tay-5.js](../../assets/goi-viet/map-surroundings-preview/so-tay-5.js) | Mới: điều khiển sổ tay, năm ga, vé, mở/đóng/lên tàu, `window.GoiVietSoTay.inspect()` cho bộ kiểm |
| [so-tay-5.css](../../assets/goi-viet/map-surroundings-preview/so-tay-5.css) | Mới: giao diện, theme tối, giảm chuyển động, màn hẹp; kiểu liên kết "Vào thẳng bản đồ" ở cuối chương |
| [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html) | Nạp 2 tệp mới; nút "Xem sổ tay hành khách" và liên kết `#memoryOpenMap` ở cuối chương; markup `#soTayDialog` |
| [i18n-ui-5.js](../../assets/goi-viet/map-surroundings-preview/i18n-ui-5.js) | Thêm khối khóa `sotay.*` (VI/EN) |
| [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | Dựng lại: thêm `so-tay-5.css`, `so-tay-5.js`, `logo-mark.svg` (xem mục kiểu xuống dòng bên dưới) |
| [check-so-tay-5.cjs](../../tools/check-so-tay-5.cjs) | Mới: bộ kiểm sổ tay |
| [docs/README.md](../README.md) | Thêm dòng cho đợt này |

## Hai lỗi phát sinh đã xử lý trong lúc làm

1. **Lỗi trang `closest` trên `null`** trong `label-performance-arrival-5.js`, khi đổi ngôn ngữ trong lúc sổ tay mở. Bộ quan sát của tệp này đọc `parentElement` của một nút chữ vừa bị thay. Nút chữ đó là nhãn hẹn giờ: i18n ghi chữ vào nó, rồi sổ tay thay luôn nội dung. Đã sửa phía sổ tay: nhãn hẹn giờ do JS tự ghi theo ngôn ngữ, không mang `data-i18n`. Không sửa tệp của đợt A-03/A-04. Điểm yếu của bộ quan sát (chưa kiểm `null`) vẫn còn với mã khác.
2. **Focus không trả về nút sau khi đóng**, vì `#introScreen` có chuyển cảnh `visibility .24s` nên nút còn bị ẩn trong vài khung hình. Khi gỡ lớp che, sổ tay tắt chuyển cảnh đó trong 2 khung hình (`body.st-uncover`) để trang hiện ngay.

## Kiểm tra

Chạy trên Windows 11, Chrome thật (headless, GPU D3D11), ngày 27/11/2026.

**`node tools/check-so-tay-5.cjs` → 24/24 đạt.** Báo cáo chi tiết và ảnh nằm trong `verification/so-tay-5/` (`checks.json`, ảnh 1366, 1920, 390, theme tối, bản đồ sau khi lên tàu). Các mục được kiểm:

- Cuối chương: nút "Xem sổ tay hành khách" (tên truy cập chứa chữ hiển thị, `aria-haspopup="dialog"`), liên kết "Vào thẳng bản đồ".
- Khi mở: hộp thoại hiện, focus vào tiêu đề ga, trang dưới `inert` nhưng trang chủ vẫn mở, bản đồ vẫn được chuẩn bị (`GoiVietMapPrewarm3.inspect().preparing`). Bấm Tab 40 lần, focus không ra khỏi sổ tay.
- Ga 1: 34 tỉnh đúng `DATA.provinces34`, 2 vùng quần đảo, nhãn Hoàng Sa và Trường Sa, 3 ghim ga. Chọn Hà Nội → Khám phá → bảng ga khớp vùng, tóm tắt, danh thắng, di sản, hương vị của `ALL_DECKS_MAP.hn`; vé soát 1/4. "Rút vé" gợi ý ga khác; "Đọc sách" mở ghi chú.
- Ga 2: 4 lá đúng thứ tự và chủ đề của ga, 4 bìa Canva. Xáo và rút ra đúng câu hỏi (lá Canva thì hiện câu hỏi mở, không có A/B/C). Kiểm khi chưa chọn thì báo; phím mũi tên đổi đáp án mà không đổi ga. Chọn sai thì hiện đúng câu "Cùng tìm hiểu nhé!…" của trang và đúng lời giải thích của lá.
- Ga 3: dấu Hoa Sen mở hoạt động trùng nguyên văn hoạt động đầu của lá. Đổi hoạt động ra hoạt động thứ hai. Hẹn giờ chạy ("Còn 59 giây"), "Xong lá này" đóng dấu, sang ga 4 và tắt hẹn giờ.
- Ga 4: địa danh trống thì báo lỗi, đặt `aria-invalid` và trả focus về ô; lưu xong thì bưu thiếp hiện "Nam Định · …", "Tiến độ mốc 1 / 3", "Kỷ niệm đã ghi: 1"; vé đủ 4/4.
- Ga cuối: 7 mục, 7 số trên sơ đồ, câu "Vé đã soát đủ bốn ga", nút "Lên tàu", phím ← →.
- Không tràn ngang ở cả 5 ga (1366 × 768) và ở 390 × 844 (một cột).
- Esc đóng sổ tay, trả focus về nút, gỡ `inert`; mở lại vẫn giữ vé và ga đang xem.
- Sau cả lượt chơi, `state` (lá đã rút, dấu, tiến độ, kỷ niệm, ga đã ghé), `localStorage` và `sessionStorage` y như trước khi mở.
- "Lên tàu": có dấu soát vé, `closeIntroModal` được gọi đúng 1 lần, bản đồ mở, màn che rút. "Vào thẳng bản đồ" ở đầu sổ tay và liên kết cuối chương đều vào bản đồ (liên kết cuối chương không mở sổ tay).
- Tiếng Anh ở 1920 × 1080: đúng chữ EN. Quét cả 5 ga không còn chuỗi giao diện tiếng Việt nào của `sotay.*`. Đổi sang VI ngay trong sổ tay thì bảng ga đổi theo dữ liệu.
- Theme tối dùng đúng token tối của trang. Giảm chuyển động: không còn phần tử nào có hoạt cảnh, mọi bước tức thì, vẫn lên tàu được.
- Không có lỗi trang, console hay HTTP trong các lượt trên.

Các bộ kiểm có sẵn chạy lại:

| Bộ kiểm | Kết quả |
| --- | --- |
| `node tools/check-i18n-5.cjs` | Đạt (344 khóa markup có EN; 271 khóa dùng trong mã có VI/EN) |
| `node tools/check-i18n-5.cjs --walk` | Dừng giữa chừng ở bước bấm "Xem gợi ý" trên lá đầu của ga Huế (`hue-c1`, lá Canva hỏi mở, không có nút gợi ý). **Lỗi có sẵn**: chạy cùng bản duyệt trên bản xuất sạch của `main` cũng dừng ở đúng chỗ này. Phần sổ tay được thay bằng phép quét EN trong `check-so-tay-5` |
| `node tools/check-books-5.cjs` | Đạt (một cảnh báo có sẵn: `sources.s1` còn là ví dụ `example.org`) |
| `node tools/check-arrival-demo-5.cjs --preview-5` (máy chủ `tools/perf/server.cjs` cổng 8770) | 61/61 đạt, kể cả ca hiệu năng C ở 1366 và 1920. Bộ này vào bản đồ qua cuối chương bằng `#memoryOpenMap`, nên xác nhận liên kết "Vào thẳng bản đồ" vẫn đi đúng đường cũ |
| `node tools/check-family-voyage-5.cjs` | Đạt (11 nhóm) |
| `node tools/check-station-panel-5.cjs` | Đạt |
| `node tools/verify-preview5-conversation-cards.cjs` | Đạt (6 kích thước, hoạt cảnh, một vòng chơi) |
| `python tools/build-preview-5-offline.py --check` | Đạt (646 tài nguyên) |
| `git diff --check` | Đạt |

## Gói ngoại tuyến và kiểu xuống dòng

Máy này đặt `core.autocrlf=true`. Sau lần chuyển sang `main` và pull, 278 tệp văn bản trong thư mục làm việc mang CRLF, trong khi repo lưu LF. Gói ngoại tuyến được băm theo byte thật trên đĩa (đúng cách làm của các đợt trước), và worker so SHA-256 từng tệp khi cài. Vì vậy lần dựng này đổi mã băm của 21 tệp mà đợt này không sửa nội dung; chúng chỉ đổi kiểu xuống dòng trên đĩa. `python tools/build-preview-5-offline.py --check` đạt trên máy này.

Rủi ro còn lại, không thuộc phạm vi đợt này: nếu trang được phục vụ từ một bản sao có kiểu xuống dòng khác (ví dụ tải từ GitHub với LF, hoặc clone ở máy khác), mã băm sẽ lệch và bước "Chuẩn bị chạy không mạng" báo lỗi. Hướng xử lý có thể là thêm `.gitattributes` cố định `eol=lf` cho tệp văn bản rồi dựng lại gói, hoặc luôn dựng lại gói ngay trên máy trình chiếu.

## Bản 2 — dễ đọc trên máy chiếu, làm lần lượt, bản đồ thật

Nhánh `p5-07-so-tay-v2`, tách từ `main` tại `727171a` (đã gồm giai đoạn 1 và `.gitattributes eol=lf`). Vẫn chỉ thay đổi preview-5.

Phản hồi sau giai đoạn 1:

- Hình "đoàn tàu" trên thanh ga trông như ô tô.
- Chữ, biểu tượng và hình ảnh còn nhỏ so với màn hình.
- Cần một bố cục và cách hướng dẫn từng bước dễ nhìn, đơn giản mà vẫn ấn tượng.
- Bản đồ trong sổ tay phải thật sự đẹp.

### Đo trước khi sửa

Đo bằng Chrome thật trên cả 5 ga, ở 4 khổ màn hình:

| Khổ | Cỡ chữ gốc | Chữ trung vị | Chữ nhỏ nhất | Số chữ dưới 14 px |
| --- | --- | --- | --- | --- |
| 1280 × 720, 1366 × 768, 1536 × 864 | 14 px (chạm mức sàn) | 11,2–11,8 px | 9,2–9,5 px (5,9 px ở con dấu bưu thiếp) | 33/37 đến 51/56 |
| 1920 × 1080 | 16,5 px | 13,2–13,8 px | 10,9–11,2 px | 21/37 đến 40/56 |

Giả định một phòng học có màn chiếu 100 inch (cao khoảng 1,25 m), người ngồi xa nhất cách khoảng 8 m. Với giả định đó:

- Chữ thân 14 px ở 1366 × 768 chỉ chiếm khoảng 6,8 phút cung trong tầm nhìn.
- Chữ trung vị chỉ khoảng 5,5 phút cung.
- [Extron](https://www.extron.com/article/videowallfontsize) khuyên tối thiểu 10 phút cung, an toàn là 15–20.

Hình tàu trên thanh ga cũng nhỏ: 36 × 17 px.

### Thay đổi

**Bố cục hai vùng.** Mỗi ga có một cột hướng dẫn bên trái (khoảng 31%) và một sân khấu lớn bên phải.

- Đầu trang gom về một hàng: tên sổ tay, thanh 5 ga, VI/EN, "Vào thẳng bản đồ" và nút đóng.
- Đã bỏ:
  - 4 chip thông tin.
  - Dòng mở đầu. Dòng này vẫn giữ làm mô tả cho trình đọc màn hình.
  - Số lớn "01".
  - Dấu "Đã thử" trên bàn.
- Vé lên tàu được gộp vào thanh ga: ga nào đã thử có dấu ✓, trình đọc màn hình đọc thêm "đã thử".
- Chân trang còn "Quay lại", phím tắt và "Tiếp". Ở ga cuối, chỗ phím tắt nhường cho dòng "Vé đã soát n/4 ga".

**Thang chữ theo chiều cao màn hình.** Cỡ gốc của khung là `clamp(14px, min(2.4vh, 1.36vw), 28px)`. Nhờ vậy, máy chiếu ở độ phân giải nào chữ cũng giữ cùng tỉ lệ với màn. Số đo thật sau khi sửa:

| | 1366 × 768 | 1920 × 1080 |
| --- | --- | --- |
| Cỡ gốc | 18,4 px | 25,9 px |
| Tiêu đề ga | 40,6 px | khoảng 57 px |
| Câu dẫn | 19,5 px | 27,5 px |
| Chữ nhỏ nhất trên khung | 14,4 px | khoảng 20 px |

Ở 8 m, chữ thân đạt khoảng 10 phút cung và tiêu đề khoảng 20 phút cung. Các nút cao khoảng 2,5em.

**Làm lần lượt.** Mỗi ga có 2–3 việc cần làm, đánh số:

- Việc đã xong có dấu ✓ xanh.
- Việc đang làm tô đỏ nhạt. Nút tương ứng trên sân khấu có viền vàng nhấp nháy 3 lần rồi đứng yên, theo WCAG 2.2.2: không có chuyển động tự chạy quá 5 giây.
- Làm xong cả ga thì viền vàng chuyển sang nút đi tiếp.

| Ga | Việc 1 | Việc 2 | Việc 3 |
| --- | --- | --- | --- |
| 1 · Chọn ga | Chạm một ga (viền cả 3 ghim) | Bấm Khám phá | Bấm Chơi thẻ trên bảng ga |
| 2 · Rút bài | Chạm một lá hoặc Xáo & Rút | Chọn một đáp án | Bấm Kiểm tra, đọc lời giải, rồi viền chuyển sang "Mở dấu Hoa Sen" |
| 2 · lá hỏi mở (Canva) | Rút một lá | Cả nhóm cùng kể, rồi mở dấu Hoa Sen | — |
| 3 · Hoa Sen | Chạm dấu Hoa Sen | Làm hoạt động, rồi bấm Xong lá này | — |
| 4 · Kỷ niệm | Ghi tên địa danh | Viết một dòng kỷ niệm | Bấm Lưu kỷ niệm |

Ga cuối thay danh sách việc bằng 7 nút của bản đồ, mỗi nút một dòng ngắn đặt ở cột trái. Sơ đồ màn hình bản đồ chiếm cả sân khấu.

**Bản đồ ga 1** dùng đúng nguồn của bản đồ chính và phủ kín sân khấu. Tỉ lệ khung nhìn tính lại theo kích thước sân khấu. Việt Nam, Hoàng Sa và Trường Sa luôn nằm trọn bên trái bảng ga.

- Lớp nền:
  - Biển xanh ngọc có sóng kiểu hải đồ và lưới kinh vĩ 2°.
  - Viền nước nông quanh bờ.
  - Đất các nước láng giềng màu giấy dó, kèm biên giới, nhãn Lào, Campuchia, Thái Lan và hồ Tonlé Sap. Nguồn là `regional-geometry.js`, dùng đúng tệp và phiên bản `preview-5.js` nạp cho bản đồ.
- Lớp Việt Nam:
  - 34 tỉnh tô xanh chuyển sắc, có bóng đổ và đường bờ biển sẫm.
  - Sông lớn lấy từ `hydrology-data.js`, nạp qua `GoiVietNaturalCore.load`.
- Đảo: các quần đảo Hoàng Sa và Trường Sa có đủ đảo và rạn, viền nét đứt và nhãn.
- Đường sắt Bắc–Nam có nền sẫm và tà vẹt màu kem.
- Minh họa của bản đồ chính (`landmark-assets.js`):
  - Tháp Rùa cạnh ga Hà Nội.
  - Ngọ Môn cạnh ga Huế.
  - Chợ Bến Thành cạnh ga TP.HCM.
  - Thuyền buồm đỏ trên Biển Đông.
- La bàn có chữ B (Bắc).
- Ghim ga là đĩa đỏ có sao vàng, nhãn "Ga Hà Nội".
- Bảng ga nổi trên vùng biển phía đông. Các nút "Chơi thẻ" và "Đọc sách" xếp dọc.
- Tàu nhỏ dừng ngay cạnh ga, nên sao và tên ga vẫn nhìn thấy.

**Đầu máy.** Thanh ga, tàu trên bản đồ và biểu tượng ga cuối dùng chung đầu máy hơi nước đỏ son – vàng đồng của trang chủ: ống khói, mũi gạt, ngôi sao, làn hơi. Đầu máy quay đầu theo chiều chạy và cao gấp đôi bản cũ. Khi bấm "Lên tàu", đầu máy chạy khỏi thanh ga.

**Hiệu năng lúc mở.** Bản đầu tìm vị trí 3 ga trên đường ray bằng 1.800 lần gọi `getPointAtLength`, tốn khoảng 200 ms (theo hồ sơ CPU). Bản này đo đúng độ dài đường cong cắt tại từng ga, chỉ 2 phép đo. Lần mở đầu tiên đo trên 10 trang mới, ở 1366 × 768:

- `open()` có trung vị 59 ms, cao nhất 87 ms. Trước khi sửa là 258–306 ms trên 2 lần lấy hồ sơ.
- Không có tác vụ dài nào khác do sổ tay gây ra.
- Dữ liệu địa lý vùng đã được phần chuẩn bị bản đồ nạp sẵn trong cả 20 lần đo (10 lần mở sau 3 giây, 10 lần mở ngay).

### Tệp của bản 2

| Tệp | Thay đổi |
| --- | --- |
| [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html) | Viết lại markup `#soTayDialog`: đầu trang một hàng, danh sách việc, lớp minh họa bản đồ, chân trang mới; đổi `?v=` của 2 tệp sổ tay |
| [so-tay-5.js](../../assets/goi-viet/map-surroundings-preview/so-tay-5.js) | Bản đồ nhiều lớp và khớp khung, nạp địa lý và sông, danh sách việc kèm viền vàng, đầu máy, tính độ dài ga |
| [so-tay-5.css](../../assets/goi-viet/map-surroundings-preview/so-tay-5.css) | Thang chữ theo vh, bố cục hai vùng, bảng màu bản đồ sáng và tối, viền vàng, khổ 4:3 và màn hẹp |
| [i18n-ui-5.js](../../assets/goi-viet/map-surroundings-preview/i18n-ui-5.js) | Khóa `sotay.*` mới (việc cần làm, nhãn nước, la bàn); bỏ khóa chip, vé, "Thử ngay", ô chờ; rút gọn chữ ga cuối |
| [check-so-tay-5.cjs](../../tools/check-so-tay-5.cjs) | Kiểm thêm: lớp địa lý, sông, danh thắng; danh sách việc và viền vàng từng bước; cỡ chữ cho máy chiếu; cột không phải cuộn |
| [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | Dựng lại (646 tài nguyên) |

### Kiểm tra bản 2

Chạy trên Windows 11, Chrome thật, ngày 27/11/2026.

| Bộ kiểm | Kết quả |
| --- | --- |
| `node tools/check-so-tay-5.cjs` | **25/25 đạt** (thêm mục cỡ chữ; mục bản đồ kiểm thêm địa lý vùng, sông, hồ, nhãn nước, minh họa, la bàn; mọi ga kiểm danh sách việc và viền vàng; cột chữ và bảng ga không phải cuộn ở 1366 × 768). Ảnh trong `verification/so-tay-5/` |
| `node tools/check-arrival-demo-5.cjs --preview-5` | 61/61 đạt, kể cả ca hiệu năng C (1366 và 1920: không có tác vụ dài, khung hình trung vị 16,7 ms) |
| `node tools/check-family-voyage-5.cjs` | Đạt (11 nhóm) |
| `node tools/check-station-panel-5.cjs` | Đạt |
| `node tools/verify-preview5-conversation-cards.cjs` | Đạt |
| `node tools/check-books-5.cjs` | Đạt (cảnh báo có sẵn `example.org`) |
| `node tools/check-i18n-5.cjs` | Đạt (346 khóa markup có EN; 271 khóa trong mã có VI/EN) |
| `python tools/build-preview-5-offline.py --check` | Đạt (646 tài nguyên). Trên Windows, trình dựng ghi chính tệp manifest với CRLF; đã chuyển về LF để khớp `.gitattributes` |
| `git diff --check` | Đạt |

Ngoài bộ kiểm, đã xem ảnh từng ga ở 1280 × 720, 1366 × 768, 1536 × 864, 1920 × 1080 (VI, theme sáng), 1366 × 768 (EN, theme tối) và 390 × 844.

## Chưa làm (giai đoạn sau)

- Giai đoạn 2: nút "?" trên bản đồ để mở lại sổ tay; gợi ý đúng lúc ở lần đầu mở bộ thẻ và lần đầu tới quần đảo.
- Giai đoạn 3 (nếu cần cho buổi thuyết trình): chế độ tự chạy có nút dừng.
- Chưa thử với người xem thật; chưa nghiệm thu riêng Firefox/Safari. Các phép kiểm dùng Chrome trên Windows.

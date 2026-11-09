# Báo cáo P5-01 — Khung sách với nội dung giữ chỗ (kèm demo Hà Nội)

- **Ngày** 09/11/2026 · theo [plan.md](plan.md) mục P5-01.
- **Trạng thái** Hoàn thành, **chưa commit**. Mọi điều kiện qua bước đều đạt (mục 6). Sau đó Codex sửa giao diện sách theo yêu cầu người dùng; đã kiểm tra lại toàn bộ, kết quả ở **mục 10**.
- **Bằng chứng** `verification/p5-books/` (thư mục bị `.gitignore` bỏ qua).

## 1. Tóm tắt

| Hạng mục | Kết quả |
| --- | --- |
| Lõi song ngữ tối thiểu | `i18n-5.js`: `t()`, `?lang=vi\|en`, ghi nhớ lựa chọn, sự kiện đổi ngôn ngữ, từ điển cho trình đọc. Giao diện cũ chưa chuyển (để P5-03). |
| Trình đọc sách | Lật trang 3D, 2 trang khi màn rộng, 1 trang khi hẹp. Có mục lục, Đọc chữ lớn (chỉnh cỡ chữ), phím ←/→ và Escape, nhớ trang trong phiên, giảm chuyển động, trang chờ "Sắp có", trạng thái lỗi. |
| 7 bố cục | `cover`, `opener`, `art-text` (`top`/`side`), `text-quote`, `full-art`, `notes`, `back`, mô tả chung trong `layouts-5.js`. |
| Demo Hà Nội | 26 trang trong 8 phần, kèm bìa trước và bìa sau. Chữ lấy từ bản thảo, tranh cắt từ bản thảo. **Font theo hệ thống:** tiêu đề Playfair Display, chữ Be Vietnam Pro, thay cho Times New Roman của bản tham chiếu. |
| Tập mẫu và 3 tập nháp | `_mau` dùng đủ 7 bố cục, có chữ hướng dẫn VI/EN. `hue`, `hcm`, `th` tạo từ mẫu, chưa có tranh nên hiện khung giữ chỗ. |
| Hướng dẫn nhập nội dung | `books-5/_mau/HUONG-DAN-NHAP-NOI-DUNG.md`, có bảng giới hạn chữ đã đo. |
| Công cụ kiểm tra | `tools/check-books-5.cjs` kiểm tĩnh. Thêm `--render` để dựng thật từng trang hai ngôn ngữ và báo tràn chữ. |

## 2. Cách xem ngay

1. Chạy `node tools/perf/server.cjs`, mở `http://127.0.0.1:8770/map-surroundings-preview-5.html?sach=nhap`. Mở thẳng tệp HTML cũng được, đã thử bằng `file://`.
2. Vào bản đồ, chọn **Hà Nội**, bấm **📖 Đọc sách (thử nghiệm)** trong khung ga. Thêm `&lang=en` để xem khung trình đọc bằng tiếng Anh.
3. Không có `?sach=nhap` thì mọi tỉnh đều hiện trang **Sắp có**: cả 4 tập đang `draft`, và chưa có nút xem thử. Nút công khai "Chơi thẻ / Đọc sách" thuộc P5-02.

> *Cập nhật sau P5-01:* khung ga mới của Codex đã có nút **Đọc sách** công khai. Nút này mở sách nháp khi có `?sach=nhap`, và mở trang **Sắp có** khi không có, nên nút "Đọc sách (thử nghiệm)" ở bước 2 không còn hiện.

## 3. Tệp mới và tệp sửa

| Tệp | Nội dung |
| --- | --- |
| `assets/goi-viet/map-surroundings-preview/i18n-5.js` | Lõi song ngữ và từ điển trình đọc (VI/EN). |
| `assets/goi-viet/books-5/layouts-5.js` | Bố cục: tỉ lệ ô tranh, ô chữ, giới hạn ký tự. |
| `assets/goi-viet/books-5/catalog-5.js` | Danh mục: `hn`, `hue`, `hcm`, `th` ở trạng thái `draft`. |
| `assets/goi-viet/books-5/book-reader-5.js`, `book-reader-5.css` | Trình đọc. |
| `assets/goi-viet/books-5/hn/` | `book.js` demo, 24 tranh WebP, `art-crops.json` (tọa độ cắt). |
| `assets/goi-viet/books-5/{hue,hcm,th}/book.js` | Tập nháp từ mẫu. |
| `assets/goi-viet/books-5/_mau/` | Tập mẫu và hướng dẫn nhập. |
| `tools/check-books-5.cjs` | Kiểm tra nội dung. |
| `map-surroundings-preview-5.html` | 4 chỗ (mục 7). |
| `plan.md` | Cập nhật dòng trạng thái và thêm `layouts-5.js` vào bảng tệp. |

Script dựng và kiểm thử nằm trong `verification/p5-books/scripts/`:
- Dựng demo: `crop-hn-demo-art.py`, `build-hn-demo.cjs`, `make-draft-books.cjs`.
- Đo giới hạn chữ: `measure-limits.cjs`.
- Kiểm thử: `verify-p5-01.cjs`, `shoot-book-p5.cjs`, `check-file-url.cjs`.

## 4. Demo Hà Nội

- **Chữ** lấy nguyên từ bản thảo "Hà Nội – Mùa ký ức chưa kịp phai" (12 trang đôi). Chữ mỗi trang đôi được chia vào hai trang theo dung lượng bố cục.
  - Câu trích nằm giữa mạch truyện giữ đúng vị trí, hiện trong khung màu nhạt.
  - Lá thư của Linh (trang đôi 10) được dàn thành một trang tranh và một trang thư.
- **Tranh**: 24 vùng tranh không chữ cắt từ 13 ảnh bản thảo, gồm bìa và 23 tranh trang.
  - Cách cắt: ước khung trên lưới tọa độ, rồi cho script tự bám mép tranh.
  - Đã soát bằng mắt: không dính chữ, lề giấy hay gáy sách.
  - Chữ nằm trong cảnh như biển "HÀNG BẠC", "TRIỂN LÃM KÝ ỨC HÀ NỘI" là một phần của tranh nên giữ nguyên.
- **Giới hạn của demo**:
  - Tranh cắt chỉ rộng 294–875 px, nên mờ trên màn lớn. Công cụ kiểm tra báo cảnh báo "cạnh dài < 1200 px" và "chưa có bản nét". Bản chính thức cần tranh không chữ ở độ phân giải cao.
  - Chưa có bản tiếng Anh. Xem với `lang=en` sẽ hiện tiếng Việt kèm nhãn "English version in progress".
  - Trang ghi chú chưa có nguồn tư liệu và nói rõ truyện là hư cấu.
  - Chưa nối `cardIds` với lá bài nào, vì chưa đối chiếu nội dung.
- **Phong cách** theo bản tham chiếu: bìa xanh có khung vàng kép, giấy kem, gáy sách, dòng đầu trang có logo, nhãn chương đỏ, con dấu "HÀ NỘI", số trang có đường trang trí. Toàn bộ chữ đổi sang font của hệ thống.

## 5. Giới hạn chữ đã đo

Ký tự kể cả khoảng trắng, khổ trang 600 px (mọi kích thước trong trang tỉ lệ theo bề rộng nên không phụ thuộc màn hình), font nhúng của trang (`verification/p5-books/limits.json`):

| Ô chữ | VI vừa ở 100 % | EN vừa ở 100 % | Giới hạn đặt trong `layouts-5.js` |
| --- | --- | --- | --- |
| `opener.body` | 718 | 723 | 700 |
| `art-text` top · `body` | 793 | 811 | 780 |
| `art-text` side · `body` | 886 | 915 | 870 |
| `text-quote.body` (kèm câu trích ngắn) | 1504 | 1521 | 1450 |
| `text-quote.quote` | 618 | 659 | 240 (quy ước để câu trích ngắn) |
| `full-art.caption` | 194 | 211 | 190 |
| `notes.body` (chưa tính danh sách nguồn) | 1696 | 1684 | 1200 (chừa chỗ cho nguồn) |

Khi chữ hơi dài, trình đọc tự co tới 86 %. Quá mức đó, trang bị đánh dấu tràn và lệnh `--render` báo lỗi.

## 6. Điều kiện qua bước

`verify-p5-01.cjs`: **20/20 ca đạt** (`verification/p5-books/p5-01-verify.json`).

| Điều kiện trong plan | Kết quả |
| --- | --- |
| Chưa mở sách thì 0 yêu cầu tới `books-5/<mã tỉnh>/` | **Đạt**, có và không có `?sach=nhap`. Lúc vào bản đồ trang chỉ tải 4 tệp chung của trình đọc. |
| `?sach=nhap` mở được 4 tập nháp, đủ 7 bố cục; không có cờ thì hiện trang chờ | **Đạt**. Không có cờ: `hn`, `hue`, `hcm`, `th`, `dn`, `hoang-sa` đều hiện trang chờ, không có nút xem thử. |
| Chép `_mau`, thay chữ và tranh, hiển thị đúng mà không sửa code | **Đạt**. Tập thử trong `verification/p5-books/test-book/` mở được chỉ bằng một dòng danh mục, hiện đúng chữ và tranh đã thay. |
| `?lang=en` giữ đúng trang và số trang | **Đạt**. Đổi VI→EN khi đang ở trang 9–10/26 vẫn giữ trang 9–10/26; khung trình đọc sang tiếng Anh. |
| Công cụ kiểm tra bắt lỗi cố ý | **Đạt**. Tập lỗi `test-broken` (xét như `published`) báo 18 lỗi: sai kích thước khai báo, thiếu tệp tranh, id trùng, bố cục lạ, mã lá bài không có thật, chữ quá dài, thiếu EN, tranh lệch tỉ lệ. Lệnh trả mã 1. |
| Bản đồ dừng vẽ khi sách mở; đóng rồi mở lại vẫn dùng được | **Đạt**. Sách mở thì 0 lần vẽ bản đồ dù camera đổi, bản đồ bị `inert`. Đóng sách thì bản đồ vẽ tiếp. Mở/đóng 6 lần liên tiếp vẫn ổn. |
| Thêm: giảm chuyển động, màn hẹp, không lỗi trang | **Đạt**. Lật trang tức thì; ở 820×1100 chuyển sang 1 trang; 0 lỗi trang. |

**`check-books-5.cjs --render`:**
- Cả 5 tập (gồm `_mau`), hai ngôn ngữ: **0 trang tràn chữ**.
- Hà Nội: 2 trang phải co chữ ở VI (93 %, 97 %), 5 trang ở EN. Ở EN các trang Hà Nội đang hiện tiếng Việt kèm dòng nhãn, nên tốn thêm chỗ.
- Kiểm tĩnh: 0 lỗi. Các cảnh báo đều đúng với nội dung đang soạn: thiếu EN, thiếu tranh, tranh demo độ phân giải thấp, nguồn còn là ví dụ.

## 7. Thay đổi trong `map-surroundings-preview-5.html`

1. Thêm 1 stylesheet và 4 script `defer` của trình đọc, ngay sau tệp thẻ bài.
2. `getTopOpenModalElement()`: thêm `bookModal` vào danh sách, đặt trước `deckModal`, để bản đồ dừng vẽ, nền bị khóa và Tab bị giữ trong sách.
3. `syncBackgroundInertAndRenderState()`: thêm `bookModal` vào danh sách bị khóa khi hộp "Bắt đầu hành trình mới?" mở.
4. Phím Escape toàn trang: thêm nhánh đóng sách, trước nhánh đóng bộ thẻ.

Ngoài 4 chỗ này, không đụng tệp dùng chung nào.

## 8. Hồi quy và chi phí tải

- **Bộ test thẻ**: Đạt (`verification/p5-books/cards-p5-01/`).
- **Ca chức năng GĐ6** (bản mốc P5-00 so với preview-5 sau P5-01): **không khác biệt**, 0 lỗi mỗi bên (`gd6-functional-p5-01.json`).
- **Tải lúc mở trang:** thêm 5 yêu cầu, khoảng 75 KB (khoảng 22 KB gzip):

  | Tệp | Gzip |
  | --- | --- |
  | `book-reader-5.js` | 11,3 KB |
  | `book-reader-5.css` | 5,9 KB |
  | `i18n-5.js` | 2,8 KB |
  | `layouts-5.js` | 1,2 KB |
  | `catalog-5.js` | 0,5 KB |

- **Khi mở sách Hà Nội:** `book.js` 7,6 KB gzip, cộng tranh của trang đang xem và các trang kề (tối đa 4 tranh tải trước). Cả 24 tranh demo tổng 1,6 MB.
- Chưa chạy phép so hiệu năng A/B. Plan để việc này ở P5-05.

## 9. Còn lại và lưu ý

- **Thuộc P5-02:** nút công khai Chơi thẻ / Đọc sách, sửa lỗi mở nhầm bộ thẻ, ghi dấu "đã khám phá" khi đọc sách, link fanpage và QR ở trang chờ.
- **Thuộc P5-03:** tên tỉnh trên trang chờ và bìa sau vẫn là tiếng Việt ("TP. Đà Nẵng") ngay cả khi `lang=en`.
- **Màn 1366×768:** chữ trong trang sách khoảng 11 px; đã thu gọn thanh trên để trang to hơn. Muốn đọc thoải mái thì dùng **Đọc chữ lớn**. Màn 1080p (máy chiếu) là ưu tiên chính và đọc tốt.
- **Cảnh báo `aria-hidden`:** trình duyệt báo một cảnh báo khi mở sách từ nút trong khung ga, vì bản đồ bị đặt `aria-hidden` trong lúc nút còn giữ tiêu điểm khoảng 30 ms. Đây là cách hệ cửa sổ hiện có vận hành, mở bộ thẻ từ panel cũng vậy, nên chưa sửa.

## 10. Kiểm tra lại sau khi Codex sửa giao diện (09/11, 13:40–15:56)

**Codex đã thay đổi** (theo yêu cầu của người dùng):

| Hạng mục | Thay đổi |
| --- | --- |
| Bản tiếng Việt của Hà Nội | Thêm `editions.vi`: 12 ảnh trang đôi từ bản thảo (`hn/edition-vi/01–12.webp`, 1536×1024, tổng 5,8 MB) thay cho 24 trang HTML khi đọc bằng tiếng Việt. Trang HTML vẫn dùng cho Đọc chữ lớn, trình đọc màn hình và bản tiếng Anh. Ảnh `edition-vi/cover.webp` có trong thư mục nhưng `book.js` không khai báo, nên trình đọc không dùng. |
| Cấu trúc tập Hà Nội | Bỏ trang tranh mở đầu để 24 trang truyện khớp đúng 12 ảnh. Thêm trang tranh khép sách ở phần cuối (kiểu `colophon`). Vẫn 26 trang. |
| Bìa | Bìa vải (`cover.style: 'linen'`), tranh bìa mới `art/cover-lake-v2.webp` (1440×1080). Ảnh gáy sách `art/open-binding-v2.webp` được dùng khi mở trang đôi. Bìa sau có tranh (`back.art`). |
| Trình đọc | Thêm thanh kéo vị trí trang, dải chương ở chân cửa sổ, nút mũi tên tròn hai bên. Vị trí đọc được lưu lại giữa các lần mở trang (localStorage, có bọc try/catch). |
| Tệp sửa | `book-reader-5.js`, `book-reader-5.css`, `i18n-5.js`, `hn/book.js`, `catalog-5.js` (`v` tăng), `check-books-5.cjs` (thêm kiểm tra `editions`), và số phiên bản trong các thẻ nạp của `preview-5.html`. |

**Kết quả kiểm tra lại trên bản hiện tại:**

| Kiểm tra | Kết quả |
| --- | --- |
| Điều kiện qua bước (`verify-p5-01.cjs`) | **20/20 đạt** |
| `check-books-5.cjs` | 0 lỗi; cảnh báo đúng như nội dung đang soạn |
| `check-books-5.cjs --render` | 0 trang tràn chữ ở cả 5 tập, hai ngôn ngữ. Tỉ lệ co chữ trùng khớp lần đo trước, nên kiểu chữ trang HTML không đổi và giới hạn ở mục 5 vẫn đúng. |
| Bộ test thẻ | Đạt (`verification/p5-books/cards-after-codex/`) |
| Ca chức năng GĐ6 so với bản mốc | Không khác biệt, 0 lỗi (`gd6-functional-after-codex.json`) |
| Chưa mở sách | 0 yêu cầu tới dữ liệu sách |
| Ảnh chụp | `verification/p5-books/book-shots-after-codex/` (1920×1080, VI và EN) |

**Cần lưu ý với cách hiện bằng ảnh trang (bản tiếng Việt):**
- **Font:** chữ trong trang tiếng Việt là chữ in sẵn trong ảnh bản thảo (kiểu chữ có chân), không phải font của web. Bìa, khung trình đọc, Đọc chữ lớn và bản tiếng Anh vẫn dùng Playfair Display / Be Vietnam Pro.
- **Dung lượng:** đọc hết tập bằng tiếng Việt tải khoảng 8,1 MB (38 tệp); bằng tiếng Anh khoảng 2,3 MB (26 tệp). Trình đọc vẫn chỉ tải trước tối đa các trang kề.
- **Độ nét:** ảnh trang đôi rộng 1536 px, vừa với máy chiếu 1080p nhưng sẽ mờ trên màn 4K.
- **Hai bản phải sửa cùng nhau:** sửa chữ thì phải sửa cả ảnh và `book.js`. Bản tiếng Anh sẽ trông khác bản tiếng Việt, trừ khi làm thêm `editions.en`. Hướng dẫn nhập nội dung đã bổ sung mục 8 về các trường này.

**Kiểm tra lần hai (23:00), sau khi Codex làm thêm khung ga mới** (`station-panel-5.*`; đây là việc riêng, không thuộc P5-01):

| Kiểm tra | Kết quả |
| --- | --- |
| Điều kiện qua bước P5-01 | **20/20 đạt** |
| `check-books-5.cjs --render` | 0 lỗi, 0 trang tràn chữ ở 5 tập, hai ngôn ngữ |
| Bộ test thẻ | Đạt (`verification/p5-books/cards-final/`) |
| `tools/check-station-panel-5.cjs` (của Codex) | PASS |
| Ca chức năng GĐ6 so với bản mốc | 0 lỗi. Có khác biệt nhưng đều do khung ga mới thay đổi có chủ đích: bộ lọc chủ đề bị bỏ, câu báo "không tìm thấy" đổi lời, ga được chọn luôn nằm trong vùng nhìn thấy, Escape nay bỏ chọn địa danh (`gd6-functional-final.json`). |

## 11. Nâng độ nét tranh Hà Nội (sau P5-01)

Mục tiêu: các trang HTML (bản tiếng Anh, Đọc chữ lớn, và bản tiếng Việt khi bỏ `editions.vi` về sau) có tranh đủ nét cho máy chiếu và màn 4K, mà vẫn giữ đúng nét vẽ của bản thảo.

- **Công cụ:** Real-ESRGAN `realesrgan-ncnn-vulkan-20220424-windows.zip` (45.474.481 byte, SHA-256 `abc02804…802d`, BSD-3, bản phát hành chính thức v0.2.5.0). Tải vào thư mục tạm của phiên, ngoài dự án; không đưa vào repo.
- **Đầu vào:** 24 vùng tranh cắt lại từ ảnh PNG gốc không nén (cùng tọa độ trong `hn/art-crops.json`), không lấy từ bản WebP cũ, để khỏi phóng to cả lỗi nén.
- **Chọn mô hình:** đã thử cả `realesrgan-x4plus-anime` và `realesrgan-x4plus` trên 3 tranh mẫu.
  - Bản `anime` sạch nhưng làm mất chất giấy màu nước, tô đậm nét viền và làm hoa văn bát bạc trông kiểu hoạt hình.
  - Bản `x4plus` giữ vân vải, hoa văn chạm và màu gần gốc. **Chọn `x4plus`**, phóng to 4 lần.
- **Xuất tệp:**
  - Bản thường có cạnh dài tối đa 1600 px (Lanczos, WebP chất lượng 86). Kết quả 1176–1600 px, trước đây là 294–875 px.
  - 9 tranh có thêm bản nét `@2x`, cạnh dài khoảng 2650–3200 px. Các tranh dọc không có bản này vì bản phóng to không lớn hơn bản thường đủ nhiều.
  - Bộ tranh thường tổng 5,5 MB (trước 1,6 MB); bản nét 3,3 MB, chỉ tải trên màn có mật độ điểm ảnh cao.
- **Dữ liệu:** `hn/book.js` chỉ đổi `w`, `h` và thêm `hi` cho 24 mục tranh. Đã kiểm chứng phần còn lại không đổi (script `verification/p5-books/scripts/patch-hn-art-sizes.cjs`). `catalog-5.js` tăng `v` của tập Hà Nội.
- **Kiểm tra:**
  - `check-books-5.cjs`: 0 lỗi. Cảnh báo của tập Hà Nội giảm từ 126 xuống 93, phần còn lại chủ yếu là thiếu tiếng Anh. Còn một tranh dưới 1200 px là `s11-hands` (1176 px).
  - `--render`: 0 trang tràn chữ.
  - Ảnh so trước/sau: `verification/p5-books/` gồm `compare.jpg` (bicubic so với anime) và `compare-models.jpg` (bicubic, anime, x4plus).
  - Ảnh chụp trang tiếng Anh: `verification/p5-books/book-shots-hd/`.
- **Còn lại:** bản tiếng Việt hiện vẫn hiện ảnh trang đôi gốc (`editions.vi`, 1536 px). Tranh mới chỉ thấy ở trang HTML cho đến khi bỏ `editions.vi`, sau khi bạn soát so sánh (bước 4 của hướng đề xuất).

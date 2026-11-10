# Hướng dẫn nhập nội dung sách văn hóa (preview-5)

Tài liệu cho nhóm nội dung khi đưa một tập sách vào web. Khung sách (trình đọc, bố cục, kiểm tra) đã có sẵn; một tập chỉ là **dữ liệu**: một tệp `book.js` và một thư mục tranh. Không cần sửa code.

Nếu không quen sửa tệp `book.js`, nhóm có thể gửi chữ dạng văn bản thường (Word, Google Docs) theo đúng thứ tự trang và tên tranh trong mục 4; phía code sẽ chuyển vào `book.js`.

## 1. Một tập sách gồm những gì

| Tệp | Vai trò |
| --- | --- |
| `assets/goi-viet/books-5/catalog-5.js` | Danh mục: tỉnh nào có sách và trạng thái `draft` (nháp) hay `published` (xuất bản). |
| `assets/goi-viet/books-5/<mã tỉnh>/book.js` | Toàn bộ chữ của tập (VI và EN), thứ tự trang, tranh dùng ở trang nào, nguồn, ghi công. |
| `assets/goi-viet/books-5/<mã tỉnh>/art/` | Tranh của tập. |

Mã tỉnh dùng đúng mã trong bộ thẻ: Hà Nội `hn`, Huế `hue`, TP. Hồ Chí Minh `hcm`, Thanh Hóa `th`.

## 2. Quy trình đưa một tập lên

1. Chép cả thư mục `_mau` thành `books-5/<mã tỉnh>/`. Bốn tập `hn`, `hue`, `hcm`, `th` đã có sẵn thư mục.
2. Trong `book.js`, đổi `placeId` thành mã tỉnh, rồi thay chữ và tên tranh theo mục 3–5.
3. Bỏ tranh vào `art/`, khai báo trong `art: { … }` (mục 5).
4. Chạy kiểm tra: `node tools/check-books-5.cjs`. Thêm `--render` để dựng thử từng trang và báo trang tràn chữ (cần chạy `node tools/perf/server.cjs` ở cửa sổ khác).
5. Xem bản nháp: mở `map-surroundings-preview-5.html?sach=nhap`, chọn tỉnh, bấm nút **Đọc sách** trong khung ga. Thêm `&lang=en` để xem bản tiếng Anh. Không có `?sach=nhap` thì nút này mở trang **Sắp có** cho tập còn ở trạng thái nháp.
6. Khi tập đủ VI **và** EN và lệnh kiểm tra không còn lỗi, đổi `status: 'draft'` thành `'published'` trong `catalog-5.js` và tăng `v` (ví dụ `'20261120-1'`) để trình duyệt tải bản mới. Tập `published` mới hiện cho người xem bình thường; tỉnh chưa xuất bản hiện trang **Sắp có**.

## 3. Cấu trúc `book.js`

```js
GoiVietBooks.register({
  placeId: 'th',
  kind: 'fiction',                 // fiction (truyện hư cấu) | documentary (tư liệu) | community (chuyện cộng đồng)
  title:       { vi: 'Thanh Hóa – Tên tập', en: 'Thanh Hoa – Book title' },
  subtitle:    { vi: '…', en: '…' },
  runningHead: { vi: 'Thanh Hóa · Tên ngắn', en: '…' },   // dòng nhỏ đầu mỗi trang
  stamp:       { vi: 'Thanh Hóa', en: 'Thanh Hoa' },       // con dấu đỏ trên bìa và trang mở phần
  cover: { art: 'bia' },
  back:  { text: { vi: ['Dòng 1', 'Dòng 2'], en: ['Line 1', 'Line 2'] } },
  art: { 'bia': { file: 'art/bia.webp', hi: 'art/bia@2x.webp', w: 1600, h: 1520, alt: { vi: '…', en: '…' } } },
  sections: [
    { id: 'th-s1', label: { vi: 'Chương 01', en: 'Chapter 01' }, title: { vi: '…', en: '…' }, cardIds: [],
      pages: [
        { id: 'th-p01', layout: 'opener', art: 'th-01', text: { vi: { heading: '…', body: ['đoạn 1', 'đoạn 2'] }, en: { … } } }
      ] }
  ],
  sources: [{ id: 's1', title: { vi: '…', en: '…' }, publisher: { vi: '…', en: '…' }, url: 'https://…' }],
  credits: [{ role: { vi: 'Lời', en: 'Text' }, name: '…' }]
});
```

- Mỗi `id` (phần, trang) phải khác nhau trong tập.
- Chữ luôn có hai ngôn ngữ dùng **chung một cấu trúc trang**: cùng số trang, cùng tranh, chỉ khác chữ. Khi đổi ngôn ngữ, người đọc ở nguyên trang.
- `body` là danh sách đoạn. Đoạn bắt đầu bằng `— ` hiện như lời thoại; đoạn bắt đầu bằng dấu ngoặc kép `“` hiện trong khung trích màu nhạt, giữ nguyên vị trí trong mạch truyện.
- `heading` là câu in đậm đầu trang (không bắt buộc).
- `cardIds` chỉ điền khi nội dung phần đó khớp đúng câu hỏi của lá bài (ví dụ `['th-c1']`); nếu chỉ cùng tỉnh thì để trống. Khi có, nút **Mở sách** trên lá bài đó mở thẳng tới phần này; khi trống, sách mở ở trang người đọc dừng lần trước.
- Tư liệu sẵn có cho Hà Nội, Huế, TP. Hồ Chí Minh: 12 câu chuyện đã thẩm định (kèm nguồn và mã lá bài liên quan) chép trong `TU-LIEU-TRUYEN-DA-THAM-DINH.md` cùng thư mục.

## 4. Bảy bố cục và giới hạn chữ

Trang sách tỉ lệ 3:4, hai trang thành một trang đôi. Mọi kích thước trong trang tỉ lệ theo bề rộng trang, nên giới hạn dưới đây đúng với mọi màn hình.

Giới hạn tính bằng **ký tự, kể cả khoảng trắng**, đo bằng đúng font của web (Be Vietnam Pro cho chữ, Playfair Display cho tiêu đề), lấy số nhỏ hơn của tiếng Việt và tiếng Anh. Khi chữ hơi dài, trình đọc tự co chữ tới 86 %. Quá mức đó trang bị báo **tràn chữ**.

| Bố cục (`layout`) | Dùng khi | Tranh | Giới hạn chữ |
| --- | --- | --- | --- |
| `cover` (bìa trước, khai báo ở `cover`) | Bìa | gần vuông, 1:1 | `title` 60 · `subtitle` 90 |
| `opener` | Mở đầu mỗi phần/chương: nhãn + tên phần lấy từ `sections` | dọc 4:5, bên trái | `heading` 60 · `body` 700 |
| `art-text` + `variant: 'top'` | Trang kể chuyện thường | ngang 3:2, phía trên | `heading` 70 · `body` 780 |
| `art-text` + `variant: 'side'` | Trang kể chuyện nhiều chữ hơn | dọc 4:5, bên trái | `heading` 60 · `body` 870 |
| `text-quote` | Trang chữ, có thể khép bằng một câu trích lớn | không | `heading` 70 · `body` 1450 · `quote` 240 |
| `full-art` | Tranh trọn trang | tỉ lệ tự do, không bị cắt | `caption` 190 |
| `notes` | Ghi chú văn hóa có nguồn, ghi công | không | `heading` 70 · `body` 1200 (để chỗ cho danh sách nguồn) |
| `back` (bìa sau, khai báo ở `back`) | Bìa sau, có nút **Chơi thẻ** | không | `text` 120 (2–3 dòng) |

Lưu ý khi viết:
- Nhiều đoạn ngắn hoặc nhiều lời thoại chiếm chỗ hơn một đoạn dài cùng số ký tự. Lệnh `--render` là phép kiểm cuối cùng.
- Tên phần dài 3 dòng sẽ lấy bớt chỗ của chữ trong trang `opener`.
- Một tập Hà Nội tham chiếu có khoảng 2.300 từ trên 24 trang, tức trung bình gần 100 từ một trang.

## 5. Tranh

- **Tranh không có chữ.** Chữ đặt bằng văn bản trên trang, nên tranh phải để trống, không vẽ chữ vào. Nếu dùng công cụ tạo ảnh, ghi rõ "không có chữ, không có tiêu đề". Chữ nằm sẵn trong cảnh (biển hiệu, tên phố) thì được.
- **Định dạng:** WebP (hoặc PNG/JPEG). Mỗi tranh có hai cỡ:
  - bản thường: cạnh dài khoảng 1600 px;
  - bản nét `@2x`: khoảng 3200 px, dùng cho màn hình 4K và khi phóng to.
  - Dưới 1200 px sẽ bị cảnh báo là mờ trên máy chiếu lớn.
- **Tỉ lệ theo ô:** vẽ đúng tỉ lệ trong bảng mục 4. Tranh lệch tỉ lệ vẫn hiện được nhưng bị cắt bớt mép. Có thể chỉ định phần giữ lại bằng `focus: '50% 30%'` (ngang, dọc).
- **Khai báo:** mỗi tranh khai báo trong `art`:

  ```js
  'th-01': { file: 'art/th-01.webp', hi: 'art/th-01@2x.webp', w: 1600, h: 2000, alt: { vi: 'Mô tả tranh', en: 'Picture description' } }
  ```

  `w` và `h` phải đúng kích thước tệp bản thường (lệnh kiểm tra sẽ đối chiếu). `alt` là mô tả cho người dùng trình đọc màn hình, bắt buộc cả hai ngôn ngữ khi xuất bản.
- **Đặt tên:** chữ thường, không dấu, nối bằng gạch ngang, ví dụ `th-chuong1-thanh-nha-ho.webp`.

## 6. Nguồn, ghi công và sự đồng ý

- **Tách bạch nội dung.** Phần hư cấu, tư liệu có nguồn và đóng góp cộng đồng phải tách bạch. Tư liệu đặt ở trang `notes`; mỗi ý có nguồn trong `sources` (đường dẫn `https://…`, tên bài, nơi đăng).
- **Ghi công.** `credits` ghi người viết, người vẽ, người dịch và giấy phép ảnh nếu có.
- **Xin phép trước khi xuất bản.** Lời kể hoặc ảnh do người khác gửi (qua fanpage) cần có sự đồng ý và cách ghi tên mà người đó chọn.

## 7. Lệnh kiểm tra báo gì

`node tools/check-books-5.cjs` in từng tập:
- **✗ lỗi**: luôn phải sửa. Gồm sai cấu trúc, id trùng, bố cục không tồn tại, thiếu tệp tranh, kích thước khai báo sai, mã lá bài không có thật.
- **! cảnh báo**: nội dung chưa đủ, như thiếu tiếng Anh, thiếu tranh, chữ quá giới hạn, tranh mờ. Với tập `draft` đây chỉ là nhắc việc. Với tập `published`, mọi cảnh báo nội dung đều tính là lỗi.
- **--render**: dựng thật từng trang hai ngôn ngữ và liệt kê trang tràn chữ hoặc phải co chữ.

## 8. Bản minh họa dựng sẵn và tùy chọn trang trí

Các trường dưới đây không bắt buộc; tập Hà Nội đang dùng cả bốn.

**`editions`: thay trang HTML bằng ảnh trang đôi đã dàn sẵn (chữ in trong ảnh), riêng cho từng ngôn ngữ.**

```js
editions: {
  vi: { trimMatte: true, spreads: ['edition-vi/01.webp', 'edition-vi/02.webp' /* … */] /*, cover: 'edition-vi/cover.webp' */ }
}
```

- **Cách ghép ảnh với trang:** ảnh thứ *k* trong `spreads` thay cho trang HTML thứ 2k−1 và 2k (trang đôi thứ *k*). Trang không có ảnh vẫn hiện bản HTML, ví dụ trang ghi chú cuối sách.
- **Kích thước:** ảnh trang đôi tỉ lệ 3:2. Bản Hà Nội hiện dùng 1536×1024 px. `trimMatte` cắt lề giấy của ảnh để ghép vào bìa sách.
- **Chữ trong ảnh phải trùng với chữ trong `pages`.** Trang HTML vẫn là nguồn chữ cho Đọc chữ lớn, trình đọc màn hình và ngôn ngữ chưa có bản ảnh. Sửa một chữ thì phải sửa cả `book.js` lẫn xuất lại ảnh.
- **Ngôn ngữ không có `editions`** (ví dụ `en`) hiện trang HTML, nên hai ngôn ngữ trông khác nhau.
- **Lệnh kiểm tra:** `tools/check-books-5.cjs` kiểm tra tệp ảnh có tồn tại và số trang đôi không vượt số trang chữ.

**Các tùy chọn trang trí khác:**
- `cover: { art: '…', style: 'linen' }`: bìa trước và bìa sau kiểu bìa vải. Không ghi `style` thì dùng bìa xanh khung vàng mặc định.
- `back: { art: '…', text: { … } }`: thêm một tranh ngang (tỉ lệ khoảng 2,3:1) trên bìa sau.
- `sections[i].style: 'colophon'`: phần cuối sách (ghi chú, tranh khép) dùng kiểu tờ lót. Trang `full-art` trong phần này có thêm tiêu đề kết sách.

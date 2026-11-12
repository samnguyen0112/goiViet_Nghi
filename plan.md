# Gói Việt preview-5 — Kế hoạch song ngữ, hai chế độ và khung sách văn hóa

- **Ngày lập** 09/11/2026 (Codex). **Sửa lần 2** cùng ngày (Claude): làm **khung sách trước, nội dung và tranh nhập sau**; áp dụng các góp ý review (tranh không chữ, dịch thẻ theo mẫu, danh sách tệp cần tách, nội dung là đường găng, nghiệm thu gọn, URL fanpage).
- **Trạng thái** P5-00 đã làm ([BAO-CAO-P5-00.md](BAO-CAO-P5-00.md)); P5-01 đã làm ([BAO-CAO-P5-01.md](BAO-CAO-P5-01.md)); P5-02 đã làm ([BAO-CAO-P5-02.md](BAO-CAO-P5-02.md)); P5-03: rà soát ngày 10/11, lát 1 (khung song ngữ), lát 2 (tệp dùng chung) và lát 3 (nội dung tiếng Anh) đã làm ngày 11/11, kèm một vòng sửa sau duyệt: bố cục tiếng Anh, sách giữ bản minh họa, đổi ngôn ngữ trong hộp thoại, khóa bản dịch lỗi thời ([BAO-CAO-P5-03.md](BAO-CAO-P5-03.md)); nhóm còn duyệt bản tiếng Anh và các chỗ sửa nội dung tiếng Việt. Khung dữ liệu sách chính thức nằm ở `assets/goi-viet/books-5/_mau/HUONG-DAN-NHAP-NOI-DUNG.md`; đoạn mã mẫu ở mục 2 chỉ là phác thảo ban đầu.
- **Bản triển khai và nghiệm thu** `map-surroundings-preview-5.html` và tài nguyên dành riêng cho bản 5.
- **Tham chiếu** `D:/Download/Goi-Viet-Ha-Noi.html`: chỉ tham chiếu **phong cách** sách (bìa xanh, giấy kem, gáy, dấu đỏ, ảnh xen chữ), không dùng làm định dạng sản xuất. `card-testing.html`: bộ thẻ.

## 0. Tóm tắt

| Bước | Kết quả | Người làm | Cỡ việc |
| --- | --- | --- | --- |
| P5-00 | Mốc gốc, cập nhật AGENTS.md | Code | Nhỏ |
| **P5-01** | **Khung sách chạy được với nội dung giữ chỗ**, hướng dẫn nhập nội dung, công cụ kiểm tra, lõi song ngữ tối thiểu | Code | Vừa–lớn |
| P5-02 | Hai chế độ tại ga, trang chờ, link fanpage và QR, sửa lỗi mở nhầm bộ thẻ | Code | Vừa |
| P5-03 | Song ngữ toàn website, chia 3 lát: khung song ngữ, tệp dùng chung, nội dung EN | Code, nhóm duyệt EN | Lớn |
| P5-04 | Nhập từng tập khi nhóm giao nội dung | Nhóm giao, Code nhập và kiểm | Nhỏ mỗi tập |
| P5-05 | Nghiệm thu gọn, bàn giao | Code | Nhỏ–vừa |
| **N (song song, bắt đầu ngay)** | Viết VI, tạo tranh không chữ, dịch EN cho 4 tập | Nhóm | **Lớn — đường găng** |

Cỡ việc là tương đối. Điền ngày cho từng bước khi chốt ngày thuyết trình.

**Bản tối thiểu cho buổi thuyết trình:** P5-00 → P5-02, phần mới viết bằng lõi song ngữ ngay từ đầu. Tập nào đủ nội dung thì xuất bản, tập chưa đủ hiện trang chờ. P5-03 đầy đủ là mục tiêu kế tiếp nếu còn thời gian.

## 1. Phạm vi đã chốt

| Yêu cầu | Kết quả cần bàn giao |
| --- | --- |
| Song ngữ toàn website | VI và EN dùng chung một phiên. Dịch giao diện, tên và tóm tắt địa phương, bộ thẻ, sách, thông báo và chữ hệ thống trên bưu thiếp. **Không dịch 132 câu chuyện demo** của 33 điểm chưa thẩm định (gồm cả Thanh Hóa) vì đường đọc công khai của chúng bị ẩn. |
| Hai chế độ theo điểm đến | Chọn tỉnh/thành hoặc đến ga đều tiếp cận được **Chơi thẻ** và **Đọc sách văn hóa**. Hành trình tàu vẫn có đường vào riêng. |
| Bốn tập sách mẫu | Hà Nội, Huế, TP. Hồ Chí Minh, Thanh Hóa. **Nội dung đang được nhóm soạn**, nên làm khung trước: mỗi tập có **một bộ tranh không chữ** và **chữ VI/EN là văn bản** đặt trên trang. Một trình đọc dùng cho 4 tập × 2 ngôn ngữ. |
| Điểm chưa có sách | 30 tỉnh thành và 2 quần đảo hiện **Sắp có / Coming soon** trong nhánh sách. Quần đảo dùng trang chờ của nhánh sách, tách khỏi màn thông tin địa lý của đảo. Cả 36 điểm vẫn có thẻ. |
| Fanpage | URL đã có và đã mở được ngày 09/11: `https://www.facebook.com/people/G%C3%B3i-Vi%E1%BB%87t/61594157551043/`. Khách chưa đăng nhập Facebook trên máy tính bị hộp đăng nhập che, nên **QR là kênh chính khi trình chiếu**, link chữ là kênh phụ. |

Mọi thay đổi chỉ gồm preview-5 và tài nguyên `-5`. Tệp dùng chung với bản khác phải tách thành bản `-5` trước khi sửa (danh sách ở P5-03). Lưu mốc Git và phát hành là thao tác riêng, cần người dùng cho phép.

### Hiện trạng dùng để lập kế hoạch (đã đối chiếu ngày 09/11)

- **Dữ liệu thẻ** của bản 5 giống hệt bản 3: 36 điểm, 144 thẻ, 432 lựa chọn, 144 lời giải, 432 lượt hoạt động, 60 câu hoạt động khác nhau. Ba ga mẫu là Hà Nội, Huế, TP. Hồ Chí Minh.
- **Nội dung sinh theo khuôn:** 132 câu hỏi của 33 điểm chưa thẩm định chỉ còn **8 mẫu câu** khi thay tên địa phương. Tổng chữ của bộ thẻ khoảng 17.500 từ: câu hỏi 3.854, lựa chọn 6.669, giải thích 5.065, 60 câu hoạt động 1.866. Nội dung Thanh Hóa chưa khớp nhau: thẻ ghi Thành nhà Hồ là "Khu di tích Quốc gia" trong khi câu chuyện cùng tỉnh ghi là Di sản Thế giới UNESCO, và câu chuyện mục *Nghệ thuật* lại viết về một tòa thành.
- **Hoạt động cần tranh:** 17 lượt (16 ngoài 4 tỉnh có sách) thực chất là **một câu hoạt động duy nhất** được dùng lại: "Cùng nhìn bức tranh minh họa trong câu chuyện…".
- **Lỗi có sẵn:** khi bấm Khám phá ở ga vừa đến, `explore()` trong `journey-system-4.js` mở câu chuyện rồi đặt lại `state.selectedPlaceId` thành ga đã chọn để đi tiếp. Sau đó `openDeckFromStory()` mở bộ thẻ theo biến này, nên mở nhầm bộ của ga kế tiếp.
- **Sách tham chiếu Hà Nội:** 1 bìa và 12 trang đôi là ảnh PNG 1536×1024, **chữ tiếng Việt in thẳng trong ảnh**, không có lớp tranh tách chữ. Tệp nặng 46,3 MB (33 MB ảnh). Nội dung gồm 7 phần, khoảng 2.280 từ trên 24 trang, trung bình gần 100 từ mỗi trang. Đây là bản nháp đang soạn.
- **Hạ tầng:** dự án nạp dữ liệu bằng `<script>`, không dùng `fetch`. Font nhúng sẵn trong HTML (Be Vietnam Pro, Playfair Display), nên chạy được offline và mở trực tiếp từ tệp.
- **Chuỗi tiếng Việt đang là khóa kỹ thuật:** chủ đề (`data-topic="Ẩm thực"`, regex trong `conversation-cards-5.js`), tên vùng (`MINERAL_PALETTE['Đồng bằng sông Hồng']` trong `webgl-terrain-renderer-3.js`). Không được dịch các trường này tại chỗ trong dữ liệu.
- **Hiệu năng lịch sử (GĐ6):** vào bản đồ ở CPU chậm 4 lần mở màn che sau 9,5 giây trên preview-5 so với 13,9 giây trên preview-4; byte tới cổng 13,53 → 9,60 MiB. Chỉ dùng tham khảo. Mốc nghiệm thu đợt này là **preview-5 trước thay đổi so với preview-5 ứng viên**. [Báo cáo GĐ6](BAO-CAO-GD6-PREVIEW-5.md)
- **Git** chưa theo dõi HTML preview-5 và một số tài nguyên bản này đang nạp. `AGENTS.md` vẫn ghi bản mặc định là preview-3.

## 2. Quy tắc trải nghiệm và dữ liệu

### Chọn ga, đọc và chơi

1. Bấm vùng bản đồ, ghim, kết quả tìm kiếm, hàng trong danh sách hoặc nút Khám phá sau khi tàu đến đều dẫn tới **hai lựa chọn**. Kéo, vuốt và zoom bản đồ vẫn tách biệt với thao tác chọn.
2. **Chơi thẻ** mở đúng bộ bài của ga nguồn. Giữ kiểu xòe, gom–xáo–chọn–rút, hai mặt, dấu sen, giải thích đáp án, hoạt động, đổi lượt, bản nháp và ghi kỷ niệm.
3. **Đọc sách** tra danh mục sách theo mã địa phương. Mọi lối cũ (ảnh ga, danh sách truyện, quẻ tre, gợi ý trên thẻ, nút cuối modal câu chuyện) đi qua **một hàm mở chung**. Trang chờ có nút Chơi thẻ và Quay lại. Chỉ ghi dấu đã mở khi đã hiển thị nội dung sách thật.
4. **Ga đang đọc**, **ga vừa đến** và **điểm đã chọn để đi tiếp** là ba trạng thái riêng. Nút Chơi thẻ trong sách lấy ga của chính cuốn sách. Mở sách từ lá bài rồi đóng thì quay về đúng lá và phần đang xem. Mở sách từ ga rồi đóng thì về khung ga và trả tiêu điểm về nút nguồn.
5. Chỉ liên kết lá bài tới mục sách khi nội dung khớp. Nếu chỉ cùng tỉnh thì dùng lời mời mở tập của tỉnh. Câu hoạt động "nhìn bức tranh minh họa trong câu chuyện" được **viết lại** để không phụ thuộc tranh, thay vì thêm tranh vào thẻ.

### Bản dịch và trạng thái

- **Một dữ liệu gốc** giữ mã tỉnh, ga, thẻ, chủ đề, liên kết, thứ tự lựa chọn, đáp án đúng, tọa độ và luật chơi. Chữ hiển thị được tra theo mã ổn định **lúc hiển thị**: từ điển giao diện và lớp phủ nội dung EN. Không ghi đè dữ liệu gốc.
- **Dịch thẻ theo nguồn gốc nội dung:**
  - 12 thẻ đã thẩm định của Hà Nội, Huế, TP. Hồ Chí Minh dịch tay.
  - 33 điểm còn lại dịch theo mẫu câu, cộng bảng tên riêng (tên điểm, vùng, món ăn, danh thắng, di sản). Số đo ngày 10/11 ở mục P5-03.
  - 60 câu hoạt động dịch một lần.
  - Sửa nội dung VI sai (đặc biệt Thanh Hóa) **trước** khi dịch; danh sách lỗi ở mục P5-03.
- **Khi đổi VI/EN**, giữ lựa chọn, mặt thẻ, dấu sen, trạng thái lời giải, lượt, nháp, ga, hành trình, kỷ niệm và trang sách đang đọc. Văn bản người dùng nhập giữ nguyên văn, kể cả khi xuất PNG.
- **Thứ tự chọn ngôn ngữ lúc mở:** `?lang=vi|en` trên URL, sau đó lựa chọn đã ghi nhớ (localStorage, bọc try/catch), cuối cùng là VI. Đồng bộ `html lang`, tiêu đề trang, nhãn, placeholder, thông báo trình đọc màn hình và phần đang mở.
- **Dịch máy** chỉ dùng tạo bản nháp. Bản phát hành lấy bản đã duyệt từ tài nguyên cục bộ. Trong bản nội bộ, chữ EN thiếu có thể hiện VI kèm nhãn rõ.
- **Tìm kiếm** nhận tên có dấu, không dấu, viết tắt và tên Anh thông dụng (Hanoi, Hue, HCMC/Saigon, Thanh Hoa), cả khi tìm ga và khi đối chiếu địa danh lúc ghi kỷ niệm. Giữ tên riêng theo quy ước biên tập. Thuật ngữ văn hóa có chú giải ở lần xuất hiện đầu.

### Khung sách và hợp đồng nội dung

**Nguyên tắc**
- Tranh không có chữ. Chữ là văn bản HTML trên trang, nên luôn nét trên máy chiếu và 4K, chọn và tìm được, đổi ngôn ngữ tức thì.
- VI và EN dùng **chung cấu trúc trang**: cùng số trang, cùng mã trang, cùng tranh. Mỗi trang có ô chữ VI và EN riêng. Nhờ vậy số trang, mục lục và vị trí đọc giữ nguyên khi đổi ngôn ngữ.
- Khung chạy được trước khi có nội dung. Ô chưa có nội dung hiện **khung giữ chỗ** ghi tỉ lệ tranh và giới hạn chữ.
- *Cập nhật 09/11 (sau P5-01):* trình đọc hỗ trợ thêm `editions` (ảnh trang đôi dàn sẵn, riêng từng ngôn ngữ). Tập Hà Nội bản VI đang dùng cách này. Trang HTML vẫn là nguồn chữ cho Đọc chữ lớn, trình đọc màn hình và ngôn ngữ chưa có bản ảnh. Lưu ý về font, dung lượng và việc sửa đồng bộ ở `BAO-CAO-P5-01.md` mục 10.

**Tệp và thư mục**

| Tệp | Vai trò |
| --- | --- |
| `assets/goi-viet/map-surroundings-preview/i18n-5.js` | Lõi song ngữ: `t(key, vars)`, ngôn ngữ hiện tại, đọc `?lang=`, ghi nhớ, sự kiện đổi ngôn ngữ, từ điển giao diện. |
| `assets/goi-viet/books-5/catalog-5.js` | Danh mục nhỏ nạp cùng trang. **Nguồn duy nhất** cho trạng thái sách của từng địa phương. |
| `assets/goi-viet/books-5/layouts-5.js` | Mô tả 7 bố cục (tỉ lệ ô tranh, ô chữ, giới hạn ký tự đã đo), dùng chung cho trình đọc và công cụ kiểm tra. |
| `assets/goi-viet/books-5/book-reader-5.js`, `book-reader-5.css` | Trình đọc dùng chung. |
| `assets/goi-viet/books-5/<mã tỉnh>/book.js` | Nội dung một tập, nạp theo yêu cầu bằng `<script>` khi mở lần đầu. |
| `assets/goi-viet/books-5/<mã tỉnh>/art/` | Tranh không chữ, WebP hai cỡ: thường và nét. |
| `assets/goi-viet/books-5/_mau/` | Tập mẫu với tranh giữ chỗ và `HUONG-DAN-NHAP-NOI-DUNG.md`. |
| `tools/check-books-5.cjs` | Kiểm tra nội dung trước khi xuất bản. |

**Trạng thái trong danh mục**
- Không có trong danh mục: trang chờ.
- `draft`: công chúng thấy trang chờ; nhóm xem bản nháp bằng `?sach=nhap`.
- `published`: mở công khai. Chỉ chuyển sang trạng thái này khi `check-books-5.cjs` đạt cả VI và EN.

```js
// catalog-5.js
window.GoiVietBookCatalog = {
  hn:  { status: 'draft', src: 'assets/goi-viet/books-5/hn/book.js' },
  hue: { status: 'draft', src: 'assets/goi-viet/books-5/hue/book.js' },
  hcm: { status: 'draft', src: 'assets/goi-viet/books-5/hcm/book.js' },
  th:  { status: 'draft', src: 'assets/goi-viet/books-5/th/book.js' }
};

// hn/book.js
GoiVietBooks.register({
  placeId: 'hn',
  kind: 'fiction',                          // fiction | documentary | community
  title:    { vi: '…', en: '…' },
  subtitle: { vi: '…', en: '…' },
  cover: { art: 'art/cover', alt: { vi: '…', en: '…' } },
  sections: [{
    id: 'hn-01',
    label: { vi: 'Chương 01', en: 'Chapter 01' },
    title: { vi: '…', en: '…' },
    cardIds: [],                            // chỉ điền khi nội dung khớp lá bài
    pages: [{
      id: 'hn-01-a', layout: 'art-text', art: 'art/hn-01-a', alt: { vi: '…', en: '…' },
      text: { vi: { heading: '…', body: ['…', '…'] }, en: { heading: '…', body: ['…', '…'] } }
    }]
  }],
  sources: [{ id: 's1', title: '…', publisher: '…', url: 'https://…' }],
  credits: [{ role: { vi: 'Tranh', en: 'Illustrations' }, name: '…', license: '…' }]
});
```

**Bố cục trang**

Trang dọc tỉ lệ 3:4, trang đôi 3:2 như sách tham chiếu. Tỉ lệ ô tranh và giới hạn chữ dưới đây là dự kiến. Con số chính thức được đo ở P5-01 với font thật.

| Mã | Dùng cho | Ô nội dung |
| --- | --- | --- |
| `cover` | Bìa trước | Tranh bìa, tên tập, phụ đề, nhãn tỉnh |
| `opener` | Mở một phần | Nhãn phần, tiêu đề, tranh lớn, một đoạn dẫn |
| `art-text` | Trang kể chuyện chính | Tranh (trên, trái hoặc phải) và 1–3 đoạn chữ |
| `text-quote` | Trang nhiều chữ | Chữ và một câu trích nổi bật |
| `full-art` | Tranh trọn trang | Tranh và chú thích ngắn |
| `notes` | Ghi chú văn hóa | Đoạn tư liệu có nguồn, tách bạch với phần hư cấu |
| `back` | Bìa sau | Tóm tắt, nút Chơi thẻ, nguồn và ghi công |

**Trình đọc**
- **Lật trang:** lật bằng CSS 3D, cùng kỹ thuật lật thẻ đang dùng, không thêm thư viện. Hiện hai trang khi vùng đọc đủ rộng, một trang khi hẹp.
- **Điều hướng:** nút Trang trước/Trang sau, bấm mép trang, phím ←/→ khi tiêu điểm ở vùng sách, Escape đóng lớp trên cùng.
- **Công cụ đọc:** mục lục sinh từ dữ liệu, **Đọc chữ lớn** dùng cùng nguồn chữ, nhớ vị trí đọc trong phiên.
- **Giảm chuyển động:** áp dụng cả tùy chọn của web và hệ điều hành.
- **Tải ảnh:** ảnh lỗi thì chữ vẫn đọc được. Chỉ tải trước các trang kề với giới hạn rõ ràng.
- **Cửa sổ:** sách mở trong hệ cửa sổ hiện có (`.modal-backdrop`, `pushModalFocus`), để bản đồ tự dừng vẽ khi sách mở.

## 3. Lộ trình

Mỗi bước theo thứ tự **ghi đầu vào → thay đổi nhỏ → chạy ca liên quan → lưu bằng chứng → đánh giá điều kiện qua bước**. Bằng chứng lưu ở `verification/p5-books/` (thư mục mới, không ghi đè kết quả GĐ cũ).

### P5-00 — Mốc gốc

1. Xin người dùng cho phép lưu mốc gốc bằng một commit trên nhánh riêng, gồm HTML preview-5 và các tài nguyên chưa được theo dõi. Nếu chưa được phép, sao HTML preview-5 và danh sách tài nguyên đang nạp vào `verification/p5-books/baseline/`.
2. Xin phép cập nhật `AGENTS.md` để bản mặc định là preview-5 (phần tham chiếu thẻ cũng trỏ sang bản 5), tránh tác tử sau quay lại bản 3.
3. Chạy `tools/verify-preview5-conversation-cards.cjs` và `tools/perf/verify-gd6-functional.cjs --a <bản mốc> --b map-surroundings-preview-5.html --out <tệp trong thư mục mới>`.
4. Đo mốc ở desktop 1920×1080: bấm vào bản đồ → màn che mở, bấm mở bộ thẻ → thao tác được. Lấy n = 5, xen kẽ.
5. Tái hiện và ghi lại lỗi mở nhầm bộ thẻ ở ga vừa đến.

**Điều kiện qua bước:** có mốc khôi phục được, kết quả baseline và danh sách lỗi có sẵn.

### P5-01 — Khung sách với nội dung giữ chỗ

1. **Lõi song ngữ tối thiểu:** viết `i18n-5.js` trước, để mọi giao diện mới dùng `t()` ngay từ đầu. Nút VI/EN công khai làm ở P5-03; trong lúc này kiểm bằng `?lang=en`.
2. **Danh mục và nạp theo yêu cầu:** viết `catalog-5.js` và hàm nạp `book.js` theo yêu cầu (chèn `<script>`, chạy được khi mở trực tiếp từ tệp).
3. **Trình đọc và bảy bố cục:** dựng trình đọc như mục 2, kèm khung giữ chỗ cho ô trống.
4. **Đo giới hạn chữ:** đo từng ô chữ, VI và EN, với font thật ở 1920×1080 và 1366×768. Ghi vào hướng dẫn. Khi tràn: cho phép thu cỡ chữ trong biên nhỏ; quá biên thì công cụ kiểm tra báo lỗi. Trước khi chốt, thử bằng **chữ thật** của bản Hà Nội đang soạn (lấy từ phần chữ của tệp tham chiếu).
5. **Tập mẫu và hướng dẫn:** tạo `_mau/` và `HUONG-DAN-NHAP-NOI-DUNG.md`. Hướng dẫn gồm:
   - Đặt tệp ở đâu, đặt tên tranh thế nào.
   - Tỉ lệ và cỡ ảnh của từng ô, giới hạn chữ.
   - Cách nối `cardIds`.
   - Cách chạy công cụ kiểm tra và chuyển `draft` → `published`.
   - Nhóm có thể gửi chữ dạng văn bản thường; phía code chuyển vào `book.js`.
6. **Bốn tập nháp:** tạo 4 tập `hn`, `hue`, `hcm`, `th` ở trạng thái `draft`, dùng nội dung giữ chỗ và đủ bảy bố cục.
7. **Công cụ kiểm tra `tools/check-books-5.cjs`:**
   - Đúng cấu trúc, mã trang không trùng.
   - Đủ VI/EN khi `published`.
   - Không vượt giới hạn chữ.
   - Tranh tồn tại, đúng tỉ lệ và đủ hai cỡ, có mô tả ảnh.
   - Nguồn và ghi công có đủ.
   - `cardIds` có thật trong dữ liệu thẻ.

**Điều kiện qua bước**
- Cổng và bản đồ khi chưa mở sách có **0 yêu cầu** tới `books-5/<mã tỉnh>/`.
- Với `?sach=nhap` mở được 4 tập nháp, đủ bảy bố cục. Không có cờ thì hiện trang chờ.
- **Chép `_mau` thành một tập thử, thay chữ và tranh, rồi hiển thị đúng mà không sửa code.**
- `?lang=en` giữ đúng trang và số trang.
- Công cụ kiểm tra bắt được các lỗi cố ý: thiếu EN, tràn chữ, thiếu tranh, sai tỉ lệ, `cardIds` sai.
- Bản đồ dừng vẽ khi sách mở; đóng rồi mở lại vẫn thao tác được.

### P5-02 — Hai chế độ, trang chờ và fanpage

1. **Hai nút ở cả hai nơi:** tách `journey-system-4.js` thành `journey-system-5.js`, đặt hai nút **Chơi thẻ** và **Đọc sách văn hóa** ở thẻ ga đến, thanh hành trình và khung ga đang chọn trong panel. Rà lời chào, hướng dẫn và thông báo đang mô tả chuỗi ba bước "Chọn ga → Đọc chuyện → Rút thẻ".
2. **Một hàm mở chung:** đưa mọi lối vào về một hàm `openPlaceMode(placeId, mode, source)`.
   - Ẩn đường đọc công khai của câu chuyện demo.
   - 12 câu chuyện đã thẩm định của Hà Nội, Huế, TP. Hồ Chí Minh giữ trong dữ liệu (thẻ vẫn tham chiếu) và chuyển cho nhóm làm tư liệu cho trang `notes`.
3. **Sửa lỗi mở nhầm bộ thẻ:** lấy ga từ ngữ cảnh mở (sách hoặc câu chuyện), không lấy từ `state.selectedPlaceId`.
4. **Viết lại câu hoạt động phụ thuộc tranh** (17 lượt dùng chung một câu), ví dụ đổi sang nhìn ảnh danh thắng của ga hoặc đồ vật quanh bàn.
5. **Trang chờ:**
   - Bìa sách đóng, tên ga, lời mời gửi chuyện (món ăn, tiếng gọi, phong tục, ảnh tự chụp, tên tỉnh cũ trước sáp nhập).
   - Nút Chơi thẻ, Quay lại, link fanpage, mã QR SVG tĩnh tạo sẵn từ URL đã xác nhận.
   - Trang chờ không ghi dấu đã đọc và vẫn hiển thị đầy đủ khi mất mạng.
6. **Tùy chọn, làm nếu còn thời gian:** dấu 📖 trên ghim các tỉnh có sách đã xuất bản. Tách hoàn toàn khỏi cờ "3 ga mẫu"; trang chủ giữ 3 ga cho 3 miền.

**Điều kiện qua bước**
- Mọi lối vào đi đúng trạng thái.
- Chọn ga mới khi tàu đang chạy, đọc tại ga vừa tới, bấm Chơi thẻ thì mở **đúng bộ của ga vừa tới**.
- Đi từ lá đang mở dấu sen sang sách rồi quay lại vẫn giữ nháp và trạng thái lá.
- Quét toàn bộ 36 điểm: chỉ tập có trong danh mục mới mở sách, còn lại vào trang chờ.

### P5-03 — Song ngữ toàn website

**Rà soát ngày 10/11 (sau P5-02).** Mở preview-5 với `?lang=en`, đi qua 15 trạng thái chính (trang chủ, khung ga, tàu đến, lá bài hai mặt, ống xăm, bưu thiếp, Tủ sách cộng đồng, quần đảo), ghi mọi chữ VI còn hiện, kể cả chữ vẽ trên canvas. Script và số liệu nằm trong `verification/p5-books/`: `scan-p5-03-en.cjs`, `shared-hits-p5-03.cjs`, `inventory-p5-03*.cjs`, `p5-03-scan-en.json`.

- **Chữ giao diện còn hiện:** khoảng 280 chuỗi, 9.000 ký tự, không tính chuỗi chỉ là tên riêng. Phần lớn nằm trong markup và JS nội tuyến của `map-surroundings-preview-5.html`, cùng các tệp `-5` (`fortune-ritual-5.js`, `journey-system-5.js`, `conversation-cards-5.js`). Khoảng 16 tệp dùng chung cũng ghi chữ lên màn hình, mỗi tệp từ 1 đến 15 cụm; có tệp ghi đè chữ của markup lúc chạy.
- **Thiếu thêm:**
  - Chưa có nút VI/EN công khai.
  - `html lang` và `<title>` không đổi theo ngôn ngữ; tiêu đề còn ghi nhầm "Preview 3 WebGL".
  - Phần đang mở không vẽ lại khi đổi ngôn ngữ, ví dụ tiêu đề bộ thẻ và nút trên lá.
  - Tìm kiếm không nhận "hanoi", "saigon", "hcmc", "danang", "paracel", "halong".
- **Chưa quét được:** hải đồ quần đảo, phần kỷ niệm, trạng thái nhạc sau khi chọn tệp, các thông báo lỗi. `check-i18n-5.cjs` phải đi qua các trạng thái này.

**Khối lượng nội dung** (chuỗi không trùng):

| Phần | Khối lượng |
| --- | --- |
| 12 thẻ đã thẩm định (HN, Huế, TP.HCM) | ~1.450 từ, dịch tay |
| 132 thẻ của 33 điểm còn lại | 8 mẫu câu hỏi; 117 đáp án (~1.300 từ); ~80 dạng giải thích sau khi thay tên và đáp án (~4.600 từ thô) |
| 60 câu hoạt động | ~1.900 từ |
| Mô tả ga: tagline, summary, vùng, tên ảnh | 80 chuỗi, ~970 từ |
| Bảng tên riêng: 36 điểm, 102 danh thắng, di sản, món ăn | ~500 từ |
| 144 truyện demo (~21.000 từ) | **Không dịch**: từ P5-02 không còn hiện công khai |

**Sửa nội dung VI trước khi dịch** (dịch nguyên trạng sẽ chép lỗi sang EN):
- 31 câu hỏi về danh thắng đang gắn chủ đề "Lễ hội". Lỗi hiện trên mặt thẻ và nút "Rút lá Lễ hội".
- 124 câu hỏi chèn tên đầy đủ giữa câu, ví dụ "vùng đất Tỉnh Thanh Hóa".
- Thanh Hóa và Hải Phòng có di sản trùng danh thắng. Thanh Hóa: câu hỏi di sản lấy Thành nhà Hồ làm đáp án; đáp án ghi "Khu di tích Quốc gia" nhưng lời giải thích ghi "Di sản Thế giới UNESCO".

**Lát 1 — Khung song ngữ** (Code, không chờ nội dung):
- Nút VI/EN công khai ở header và trang chủ. Đồng bộ `html lang`, `<title>` (sửa luôn chữ "Preview 3 WebGL") và thông báo trình đọc màn hình.
- Markup tĩnh gắn `data-i18n`, cả `aria-label`, `title`, `placeholder`, `alt`. Chuỗi JS nội tuyến và các tệp `-5` chuyển sang `t()`.
- Mỗi phần tự vẽ lại khi có `goiviet:langchange` mà giữ trạng thái: lá đang mở (mặt, dấu sen, lời giải, nháp), tiêu đề bộ thẻ, khung ga, thanh hành trình, ống xăm, bưu thiếp, nhãn canvas ("GA …", "Về giữa", "(Đã ghé)", "(Ký ức)").
- Nhãn canvas được đo để tránh chồng chữ: đo lại theo chữ đang vẽ, kiểm chồng nhãn ở 1920×1080 và 1366×768.
- Tìm kiếm nhận tên không dấu và bí danh tiếng Anh.
- `tools/check-i18n-5.cjs`:
  - Báo khóa thiếu hoặc thừa giữa VI và EN.
  - Quét `?lang=en` như `scan-p5-03-en.cjs`, thêm các trạng thái chưa quét ở trên.
  - Báo cụm VI ngoài danh sách cho phép (tên riêng, chữ người dùng nhập, "Gói Việt").

**Lát 2 — Tệp dùng chung** (Code): tách bản `-5` cho tệp có chữ hiện ra, bằng script sinh lại được như `make-journey-system-5.cjs`. Mỗi lần đổi đều phải khớp đúng một chỗ, nên tệp gốc đổi thì script báo lỗi ngay. Preview 1–4 và `index.html` không đổi.

| Nhóm | Tệp (số cụm VI thấy trên lượt quét EN) |
| --- | --- |
| Nhiều chữ | `map-reference-ui.js` (15), `postcard-design-3.js` (14, chữ trên ảnh PNG), `natural/landscape-4.js` (10, có ghi chú nguồn), `preview-3.js` (7: "BIỂN ĐÔNG", "QUẦN ĐẢO", "LÀO", "THÁI LAN"), `map-controls-island-reference.js` (6, chú giải), `natural/island-chart.js` (hải đồ, chưa quét hết), `homepage-music-3.js` (trạng thái nhạc), `polish-3.js` |
| Ít chữ | `natural/hydrology-3.js`, `natural/terrain-renderer-4.js` (ghi chú nguồn), `natural/archipelago-renderer-3.js` ("Xem gần"), `heritage-overlays-3.js`, `heritage-command-bar-3.js`, `province-legibility.js` ("(Ký ức)", được đo nên phải khớp chữ vẽ), `landmark-assets.js` (title SVG), `homepage-opening-controller-3.js` |
| Kiểm lại trước khi tách | `memory-reference-v2.js`, `homepage-layered-opening.js`: có chữ nhưng không thấy trên lượt quét; xác nhận preview-5 có hiện không |
| Chỉ CSS `content:` | `map-baseline-restored.css`, `arrival-journal.css`: ghi đè bằng một CSS `-5`, không tách |
| Không dịch | `map-prewarm-3.js`, `homepage-layered-scene-3.js`, `homepage-crane-flight-3.js`, `homepage-transport-3/transport.js`, `map-warm-terrain-palette.js`, `webgl-terrain-renderer-3.js` (khóa tên vùng), `homepage-layered-renderer-5.js`, `homepage-opening-config.js`: chỉ là khóa, log hoặc lỗi nội bộ |
| Không tách | `journey-network-data.js`: tên ga tra qua bảng tên song ngữ lúc hiển thị. `fortune-ritual.js`, `journey-system-4.js` đã tách ở P5-02 |

**Lát 3 — Nội dung EN** (Code làm bản nháp, nhóm duyệt; lưu trong `content-en-5.js` theo mã, không ghi đè dữ liệu gốc):
1. Bảng tên riêng và thuật ngữ, kèm bí danh tìm kiếm.
2. 16 thẻ của 4 tỉnh có sách: 12 thẻ đã thẩm định cộng 4 thẻ Thanh Hóa sau khi sửa VI.
3. 8 mẫu câu hỏi, 117 đáp án, ~80 dạng giải thích của 132 thẻ còn lại; 60 câu hoạt động; mô tả ga.
4. Giữ nguyên thứ tự lựa chọn và chỉ số đáp án.

Khâu duyệt EN là phần tốn thời gian nhất. **Nếu gấp:** lát 1 + bước 1–2 của lát 3 là đủ để trình diễn tiếng Anh trọn một vòng với 4 tỉnh có sách. Các thẻ chưa có EN hiện tiếng Việt kèm nhãn, như trình đọc sách đang làm.

**Điều kiện qua bước:**
- Đủ khóa VI/EN; thứ tự lựa chọn và đáp án khớp dữ liệu gốc.
- Đổi ngôn ngữ giữa lượt chơi, khi đang đọc sách, khi đang nhập nháp và khi xuất PNG đều giữ trạng thái.
- Công cụ kiểm tra không còn cụm VI sót ngoài danh sách cho phép.
- Preview 1–4 và `index.html` giữ nguyên.

### P5-04 — Nhập nội dung từng tập

**Đầu vào nhóm giao cho mỗi tập:**
- Chữ VI/EN theo bố cục đã chọn.
- Tranh không chữ đúng tỉ lệ ô.
- Nguồn cho phần tư liệu, ghi công, và sự đồng ý nếu dùng lời kể hoặc ảnh đóng góp.

**Việc thực hiện:** đặt tệp → chạy `check-books-5.cjs` → xem từng trang VI/EN ở 1920×1080 → sửa tràn chữ → nối `cardIds` khi nội dung khớp → chuyển `published`.

**Điều kiện qua bước (mỗi tập):** công cụ kiểm tra đạt, đọc thực tế hết tập ở hai ngôn ngữ, nguồn và ghi công hiển thị được. Sửa dữ kiện sau khi duyệt chỉ cần sửa `book.js` (và tranh nếu đổi), không phải xuất lại ảnh trang.

### N — Nội dung (nhóm làm song song, bắt đầu ngay)

- **Viết VI ngay**, không chờ khung. Khi P5-01 xong thì dàn chữ vào bảy bố cục theo giới hạn chữ trong hướng dẫn.
- **Tranh tạo không có chữ**, theo tỉ lệ từng ô. Nếu dùng công cụ tạo ảnh, yêu cầu ảnh không có chữ và để trống vùng chữ.
  - Bộ trang Hà Nội hiện có chữ in sẵn, nên cần tạo lại tranh không chữ. Cách tạm là phủ ô chữ HTML lên vùng chữ của ảnh cũ; chỉ dùng nếu thiếu thời gian, chốt ở P5-01.
- **Phân biệt rõ hư cấu, tư liệu có nguồn và đóng góp cộng đồng.** 12 câu chuyện đã thẩm định của Hà Nội, Huế, TP. Hồ Chí Minh có thể dùng làm tư liệu cho trang `notes`.
- **EN:** dịch máy làm nháp, người trong nhóm duyệt.
- **Thanh Hóa** (quê giảng viên): viết mới cả tập. Khuyến nghị viết lại luôn 4 thẻ của Thanh Hóa.

| Tập | Hướng biên tập đề xuất | Việc cần khóa |
| --- | --- | --- |
| Hà Nội | Giữ mạch Linh và chiếc máy ảnh của ông làm cơ sở. | Chốt chữ VI, bản EN, tranh không chữ; phân biệt cảnh hư cấu với ghi chú văn hóa có nguồn. |
| Huế | Kể qua một nhân vật hoặc cuộc gặp gắn với Nhã nhạc và không gian xứ Huế. | Chọn mạch kể, xác minh thuật ngữ và chi tiết văn hóa, chốt phạm vi minh họa. |
| TP. Hồ Chí Minh | Theo một chuyến ghe hoa về Bến Bình Đông hoặc một câu chuyện đời sống được nhóm duyệt. | Xác minh địa danh và nguồn, chốt điểm nhìn và thời điểm. |
| Thanh Hóa | Dùng Thành nhà Hồ hoặc ký ức địa phương có tư liệu làm trục kể. | Biên tập thành tác phẩm riêng, xác minh chi tiết, có sự đồng ý nếu dùng lời kể hoặc ảnh đóng góp. |

### P5-05 — Nghiệm thu gọn và bàn giao

**Bắt buộc**
- **Công cụ kiểm tra:** `tools/verify-preview5-conversation-cards.cjs`, `tools/perf/verify-gd6-functional.cjs` (bản mốc so với ứng viên, `--out` sang thư mục mới), `tools/check-books-5.cjs`, `tools/check-i18n-5.cjs`.
- **So hiệu năng** trong cùng phiên, xen kẽ, n = 5 mỗi bên (tăng lên 10 nếu chênh lệch sát biên dao động), ở desktop 1920×1080:
  - vào bản đồ → màn che mở;
  - mở bộ thẻ → thao tác được;
  - mở sách → trang đầu hiển thị.
- **Mạng:** 0 yêu cầu ảnh và dữ liệu sách trước khi mở sách.
- **Kiểm tay luồng trình chiếu** ở 1920×1080 và 1366×768, VI và EN, nền sáng và tối: chọn ga → hai chế độ → chơi một lượt → đọc sách → trang chờ → đổi ngôn ngữ giữa chừng → lưu bưu thiếp PNG.
- **QR:** quét mã từ màn hình chiếu bằng điện thoại.

**Nếu còn thời gian:** điện thoại 390 px, 4K, zoom 200%, mạng chậm, WebGL dự phòng.

**Bàn giao:** báo cáo ngắn ghi trạng thái từng ca (Đạt, Lỗi, Bị chặn, Chưa chạy), danh sách tệp mới và tệp đã tách, phần thiết bị chưa kiểm, trạng thái Messenger.

## 4. Ca kiểm thử chính

| Nhóm | Ca | Kết quả mong đợi |
| --- | --- | --- |
| Chọn chế độ | Chuột, bàn phím qua danh sách, tìm kiếm, quẻ tre, ga vừa đến khác ga đi tiếp | Đúng ga, đúng hai lựa chọn, kéo/zoom vẫn hoạt động |
| Thẻ | Chọn lá, xáo, hủy giữa hiệu ứng, đúng/sai/chưa biết, dấu sen, đổi hoạt động, lưu nháp, hết bài | Đúng lá và đáp án, không tiêu thụ lá ngoài ý muốn |
| Sách | Bìa, trang trước/sau, mục lục, Đọc chữ lớn, bìa sau, nhớ vị trí, ảnh lỗi | Đúng trang và tranh, chữ vẫn đọc được khi ảnh lỗi |
| Đổi ngôn ngữ | Trang đầu, tuyến tàu, ga, thẻ đang mở, sách đang đọc, trang chờ, bưu thiếp; qua URL và khi chặn lưu | Chữ đồng bộ, giữ trạng thái |
| Trang chờ | Cả 36 điểm; Đà Nẵng và một quần đảo từ nhiều lối | Chỉ tập trong danh mục mở sách; trang chờ không ghi đã đọc |
| Kỷ niệm và PNG | Lưu nháp, đổi ngôn ngữ, hoàn thành lượt, tải PNG | PNG theo ngôn ngữ giao diện, giữ nguyên văn ghi chú |
| Fanpage | Link và QR trên máy tính và điện thoại; khi mất mạng | Đúng đích; trang chờ vẫn hiện, có đường quay lại chơi |

### Công cụ và lưu ý

- `tools/perf/verify-gd6-functional.cjs` mặc định so preview-4 với preview-5 và ghi vào `tools/perf/results/gd6/`. Luôn truyền `--a`, `--b`, `--out`.
- Mỗi ca ghi môi trường, bước tái hiện, kết quả và bằng chứng. Một ảnh chụp chỉ chứng minh trường hợp đã quan sát.

### Tệp cần đọc lại trước khi triển khai

| Tệp | Vai trò |
| --- | --- |
| `map-surroundings-preview-5.html` | Dữ liệu, chọn ga, lọc, modal câu chuyện và thẻ, quẻ tre, kỷ niệm, bưu thiếp, vòng vẽ. |
| `assets/goi-viet/map-surroundings-preview/journey-system-5.js` | Thẻ "Đã đến" với hai nút Chơi thẻ / Đọc sách, hàm `explore()` (tách từ `journey-system-4.js` ở P5-02). |
| `assets/goi-viet/map-surroundings-preview/conversation-cards-5.js` | Hiệu ứng xáo/rút, hai mặt, khóa tương tác, regex chủ đề. |
| `assets/goi-viet/map-reference-ui.js`, `postcard-design-3.js` | Chữ điều khiển ga và chữ trên bưu thiếp; dùng chung nhiều bản. |
| `D:/Download/Goi-Viet-Ha-Noi.html` | Phong cách sách và chữ thật của bản Hà Nội đang soạn. |
| `BAO-CAO-GD6-PREVIEW-5.md` | Mốc lịch sử và giới hạn hiệu năng. |

### Điểm cần chốt

1. **Ngày thuyết trình**, để điền ngày cho từng bước và quyết định có làm P5-03 trước buổi đó không.
2. **Sách chỉ có VI** có được xuất bản tạm cho buổi thuyết trình không (mặc định: không, chỉ xuất bản khi đủ VI/EN).
3. **Người phụ trách mỗi tập:** ai viết, ai tạo tranh, ai duyệt EN; quyền ảnh và sự đồng ý với lời kể đóng góp.
4. **Tranh Hà Nội:** tạo lại tranh không chữ (mặc định) hay phủ chữ HTML lên ảnh cũ.
5. **Cách sửa tệp dùng chung:** tách bản `-5` (mặc định, theo quy ước dự án) hay sửa có điều kiện ngay trong tệp dùng chung (cần người dùng đồng ý riêng).
6. **Messenger:** quản trị trang kiểm `m.me/61594157551043` có mở đúng khung nhắn tin không.
7. **Tên địa danh trong bản EN** (đề xuất): giữ dấu ("Hà Nội", "Huế", "Hồ Chí Minh City"); "Hanoi", "Saigon", "HCMC" chỉ làm bí danh tìm kiếm. Biển, đảo theo cách gọi của Việt Nam: "Biển Đông (East Sea)", "Hoàng Sa (Paracel) Islands", "Trường Sa (Spratly) Islands".
8. **Câu thơ lục bát** ở ống xăm và sân ga (đề xuất): giữ tiếng Việt, thêm một dòng giải nghĩa EN, không dịch thành thơ.
9. **Sửa nội dung VI trước khi dịch** (mục P5-03): nhóm tự sửa, hay Code đề xuất bản sửa để nhóm duyệt.

---

<details>
<summary>Kế hoạch lịch sử GV-00 đến GV-07 · ngày 11/10/2026</summary>

# Kế hoạch nâng cấp giao diện Gói Việt

Ngày lập: 11/10/2026. Dự án: `vietnam-heritage-map-2`.

**Trạng thái: đã triển khai GV-00 đến GV-07 và nghiệm thu trong môi trường ghi ở mục 11.** Baseline, diff và evidence mới nằm trong `verification/goi-viet/`. Thông tin khảo sát ở mục 2 là lịch sử, không thay thế kết quả nghiệm thu mới. Khi người dùng yêu cầu triển khai, thực hiện tuần tự các lát cắt bên dưới và tiếp tục đến hết phạm vi được giao; không yêu cầu duyệt lại những việc đã được cho phép.

## 1. Mục tiêu và nguyên tắc

Chuyển website bản đồ văn hóa gia đình sang nhận diện **Gói Việt**, dựa trên bộ ảnh người dùng cung cấp: tranh núi xanh nhiều lớp, mây cách điệu, cánh cò, giấy ngà, chữ có cá tính và đoàn tàu xuyên Việt.

Trang đầu tạo cảm giác đang bước vào phong cảnh. Các màn chơi tiếp nối cùng màu sắc, nét vẽ và chất liệu nhưng vẫn dễ đọc, dễ thao tác. Bưu thiếp là sản phẩm lưu niệm khép lại hành trình.

Luồng sản phẩm cần giữ:

> Lời chào → bản đồ/chọn ga → đọc chuyện → rút thẻ → trò chuyện gia đình → ghi kỷ niệm → bưu thiếp.

### Nguyên tắc bắt buộc

1. **Rà soát lại dự án trước khi code**, kể cả khi đã có báo cáo hoặc từng sửa dự án trước đó. Không dùng số dòng, ảnh chụp hoặc kết quả test cũ làm bằng chứng cho nguồn mới.
2. **Không over-engineering.** Giữ HTML/CSS/JavaScript và cơ chế hiện tại nếu đáp ứng yêu cầu. Mỗi thay đổi phải gắn trực tiếp với một hành vi hoặc tiêu chí nghiệm thu trong plan.
3. Làm từng lát cắt hoàn chỉnh: kiểm tra hiện trạng → xác định contract → sửa nhỏ nhất → kiểm thử → review diff → ghi evidence → tiếp tục.
4. Không đánh đổi khả năng đọc, tìm ga, nhập kỷ niệm hoặc tải bưu thiếp để tăng hiệu ứng.
5. Bảo toàn thay đổi có sẵn. Không reset, clean, ghi đè, commit, push, deploy hoặc dừng dịch vụ của người dùng nếu chưa được cho phép.
6. Không sửa test để hợp thức hóa lỗi. Chỉ cập nhật assertion hình thức khi yêu cầu hình thức đã thay đổi; ghi rõ contract cũ/mới và giữ kiểm tra hành vi.
7. Hạng mục lân cận không chặn phạm vi hiện tại được ghi thành work item, không tự mở rộng thành một dự án mới.
8. Nếu hai lần thử tương tự thất bại, phân tích nguyên nhân và đổi cách kiểm chứng thay vì lặp lại.

## 2. Hiện trạng và độ tin cậy của bằng chứng

### 2.1. Kiểm tra lại khi lập file này

- Thư mục hiện tại không phải Git repository; chưa thấy `AGENTS.md` hoặc `plan.md` có sẵn trong dự án. Vẫn áp dụng hướng dẫn AGENTS.md người dùng đã cung cấp trong cuộc trò chuyện.
- `index.html`: 1.499.209 byte, SHA-256 `401e648e425345cae4ec3ad0ac08dcdf621dc11dbe690cd2432416e560ec6e32`.
- SHA nguồn trùng với bản vừa khảo sát ở lượt trước. Lượt tạo plan không chạy lại browser/test; những số liệu bên dưới được ghi rõ là kết quả lượt khảo sát trước trên cùng SHA.
- CSS, dữ liệu và JavaScript ứng dụng chủ yếu nằm trong `index.html`; chưa có nhu cầu chuyển framework.
- Font đang dùng: Be Vietnam Pro cho nội dung/điều khiển, Playfair Display cho tiêu đề lớn.
- CodeGraph đã báo dự án chưa được index ở lượt khảo sát. Khi triển khai, kiểm tra lại khả năng index; nếu vẫn không có thì dùng tìm kiếm và đọc file, không tự tạo index.

### 2.2. Kết quả lượt khảo sát trước trên cùng nguồn

- 36 điểm đến, 144 câu chuyện và 144 thẻ; ba điểm được gắn cờ nội dung mẫu có nguồn. Đây là số liệu ứng dụng, không phải tuyên bố mọi nội dung đã được xác minh văn hóa.
- Trang đầu/chuyển cảnh dùng HTML/SVG; bản đồ dùng canvas; ảnh bưu thiếp được vẽ bằng canvas riêng.
- Có tài nguyên Three.js cũ trong `assets/`, nhưng trang đang chạy không nạp bundle đó. Không suy luận kiến trúc đang dùng chỉ từ README cũ.
- Có ảnh địa phương từ nguồn ngoài; không coi toàn bộ trải nghiệm là hoạt động ngoại tuyến đầy đủ.
- Kỷ niệm và tiến trình giữ trong RAM của phiên. Đóng/tải lại trang mất phiên. Ghi chú cá nhân mặc định không đưa vào PNG.
- Trình duyệt đã khảo sát trang đầu, hướng dẫn, bản đồ, đọc chuyện, rút thẻ, nhánh chưa biết, lật thẻ, biểu mẫu kỷ niệm, nền tối, giảm chuyển động và mở bưu thiếp.
- Ở 390 × 844, chữ biển ga nằm trong SVG bị thu nhỏ còn khoảng 3,8 px theo tỷ lệ hiển thị; nút bắt đầu ở gần đáy màn đầu. Cần bố cục mobile riêng.
- Trang đầu có chuyển động lặp nhưng không có điều khiển dừng ngay trong màn lời chào; điều khiển giảm chuyển động hiện ở phần tùy chọn của bản đồ.

| Bộ kiểm tra đã chạy ở lượt khảo sát | PASS | FAIL | SKIP | Chưa chạy tới do suite dừng |
| --- | ---: | ---: | ---: | ---: |
| UX, responsive, đọc chuyện, typography, UI polish, postcard layout | 45 | 0 | 0 | 0 |
| Map rail | 9 | 1 | 0 | 3 |
| Motion flow | 2 | 1 | 0 | 2 |
| Tổng | 56 | 2 | 0 | 5 |

Không cộng các trường hợp chưa chạy vào PASS hoặc SKIP. Bộ kiểm tra nguồn/harness không thay thế browser.

### 2.3. Vấn đề cần theo dõi

| ID | Bằng chứng hiện có | Cách xử lý trong lần triển khai |
| --- | --- | --- |
| EXIST-RAIL | `verification/check-map-rail.cjs:99`: đổi quần đảo giữa hải trình không đạt điều kiện bắt đầu từ vị trí thuyền hiện tại | Tái hiện trên browser và nguồn hiện tại. Nếu chặn nghiệm thu tuyến đi biển trong GV-04 thì sửa nguyên nhân trong một bước nhỏ; không viết lại tuyến tàu |
| EXIST-HARNESS | `verification/check-motion-flow.cjs:120`: fixture thiếu `getBestOverviewZoom` | Bổ sung môi trường mô phỏng đúng contract trước khi dùng suite nghiệm thu GV-03; không thay hàm thật bằng no-op để xanh test |
| VERIFY-PNG | Đã khảo sát giao diện/canvas, chưa xác nhận bytes của PNG tải xuống trong lượt khảo sát | Bắt buộc tải và mở file thật tại GV-06 |
| ASSET-FONT | Chưa có font Hồn Rối và giấy phép webfont được xác minh | Giữ font hiện hành làm fallback; không hứa khớp chính xác chữ từ ảnh |
| ASSET-LAYERS | Ảnh tham khảo là JPG phẳng, chưa có bộ núi/mây/chim/logo tách lớp | Chuẩn bị asset trước khi làm chuyển động; không lấy nguyên poster làm toàn bộ giao diện |

Chưa kiểm chứng: screen reader thật, thiết bị vật lý, trình duyệt khác, hiệu năng trên mạng và tính chính xác của toàn bộ 144 nội dung văn hóa.

## 3. Phạm vi và các giới hạn chống over-engineering

### Trong phạm vi

- Nhận diện Gói Việt trên các bề mặt người dùng nhìn thấy: tên trang, logo, lời chào, header, hướng dẫn, thẻ và bưu thiếp.
- Hệ màu sáng/tối, vai trò font, khung/nút, họa tiết và minh họa nhất quán.
- Trang đầu có phong cảnh nhiều lớp; mây nhẹ, cò bay ngang và bay sâu vào cảnh; núi tạo chiều sâu tiết chế.
- Đồng bộ hướng dẫn, chuyển cảnh, bản đồ, thông tin ga, bài đọc, thẻ, rút vé, kỷ niệm và bưu thiếp.
- Responsive, bàn phím, tương phản, giảm chuyển động, trạng thái lỗi/thiếu tài nguyên và hiệu năng liên quan trực tiếp.
- Kiểm tra dữ liệu/contract không bị ảnh hưởng và khả năng rollback từng lát cắt.

### Ngoài phạm vi nếu chưa có yêu cầu mới

- Chuyển sang React/Vue/Next.js, thêm router, state manager, CMS, backend, database hoặc tài khoản.
- Đồng bộ đám mây, lưu phiên lâu dài, multiplayer, AI tạo chuyện, bảng điểm, phần thưởng hoặc chia sẻ công khai.
- Dịch lại toàn bộ nội dung EN/VI; chỉ chuẩn bị bố cục chịu chuỗi dài và giữ chữ giao diện ngoài tranh.
- Viết lại bản đồ/tuyến tàu bằng WebGL, phục hồi bộ Three.js cũ hoặc xây một animation engine.
- Thêm GSAP/Lottie/Thư viện hiệu ứng chỉ để chạy vài lớp mây và chim. Nếu CSS/SVG không đáp ứng một yêu cầu cụ thể, phải nêu giới hạn và đánh giá thay đổi nhỏ nhất trước.
- Vẽ riêng 144 minh họa trong đợt đầu; kiểm chứng lại toàn bộ lịch sử/văn hóa hoặc thay đổi dữ liệu địa lý.
- Tách lại toàn bộ file, làm design-system package, tạo build pipeline mới, thêm CI/hosting/analytics.
- Đổi hàng loạt tên ID, biến, hàm hoặc dữ liệu chỉ vì đổi thương hiệu.

### Quy tắc chọn cách làm

- Tái sử dụng token, state, helper modal/focus và cơ chế render hiện có.
- Có thể thêm asset mới và một helper nhỏ nếu cần; chỉ tách file khi có lợi ích cụ thể và vẫn tương thích cách mở trang hiện tại.
- Sửa đúng CSS/template sở hữu hành vi; hạn chế chồng thêm override hoặc `!important` ở cuối file.
- Không xóa asset cũ chỉ vì chưa dùng; kiểm kê phụ thuộc và rollback trước khi đề xuất dọn.
- Không thêm kiểm tra phản chiếu từng dòng CSS. Tập trung vào kết quả người dùng thấy và contract có rủi ro.

## 4. Định hướng hình ảnh và tài nguyên

### 4.1. Vai trò của ảnh tham khảo

| Ảnh | Vai trò |
| --- | --- |
| Giao diện trang đầu có Gói Việt và tàu | Chuẩn bố cục và mức độ cảm xúc của trang đầu |
| Tranh núi xanh, mây trắng | Chuẩn chiều sâu, đường nét, màu cảnh |
| Logo Gói Việt | Chuẩn nhận diện; cần phiên bản phù hợp nhiều kích thước |
| Chiếc thuyền ngoài xa | Tham khảo chất giấy, nét mềm và khoảng trống |
| Vũ trụ Cò Bay | Tham khảo cảm giác bộ sưu tập bản đồ–thẻ–sách–lưu niệm |
| Sơn–Thủy | Tham khảo cách nối cảnh; không trộn nguyên chất 3D vào mọi thành phần |
| Hồn Rối Display | Hướng thử chữ tiêu đề; không dùng cho toàn bộ nội dung |

Các ảnh người dùng gửi hiện ở thư mục Temp. Khi triển khai cần xác nhận còn truy cập được và chuẩn bị bản làm việc có nguồn gốc rõ; không dùng đường dẫn Temp làm đường dẫn runtime hoặc bằng chứng lưu trữ bền vững.

### 4.2. Bộ nhận diện đề xuất

| Vai trò | Màu khởi điểm | Cách dùng |
| --- | --- | --- |
| Giấy ngà | `#F7F0DE` | Nền chính |
| Mặt giấy | `#FFFCF4` | Vùng đọc và biểu mẫu |
| Xanh rừng | `#234D40` | Nhận diện phụ, núi gần, chữ nhấn |
| Xanh ngọc | `#83B8A1` | Núi xa và trang trí |
| Đỏ son | `#9E2835` | Logo, hành động chính |
| Vàng đất | `#B49355` | Chi tiết/viền; không mặc định dùng làm chữ nhỏ |
| Mực tối | `#293B32` | Nội dung chính |

Các mã màu là đề xuất, chưa được nghiệm thu tương phản. Điều chỉnh khi đo trên nền thực, gồm hover, selected, disabled, focus, sáng/tối. Không dùng màu đơn độc để truyền đạt trạng thái.

Typography:

- Logo dùng lettering/vector riêng; có tên truy cập được và fallback bằng chữ thật.
- Hồn Rối chỉ là ứng viên cho tiêu đề ngắn sau khi có file, quyền dùng và kiểm tra glyph/shaping. Không suy ra font chính xác của logo từ ảnh.
- Giữ Be Vietnam Pro cho nội dung, điều khiển, đáp án, tên dài và bản đồ.
- Playfair Display hiện có là fallback. Không tải đồng thời nhiều font trang trí nếu không có vai trò riêng.
- Kiểm tra dấu Việt, chuỗi NFC/NFD, xuống dòng, chữ dài, font tải chậm và canvas xuất PNG.

Nền tối dùng cảnh đêm xanh rừng, chữ ngà và tương phản riêng; không đảo màu cả ảnh. Texture giấy đứng yên và đủ nhẹ để không gây nhiễu vùng đọc.

### 4.3. Asset tối thiểu

- Logo ngang, dọc, thu nhỏ và đơn sắc, nền trong suốt.
- Khoảng ba lớp núi: xa, giữa, gần; có vùng thoáng cho logo/chữ/nút.
- Hai hoặc ba biến thể mây có thể tái sử dụng.
- Một bộ chim thống nhất hình dáng; tách cánh nếu cần vỗ cánh. Thử cách bay trước khi vẽ thêm biến thể.
- Tàu và cầu cùng phong cách; ưu tiên chỉnh bộ SVG hiện tại nếu chất lượng đáp ứng.
- Một texture giấy nhẹ và bộ họa tiết góc dùng lại trên vé/thẻ/bưu thiếp.
- Bốn nhóm minh họa chủ đề; ưu tiên thêm tranh riêng cho ba ga mẫu sau khi mẫu tổng thể ổn.

Ghi nguồn, quyền sử dụng, vai trò, kích thước và dung lượng trong một bảng asset ngắn. Không coi poster tham khảo là asset được phép tái phân phối mặc định. Không dùng một núi lớn cho tất cả nội dung địa phương; minh họa riêng phải phù hợp chủ đề.

## 5. Contract thiết kế và chuyển động

### 5.1. Trang đầu

Desktop: điều khiển phụ gọn → logo trong vùng trời thoáng → giới thiệu ngắn → tàu/cầu và ba miền → lời mời cùng hai hành động chính/phụ. Núi hai bên tạo khung, không lấn vùng đọc.

Mobile: dựng lại bố cục dọc, cắt cảnh riêng, giảm lớp, rút ngắn mở đầu. Tàu đủ lớn để nhận ra; biển ga chuyển thành nhãn HTML đọc được, không thu nhỏ cả poster.

- “Bắt đầu khám phá” luôn là hành động chính; “Xem cách chơi” là hành động phụ.
- Ở 390 × 844, cố gắng thấy trọn nút bắt đầu ở cỡ chữ mặc định. Khi màn thấp hoặc phóng chữ, cho cuộn tự nhiên, không ép chiều cao cứng.
- Ba biển ga mặc định là chỉ dẫn hành trình. Nếu cần bấm để chọn ga xuất phát, tách thành yêu cầu hành vi rõ; không tạo nút giả.
- Chữ và nút thật nằm trên HTML; tranh là trang trí, không giành focus và không chặn pointer.
- Nội dung/thao tác không chờ animation chạy xong hoặc chờ tải đủ tranh mới dùng được.

### 5.2. Thông số để thử nghiệm

| Thành phần | Hành vi khởi điểm | Reduced motion/mobile |
| --- | --- | --- |
| Núi xa | Hiện nhẹ một lần, sau đó đứng yên | Hiện ngay |
| Núi gần | Parallax theo con trỏ khoảng 4–10 px trên desktop nếu đo thấy mượt | Tắt parallax trên cảm ứng và reduced motion |
| Mây | Trôi chậm, chu kỳ khoảng 40–70 giây, tránh vùng chữ | Mobile ít lớp hơn; reduced motion đứng yên |
| Cò | Một hoặc hai con, mỗi lượt khoảng 10–16 giây, nghỉ khoảng 15–30 giây | Giảm số lượng; reduced motion dùng bố cục tĩnh |
| Cò bay sâu | Đường cong đi từ rìa vào cảnh, nhỏ dần và đi sau lớp núi/mây | Không phóng sát mặt hoặc đi qua CTA |
| Tàu | Ở sân ga với khói nhẹ; khởi hành khi người dùng bắt đầu | Vào bản đồ trực tiếp khi reduced motion |
| Lá/cánh hoa | Chỉ thêm sau khi núi–mây–cò đạt nghiệm thu và cảnh còn thoáng | Không mặc định thêm trên mobile |
| Logo/chữ/nút | Ổn định sau xuất hiện | Không hiệu ứng lặp |

Các khoảng thời gian trên không phải mục tiêu bắt buộc; tinh chỉnh dựa trên độ dễ đọc và thử thiết bị.

### 5.3. Vòng đời và khả năng truy cập

- Có “Tắt hiệu ứng” ngay trang đầu và đồng bộ với điều khiển giảm chuyển động chung; tránh hai cờ điều khiển mâu thuẫn.
- Tôn trọng `prefers-reduced-motion`; nếu cho phép ghi đè thủ công, quy định rõ thứ tự ưu tiên, không âm thầm bật lại khi đổi màn.
- Dừng hiệu ứng khi trang đầu ẩn hoặc tab không hiển thị. Khi quay lại không nhân đôi listener, timer hoặc animation.
- Chuyển cảnh có bỏ qua/Escape; hoàn tất hoặc bỏ qua đều đi đến đúng điểm một lần và trả focus hợp lý.
- Không dùng âm thanh tự phát để bù cho cảnh; không thêm nhạc nền. Tái sử dụng điều khiển âm thanh hiện có.
- Ưu tiên `transform`/`opacity`, không cập nhật layout mỗi frame; không gắn `will-change` cho toàn trang.
- Bản tĩnh phải đẹp và đầy đủ chức năng. Asset lỗi hoặc máy yếu không được chặn vào bản đồ.

## 6. Kế hoạch thực hiện tuần tự

### GV-00 — Rà soát trước code và thiết lập baseline

**Phụ thuộc:** người dùng đã yêu cầu bắt đầu triển khai.

1. Xác nhận đúng cwd, đọc AGENTS.md áp dụng và quyền đã cấp trong phiên.
2. Kiểm tra Git/working tree. Nếu vẫn không có Git, không tự init; chụp bản trước thay đổi của các file sẽ sửa, ghi hash và chuẩn bị diff có thể đảo.
3. Kiểm tra CodeGraph có index hay không; dùng tìm kiếm thông thường nếu không có.
4. Đọc lại source ở các điểm sẽ sửa, asset/font đang nạp, template tạo động, breakpoint và event handler liên quan. Không dựa hoàn toàn vào comment/README.
5. Mở ứng dụng trên trình duyệt, ưu tiên HTTP khi kiểm tra cách tải tài nguyên/hiệu năng. Nếu cần server tạm, chỉ bind loopback, dùng cổng trống và dừng đúng server do mình tạo.
6. Chạy baseline phù hợp trong `verification/`; kiểm tra script có ghi file hoặc chạy dịch vụ trước khi thực thi. Không dùng cờ tạo fixture không cần thiết.
7. Tái hiện/phân loại EXIST-RAIL và EXIST-HARNESS. Chụp màn quan trọng và ghi rõ giới hạn browser.
8. Kiểm kê DATA, ALL_DECKS_MAP, ID điều khiển, handler, font và luồng chơi phải bảo toàn.

**Nghiệm thu:** có baseline của nguồn hiện tại, danh sách thay đổi có sẵn, lỗi trước sửa và cách rollback. Mọi thiếu thông tin chỉ chặn phần phụ thuộc; tiếp tục phần độc lập đã được phép.

### GV-01 — Chốt bộ nhận diện và tài nguyên tối thiểu

**Phụ thuộc:** GV-00.

1. Chốt Gói Việt là tên hiển thị; danh sách nơi cần cập nhật gồm title trang, logo/lời chào, header, nhãn hỗ trợ truy cập và bưu thiếp.
2. Làm mẫu trang đầu desktop/mobile và một mẫu bài đọc hoặc thẻ để kiểm tra tính nhất quán ngoài trang đầu.
3. Thử bảng màu sáng/tối và font với tên ga/câu hỏi dài; xác minh asset/font cần dùng.
4. Hoàn thiện bộ asset tối thiểu ở mục 4.3, ưu tiên tài nguyên có thể dùng lại.
5. Ghi quyết định ngắn: nguồn logo, font được chọn/fallback, cách phân lớp và các lựa chọn còn mở. Nếu phải chờ người dùng chọn giữa những hướng khác biệt lớn, đưa mẫu cụ thể; không hỏi lại lựa chọn đã có.

**Nghiệm thu:** có mẫu review được ở cả hai kích thước; đủ asset cho trang đầu; chữ Việt đúng; các nguồn/font chưa xác minh được ghi rõ, không thay bằng tài nguyên không rõ quyền.

### GV-02 — Trang đầu Gói Việt từ tĩnh đến có chuyển động

**Phụ thuộc:** GV-01.

1. Dựng bố cục tĩnh trước; giữ điểm nối `introScreen`, `introWelcomeStage`, `introGuideStage` và các hành động đang hoạt động.
2. Đưa logo/chữ thật lên vùng thoáng; thay panorama đóng khung bằng cảnh liên tục phù hợp desktop/mobile.
3. Làm điều khiển hiệu ứng và fallback tĩnh trước khi thêm animation.
4. Thêm lần lượt mây → cò → chiều sâu núi; kiểm tra sau từng nhóm. Chỉ thêm lá nếu có lý do thị giác rõ.
5. Đồng bộ sáng/tối, reduced motion và vòng đời đóng/mở intro.
6. Kiểm tra tải chậm, mất một lớp ảnh, logo lỗi, font fallback và quay lại trang đầu nhiều lần.

**Nghiệm thu:** logo/CTA không bị che; không tràn ngang; có thể dùng ngay; mobile không phải desktop thu nhỏ; tắt hiệu ứng dừng chuyển động trang trí; cảnh ẩn không tiếp tục chạy.

### GV-03 — Hướng dẫn, quầy vé và khởi hành

**Phụ thuộc:** GV-02; sửa EXIST-HARNESS đúng contract trước khi dựa vào suite này.

1. Đồng bộ ba bước hướng dẫn, thẻ mẫu và chọn người theo bộ nhận diện.
2. Tái sử dụng cùng artwork tàu cho trang đầu và chuyển cảnh; giữ cơ chế clone/remap ID SVG khi phù hợp.
3. Giữ bắt đầu nhanh và hướng dẫn là hai nhánh dùng được; không ép người dùng xem hết phần giới thiệu.
4. Bảo toàn callback chạy đúng một lần, khóa thao tác lặp, skip/Escape, inert và focus-return.
5. Kiểm tra chuyển cảnh khi resize, quay lại lời chào, bấm nhanh, tắt chuyển động giữa chừng và dùng bàn phím.

**Nghiệm thu:** không màn trống, không kẹt overlay, không phát nhiều chuyển cảnh cùng lúc; đúng số người/lượt khi vào bản đồ; reduced motion vào trực tiếp.

### GV-04 — Bản đồ, chọn ga, bảng thông tin và rút vé

**Phụ thuộc:** GV-03.

1. Đồng bộ màu nền bản đồ, chữ/viền canvas, bảng ga, header, điều khiển, trạng thái chọn và các dấu hành trình.
2. Giữ hình học, ID địa phương và logic chọn/tìm/lọc. Không vẽ lại địa lý theo tranh trang trí.
3. Đồng bộ template `renderDemoPlaceList`: thứ tự thông tin, trường hợp có/không có ảnh, tên dài và một CTA rõ.
4. Đồng bộ vé ngẫu nhiên/chú giải bằng cùng bộ họa tiết, không thêm animation bắt buộc xem.
5. Kiểm tra tìm không dấu, không kết quả, chuyển phạm vi 3 ga/36 ga, lọc chủ đề, định vị, mobile xem bản đồ/danh sách.
6. Kiểm tra chọn ga mới khi tàu đang chạy, Hoàng Sa/Trường Sa và trở lại đất liền. Nếu EXIST-RAIL chặn nghiệm thu, sửa trong bước riêng có test trước/sau.

**Nghiệm thu:** ga chọn khớp panel/tuyến đi; không mất lựa chọn hoặc tiến trình; lớp trang trí không cản thao tác; đường biển và đường tàu vẫn được phân biệt đúng.

### GV-05 — Đọc chuyện, hai mặt thẻ và kỷ niệm

**Phụ thuộc:** GV-04.

1. Đổi chất liệu bài đọc và minh họa theo chủ đề; giữ cột đọc, nguồn, chú thích và xử lý ảnh lỗi.
2. Đồng bộ bộ bài úp, mặt hỏi, đáp án, giải thích và mặt chia sẻ; để họa tiết ngoài vùng văn bản chính.
3. Đồng bộ font/ngữ nghĩa trạng thái, không đổi luật đúng/sai/chưa biết, tự nguyện, bỏ qua và hoàn thành lượt.
4. Giữ hẹn giờ tùy chọn và biểu mẫu kỷ niệm dễ tìm; không đưa hiệu ứng bay vào khi đang đọc/nhập.
5. Kiểm tra hết bài/rút lại, trả lời dài, hỗ trợ người thân, đổi hoạt động, lật qua lại giữ nháp, lưu kỷ niệm và bấm lặp.
6. Kiểm tra tên địa danh không khớp, thiếu tên, ghi chú trống/dài, ký tự đặc biệt; không đưa dữ liệu người dùng vào HTML chưa escape.

**Nghiệm thu:** chạy trọn một lượt đến người kế tiếp; không mất nháp, ghi đè kỷ niệm hoặc tạo bản ghi ngoài ý muốn; giữ nhãn nội dung demo/nguồn và cảnh báo dữ liệu chỉ giữ trong phiên.

### GV-06 — Bưu thiếp Gói Việt và PNG thật

**Phụ thuộc:** GV-05.

1. Thiết kế bưu thiếp với logo, dấu ga, họa tiết và tranh nhỏ cùng nhận diện; giữ nội dung được ưu tiên hơn khung trang trí.
2. Cập nhật cả DOM xem trước và `renderPostcardCanvasPreview`, vai trò `canvasFont`, phần chờ font/asset.
3. Dùng asset cùng nguồn hoặc cách nạp phù hợp để canvas vẫn xuất được ảnh; không thêm ảnh ngoài làm canvas mất quyền xuất.
4. Giữ `includeInPostcard` mặc định false; xuất đúng những ghi chú người dùng chọn.
5. Kiểm tra phiên trống, chỉ đọc chuyện, nhiều dấu ga, nhiều ghi chú, tên dài, emoji và dấu Việt.
6. Tải PNG thật, xác nhận file tồn tại, mở file và đối chiếu với xem trước. Thông báo “đã tải” của ứng dụng chưa đủ làm bằng chứng.
7. Kiểm tra asset/font lỗi và lỗi xuất ảnh: có phản hồi rõ, thử lại được, không mất phiên.

**Nghiệm thu:** ảnh đúng nhận diện, không tràn cột, đúng lựa chọn riêng tư; có bằng chứng từ file tải thật. Nếu giới hạn ảnh chỉ chứa một số mục, hiển thị giới hạn rõ thay vì khiến người dùng tưởng đã lưu toàn bộ.

### GV-07 — Nghiệm thu xuyên suốt và bàn giao

**Phụ thuộc:** GV-02 đến GV-06 hoàn thành; mỗi lát cắt đã được kiểm thử trước đó.

1. Chạy lại bộ kiểm tra nguồn phù hợp và hành trình chính trên browser từ nguồn cuối.
2. Đo responsive, focus, tương phản, reduced motion và tải tài nguyên theo ma trận dưới đây.
3. Đo hiệu năng qua HTTP trên môi trường được ghi rõ; không dùng thời gian mở `file://` để kết luận tốc độ mạng.
4. Review diff toàn phạm vi, đối chiếu dữ liệu/ID/contract và sự nhất quán giữa trang đầu–map–thẻ–PNG.
5. Ghi báo cáo ngắn: Implemented, Verified, Unverified, Blocked; PASS/FAIL/SKIP và số case chưa chạy.
6. Dọn fixture trong RAM, tab/server do mình tạo, script tạm không cần giữ; giữ asset/license, diff và evidence cần review.
7. Không tự commit/push/deploy. Nếu cần tiếp tục vì blocker, lưu checkpoint có file, hash, kết quả và bước tiếp theo chính xác.

**Nghiệm thu:** không còn lỗi chặn hành trình trong phạm vi; rủi ro/giới hạn còn lại được ghi rõ; rollback khả dụng và không ảnh hưởng công việc khác.

## 7. Các điểm mã cần đọc lại trước khi sửa

Số dòng sẽ thay đổi trong triển khai; tìm bằng symbol/ID, không sửa theo số dòng cố định trong báo cáo cũ.

| Vùng | Điểm cần đọc | Contract phải giữ |
| --- | --- | --- |
| Token/font | `:root`, `[data-theme="dark"]`, `@font-face`, `UI_FONT_FAMILIES`, `UI_FONT_FACES` | Vai trò font DOM/canvas, fallback, tiếng Việt |
| Lời chào | `introScreen`, `introWelcomeStage`, `introGuideStage`, `homeTrainPanoramaCard` | Hai nhánh bắt đầu/hướng dẫn, trạng thái đóng/mở |
| Chuyển cảnh | `playTrainTransition`, `skipTrainTransition`, `prepareTransitionTrainArtwork`, `closeIntroModal` | Một lần hoàn tất, hủy timer, remap SVG ID, focus |
| Modal | `getTopOpenModalElement`, `syncBackgroundInertAndRenderState`, push/pop modal focus | Không thao tác xuyên lớp, Tab/Escape, trả focus |
| Ga và tìm kiếm | `renderDemoPlaceList`, `selectDemoPlace`, `setPlaceScope`, `setTopicFilter`, `onSearchProvinceInput` | ID ổn định, lọc/tìm/ARIA thống nhất |
| Bản đồ | `renderMainScene`, `requestMapRender`, `animateLoop`, rail/sea run | Hình học và hit-test, dừng render khi không cần |
| Chuyện/thẻ | `openStoryModal`, `openDeckFromStory`, `drawOneCard`, `revealCardAnswer`, flip helpers | Đúng nội dung, điều hướng và trạng thái lượt |
| Kỷ niệm | draft helpers, `recordMemoryPlaceFromCard`, `completeCardTurn` | Giữ nháp, chống ghi lặp, riêng tư |
| Bưu thiếp | `ensureUIFontsReady`, `renderPostcardCanvasPreview`, `downloadPostcardImage` | Chờ font/asset, opt-in, PNG thật |
| Reset | `resetEntireSession`, `performSessionReset` | Hủy không mất dữ liệu; xác nhận mới xóa phiên |

## 8. Ma trận kiểm chứng và Definition of Done

### Thiết bị và trạng thái

- Rộng 320, 390, 768, 1024, 1440 px; màn ngang thấp như 844 × 390.
- Sáng/tối; chuyển động thường/giảm; chuột/cảm ứng/bàn phím.
- Tăng chữ/zoom 200%; không cắt nội dung hoặc mất thao tác. Với bản đồ, giữ đường chọn ga bằng danh sách thay thế thao tác chính xác trên canvas.
- Kiểm tra Chrome/Edge đang có; nếu chưa có Safari/thiết bị vật lý thì ghi Unverified, không giả định tương đương.
- Screen reader ít nhất với trang đầu, điều khiển hiệu ứng, một modal đọc chuyện, đáp án và thông báo kỷ niệm nếu môi trường hỗ trợ.

Không bắt buộc chạy tích Descartes của mọi tổ hợp. Chạy đầy đủ các màn ở 390/1440, kiểm tra biên 320/ngang thấp, rồi bổ sung theo thay đổi và rủi ro.

### Kịch bản bắt buộc

1. Mở trang → bắt đầu ngay → chọn ga → đọc chuyện → rút thẻ → trả lời/giải thích → mặt chia sẻ → hoàn thành lượt.
2. Xem hướng dẫn → chọn 2 hoặc 6 người → lật thẻ mẫu bằng Enter/Space → khởi hành.
3. Mở/đóng trang đầu nhiều lần; bắt đầu/skip liên tiếp; đổi kích thước khi chuyển cảnh; bật reduced motion giữa chừng.
4. Chọn ga khi tàu đang chạy; đổi quần đảo khi thuyền đang chạy; quay về đất liền.
5. Tìm không kết quả, nơi không có ảnh, ảnh tải lỗi, tên dài, hết bài và phiên trống.
6. Nhập kỷ niệm giả → lật hai mặt → xác nhận nháp còn → lưu → bưu thiếp không chọn/chọn ghi chú → PNG thật.
7. Hủy reset giữ nguyên phiên; xác nhận reset dọn đúng phiên và trạng thái UI.
8. Tắt hiệu ứng nhưng vẫn đi hết hành trình; rời tab/quay lại không nhân đôi chuyển động.

### Chuẩn hoàn thành

- Trang đầu đáp ứng mood ảnh tham khảo nhưng chữ/CTA luôn rõ và thao tác được.
- Chữ thường đạt tương phản 4,5:1; chữ lớn 3:1; kiểm tra viền/focus và trạng thái cần nhận biết. Vùng bấm chủ đạo ưu tiên ít nhất 44 × 44 CSS px.
- Không tràn ngang, không chồng header/dock/modal, không mất nội dung khi tăng chữ.
- LCP ≤ 2,5 giây, INP ≤ 200 ms, CLS ≤ 0,1 là mục tiêu hiệu năng. Ghi môi trường và phân biệt số đo lab với dữ liệu người dùng thực; không tuyên bố đạt toàn bộ từ một lần đo.
- Trang mới không bắt buộc đợi tải animation để vào ứng dụng; nạp asset đúng kích thước, không nhúng thêm hàng loạt ảnh base64 lớn vào HTML.
- Không phát sinh vòng render nền chạy liên tục khi cảnh đã đóng; không nhân đôi timer/listener sau nhiều lần mở.
- Giữ dữ liệu văn hóa, ID và luồng chơi ngoài thay đổi được giao; mọi thay đổi hành vi phải có lý do và evidence riêng.
- PNG tải thật đúng font, bố cục và lựa chọn riêng tư.

Nguồn hướng dẫn: [WCAG Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Animation performance](https://web.dev/articles/animations-and-performance), [Core Web Vitals](https://web.dev/articles/vitals). Kiểm tra lại tài liệu nếu tiêu chí/phương pháp đo thay đổi tại thời điểm triển khai.

## 9. Evidence, rollback và bàn giao

- Mỗi lát cắt lưu một diff và bản ghi kiểm thử gọn, kèm hash nguồn, môi trường, phạm vi và giới hạn. Ưu tiên thư mục `verification/` hiện có; không tạo hệ thống báo cáo mới.
- Giữ bản trước thay đổi cho file đang sửa khi không có Git; thử khả năng đảo diff bằng kiểm tra không ghi trước khi coi rollback sẵn sàng.
- Rollback chỉ hoàn tác phần mình thực hiện. Nếu có thay đổi mới của người dùng, đọc lại và đối chiếu; không chép đè toàn bộ bản backup cũ.
- Asset mới được liệt kê; chỉ xóa khi chắc chắn không còn tham chiếu và không phải công việc của người khác.
- Fixture dùng dữ liệu giả; không lưu kỷ niệm thật/PII, secret hoặc env vào evidence. Dự án hiện không cần database/container/env cho nâng cấp này.
- Nếu có blocker, ghi chính xác lệnh/bước tái hiện, kết quả, cách đã thử và phần vẫn làm được. Không báo hoàn tất khi work item bắt buộc còn dang dở.

## 10. Tiến độ dự kiến và trạng thái

Ước lượng sơ bộ khi đã có asset đủ dùng: khoảng 10–16 ngày công cho một người làm tuần tự. Đây không phải cam kết lịch; thời gian tạo tranh, xác minh font và kết quả kiểm tra thiết bị có thể thay đổi ước lượng. Chốt lại sau GV-00/GV-01.

| Work item | Ưu tiên | Trạng thái hiện tại |
| --- | --- | --- |
| GV-00: baseline trước code | Bắt buộc đầu tiên | Verified — baseline mới, 56 PASS / 2 FAIL có sẵn |
| GV-01: nhận diện/asset | Chặn các bước dựng hình | Verified — SVG/fallback, mẫu desktop/mobile/đọc; 16 cặp tương phản đạt |
| GV-02: trang đầu | Trọng tâm yêu cầu | Verified — bố cục tĩnh rồi chuyển động; 8 browser PASS |
| GV-03: hướng dẫn/chuyển cảnh | Sau trang đầu | Verified — 10 browser PASS; motion suite 5 PASS, fixture đã sửa |
| GV-04: bản đồ/thông tin ga | Đồng bộ hành trình | Verified — sửa EXIST-RAIL; rail 13 PASS, browser 8 PASS |
| GV-05: chuyện/thẻ/kỷ niệm | Đồng bộ hành trình | Verified — nguồn chuyện 7 PASS; hành trình cuối giữ nháp/lưu/hết bài/đúng-sai/bỏ qua |
| GV-06: bưu thiếp/PNG | Đầu ra cuối hành trình | Verified — HTTP: 17 browser PASS; 5 PNG thật khớp preview, opt-in/retry |
| GV-07: nghiệm thu/bàn giao | Bắt buộc trước báo hoàn thành | Verified — nguồn 63 PASS, browser 214 PASS, bảo toàn 9 PASS; 0 FAIL; giới hạn ở mục 11 |

**Bước tiếp theo:** review kết quả tại `verification/goi-viet/report.md` và bộ hình fallback. GV-00 đến GV-07 đã triển khai; chưa commit/push/deploy. Các kiểm tra ngoài môi trường hiện có được liệt kê ở mục 11, không coi là đã PASS.


## 11. Nghiệm thu triển khai ngày 11/10/2026

- Implemented: logo Gói Việt bằng SVG/fallback có dấu, núi xanh nhiều lớp/cảnh mobile, mây/cò ngang và chiều sâu, cùng đoàn tàu; đồng bộ guide/map/đọc/thẻ/bưu thiếp; sáng/tối và tắt/giảm chuyển động.
- Verified: 63 source PASS, 214 browser PASS (Chrome 142 + Edge 44 + PNG 17 + chạm/vé 11), 9 bảo toàn PASS; 0 FAIL / 0 SKIP trong các case đã chạy. 10 PNG tải thật khớp bytes canvas, đúng opt-in và thử lại; kể cả file:// hoặc thiếu tranh/font.
- Responsive: 320/390/768/1024/1440 px và 844×390, đầy đủ màn sáng/tối ở 390/1440; bàn phím/focus, CSS zoom 200%, hành trình/nháp/hoàn thành/reset và failure path đã chạy.
- Hiệu năng lab HTTP loopback: LCP 916/620 ms, CLS 0,0078/0,0056 tại mobile/desktop; Event Timing 176/144 ms là proxy, không phải INP thực địa.
- Unverified: Safari, thiết bị vật lý, screen reader thật, zoom menu browser thật, tab nền thật (handler/animation kiểm tra bằng fixture), mạng production và Core Web Vitals thực địa. Không coi các mục chưa chạy này là PASS.
- Asset/font: 13 SVG diễn giải mood, Playfair Display/Be Vietnam Pro fallback. Chưa có binary/quyền webfont Hồn Rối và lettering logo chính xác; không cam kết giống hoàn toàn JPG. Fallback được dùng theo phạm vi đã cho phép, không chặn luồng chơi.
- Blocked: không có blocker hành trình trong môi trường nghiệm thu; không kết luận production-ready. DATA/ALL_DECKS_MAP và luật thẻ/nháp/kỷ niệm/reset giữ nguyên.
- Review/rollback/cleanup: xem `verification/goi-viet/report.md`, `final-results.json`, `final-review.diff`, baseline/snapshot từng GV. Đã dọn browser/server riêng; không DB/container/env. Giữ evidence để review; không commit/push/deploy hoặc dừng dịch vụ của người dùng.

</details>

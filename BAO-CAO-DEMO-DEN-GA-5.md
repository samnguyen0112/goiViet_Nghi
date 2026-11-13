# Demo “Đến ga mới mở bảng” — preview-5

Nghiệm thu chức năng lần đầu: 12/11/2026. Thiết kế lại giao diện theo phản hồi ảnh chụp: 13/11/2026. Trang demo: `map-surroundings-preview-5-arrival-demo.html`.

## Phạm vi và cách mở

Đây là bản HTML riêng, sao từ `map-surroundings-preview-5.html`. Không sửa tệp git đang theo dõi, không commit/push, không thêm thư viện và không lấy tài nguyên từ Internet. Dữ liệu ga, câu hỏi, hoạt động, kỷ niệm, sách bốn tập, trang Sắp có, bưu thiếp và ảnh cục bộ dùng nguyên nguồn của preview-5.

```powershell
node tools/perf/server.cjs
```

Mở [demo trên localhost](http://127.0.0.1:8770/map-surroundings-preview-5-arrival-demo.html). Có thể thêm `?lang=en` để mở bằng tiếng Anh. Demo hiện mở mặc định bốn sách đã có (Hà Nội, Huế, TP.HCM, Thanh Hóa); giữ nhãn Bản nháp theo danh mục gốc. Không cần `?sach=nhap` trong demo. Preview-5 gốc vẫn giữ quy tắc cũ: sách draft chỉ đọc với `?sach=nhap`. Nội dung và trạng thái danh mục không bị sửa.

Demo không nạp `offline-control-5.js`. Mục chuẩn bị ngoại tuyến được giữ trong DOM nhưng `hidden inert`; demo không đăng ký worker của preview-5. Các tài nguyên mới nạp qua `<script>`/`<link>` đều có `?v=`.

## Thiết kế lại ngày 13/11/2026

### Hoàn thiện theo năm góp ý mới

- Bưu thiếp đổi từ nền xanh nhạt sang nền hồng giấy ấm, chữ đỏ trầm; có màu riêng tương ứng ở nền tối.
- Danh sách ga được đưa vào nhóm công cụ của header, cạnh Bưu thiếp/ngôn ngữ. Màn 1366 dùng icon kèm title/aria-label đầy đủ; màn rộng và điện thoại hiện nhãn. Khi mở, chính nút này trở thành × trong góc bảng; đóng thì về header. Không xuất hiện hai nút cùng lúc. Header ở màn vừa dùng cột tự căn theo nội dung để nhóm thao tác không đè Ấn ga.
- Mũi tên tuyến thay bằng SVG đường ray, tà vẹt, điểm xuất phát và đầu chỉ đỏ son, nét giữ nguyên độ dày khi co giãn; không chạy hiệu ứng liên tục.
- Danh mục sách gốc đang đánh dấu bốn tập là draft. Demo đã dùng chung nội dung từ đầu nhưng URL thường bị chặn ở Sắp có. Bản sao reader riêng nay cho đọc sách nháp mặc định trong demo, vẫn giữ nhãn và trạng thái draft, không công bố hay sửa sách gốc. Ga chưa có sách vẫn hiện Sắp có.
- Tình trạng nội dung thật: Hà Nội có bản minh họa hiện có; Huế, TP.HCM, Thanh Hóa trong repo vẫn là khung nháp từ tập mẫu, gồm trang chữ/tranh giữ chỗ. Kiểm thử xác nhận mở được đúng tập, không coi các khung này là sách đã hoàn tất.
- Bảng đến ga được tinh chỉnh tổng thể: tiêu đề lớn hơn, tên dài có cỡ riêng, thêm dòng dẫn nhỏ VI/EN, ảnh viền nhẹ, giới thiệu có dấu lề, điểm nhấn gom trên giấy ấm, icon/nút có ô biểu tượng và chevron. Giữ đủ hai chế độ trong màn desktop và tiếp tục kiểm đủ 36 ga × VI/EN.

Ảnh của lượt hoàn thiện có tiền tố `refine-`. Các ảnh `editorial-*` ghi nhận bố cục của đợt trước. Đợt 3 dùng phiên bản `20261113-round3-1` cho tài nguyên riêng và `20261113-round3-2` cho tệp điều phối sau chỉnh vị trí banner.

Lượt xuất ảnh cuối kiểm thêm bốn sách đã tải xong (`busy=false`, `lastView>0`), giữ trạng thái draft. Hà Nội được bấm Mở sách sang trang đôi minh họa đầu tiên, xác nhận ảnh `edition-vi/01.webp` tải được với `naturalWidth=1536`, không tràn chữ. Kiểm vị trí header không chồng ở cả 1366/1920, nút danh sách nằm trong header ở 390 và × trở lại trong bảng khi mở. Số đo: `verification/arrival-demo-5/refine-verification.json`, `refine-reading.json`.

Ảnh mới: `refine-header-actions.png`, `refine-header-1366.png`, `refine-header-1920.png`, `refine-journey.png`, `refine-arrival.png`, `refine-book-hn.png`, `refine-book-hn-reading.png`, `refine-book-hue.png`, `refine-book-hcm.png`, `refine-book-th.png`, `refine-dark.png`, `refine-mobile.png`. Ảnh sách Hà Nội chờ ảnh bìa/trang đôi tải xong; phép kiểm riêng lưu ở `refine-reading.json`.

### Phương án hiện hành: bố cục cẩm nang, ba thẻ đồng bộ

Theo phản hồi mới nhất, imagegen được dùng để **thiết kế toàn bộ bố cục UI**, không tạo họa tiết gắn lên thẻ. Ba bản thiết kế hoàn chỉnh đã chuyển sang `verification/arrival-demo-5/design-refs/`: `design-directory-v2.png`, `design-arrival-v2.png`, `design-journey-v2.png`. Prompt nguyên văn được lưu trong `verification/arrival-demo-5/design-refs/editorial-design-prompts.md`; dùng công cụ imagegen tích hợp, không dùng CLI/API fallback. Ba ảnh này chỉ là tham chiếu thiết kế, không được nạp vào trang web.

- **Danh sách ga:** dòng có số thứ tự và tên ga serif, nội dung phụ sans, chevron cùng nét; bỏ thumbnail minh họa và nhãn nguồn lặp trên từng dòng. Trạng thái đã chơi/đọc vẫn giữ. Chỉ một nút hiển thị `#previewPanelOpen` điều khiển bảng: khi đóng có nhãn Danh sách ga; khi mở chuyển thành × ngay trong góc bảng, aria-label Đóng danh sách. Nút cũ được giữ ẩn để mã tương thích. Sổ hành trình và tìm kiếm giữ nguyên chức năng.
- **Bảng đến ga:** bỏ toàn bộ cột vé hoa văn; ảnh thật 16:9 nằm cạnh tên ga và lượt người chơi. Giới thiệu chạy đủ chiều ngang; ba điểm nhấn có cột nhãn/giá trị thẳng hàng và đường phân cách mảnh. Hai chế độ dùng chữ sans: đỏ son cho Chơi thẻ, nền giấy/viền mảnh cho Đọc sách. Nguồn ảnh, thuyền Hoàng Sa, focus và dữ liệu cũ giữ nguyên.
- **Thẻ hành trình:** bỏ tranh tàu, dùng icon tàu nhỏ đồng bộ và đường nối hai tên ga. Phân cấp trạng thái → tuyến → thời gian/điểm nhấn; nút Khám phá nằm riêng bên phải. Bỏ outline đỏ của khối văn bản không tương tác; các nút/ô tìm vẫn có focus bàn phím.
- **Kiểu chữ/màu:** Playfair Display cho tên/tiêu đề, Be Vietnam Pro cho nội dung/nút; nền ngà, xanh mực `#173f35`, đỏ `#9e2835`, đường kẻ vàng trầm. Một viền và bóng nhẹ, không nạp tranh AI, không hiệu ứng dát vàng hay khung nổi. Có biến thể nền tối và giảm chuyển động.

| Màn hình | Rộng bảng phải | Chiều cao và trình bày |
| --- | ---: | --- |
| 1366×768 | 392 px (28,7%) | Bám dưới header, giới hạn trước dock; tối đa khoảng 502 px. Danh sách ba ga đo được cao 488,47 px; đủ Sổ hành trình không cuộn. |
| 1920×1080 | 420 px (21,9%) | Cao theo nội dung: danh sách ba ga đo được 510,47 px; không kéo kín cột để tạo khoảng trống. |
| 390×844 | 370 px | Tấm nổi phía dưới, cách mép 10 px; cuộn dọc khi cần, không tràn ngang. |

Hai bảng dùng cùng vị trí/chiều rộng và không mở cùng lúc. Thẻ hành trình vẫn nằm trong vùng bản đồ còn lại; camera, la bàn và dock nhận vùng an toàn như trước. Hai minh họa `departure-rail-art-v1.png` / `arrival-gold-seal-v1.png` chỉ còn là tài liệu thử cũ, đã bỏ khỏi CSS và preload. Mã CSS/JS dùng phiên bản `20261113-editorial-2`.

Ảnh và kiểm thử cuối của phương án mới có tiền tố/hậu tố `editorial`; các tài liệu thử cũ được ghi rõ bên dưới.

## Những gì đã làm

### P0

- Vào bản đồ: bản đồ rộng, danh sách đóng mặc định, một dòng gợi ý với Hà Nội, Huế, TP.HCM; dòng này ẩn sau lần chọn đầu tiên.
- Chọn ga chỉ chuẩn bị tuyến. Thanh có điểm đi/đến, số giây ước tính, danh thắng và món ăn, nút **Khám phá**. Chưa hiện chế độ chơi.
- Khám phá khởi hành, khóa nút và cập nhật tiến độ. Đến nơi mới mở bảng riêng; ga đang đứng mở ngay khi bấm Khám phá. Chọn lại ga đang đứng vẫn chuẩn bị nút Khám phá; đóng bảng mà không chọn lại thì có **Mở thông tin ga**.
- Bảng đến ga là dialog không chặn nền, có ảnh 16:9/ảnh nền contain và nguồn ảnh, lượt người chơi, tiêu đề nhận focus, giới thiệu, ba dòng điểm nhấn và hai chế độ. Dùng lại các hàm `renderStationArt`, `renderHighlights`, `renderModes` từ bản sao thành phần ga.
- Bảng và danh sách loại trừ nhau. Danh sách giữ ô tìm, 3 ga khởi đầu/tất cả 36 ga, dòng gọn và Sổ hành trình; bỏ thẻ ga đang chọn có ảnh/chế độ. Enter ưu tiên tên ga khớp chính xác trước kết quả khớp vùng; ví dụ “danang” chọn Đà Nẵng trước Hoàng Sa.
- Chế độ chỉ mở cho ga tàu đang đứng, qua nguồn trong bảng. Giữ ngoại lệ sách từ lá bài cùng ga và ảnh trong bảng. Đóng sách/bộ thẻ giữ bảng và trả focus về nút nguồn; số lá cập nhật mà không thay node nút nguồn.
- Chọn ga khác đóng bảng; chọn khi đang chạy giữ chuyến hiện tại. Tới nơi mở bảng của ga vừa đến và thanh giữ ga chọn cho chặng tiếp. Khởi hành chặng kế tiếp đóng bảng cũ.
- Bấm vùng trống đóng bảng và giữ trạng thái đến ga. Esc đi qua modal → danh sách → bảng → bỏ chọn tuyến.
- Các lối chọn cũ vẫn đi qua `selectDemoPlace`: canvas, chip, tìm kiếm, quần đảo, miền ở trang chủ, Sổ hành trình và gợi ý sau lá bài.
- Cả hai nhánh Rút vé đều lên tàu trước; tới nơi mới gợi ý/focus Chơi thẻ hoặc Đọc sách. Có nhãn VI/EN và cập nhật nhãn khi đổi ngôn ngữ.
- Mọi chuỗi giao diện mới có cặp VI/EN với tiền tố `arrival.`. Tên và nội dung ga dùng lớp nội dung tiếng Anh hiện có. Có thông báo chọn/khởi hành/đến/mở/đóng qua `announceSR`; không đọc từng bước tiến độ.
- Font Playfair Display/Be Vietnam Pro, giấy, đỏ son `#9e2835`, viền vàng, dùng token thành phần ga và lớp `giay-do-surface khung-moc`; có nền tối và giảm chuyển động.
- Vùng an toàn tính cả bảng đến ga trong `syncMapControlLayout`/`mapScreenArea`, thông báo qua `GoiVietMapFrame.syncSafeArea`; bộ nhớ đệm nhãn cũng biết bảng mới. Camera giữ ga đến trong vùng còn lại.
- Hoàng Sa giữ `photoUrl: null`, dùng biểu tượng thuyền, không dựng ảnh giả hoặc đường dẫn ảnh thiếu.

### P1

1. Chú thích rê chuột dùng trạng thái hover từ `hitTestCanvasAt`, gộp DOM theo rAF, không yêu cầu vẽ thêm bản đồ. Có tên, danh thắng, món và nhãn Đã đặt chân.
2. Dùng banner đến ga hiện có trong khoảng 1,5 giây; câu thơ từ nguồn hiện có, EN dùng lời giải nghĩa sẵn có. Giảm chuyển động bỏ banner và hiệu ứng trượt.
3. “Đang qua…” lấy từ `plan.nodeIds` và tiến độ; chỉ sửa chữ khi đổi ga/tỉnh đang đi qua.
4. Đến ngay cho ga đã đặt chân và khi đang chạy; không đổi thời lượng hoạt cảnh gốc.
5. Tập ga đã đặt chân chỉ ở RAM phiên, độc lập Ấn ga/bưu thiếp. Hà Nội tính là ga xuất phát đầu tiên. Bảng ghi thứ tự ga, Sổ hành trình có “Đã đặt chân N/36”.
6. Gợi ý sau lá bài đóng bộ bài, chuẩn bị ga kế tiếp và thông báo ngắn.

### P2

Không triển khai vệt chặng đã đi, chuyến mẫu ba ga hoặc phần tinh chỉnh điện thoại nâng cao. Màn hẹp có tấm trượt từ dưới, cuộn dọc và không tràn ngang theo mức tối thiểu P0. Desktop là phạm vi trình chiếu chính.

## Các tệp mới

Các PNG thiết kế hiện hành và prompt đã liệt kê ở phần thiết kế. Hai PNG minh họa đời trước cùng `verification/arrival-demo-5/design-refs/imagegen-prompts.md` đã được chuyển cùng các ảnh tham chiếu để đối chiếu lịch sử, không nạp trong demo.

Mỗi bản sao có dòng đầu ghi nguồn và thay đổi. Tất cả đường dẫn dưới đây thuộc repo.

| Tệp | Nguồn / thay đổi |
| --- | --- |
| `map-surroundings-preview-5-arrival-demo.html` | Sao từ `map-surroundings-preview-5.html`: title, tệp nạp riêng, bỏ worker, ẩn chuẩn bị ngoại tuyến, danh sách gọn, ưu tiên tên tìm kiếm, cổng mở chế độ, Rút vé, Esc và vùng an toàn. Dữ liệu giữ nguyên. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js` | Mới: điều phối bảng/danh sách, focus, khóa chế độ, chuỗi `arrival.*`, lượt đã đến, banner và tooltip. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css` | Mới: bố cục bảng, thanh, gợi ý, sáng/tối và tấm trượt màn hẹp. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js` | Sao `../journey-system-5.js`: giữ mạng tuyến, đồng hồ, dừng khi modal, render/cache; đổi điều khiển, sự kiện đến ga, bỏ chế độ trùng, thêm Đến ngay và tỉnh đang qua. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/station-panel-arrival-5.js` | Sao `../station-panel-5.js`: xuất ba hàm dựng ảnh/điểm nhấn/chế độ; danh sách có số thứ tự/tên gọn, bỏ thumbnail và badge lặp; giữ ảnh, nguồn và trạng thái đã chơi/đọc. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/station-panel-arrival-5.css` | Sao `../station-panel-5.css`: áp token/thành phần cho bảng mới, chỉnh URL font/giấy theo thư mục con. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/polish-arrival-5.js` | Sao `../polish-5.js`: danh sách đóng mặc định, một nút bật/tắt, dùng được cả màn hẹp; giữ ô tìm ở vị trí DOM cố định để không mất focus khi chiều cao đổi. |
| `verification/arrival-demo-5/design-refs/design-directory-v2.png`, `design-arrival-v2.png`, `design-journey-v2.png` | Ba thiết kế UI hoàn chỉnh do imagegen tạo, chỉ để tham chiếu bố cục, không nạp vào website. |
| `verification/arrival-demo-5/design-refs/editorial-design-prompts.md` | Prompt cuối cho ba thiết kế, thông tin công cụ và vai trò ảnh tham chiếu. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/book-reader-arrival-5.js` | Sao từ `assets/goi-viet/books-5/book-reader-5.js`: chỉ bật quyền xem sách draft mặc định cho demo. Giữ toàn bộ trình đọc, nguồn nội dung, trạng thái, VI/EN và cách ghi nhận ga đã đọc. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/label-performance-arrival-5.js` | Sao `../label-performance.js`: thêm `#arrivalSheet` vào các vùng tránh của nhãn; giữ cache và cơ chế invalidation. |
| `assets/goi-viet/map-surroundings-preview/arrival-demo-5/fortune-ritual-arrival-5.js` | Sao `../fortune-ritual-5.js`: nhãn lên tàu VI/EN, cập nhật ngôn ngữ, không rút ngẫu nhiên đúng ga tàu đang đứng. Giữ nghi thức, câu thơ và dữ liệu. |
| `tools/check-arrival-demo-5.cjs` | Mới: e2e, ảnh chụp, kiểm tra git và so hiệu năng. Dùng `launch`/`BASE` hiện có, context chặn service worker, timeout từng thao tác/ca, đóng browser trong `finally`, lỗi trả mã khác 0. |
| `BAO-CAO-DEMO-DEN-GA-5.md` | Báo cáo này. |

## Kết quả kiểm thử

Lượt cuối sau hoàn thiện năm góp ý kết thúc lúc **06:50 ngày 13/11/2026** (UTC+7), trả mã **0**, **37/37** ca đạt: 35 ca bắt buộc (17 ca ở mỗi cỡ desktop và ca 13 ở 390×844), cùng hai ca chọn ga khi đang chạy. Phần rà 144 bố cục chạy riêng ngày 13/11, **2/2** ca đạt. Ca màu tối kiểm cả dòng dẫn/trạng thái mới ở hai màn. Tách nhóm bổ sung giúp mỗi lượt giữ giới hạn 900 giây.

Ca 15 của bộ cuối kiểm cả nền bảng không còn gradient/ảnh nền sáng. Phép tính tương phản vì vậy dùng đúng màu nền thật dưới chữ. Các tệp JSON đều ghi 0 lỗi console/page và 0 yêu cầu thất bại.

- Kết quả bộ bắt buộc và hiệu năng: `verification/arrival-demo-5/results.json`.
- Rà 144 bố cục VI/EN, **2/2** ca đạt: `verification/arrival-demo-5/station-layout-final.json`.
- Kiểm tra nền tối của thiết kế mới: ca 15 trong `verification/arrival-demo-5/results.json`. `dark-contrast-final.json` là lượt kiểm màu của thiết kế trước, ngày 12/11.
- Chrome headless qua `launch`/`BASE` hiện có, yêu cầu ANGLE D3D11 (`real`), không giảm tốc CPU. Context chặn service worker và mọi yêu cầu ngoài localhost.
- Vào bản đồ bằng nút `#memoryOpenMap`, chờ intro ẩn và màn che hết phủ, timeout 120 giây. Chỉ bỏ qua hoạt cảnh trang chủ; chọn ga ở các ca giao diện dùng chuột/bàn phím thật. Ghim được chiếu bằng `project3D(..., 38, ...)`, đối chiếu `hitTestCanvasAt` và phần tử nhận chuột trước khi bấm.

| Ca | Nội dung | 1366×768 | 1920×1080 | 390×844 |
| --- | --- | --- | --- | --- |
| 1 | Vào bản đồ; nút danh sách trong header, nhóm header không đè nhau; đúng chiều rộng và Sổ hành trình thấy trọn | PASS | PASS | — |
| 2 | Bấm ghim Huế bằng chuột thật; tuyến, thời gian và điểm nhấn | PASS | PASS | — |
| 3 | Khám phá chạy tàu, khóa nút, tăng tiến độ; không chế độ | PASS | PASS | — |
| 4 | Ảnh tải, ba điểm nhấn, hai nút, không cuộn/chồng UI, camera/focus | PASS | PASS | — |
| 5 | Rút một lá bằng Enter; số lá giảm, giữ bảng và trả focus | PASS | PASS | — |
| 6 | Sách Huế mở mặc định, đóng quay lại; cổng chế độ | PASS | PASS | — |
| 7 | Hà Nội đang đứng; EN trước vào bản đồ; sách mở không cần tham số, ảnh/liên kết trong lá; thêm ba tập còn lại ở 1366 | PASS | PASS | — |
| 8 | Ga đã đặt chân có Đến ngay và mở tức thì | PASS | PASS | — |
| 9 | Hoàng Sa: chặng biển, thuyền, không ảnh hỏng/404; sách chưa có vẫn Sắp có | PASS | PASS | — |
| 10 | Chỉ bàn phím: bun bo, danang, saigon; Khám phá và thứ tự Esc | PASS | PASS | — |
| 11 | Rút vé: hai nhánh lên tàu trước, đúng nút nhận focus khi đến | PASS | PASS | — |
| 12 | Sau lá bài: ghi kỷ niệm, chọn gợi ý, đóng bộ bài, tuyến sẵn sàng | PASS | PASS | — |
| 13 | EN đổi trực tiếp trong UI mở, danh sách/tooltip, không tràn/cắt chữ | PASS | PASS | PASS |
| 14 | Giảm chuyển động: đến tức thì, không trượt/banner | PASS | PASS | — |
| 15 | Nền tối, ảnh chụp và tương phản (đã chạy lại sau sửa nền) | PASS | PASS | — |
| 16 | Sổ hành trình: ga, kỷ niệm đã ghi và bưu thiếp | PASS | PASS | — |
| 17 | Không lỗi console/page, request thất bại hoặc HTTP lỗi | PASS | PASS | — |

Hai ca bổ sung ở **mỗi** cỡ desktop đều đạt:

- Chọn ga mới khi tàu đang chạy: tàu vẫn tới ga cũ, bảng thuộc ga vừa tới, thanh giữ ga kế tiếp. Đóng/mở lại giữ đúng focus; khởi hành tiếp đóng bảng cũ; Đến ngay trong lúc chạy hoạt động.
- Cả **36 ga × VI/EN**, tổng **144 bố cục**: ảnh 16:9, tiêu đề, giới thiệu, ba điểm nhấn, hai chế độ và liên kết cuối bảng nằm trong bảng/khung nhìn, không cuộn ngang hoặc dọc ở desktop, không đè thanh hành trình/điều khiển/quần đảo/la bàn/header; điểm đến ngoài vùng bảng che. Trang Sắp có vẫn đúng ga.

Tương phản chữ nhỏ nhất của bảng tối sau hoàn thiện: **6.57:1** ở cả hai cỡ, đạt ngưỡng 4,5:1.

Lượt đầu của bố cục tự cao phát hiện lỗi bàn phím ở 1920×1080: ô tìm bị chuyển DOM khi số kết quả làm bảng vượt/ngắn hơn ngưỡng 600 px. Đã sửa bản sao polish để giữ ô tìm cố định và chỉ cho phần kết quả/cuốn sổ cuộn; chạy lại cả bộ đạt 37/37. Không tính lượt lỗi thành PASS.

Lượt xuất ảnh cuối còn kiểm riêng: × nằm trong góc danh sách, bấm lại đóng bảng, Sổ hành trình thấy trọn trên desktop; focus ô tìm có màu vàng sáng ở nền tối; × vẫn nằm trong tấm trượt ở 390×844 và trang không cuộn ngang. Số đo ghi ở `verification/arrival-demo-5/editorial-capture.json`; ảnh bổ sung: `editorial-directory-dark-final.png`, `editorial-mobile-final.png`.

### Hồi quy preview-5

Hai bộ e2e của bảng/ảnh gốc đã đạt ngày 12/11/2026; các tệp gốc tiếp tục không thay đổi trong đợt thiết kế lại. Kiểm tra manifest, khóa ngôn ngữ và git được chạy lại ngày 13/11/2026.

| Lệnh | Kết quả |
| --- | --- |
| `node tools/check-station-panel-5.cjs` | PASS (12/11): bảng ga gốc, 6 cỡ, chuyến tàu, thẻ, kỷ niệm, bưu thiếp, bốn sách nháp, 32 lời mời và nền tối |
| `node tools/check-station-photos-5.cjs` | PASS (12/11): 35 ảnh + thuyền Hoàng Sa, 6 cỡ × 2 ngôn ngữ, 36 lối mở sách, chuẩn bị ngoại tuyến và 72 khung tải lạnh offline |
| `python tools/build-preview-5-offline.py --check` | PASS: manifest đúng, không ghi tệp |
| `node tools/check-i18n-5.cjs` | PASS: 262 khóa markup, 270 khóa mã, có đủ VI/EN |
| `git diff --quiet` | Mã 0, không thay đổi tệp đang theo dõi |
| `git status --porcelain` | Chỉ `??` cho HTML demo, thư mục tài nguyên demo, harness và báo cáo |

Danh sách hiển thị trọn tên/điểm nhấn bằng xuống dòng, không dùng dấu ba chấm; mở lại đưa ô tìm về vùng nhìn thấy.

Các phát hiện đã sửa trong các lượt dò: ưu tiên tên Đà Nẵng trước kết quả khớp vùng Hoàng Sa; ô tìm mất focus do bị chuyển DOM khi bảng cao; nút bị giới hạn chiều rộng cũ; menu Tùy chọn nằm dưới bảng; gradient giấy sáng ở nền tối. Harness cũng được sửa để kiểm chữ thực tế, tránh nhầm vùng ảnh/ảnh nền blur được cắt có chủ đích thành chữ bị cắt. Ảnh được kiểm riêng bằng tỉ lệ và kích thước tự nhiên. Nút vé kiểm vùng chữ, bỏ qua mép khuyết trang trí; thao tác Enter chờ focus khởi tạo của modal; ghim chờ vùng hit đồng bộ với khung đã vẽ. Các lần dò lỗi/timeout trước đó không được tính là PASS; khâu phục hồi cũng có timeout riêng.

Trong đợt thiết kế lại, phép đo chữ phát hiện line-height tiêu đề quá thấp với dấu tiếng Việt; đã tăng lên 1.28 rồi chạy lại đủ 144 bố cục. Assertion nhãn Đã đến ga được đổi thành không phân biệt hoa/thường vì nhãn mới có `text-transform: uppercase`; assertion thuyền được giới hạn vào phần ảnh để không đếm nhầm dấu vé trang trí. Nội dung và điều kiện hành vi vẫn được kiểm như trước.

## Hiệu năng so với preview-5

Cùng kịch bản: vào bản đồ, bấm ghim TP.HCM thật, chờ 700 ms rồi bấm nút khởi hành/Khám phá; thu rAF và `PerformanceObserver('longtask')` đến lúc tàu tới nơi. Viewport 1366×768; ba lượt mỗi bản, xen kẽ bản gốc → demo; context mới cho mỗi lượt. Không có kiểm thử trình duyệt khác chạy song song trong giai đoạn đo.

| Bản | Lượt | rAF trung vị (ms) | rAF trung bình (ms) | P95 (ms) | Long task: số / tổng ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| Preview-5 | 1 | 16.70 | 16.72 | 16.80 | 0 / 0 |
| Demo | 1 | 16.70 | 16.77 | 16.80 | 0 / 0 |
| Preview-5 | 2 | 16.70 | 16.72 | 16.80 | 0 / 0 |
| Demo | 2 | 16.70 | 16.72 | 16.80 | 0 / 0 |
| Preview-5 | 3 | 16.70 | 16.77 | 16.80 | 0 / 0 |
| Demo | 3 | 16.70 | 16.82 | 16.80 | 0 / 0 |

| Trung vị qua 3 lượt | Preview-5 | Demo |
| --- | ---: | ---: |
| Trung vị rAF (ms) | 16.7 | 16.7 |
| Trung bình rAF mỗi lượt (ms) | 16.72 | 16.77 |
| P95 rAF (ms) | 16.8 | 16.8 |
| Tổng long task mỗi lượt (ms) | 0 | 0 |
| Số long task mỗi lượt | 0 | 0 |

Chênh trung vị rAF **0.0%**; trung vị thời gian khung trung bình tăng khoảng **0.30%**. Ngưỡng 10% cho trung vị, trung bình, P95 và trung vị tổng long task: **PASS**. Cả sáu lượt không ghi nhận long task. Không suy rộng số đo ba lượt này sang mọi máy chiếu/GPU.

Khi bảng mở và đứng yên, sau 4,5 giây ổn định, quan sát thêm 1,8 giây: **0 base frame, 0 reused frame** tăng thêm. Bản đồ không duy trì vòng vẽ liên tục.

## Ảnh chụp

Thư mục: `verification/arrival-demo-5/`. Với mỗi tên dưới đây có cả hai tiền tố `1366x768-` và `1920x1080-`:

| Hậu tố tên ảnh | Trạng thái |
| --- | --- |
| `01-start.png` | Bản đồ ban đầu |
| `02-route.png` | Chọn ghim, chuẩn bị tuyến |
| `03-moving.png` | Tàu đang chạy |
| `04-arrived.png` | Bảng đến ga |
| `05-card.png` | Lá bài thật |
| `06-book.png` | Sách / trang chờ đúng ga |
| `07-current.png` | Hà Nội đang đứng, EN trước khi vào bản đồ |
| `08-revisit.png` | Quay lại ga đã đặt chân |
| `09-hoang-sa.png` | Thuyền Hoàng Sa |
| `10-keyboard.png` | Sau chuỗi bàn phím/Esc |
| `11-ticket-destination.png` | Vé hướng tới Chơi thẻ |
| `11-ticket-story.png` | Vé hướng tới Đọc sách |
| `12-next-stop.png` | Ga gợi ý sau lá bài |
| `13-english.png` | Bảng tiếng Anh |
| `13-list-english.png` | Danh sách/Sổ hành trình tiếng Anh |
| `13-tooltip-english.png` | Chú thích ghim tiếng Anh |
| `14-reduced.png` | Giảm chuyển động |
| `15-dark.png` | Nền tối cuối, sau khi bỏ gradient sáng |
| `16-postcard.png` | Kỷ niệm trong bưu thiếp |
| `extra-queued-arrival.png` | Chọn ga khi tàu chạy, rồi đến ngay chặng kế |
| `extra-36-stations.png` | Trạng thái cuối lượt rà đủ 36 ga VI/EN |
| `imagegen-departure.png` | Ảnh riêng thẻ khởi hành có minh họa tàu đỏ son |
| `imagegen-arrival.png` | Ảnh riêng thẻ đến ga có vé sen/chim Lạc vàng |
| `editorial-directory.png` | Bản hiện hành: danh sách có một điều khiển mở/đóng |
| `editorial-departure.png` | Bản hiện hành: tuyến đi, thời gian và nút Khám phá |
| `editorial-arrival.png` | Bản hiện hành: ảnh cạnh tiêu đề, thông tin và hai chế độ |

Ảnh màn hẹp: `390x844-13-start-english.png`, `390x844-13-sheet-english.png`, `390x844-13-list-english.png`. Ảnh đứng yên sau đo: `perf-idle-sheet.png`.

Ảnh bàn giao cận ba thẻ hiện hành: `editorial-directory-final.png`, `editorial-arrival-final.png`, `editorial-journey-final.png`. Các ảnh `redesign-*` và `imagegen-*` là thiết kế đời trước. Ảnh ca kiểm chính được chụp lại khi chạy bộ kiểm thử sau thiết kế lại.

Các ảnh `*-FAIL-*.png`, `probe-*.png` và `imagegen-*-probe.png` là bằng chứng lượt dò, không phải ảnh bàn giao cuối. `results-before-ticket-metric-fix.json` cũng là lượt dò cũ. Bảng kết quả cuối và các JSON nêu trên là căn cứ nghiệm thu. Đợt imagegen có một lượt thử song song bị lỗi capture/timeout của Chromium; đã dừng đúng tiến trình kiểm thử bị treo và chạy các bộ lần lượt. Các lượt lỗi không được tính là PASS; không đóng trình duyệt của người dùng.

## Giới hạn còn lại

- **Không có ca P0/P1 chưa đạt** trong phạm vi kiểm tự động nêu trên.
- P2 chưa làm: vệt chặng cũ, chuyến mẫu ba ga, tinh chỉnh điện thoại nâng cao. 390×844 dùng cuộn dọc trong tấm trượt; desktop không cần cuộn để tới hai chế độ.
- Chưa kiểm máy chiếu thật, trình đọc màn hình thật, màn 4K/zoom 200%, Firefox/Edge hay GPU phần mềm riêng. Đã kiểm focus, aria, bàn phím và thông báo live bằng DOM/Chrome; không coi đó là nghiệm thu NVDA/JAWS.
- Thơ và nội dung văn hóa vẫn là nguồn cũ; tiếng Anh dùng bản dịch hiện có. Đợt 3 đã cập nhật toast đang hiển thị ngay khi đổi VI/EN, gồm thông tin ga tiếp theo đã chuẩn bị.
- Dấu đã đặt chân và các tiến trình vẫn chỉ tồn tại trong phiên. Nội dung sách nháp không được tự xuất bản.

## Chạy lại kiểm thử

Mở máy chủ trong cửa sổ thứ nhất:

```powershell
node tools/perf/server.cjs
```

Ở cửa sổ thứ hai, thư mục repo:

```powershell
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs --all-stations
node tools/check-station-panel-5.cjs
node tools/check-station-photos-5.cjs
python tools/build-preview-5-offline.py --check
node tools/check-i18n-5.cjs
git diff --quiet
git status --porcelain
```

Trên shell có GNU timeout, chạy `timeout 900 node tools/check-arrival-demo-5.cjs`. Tùy chọn `--all-stations` kiểm riêng 36 ga × VI/EN ở ba màn 1366×768, 1600×900, 1920×1080 (216 bố cục) và ghi `station-layout-final.json`. Tùy chọn `--dark-only` lặp đúng ca 15 trên hai màn, ghi `dark-contrast-final.json` và giữ nguyên `results.json` của lượt đầy đủ. Cả ba lượt chạy được bọc timeout 900 giây.

## Nếu đưa vào preview-5 thì phải đổi gì

1. Tích hợp các thay đổi HTML vào `map-surroundings-preview-5.html`: chọn ga, danh sách/tìm, `openPlaceMode`/`openDeckModal`, hai nhánh Rút vé, sau lá bài, Esc, click vùng trống và vùng an toàn. Giữ các ID tương thích đang dùng.
2. Hợp nhất thay đổi từ các bản sao về `journey-system-5.js`, `station-panel-5.js/.css`, `polish-5.js`, `label-performance.js`, `fortune-ritual-5.js`; đưa điều phối/CSS demo thành tài nguyên chính thức rồi tăng `?v=`. `preview-5.js` hiện không cần sửa: bộ nhãn nhận bảng mới qua lớp hiệu năng và camera nhận `mapScreenArea`.
3. Quyết định lại worker/manifest chính thức. Demo cố ý không đăng ký worker. Nếu phát hành vào preview-5 phải cập nhật `offline-manifest-5.js` bằng công cụ xây ngoại tuyến, tăng phiên bản cache và kiểm lại tải lạnh/offline.
4. Cập nhật các công cụ đang dựa vào bảng phải cũ, đồng thời giữ kiểm tra hành vi:
   - `tools/check-station-panel-5.cjs`: hiện mong bảng luôn mở, ga chọn dựng `.place-card.selected`, `#station-journey-*` và hai chế độ mở ngay.
   - `tools/check-station-photos-5.cjs`: hiện chụp ảnh/nguồn trong thẻ ga chọn ở danh sách; cần chờ đến ga rồi đọc trong bảng mới.
   - `tools/check-i18n-5.cjs --walk`: các bước chọn → mở thẻ ngay, `#station-journey-hue`, `.journey-arrival-deck` phải chuyển sang luồng đến ga; bổ sung kiểm tra khóa `arrival.*`.
   - Các kịch bản lịch sử trong `verification/p5-books/scripts/` như `verify-p5-02.cjs`, `walk-presentation-p5-05.cjs`, `scan-layout-en-5.cjs` và probe sách/bảng: cần rà lại selector và giả định hai chế độ có sẵn ngay khi chọn.
   - Các kịch bản `tools/perf/` dựa vào giao diện cũ cần giữ cùng đường thao tác khi so mốc; mạng tuyến, `inspect()` và `presentation()` vẫn giữ hợp đồng để các phép đo tuyến hiện có tiếp tục dùng được.

Không áp dụng những thay đổi tích hợp này trong nhiệm vụ demo.

## Đợt 3 — 13/11/2026

Phạm vi đợt này gồm HTML demo, tài nguyên riêng trong `arrival-demo-5/`, công cụ kiểm demo và báo cáo này. Các kết quả trước mục này ghi nhận những đợt trước.

### Mục 1–4: triển khai

| Mục | Kết quả và cách làm |
| --- | --- |
| 1.1 — sách → bộ thẻ | `playFromReading` kiểm đúng ga tàu đang đứng, không có chuyến đang chạy, bảng cùng ga đang mở và nút nguồn thuộc đúng sách/story đang mở. Đóng trình đọc trước, dùng nút Chơi thẻ còn sống trong bảng làm nguồn mở bộ thẻ để focus trở về đúng chỗ. Cổng `canOpen` thông thường vẫn giữ chặt. |
| 1.2 — bộ đệm nhãn | Bỏ mutation chỉ gồm text node/characterData bên trong thanh hành trình. ResizeObserver vẫn xử lý thay đổi kích thước; mutation class/hidden/style, thêm/bớt phần tử, chuyển động vị trí vẫn làm mất bộ đệm. Không thêm vòng vẽ bản đồ. |
| 2 — Đang qua | Chọn node có dữ liệu ga trên `trip.route.nodeIds` gần nhất theo tọa độ thế giới thực của `state.railRun` hoặc `state.seaRun` trong chặng hiện tại. Chỉ thay chữ khi nội dung đổi; ô cao cố định 18 px. |
| 2 — thời gian/thơ/quần đảo | ETA nguyên giây; thơ VI giữ xuống dòng, EN dùng nghĩa hiện có chia hai dòng. Thanh quần đảo dùng “Đang ở Quần đảo…” / “At the … Islands”; bảng dùng “Đã ra tới quần đảo” / “Reached the islands”. |
| 2 — hover/đổi lượt | Ghim vừa chọn/đến bị chặn tooltip đến khi chuột rời ghim rồi vào lại. Toast đổi lượt dùng đích chuẩn bị nếu có, cập nhật cả khi đang hiện và chuyển VI/EN. |
| 2 — tài nguyên | Đã chuyển nguyên bảy ảnh/tài liệu tham chiếu sang `verification/arrival-demo-5/design-refs/`; không xóa. HTML/CSS/JS không nạp chúng. |
| 3.1 — khoảnh khắc đến ga | Chuyến có hoạt cảnh hiện banner tên ga và thơ hai dòng trong 1.200 ms. Khi banner tắt, bảng mở, focus chuyển vào tiêu đề và trang phát một thông báo đến ga. Giảm chuyển động, Đến ngay, khám phá tại chỗ và mở lại bảng bỏ qua banner. Vị trí banner xét ghim Hà Nội, ga đi, ga đến và khối nút quần đảo. |
| 3.1 — con dấu | Dấu tròn đỏ son bằng CSS trên góc phải ảnh, thứ tự đặt chân trong phiên; hiệu ứng 540 ms cho lần đầu, bỏ hiệu ứng khi ghé lại/giảm chuyển động. Nút xem ảnh chuyển xuống góc trái; thuyền Hoàng Sa giữ vùng riêng. Bỏ dòng thứ tự ở chân bảng. |
| 3.2 — đặt chân / đóng ấn | Bảng có trạng thái chưa/đã đóng ấn; cập nhật sau khi hoàn tất lá bài, hiệu ứng viền 520 ms sau khi đóng modal (không đổi nền/chữ nên giữ tương phản tối). Sổ có hai số đếm, danh sách ga đã đặt chân và ga có ấn. Header thêm title/aria giải thích. Giữ nguyên cách tính tiến độ gốc, không sửa preview-5.js. |
| 3.3 — sách chưa có | Phụ đề “Sắp có · Góp chuyện quê bạn” / “Coming soon · Share your story”, nền giấy nhẹ. Bốn sách hiện có vẫn dùng trạng thái catalogue và bản nháp của demo; không đổi nội dung sách/trang chờ. |
| 3.4 — màn chiếu | Từ 1600 px, hai bảng rộng 500 px; thân 14 px, nhãn tối thiểu 12 px, tên ga 34–44 px tùy độ dài. 1366 px giữ bảng 392 px và bố cục gọn. Thanh đến ga đo độ rộng theo chữ và nút, có Chọn ga tiếp theo, chỉ thêm Mở thông tin ga khi bảng đóng. |
| 3.5 — vùng miền | Dòng trên tên lấy chính `region`; danh sách Tất cả chia sáu vùng dữ liệu + Biển đảo, số 01–36 liên tục. Khi tìm kiếm giữ danh sách phẳng và ưu tiên tên khớp chính xác. Không tạo phân vùng mới. |
| 4(a), 4(b), 4(c) — P3 | Chưa triển khai. Ưu tiên hoàn tất và kiểm mục 1–3; không mở rộng UI đổi lượt, vệt chặng/bưu thiếp hay nội dung dòng Đang qua trong đợt này. |

“Đặt chân” khởi tạo Hà Nội và chỉ lưu trong phiên. Trạng thái ấn và số ga có ấn trong Sổ suy ra từ tập `placeId` duy nhất của `state.completedStamps`; thanh đầu trang vẫn dùng phép tính gốc `state.totalCardsCompleted` với mốc mục tiêu hiện có. Không thay cách tính điểm/Ấn ga hay bưu thiếp của nguồn gốc. Khi cùng một ga hoàn tất nhiều lá, số lá hoàn tất trên header và số ga duy nhất có ấn trong Sổ có thể khác nhau; đây là dữ liệu gốc được giữ theo yêu cầu.

### Rà các đường gọi chế độ

| Đường vào | Xử lý trong demo |
| --- | --- |
| Bảng: Chơi thẻ, Đọc sách, ảnh | `openPlaceMode`/`openDeckModal` kiểm `canOpen`, đúng ga đang đứng và nguồn trong bảng. |
| Lá bài: liên kết đọc sách cùng ga | Ngoại lệ có kiểm `cardId`, `activeCardPlaceId`, modal bộ thẻ đang mở. Đóng sách giữ lá bài hiện tại. |
| Sắp có / bìa sau bốn sách (`data-act="play"`) | Cùng `playCards` → `playFromReading`; kiểm sách đúng ga, nguồn đúng nút play; mở bộ thẻ với nút nguồn của bảng. Đường fallback cũ chỉ chạy khi không có điều phối demo. |
| `openDeckFromStory` | Có cầu nối cùng cổng kiểm cho story đang mở đúng ga. Hiện không có lối UI nào gọi `openStoryModal` trong demo: ảnh và liên kết story đã đi vào trình đọc sách; vẫn giữ chặn an toàn nếu đường cũ được gọi. |
| `acceptBambooRollDestination` / `acceptBambooRollStory` | Đóng nghi thức rồi `boardTicket(id, deck/book)`, khởi hành ngay; không mở thẻ/sách trước khi tới. Đến nơi nhấn mạnh và focus nút tương ứng. |
| Nút chế độ trong thành phần danh sách cũ | Demo chỉ render dòng gọn, không render selected-station chứa chế độ; ID tìm kiếm/danh sách/Sổ vẫn tồn tại. `canOpen` từ chối nguồn ngoài bảng. |
| Gọi sai ga hoặc nguồn không hợp lệ | Bị từ chối, không mở modal. Không nới cổng chung để sửa riêng nút trong sách. |

### Tệp và bản sao thay đổi đợt này

| Tệp | Thay đổi |
| --- | --- |
| `map-surroundings-preview-5-arrival-demo.html` | Bản sao riêng của preview-5: truyền dữ liệu cho nhóm vùng, toast ga tiếp theo, cầu nối story → thẻ, tăng `?v=`. Không sửa HTML preview-5 đang có công việc khác. |
| `arrival-demo-5/arrival-demo-5.js` | Điều phối banner/bảng, stamp/seal, vùng miền, cầu nối sách/story, hover và toast song ngữ. |
| `arrival-demo-5/arrival-demo-5.css` | Stamp và hiệu ứng CSS, thuyền/nút ảnh, kiểu sách chờ, nhóm vùng, bảng 500 px/cỡ chữ màn chiếu, thanh đến ga gọn, tối/giảm chuyển động. |
| `arrival-demo-5/book-reader-arrival-5.js` ← `assets/goi-viet/books-5/book-reader-5.js` | Chuyển playCards qua cổng điều phối, giữ nội dung và catalogue. |
| `arrival-demo-5/journey-arrival-5.js` ← `journey-system-5.js` | Vị trí thực cho Đang qua, ETA nguyên, truyền instant/stationary, từ ngữ quần đảo, nút chọn ga tiếp theo và đo thanh gọn. |
| `arrival-demo-5/label-performance-arrival-5.js` ← `label-performance.js` | Không invalidate với chữ trong thanh; giữ theo dõi hình học và thuộc tính. |
| `arrival-demo-5/station-panel-arrival-5.js` ← `station-panel-5.js` | Nhóm theo vùng nguồn, số liên tục; phụ đề/trạng thái sách chưa có. |
| `tools/check-arrival-demo-5.cjs` | Giữ ca cũ, bổ sung A–L, ba cỡ all-stations, CPU/base frame/rAF/long task và kiểm hash baseline. Các phiên bản đồ kiểm tuần tự; context lỗi khởi tạo cũng được đóng. |
| `BAO-CAO-DEMO-DEN-GA-5.md` | Cập nhật đường dẫn tài liệu tham chiếu và kết quả đợt 3. |

Các đường dẫn rút gọn `arrival-demo-5/` trong bảng trên đều thuộc `assets/goi-viet/map-surroundings-preview/arrival-demo-5/`. Đầu từng bản sao có dòng nguồn và tóm tắt thay đổi. Bản sao CSS, polish và fortune-ritual của đợt trước tiếp tục dùng, không đổi dữ liệu. Không có tài nguyên bitmap UI mới.

### Ga → nhóm vùng

Dùng bản dịch `region` hiện có của `GoiVietContent.english`. Không có khóa `arrival.region.*` mới.

Các khóa UI thêm đợt này, đều có VI/EN: `arrival.atIsland`, `arrival.islandName`, `arrival.reachedIslands`, `arrival.chooseNext`, `arrival.islands`, `arrival.stampTitle`, `arrival.stampSub`, `arrival.unsealed`, `arrival.sealed`, `arrival.sealedCount`, `arrival.sealHint`, `arrival.soonShare`, `arrival.turnReady`.

| Vùng VI | Vùng EN hiện có |
| --- | --- |
| Đồng bằng sông Hồng | Red River Delta |
| Bắc Trung Bộ & Duyên hải miền Trung | North Central & Central Coast |
| Đông Nam Bộ | Southeast |
| Đồng bằng sông Cửu Long | Mekong Delta |
| Trung du & Miền núi phía Bắc | Northern Midlands & Mountains |
| Tây Nguyên | Central Highlands |
| Biển đảo | Islands — khóa mới `arrival.islands`, không phải phân vùng mới |

| STT | ID | Ga | Nhóm từ dữ liệu |
| --- | --- | --- | --- |
| 01 | `hn` | Thành phố Hà Nội | Đồng bằng sông Hồng |
| 02 | `hp` | Thành phố Hải Phòng | Đồng bằng sông Hồng |
| 03 | `bn` | Tỉnh Bắc Ninh | Đồng bằng sông Hồng |
| 04 | `hy` | Tỉnh Hưng Yên | Đồng bằng sông Hồng |
| 05 | `nb` | Tỉnh Ninh Bình | Đồng bằng sông Hồng |
| 06 | `qn` | Tỉnh Quảng Ninh | Đồng bằng sông Hồng |
| 07 | `hue` | Thành phố Huế | Bắc Trung Bộ & Duyên hải miền Trung |
| 08 | `dn` | Thành phố Đà Nẵng | Bắc Trung Bộ & Duyên hải miền Trung |
| 09 | `gl` | Tỉnh Gia Lai | Bắc Trung Bộ & Duyên hải miền Trung |
| 10 | `ht` | Tỉnh Hà Tĩnh | Bắc Trung Bộ & Duyên hải miền Trung |
| 11 | `kh` | Tỉnh Khánh Hòa | Bắc Trung Bộ & Duyên hải miền Trung |
| 12 | `na` | Tỉnh Nghệ An | Bắc Trung Bộ & Duyên hải miền Trung |
| 13 | `qng` | Tỉnh Quảng Ngãi | Bắc Trung Bộ & Duyên hải miền Trung |
| 14 | `qt` | Tỉnh Quảng Trị | Bắc Trung Bộ & Duyên hải miền Trung |
| 15 | `th` | Tỉnh Thanh Hóa | Bắc Trung Bộ & Duyên hải miền Trung |
| 16 | `hcm` | Thành phố Hồ Chí Minh | Đông Nam Bộ |
| 17 | `dna` | Tỉnh Đồng Nai | Đông Nam Bộ |
| 18 | `tni` | Tỉnh Tây Ninh | Đông Nam Bộ |
| 19 | `ct` | Thành phố Cần Thơ | Đồng bằng sông Cửu Long |
| 20 | `ag` | Tỉnh An Giang | Đồng bằng sông Cửu Long |
| 21 | `cm` | Tỉnh Cà Mau | Đồng bằng sông Cửu Long |
| 22 | `dt` | Tỉnh Đồng Tháp | Đồng bằng sông Cửu Long |
| 23 | `vl` | Tỉnh Vĩnh Long | Đồng bằng sông Cửu Long |
| 24 | `cb` | Tỉnh Cao Bằng | Trung du & Miền núi phía Bắc |
| 25 | `db` | Tỉnh Điện Biên | Trung du & Miền núi phía Bắc |
| 26 | `lc_old` | Tỉnh Lai Châu | Trung du & Miền núi phía Bắc |
| 27 | `ls` | Tỉnh Lạng Sơn | Trung du & Miền núi phía Bắc |
| 28 | `lc` | Tỉnh Lào Cai | Trung du & Miền núi phía Bắc |
| 29 | `pt` | Tỉnh Phú Thọ | Trung du & Miền núi phía Bắc |
| 30 | `sl` | Tỉnh Sơn La | Trung du & Miền núi phía Bắc |
| 31 | `tn` | Tỉnh Thái Nguyên | Trung du & Miền núi phía Bắc |
| 32 | `tq` | Tỉnh Tuyên Quang | Trung du & Miền núi phía Bắc |
| 33 | `dl` | Tỉnh Đắk Lắk | Tây Nguyên |
| 34 | `ld` | Tỉnh Lâm Đồng | Tây Nguyên |
| 35 | `hoang-sa` | Quần đảo Hoàng Sa (Đặc khu Hoàng Sa) | Biển đảo |
| 36 | `truong-sa` | Quần đảo Trường Sa (Đặc khu Trường Sa) | Biển đảo |

### Kết quả nghiệm thu đợt 3

Lượt đầy đủ kết thúc lúc 11:02 ngày 13/11/2026 (UTC+7). Cả 61 ca hành vi và hiệu năng đạt, với 0 lỗi console, 0 lỗi JavaScript và 0 yêu cầu lỗi hoặc HTTP ≥400. Kết quả và log lưu trong `verification/arrival-demo-5/results.json` và `round3-full.log`.

| Ca | Nội dung | 1366×768 | 1920×1080 |
| --- | --- | --- | --- |
| 1 | Vào bản đồ: ba chip, danh sách đóng, chưa có chế độ chơi | PASS | PASS |
| 2 | Bấm ghim Huế chỉ xem trước tuyến | PASS | PASS |
| 3 | Khám phá khởi hành, khóa nút và cập nhật tiến độ | PASS | PASS |
| 4 | Ảnh và hai chế độ trong bảng, vùng an toàn và focus tiêu đề | PASS | PASS |
| 5 | Rút thẻ, đóng bộ thẻ giữ bảng và cập nhật số lá | PASS | PASS |
| 6 | Mở sách đúng ga, đóng sách trả focus | PASS | PASS |
| 7 | Hà Nội ban đầu mở bảng tại chỗ | PASS | PASS |
| 8 | Ga đã ghé có nút Đến ngay | PASS | PASS |
| 9 | Chặng biển Hoàng Sa và biểu tượng thuyền | PASS | PASS |
| 10 | Tìm bằng bàn phím và thứ tự Esc | PASS | PASS |
| 11 | Hai nhánh vé chỉ mở bảng sau khi đến | PASS | PASS |
| 12 | Gợi ý sau lá bài chuẩn bị tuyến tiếp theo | PASS | PASS |
| 13 | Đổi EN khi các thành phần đang mở, kiểm tràn chữ | PASS | PASS |
| 14 | Giảm chuyển động, đến ngay và không chạy hiệu ứng | PASS | PASS |
| 15 | Nền tối và tương phản tối thiểu 4,5:1 | PASS | PASS |
| 16 | Sổ hành trình giữ kỷ niệm, ga đã ghé và bưu thiếp | PASS | PASS |
| 17 | Không lỗi console, mạng hoặc HTTP | PASS | PASS |
| P0/P1 | Chọn ga tiếp theo khi tàu chạy và Đến ngay giữa chặng | PASS | PASS |
| A | Trang chờ và bìa sau sách mở đúng bộ thẻ, trả focus về bảng | PASS | PASS |
| B | Đổi chữ Đang qua giữ bộ đệm khi thanh không đổi kích thước | PASS | PASS |
| C | Ba lượt so sánh base frame, rAF, long task và tải CPU | PASS | PASS |
| D | Đang qua khớp ga gần vị trí thực của tàu trên đường sắt và biển | PASS | PASS |
| E | ETA số nguyên, thơ hai dòng, nhãn quần đảo VI/EN | PASS | PASS |
| F | Banner tắt trước bảng, một thông báo và đúng các trường hợp bỏ qua | PASS | PASS |
| G | Dấu lần đầu, ghé lại, giảm chuyển động và khoảng trống cho thuyền | PASS | PASS |
| H | Hoàn tất lá bài cập nhật ấn ở bảng, header và hai mục Sổ hành trình | PASS | PASS |
| I | Ga chưa có sách có lời mời góp chuyện, sách nháp giữ nhãn | PASS | PASS |
| J | Cỡ chữ màn chiếu, vùng an toàn và thanh đến ga gọn | PASS | PASS |
| K | Sáu vùng và Biển đảo, số 01–36, tìm kiếm phẳng | PASS | PASS |
| L | Thông báo đổi lượt khớp ga đang chuẩn bị | PASS | PASS |

Ca 13 tiếng Anh trên màn 390×844 đạt. Lượt `--all-stations` xác nhận 216 bố cục của 36 ga ở hai ngôn ngữ trên 1366×768, 1600×900 và 1920×1080. Lượt `--dark-only` đạt cả hai ca tương phản.

- 1366×768 và 1920×1080 đều có tương phản chữ thấp nhất 6,57:1.
- Bảng tại 1920×1080 rộng 500 px, thân chữ 14 px, nhãn và nguồn ảnh 12 px. Tại 1366×768, bảng rộng 392 px và hai nút chế độ nằm trọn trong vùng nhìn thấy.

Dòng Đang qua lấy mẫu mỗi 200 ms:

| Màn | Chuyến | Mẫu đúng / tổng | Tỷ lệ |
| --- | --- | --- | --- |
| 1366x768 | Đà Nẵng → Cà Mau | 21/21 | 100.0% |
| 1366x768 | Hà Nội → Trường Sa | 45/45 | 100.0% |
| 1920x1080 | Đà Nẵng → Cà Mau | 21/21 | 100.0% |
| 1920x1080 | Hà Nội → Trường Sa | 54/54 | 100.0% |

- 1366x768: 11 lần đổi chữ Đang qua được ghi nhận. Bộ đệm giữ nguyên trong cả 11 lần khi kích thước thanh không đổi.
- 1920x1080: 11 lần đổi chữ Đang qua được ghi nhận. Bộ đệm giữ nguyên trong cả 11 lần khi kích thước thanh không đổi.
- Sau chỉnh vị trí banner, ca F được chạy lại trên bản cuối và đạt ở cả hai màn. Bảng xuất hiện sau 1.238 ms ở 1366×768 và 1.242 ms ở 1920×1080, trong giới hạn 1.600 ms. Banner để trống hai ghim Hà Nội và Huế, focus vào tiêu đề và trang phát một thông báo. Xem `round3-banner-final.json` và `round3-banner-final.log`.

### Hồi quy preview-5 trong đợt 3

| Lệnh | Kết quả | Log trong `verification/arrival-demo-5/` |
| --- | --- | --- |
| `node tools/check-station-panel-5.cjs` | PASS, kiểm sáu kích thước và các luồng bảng ga gốc | `round3-regression-panel.log` |
| `node tools/check-station-photos-5.cjs` | PASS, 35 ảnh và thuyền Hoàng Sa, 36 lối mở sách, 72 khung hình khi tải lại ngoại tuyến | `round3-regression-photos.log` |
| `python tools/build-preview-5-offline.py --check` | PASS, manifest khớp và lệnh không ghi tệp | `round3-regression-offline.log` |
| `node tools/check-i18n-5.cjs` | PASS, từ điển và khóa giao diện VI/EN khớp | `round3-regression-i18n.log` |

### Hiệu năng đợt 3

Mỗi kích thước: 3 lượt preview-5 và 3 lượt demo, xen kẽ, cùng click ghim TP.HCM từ Hà Nội và bấm nút khởi hành thật. Context chặn service worker và mạng ngoài; CPU hệ thống đo trong 500 ms ngay trước mỗi phép đo chuyến. Base frame đếm chênh `inspect().baseFrames`; rAF và PerformanceObserver longtask chỉ lấy trong chuyến. Không gộp phần mở sách/modal vào phép đo.

| Màn | Bản | CPU trước chuyến (%) | Base frame từng lượt | Trung vị base | rAF trung vị (ms) | rAF p95 trung vị (ms) | Long task: số / tổng ms trung vị |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1366x768 | Preview-5 | 31.1 / 31.6 / 43.9 | 87 / 87 / 86 | 87 | 16.7 | 16.8 | 0 / 0 |
| 1366x768 | Demo | 23.8 / 54.7 / 31.2 | 4 / 4 / 4 | 4 | 16.7 | 16.8 | 0 / 0 |
| 1920x1080 | Preview-5 | 28.3 / 31.4 / 44.2 | 72 / 79 / 78 | 78 | 16.7 | 16.8 | 0 / 0 |
| 1920x1080 | Demo | 55 / 31 / 22.1 | 4 / 4 / 4 | 4 | 16.7 | 16.8 | 0 / 0 |

Tiêu chí chính: trung vị base frame demo ≤ preview-5 + 2. Bộ kiểm còn giữ các ngưỡng cũ 10% cho rAF và long task; không tự nới ngưỡng. Chi tiết từng lượt, CPU, phân bố rAF và thời lượng từng long task có trong `results.json`.

- 1366x768: sau khi bảng mở và camera ổn định, 1.800 ms đứng yên: 0 base frame, 0 reused frame.
- 1920x1080: sau khi bảng mở và camera ổn định, 1.800 ms đứng yên: 0 base frame, 0 reused frame.

### Đối chiếu mốc Git đầu đợt

Giữ nguyên snapshot `verification/arrival-demo-5/tracked-baseline.json` tạo lúc 09:58:01 ngày 13/11/2026 (UTC+7), không thay mốc để làm phép kiểm xanh. Người dùng xác nhận “Việc đó vẫn đang chạy” đối với Hải trình gia đình.

Phép đối chiếu tệp Git **FAIL** vì Hải trình gia đình cập nhật manifest sau thời điểm lưu mốc. Bốn tệp đang theo dõi còn lại có hash khớp mốc đầu đợt.

| Tệp khác baseline | Hash đầu đợt | Hash khi kiểm cuối |
| --- | --- | --- |
| `assets/goi-viet/map-surroundings-preview/offline-manifest-5.js` | `32949aca5e093136988d899f267c1539eb2848d30651f0d02770c95b7877c982` | `b93cedd770c31437a24e256c671469198dad96b6f43382f14ff8e85e4d107bca` |

```text
FAIL [regression] AssertionError [ERR_ASSERTION]: Unrelated tracked work differs from the start baseline
```

Các lệnh e2e trả mã 1 do phép đối chiếu hash. JSON lưu giá trị hash ở thời điểm từng lượt chạy.

### Ảnh chụp và giới hạn

Các ảnh đợt 3 đều trong `verification/arrival-demo-5/`:

- `1366x768-r3-A-book-to-cards.png`
- `1366x768-r3-K-region-groups.png`
- `1366x768-r3-L-turn-ready.png`
- `1366x768-r3-F-banner.png`
- `1366x768-r3-G-island-stamp.png`
- `1366x768-r3-H-sealed.png`
- `1366x768-r3-J-station-strip.png`
- `1366x768-15-dark.png`
- `1366x768-13-english.png`
- `1366x768-perf-idle-sheet.png`
- `1920x1080-r3-A-book-to-cards.png`
- `1920x1080-r3-K-region-groups.png`
- `1920x1080-r3-L-turn-ready.png`
- `1920x1080-r3-F-banner.png`
- `1920x1080-r3-G-island-stamp.png`
- `1920x1080-r3-H-sealed.png`
- `1920x1080-r3-J-station-strip.png`
- `1920x1080-15-dark.png`
- `1920x1080-13-english.png`
- `1920x1080-perf-idle-sheet.png`
- `390x844-13-start-english.png`, `390x844-13-sheet-english.png`, `390x844-13-list-english.png`
- Nhóm 216 bố cục: ba ảnh tổng kết `1366x768-extra-36-stations.png`, `1600x900-extra-36-stations.png`, `1920x1080-extra-36-stations.png`; hình học từng ga/VI/EN lưu trong `station-layout-final.json`.
- `design-refs/`: bảy tham chiếu chuyển từ assets, giữ để đối chiếu lịch sử, không dùng làm UI.

P3 vẫn hoãn theo điều kiện nghiệm thu vì phép đối chiếu hash đầu đợt còn lỗi. Chưa nghiệm thu bằng máy chiếu hay trình đọc màn hình thật, Firefox, 4K hoặc zoom 200%. CPU nền và preview-5 có công việc khác đang chạy: số đo ghi đúng mẫu thực tế, không coi đây là benchmark tuyệt đối. Các bản sách/dữ liệu/ảnh giữ nguyên; ba tập nháp chưa có nội dung mới vẫn giữ nguyên tình trạng. Ca thử đầu bị timeout do hai context bản đồ cùng mở đã được chuyển sang tuần tự; các log `round3-first-attempt.log`, `round3-second-attempt.log/json` và `round3-third-attempt.log/json` giữ lại để truy vết, không dùng làm kết quả lượt cuối.

### Chạy lại và tích hợp

```powershell
node tools/perf/server.cjs
# Chạy lần lượt trong cửa sổ khác, từ thư mục repo:
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs --all-stations
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs --dark-only
node tools/check-station-panel-5.cjs
node tools/check-station-photos-5.cjs
python tools/build-preview-5-offline.py --check
node tools/check-i18n-5.cjs
```

Mở [demo](http://127.0.0.1:8770/map-surroundings-preview-5-arrival-demo.html). Các bước tích hợp preview-5 đã nêu ở mục trước vẫn áp dụng; đợt 3 bổ sung cầu nối `playCards/openDeckFromStory`, miễn invalidation cho text trong label-performance, vị trí thật của tàu cho passing, dữ liệu nhóm vùng và banner/stamp/seal. Những script kiểm bảng phải cũ cần chuyển sang chờ hành trình kết thúc trước khi mở chế độ. Không tích hợp vào preview-5 trong nhiệm vụ này.

## Tích hợp vào preview-5

`map-surroundings-preview-5.html` dùng chung các thành phần đến ga với trang demo. Luồng trên bản đồ là chọn ga, xem tuyến, bấm **Khám phá**, đi tàu hoặc thuyền, rồi mở bảng tại điểm đến. Tìm kiếm theo vùng, rút vé, bàn phím, nền tối, chế độ giảm chuyển động, dấu đặt chân, ấn ga và Sổ hành trình dùng cùng logic với demo.

- **Biển đảo.** Bảng Hoàng Sa và Trường Sa có nút **Bưu điện biển đảo** trên desktop và **Xem hải đồ** trên màn nhỏ. Lối vào từ ghim bản đồ vẫn hoạt động. Nút **Bộ thẻ quen thuộc** bên trong Bưu điện mở đúng bộ thẻ của quần đảo đang xem. Đóng Bưu điện trả focus về lối vào và cập nhật ấn ga nếu vừa gửi thư.
- **Sách.** Preview-5 giữ trạng thái xuất bản từ danh mục. Bốn sách nháp đọc với `?sach=nhap`. Nút **Chơi thẻ** trong sách mở bộ thẻ đúng ga hoặc trở về lá bài đang mở.
- **Ảnh và ngoại tuyến.** Bảng đến ga giữ ghi nguồn ảnh, hình thay thế khi ảnh không tải được và biểu tượng thuyền của Hoàng Sa. Tùy chọn **Chuẩn bị chạy không mạng** dùng manifest mới gồm các thành phần đến ga và Bưu điện.

Bộ kiểm luồng đến ga chạy bằng `node tools/check-arrival-demo-5.cjs --preview-5`. Có thể thêm `--all-stations` hoặc `--dark-only`. Log, kết quả JSON và ảnh chụp của preview-5 nằm trong `verification/arrival-preview-5/`. Các kết quả demo ở mục trước ghi nhận bản thử trước khi tích hợp.

| Kiểm thử trên preview-5 | Kết quả | Bằng chứng |
| --- | --- | --- |
| Luồng đến ga và hiệu năng | 61/61 ca đạt ở 1366×768, 1920×1080 và 390×844. Lượt đầy đủ ghi nhận 0 lỗi trang và 0 lỗi tải. | `verification/arrival-preview-5/full.log`, `results.json` |
| Bố cục tất cả các ga | 216 bố cục đạt, gồm 36 ga, hai ngôn ngữ và ba kích thước desktop. | `verification/arrival-preview-5/station-layout-final.json` |
| Chạm trên màn nhỏ | Chạm ga và Khám phá ở 390×844 đạt sau khi khôi phục vùng nhận chạm của danh sách. Kiểm bảng ga và Sổ hành trình ở sáu kích thước, xuống đến 320 px, cũng đạt. | `verification/arrival-preview-5/touch.log`, `panel-complete.log` |
| Ngôn ngữ | Khóa VI/EN đầy đủ. Đi qua các màn bằng tiếng Anh và vòng đổi VI → EN → VI đều đạt. | `verification/arrival-preview-5/i18n-retest.log` |
| Bưu điện biển đảo | 11 nhóm đạt, gồm hai tuyến thư, bộ thẻ gốc, bàn phím, xuất PNG/TXT và bố cục hải đồ trên màn nhỏ. | `verification/arrival-preview-5/postoffice.log` |
| Ngoại tuyến | Gói cuối gồm 501 tài nguyên. Tải lại khi mất mạng, đến Hoàng Sa, mở Bưu điện, đóng dấu thư và trở về bảng ga đã cập nhật. | `verification/arrival-preview-5/offline-final.log`, `verification/sea-postoffice-5/offline-arrival-hoang-sa.png` |
| Ảnh ga và nguồn ảnh | 504 khung hình đạt trên sáu kích thước và hai ngôn ngữ, gồm 72 khung ngoại tuyến. 35 ảnh tải đủ, Hoàng Sa dùng thuyền. Kiểm đủ 36 lối mở sách từ ảnh, ghi công ảnh, khung contain, ảnh thay thế và phục hồi sau lỗi. | `verification/arrival-preview-5/photos-final.log`, `verification/station-photos-5/e2e/report.json` |

Trong ba lượt đo mỗi cỡ desktop, preview-5 và demo cùng có trung vị 4 lần vẽ lại nền bản đồ và 16,7 ms giữa các khung hình. Cả hai cỡ desktop của preview-5 ghi nhận 0 lần vẽ nền trong khoảng đứng yên 1,8 giây sau khi mở bảng. Tương phản chữ thấp nhất trong các mẫu nền tối là 6,57:1.

Các lỗi phát hiện trong lúc tích hợp đã được sửa và kiểm lại. Danh sách nhận chạm trên điện thoại, vùng cuộn ở 820–1024 px có chiều cao sử dụng được, tấm danh sách 320 px cuộn toàn bộ, và nhãn trợ năng có bản dịch ngay từ lần đầu mở trang. Các log có hậu tố `final`, `retest` và `complete` trong bảng trên ghi nhận những lượt kiểm sau sửa. Kiểm manifest và `git diff --check` đều đạt ở lần rà cuối.

Tài nguyên của demo được tái sử dụng dưới `assets/goi-viet/map-surroundings-preview/arrival-demo-5/` để hai trang dùng cùng phần dựng ảnh, chế độ chơi, hành trình, vùng an toàn và kiểu chữ. Tệp mới `i18n-arrival-5.js` chứa khóa VI/EN và được nạp trước thanh hành trình. Trình đọc sách chính thức và Bưu điện gọi qua cổng tương ứng để trả focus về đúng nơi sau khi đóng modal.

Mở [preview-5 đã tích hợp](http://127.0.0.1:8770/map-surroundings-preview-5.html). Để xem bốn sách nháp hiện có, thêm `?sach=nhap`. Các kết quả trên dùng Chrome trên Windows. Kiểm máy chiếu thật và trình đọc màn hình thật vẫn là giới hạn nghiệm thu.

```powershell
# Mở máy chủ ở cửa sổ PowerShell thứ nhất
node tools/perf/server.cjs

# Chạy lần lượt từ thư mục repo ở cửa sổ thứ hai
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs --preview-5
& 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs --preview-5 --all-stations
node tools/check-station-panel-5.cjs
node tools/check-station-photos-5.cjs
node tools/check-i18n-5.cjs --walk
$env:VOYAGE_TEST_URL='http://127.0.0.1:8770/map-surroundings-preview-5.html'
$env:VOYAGE_TEST_OFFLINE='1'
node tools/check-family-voyage-5.cjs
python tools/build-preview-5-offline.py --check
```

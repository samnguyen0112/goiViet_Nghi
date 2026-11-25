# Độ bền mã và cấu hình trình chiếu · Preview-5

Lượt 4/4 · 21/11/2026. Phần E dùng Chrome 157.0.8103.79, 1440×900 trên Windows, server loopback và hồ sơ trình duyệt tạm. Phần F dùng cửa sổ trình duyệt và hồ sơ riêng theo từng lần chạy. Server và trình duyệt chạy ngoài sandbox để mở kết nối loopback và cửa sổ. Các ca ngoại tuyến và dung lượng truyền lấy từ log đã có.

## E.1 · Dữ liệu người nhập và lưu trữ

Rà 121 nguồn HTML, JS và CSS từ khai báo preview-5, tệp nạp ở Lượt 1 và nội dung sách tải động. Danh mục ghi 71 lần khớp từ khóa `innerHTML`, `insertAdjacentHTML` hoặc `outerHTML`, gồm cả đọc và ghi. Với mỗi đường người nhập, lần theo dữ liệu tới chỗ dựng DOM. Phép thử dùng thẻ HTML trơ làm dấu nhận diện, không có handler hoặc URL. Quan sát chuỗi nguyên văn, phần tử tạo ra và biến canh gác. Route chỉ cho phép loopback, Service Worker bị chặn trong hồ sơ thử, và trình duyệt dùng proxy/resolver cục bộ. Hai phiên ghi 0 yêu cầu ngoài origin. [Chỉ mục mã](../../verification/audit-06/r4-e-static-index.json) · [Phiên chính](../../verification/audit-06/r4-e-main-evidence.json) · [Xác nhận kỷ niệm](../../verification/audit-06/r4-e-verify-evidence.json).

| Luồng | Điểm dựng | Kết quả thực tế |
|---|---|---|
| Tên địa danh, tên hoặc biệt danh và ghi kỷ niệm | `recordMemoryPlaceFromCard` lưu ba giá trị. Nhật ký dựng tên bằng `textContent`. | Chuỗi thử có mặt ở ô nhập, bản ghi và danh sách bưu thiếp dưới dạng văn bản. Không có phần tử đánh dấu. [Lưu kỷ niệm](../../map-surroundings-preview-5.html#L7785) · [Nhật ký](../../map-surroundings-preview-5.html#L6787). |
| Bưu thiếp cá nhân | Tên, tên người ghi và nội dung vào `textContent`. Khi đánh dấu đưa vào ảnh, canvas vẽ văn bản. | Tìm thấy đủ ba chuỗi nguyên văn trong bưu thiếp. Có thể đánh dấu dùng chúng trong ảnh. [Dựng bưu thiếp](../../map-surroundings-preview-5.html#L8256) · [Vẽ chữ](../../map-surroundings-preview-5.html#L8077). |
| Bưu thiếp cộng đồng | `renderCommunityPostcard` dựng DOM từ dữ liệu địa danh, tranh và chú thích. | Màn Hải Phòng có nội dung mẫu, QR và link Facebook với `rel=noopener noreferrer`. Không có form hoặc ô nhập trong màn này. Link giữ nguyên trong phép kiểm. [Trình đọc](../../assets/goi-viet/books-5/book-reader-5.js#L820). |
| Thư biển đảo | `voyageNote` vào textarea. `voyageMemoryPlace` vào giá trị input. Cả hai qua `E()` trước khi ráp template. | Hai giá trị giữ nguyên sau VI→EN→VI. Hook ở `innerHTML` của `.sea-scene` ghi các dấu `<`, `>`, `&` và dấu nháy đã mã hóa. [Bộ mã hóa](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.js#L12) · [Template thư](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.js#L322). |
| Album Hải trình gia đình | Tiêu đề và lời ghi qua `E()` khi dựng album. Các cập nhật trực tiếp dùng `textContent`. | Tiêu đề và lời ghi giữ nguyên sau VI→EN→VI. Ghi chú chỉnh trong album đi tới bưu thiếp cá nhân dưới dạng văn bản. Không phát sinh phần tử đánh dấu. [Album](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.js#L553) · [Cập nhật](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.js#L598). |

Trong các trường đã thử, biến canh gác giữ nguyên 0. Markup ở các điểm còn lại trong chỉ mục chủ yếu là SVG tĩnh, i18n, dữ liệu đóng gói hoặc nội dung sao từ template. Ví dụ ảnh/ghi nguồn phiếu ga dựng từ catalog rồi sao lại phần markup. Kết quả kiểm là khả năng giữ dữ liệu nhập dưới dạng văn bản trong những đường cụ thể trên. [Chỉ mục theo dòng](../../verification/audit-06/r4-e-static-index.json).

`JSON.parse` của tùy chọn nhạc nằm trong try/catch. Lượt 3 đưa JSON lỗi vào khóa nhạc, âm lượng về mặc định 65%. Mã ngôn ngữ kiểm `vi`/`en` khi đọc storage. Sách chuyển giá trị lưu sang số trang và bắt ngoại lệ khi đọc. Kỷ niệm, tên và Hải trình giữ theo phiên. Blob nhạc dùng IndexedDB. `JSON.parse` của bản đồ biển thuộc đường giải mã dữ liệu đóng gói và lỗi đi qua promise của bộ nạp. [Nhạc](../../assets/goi-viet/homepage-music-5.js#L17) · [Ngôn ngữ](../../assets/goi-viet/map-surroundings-preview/i18n-5.js#L7) · [Sách](../../assets/goi-viet/books-5/book-reader-5.js#L349) · [Bộ nạp biển](../../assets/goi-viet/map-surroundings-preview/natural/landscape-5.js#L35) · [Log JSON lỗi](../../verification/audit-06/r3-listener-cycles.json).

## E.2 · Thứ tự nạp, namespace và cờ tương thích

| Hợp đồng | Quan sát |
|---|---|
| Inline và defer | `i18n-5.js` và `i18n-ui-5.js` chạy đồng bộ trước khối inline chính. Inline định nghĩa `state`, `project3D` và các hàm dùng chung. Script defer truy cập các giá trị này sau khi phân tích HTML. Chuyển khối sang module hoặc đổi thứ tự cần giữ hợp đồng truy cập. [Thẻ script](../../map-surroundings-preview-5.html#L4140) · [Khối chính](../../map-surroundings-preview-5.html#L5375). |
| `GoiVietRasterTasks` | Queue đơn gán cùng tên global trước scheduler 5. Scheduler 5 thay bằng object có `managed:true`, `setView`, `run` và `cancel`. Terrain/landscape đăng ký kernel sau đó. Đây là tên `GoiViet*` có hai vị trí gán trong chỉ mục của trang. [Queue](../../assets/goi-viet/map-surroundings-preview/natural/raster-tasks.js#L38) · [Scheduler](../../assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js#L271). |
| Hải trình, sách | Hai tệp dữ liệu đi trước `family-voyage-5.js`. Module thoát sớm nếu thiếu một tệp. Sách chọn nguồn theo catalog, rồi nhận lần đăng ký `GoiVietBooks.register`. [Hải trình](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.js#L5) · [Mở sách](../../assets/goi-viet/books-5/book-reader-5.js#L899). |
| Trang chủ | Renderer, loader, nhạc và controller nằm theo thứ tự tại cuối HTML. Loader nhận dữ liệu từ tên tạm `GoiVietHomeLayeredData`, bỏ tên sau khi lấy, và dùng một promise khi đang nạp gói. [Nhóm cuối HTML](../../map-surroundings-preview-5.html#L10100) · [Loader](../../assets/goi-viet/homepage-layered-scene-3.js#L13). |
| Thay hàm toàn cục | `render-performance.js` lưu rồi ghi đè `project3D`. Bản gốc vẫn chạy khi intro hoạt động. Nghi thức ống xăm thay `openBambooRollModal`/`closeBambooRollModal` cùng tên từ inline. [Project](../../assets/goi-viet/map-surroundings-preview/render-performance.js#L10) · [Ống xăm](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/fortune-ritual-arrival-5.js#L313). |

Preview-5 khai báo `data-preview-version="3"`, `data-home-theme="classic"` và `data-home-art="reference-v9"`. Cờ `3` dùng chung với cờ palette/chủ đề. [Khai báo body](../../map-surroundings-preview-5.html#L4310).

| Module có điều kiện | Nhánh tại preview-5 |
|---|---|
| `homepage-layered-scene-3.js` | Cờ 3 bật chọn poster theo palette. Cờ artwork chọn v9, rồi backing store chọn 2K/4K. Theme classic tắt vá cầu và `copySafeArea`, hai đường dành cho balanced. Nhánh v8, classic không dùng reference và gói chung cho cờ khác 3 nằm cùng loader. [Loader](../../assets/goi-viet/homepage-layered-scene-3.js#L5). |
| `homepage-layered-renderer-5.js` | Dùng tham số bầu trời dọc theo cờ 3. Nhánh tọa độ mặc định nằm cùng hàm. [Renderer](../../assets/goi-viet/homepage-layered-renderer-5.js#L17). |
| `homepage-transport-3/transport.js` | Bật thay sprite tàu/hạc theo tier. [Vận tải](../../assets/goi-viet/homepage-transport-3/transport.js#L2). |
| `homepage-opening-controller-5.js` | Bật xử lý Tab khi focus đang ở chương Miền ký ức, cùng việc tạm dừng/khôi phục vẽ artwork. [Controller](../../assets/goi-viet/homepage-opening-controller-5.js#L183). |
| `home-station-feedback-5.js`, `memory-reference-5.js`, `map-prewarm-3.js` | Cờ 3 bật phản hồi khi chọn ga từ trang chủ, chương Miền ký ức và làm ấm bản đồ. Ba module đều thoát sớm khi cờ khác 3. [Ga](../../assets/goi-viet/map-surroundings-preview/home-station-feedback-5.js#L5) · [Ký ức](../../assets/goi-viet/map-surroundings-preview/memory-reference-5.js#L8) · [Prewarm](../../assets/goi-viet/map-surroundings-preview/map-prewarm-3.js#L11). |
| CSS | Chín tệp có selector cờ 3: `home-classic-3.css`, `home-controls-3.css`, `home-gate-3.css`, `home-hierarchy-3.css`, `home-invitation-frame-3.css`, `home-projector-3.css`, `memory-reference-v2.css`, `memory-reference-v5.css`, `postcard-logo-3.css`. Có thêm rule rèm trong HTML. Media query và theme giới hạn từng rule. [Chỉ mục CSS](../../verification/audit-06/r4-e-static-index.json). |

**Hợp đồng ngoại tuyến.** Bộ dựng quét chuỗi đường dẫn và thêm các thư mục đã khai báo. Worker bỏ query khi lập khóa và chỉ xử lý URL trong tập `allowed`. Bốn đường dẫn v9/tàu theo tier nằm ngoài manifest, dẫn tới B-01/D-01. Cờ `--check` xác nhận đầu ra của bộ dựng hiện tại. Độ bao phủ runtime cần đối chiếu riêng theo tier. Khâu cài dùng hash để xác minh mục tái sử dụng từ cache cũ. Các response mới được ghi theo HTTP OK, còn trạng thái ready đối chiếu số mục. [Bộ dựng](../../tools/build-preview-5-offline.py#L19) · [Worker](../../preview-5-offline-worker.js#L29) · [B-01](BAO-CAO-B-KIEM-KE-TEP.md#b-01--bốn-tệp-trang-chủ-vắng-mặt-trong-gói-ngoại-tuyến) · [D-01](BAO-CAO-D-CHUC-NANG.md#d-01--ngoại-tuyến-bỏ-qua-hoạt-cảnh-trang-chủ).

## E.3 · Coverage và nhánh ít dùng

Playwright thu JS/CSS từ lúc tải trang. Đi qua cổng, phát mở đầu rồi bỏ qua phần còn lại, vào bản đồ, đến Hà Nội, dùng thẻ, sách nháp, bưu thiếp và cài đặt. Dừng coverage trước khi mở Hải Phòng và Hải trình. Hợp nhất khoảng V8 theo vùng lồng bên trong và tính trên mã UTF-8. V8 tính vùng khởi tạo dữ liệu là đã chạy. CSS ghi rule dùng trong thời gian quan sát.

| Coverage | Tệp hoặc khối | Byte nguồn | Byte không dùng trong luồng | Tỷ lệ |
|---|---:|---:|---:|---:|
| JS | 74 | 9.372.994 | 341.261 | 3,64% |
| CSS | 49 | 1.004.388 | 716.354 | 71,32% |

| Tệp hoặc khối | Byte nguồn | Byte không dùng | Tỷ lệ không dùng |
|---|---:|---:|---:|
| CSS nội tuyến chính | 363.711 | 323.396 | 88,92% |
| map-baseline-restored.css | 171.457 | 153.280 | 89,40% |
| family-voyage-5.js | 58.483 | 55.388 | 94,71% |
| sea-postoffice-5.css | 31.985 | 31.985 | 100% |
| family-voyage-5.css | 30.889 | 30.800 | 99,71% |
| book-reader-5.css | 40.466 | 28.634 | 70,76% |
| island-chart-5.js | 16.126 | 15.093 | 93,59% |
| map-reference-ui.css | 15.692 | 11.657 | 74,29% |
| memory-native-v4.css | 8.434 | 6.042 | 71,64% |
| island-chart.css | 4.916 | 4.916 | 100% |
| natural.css | 4.541 | 4.073 | 89,69% |
| map-decorative-frame-phase5.css | 4.025 | 4.025 | 100% |
| raster-tasks.js | 2.821 | 2.385 | 84,54% |

Queue cũ nằm trong `raster-tasks.js` để hỗ trợ các bản và điều kiện tương thích, gồm đường legacy dành cho preview-2. Scheduler 5 thay export trong luồng chính. Loader trang chủ còn nhánh v8, nhánh không-reference và đường non-3. Giá trị đặt trong preview-5 chỉ chọn v9. Mã đảo, atlas, sách và theme được gọi ở các kịch bản khác. Chẳng hạn thư Hoàng Sa và album chạy sau khi dừng coverage. Các vùng chưa dùng trong một pass là đầu vào để xét nạp khi cần. [Khoảng đo gốc](../../tools/perf/results/audit-06/r4-e-main-coverage.json) · [Các bước chạy](../../verification/audit-06/r4-e-main-evidence.json).

## E.4 · Khả năng tiếp cận

- Luồng lấy mẫu đi qua cổng, vào bản đồ rồi dùng bàn phím mở thẻ, sách và bưu thiếp. Kiểm 20 bước Tab/Shift+Tab trong bộ bài, 18 trong sách và 11 trong bưu thiếp. Các bước lấy mẫu đều nằm trong modal đang mở. Escape trả về nút mở bộ bài và nút mở sách. Khi chuyển VI→EN→VI trên sách, thuộc tính `lang` của tài liệu, tiêu đề tài liệu và ngôn ngữ trình sách cùng đổi. [Log chính](../../verification/audit-06/r4-e-main-evidence.json).
- Ở đầu chuyển cảnh, `aria-hidden`/`inert` được đặt khi focus vẫn còn ở nền. Lượt này Chrome cảnh báo với `#deck-open-hn` và `#stationPostcard`. Phép bổ sung ghi `#btnQuickStartWelcome` còn focus ngay trước khi intro nhận `aria-hidden`. Cảnh báo console của intro có trong log Lượt 3. Đường Enter qua rèm ở phép chính trả focus về `#mapScene`. [Bộ bài và intro](../../verification/audit-06/r4-e-verify-evidence.json) · [Bưu thiếp](../../verification/audit-06/r4-e-main-evidence.json) · [Cảnh báo intro Lượt 3](../../verification/audit-06/r3-flows-p5.json).
- Lấy cây AX và đối chiếu các ID trong aria-labelledby, aria-describedby, aria-controls và aria-owns ở 15 mốc. Không thấy điều khiển lấy mẫu thiếu tên, tham chiếu ARIA thiếu đích hay hình thiếu thuộc tính alt. Logo/ảnh trang trí có thể dùng alt rỗng. Hình bìa sách, ảnh ga và mã QR có alt mô tả. Ảnh bưu thiếp cộng đồng có caption địa danh kề bên. [Các snapshot AX/DOM](../../verification/audit-06/r4-e-main-evidence.json).
- Tính tương phản chữ đang hiển thị từ màu CSS khi nền xác định được. Sau khi theme tối ổn định, tiêu đề cài đặt đạt 9,85:1, Âm thanh/Nền tối 11,16:1 và trạng thái ngoại tuyến 6,39:1. Các mẫu tức thời lúc đổi theme cho giá trị thấp hơn. Chữ `Tùy chọn` dùng cho tên đọc có clip-path và hộp 1×1, nên không tính như chữ nổi trên nền. Nền ảnh và gradient nằm ngoài kết luận tương phản. [Log xác nhận](../../verification/audit-06/r4-e-verify-evidence.json) · [Ảnh](../../verification/audit-06/r4-e-verify-contrast.png) · [WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## E.5 · Phụ thuộc ngoài và mất Internet

**Các origin ngoài thực sự được request trong luồng chính: không có.** Bốn phiên VI/EN thường và sách nháp, cùng log trang chủ hai tier của Lượt 1, chỉ có HTTP tới localhost. `blob:` xuất hiện do ứng dụng tạo dữ liệu trong browser. Không thấy request CDN, font Google hoặc ảnh Wikimedia từ luồng đã đi qua. URL Google Fonts, Wikimedia, Facebook và trang ghi nguồn nằm trong metadata hoặc link người dùng có thể bấm. [Log mạng](../../verification/audit-06/network-preview-5.jsonl) · [Đối chiếu origin](../../verification/audit-06/r4-e-network-licenses.json).

| Trước khi bật ngoại tuyến | Hành vi |
|---|---|
| Máy mất Internet nhưng server loopback còn chạy | Luồng địa danh và bộ bài vẫn đi được khi chặn HTTPS. Link fanpage, nguồn ảnh và trang giấy phép thiếu đích nếu không có Internet. [Đối chứng](../../verification/audit-06/r3-env-external.json). |
| Máy chủ trang ở xa hoặc server cục bộ chưa chạy | Hồ sơ sạch chưa có Service Worker/gói để phục vụ trang. Các mục tình cờ còn trong HTTP cache không bảo đảm đủ để tải lại cả luồng. Đây là hệ quả của cách đăng ký opt-in và phạm vi worker. |
| Mở file:// trên ổ đĩa | Lượt 3 vào bản đồ, tới ga và mở bộ bài. Nút chuẩn bị gói không khả dụng vì worker yêu cầu HTTP(S) phù hợp. [Ca file://](../../verification/audit-06/r3-env-file.json). |

## E.6 · Giấy phép và ghi nguồn

| Tài nguyên | Hồ sơ hiện có |
|---|---|
| Font | OFL cho Be Vietnam Pro, Charm, Philosopher, Playfair Display, Barlow Semi Condensed, Dancing Script và Oswald. Hai trọng lượng Oswald dùng cùng OFL. Lora vùng đảo có OFL ở thư mục island. Giữ notice khi đóng gói. [Manifest](../../assets/fonts/heritage/manifest.json) · [OFL Oswald](../../assets/fonts/heritage/oswald-OFL.txt) · [OFL Lora](../../assets/fonts/island/OFL.txt). |
| Three.js | Repo có notice MIT. Không thấy Three.js được request ở bốn phiên preview-5 của Lượt 1. [Notice](../../assets/THREE-LICENSE.txt). |
| Earcut 3.0.2 | Gói vendor có ISC của Mapbox và được nạp trong preview-5. [Mã](../../assets/goi-viet/map-surroundings-preview/vendor/earcut-3.0.2.js) · [ISC](../../assets/goi-viet/map-surroundings-preview/vendor/earcut-LICENSE). |
| Ảnh ga | 35 ảnh có tác giả, trang nguồn, giấy phép và thông tin chuyển WebP/cắt khung. Hai ảnh Ninh Bình, Quảng Ngãi ghi Public domain, có trang nguồn và để trống URL giấy phép. Hoàng Sa dùng biểu tượng. Lượt 3 xác nhận 35 trang tệp. [Catalog](../../assets/goi-viet/station-photos-5/catalog.json) · [Credit](../../assets/goi-viet/station-photos-5/CREDITS.md) · [Wikimedia](../../verification/audit-06/r3-commons-credits.json). |
| Ảnh bìa thẻ | 120 mảnh từ 15 ga. 120/120 dòng trong danh mục còn “cần hỏi”. Năm dòng có ghi chú chữ, watermark hoặc logo bên thứ ba, gồm `hn/bl.webp`. Hồ sơ Canva của nhóm ghi xuất xứ bố cục. Cần xác nhận quyền từng ảnh trước khi công bố. [SOURCES.md](../../assets/goi-viet/card-covers-5/SOURCES.md). |

## E.7 · Dung lượng truyền và parse

Đọc `responseBodySize` từ Lượt 1 và cộng phản hồi HTTP thành công ở mỗi hồ sơ sạch. Số này là thân HTTP nén trên đường truyền cục bộ, chưa gồm header hoặc dữ liệu `blob:`. Cả bốn phiên không có phản hồi thành công thiếu cỡ byte. Viewport 1440×900.

| Phiên | Phản hồi HTTP | Thân phản hồi | MiB |
|---|---:|---:|---:|
| VI mặc định | 180 | 29.717.040 byte | 28,34 |
| EN mặc định | 180 | 29.717.040 byte | 28,34 |
| VI sách nháp | 182 | 30.952.190 byte | 29,52 |
| EN sách nháp | 182 | 30.952.190 byte | 29,52 |

Phiên mặc định tập trung ở trang chủ, 18.482.117 byte, và vào bản đồ, 9.927.335 byte. Các mục ảnh chiếm 19.907.831 byte. Terrain/bathymetry là gói dữ liệu nằm trong nhóm other của Playwright. Gói chuẩn bị ngoại tuyến báo 165,66 MB là tập riêng cho nhiều luồng. [Tổng theo pha, loại và URL](../../verification/audit-06/r4-e-network-licenses.json).

| Thân phản hồi lớn ở phiên VI mặc định | Byte |
|---|---:|
| hanoi-lake-illustration.png | 2.846.548 |
| bathymetry-data.js | 2.747.520 |
| homepage-reference-v9/assets-2k.js | 2.119.803 |
| terrain-data.js | 2.001.374 |
| bay-water.webp | 1.866.652 |
| paper-grain.webp | 1.677.972 |

Khối script tại dòng 5378 có **766.497 đơn vị UTF-16, tương đương 892.320 byte UTF-8**. Đo parse/compile tách riêng trong Chrome bằng `new Function` với cùng nguồn, không gọi hàm. Mười cặp mỗi mức CPU có một script và một comment cùng độ dài, đổi thứ tự và thêm comment phân biệt mẫu để tránh trùng mã. Kết quả gồm parse/compile kiểu V8 và có thể còn parse lười thân hàm. Thực thi khai báo dữ liệu, giải mã hình, mạng và layout nằm ngoài phép đo. [Khối inline](../../map-surroundings-preview-5.html#L5378) · [Log đo](../../tools/perf/results/audit-06/r4-e-main-parse.json).

| CPU | n | Trung vị parse/compile | Khoảng đo | Trung vị comment đối chứng |
|---|---:|---:|---:|---:|
| ×1 | 10 | 7,55 ms | 6,30–8,70 ms | 1,05 ms |
| ×4 | 10 | 72,00 ms | 52,40–93,20 ms | 7,45 ms |

Ba stylesheet `sea-postoffice-5.css`, `island-chart.css` và `map-decorative-frame-phase5.css` trả HTTP 200 ngay ở trang chủ trong log VI mặc định. Chúng truyền lần lượt 5.523, 1.401 và 1.099 byte, tổng **8.023 byte**, và không có rule được ghi nhận là dùng trong lượt coverage chính. Luồng đảo chạy ở phép riêng, sau khi dừng coverage. Tổng byte tải ảnh không tự cho biết phần nào đã được đưa lên màn hình. Trace Lượt 2 chỉ rõ các công việc raster, dựng nhãn và phiếu ga trong các giai đoạn sau khi parse. [Log tải](../../verification/audit-06/network-preview-5.jsonl) · [Coverage](../../tools/perf/results/audit-06/r4-e-main-coverage.json) · [Trace Lượt 2](BAO-CAO-A-DO-HOA-WEBGL.md#2-trace-và-phân-bố-của-10-lượt).

## Phát hiện E theo mẫu mục 9

### E-01 · Intro và bưu thiếp có thể ẩn phần đang giữ focus

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [syncBackgroundInertAndRenderState](../../map-surroundings-preview-5.html#L5857) · [pushModalFocus](../../map-surroundings-preview-5.html#L5918) · [closeIntroModal](../../map-surroundings-preview-5.html#L8435) |
| Mô tả | Cùng cơ chế đã thấy ở bộ bài D-03. Intro, sách và bưu thiếp cũng có khoảng chuyển focus sau khi phần đang active được yêu cầu ẩn. |
| Tái hiện | Chrome 1440×900. Đặt focus lên nút nhanh trang chủ rồi gọi đường vào trực tiếp. Ở bản đồ, dùng Enter mở bưu thiếp từ nhật ký hoặc mở sách từ ga. |
| Mong đợi / Thực tế | Focus rời vùng trước khi thêm aria-hidden/inert. Log setter ghi nút nhanh còn ở intro. Mutation log ghi trigger ở mapScene và Chrome cảnh báo với nút bưu thiếp. Các Tab sau khi modal mở vẫn nằm trong modal. |
| Bằng chứng | [Phiên chính](../../verification/audit-06/r4-e-main-evidence.json) · [Xác nhận](../../verification/audit-06/r4-e-verify-evidence.json) · [D-03](BAO-CAO-D-CHUC-NANG.md#d-03--focus-đi-qua-nền-bị-aria-hidden-khi-mở-bộ-bài) |
| Trạng thái | đã tái hiện |
| Đề xuất sửa | Chuyển focus tới đích đang mở trước khi ẩn nền. Giữ thứ tự push/pop trigger ở modal lồng. |
| Rủi ro khi sửa | Focus có thể mất khi đóng nhanh, khi sách phủ bộ bài, hoặc khi trigger cũ được dựng lại. |
| Cách kiểm sau sửa | Lặp Enter/Tab/Shift+Tab/Escape ở intro, thẻ, sách, bưu thiếp và modal đảo. Kiểm cây AX, console và điểm trả về. |

### E-02 · Hai module cùng gán API raster theo thứ tự script

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [Queue](../../assets/goi-viet/map-surroundings-preview/natural/raster-tasks.js#L38) · [Scheduler](../../assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js#L271) · [Thẻ script](../../map-surroundings-preview-5.html#L4146) |
| Mô tả | Hai object có khả năng khác nhau dùng cùng cửa API global. Các module sau đọc export đang có khi khởi tạo. |
| Tái hiện | Đối chiếu hai điểm gán và các thẻ defer, rồi theo chỗ gọi hoặc đăng ký kernel của bộ raster. |
| Mong đợi / Thực tế | Preview-5 có một chủ sở hữu API rõ. Hiện object queue đơn được nạp rồi scheduler ghi đè. Đảo thứ tự hoặc bỏ provider làm đổi API và nơi giữ kernel. |
| Bằng chứng | [Chỉ mục](../../verification/audit-06/r4-e-static-index.json) · [Coverage](../../tools/perf/results/audit-06/r4-e-main-coverage.json) |
| Trạng thái | suy luận từ mã |
| Đề xuất sửa | Khai báo provider duy nhất tại điểm vào, sau khi kiểm các nhánh và mô-đun dùng chung. |
| Rủi ro khi sửa | Có thể đổi vòng đời worker, khiến bản đồ chờ hoặc layer không vẽ trong fallback. |
| Cách kiểm sau sửa | Kiểm cold start, worker lỗi, WebGL tắt, file:// và ngoại tuyến. |

### E-03 · Cờ tương thích 3 và hàm vẽ ghi đè là hợp đồng ngầm

| Trường | Kết quả |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [Cờ body](../../map-surroundings-preview-5.html#L4310) · [project3D](../../assets/goi-viet/map-surroundings-preview/render-performance.js#L10) |
| Mô tả | Một giá trị body điều khiển nhiều nhánh JavaScript, CSS và artwork. Hàm phép chiếu được thay từ script defer. |
| Tái hiện | Đối chiếu cờ body và bảng module tại E.2. So thời điểm dùng hàm với điểm khai báo. |
| Mong đợi / Thực tế | Phụ thuộc của cờ và phép chiếu được thể hiện ở điểm vào. Hiện các điều kiện nằm rải trong loader, controller và stylesheet. |
| Bằng chứng | [Chỉ mục](../../verification/audit-06/r4-e-static-index.json) |
| Trạng thái | suy luận từ mã |
| Đề xuất sửa | Ghi rõ hợp đồng tại điểm vào. Tách dần theo chức năng khi cần. |
| Rủi ro khi sửa | Đổi một nhãn có thể đổi cả phối cảnh và gói ảnh. |
| Cách kiểm sau sửa | Kiểm tier 2K/4K, intro, giảm chuyển động và ảnh địa hình. |

### E-04 · Ready ngoại tuyến chưa đối chiếu nội dung mới với manifest

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [Bộ dựng](../../tools/build-preview-5-offline.py#L22) · [Worker cài](../../preview-5-offline-worker.js#L29) · [Worker cập nhật](../../preview-5-offline-worker.js#L65) |
| Mô tả | Worker dùng SHA-256 khi tái sử dụng mục cũ. Response mới được ghi theo HTTP OK, còn ready dựa vào đếm khóa. |
| Tái hiện | Đọc install, nhánh network-first và GOIVIET_OFFLINE_STATUS. Đối chiếu bốn tên động trong B-01/D-01. |
| Mong đợi / Thực tế | Gói hợp lệ có đủ tier và đúng nội dung. Một mục sai phiên bản vẫn có thể thỏa điều kiện đếm khóa. B-01/D-01 xác nhận trường hợp bỏ sót đường dẫn dù báo ready. |
| Bằng chứng | [Log ready 629 mục](../../verification/audit-06/r3-offline-1920-confirm.json) · [Điểm đọc số mục](../../preview-5-offline-worker.js#L86) |
| Trạng thái | suy luận từ mã |
| Đề xuất sửa | Kiểm đủ đường tải động theo tier và tính toàn vẹn gói tại điểm ghi, ưu tiên HTML/JS/dữ liệu lõi. |
| Rủi ro khi sửa | Hash mọi tài nguyên làm tăng CPU và thời gian chuẩn bị. Cần giữ gói cũ dùng được khi tải mới lỗi. |
| Cách kiểm sau sửa | Kiểm chuẩn bị và tải lại không mạng ở 2K/4K. Đối chứng thay nội dung mẫu trong môi trường kiểm. |

### E-05 · CSS và JS của luồng đảo nạp trong đường chính

| Trường | Kết quả |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [Các thẻ CSS/JS](../../map-surroundings-preview-5.html#L4151) |
| Mô tả | Hải trình và atlas lấy CSS/JS dù người dùng đang ở ga Hà Nội, sách hay bưu thiếp. |
| Tái hiện | Thu coverage từ cổng tới cài đặt ở 1440×900. Dừng trước khi mở quần đảo. |
| Mong đợi / Thực tế | Có thể xem xét nạp theo chức năng. Trong mẫu, family-voyage-5.js còn 94,71% byte chưa dùng và sea-postoffice-5.css còn 100%. Luồng đảo dùng các tệp đó. |
| Bằng chứng | [Khoảng đo](../../tools/perf/results/audit-06/r4-e-main-coverage.json) · [Luồng đảo](../../verification/audit-06/r4-e-main-evidence.json) |
| Trạng thái | đã đo |
| Đề xuất sửa | Thử nạp khi cần cho CSS đảo, atlas hoặc album. Dùng kiểm kê B cho quyết định loại tệp. |
| Rủi ro khi sửa | Lần mở chức năng đầu có thể chậm thêm. Bộ chuẩn bị ngoại tuyến cũng phải biết các phụ thuộc nạp muộn. |
| Cách kiểm sau sửa | Kiểm A/B cùng luồng chính, rồi mở Hoàng Sa và Trường Sa ở HTTP, file:// và ngoại tuyến. |

### E-06 · Hồ sơ quyền sử dụng ảnh bìa chưa đầy đủ

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [SOURCES.md](../../assets/goi-viet/card-covers-5/SOURCES.md) |
| Mô tả | 120 mảnh ảnh bìa ghi “cần hỏi”, gồm năm mục có ghi chú chữ, watermark hoặc logo. |
| Tái hiện | Đếm dòng ảnh trong SOURCES.md và kiểm các ghi chú Hà Nội, Bắc Ninh, Quảng Ngãi, Quảng Ninh. |
| Mong đợi / Thực tế | Có trang nguồn, tác giả và điều kiện dùng từng ảnh trước khi công bố. Danh mục hiện có mã Canva và vị trí khung, phần quyền còn để mở. |
| Bằng chứng | [Tổng hợp](../../verification/audit-06/r4-e-network-licenses.json) · [Danh mục bìa](../../assets/goi-viet/card-covers-5/SOURCES.md#L25) |
| Trạng thái | suy luận từ mã |
| Đề xuất sửa | Xác nhận quyền hoặc thay ảnh có chứng từ rõ. Giữ kiểu bìa, khung và dữ liệu thẻ. |
| Rủi ro khi sửa | Có thể phải thay góc cắt và ảnh phân giải thấp, đồng thời cập nhật credit và cache. |
| Cách kiểm sau sửa | Kiểm 120 mục có nguồn/quyền, chụp các pha xòe/rút và thử hồ sơ ngoại tuyến. |

### E-07 · Luồng chính truyền khoảng 28–30 MiB ở hồ sơ sạch

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [Khối inline](../../map-surroundings-preview-5.html#L5378) · [Ảnh hồ Hà Nội](../../assets/goi-viet/map-art/hanoi-lake-illustration.png) |
| Mô tả | Phiên mặc định 28,34 MiB thân phản hồi, phiên sách nháp 29,52 MiB. Ảnh chiếm phần lớn ở phiên thường. |
| Tái hiện | Cộng phản hồi HTTP thành công trong từng log A.1. Đo riêng parse/compile nguồn inline trên Chrome. |
| Mong đợi / Thực tế | Các tài nguyên cần trước hiển thị được ưu tiên. Trên 95% byte mặc định rơi vào trang chủ và mở bản đồ. Parse/compile trung vị riêng là 7,55 ms ở ×1 và 72,00 ms ở ×4. |
| Bằng chứng | [Tổng byte](../../verification/audit-06/r4-e-network-licenses.json) · [Parse/compile](../../tools/perf/results/audit-06/r4-e-main-parse.json) |
| Trạng thái | đã đo |
| Đề xuất sửa | Xét nạp theo thời điểm dùng, ưu tiên viewport và ảnh đúng kích cỡ thực tế, kiểm giữ tính năng. |
| Rủi ro khi sửa | Hoãn quá sâu có thể làm lộ ô trống hoặc chậm khi mở ga. Chế độ ngoại tuyến và file:// cần giữ đủ tài nguyên. |
| Cách kiểm sau sửa | So byte theo pha, thời gian vào map và ảnh 1080p/4K. Dùng n≥10 để so bản sửa. |

## Giới hạn E

Chưa dùng trình đọc màn hình hoặc đo mọi trạng thái tương phản trên nền ảnh. Lần chính chưa mở lại phần ghi kỷ niệm sau cài đặt, nên trường đó được kiểm lại trong hồ sơ độc lập. Coverage chỉ phản ánh luồng đã ghi cùng các phạm vi Playwright thấy, còn CSS chèn động và worker có giới hạn riêng. Parse/compile đo mã nguồn trong một hàm không chạy thân, tách khỏi thực thi khối inline. Kiểm markup dựa vào các đường nhập và các trạng thái dựng lại đã đi qua.

## F · Máy lớp học không có GPU

### F.1 · WARP trên Chrome 157

Chrome 157.0.8103.79 trên Windows tạo được WebGL và WebGL2 với `--use-gl=angle --use-angle=d3d11-warp`. `UNMASKED_RENDERER_WEBGL` trả về đúng chuỗi sau khi bản đồ đã mở. Terrain WebGL hoạt động ở cả ba phiên.

```text
ANGLE (Microsoft, Microsoft Basic Render Driver (0x0000008C) Direct3D11 vs_5_0 ps_5_0, D3D11)
```

Thử `--use-angle=warp` riêng trên cùng bản Chrome trả về ANGLE Google SwiftShader. Phép thành công dùng D3D11 WARP và không truyền `--enable-unsafe-swiftshader`. Tên cờ lấy từ mã Chromium. Tài liệu Chromium cũng phân biệt việc chủ động bật SwiftShader và quá trình bỏ dự phòng WebGL tự động. Điều kiện thử là máy có Intel Arc nhưng buộc chọn renderer phần mềm. Cấu hình tự chọn trên máy lớp học cần đọc lại renderer thực tế. [Probe warp](../../tools/perf/results/audit-06/r4-f-probe-warp.json) · [Probe d3d11-warp](../../tools/perf/results/audit-06/r4-f-probe-d3d11-warp.json) · [Mã cờ ANGLE](https://chromium.googlesource.com/chromium/src/+/master/ui/gl/gl_switches.cc) · [Tài liệu SwiftShader của Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/docs/gpu/swiftshader.md).

### F.2 · Đo có cửa sổ ở 1920×1080

Windows, Chrome 157.0.8103.79 và Edge 158.0.4370.33. Mỗi lần mở một cửa sổ toàn màn hình với hồ sơ riêng, trang hiển thị foreground, không headless, CSS viewport 1920×1080 và DPR 1 trong sai số làm tròn. Kích thước cửa sổ do hệ điều hành báo là 1707×1067 theo thiết lập của máy thử. Viewport được đặt bằng Playwright, nên đây là phép đo ở kích thước trang đã ghi, chưa phải phép đo với máy chiếu vật lý. Mỗi nhóm bắt đầu từ hồ sơ sạch và dùng cùng server loopback. Các cờ tự động hóa và cô lập mạng có trong script. Khi dùng shortcut, hai context WebGL/WebGL2 đều trả null và terrain dùng đường dự phòng.

Đo từ nút Mở bản đồ sau khi bỏ qua mở đầu, đến lúc rèm hết và qua hai rAF. Kéo trái và xoay phải trên canvas, mỗi thao tác 14 bước và 240 ms đuôi. Xác nhận đích camera có thay đổi. FPS là số khoảng rAF chia tổng thời lượng các khoảng đo. CPU ×4 là CDP throttling của trang, không phải máy chạy chậm đồng đều ở mọi tiến trình. Bảng dùng trung vị và khoảng min–max của ba lần độc lập mỗi nhóm. Lượt kiểm đầu dừng trước phép đo vì DPR được biểu diễn thành 1,0000000298. Bộ số dưới đây dùng kiểm sai số 0,001 và đủ ba mẫu mỗi nhóm. [Script](../../scratch/audit-06/round4-f.cjs) · [Số từng mẫu và chỉ mục log](../../tools/perf/results/audit-06/r4-f-summary.json).

| Trình duyệt và chế độ | CPU | n | Vào bản đồ, s | Kéo, FPS | Xoay, FPS |
|---|---:|---:|---:|---:|---:|
| Chrome · WARP | ×1 | 3 | 12,30 (11,70–12,34) | 40,55 (33,41–42,33) | 19,01 (16,73–19,28) |
| Chrome · shortcut Canvas | ×1 | 3 | 9,84 (9,70–11,03) | 6,67 (4,79–7,64) | 2,85 (2,57–3,29) |
| Edge · shortcut Canvas | ×1 | 3 | 9,28 (8,43–11,36) | 4,71 (4,66–6,50) | 2,82 (2,45–2,83) |
| Chrome · shortcut Canvas | ×4 | 3 | 35,69 (34,25–35,96) | 3,52 (2,96–3,70) | 2,36 (2,10–2,47) |
| Edge · shortcut Canvas | ×4 | 3 | 35,73 (32,72–38,03) | 6,62 (3,28–7,61) | 3,81 (2,45–4,64) |

Ở CPU ×4, 6/6 lần shortcut chạm ngưỡng chờ chuẩn bị. Console ghi `[Bản đồ] Hết thời gian chờ chuẩn bị bản đồ; mở bản đồ hiện có.`. Mã đặt ngưỡng 30 giây rồi chờ pha ổn định ngắn trước khi hé rèm. Cả hai trình duyệt mở được phiếu Hà Nội và ảnh có `naturalWidth=1000` ở ảnh kiểm. Dải FPS Edge ×4 rộng với n=3, chưa đủ để xếp Edge nhanh hơn Chrome. Các số F dùng cửa sổ thật và khác điều kiện headless mô phỏng SwiftShader ở D-06. [Mã prewarm](../../assets/goi-viet/map-surroundings-preview/map-prewarm-3.js#L68) · [Phép headless Lượt 3](BAO-CAO-D-CHUC-NANG.md#e--ba-đường-dự-phòng-1080p).

**Hình ảnh.** Mẫu WARP có canvas terrain WebGL, các dải địa hình và nét sông cùng loại với ảnh Intel Arc đã có. Canvas ×1 vẫn hiện nền địa hình, nước và sông bằng đường raster 2D. Ảnh kiểm shortcut ×4 chụp sau thao tác và mở ga Hà Nội còn dùng nền phủ đơn giản, có ranh chéo phía trên trái và thiếu vân địa hình, đường sông ở vùng xung quanh. Nút, nhãn và phiếu ga vẫn hiện. Hai lớp lần lượt có ID `regionalCoverageCanvas` và `regionalLandSeaCanvas`. Góc chụp giữa Intel và F lệch nhẹ theo trạng thái camera, nên đối chiếu theo lớp hình thay vì sai biệt pixel. [Ảnh so sánh sáu cấu hình](../../verification/audit-06/r4-f-contact.png) · [Ảnh Intel Arc đã có](../../verification/audit-06/matrix-real-1920-1.png).

**Nền ở ×4 sau khi chờ.** Chạy thêm một phiên kiểm hình mỗi trình duyệt, chọn Hà Nội rồi để camera yên. Lúc rèm vừa hết, cả hai báo `coverageFallback=true`, `backdropCommits=0` và còn tác vụ nền. Khoảng 18,0 giây sau khi mở phiếu ở Chrome, 25,0 giây ở Edge, hai lần lấy mẫu liên tiếp có cùng số commit, `coverageFallback=false`, camera đã tới đích và hàng đợi nền hết trạng thái chờ. Ảnh lúc đó có lại địa hình, nước và đường sông, ranh chéo biến mất. Khoảng chờ này là quan sát bổ sung n=1 mỗi trình duyệt, tách khỏi số đo vào/kéo/xoay. [Chrome log](../../tools/perf/results/audit-06/r4-f-settle-chrome-x4.json) · [Chrome ảnh](../../verification/audit-06/r4-f-settle-chrome-x4.png) · [Edge log](../../tools/perf/results/audit-06/r4-f-settle-edge-x4.json) · [Edge ảnh](../../verification/audit-06/r4-f-settle-edge-x4.png).

### F.3 · Lệnh cho trường Target của shortcut Windows

Chạy `node tools/perf/server.cjs` từ thư mục gốc dự án. Mở cùng địa chỉ `http://127.0.0.1:8770/map-surroundings-preview-5.html` khi dùng hoặc chuẩn bị ngoại tuyến. Dưới đây là Target với đường dẫn hồ sơ tuyệt đối của tài khoản Uy. Trên tài khoản khác, lấy thư mục bằng `$env:LOCALAPPDATA` trong PowerShell và thay phần `C:\Users\Uy\AppData\Local`. Mỗi Target có thư mục hồ sơ riêng. Trình duyệt tạo hồ sơ ở lần mở đầu tiên nếu tài khoản có quyền ghi.

**Chrome · Canvas**

```text
"C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-gpu --disable-3d-apis --user-data-dir="C:\Users\Uy\AppData\Local\GoiViet-TrinhChieu\Chrome-Canvas" --new-window "http://127.0.0.1:8770/map-surroundings-preview-5.html"
```

**Edge · Canvas**

```text
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --disable-gpu --disable-3d-apis --user-data-dir="C:\Users\Uy\AppData\Local\GoiViet-TrinhChieu\Edge-Canvas" --new-window "http://127.0.0.1:8770/map-surroundings-preview-5.html"
```

**Chrome · WARP để thử trước khi chọn Canvas**

```text
"C:\Program Files\Google\Chrome\Application\chrome.exe" --use-gl=angle --use-angle=d3d11-warp --user-data-dir="C:\Users\Uy\AppData\Local\GoiViet-TrinhChieu\Chrome-WARP" --new-window "http://127.0.0.1:8770/map-surroundings-preview-5.html"
```

Dùng Chrome/Edge mặc định khi WebGL phần cứng chạy ổn định. Nếu chỉ có renderer phần mềm, thử WARP Chrome ở 1080p và kiểm tốc độ trên đúng máy. Nếu WebGL không dựng được, shortcut Canvas là đường dự phòng có thể mở bản đồ, với thời gian chờ và giới hạn chuyển động nêu trên. Có thể mở sẵn ga đầu và giảm số lần xoay trong buổi trình chiếu. Phép WARP đo ở CPU ×1, chưa định lượng ×4. Phép kiểm dùng các cờ tương ứng qua Playwright, chưa thử chính sách quản trị máy lớp học hoặc đối chiếu cách Windows lưu một tệp `.lnk`. Các lệnh ở đây chỉ để sao chép.


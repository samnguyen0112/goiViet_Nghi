# Bưu điện biển đảo — thiết kế lần 2 cho preview-5

Ngày cập nhật: 13/11/2026.

## Quyết định thiết kế

Hoàng Sa và Trường Sa trở thành một bàn thư để cả nhà cùng mở, chọn, kể và đóng dấu. Màn chơi mặc định tập trung vào một lời mời ngắn và một hành động chính; bản đồ, tư liệu và câu hỏi nằm ở các lớp mở thêm.

Chất liệu giữ theo website: giấy kem, chữ tiêu đề serif, đỏ son, vàng ấm, dấu sen và hình thuyền buồm đỏ sẵn có trong `assets/goi-viet/memory-reference-v5/`. Các tỉnh thành tiếp tục dùng trải nghiệm hiện có. Thiết kế mới chỉ bật ở desktop từ 961 px; không thiết kế lại mobile.

## Plan đã triển khai

| Bước | Thực hiện |
| --- | --- |
| Giảm thông tin mặc định | Thay bản đồ–bảng nhiệm vụ bằng phong bì niêm phong. Bỏ bảng chia vai, tọa độ, danh mục, tư liệu và bộ bài khỏi màn đầu. |
| Tạo cách chơi riêng cho biển đảo | Chạm dấu sen mở thư, cùng chọn/kể, đóng dấu gửi, rồi chủ động mở thư tiếp. Hoàng Sa dùng lời dặn và lắng nghe; Trường Sa dùng điểm hẹn và túi nếp nhà. |
| Giữ phong cách chung | Tái sử dụng thuyền buồm, giấy và font của dự án. Phong bì, dấu in, sóng và các đồ vật được trình bày như đạo cụ trên bàn thư. |
| Mở dần theo nhu cầu | Biểu tượng bút mở phần ghi lời; “Khám phá thêm” mở tư liệu, bộ bài, đổi người/địa danh và VI/EN. Hải đồ có liên kết riêng. |
| Giữ các chức năng cần thiết | Nháp, lịch sử thư, bưu thiếp PNG, nhật ký, kỷ niệm trên bản đồ chung, bộ thẻ gốc và ngoại tuyến tiếp tục hoạt động. |
| Nghiệm thu theo thiết kế mới | Kiểm tra mật độ chữ, vùng chữ–hình, các vòng chơi, lưu nháp, ảnh xuất, bàn phím, DPI, hủy hiệu ứng và hồi quy mobile/tỉnh thành. |

## Hai mạch chơi

| Quần đảo | Lá thư 1 | Lá thư 2 | Lá thư 3 |
| --- | --- | --- | --- |
| Hoàng Sa — Thư nhà theo sóng | Chọn một lời dặn để gửi cho người bên cạnh | Kể và lắng nghe một lời dặn còn nhớ | Ghép một câu/chuyện muốn giữ lại |
| Trường Sa — Gói một chút nhà | Chọn một điểm hẹn thân thuộc | Mỗi người góp ý, cùng chọn tối đa ba điều mang theo | Nối một lời gửi về nhà |

Mỗi lá có ba lời mời thay thế. Lựa chọn được thể hiện bằng hình đồ vật và trạng thái chọn, giúp người chơi tham gia trước khi cần đọc thêm. Những câu chuyện và câu hỏi gốc vẫn có trong lớp khám phá thêm.

## Luồng chính và trạng thái

`Phong bì → Mở dấu sen → Cùng chọn/kể → Đóng dấu → Thư đã gửi → Mở thư tiếp → Nhận bưu thiếp`.

- Một lời mời xuất hiện mỗi lượt. Phần ghi kỷ niệm được gấp lại mặc định.
- Hoàn thành thư cần thao tác của người chơi; không tự đếm hết giờ rồi chuyển bước.
- Có thể đổi lời mời hoặc để một thư lần sau. Thư bỏ qua được ghi riêng với thư đã cùng làm.
- Lời đã nhập, từ đã chọn, túi đồ và trạng thái mở/gửi giữ riêng cho từng quần đảo.
- Sổ thư chứa thành quả thật của gia đình: từ đã chọn, đồ vật đã chọn và câu tự viết.
- Chơi lại tạo chuyến mới, giữ chuyến trước trong sổ của phiên hiện tại.
- Dữ liệu chỉ giữ trong phiên trang. Khi mở phần viết, có ghi chú ngắn về điều này; PNG/nhật ký dùng để giữ lâu dài.

## Các lớp khám phá thêm

**Hải đồ:** giữ nguyên dữ liệu đường bờ, rạn, tọa độ, tìm kiếm, danh mục và công cụ điều khiển. Vị trí/mức phóng được giữ khi trở về bàn thư rồi mở lại hải đồ.

**Thẻ gợi chuyện:** giữ phong cách `card-testing.html`: đỏ son viền vàng, xòe đàn hồi, gom–xáo–chọn–rút, hai mặt song song và dấu sen che phần gắn kết. Có thể chọn trực tiếp bằng bàn phím hoặc rút ngẫu nhiên. Chơi thư không yêu cầu trả lời trắc nghiệm.

**Câu chuyện & nguồn:** mở đoạn tư liệu có bối cảnh và đường dẫn nguồn. Phần này tách khỏi lời mời sáng tạo của gia đình.

**Bộ thẻ quen thuộc:** tạm dừng bàn thư và mở bộ thẻ gốc. Dữ liệu câu hỏi, hoạt động và địa danh gốc không bị thay thế.

## Kết nối với hệ thống cũ

Thư hoàn thành bổ sung dấu hoạt động vào tiến trình chung. Bưu thiếp chung hiển thị đúng lời mời vừa thực hiện, thay vì ghi hoạt động tìm địa danh của bản thiết kế trước. Chữ do hệ thống sinh đổi theo VI/EN; lời người chơi nhập được giữ nguyên. Kỷ niệm đưa sang bưu thiếp chung vẫn dùng checkbox chọn tham gia của bản cũ.

PNG xuất ở 1800 × 1200, gồm lời nhắn và các lựa chọn; nhật ký văn bản chứa thông tin đầy đủ cùng nguồn. Đường bờ trên bưu thiếp có ghi công OpenStreetMap/ODbL. Gói ngoại tuyến được tạo lại cho bộ tài nguyên mới.

## Tệp triển khai

- `map-surroundings-preview-5.html`: nạp tài nguyên riêng cho bản mới.
- `assets/goi-viet/map-surroundings-preview/sea-postoffice-data-5.js`: lời mời ngắn và bản dịch của hai mạch thư.
- `assets/goi-viet/map-surroundings-preview/sea-postoffice-5.css`: trình bày bàn thư trên desktop.
- `assets/goi-viet/map-surroundings-preview/family-voyage-5.js`: trạng thái mở/gửi thư, khám phá thêm, nháp, xuất và kết nối tiến trình chung.
- `assets/goi-viet/map-surroundings-preview/offline-manifest-5.js`: danh sách/băm ngoại tuyến đã cập nhật.
- `tools/check-family-voyage-5.cjs`: kiểm tra theo luồng mới, thay cho kiểm tra bố cục bản cũ.

Bản triển khai và báo cáo lần trước được lưu trong `verification/sea-postoffice-5/before-source/` để đối chiếu. Không sửa `index.html`, preview trước, tài nguyên chung của chúng hoặc các tệp demo đến ga có sẵn.

## Kiểm tra và bằng chứng

Phép đếm cùng phương pháp trên nội dung DOM hiển thị mặc định của màn mở đầu: **283 → 71 từ**, giảm khoảng **75%**. Nội dung trong các mục đang gấp không tính vào phép đo. Kết quả: `verification/sea-postoffice-5/density.json`.

Kết quả nghiệm thu ngày 13/11/2026:

- **11 nhóm kiểm tra chức năng đạt** trên HTTP, không ghi nhận lỗi JavaScript trong các luồng kiểm tra.
- Sau tinh chỉnh cuối về vị trí thuyền: **5 khung desktop tiếng Việt, 4 khung tiếng Anh** không chồng vùng tiêu đề–thuyền/phong bì; nút gửi nằm trong vùng nhìn ở 4 khung mở thư. Đã rà ảnh, gồm 1024×768 và ngưỡng 961×768.
- **Bộ thẻ gốc đạt ở 6 kích thước**, gồm xòe, hai mặt, niêm phong, ghi kỷ niệm và hiệu ứng rút bài thật.
- **Gói ngoại tuyến cuối đạt** sau lần sửa CSS cuối: cài 496 tài nguyên, ngắt mạng, tải lại rồi mở/chọn/đóng dấu thư.
- Kiểm tra song ngữ, tính đồng bộ manifest ngoại tuyến và `git diff --check` đều đạt.

Ảnh đối chiếu: [màn đầu trước sửa](../../verification/sea-postoffice-5/before.png), [bàn thư mới 1440 px](../../verification/sea-postoffice-5/sealed-1440.png), [bàn thư 1024 px](../../verification/sea-postoffice-5/sealed-1024.png), [thư đã mở 961 px](../../verification/sea-postoffice-5/letter-961.png), [túi nếp nhà Trường Sa](../../verification/sea-postoffice-5/truong-sa-bag.png).

Bộ kiểm tra chính bao gồm:

- Hàm băm trang/tài nguyên được bảo vệ và dữ liệu bộ thẻ gốc.
- Chín mốc bố cục mobile/tablet: 390, 720, 820 px × Hoàng Sa, Trường Sa, Phú Quốc.
- Năm kích thước desktop: 1920×1080, 1440×1000, 1366×768, 1024×768, 961×768.
- Mở thư bằng bàn phím, chọn từ, túi đồ tối đa ba lựa chọn, câu mở đầu và đổi lời mời.
- Tạm dừng/tiếp tục đúng thư đang mở hoặc vừa gửi; đổi quần đảo, ngôn ngữ, kích thước và chế độ sáng/tối.
- Sáu lá thư, sáu dấu chung, hai kỷ niệm, bưu thiếp chung và giữ cơ chế chọn tham gia.
- PNG và nhật ký được tải thật; lịch sử chơi lại, chuỗi dài tối đa và nội dung giống HTML được giữ như văn bản.
- Hải đồ đầy đủ, tìm kiếm và khôi phục camera; bộ thẻ phụ có xòe, chọn đúng lá, hai mặt và niêm phong `inert`.
- Gom–xáo–chọn–rút thật; hủy hoặc đổi địa danh giữa chừng không tiêu thụ lá bài.
- 20 lần gọi mở liên tiếp, 20 chu kỳ mở–đóng; một khung chơi/canvas và ngăn xếp trả tiêu điểm cân bằng.
- Màn hình mật độ 2×; kiểm tra riêng vùng chữ–thuyền và nút gửi ở các kích thước desktop.
- Cài gói ngoại tuyến, ngắt mạng và tải lại; hình thuyền cùng vòng mở/chọn/gửi vẫn hoạt động.

Lệnh kiểm tra trong workspace:

```powershell
node tools/check-family-voyage-5.cjs
node tools/check-family-voyage-5.cjs --layout-only
node tools/check-family-voyage-5.cjs --deck-only
node tools/check-family-voyage-5.cjs --dpi-only
node tools/check-family-voyage-5.cjs --stress-only
node tools/verify-preview5-conversation-cards.cjs
node tools/check-i18n-5.cjs
python tools/build-preview-5-offline.py --check
git diff --check
```

Để kiểm tra HTTP/ngoại tuyến bằng máy chủ tạm tự dừng:

```powershell
$env:VOYAGE_TEST_URL='http://127.0.0.1:8771/map-surroundings-preview-5.html'
$env:VOYAGE_TEST_OFFLINE='1'
$env:VOYAGE_TEST_SERVE='1'
node tools/check-family-voyage-5.cjs
```

Bằng chứng mới nằm trong `verification/sea-postoffice-5/`, gồm `checks-http.json`, `checks-layout-only.json`, `checks-offline-only.json`, ảnh năm kích thước desktop, ảnh mở/gửi thư, túi nếp nhà và bưu thiếp xuất thật. Các kiểm tra dùng Chrome trên Windows và rà ảnh. Chưa tổ chức buổi chơi với gia đình thật hoặc nghiệm thu riêng Safari/Firefox; hiệu quả trò chuyện thực tế cần được đánh giá bằng buổi chơi thử.

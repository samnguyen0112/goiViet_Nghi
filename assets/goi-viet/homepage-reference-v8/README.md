# Trang chủ Preview 3 — bộ lớp theo ảnh tham chiếu

Ảnh chuẩn: `references/approved-home.png` do người dùng cung cấp. Chỉ Preview 3 với `data-home-art="reference-v8"` sử dụng bộ mới này.

## Cấu trúc

- 12 lớp gen độc lập: nền giấy, 6 cụm núi xa/giữa/gần, thung lũng sông, 3 công trình và cầu.
- 52 lớp còn lại dùng nguyên dữ liệu cũ, gồm tàu, mây, hạc, lá và các thành phần chuyển động. Tổng cộng vẫn 64 lớp.
- `sources/*.png`: bản gen gốc, giữ nguyên. Mỗi tệp JSON ghi prompt, kích thước gen thật, mã kiểm tra và vị trí lớp.
- `*.webp`: bản căn vào kích thước lớp gốc; `*-2k.webp` và `*-4k.webp`: các lớp dùng thực tế.
- `assets-2k.js` / `assets-4k.js`: dữ liệu từng lớp nhúng để Canvas vẫn chạy khi mở trang qua `file://`.
- `poster-*.webp`: ảnh dự phòng và chế độ giảm chuyển động; intro thông thường vẫn ghép các lớp độc lập.

Kích thước gói 2K/4K là kích thước xuất bản. Kích thước gen gốc của từng lớp được ghi riêng trong JSON, không được hiểu là mọi ảnh đều gen nguyên bản ở 4K.

## Căn lớp và bảo toàn chuyển động

Màu/chi tiết gen mới được căn về khung lớp cũ. Viền trong suốt giữ nguyên từng byte theo từng gói 2K/4K. Phần giấy đục quanh sương được đồng bộ với chính lớp nền giấy mới để tránh các mảng chữ nhật. Lớp cầu gen có đệm trong suốt nên phần tranh được cắt tại `(0, 278, 2172, 166)` trước khi căn về `3840×278`.

Không đổi tọa độ, thứ tự vẽ, đường bay, thời điểm xuất hiện, chuyển động, thời lượng hoặc điều khiển intro. Các ảnh cũ và nội dung trang giữa được giữ nguyên. Các lớp mới là tranh gen theo tham chiếu; không phải bản trùng từng pixel với ảnh chuẩn.

## Kiểm chứng

Thư mục `verification/home-reference-v8` lưu ảnh trước/sau, 15 mốc intro, ảnh điện thoại, video intro chạy trên trang thật và `verification-report.json`.

Các công cụ trong `tools/*home-reference-v8.cjs` thực hiện chuẩn bị, căn lớp, đóng gói, tích hợp và kiểm chứng. Không chạy lại công cụ chuẩn bị vì đó là bản chụp hiện trạng ban đầu.

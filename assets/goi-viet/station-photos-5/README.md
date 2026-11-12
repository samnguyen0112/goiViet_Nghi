# Ảnh ga và bộ ngoại tuyến dành riêng cho preview-5

35 ảnh thật cục bộ phục vụ 34 tỉnh thành và Trường Sa. Ga Hoàng Sa tạm dùng biểu tượng,
chờ người dùng chọn ảnh mới. `catalog.json` có đủ 36 mã ga; record Hoàng Sa có
`status: "placeholder"`, không có URL ảnh hoặc ghi công ảnh cũ.

Mỗi ảnh đã duyệt có tên địa danh Việt/Anh, tác giả, giấy phép, trang nguồn, vị trí
lấy nét, kích thước và SHA-256. Xem `CREDITS.md`. Ứng dụng chỉ nhận URL ảnh trong
thư mục này qua `getStationPhotoUrl()`. Các liên kết Commons trong phần ghi công
không được dùng để tải ảnh khi chọn ga.

## Bật chế độ chạy không mạng

1. Mở bản đồ của preview-5 qua HTTPS hoặc localhost.
2. Mở **Tùy chọn / Options**.
3. Bấm **Chuẩn bị chạy không mạng / Prepare for offline use**. Nút nêu dung lượng
   khoảng 164 MB cho toàn bộ trang, bản đồ, phông, ảnh và sách.
4. Theo dõi số tệp và thanh tiến độ. Chỉ khi có trạng thái **Đã sẵn sàng chạy không
   mạng / Ready for offline use** mới xem là đã lưu trọn bộ. Khi lỗi, kiểm tra kết
   nối rồi bấm thử lại.

Lượt vào đầu tiên không bấm nút không cài worker và không tải bộ này. Người đã có
registration tiếp tục dùng bộ đã lưu. Worker mới có scope chính xác
`map-surroundings-preview-5.html`, không điều khiển index hoặc preview 1–4. Bản cũ
có registration rộng được chuyển sang scope hẹp khi có mạng; các tài nguyên có
SHA-256 khớp được dùng lại từ cache cũ.

HTML/navigation, JS, CSS và JSON lấy **mạng trước**, giữ nguyên query `?v=`, rồi mới
lấy bản lưu khi kết nối thất bại. Ảnh và phông lấy cache trước. Lỗi HTTP từ máy chủ
vẫn là phản hồi thật; không bị bản lưu che mất. Bộ có phiên bản chỉ được kích hoạt
sau khi chuẩn bị hoàn tất; bản lưu trước còn nguyên nếu việc chuẩn bị bản mới lỗi.

Mở `file://` vẫn dùng tài nguyên cục bộ, không có worker. Nút sẽ giải thích rằng bản
mở từ tệp không cần tải bộ không mạng. Cũng có thể phục vụ cả dự án mà không cần Internet:

```powershell
node tools/perf/server.cjs
```

Mở `http://127.0.0.1:8770/map-surroundings-preview-5.html`.

## Cập nhật ảnh hoặc tài nguyên

1. Tải và kiểm chứng nguồn bằng `tools/station-photo-source-5.py`; xem cả ảnh đầy đủ
   lẫn ảnh trong khung. Ứng viên Hoàng Sa chưa được phép tải cho đến khi người dùng chọn.
2. Cập nhật ảnh và record đã duyệt trong `catalog.json`.
3. Chạy `python tools/build-station-photos-5.py` để đồng bộ dữ liệu ga và ghi công.
4. Thêm bản dịch `photoTitle` vào `tools/content-en-5/tables.cjs`; chạy
   `node tools/build-content-en-5.cjs` rồi `node tools/build-content-en-5.cjs --check`.
5. Sau mọi thay đổi tài nguyên chạy thật, chạy `python tools/build-preview-5-offline.py`.
6. Kiểm tra bắt buộc: **`python tools/build-preview-5-offline.py --check`**. Lệnh không
   ghi tệp; trả mã 1 nếu manifest khác với bản dựng hiện tại, mã 0 nếu khớp.

## Kiểm thử

- `tools/check-station-photos-5.cjs`: 35 ảnh + biểu tượng Hoàng Sa, đủ 36 ga, 6 cỡ,
  Việt/Anh, ghi công, mở sách, bấm chuẩn bị rồi mở tab mới/tải lại khi offline.
- `verification/p5-books/scripts/probe-offline-sw-5.cjs`: lượt chưa bấm phải 0 yêu cầu
  worker/0 sách; sau bấm phải đủ manifest, có tiến độ và scope đúng.
- `verification/p5-books/scripts/probe-offline-stale-5.cjs`: query phiên bản mới tới
  máy chủ, navigation/code lấy mạng trước và vẫn có fallback khi offline.
- `net-before-book-p5-05.cjs` tính cả request của trang và worker.

API/nguồn đã kiểm tra và ảnh nghiệm thu nằm trong `verification/` (Git bỏ qua).
Bộ kiểm thử có route dữ liệu giả (`verify-p5-02.cjs`) chặn worker để route không bị cache bỏ qua.

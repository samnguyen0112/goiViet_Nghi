# Bàn giao Lượt 3/4

- Windows 11, Chrome headless 157.0.8103.79 và Edge headless 157.0.4341.60. Server dự án ở 127.0.0.1:8770. Trình duyệt và các phép truy cập server chạy ngoài sandbox. Scripts dùng Node và Playwright. Python có fontTools 4.55.1.
- Ma trận giao diện có 37 tổ hợp và 1.420 mốc DOM. Zoom 125% đã xác nhận qua Chrome Settings trong hồ sơ tạm. Ca 4K EN được chạy lại trong tiến trình riêng sau khi lần chạy ghép bị đóng hoặc hết thời gian. Ảnh và log có tên theo tổ hợp. [Giao diện](BAO-CAO-C-GIAO-DIEN.md) · [Bằng chứng](../../verification/audit-06/ui).
- Đã kiểm ngoại tuyến ở 1080p và 4K. Poster và nút vào bản đồ còn dùng được, hoạt cảnh bị bỏ qua khi bundle v9 thiếu. SVG dự phòng của ba địa danh trả 404 ở cả hai preview khi chặn landmark-assets.js. [Chức năng](BAO-CAO-D-CHUC-NANG.md).

## Chuyển hạng mục E

- **Khả năng tiếp cận.** Chrome cảnh báo khi mapScene nhận aria-hidden trong lúc nút mở bộ bài còn focus. Escape trả đúng nút ga 3/3 lần. Ngoài ca bộ bài, luồng vào bản đồ nhanh ghi một cảnh báo tương tự với nút bắt đầu trong introScreen. Đối chiếu thứ tự focus và inert ở hai điểm này bằng bàn phím và công nghệ hỗ trợ. [Bộ bài](../../verification/audit-06/r3-focus-p5.json) · [Luồng chính](../../verification/audit-06/r3-flows-p5.json).
- **Kiến trúc và phụ thuộc.** Việc tải bundle trang chủ theo viewport độc lập với chuẩn bị cache ngoại tuyến. Kiểm hợp đồng giữa manifest offline và các tài nguyên nạp động. Đường SVG dự phòng dùng chung đã phát hiện từ ca chặn script. [Ngoại tuyến 4K](../../verification/audit-06/r3-offline-3840-confirm.json) · [Đường SVG dự phòng](../../verification/audit-06/r3-landmark-p5.json).
- **Phụ thuộc ngoài.** Wikimedia API trả 35/35 trang tệp ảnh ga hiện hữu. URL fanpage Facebook trong trang sắp ra mắt trả 200 và tiêu đề Gói Việt từ máy thử khi không đăng nhập. [Kết quả Wikimedia](../../verification/audit-06/r3-commons-credits.json) · [Log fanpage](../../verification/audit-06/r3-fanpage.json).
- **Bảo mật.** Lượt này dùng dữ liệu thử thông thường trong ô ghi nhớ. Xử lý nội dung đầu vào thuộc Lượt 4. JSON nhạc hỏng trong hồ sơ thử đã rơi về âm lượng 65%, vẫn vào được bản đồ. [Log](../../verification/audit-06/r3-listener-cycles.json).


## Trình chiếu và đồ họa

- Khi camera đã đứng yên, không thấy lại mảng xanh chéo ở góc trái 4K trên Intel Arc, SwiftShader hoặc WebGL tắt. Lượt 4 có thể dùng số đếm animateLoop trong báo cáo nếu cần xác nhận mốc ổn định.
- Ở 1080p, tham số renderer=canvas trên SwiftShader chậm hơn rõ so với cờ tắt WebGL. Ba cấu hình có n=3 mỗi nhóm trên preview-5. Log có UNMASKED_RENDERER và trạng thái terrain. [Số đo](../../tools/perf/results/audit-06/r3-fallback-summary.json).

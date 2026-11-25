# Bàn giao Lượt 2/4

## Môi trường và dữ liệu để dùng lại

- Windows 11 Home 10.0.26300, Intel Core Ultra 7 155H, Node v26.13.0, Chrome headless 157.0.8103.79. Máy chủ tĩnh phục vụ preview-5 ở 127.0.0.1:8770. Chrome, server và bộ đếm bộ nhớ GPU của Windows cần chạy ngoài sandbox. Khi cổng đã được chiếm bởi server dự án, dùng lại tiến trình đang phục vụ. Các phép đo lượt này dùng Node/Playwright. Đường dẫn Git Bash nếu lượt sau cần script shell là C:/Program Files/Git/bin/bash.exe.
- Renderer thật là ANGLE Intel Arc qua D3D11, MAX_TEXTURE_SIZE 16.384. SwiftShader trả về ANGLE Vulkan / SwiftShader Device (Subzero). Chế độ WebGL tắt đã đi qua Canvas 2D. Mỗi tổ hợp renderer và độ phân giải có ba phiên, hoàn thành 27/27 luồng vào bản đồ → thao tác camera → đến ga → rút lá. [Ma trận](../../tools/perf/results/audit-06/graphics-matrix-summary.json).
- Các thao tác ở báo cáo dùng tiếng Việt, DPR 1. Mười phiên CPU ×4 dùng Chrome mới và bỏ qua phim mở đầu. Rút bài dùng CPU ×1. Kết quả chỉ áp dụng theo điểm bắt đầu/kết thúc trong báo cáo. [Báo cáo A](BAO-CAO-A-DO-HOA-WEBGL.md) · [Mẫu theo lượt](../../tools/perf/results/audit-06/graphics-bench-summary.json).
- Tệp đầu vào cho lượt kế tiếp là [CSV đã nạp từ Lượt 1](tep-duoc-nap-preview-5.csv) và [bàn giao Lượt 1](BAN-GIAO-LUOT-1.md). Toàn bộ script mới của phép đo nằm trong scratch/audit-06, số đo trong tools/perf/results/audit-06, ảnh và log trong verification/audit-06.

## Việc chuyển Lượt 3–4

1. **Lượt 3 · B-01.** Bật chế độ ngoại tuyến của ứng dụng, chờ hoàn tất, kiểm cache rồi tắt mạng và tải lại đúng preview-5. Kiểm trang chủ ở hai tier khi thiếu bundle v9 2K/4K và ảnh tàu tương ứng. Ghi yêu cầu thất bại, ảnh hiển thị và tác động tới nút vào bản đồ. [Phát hiện gốc](BAO-CAO-B-KIEM-KE-TEP.md).
2. **Lượt 3 · ảnh địa danh dự phòng.** Kiểm nhánh ở preview-5.js:455 trỏ tới map-art/hanoi.svg, hue.svg và saigon.svg không tồn tại. Kích hoạt khi ảnh chính thất bại; ghi hình ảnh thay thế, lỗi tải và tác động tới các mốc bản đồ. [Vị trí trong mã](../../assets/goi-viet/map-surroundings-preview/preview-5.js#L455).
3. **Lượt 3–4 · focus khi mở bộ bài.** Chrome ghi cảnh báo aria-hidden khi focus còn ở tiêu đề ga bên trong mapScene; Lượt 1 từng thấy ở nút mở bộ bài. Kiểm trình tự focus khi mở/đóng bằng bàn phím, đọc màn hình và khôi phục về đúng nút ga. [Log Chrome của Lượt 2](../../verification/audit-06/diag-real-1920-1-console.json).
4. **Lượt 3 · góc ảnh bản đồ ở 4K.** Ảnh SwiftShader và WebGL tắt sau khi chọn Hà Nội có một mảng xanh mép chéo ở góc trên trái. Ảnh Intel cùng bước phủ nền tới sát góc. Camera có thể còn nội suy lúc chụp. Kiểm lại khi camera dừng hẳn trước khi xếp đây là lỗi hiển thị. [SwiftShader](../../verification/audit-06/matrix-swiftshader-3840-1.png) · [WebGL tắt](../../verification/audit-06/matrix-nowebgl-3840-1.png) · [Intel Arc](../../verification/audit-06/matrix-real-3840-1.png).


## Bộ nhớ và phép thử để đối chiếu

- Sau 12 vòng vào/ra, 24 lần chọn và 12 lượt rút, số context sống ở các mốc vẫn là ba. Trong phiên chọn lặp cùng 24 ga, sau vòng làm ấm, ba vòng tiếp theo tăng 0,21 MiB heap sau GC, từ 6.081 lên 6.082 nút, listener giữ ở 275. Cache terrain giữ 32,79 MiB ở ba vòng cuối, bộ nhớ GPU shared giảm từ 1.158,29 xuống 897,25 MiB giữa cuối vòng 1 và 4. Chưa đủ bằng chứng kết luận rò rỉ dài hạn. [Bộ nhớ](../../tools/perf/results/audit-06/graphics-memory-summary.json) · [Hai ảnh chụp heap](../../tools/perf/results/audit-06/steady-heap-diff.json).
- Ép mất rồi phục hồi WebGL terrain và bật tham số renderer=canvas đều qua luồng tới ga/rút lá. Số đo GPU phần cứng theo pass có trong báo cáo A. Các khoảng trống còn lại gồm máy lớp học/máy hai GPU, VRAM vật lý từng tài nguyên và thời gian GPU của toàn bộ compositor/Canvas 2D.

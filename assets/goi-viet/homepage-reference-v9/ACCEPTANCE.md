# Nghiệm thu P1 — Preview 3

Màu được xử lý trên từng lớp nguồn v8, không lồng ảnh demo vào cảnh động. Hai bộ đều có 64 lớp: 48 lớp chỉnh màu, 16 lớp bảo vệ.

## Màu cảnh dựng ở 12 giây sau giải mã

| Chỉ số | Tiêu chí | 2K | 4K |
|---|---|---:|---:|
| Sắc xanh trung bình (độ) | 138–145 | 141.54 | 142.31 |
| Độ rực trung bình | 0,35–0,40 | 0.374 | 0.381 |
| Độ sáng trung bình | 0,536–0,576 | 0.558 | 0.555 |
| Lục lam đậm (%) | ≤ 1 | 0.50 | 0.57 |
| Xanh trong 120–165° (%) | ≥ 68 | 71.43 | 72.18 |
| Xanh dưới 115° (%) | ≤ 17; không tăng so với v8 15,89% | 15.06 | 13.65 |

Sai khác tuyệt đối trung bình so với P1-t12.png theo kênh R/G/B: 1.724 / 1.807 / 1.778 trên 255; mỗi kênh < 2.

## Kiểm tra dữ liệu và hoạt động

- 2k: 64 kênh alpha khớp từng byte; 16 lớp bảo vệ khớp toàn bộ byte; bundle 2,946,005 byte (+3.37% so với v8).
- 4k: 64 kênh alpha khớp từng byte; 16 lớp bảo vệ khớp toàn bộ byte; bundle 10,329,089 byte (-9.22% so với v8).
- Hình học, z-order, đường đi và thời gian chuyển động giữ nguyên.
- Kiểm tra trên trang thật: 0 / 2,5 / 5,5 / 8 / 12 / 20 giây ở 1920×1080; thêm 1366×768, 390×844, 2560×1440.
- Bắt đầu, xem lại, bỏ qua, mở miền ký ức, khóa cuộn khi quay lại, mở bản đồ, giảm chuyển động, lỗi tải bundle và quay về v8 đều đạt.
- Không có lỗi JavaScript. Toàn bộ tệp được theo dõi trước lượt này, ngoài preview-3 HTML, khớp hash gốc.

## Hiệu năng

- v8: ngân sách 60 fps, thời gian vẽ trung vị 3.40 ms; P90 4.10 ms.
- v9: ngân sách 60 fps, thời gian vẽ trung vị 3.20 ms; P90 4.00 ms.

Đo cùng tư thế đã nạp cache, renderer và bộ hạc hiện có. Đây là phép so sánh thời gian vẽ, không phải cam kết tốc độ khung hình màn hình vật lý trên mọi thiết bị.

## Kiểm tra canvas thực tế của trình duyệt

- Sắc xanh trung bình (độ): 141.96.
- Độ rực trung bình: 0.374.
- Độ sáng trung bình: 0.558.
- Lục lam đậm (%): 0.49.
- Xanh trong 120–165° (%): 70.62.
- Xanh dưới 115° (%): 14.61.

Số đo canvas trình duyệt có thể khác nhẹ ảnh dựng kiểm định vì renderer hiện hành giữ bộ hạc/chuyển động đã có. Công thức đo vùng xanh không đổi.

## Phạm vi và mã hóa

- Công thức P1 gốc được giữ nguyên. Bộ mã hóa dùng bước lượng tử hóa RGB12 bảo vệ mốc sắc 115°, sau đó WebP lossless để không bị lệch sắc do lấy mẫu màu 4:2:0. Alpha gốc được chép nguyên. Xem README và công cụ để tái lập.
- Bốn góc tranh khối mời và miền ký ức giữ nguyên theo phần ngoài phạm vi P1 của đặc tả.
- Không cài các demo lá bay, không thay giao diện/chữ/nút, không sửa index hoặc preview cũ.
- Đổi data-home-art về reference-v8 để chọn lại cả bundle và poster v8.

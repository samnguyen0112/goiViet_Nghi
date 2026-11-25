# Giao diện preview-5 · Lượt 3/4

Kiểm **37 tổ hợp** và **1,420 mốc DOM**. Chrome 157.0.8103.79 và Edge 157.0.4341.60 chạy headless. Tất cả mốc đã chọn có đúng lang và theme. Ca 4K EN ban đầu bị đóng hoặc hết thời gian khi chạy cùng tiến trình. Hai ca chạy lại trong Chrome mới hoàn tất. Zoom 125% đo qua thiết lập zoom trang thật của Chrome trong hồ sơ riêng.

| Trình duyệt | Môi trường | Tổ hợp đạt thao tác |
|---|---|---:|
| Chrome | 1024×768, 1280×720, 1366×768, 1920×1080 và 3840×2160 ở DPR 1 | 20/20 |
| Chrome | 1536×864, DPR 1,25 | 4/4 |
| Chrome | Cửa sổ 1920×1080, zoom 125%. Quan sát CSS viewport 1536×864, DPR báo 1,25 | 4/4 |
| Edge | 1366×768 và 1920×1080, DPR 1 | 8/8 |
| Chrome | 768×1024 dọc. Một lượt VI sáng chỉ tìm lỗi chặn | 1/1 |

## C.2 · Màn hình và cách xác minh

Mỗi tổ hợp desktop đi qua 39 mốc. Trình tự gồm cổng, hoạt cảnh, thư mời và nhạc; tổng quan, zoom sâu, bảng ga, nhật ký và cài đặt; Hà Nội, Huế, TP.HCM, Thanh Hóa, Hải Phòng; bộ thẻ, ghi kỷ niệm, PNG bưu thiếp, thư cộng đồng, Hoàng Sa, Trường Sa và ống xăm. Bưu thiếp cộng đồng nằm trong màn sắp ra mắt. Hải trình gia đình và atlas dùng chung modal đảo. Trình đọc bốn ga chạy ở sach=nhap vì catalog hiện đánh dấu draft. Hải Phòng hiển thị đúng nhánh sắp ra mắt và liên kết/QR fanpage.

Mỗi mốc ghi scrollWidth/Height so với client, tọa độ mục tương tác, ba điểm elementFromPoint, ảnh hiển thị tải xong nhưng naturalWidth=0, modal và vùng có thể cuộn, tình trạng document.fonts. Chênh quá 2 CSS px đưa vào danh sách xem lại. Danh sách ga dài, nút trong details chưa mở, cảnh quan, chồng bài xòe và nút bị modal phủ có thể tạo cảnh báo hợp lệ theo thiết kế. Không có ảnh DOM hiện hữu đã tải xong với naturalWidth=0 trong mốc chính, và không thấy modal vượt màn mà thiếu vùng cuộn. Ca dọc qua cổng, bản đồ, ga Hà Nội và bộ bài. [Tập hợp JSON và ảnh](../../verification/audit-06/ui) · [Tổng hợp theo selector](../../verification/audit-06/ui/r3-dom-summary.json).

Thư mục ảnh giữ các mốc then chốt 1024×768 EN tối, hai mốc 4K và ảnh chụp lại những pha cần xác minh. Ảnh hoạt cảnh đầu tiên đến trước khi dữ liệu dựng cảnh sẵn. Ảnh chụp lại sau khi chờ HomeIntro.ready cho thấy cảnh có đủ lớp. Ảnh bộ xòe ban đầu chụp trước khi modal hiện hẳn. Ca xác nhận đợi modal hoàn tất và chụp ở cùng 1024×768. [Hoạt cảnh đã sẵn](../../verification/audit-06/ui/r3-confirm-opening.png) · [Bộ xòe đã mở](../../verification/audit-06/ui/r3-confirm-fan.png).

## Font tiếng Việt

fontTools đọc cả 11 tệp WOFF. Mỗi tệp có đủ 146 ký tự dựng sẵn trong phép thử, gồm ă â đ ê ô ơ ư và toàn bộ thanh ở hai kiểu chữ hoa/thường. Cmap thiếu riêng ba mã dấu kết hợp U+0302, U+0306, U+031B. Chrome vẫn dùng đúng font WOFF tùy chỉnh cho cả chuỗi NFC và NFD đối chứng. Phép đo CDP xác nhận font thực vẽ glyph của chuỗi thử. Không xếp ba mã kết hợp thành lỗi hiển thị. [Cmap](../../verification/audit-06/ui/r3-font-cmap.json) · [Font Chrome đã dùng](../../verification/audit-06/ui/r3-font-browser.json).

## Đối chiếu với card-testing.html

Bản tham chiếu dùng mặt bài đỏ son trơn và viền vàng, preview-5 dùng bìa minh họa có khung và nhãn chủ đề. Cả hai có bốn lá xòe, trình tự gom/xáo/chọn/rút, hai mặt song song và dấu sen khóa phần gắn kết. Kiểm thẻ với chuyển động bình thường để xem các pha, dùng giảm chuyển động cho đường đi giữa ga và modal nhằm ổn định các mốc. Chữ và nút chọn vẫn đọc được sau khi mở lá. [Bộ xòe tham chiếu](../../verification/audit-06/ui/reference-card-testing-fan.png) · [Hai mặt tham chiếu](../../verification/audit-06/ui/reference-card-testing-dual.png) · [Hai mặt preview-5](../../verification/audit-06/ui/r3-confirm-faces.png).

## Phát hiện

### C-01 · Lá được chọn che tiêu đề trong lúc rút

| Trường | Kết quả |
|---|---|
| Mức độ | Thấp |
| Vị trí | conversation-cards-5.css:67–68 |
| Mô tả | Lá được kéo lên trên tiêu đề Hometown Memory Cards • Hà Nội lúc chọn và rút ở viewport thấp. Tiêu đề hiện lại khi đóng pha hoặc chuyển sang hai mặt. |
| Tái hiện | Chrome 1024×768, DPR 1, EN sáng, chuyển động bình thường. Đến Hà Nội, mở bộ bài, bấm rút ngẫu nhiên. Kiểm ở mốc 1.600 và 2.200 ms. |
| Mong đợi / Thực tế | Mong đợi tiêu đề vẫn đọc đủ trong hai pha. Thực tế khung lá giao với vùng chữ 3120 px² ở chọn và 6441 px² ở rút. |
| Bằng chứng | [Khung đo](../../verification/audit-06/ui/r3-visual-confirm.json) · [Chọn](../../verification/audit-06/ui/r3-confirm-picked.png) · [Rút](../../verification/audit-06/ui/r3-confirm-draw.png) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Không xác định. Hiệu ứng đang nằm trong CSS bộ thẻ riêng preview-5. |
| Đề xuất sửa | Giới hạn độ nâng lá theo khoảng trống thực dưới tiêu đề, hoặc dành khoảng đệm trong pha rút. |
| Rủi ro khi sửa | Điều chỉnh sai làm đổi cảm giác lá được nhấc khỏi quạt hoặc cắt bóng. |
| Cách kiểm sau sửa | Chụp lại mốc chọn/rút ở 1024×768 và zoom 125%, giữ hoa văn bìa, độ xòe và dấu sen. |


## Giới hạn

Màu và ảnh kiểm trong phiên headless. Chưa đo FOUT/FOIT từng font trong mạng chậm, thử mọi trạng thái hover/focus của từng điều khiển, hoặc xem trực quan cả 1.420 mốc. Nội dung nháp chưa dịch không tính thành lỗi giao diện phát hành. Lỗi tương tác focus khi mở bộ bài ghi một lần ở D-03.

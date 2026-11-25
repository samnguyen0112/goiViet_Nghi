# Chức năng preview-5 · Lượt 3/4

Windows 11, Chrome headless trên 127.0.0.1:8770. Hồ sơ trình duyệt riêng cho từng phép. Các phép mô phỏng làm thay đổi trạng thái tạm trong trình duyệt. Bản đối chiếu D.7 là map-surroundings-preview-4.html trong cùng cây làm việc.

## D.1–D.6 · Các luồng và kết quả

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| D.1 · Tìm/ga | Huế/hue/HUẾ/HUE đều tìm đúng Huế. Hà Nội/HA NOI cùng cho Hà Nội. Rỗng trả 36 ga ở tab toàn bộ. Chuỗi không khớp trả danh sách trống. Có thể chọn Huế bằng Enter và tái định tâm bằng R. Escape bỏ chọn ở preview-5. Cùng thao tác ở preview-4 giữ Huế. Năm nút chủ đề của preview cũ đã được bỏ khỏi bảng ga preview-5, nên không có thao tác lọc chủ đề kết hợp ở bản hiện tại. | [Luồng 5](../../verification/audit-06/r3-flows-p5.json) · [Luồng 4](../../verification/audit-06/r3-flows-p4.json) · [Escape bản 4](../../verification/audit-06/r3-followups-p4.json) |
| D.1 · Hai chế độ tại ga, bộ bài | Mở bộ bài và sách ở ga Hà Nội. Nhấn lại nút rút ngay trong cùng tác vụ chỉ tiêu thụ một lá ở preview-5. Bộ bài đã kiểm vòng hết bốn lá, xáo và lật bằng bộ kiểm nền Lượt 1. Bốn ga có sách đều là bản nháp. Luồng thử dùng sach=nhap. Lật sang trang kế, đổi EN giữ trang đang đọc. | [Kiểm nền Lượt 1](MOI-TRUONG-VA-KIEM-TRA-NEN.md) · [Thao tác và dữ liệu](../../verification/audit-06/r3-flows-p5.json) |
| D.1 · Kỷ niệm, PNG | Tên địa danh rỗng giữ số mục bằng 0 và trả focus về ô tên. Bản nháp sửa và bỏ được. Đã lưu lời thử ở Huế. Bưu thiếp hiển thị mục đã lưu và xuất PNG 1080×680 có đúng chữ ký PNG. Sửa/xóa từng mục sau khi lưu được ghi ở D-04. | [Luồng](../../verification/audit-06/r3-flows-p5.json) · [PNG](../../verification/audit-06/r3-postcard-p5.png) |
| D.1 · Biển đảo và ống xăm | Mở đúng Hoàng Sa và Trường Sa. Preview-5 mở được thư, báo phase letter. Rút xăm cho kết quả ở cả hai bản sau khi dùng đúng nút của mỗi giao diện. Bộ kiểm Lượt 1 đã đi tiếp các bước Hải trình gia đình như hoàn tất thư, rút lá và xuất album. | [Preview-5](../../verification/audit-06/r3-followups-p5.json) · [Preview-4](../../verification/audit-06/r3-followups-p4.json) · [Kiểm Hải trình](MOI-TRUONG-VA-KIEM-TRA-NEN.md) |
| D.1 · Nhạc và cài đặt | Nạp WAV thử, nút chuyển sang Stop music, chỉnh 65% → 28%, bỏ nhạc trả về No music chosen. Đổi giao diện, thử theme và chuẩn bị ngoại tuyến. | [Điều khiển thực tế](../../verification/audit-06/r3-flows-p5.json) · [Offline](../../verification/audit-06/r3-offline-1920-confirm.json) |
| D.2 · Thao tác trong chuyển động | Rút bài, đổi viewport sang 1024×768, lật theme và ngôn ngữ trong khoảng hoạt ảnh. Lá hoàn tất và khóa rút được nhả. Đã vào/ra bản đồ ba vòng và mở/đóng bộ bài bằng bàn phím ba vòng. Mẫu sau GC ở vòng 0/5/10/15/20 ghi 272/280/276/276/280 listener. Headless ghi document.hidden=false khi đổi sang tab thứ hai, nên chưa xác nhận vòng đời tab ẩn thật. | [Thao tác biên](../../verification/audit-06/r3-flows-p5.json) · [Focus](../../verification/audit-06/r3-focus-p5.json) · [Listener](../../verification/audit-06/r3-listener-cycles.json) |
| D.3 · Reload và localStorage | Sau reload ngôn ngữ EN còn, theme về sáng. Kỷ niệm biến mất ở cả hai bản theo thông báo chỉ giữ trong phiên, PNG là cách ứng dụng cung cấp để giữ. Giả lập SecurityError, QuotaExceededError và khóa ngôn ngữ/sách chứa chuỗi lỗi, vẫn đổi ngôn ngữ và mở bộ bài. Với JSON nhạc hỏng, âm lượng khởi tạo ở mặc định 65%. | [block](../../verification/audit-06/r3-env-block.json) · [full](../../verification/audit-06/r3-env-full.json) · [corrupt](../../verification/audit-06/r3-env-corrupt.json) · [JSON nhạc](../../verification/audit-06/r3-listener-cycles.json) · [Kỷ niệm bản 4](../../verification/audit-06/r3-followups-p4.json) |
| D.4 · Tải suy giảm | Chạy tới ga và bộ bài qua file://, chặn HTTPS, Fast 4G, Slow 4G và constructor Worker ném lỗi. Ngoại tuyến thật, renderer và ảnh lỗi ở các mục riêng. Mất và khôi phục context terrain đã được thử ở Lượt 2. | [file](../../verification/audit-06/r3-env-file.json) · [external](../../verification/audit-06/r3-env-external.json) · [fast4g](../../verification/audit-06/r3-env-fast4g.json) · [slow4g](../../verification/audit-06/r3-env-slow4g.json) · [worker](../../verification/audit-06/r3-env-worker.json) · [Mất WebGL](../../tools/perf/results/audit-06/loss-real-1920-1.json) |
| D.5 · Đủ nội dung và ngôn ngữ | 34 tỉnh thành + 2 quần đảo, 36 ID khác nhau, 144 thẻ có câu hỏi, lựa chọn và hoạt động. Có 40 khóa thô vì có alias. Công cụ i18n --walk --list thoát 0, 263 khóa markup có EN và 242 khóa dùng trong mã có VI/EN. Vòng VI→EN→VI giữ nguyên giao diện tiếng Việt. Một số sách nháp chỉ có VI theo dữ liệu, ghi chú trong C. | [Bộ thẻ](../../verification/audit-06/r3-data-audit.json) · [i18n](../../verification/audit-06/r3-i18n-walk.log) · [Kiểm ảnh ga](MOI-TRUONG-VA-KIEM-TRA-NEN.md) |
| D.5 · Liên kết ngoài | API xác nhận 35/35 trang tệp Wikimedia của ảnh ga còn tồn tại, gồm cả ảnh Tháp Rùa. Natural Earth và trang ảnh Fansipan mở được. URL fanpage trong nhánh sắp ra mắt trả HTTP 200 và tiêu đề Gói Việt khi mở trực tiếp từ máy thử. | [Log API](../../verification/audit-06/r3-commons-credits.json) · [Log fanpage](../../verification/audit-06/r3-fanpage.json) · [Ảnh Fansipan](https://commons.wikimedia.org/wiki/File:Fansipan_summit_pyramid_monument_sunset_sea_of_clouds_Sa_Pa_Vietnam.jpg) · [Natural Earth](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/) |
| D.6 · Log | Các JSON ghi cảnh báo console, pageerror, HTTP ≥400 và request thất bại. Các phiên môi trường hoàn tất mà không có pageerror. Luồng chính ghi cảnh báo aria-hidden. Ca 404 và mất mạng ghi theo URL bên dưới. | [Log luồng chính](../../verification/audit-06/r3-flows-p5.json) · [Bộ bài](../../verification/audit-06/r3-focus-p5.json) |

## (a) · Ngoại tuyến tại 1080p và 4K

Hai hồ sơ sạch cài đủ 629/629 mục. Đọc Cache Storage xác nhận cả bốn tệp B-01 đều vắng mặt. Chuyển hồ sơ offline, ép CDP offline ở tab tải lại, tắt HTTP cache trong tab, kiểm navigator.onLine=false và một yêu cầu ngoài cache thất bại. Trang HTML trả 200 qua Service Worker.

Ảnh chụp xác nhận cổng vẫn có logo và nút bắt đầu. Sau khi bấm, thư mời và phong cảnh có tàu tĩnh nằm trong poster đều hiện ở cả hai độ phân giải.

| Viewport | Yêu cầu lỗi | Trang chủ | Vào bản đồ |
|---|---|---|---|
| 1920×1080 | assets-2k.js → ERR_INTERNET_DISCONNECTED | poster-2k.webp từ cache, nút bắt đầu đưa thẳng tới thư mời. Chưa có yêu cầu train-2k.webp sau khi bundle lỗi. | Nút Miền ký ức và Mở bản đồ dùng được, canvas hiện sau 7.43 s ở phiên xác nhận. [Log](../../verification/audit-06/r3-offline-1920-confirm.json) · [Thư mời](../../verification/audit-06/r3-offline-1920-confirm-invite.png) |
| 3840×2160 | assets-4k.js → ERR_INTERNET_DISCONNECTED | poster-4k.webp từ cache, nút bắt đầu đưa thẳng tới thư mời. Chưa có yêu cầu train-4k.webp sau khi bundle lỗi. | Nút Miền ký ức và Mở bản đồ dùng được, canvas hiện sau 7.53 s ở phiên xác nhận. [Log](../../verification/audit-06/r3-offline-3840-confirm.json) · [Thư mời](../../verification/audit-06/r3-offline-3840-confirm-invite.png) |

## Các phát hiện chức năng


### D-01 · Ngoại tuyến bỏ qua hoạt cảnh trang chủ

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | homepage-layered-scene-3.js, homepage-reference-v9/assets-2k.js và assets-4k.js |
| Mô tả | Cache opt-in báo sẵn sàng nhưng thiếu bundle theo viewport. Trình điều khiển chuyển sang thư mời với ảnh poster, nên bản đồ vẫn mở. |
| Tái hiện | Bật tải ngoại tuyến tới 629/629, mở lại cùng URL ở 1920×1080 hoặc 3840×2160 với mạng tắt. |
| Mong đợi / Thực tế | Mong đợi hoạt cảnh đã được chuẩn bị cho trình chiếu. Thực tế chỉ thấy poster và thư mời, bản đồ hoạt động. |
| Bằng chứng | [1080p](../../verification/audit-06/r3-offline-1920-confirm.json) · [4K](../../verification/audit-06/r3-offline-3840-confirm.json) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Mới ở preview-5 đối với chế độ ngoại tuyến opt-in. Preview-4 chưa có nút dùng chung luồng. |
| Đề xuất sửa | Bổ sung tài nguyên theo tier vào cơ chế chuẩn bị hoặc có trạng thái nói rõ trang đang dùng poster. |
| Rủi ro khi sửa | Tăng dung lượng cache trên máy hạn chế. Đường tĩnh và file:// cần giữ được. |
| Cách kiểm sau sửa | Hồ sơ sạch, bật offline, so CRC/cache và mở lại không mạng ở hai tier. |

### D-02 · Ba biểu tượng địa danh mất khi bundle SVG chính bị chặn

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | preview-5.js:455 |
| Mô tả | Chặn landmark-assets.js trong Chrome. URL dự phòng hanoi.svg, hue.svg và saigon.svg trả 404. Bản đồ và pin ga tiếp tục vẽ. |
| Tái hiện | Route abort blockedbyclient cho landmark-assets.js. Vào bản đồ, kiểm log và ảnh. |
| Mong đợi / Thực tế | Mong đợi ba biểu tượng có ảnh dự phòng. Thực tế mất lớp minh họa ba ga, nền và nhãn ga còn. |
| Bằng chứng | [Log 5](../../verification/audit-06/r3-landmark-p5.json) · [Log 4](../../verification/audit-06/r3-landmark-p4.json) · [Ảnh](../../verification/audit-06/r3-landmark-p5.png) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Có sẵn từ preview-4. Cả hai bản gọi cùng ba đường dẫn 404. |
| Đề xuất sửa | Dùng ảnh thay thế đã đóng gói, hoặc tạo fallback SVG nội tuyến tương ứng. |
| Rủi ro khi sửa | Cần giữ màu, kích thước, hitbox và giấy phép ảnh. |
| Cách kiểm sau sửa | Chặn script lại và đối chiếu ba biểu tượng, 0 yêu cầu 404. |

### D-03 · Focus đi qua nền bị aria-hidden khi mở bộ bài

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | map-surroundings-preview-5.html:7293 và các hàm pushModalFocus/syncBackgroundInertAndRenderState |
| Mô tả | Enter mở bộ bài. Trong 2/3 lần đo tức thời, focus còn ở nút ga khi mapScene đã aria-hidden. Chrome phát cảnh báo. Tab và Shift+Tab vẫn vào modal, Escape trả về đúng nút 3/3. |
| Tái hiện | Dùng Enter tại deck-open-hn, rồi Tab/Shift+Tab và Escape ba vòng ở 1080p. |
| Mong đợi / Thực tế | Mong đợi chuyển focus khỏi nền trước khi ẩn nền. Thực tế có khoảng race khi mở, còn đóng trả focus đúng. |
| Bằng chứng | [Log 5](../../verification/audit-06/r3-focus-p5.json) · [Log 4](../../verification/audit-06/r3-focus-p4.json) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Preview-4 cũng có focus tức thời nằm ở nút mở cả 3/3. Cảnh báo console chỉ tái hiện ở preview-5 trong phép này. |
| Đề xuất sửa | Đưa focus vào modal trước khi cập nhật aria-hidden nền. Đồng bộ focus khi chuyển giữa phiếu ga, sách và bộ bài. |
| Rủi ro khi sửa | Làm sai thứ tự có thể phá bẫy focus và vị trí trả về. |
| Cách kiểm sau sửa | Lặp mở/đóng bằng Enter và Escape 10 vòng, kiểm log và phần tử active mỗi mốc. |

### D-04 · Kỷ niệm đã lưu thiếu thao tác sửa hoặc xóa riêng

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | map-surroundings-preview-5.html:7824,8256–8298 |
| Mô tả | Sau khi đã lưu một lời ghi, danh sách trong bưu thiếp chỉ có checkbox đưa vào PNG. Có nút bắt đầu hành trình mới để xóa cả phiên. |
| Tái hiện | Lưu Lưu bút thử nghiệm cho Huế, đóng bộ bài, mở bưu thiếp và thử sửa/xóa mục. Lặp ở preview-4. |
| Mong đợi / Thực tế | Mong đợi sửa hoặc bỏ một mục đã lưu trong ca D.1. Thực tế chỉ sửa/xóa bản nháp trước khi lưu, hoặc bỏ mục khỏi PNG. |
| Bằng chứng | [Các điều khiển bản 5](../../verification/audit-06/r3-saved-memory-p5.json) · [Bản 4](../../verification/audit-06/r3-saved-memory-p4.json) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Có sẵn từ preview-4. |
| Đề xuất sửa | Thêm sửa/xóa theo ID trong nhật ký. Cập nhật ghim bản đồ và trạng thái chọn PNG khi xóa. |
| Rủi ro khi sửa | Giữ các mục khác cùng địa danh và giữ sự đồng ý đưa vào PNG. |
| Cách kiểm sau sửa | Lưu hai mục cùng địa danh, sửa một, xóa một, xuất PNG và đối chiếu từng mục. |

### D-05 · Theme tự về sáng sau tải lại

| Trường | Kết quả |
|---|---|
| Mức độ | Thấp |
| Vị trí | map-surroundings-preview-5.html:8487 |
| Mô tả | Nút theme đổi giao diện ngay trong trang. Tải lại đưa theme về sáng, còn EN lưu được ở preview-5. |
| Tái hiện | Chọn tối, reload trong cùng hồ sơ. Lặp trên preview-4. |
| Mong đợi / Thực tế | Theo phép thử lưu cài đặt D.3, mong đợi giữ theme. Thực tế bộ chọn hiện chỉ tác động phiên hiện tại. |
| Bằng chứng | [Trước/sau 5](../../verification/audit-06/r3-flows-p5.json) · [Trước/sau 4](../../verification/audit-06/r3-flows-p4.json) |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Có sẵn từ preview-4. |
| Đề xuất sửa | Nếu giữ tùy chọn này qua tải lại, đọc và ghi giá trị hợp lệ sớm cùng ngôn ngữ. |
| Rủi ro khi sửa | Cần giữ ứng xử khi storage không dùng được, tránh chớp theme lúc mở. |
| Cách kiểm sau sửa | Chọn tối, reload file:// và HTTP, kiểm cả storage bị chặn. |

## (d) · Góc trên trái 4K khi camera đã dừng

Chrome 3840×2160, DPR 1, cùng chuỗi vào bản đồ, kéo, xoay và đưa về ga Hà Nội. Sau thao tác camera, bật giảm chuyển động để phần trang trí không xin khung liên tục. Chỉ chụp sau ba khoảng 300 ms liên tiếp mà bộ đếm animateLoop giữ nguyên, sai số camera tới đích dưới 0,02 và cờ yêu cầu khung đã tắt.

| Renderer | Khung cuối | Khoảng liên tiếp không vẽ | Hình ảnh |
|---|---:|---:|---|
| Intel Arc | 151 | 3 | [Ảnh](../../verification/audit-06/r3-corner-intel-3840-1.png) · [Log](../../tools/perf/results/audit-06/r3-corner-intel-3840-1.json) |
| SwiftShader | 75 | 3 | [Ảnh](../../verification/audit-06/r3-corner-swift-3840-1.png) · [Log](../../tools/perf/results/audit-06/r3-corner-swift-3840-1.json) |
| WebGL tắt | 69 | 3 | [Ảnh](../../verification/audit-06/r3-corner-off-3840-1.png) · [Log](../../tools/perf/results/audit-06/r3-corner-off-3840-1.json) |

Cả ba ảnh đều có nền phủ góc trên trái. Mảng xanh mép chéo trong bàn giao Lượt 2 không tái hiện ở khung đã đứng yên. Ba phép chụp lần này chỉ xác nhận trạng thái cuối, còn sự xuất hiện trong lúc dịch camera được lưu ở ảnh Lượt 2. Đã chạy cùng bước đối chiếu trên preview-4, dùng thao tác lấy nét ga tương ứng vì bản 4 chưa có phiếu ga preview-5. Số khoảng liên tiếp không vẽ là 0 ở SwiftShader và 0 khi tắt WebGL. Ảnh nào có dưới ba khoảng chỉ dùng làm tham khảo. [Bản 4 SwiftShader](../../verification/audit-06/r3-corner-swift-3840-1-p4.png) · [Bản 4 WebGL tắt](../../verification/audit-06/r3-corner-off-3840-1-p4.png).

## (e) · Ba đường dự phòng 1080p

Ba tiến trình Chrome mới cho mỗi chế độ, CPU ×1, locale VI, DPR 1 và 1920×1080. Chế độ đầu và URL dùng use-angle=swiftshader cùng enable-unsafe-swiftshader. Chế độ tắt chạy disable-gpu, disable-3d-apis, disable-webgl và disable-webgl2. Lấy context WebGL trả null. Thời gian vào tính từ nút Mở bản đồ đến hết màn che. FPS là nhịp callback rAF trong thao tác kéo/xoay 14 bước trên mainCanvas, cộng 240 ms cuối và bỏ khoảng rAF đầu giáp biên. So sánh các mẫu nhỏ theo trung vị và khoảng nhỏ nhất–lớn nhất.

| Chế độ | n | Vào bản đồ, giây | Kéo, FPS | Xoay, FPS |
|---|---:|---:|---:|---:|
| SwiftShader mặc định | 3 | 28.14 (21.31–31.25) | 18.12 (17.38–19.13) | 7.73 (5.79–7.82) |
| SwiftShader + ?renderer=canvas | 3 | 23.52 (23.20–24.54) | 1.66 (1.50–1.86) | 1.08 (1.07–1.10) |
| Cờ tắt WebGL | 3 | 7.03 (6.82–7.21) | 21.43 (21.39–23.51) | 11.57 (11.33–13.33) |

**?renderer=canvas cách xa mức tắt WebGL.** So với cờ tắt WebGL, URL mất thêm 16.49 giây khi vào và chỉ bằng 8% FPS kéo, 9% FPS xoay. Kiểm trạng thái terrain tại mốc vào xác nhận disabled=true và draws=0 trong nhánh URL. Chrome vẫn có SwiftShader trong nhánh này. Nền, nhãn, pin và phiếu ga còn nhìn thấy trên cả ba ảnh 1080p sau khi camera dừng. Không thấy ảnh lỗi hoặc mép xanh chéo trong ba ảnh đó. [Tổng hợp và 9 mẫu](../../tools/perf/results/audit-06/r3-fallback-summary.json) · [SwiftShader](../../verification/audit-06/r3-fallback-swift-1920-1.png) · [URL Canvas](../../verification/audit-06/r3-fallback-flag-1920-1.png) · [WebGL tắt](../../verification/audit-06/r3-fallback-off-1920-1.png).

| Đối chiếu preview-4, n=1 mỗi chế độ | Vào, giây | Kéo, FPS | Xoay, FPS |
|---|---:|---:|---:|
| SwiftShader mặc định | 17.48 | 18.81 | 7.86 |
| SwiftShader + ?renderer=canvas | 23.71 | 1.47 | 1.08 |
| Cờ tắt WebGL | 6.81 | 19.07 | 9.57 |

### D-06 · Tham số Canvas không tạo được mức phản hồi như khi tắt WebGL

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | webgl-terrain-renderer-3.js và webgl-coverage-3.js, cờ renderer=canvas |
| Mô tả | Ở máy giả lập không có GPU thật, URL chuyển terrain về Canvas nhưng trình duyệt vẫn có backend SwiftShader. Đường này chậm rõ so với cờ tắt WebGL ở cả kéo và xoay. |
| Tái hiện | Chrome 1080p, CPU ×1, chạy SwiftShader mặc định, SwiftShader với URL, và WebGL tắt. Dùng cùng thao tác vào, kéo, xoay, mỗi chế độ ba phiên. |
| Mong đợi / Thực tế | Mong đợi URL là đường dự phòng gần tương đương với tắt WebGL. Thực tế kéo 1.66 so với 21.43 FPS, xoay 1.08 so với 11.57 FPS. |
| Bằng chứng | [Số đo](../../tools/perf/results/audit-06/r3-fallback-summary.json) · [Bản 4 swift](../../tools/perf/results/audit-06/r3-fallback-swift-1920-1-p4.json) · [Bản 4 flag](../../tools/perf/results/audit-06/r3-fallback-flag-1920-1-p4.json) · [Bản 4 off](../../tools/perf/results/audit-06/r3-fallback-off-1920-1-p4.json) |
| Trạng thái | đã đo |
| Nguồn gốc | Có sẵn từ preview-4. Phép đối chiếu một mẫu cho mỗi chế độ cũng thấy URL chậm rõ so với cờ tắt WebGL. |
| Đề xuất sửa | Đo riêng backend Canvas 2D, compositing và WebGL còn sống ngoài terrain trong hai chế độ trước khi chọn đường dự phòng. |
| Rủi ro khi sửa | Thay render có thể làm ảnh mờ hoặc đổi lớp bản đồ. Giữ điều khiển và hệ tọa độ hit-test. |
| Cách kiểm sau sửa | Lặp đúng ma trận 1080p, xem lại sau ổn định ở 4K và xác nhận trên máy dùng trình chiếu. |


## Giới hạn

Chưa xác nhận trạng thái tab ẩn thật vì Chrome headless báo document.hidden=false khi chuyển tab. Các nguồn ngoài danh mục ảnh ga được kiểm theo mẫu cùng URL fanpage. Các phép lỗi lưu trữ dùng ngoại lệ mô phỏng. Phiên không có GPU dùng SwiftShader hoặc cờ trình duyệt trên chính máy đo. Chưa thử máy trình chiếu vật lý.

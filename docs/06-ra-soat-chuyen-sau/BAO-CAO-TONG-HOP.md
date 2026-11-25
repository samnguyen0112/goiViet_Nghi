# Tổng hợp rà soát preview-5 · 4 lượt

## 1. Tóm tắt

**Ưu tiên trước buổi trình chiếu là chạy thử từ đúng máy, ở 1920×1080, rồi mở sẵn bản đồ ở ga đầu.** Rà soát ghi 25 phát hiện, gồm 6 mức cao, 11 trung bình, 2 thấp và 6 ghi chú. Các luồng chính đã kiểm gồm chọn ga, rút bài, sách nháp, ghi kỷ niệm, xuất PNG và mở thư biển đảo. Bộ kiểm nền đạt ở lần chạy cuối. Dữ liệu có 36 điểm đến và 144 thẻ. Ma trận UI đi qua 37 tổ hợp, với một lỗi hình ảnh nhất thời ở tiêu đề khi rút lá ở màn hình thấp. [Kiểm tra nền](MOI-TRUONG-VA-KIEM-TRA-NEN.md) · [Giao diện](BAO-CAO-C-GIAO-DIEN.md) · [Chức năng](BAO-CAO-D-CHUC-NANG.md).

- **Điểm nghẽn bản đồ.** Intel Arc 1080p ở CPU ×4 mất 15,26 giây để vào bản đồ, so với mục tiêu 6 giây (n=10). Trung vị kéo 37,65 FPS và xoay 24,47 FPS. Một trace chỉ ra scheduler nhận tile ở đoạn màn che và bố cục giao diện trên đường bay đến ga. Rút lá có trung vị ba khoảng rAF trên 50 ms, với một lần Layout 63,5 ms ở phiếu ga phía sau. [Đồ họa và trace](BAO-CAO-A-DO-HOA-WEBGL.md).
- **Máy không có WebGL phần cứng.** Chrome 157 ép WARP thành công qua `--use-angle=d3d11-warp`. WARP ×1 đạt 12,30 giây vào, 40,55 FPS kéo và 19,01 FPS xoay ở 1080p. Với hai cờ tắt GPU/WebGL, ở CPU ×4 cả Chrome và Edge vào bản đồ khoảng 36 giây và xoay 2,36–3,81 FPS theo trung vị từng trình duyệt. Cả sáu ca Canvas ×4 chạm ngưỡng chờ prewarm. Đường này vẫn mở ga được để trình chiếu tĩnh. Các phép F dùng trình duyệt có cửa sổ, n=3 mỗi ô. [Đo F và lệnh Windows](BAO-CAO-E-DO-BEN-MA.md#f--máy-lớp-học-không-có-gpu).
- **Ngoại tuyến dùng được với trang chủ tĩnh.** Hai tier v9 thiếu hai gói và hai ảnh tàu trong cache. Ở cả 1080p lẫn 4K, poster và thư mời hiện, nút vào bản đồ vẫn dùng được. Chỉ báo 629/629 có thể hiện sẵn sàng trong trạng thái này. Luồng thường từ server cục bộ không tự request origin ngoài. Dung lượng thân phản hồi ở 1440×900 là 28,34 MiB với luồng thường và 29,52 MiB khi mở sách nháp. [Kiểm kê](BAO-CAO-B-KIEM-KE-TEP.md) · [Ngoại tuyến](BAO-CAO-D-CHUC-NANG.md#a--ngoại-tuyến-tại-1080p-và-4k) · [Dung lượng và origin](BAO-CAO-E-DO-BEN-MA.md).
- **Khả năng tiếp cận và dữ liệu nhập.** Chrome có cảnh báo focus ở nền đang được ẩn khi mở thẻ hoặc bưu thiếp, và có bằng chứng về trình tự tương tự ở intro. Sau khi modal mở hẳn, các vòng Tab lấy mẫu ở trong modal. Các trường nhập đã thử giữ markup trơ dưới dạng văn bản, không tạo phần tử đánh dấu. Quyền sử dụng 120 mảnh ảnh bìa còn cần xác nhận trước khi công bố. [Chức năng bàn phím](BAO-CAO-D-CHUC-NANG.md#d-03--focus-đi-qua-nền-bị-aria-hidden-khi-mở-bộ-bài) · [Độ bền mã](BAO-CAO-E-DO-BEN-MA.md).
- **Bộ nhớ và dọn tệp.** Sau khi cache đã ấm, 72 lần chọn lại các ga làm heap sau GC tăng 0,21 MiB. Ba WebGL context sống trong phiên theo dõi. Kết quả này chưa xác lập rò rỉ dài hạn hoặc VRAM của từng tài nguyên. Kiểm kê tách 51 ứng viên xoá, tổng 16,02 MiB. Danh sách dùng để duyệt sau, độc lập với việc chuẩn bị buổi trình chiếu. [Bộ nhớ](BAO-CAO-A-DO-HOA-WEBGL.md#3-theo-dõi-bộ-nhớ) · [Đề xuất xoá](DE-XUAT-XOA.md).

## 2. Số phát hiện theo hạng mục

| Hạng mục | Nghiêm trọng | Cao | Trung bình | Thấp | Ghi chú | Tổng |
|---|---:|---:|---:|---:|---:|---:|
| A · Đồ họa và WebGL | 0 | 5 | 1 | 0 | 0 | 6 |
| B · Kiểm kê tệp | 0 | 0 | 1 | 0 | 4 | 5 |
| C · Giao diện | 0 | 0 | 0 | 1 | 0 | 1 |
| D · Chức năng | 0 | 1 | 4 | 1 | 0 | 6 |
| E · Độ bền mã | 0 | 0 | 5 | 0 | 2 | 7 |
| **Tổng** | **0** | **6** | **11** | **2** | **6** | **25** |

Mỗi mã tính một lần. B-01, D-01 và E-04 lần lượt ghi phạm vi manifest, biểu hiện lúc chạy và cách xác nhận sẵn sàng. D-03 và E-01 ghi những điểm trong cùng nhóm lỗi focus. F cung cấp số đo bổ sung cho rủi ro cấu hình của A-02 và D-06.

## 3. Xếp hạng phát hiện

Xếp theo ảnh hưởng đến buổi trình chiếu, tần suất gặp trên luồng chính và độ chắc của bằng chứng. Giữ mức độ của các báo cáo chi tiết. A-06 còn ở mức trung bình vì nhánh cấp phát dở được thấy trong mã, chưa tái hiện rò rỉ. D-06 vẫn mức cao vì dự phòng mất phản hồi rõ khi thao tác, dù map mở được. Các ghi chú kỹ thuật trong bảng có loại `lỗi mã` khi việc xử lý thuộc mã hoặc cấu hình của dự án.

| Hạng | Mã | Mức độ | Loại | Phát hiện và bằng chứng chính |
|---:|---|---|---|---|
| 1 | D-06 | Cao | do môi trường | Trên SwiftShader, `?renderer=canvas` chưa cho mức phản hồi tương đương cờ tắt WebGL. Thử có cửa sổ F cho thấy ngay cả shortcut Canvas cũng xoay dưới 4 FPS ở ×4. [D-06](BAO-CAO-D-CHUC-NANG.md#d-06--tham-số-canvas-không-tạo-được-mức-phản-hồi-như-khi-tắt-webgl) · [F](BAO-CAO-E-DO-BEN-MA.md#f--máy-lớp-học-không-có-gpu) |
| 2 | A-01 | Cao | lỗi mã | Nền bản đồ giữ màn che 15,26 giây ở Arc ×4, n=10. Trace có 4,24 giây callback scheduler cộng dồn trong mẫu chẩn đoán. [A-01](BAO-CAO-A-DO-HOA-WEBGL.md#a-01--màn-che-kéo-dài-khi-vào-bản-đồ) |
| 3 | A-02 | Cao | do môi trường | SwiftShader 4K vào 38,97 giây, kéo 3,92 FPS, xoay 1,65 FPS, n=3. [A-02](BAO-CAO-A-DO-HOA-WEBGL.md#a-02--webgl-phần-mềm-không-giữ-được-nhịp-xoay-ở-4k) |
| 4 | A-05 | Cao | lỗi mã | Chốt lá kích Layout 63,5 ms trong một trace. Trung vị là ba khoảng rAF trên 50 ms mỗi lần rút. [A-05](BAO-CAO-A-DO-HOA-WEBGL.md#a-05--chốt-lá-bài-kích-hoạt-layout-của-phiếu-ga-phía-sau) |
| 5 | A-04 | Cao | lỗi mã | Bay và mở phiếu Hà Nội đạt 10,83 FPS ở ×4. Bay riêng Huế đạt 20,49 FPS ở phép tách. Hai callback cùng đọc hình học giao diện trong đường nóng. [A-04](BAO-CAO-A-DO-HOA-WEBGL.md#a-04--chuyển-camera-và-mở-phiếu-ga-tranh-thời-gian-với-bố-cục-giao-diện) |
| 6 | A-03 | Cao | lỗi mã | Dựng hình, đặt nhãn và đo chữ lúc kéo/xoay. Arc ×4 đạt 37,65/24,47 FPS. [A-03](BAO-CAO-A-DO-HOA-WEBGL.md#a-03--kéo-và-xoay-vẫn-tốn-công-trên-luồng-chính) |
| 7 | D-01 | Trung bình | lỗi mã | Offline 1080p và 4K hiển thị poster, bỏ hoạt cảnh v9, vẫn mở bản đồ được. [D-01](BAO-CAO-D-CHUC-NANG.md#d-01--ngoại-tuyến-bỏ-qua-hoạt-cảnh-trang-chủ) |
| 8 | B-01 | Trung bình | lỗi mã | Manifest thiếu hai bundle v9 và hai ảnh tàu theo tier. [B-01](BAO-CAO-B-KIEM-KE-TEP.md#b-01--bốn-tệp-trang-chủ-vắng-mặt-trong-gói-ngoại-tuyến) |
| 9 | E-04 | Trung bình | lỗi mã | Ready đếm khóa cache. Response mới được chấp nhận theo HTTP OK. Nhánh kiểm hash dành cho tái sử dụng cache. [E-04](BAO-CAO-E-DO-BEN-MA.md#e-04--ready-ngoại-tuyến-chưa-đối-chiếu-nội-dung-mới-với-manifest) |
| 10 | E-01 | Trung bình | lỗi mã | Intro và bưu thiếp có thể ẩn phần giữ focus. Trình tự chuyển focus sang dialog cần bảo đảm trước khi ẩn nền. [E-01](BAO-CAO-E-DO-BEN-MA.md#e-01--intro-và-bưu-thiếp-có-thể-ẩn-phần-đang-giữ-focus) |
| 11 | D-03 | Trung bình | lỗi mã | Mở bộ bài có cảnh báo `aria-hidden` ở nền, focus trả về nút ga ở ca Escape đã đo. [D-03](BAO-CAO-D-CHUC-NANG.md#d-03--focus-đi-qua-nền-bị-aria-hidden-khi-mở-bộ-bài) |
| 12 | E-06 | Trung bình | thiếu tính năng | Hồ sơ quyền dùng 120 ảnh bìa còn trạng thái “cần hỏi”. Việc này cần xử lý trước khi công bố. [E-06](BAO-CAO-E-DO-BEN-MA.md#e-06--hồ-sơ-quyền-sử-dụng-ảnh-bìa-chưa-đầy-đủ) |
| 13 | D-02 | Trung bình | lỗi mã | Chặn bundle địa danh làm ba URL SVG dự phòng Hà Nội, Huế và TP.HCM trả 404. [D-02](BAO-CAO-D-CHUC-NANG.md#d-02--ba-biểu-tượng-địa-danh-mất-khi-bundle-svg-chính-bị-chặn) |
| 14 | E-07 | Trung bình | lỗi mã | 28,34–29,52 MiB thân phản hồi ở hồ sơ sạch. Phần lớn byte thuộc trang chủ, lúc vào bản đồ và các ảnh. [E-07](BAO-CAO-E-DO-BEN-MA.md#e-07--luồng-chính-truyền-khoảng-2830-mib-ở-hồ-sơ-sạch) |
| 15 | E-02 | Trung bình | lỗi mã | Queue và scheduler cùng ghi `window.GoiVietRasterTasks`. Việc nạp module raster phụ thuộc thứ tự. [E-02](BAO-CAO-E-DO-BEN-MA.md#e-02--hai-module-cùng-gán-api-raster-theo-thứ-tự-script) |
| 16 | D-04 | Trung bình | thiếu tính năng | Kỷ niệm đã lưu thiếu thao tác sửa hoặc xoá từng mục. [D-04](BAO-CAO-D-CHUC-NANG.md#d-04--kỷ-niệm-đã-lưu-thiếu-thao-tác-sửa-hoặc-xóa-riêng) |
| 17 | A-06 | Trung bình | lỗi mã | Nhánh dựng tài nguyên GPU có thể bỏ qua thu hồi tường minh khi lỗi xảy ra trước khi đăng ký entry. [A-06](BAO-CAO-A-DO-HOA-WEBGL.md#a-06--nhánh-dựng-tài-nguyên-gpu-lỗi-có-thể-bỏ-sót-thu-hồi-tường-minh) |
| 18 | C-01 | Thấp | lỗi mã | Lá trong pha chọn/rút che tiêu đề tại 1024×768. Tiêu đề xuất hiện lại ở pha sau. [C-01](BAO-CAO-C-GIAO-DIEN.md#c-01--lá-được-chọn-che-tiêu-đề-trong-lúc-rút) |
| 19 | D-05 | Thấp | thiếu tính năng | Theme tối về sáng sau tải lại. [D-05](BAO-CAO-D-CHUC-NANG.md#d-05--theme-tự-về-sáng-sau-tải-lại) |
| 20 | E-03 | Ghi chú | lỗi mã | `data-preview-version="3"` và hàm ghi đè tạo phụ thuộc ngầm giữa các module. [E-03](BAO-CAO-E-DO-BEN-MA.md#e-03--cờ-tương-thích-3-và-hàm-vẽ-ghi-đè-là-hợp-đồng-ngầm) |
| 21 | E-05 | Ghi chú | lỗi mã | CSS và JS đảo nạp sớm với tỷ lệ chưa dùng cao trong luồng chính. [E-05](BAO-CAO-E-DO-BEN-MA.md#e-05--css-và-js-của-luồng-đảo-nạp-trong-đường-chính) |
| 22 | B-02 | Ghi chú | lỗi mã | Gói offline kèm ba scheduler đời trước do phạm vi thu gom của bộ dựng. [B-02](BAO-CAO-B-KIEM-KE-TEP.md#b-02--gói-ngoại-tuyến-kèm-các-scheduler-đời-trước) |
| 23 | B-05 | Ghi chú | lỗi mã | 51 ứng viên xoá, trong đó một tệp có liên kết tài liệu. [B-05](BAO-CAO-B-KIEM-KE-TEP.md#b-05--ứng-viên-xoá-và-liên-kết-tài-liệu) |
| 24 | B-03 | Ghi chú | lỗi mã | 26 đường dẫn chung có giá trị `v` khác nhau giữa các trang. [B-03](BAO-CAO-B-KIEM-KE-TEP.md#b-03--cùng-tệp-có-các-giá-trị-v-khác-nhau-giữa-các-trang) |
| 25 | B-04 | Ghi chú | lỗi mã | 13 cặp theo phiên bản có phần mã trùng nhau, không có byte tiết kiệm từ trùng chính xác. [B-04](BAO-CAO-B-KIEM-KE-TEP.md#b-04--nhiều-bản-mã-theo-phiên-bản-có-các-đoạn-trùng-lặp) |

## 4. Mười việc nên làm trước buổi trình chiếu

Ước công gồm thay đổi và kiểm lại luồng bị ảnh hưởng. Nhỏ là thao tác cục bộ hoặc kiểm cấu hình, vừa chạm vài điểm cùng một luồng, lớn cần thử vận hành hoặc render trên nhiều cấu hình.

| Ưu tiên | Việc và tiêu chí kiểm lại | Ước công | Rủi ro khi làm |
|---:|---|---|---|
| 1 | Chốt 1080p và backend trên đúng máy. Chạy từ localhost, xem GPU, mở sẵn ga đầu, thử rút lá và xuất PNG. Nếu cần, thực tập phương án WARP và Canvas. **D-06, A-02, F** | Nhỏ | Thấp. Profile shortcut có cache, ngôn ngữ và nhạc tách riêng. |
| 2 | Rút thời gian chờ màn che. Ưu tiên tile trong viewport, chia công việc nhận raster và giảm nạp cạnh tranh. Kiểm lại n≥10 ở ×4, cả khung hé màn và đường Canvas. **A-01, E-07** | Lớn | Cao. Có thể lộ nền thô hoặc làm chậm lần chọn ga đầu. |
| 3 | Bổ sung hai bundle v9 và hai ảnh tàu theo tier, xác nhận hoạt cảnh và nút vào bản đồ với mạng tắt thật ở 1080p/4K. **B-01, D-01** | Vừa | Vừa. Dung lượng gói tăng, cần theo dõi quota và giữ poster tĩnh khi tải dở. |
| 4 | Hoãn `fitSheet` khi phiếu ga ở sau bộ bài. Đối chiếu thứ tự hiệu ứng với `card-testing.html` và so trace chốt lá. **A-05** | Vừa | Vừa. Phiếu phải khôi phục đúng kích thước, tiến độ và trạng thái khi đóng giữa hiệu ứng. |
| 5 | Đưa focus vào modal trước khi ẩn nền, gỡ trạng thái ẩn trước khi trả focus. Kiểm Enter, Tab, Shift+Tab và Escape ở intro, thẻ, sách, bưu thiếp. **D-03, E-01** | Vừa | Vừa. Có thể lệch điểm trả focus khi luồng ga chuyển trong hoạt ảnh. |
| 6 | Xác nhận ba tài nguyên SVG dự phòng, dùng đường dẫn có thật và đưa vào bộ kiểm. Chặn bundle chính để kiểm lại biểu tượng Hà Nội, Huế, TP.HCM. **D-02** | Nhỏ | Thấp. Kiểm cả hình, cỡ và điểm đặt trên bản đồ. |
| 7 | Gộp đọc hình học header/phiếu và giảm dựng lại nhãn khi camera dịch ít. Đo riêng bay, kéo và xoay ở VI/EN. **A-03, A-04** | Lớn | Cao. Dễ thay thứ tự khoảng trống, mật độ chữ và vùng bấm. |
| 8 | Làm chỉ báo offline phản ánh đúng nội dung có thể chạy và kiểm hash của tải mới theo đợt. Thử gói cũ, tải thiếu và sai nội dung với HTTP 200 trong môi trường thử. **E-04** | Vừa | Vừa. Kiểm hash quá sớm có thể tốn RAM và khiến cài lại chậm. |
| 9 | Hoàn thiện ghi nguồn và quyền dùng ảnh bìa dự kiến xuất hiện khi chia sẻ bản trình chiếu. **E-06** | Vừa | Thấp với mã, phụ thuộc thời gian xác minh từng nguồn. |
| 10 | Giữ tiêu đề nhìn được ở 1024×768 trong pha lá được chọn và kéo lên. Đối chiếu gom–xáo–chọn–rút và dấu sen. **C-01** | Nhỏ | Thấp. Chạm lớp xếp chồng của modal, cần thử cả click và bàn phím. |

## 5. Phạm vi thay đổi đề xuất

- **Sửa nhỏ, ít rủi ro.** Sửa ba URL dự phòng sau khi xác nhận đúng artwork, điều chỉnh lớp tiêu đề khi rút, bổ sung hồ sơ nguồn ảnh và tập dượt cấu hình 1080p. Giữ dữ liệu ga, câu hỏi, hoạt động, kỷ niệm và phong cách thẻ tham chiếu. Kiểm ba điểm trước khi gộp thay đổi gồm ga, rút lá và xuất PNG.
- **Thay đổi lớn, cần thử A/B.** Chia tải prewarm/ingest, giảm chi phí nhãn và layout quanh camera, tách tải tài nguyên sớm, hoặc thay kiến trúc cờ/scheduler. Giữ các đường `file://`, worker lỗi, mất/khôi phục WebGL, Canvas và xuất PNG trong bộ kiểm. Theo quy tắc dự án, mỗi nhánh ít nhất 10 mẫu, độ lệch trung vị ít nhất bằng IQR nền và Mann–Whitney p<0,05. Với gói offline, kiểm nội dung cả hai tier, nâng cấp cache và lưu lượng mạng trước khi đổi manifest. [Quy tắc đo](audit.md#7-công-cụ-có-sẵn) · [Luồng kiểm trước/sau](BAO-CAO-A-DO-HOA-WEBGL.md#7-giới-hạn-và-đối-chiếu-sau-sửa).
- **Không nên làm trước buổi.** Ép SwiftShader hoặc 4K trên máy yếu vì kết quả A-02. Dùng `?renderer=canvas` thay cho việc xác nhận backend F mang rủi ro lặp D-06. Xoá tệp chỉ vì một pass coverage hoặc gộp bản mã gần giống dễ làm mất luồng phụ, đường dẫn ghép động và hợp đồng thứ tự. Để các bản vào cũ và `index.html` ngoài phạm vi thay đổi preview-5. [A-02](BAO-CAO-A-DO-HOA-WEBGL.md#a-02--webgl-phần-mềm-không-giữ-được-nhịp-xoay-ở-4k) · [Coverage](BAO-CAO-E-DO-BEN-MA.md#e3--coverage-và-nhánh-ít-dùng).

## 6. Đề xuất xoá của Lượt 1

| Phạm vi | Tệp | Byte | Thứ tự duyệt |
|---|---:|---:|---|
| Nhóm 5 · Chưa thấy gốc nào đến được | 50 | 16.793.294 | Duyệt trước 21 ảnh trong `image/`, tổng 4.856.153 byte. Chưa thấy tham chiếu trong đồ thị tám trang vào, worker, manifest và công cụ. |
| Nhóm 4 · Chỉ tài liệu nhắc tới | 1 | 3.479 | Duyệt sau. `coming-soon-railway.svg` còn được liên kết từ báo cáo sách. |
| **Tổng ứng viên** | **51** | **16.796.773** | **16,02 MiB** |

Giữ các ứng viên `map-art/landmark-*.svg` trong lúc chọn phương án cho D-02. Những ảnh này có thể được dùng để lấp đường dẫn dự phòng đang lỗi sau khi xác nhận đúng nội dung. Giữ nhóm 3 dùng bởi công cụ và nhóm 6 chưa chắc chắn. Chỉ xem xét xoá sau khi chủ dự án duyệt, có kiểm tra lại tám trang vào và service worker theo mục 10. [Danh sách từng tệp](DE-XUAT-XOA.md) · [Bảng phân nhóm](BAO-CAO-B-KIEM-KE-TEP.md#b1b3-phạm-vi-đồ-thị-và-phân-loại) · [Quy trình duyệt](audit.md#10-sau-rà-soát-quy-trình-xoá-tệp-chỉ-chạy-khi-chủ-dự-án-đã-duyệt).

## 7. Checklist trên máy lớp học

- [ ] **Mở từ ổ đĩa cục bộ bằng server.** Từ thư mục dự án chạy `node tools/perf/server.cjs`. Vào `http://127.0.0.1:8770/map-surroundings-preview-5.html`. Giữ nguyên host, cổng và hồ sơ xuyên suốt lúc cài ngoại tuyến và chạy thử. Chrome và Edge có kho riêng.
- [ ] **Đặt máy chiếu ở 1920×1080 trước.** Kiểm display resolution, zoom trình duyệt 100%, bố cục phiếu ga và chỗ nút rút bài. Dùng 4K sau khi đo trên đúng thiết bị với backend phần cứng chạy ổn định.
- [ ] **Đọc `chrome://gpu` hoặc `edge://gpu`.** Trong *Graphics Feature Status* xem WebGL/WebGL2 và trong *Driver Information* tìm GL Renderer. Intel Arc/D3D11 kèm trạng thái tăng tốc cho biết đường phần cứng trên máy đo. `Microsoft Basic Render Driver` với cờ ANGLE đã thử là WARP. `SwiftShader Device` là đường phần mềm. Xác nhận bằng thao tác kéo/xoay trong app và ghi trạng thái, vì adapter và chính sách máy có thể khác.
- [ ] **Chọn cách mở khi thiếu WebGL.** Thử shortcut WARP của Chrome, so lúc vào và xoay tại 1080p. Dùng shortcut `--disable-gpu --disable-3d-apis` nếu WebGL không dựng được hoặc cấu hình mặc định treo. Chuẩn bị thời gian chờ khoảng 36 giây trong phép ×4, mở sẵn ga đầu và kiểm lại nền trước khi đưa lên máy chiếu. Ảnh kiểm bổ sung trên Canvas ×4 cho thấy nền chi tiết trở lại sau khoảng 18–25 giây kể từ lúc mở phiếu Hà Nội, n=1 mỗi trình duyệt. [Lệnh, hồ sơ và phép đo F](BAO-CAO-E-DO-BEN-MA.md#f--máy-lớp-học-không-có-gpu).
- [ ] **Diễn tập mất mạng.** Bật tải ngoại tuyến trong đúng profile sẽ dùng, chờ bộ đếm hoàn tất, rồi thử tải lại khi ngắt mạng tới origin hoặc dùng *Offline* trong DevTools. Ngắt Wi-Fi vẫn để loopback hoạt động, vì vậy chuẩn bị thêm một phép chặn hoàn toàn mạng với origin để xác nhận worker. Bấm từ cổng tới ga, mở thẻ và xuất PNG. Bản hiện tại có thể đưa thẳng đến thư mời tĩnh dù đã đủ 629/629. Nếu chỉ mất Internet và server loopback còn chạy, phiên thường vẫn lấy tài nguyên nội bộ. [Bằng chứng Lượt 3](BAO-CAO-D-CHUC-NANG.md#a--ngoại-tuyến-tại-1080p-và-4k).
- [ ] **Không trình chiếu bằng cửa sổ ẩn danh hoặc InPrivate.** *(Bổ sung 21/11/2026, sau khi sửa B-01/D-01.)* Gói ngoại tuyến nay khoảng 180 MB. Khi thử bằng chế độ ẩn danh của Playwright, gói đầy đủ làm ảnh ga và dữ liệu địa hình hỏng ngẫu nhiên lúc không có mạng. Hồ sơ lưu trên đĩa đạt 35/35 ảnh. Hãy dùng hồ sơ thường hoặc shortcut có `--user-data-dir` ở mục F.3, và chuẩn bị gói trong đúng hồ sơ đó. Ổ chứa hồ sơ trình duyệt (thường là C:) cần còn trống vài GB.
- [ ] **Tập dượt `file://` nếu thiếu Node hoặc server.** Mở đúng tệp HTML trong cây tài nguyên đầy đủ. Lượt 3 đã vào bản đồ, tới ga và mở bộ bài bằng đường này. Dùng HTTP loopback khi cần hệ thống gói ngoại tuyến và hành vi Service Worker. [Log file](../../verification/audit-06/r3-env-file.json).
- [ ] **Qua một lượt trình chiếu đầy đủ.** Mở cửa sổ sẽ chiếu, thử ga Hà Nội, Huế, một lá bài, một bưu thiếp PNG và thử bàn phím. Kiểm nhạc tùy chọn bằng chính hồ sơ đó. Lưu PNG cần giữ trước khi đóng/tải lại vì kỷ niệm thuộc phiên.

## 8. Phần còn chưa xác nhận

| Phạm vi | Giới hạn và lý do |
|---|---|
| Máy lớp học, màn thật và fallback tự động | Chưa có thiết bị cần trình chiếu, máy hai adapter hoặc máy vật lý thiếu khả năng tăng tốc. WARP được chọn bằng cờ trên máy thử. F đo WARP ở ×1, Canvas ở ×1 và ×4, và mô phỏng CSS viewport 1920×1080 trong cửa sổ. CPU CDP ×4 chỉ mô phỏng phần CPU của trang. |
| Bộ nhớ và GPU | Windows đo dedicated/shared ở cấp tiến trình. Thiếu VRAM riêng từng texture/canvas, phép lâu hơn với các luồng thay đổi và phép ép lỗi cấp phát vật lý tại từng bước A-06. Timer GL chưa bao phủ Canvas 2D, compositor, hạc hay mọi pass. |
| Mất context và nền khi ẩn tab | Đã có phép mất/khôi phục context terrain, chưa tách mất riêng context coverage và hạc. Ca chuyển tab headless vẫn báo `document.hidden=false`. Cửa sổ F giữ foreground theo thiết kế phép đo. |
| Ma trận UI và khả năng tiếp cận | Đọc DOM ở 1.420 mốc và xem ảnh theo cờ/cảnh then chốt. Chưa có trình đọc màn hình, kiểm mọi trạng thái hover/focus, tương phản trên mọi nền ảnh, hoặc FOUT/FOIT từng font dưới mạng chậm. |
| Luồng ít dùng, tài nguyên và an toàn đầu vào | Coverage ghi một đường chạy, có giới hạn với CSS động và worker. Đồ thị tệp có đường dẫn ghép động chưa quan sát ở mọi tình huống. Thử đầu vào bằng markup trơ qua những form xác định và khi dựng lại DOM. Bằng chứng này giới hạn ở các giá trị và trạng thái đã đi qua. Chưa có xác nhận quyền cho từng mảnh ảnh bìa hoặc xác minh các liên kết ngoài ngoài phạm vi mẫu nguồn ảnh ga và fanpage. |
| Chi phí từng thành phần và hiệu quả sửa | Chưa tách chi phí paint riêng từng filter, font và toàn bộ phim mở đầu. Phép inline đo parse/compile V8 tách biệt. Toàn bộ bốn lượt là rà soát, nên chưa có đối chứng thống kê cho các thay đổi được đề xuất. |

Đối chiếu điều kiện và bằng chứng từng lượt trong [môi trường và kiểm tra nền](MOI-TRUONG-VA-KIEM-TRA-NEN.md), [bàn giao 1](BAN-GIAO-LUOT-1.md), [bàn giao 2](BAN-GIAO-LUOT-2.md), [bàn giao 3](BAN-GIAO-LUOT-3.md) và năm báo cáo hạng mục.


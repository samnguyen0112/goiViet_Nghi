# Kế hoạch nâng cấp giao diện Gói Việt

Ngày lập: 11/10/2026. Dự án: `vietnam-heritage-map-2`.

**Trạng thái: đã triển khai GV-00 đến GV-07 và nghiệm thu trong môi trường ghi ở mục 11.** Baseline, diff và evidence mới nằm trong `verification/goi-viet/`. Thông tin khảo sát ở mục 2 là lịch sử, không thay thế kết quả nghiệm thu mới. Khi người dùng yêu cầu triển khai, thực hiện tuần tự các lát cắt bên dưới và tiếp tục đến hết phạm vi được giao; không yêu cầu duyệt lại những việc đã được cho phép.

## 1. Mục tiêu và nguyên tắc

Chuyển website bản đồ văn hóa gia đình sang nhận diện **Gói Việt**, dựa trên bộ ảnh người dùng cung cấp: tranh núi xanh nhiều lớp, mây cách điệu, cánh cò, giấy ngà, chữ có cá tính và đoàn tàu xuyên Việt.

Trang đầu tạo cảm giác đang bước vào phong cảnh. Các màn chơi tiếp nối cùng màu sắc, nét vẽ và chất liệu nhưng vẫn dễ đọc, dễ thao tác. Bưu thiếp là sản phẩm lưu niệm khép lại hành trình.

Luồng sản phẩm cần giữ:

> Lời chào → bản đồ/chọn ga → đọc chuyện → rút thẻ → trò chuyện gia đình → ghi kỷ niệm → bưu thiếp.

### Nguyên tắc bắt buộc

1. **Rà soát lại dự án trước khi code**, kể cả khi đã có báo cáo hoặc từng sửa dự án trước đó. Không dùng số dòng, ảnh chụp hoặc kết quả test cũ làm bằng chứng cho nguồn mới.
2. **Không over-engineering.** Giữ HTML/CSS/JavaScript và cơ chế hiện tại nếu đáp ứng yêu cầu. Mỗi thay đổi phải gắn trực tiếp với một hành vi hoặc tiêu chí nghiệm thu trong plan.
3. Làm từng lát cắt hoàn chỉnh: kiểm tra hiện trạng → xác định contract → sửa nhỏ nhất → kiểm thử → review diff → ghi evidence → tiếp tục.
4. Không đánh đổi khả năng đọc, tìm ga, nhập kỷ niệm hoặc tải bưu thiếp để tăng hiệu ứng.
5. Bảo toàn thay đổi có sẵn. Không reset, clean, ghi đè, commit, push, deploy hoặc dừng dịch vụ của người dùng nếu chưa được cho phép.
6. Không sửa test để hợp thức hóa lỗi. Chỉ cập nhật assertion hình thức khi yêu cầu hình thức đã thay đổi; ghi rõ contract cũ/mới và giữ kiểm tra hành vi.
7. Hạng mục lân cận không chặn phạm vi hiện tại được ghi thành work item, không tự mở rộng thành một dự án mới.
8. Nếu hai lần thử tương tự thất bại, phân tích nguyên nhân và đổi cách kiểm chứng thay vì lặp lại.

## 2. Hiện trạng và độ tin cậy của bằng chứng

### 2.1. Kiểm tra lại khi lập file này

- Thư mục hiện tại không phải Git repository; chưa thấy `AGENTS.md` hoặc `plan.md` có sẵn trong dự án. Vẫn áp dụng hướng dẫn AGENTS.md người dùng đã cung cấp trong cuộc trò chuyện.
- `index.html`: 1.499.209 byte, SHA-256 `401e648e425345cae4ec3ad0ac08dcdf621dc11dbe690cd2432416e560ec6e32`.
- SHA nguồn trùng với bản vừa khảo sát ở lượt trước. Lượt tạo plan không chạy lại browser/test; những số liệu bên dưới được ghi rõ là kết quả lượt khảo sát trước trên cùng SHA.
- CSS, dữ liệu và JavaScript ứng dụng chủ yếu nằm trong `index.html`; chưa có nhu cầu chuyển framework.
- Font đang dùng: Be Vietnam Pro cho nội dung/điều khiển, Playfair Display cho tiêu đề lớn.
- CodeGraph đã báo dự án chưa được index ở lượt khảo sát. Khi triển khai, kiểm tra lại khả năng index; nếu vẫn không có thì dùng tìm kiếm và đọc file, không tự tạo index.

### 2.2. Kết quả lượt khảo sát trước trên cùng nguồn

- 36 điểm đến, 144 câu chuyện và 144 thẻ; ba điểm được gắn cờ nội dung mẫu có nguồn. Đây là số liệu ứng dụng, không phải tuyên bố mọi nội dung đã được xác minh văn hóa.
- Trang đầu/chuyển cảnh dùng HTML/SVG; bản đồ dùng canvas; ảnh bưu thiếp được vẽ bằng canvas riêng.
- Có tài nguyên Three.js cũ trong `assets/`, nhưng trang đang chạy không nạp bundle đó. Không suy luận kiến trúc đang dùng chỉ từ README cũ.
- Có ảnh địa phương từ nguồn ngoài; không coi toàn bộ trải nghiệm là hoạt động ngoại tuyến đầy đủ.
- Kỷ niệm và tiến trình giữ trong RAM của phiên. Đóng/tải lại trang mất phiên. Ghi chú cá nhân mặc định không đưa vào PNG.
- Trình duyệt đã khảo sát trang đầu, hướng dẫn, bản đồ, đọc chuyện, rút thẻ, nhánh chưa biết, lật thẻ, biểu mẫu kỷ niệm, nền tối, giảm chuyển động và mở bưu thiếp.
- Ở 390 × 844, chữ biển ga nằm trong SVG bị thu nhỏ còn khoảng 3,8 px theo tỷ lệ hiển thị; nút bắt đầu ở gần đáy màn đầu. Cần bố cục mobile riêng.
- Trang đầu có chuyển động lặp nhưng không có điều khiển dừng ngay trong màn lời chào; điều khiển giảm chuyển động hiện ở phần tùy chọn của bản đồ.

| Bộ kiểm tra đã chạy ở lượt khảo sát | PASS | FAIL | SKIP | Chưa chạy tới do suite dừng |
| --- | ---: | ---: | ---: | ---: |
| UX, responsive, đọc chuyện, typography, UI polish, postcard layout | 45 | 0 | 0 | 0 |
| Map rail | 9 | 1 | 0 | 3 |
| Motion flow | 2 | 1 | 0 | 2 |
| Tổng | 56 | 2 | 0 | 5 |

Không cộng các trường hợp chưa chạy vào PASS hoặc SKIP. Bộ kiểm tra nguồn/harness không thay thế browser.

### 2.3. Vấn đề cần theo dõi

| ID | Bằng chứng hiện có | Cách xử lý trong lần triển khai |
| --- | --- | --- |
| EXIST-RAIL | `verification/check-map-rail.cjs:99`: đổi quần đảo giữa hải trình không đạt điều kiện bắt đầu từ vị trí thuyền hiện tại | Tái hiện trên browser và nguồn hiện tại. Nếu chặn nghiệm thu tuyến đi biển trong GV-04 thì sửa nguyên nhân trong một bước nhỏ; không viết lại tuyến tàu |
| EXIST-HARNESS | `verification/check-motion-flow.cjs:120`: fixture thiếu `getBestOverviewZoom` | Bổ sung môi trường mô phỏng đúng contract trước khi dùng suite nghiệm thu GV-03; không thay hàm thật bằng no-op để xanh test |
| VERIFY-PNG | Đã khảo sát giao diện/canvas, chưa xác nhận bytes của PNG tải xuống trong lượt khảo sát | Bắt buộc tải và mở file thật tại GV-06 |
| ASSET-FONT | Chưa có font Hồn Rối và giấy phép webfont được xác minh | Giữ font hiện hành làm fallback; không hứa khớp chính xác chữ từ ảnh |
| ASSET-LAYERS | Ảnh tham khảo là JPG phẳng, chưa có bộ núi/mây/chim/logo tách lớp | Chuẩn bị asset trước khi làm chuyển động; không lấy nguyên poster làm toàn bộ giao diện |

Chưa kiểm chứng: screen reader thật, thiết bị vật lý, trình duyệt khác, hiệu năng trên mạng và tính chính xác của toàn bộ 144 nội dung văn hóa.

## 3. Phạm vi và các giới hạn chống over-engineering

### Trong phạm vi

- Nhận diện Gói Việt trên các bề mặt người dùng nhìn thấy: tên trang, logo, lời chào, header, hướng dẫn, thẻ và bưu thiếp.
- Hệ màu sáng/tối, vai trò font, khung/nút, họa tiết và minh họa nhất quán.
- Trang đầu có phong cảnh nhiều lớp; mây nhẹ, cò bay ngang và bay sâu vào cảnh; núi tạo chiều sâu tiết chế.
- Đồng bộ hướng dẫn, chuyển cảnh, bản đồ, thông tin ga, bài đọc, thẻ, rút vé, kỷ niệm và bưu thiếp.
- Responsive, bàn phím, tương phản, giảm chuyển động, trạng thái lỗi/thiếu tài nguyên và hiệu năng liên quan trực tiếp.
- Kiểm tra dữ liệu/contract không bị ảnh hưởng và khả năng rollback từng lát cắt.

### Ngoài phạm vi nếu chưa có yêu cầu mới

- Chuyển sang React/Vue/Next.js, thêm router, state manager, CMS, backend, database hoặc tài khoản.
- Đồng bộ đám mây, lưu phiên lâu dài, multiplayer, AI tạo chuyện, bảng điểm, phần thưởng hoặc chia sẻ công khai.
- Dịch lại toàn bộ nội dung EN/VI; chỉ chuẩn bị bố cục chịu chuỗi dài và giữ chữ giao diện ngoài tranh.
- Viết lại bản đồ/tuyến tàu bằng WebGL, phục hồi bộ Three.js cũ hoặc xây một animation engine.
- Thêm GSAP/Lottie/Thư viện hiệu ứng chỉ để chạy vài lớp mây và chim. Nếu CSS/SVG không đáp ứng một yêu cầu cụ thể, phải nêu giới hạn và đánh giá thay đổi nhỏ nhất trước.
- Vẽ riêng 144 minh họa trong đợt đầu; kiểm chứng lại toàn bộ lịch sử/văn hóa hoặc thay đổi dữ liệu địa lý.
- Tách lại toàn bộ file, làm design-system package, tạo build pipeline mới, thêm CI/hosting/analytics.
- Đổi hàng loạt tên ID, biến, hàm hoặc dữ liệu chỉ vì đổi thương hiệu.

### Quy tắc chọn cách làm

- Tái sử dụng token, state, helper modal/focus và cơ chế render hiện có.
- Có thể thêm asset mới và một helper nhỏ nếu cần; chỉ tách file khi có lợi ích cụ thể và vẫn tương thích cách mở trang hiện tại.
- Sửa đúng CSS/template sở hữu hành vi; hạn chế chồng thêm override hoặc `!important` ở cuối file.
- Không xóa asset cũ chỉ vì chưa dùng; kiểm kê phụ thuộc và rollback trước khi đề xuất dọn.
- Không thêm kiểm tra phản chiếu từng dòng CSS. Tập trung vào kết quả người dùng thấy và contract có rủi ro.

## 4. Định hướng hình ảnh và tài nguyên

### 4.1. Vai trò của ảnh tham khảo

| Ảnh | Vai trò |
| --- | --- |
| Giao diện trang đầu có Gói Việt và tàu | Chuẩn bố cục và mức độ cảm xúc của trang đầu |
| Tranh núi xanh, mây trắng | Chuẩn chiều sâu, đường nét, màu cảnh |
| Logo Gói Việt | Chuẩn nhận diện; cần phiên bản phù hợp nhiều kích thước |
| Chiếc thuyền ngoài xa | Tham khảo chất giấy, nét mềm và khoảng trống |
| Vũ trụ Cò Bay | Tham khảo cảm giác bộ sưu tập bản đồ–thẻ–sách–lưu niệm |
| Sơn–Thủy | Tham khảo cách nối cảnh; không trộn nguyên chất 3D vào mọi thành phần |
| Hồn Rối Display | Hướng thử chữ tiêu đề; không dùng cho toàn bộ nội dung |

Các ảnh người dùng gửi hiện ở thư mục Temp. Khi triển khai cần xác nhận còn truy cập được và chuẩn bị bản làm việc có nguồn gốc rõ; không dùng đường dẫn Temp làm đường dẫn runtime hoặc bằng chứng lưu trữ bền vững.

### 4.2. Bộ nhận diện đề xuất

| Vai trò | Màu khởi điểm | Cách dùng |
| --- | --- | --- |
| Giấy ngà | `#F7F0DE` | Nền chính |
| Mặt giấy | `#FFFCF4` | Vùng đọc và biểu mẫu |
| Xanh rừng | `#234D40` | Nhận diện phụ, núi gần, chữ nhấn |
| Xanh ngọc | `#83B8A1` | Núi xa và trang trí |
| Đỏ son | `#9E2835` | Logo, hành động chính |
| Vàng đất | `#B49355` | Chi tiết/viền; không mặc định dùng làm chữ nhỏ |
| Mực tối | `#293B32` | Nội dung chính |

Các mã màu là đề xuất, chưa được nghiệm thu tương phản. Điều chỉnh khi đo trên nền thực, gồm hover, selected, disabled, focus, sáng/tối. Không dùng màu đơn độc để truyền đạt trạng thái.

Typography:

- Logo dùng lettering/vector riêng; có tên truy cập được và fallback bằng chữ thật.
- Hồn Rối chỉ là ứng viên cho tiêu đề ngắn sau khi có file, quyền dùng và kiểm tra glyph/shaping. Không suy ra font chính xác của logo từ ảnh.
- Giữ Be Vietnam Pro cho nội dung, điều khiển, đáp án, tên dài và bản đồ.
- Playfair Display hiện có là fallback. Không tải đồng thời nhiều font trang trí nếu không có vai trò riêng.
- Kiểm tra dấu Việt, chuỗi NFC/NFD, xuống dòng, chữ dài, font tải chậm và canvas xuất PNG.

Nền tối dùng cảnh đêm xanh rừng, chữ ngà và tương phản riêng; không đảo màu cả ảnh. Texture giấy đứng yên và đủ nhẹ để không gây nhiễu vùng đọc.

### 4.3. Asset tối thiểu

- Logo ngang, dọc, thu nhỏ và đơn sắc, nền trong suốt.
- Khoảng ba lớp núi: xa, giữa, gần; có vùng thoáng cho logo/chữ/nút.
- Hai hoặc ba biến thể mây có thể tái sử dụng.
- Một bộ chim thống nhất hình dáng; tách cánh nếu cần vỗ cánh. Thử cách bay trước khi vẽ thêm biến thể.
- Tàu và cầu cùng phong cách; ưu tiên chỉnh bộ SVG hiện tại nếu chất lượng đáp ứng.
- Một texture giấy nhẹ và bộ họa tiết góc dùng lại trên vé/thẻ/bưu thiếp.
- Bốn nhóm minh họa chủ đề; ưu tiên thêm tranh riêng cho ba ga mẫu sau khi mẫu tổng thể ổn.

Ghi nguồn, quyền sử dụng, vai trò, kích thước và dung lượng trong một bảng asset ngắn. Không coi poster tham khảo là asset được phép tái phân phối mặc định. Không dùng một núi lớn cho tất cả nội dung địa phương; minh họa riêng phải phù hợp chủ đề.

## 5. Contract thiết kế và chuyển động

### 5.1. Trang đầu

Desktop: điều khiển phụ gọn → logo trong vùng trời thoáng → giới thiệu ngắn → tàu/cầu và ba miền → lời mời cùng hai hành động chính/phụ. Núi hai bên tạo khung, không lấn vùng đọc.

Mobile: dựng lại bố cục dọc, cắt cảnh riêng, giảm lớp, rút ngắn mở đầu. Tàu đủ lớn để nhận ra; biển ga chuyển thành nhãn HTML đọc được, không thu nhỏ cả poster.

- “Bắt đầu khám phá” luôn là hành động chính; “Xem cách chơi” là hành động phụ.
- Ở 390 × 844, cố gắng thấy trọn nút bắt đầu ở cỡ chữ mặc định. Khi màn thấp hoặc phóng chữ, cho cuộn tự nhiên, không ép chiều cao cứng.
- Ba biển ga mặc định là chỉ dẫn hành trình. Nếu cần bấm để chọn ga xuất phát, tách thành yêu cầu hành vi rõ; không tạo nút giả.
- Chữ và nút thật nằm trên HTML; tranh là trang trí, không giành focus và không chặn pointer.
- Nội dung/thao tác không chờ animation chạy xong hoặc chờ tải đủ tranh mới dùng được.

### 5.2. Thông số để thử nghiệm

| Thành phần | Hành vi khởi điểm | Reduced motion/mobile |
| --- | --- | --- |
| Núi xa | Hiện nhẹ một lần, sau đó đứng yên | Hiện ngay |
| Núi gần | Parallax theo con trỏ khoảng 4–10 px trên desktop nếu đo thấy mượt | Tắt parallax trên cảm ứng và reduced motion |
| Mây | Trôi chậm, chu kỳ khoảng 40–70 giây, tránh vùng chữ | Mobile ít lớp hơn; reduced motion đứng yên |
| Cò | Một hoặc hai con, mỗi lượt khoảng 10–16 giây, nghỉ khoảng 15–30 giây | Giảm số lượng; reduced motion dùng bố cục tĩnh |
| Cò bay sâu | Đường cong đi từ rìa vào cảnh, nhỏ dần và đi sau lớp núi/mây | Không phóng sát mặt hoặc đi qua CTA |
| Tàu | Ở sân ga với khói nhẹ; khởi hành khi người dùng bắt đầu | Vào bản đồ trực tiếp khi reduced motion |
| Lá/cánh hoa | Chỉ thêm sau khi núi–mây–cò đạt nghiệm thu và cảnh còn thoáng | Không mặc định thêm trên mobile |
| Logo/chữ/nút | Ổn định sau xuất hiện | Không hiệu ứng lặp |

Các khoảng thời gian trên không phải mục tiêu bắt buộc; tinh chỉnh dựa trên độ dễ đọc và thử thiết bị.

### 5.3. Vòng đời và khả năng truy cập

- Có “Tắt hiệu ứng” ngay trang đầu và đồng bộ với điều khiển giảm chuyển động chung; tránh hai cờ điều khiển mâu thuẫn.
- Tôn trọng `prefers-reduced-motion`; nếu cho phép ghi đè thủ công, quy định rõ thứ tự ưu tiên, không âm thầm bật lại khi đổi màn.
- Dừng hiệu ứng khi trang đầu ẩn hoặc tab không hiển thị. Khi quay lại không nhân đôi listener, timer hoặc animation.
- Chuyển cảnh có bỏ qua/Escape; hoàn tất hoặc bỏ qua đều đi đến đúng điểm một lần và trả focus hợp lý.
- Không dùng âm thanh tự phát để bù cho cảnh; không thêm nhạc nền. Tái sử dụng điều khiển âm thanh hiện có.
- Ưu tiên `transform`/`opacity`, không cập nhật layout mỗi frame; không gắn `will-change` cho toàn trang.
- Bản tĩnh phải đẹp và đầy đủ chức năng. Asset lỗi hoặc máy yếu không được chặn vào bản đồ.

## 6. Kế hoạch thực hiện tuần tự

### GV-00 — Rà soát trước code và thiết lập baseline

**Phụ thuộc:** người dùng đã yêu cầu bắt đầu triển khai.

1. Xác nhận đúng cwd, đọc AGENTS.md áp dụng và quyền đã cấp trong phiên.
2. Kiểm tra Git/working tree. Nếu vẫn không có Git, không tự init; chụp bản trước thay đổi của các file sẽ sửa, ghi hash và chuẩn bị diff có thể đảo.
3. Kiểm tra CodeGraph có index hay không; dùng tìm kiếm thông thường nếu không có.
4. Đọc lại source ở các điểm sẽ sửa, asset/font đang nạp, template tạo động, breakpoint và event handler liên quan. Không dựa hoàn toàn vào comment/README.
5. Mở ứng dụng trên trình duyệt, ưu tiên HTTP khi kiểm tra cách tải tài nguyên/hiệu năng. Nếu cần server tạm, chỉ bind loopback, dùng cổng trống và dừng đúng server do mình tạo.
6. Chạy baseline phù hợp trong `verification/`; kiểm tra script có ghi file hoặc chạy dịch vụ trước khi thực thi. Không dùng cờ tạo fixture không cần thiết.
7. Tái hiện/phân loại EXIST-RAIL và EXIST-HARNESS. Chụp màn quan trọng và ghi rõ giới hạn browser.
8. Kiểm kê DATA, ALL_DECKS_MAP, ID điều khiển, handler, font và luồng chơi phải bảo toàn.

**Nghiệm thu:** có baseline của nguồn hiện tại, danh sách thay đổi có sẵn, lỗi trước sửa và cách rollback. Mọi thiếu thông tin chỉ chặn phần phụ thuộc; tiếp tục phần độc lập đã được phép.

### GV-01 — Chốt bộ nhận diện và tài nguyên tối thiểu

**Phụ thuộc:** GV-00.

1. Chốt Gói Việt là tên hiển thị; danh sách nơi cần cập nhật gồm title trang, logo/lời chào, header, nhãn hỗ trợ truy cập và bưu thiếp.
2. Làm mẫu trang đầu desktop/mobile và một mẫu bài đọc hoặc thẻ để kiểm tra tính nhất quán ngoài trang đầu.
3. Thử bảng màu sáng/tối và font với tên ga/câu hỏi dài; xác minh asset/font cần dùng.
4. Hoàn thiện bộ asset tối thiểu ở mục 4.3, ưu tiên tài nguyên có thể dùng lại.
5. Ghi quyết định ngắn: nguồn logo, font được chọn/fallback, cách phân lớp và các lựa chọn còn mở. Nếu phải chờ người dùng chọn giữa những hướng khác biệt lớn, đưa mẫu cụ thể; không hỏi lại lựa chọn đã có.

**Nghiệm thu:** có mẫu review được ở cả hai kích thước; đủ asset cho trang đầu; chữ Việt đúng; các nguồn/font chưa xác minh được ghi rõ, không thay bằng tài nguyên không rõ quyền.

### GV-02 — Trang đầu Gói Việt từ tĩnh đến có chuyển động

**Phụ thuộc:** GV-01.

1. Dựng bố cục tĩnh trước; giữ điểm nối `introScreen`, `introWelcomeStage`, `introGuideStage` và các hành động đang hoạt động.
2. Đưa logo/chữ thật lên vùng thoáng; thay panorama đóng khung bằng cảnh liên tục phù hợp desktop/mobile.
3. Làm điều khiển hiệu ứng và fallback tĩnh trước khi thêm animation.
4. Thêm lần lượt mây → cò → chiều sâu núi; kiểm tra sau từng nhóm. Chỉ thêm lá nếu có lý do thị giác rõ.
5. Đồng bộ sáng/tối, reduced motion và vòng đời đóng/mở intro.
6. Kiểm tra tải chậm, mất một lớp ảnh, logo lỗi, font fallback và quay lại trang đầu nhiều lần.

**Nghiệm thu:** logo/CTA không bị che; không tràn ngang; có thể dùng ngay; mobile không phải desktop thu nhỏ; tắt hiệu ứng dừng chuyển động trang trí; cảnh ẩn không tiếp tục chạy.

### GV-03 — Hướng dẫn, quầy vé và khởi hành

**Phụ thuộc:** GV-02; sửa EXIST-HARNESS đúng contract trước khi dựa vào suite này.

1. Đồng bộ ba bước hướng dẫn, thẻ mẫu và chọn người theo bộ nhận diện.
2. Tái sử dụng cùng artwork tàu cho trang đầu và chuyển cảnh; giữ cơ chế clone/remap ID SVG khi phù hợp.
3. Giữ bắt đầu nhanh và hướng dẫn là hai nhánh dùng được; không ép người dùng xem hết phần giới thiệu.
4. Bảo toàn callback chạy đúng một lần, khóa thao tác lặp, skip/Escape, inert và focus-return.
5. Kiểm tra chuyển cảnh khi resize, quay lại lời chào, bấm nhanh, tắt chuyển động giữa chừng và dùng bàn phím.

**Nghiệm thu:** không màn trống, không kẹt overlay, không phát nhiều chuyển cảnh cùng lúc; đúng số người/lượt khi vào bản đồ; reduced motion vào trực tiếp.

### GV-04 — Bản đồ, chọn ga, bảng thông tin và rút vé

**Phụ thuộc:** GV-03.

1. Đồng bộ màu nền bản đồ, chữ/viền canvas, bảng ga, header, điều khiển, trạng thái chọn và các dấu hành trình.
2. Giữ hình học, ID địa phương và logic chọn/tìm/lọc. Không vẽ lại địa lý theo tranh trang trí.
3. Đồng bộ template `renderDemoPlaceList`: thứ tự thông tin, trường hợp có/không có ảnh, tên dài và một CTA rõ.
4. Đồng bộ vé ngẫu nhiên/chú giải bằng cùng bộ họa tiết, không thêm animation bắt buộc xem.
5. Kiểm tra tìm không dấu, không kết quả, chuyển phạm vi 3 ga/36 ga, lọc chủ đề, định vị, mobile xem bản đồ/danh sách.
6. Kiểm tra chọn ga mới khi tàu đang chạy, Hoàng Sa/Trường Sa và trở lại đất liền. Nếu EXIST-RAIL chặn nghiệm thu, sửa trong bước riêng có test trước/sau.

**Nghiệm thu:** ga chọn khớp panel/tuyến đi; không mất lựa chọn hoặc tiến trình; lớp trang trí không cản thao tác; đường biển và đường tàu vẫn được phân biệt đúng.

### GV-05 — Đọc chuyện, hai mặt thẻ và kỷ niệm

**Phụ thuộc:** GV-04.

1. Đổi chất liệu bài đọc và minh họa theo chủ đề; giữ cột đọc, nguồn, chú thích và xử lý ảnh lỗi.
2. Đồng bộ bộ bài úp, mặt hỏi, đáp án, giải thích và mặt chia sẻ; để họa tiết ngoài vùng văn bản chính.
3. Đồng bộ font/ngữ nghĩa trạng thái, không đổi luật đúng/sai/chưa biết, tự nguyện, bỏ qua và hoàn thành lượt.
4. Giữ hẹn giờ tùy chọn và biểu mẫu kỷ niệm dễ tìm; không đưa hiệu ứng bay vào khi đang đọc/nhập.
5. Kiểm tra hết bài/rút lại, trả lời dài, hỗ trợ người thân, đổi hoạt động, lật qua lại giữ nháp, lưu kỷ niệm và bấm lặp.
6. Kiểm tra tên địa danh không khớp, thiếu tên, ghi chú trống/dài, ký tự đặc biệt; không đưa dữ liệu người dùng vào HTML chưa escape.

**Nghiệm thu:** chạy trọn một lượt đến người kế tiếp; không mất nháp, ghi đè kỷ niệm hoặc tạo bản ghi ngoài ý muốn; giữ nhãn nội dung demo/nguồn và cảnh báo dữ liệu chỉ giữ trong phiên.

### GV-06 — Bưu thiếp Gói Việt và PNG thật

**Phụ thuộc:** GV-05.

1. Thiết kế bưu thiếp với logo, dấu ga, họa tiết và tranh nhỏ cùng nhận diện; giữ nội dung được ưu tiên hơn khung trang trí.
2. Cập nhật cả DOM xem trước và `renderPostcardCanvasPreview`, vai trò `canvasFont`, phần chờ font/asset.
3. Dùng asset cùng nguồn hoặc cách nạp phù hợp để canvas vẫn xuất được ảnh; không thêm ảnh ngoài làm canvas mất quyền xuất.
4. Giữ `includeInPostcard` mặc định false; xuất đúng những ghi chú người dùng chọn.
5. Kiểm tra phiên trống, chỉ đọc chuyện, nhiều dấu ga, nhiều ghi chú, tên dài, emoji và dấu Việt.
6. Tải PNG thật, xác nhận file tồn tại, mở file và đối chiếu với xem trước. Thông báo “đã tải” của ứng dụng chưa đủ làm bằng chứng.
7. Kiểm tra asset/font lỗi và lỗi xuất ảnh: có phản hồi rõ, thử lại được, không mất phiên.

**Nghiệm thu:** ảnh đúng nhận diện, không tràn cột, đúng lựa chọn riêng tư; có bằng chứng từ file tải thật. Nếu giới hạn ảnh chỉ chứa một số mục, hiển thị giới hạn rõ thay vì khiến người dùng tưởng đã lưu toàn bộ.

### GV-07 — Nghiệm thu xuyên suốt và bàn giao

**Phụ thuộc:** GV-02 đến GV-06 hoàn thành; mỗi lát cắt đã được kiểm thử trước đó.

1. Chạy lại bộ kiểm tra nguồn phù hợp và hành trình chính trên browser từ nguồn cuối.
2. Đo responsive, focus, tương phản, reduced motion và tải tài nguyên theo ma trận dưới đây.
3. Đo hiệu năng qua HTTP trên môi trường được ghi rõ; không dùng thời gian mở `file://` để kết luận tốc độ mạng.
4. Review diff toàn phạm vi, đối chiếu dữ liệu/ID/contract và sự nhất quán giữa trang đầu–map–thẻ–PNG.
5. Ghi báo cáo ngắn: Implemented, Verified, Unverified, Blocked; PASS/FAIL/SKIP và số case chưa chạy.
6. Dọn fixture trong RAM, tab/server do mình tạo, script tạm không cần giữ; giữ asset/license, diff và evidence cần review.
7. Không tự commit/push/deploy. Nếu cần tiếp tục vì blocker, lưu checkpoint có file, hash, kết quả và bước tiếp theo chính xác.

**Nghiệm thu:** không còn lỗi chặn hành trình trong phạm vi; rủi ro/giới hạn còn lại được ghi rõ; rollback khả dụng và không ảnh hưởng công việc khác.

## 7. Các điểm mã cần đọc lại trước khi sửa

Số dòng sẽ thay đổi trong triển khai; tìm bằng symbol/ID, không sửa theo số dòng cố định trong báo cáo cũ.

| Vùng | Điểm cần đọc | Contract phải giữ |
| --- | --- | --- |
| Token/font | `:root`, `[data-theme="dark"]`, `@font-face`, `UI_FONT_FAMILIES`, `UI_FONT_FACES` | Vai trò font DOM/canvas, fallback, tiếng Việt |
| Lời chào | `introScreen`, `introWelcomeStage`, `introGuideStage`, `homeTrainPanoramaCard` | Hai nhánh bắt đầu/hướng dẫn, trạng thái đóng/mở |
| Chuyển cảnh | `playTrainTransition`, `skipTrainTransition`, `prepareTransitionTrainArtwork`, `closeIntroModal` | Một lần hoàn tất, hủy timer, remap SVG ID, focus |
| Modal | `getTopOpenModalElement`, `syncBackgroundInertAndRenderState`, push/pop modal focus | Không thao tác xuyên lớp, Tab/Escape, trả focus |
| Ga và tìm kiếm | `renderDemoPlaceList`, `selectDemoPlace`, `setPlaceScope`, `setTopicFilter`, `onSearchProvinceInput` | ID ổn định, lọc/tìm/ARIA thống nhất |
| Bản đồ | `renderMainScene`, `requestMapRender`, `animateLoop`, rail/sea run | Hình học và hit-test, dừng render khi không cần |
| Chuyện/thẻ | `openStoryModal`, `openDeckFromStory`, `drawOneCard`, `revealCardAnswer`, flip helpers | Đúng nội dung, điều hướng và trạng thái lượt |
| Kỷ niệm | draft helpers, `recordMemoryPlaceFromCard`, `completeCardTurn` | Giữ nháp, chống ghi lặp, riêng tư |
| Bưu thiếp | `ensureUIFontsReady`, `renderPostcardCanvasPreview`, `downloadPostcardImage` | Chờ font/asset, opt-in, PNG thật |
| Reset | `resetEntireSession`, `performSessionReset` | Hủy không mất dữ liệu; xác nhận mới xóa phiên |

## 8. Ma trận kiểm chứng và Definition of Done

### Thiết bị và trạng thái

- Rộng 320, 390, 768, 1024, 1440 px; màn ngang thấp như 844 × 390.
- Sáng/tối; chuyển động thường/giảm; chuột/cảm ứng/bàn phím.
- Tăng chữ/zoom 200%; không cắt nội dung hoặc mất thao tác. Với bản đồ, giữ đường chọn ga bằng danh sách thay thế thao tác chính xác trên canvas.
- Kiểm tra Chrome/Edge đang có; nếu chưa có Safari/thiết bị vật lý thì ghi Unverified, không giả định tương đương.
- Screen reader ít nhất với trang đầu, điều khiển hiệu ứng, một modal đọc chuyện, đáp án và thông báo kỷ niệm nếu môi trường hỗ trợ.

Không bắt buộc chạy tích Descartes của mọi tổ hợp. Chạy đầy đủ các màn ở 390/1440, kiểm tra biên 320/ngang thấp, rồi bổ sung theo thay đổi và rủi ro.

### Kịch bản bắt buộc

1. Mở trang → bắt đầu ngay → chọn ga → đọc chuyện → rút thẻ → trả lời/giải thích → mặt chia sẻ → hoàn thành lượt.
2. Xem hướng dẫn → chọn 2 hoặc 6 người → lật thẻ mẫu bằng Enter/Space → khởi hành.
3. Mở/đóng trang đầu nhiều lần; bắt đầu/skip liên tiếp; đổi kích thước khi chuyển cảnh; bật reduced motion giữa chừng.
4. Chọn ga khi tàu đang chạy; đổi quần đảo khi thuyền đang chạy; quay về đất liền.
5. Tìm không kết quả, nơi không có ảnh, ảnh tải lỗi, tên dài, hết bài và phiên trống.
6. Nhập kỷ niệm giả → lật hai mặt → xác nhận nháp còn → lưu → bưu thiếp không chọn/chọn ghi chú → PNG thật.
7. Hủy reset giữ nguyên phiên; xác nhận reset dọn đúng phiên và trạng thái UI.
8. Tắt hiệu ứng nhưng vẫn đi hết hành trình; rời tab/quay lại không nhân đôi chuyển động.

### Chuẩn hoàn thành

- Trang đầu đáp ứng mood ảnh tham khảo nhưng chữ/CTA luôn rõ và thao tác được.
- Chữ thường đạt tương phản 4,5:1; chữ lớn 3:1; kiểm tra viền/focus và trạng thái cần nhận biết. Vùng bấm chủ đạo ưu tiên ít nhất 44 × 44 CSS px.
- Không tràn ngang, không chồng header/dock/modal, không mất nội dung khi tăng chữ.
- LCP ≤ 2,5 giây, INP ≤ 200 ms, CLS ≤ 0,1 là mục tiêu hiệu năng. Ghi môi trường và phân biệt số đo lab với dữ liệu người dùng thực; không tuyên bố đạt toàn bộ từ một lần đo.
- Trang mới không bắt buộc đợi tải animation để vào ứng dụng; nạp asset đúng kích thước, không nhúng thêm hàng loạt ảnh base64 lớn vào HTML.
- Không phát sinh vòng render nền chạy liên tục khi cảnh đã đóng; không nhân đôi timer/listener sau nhiều lần mở.
- Giữ dữ liệu văn hóa, ID và luồng chơi ngoài thay đổi được giao; mọi thay đổi hành vi phải có lý do và evidence riêng.
- PNG tải thật đúng font, bố cục và lựa chọn riêng tư.

Nguồn hướng dẫn: [WCAG Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Animation performance](https://web.dev/articles/animations-and-performance), [Core Web Vitals](https://web.dev/articles/vitals). Kiểm tra lại tài liệu nếu tiêu chí/phương pháp đo thay đổi tại thời điểm triển khai.

## 9. Evidence, rollback và bàn giao

- Mỗi lát cắt lưu một diff và bản ghi kiểm thử gọn, kèm hash nguồn, môi trường, phạm vi và giới hạn. Ưu tiên thư mục `verification/` hiện có; không tạo hệ thống báo cáo mới.
- Giữ bản trước thay đổi cho file đang sửa khi không có Git; thử khả năng đảo diff bằng kiểm tra không ghi trước khi coi rollback sẵn sàng.
- Rollback chỉ hoàn tác phần mình thực hiện. Nếu có thay đổi mới của người dùng, đọc lại và đối chiếu; không chép đè toàn bộ bản backup cũ.
- Asset mới được liệt kê; chỉ xóa khi chắc chắn không còn tham chiếu và không phải công việc của người khác.
- Fixture dùng dữ liệu giả; không lưu kỷ niệm thật/PII, secret hoặc env vào evidence. Dự án hiện không cần database/container/env cho nâng cấp này.
- Nếu có blocker, ghi chính xác lệnh/bước tái hiện, kết quả, cách đã thử và phần vẫn làm được. Không báo hoàn tất khi work item bắt buộc còn dang dở.

## 10. Tiến độ dự kiến và trạng thái

Ước lượng sơ bộ khi đã có asset đủ dùng: khoảng 10–16 ngày công cho một người làm tuần tự. Đây không phải cam kết lịch; thời gian tạo tranh, xác minh font và kết quả kiểm tra thiết bị có thể thay đổi ước lượng. Chốt lại sau GV-00/GV-01.

| Work item | Ưu tiên | Trạng thái hiện tại |
| --- | --- | --- |
| GV-00: baseline trước code | Bắt buộc đầu tiên | Verified — baseline mới, 56 PASS / 2 FAIL có sẵn |
| GV-01: nhận diện/asset | Chặn các bước dựng hình | Verified — SVG/fallback, mẫu desktop/mobile/đọc; 16 cặp tương phản đạt |
| GV-02: trang đầu | Trọng tâm yêu cầu | Verified — bố cục tĩnh rồi chuyển động; 8 browser PASS |
| GV-03: hướng dẫn/chuyển cảnh | Sau trang đầu | Verified — 10 browser PASS; motion suite 5 PASS, fixture đã sửa |
| GV-04: bản đồ/thông tin ga | Đồng bộ hành trình | Verified — sửa EXIST-RAIL; rail 13 PASS, browser 8 PASS |
| GV-05: chuyện/thẻ/kỷ niệm | Đồng bộ hành trình | Verified — nguồn chuyện 7 PASS; hành trình cuối giữ nháp/lưu/hết bài/đúng-sai/bỏ qua |
| GV-06: bưu thiếp/PNG | Đầu ra cuối hành trình | Verified — HTTP: 17 browser PASS; 5 PNG thật khớp preview, opt-in/retry |
| GV-07: nghiệm thu/bàn giao | Bắt buộc trước báo hoàn thành | Verified — nguồn 63 PASS, browser 214 PASS, bảo toàn 9 PASS; 0 FAIL; giới hạn ở mục 11 |

**Bước tiếp theo:** review kết quả tại `verification/goi-viet/report.md` và bộ hình fallback. GV-00 đến GV-07 đã triển khai; chưa commit/push/deploy. Các kiểm tra ngoài môi trường hiện có được liệt kê ở mục 11, không coi là đã PASS.


## 11. Nghiệm thu triển khai ngày 11/10/2026

- Implemented: logo Gói Việt bằng SVG/fallback có dấu, núi xanh nhiều lớp/cảnh mobile, mây/cò ngang và chiều sâu, cùng đoàn tàu; đồng bộ guide/map/đọc/thẻ/bưu thiếp; sáng/tối và tắt/giảm chuyển động.
- Verified: 63 source PASS, 214 browser PASS (Chrome 142 + Edge 44 + PNG 17 + chạm/vé 11), 9 bảo toàn PASS; 0 FAIL / 0 SKIP trong các case đã chạy. 10 PNG tải thật khớp bytes canvas, đúng opt-in và thử lại; kể cả file:// hoặc thiếu tranh/font.
- Responsive: 320/390/768/1024/1440 px và 844×390, đầy đủ màn sáng/tối ở 390/1440; bàn phím/focus, CSS zoom 200%, hành trình/nháp/hoàn thành/reset và failure path đã chạy.
- Hiệu năng lab HTTP loopback: LCP 916/620 ms, CLS 0,0078/0,0056 tại mobile/desktop; Event Timing 176/144 ms là proxy, không phải INP thực địa.
- Unverified: Safari, thiết bị vật lý, screen reader thật, zoom menu browser thật, tab nền thật (handler/animation kiểm tra bằng fixture), mạng production và Core Web Vitals thực địa. Không coi các mục chưa chạy này là PASS.
- Asset/font: 13 SVG diễn giải mood, Playfair Display/Be Vietnam Pro fallback. Chưa có binary/quyền webfont Hồn Rối và lettering logo chính xác; không cam kết giống hoàn toàn JPG. Fallback được dùng theo phạm vi đã cho phép, không chặn luồng chơi.
- Blocked: không có blocker hành trình trong môi trường nghiệm thu; không kết luận production-ready. DATA/ALL_DECKS_MAP và luật thẻ/nháp/kỷ niệm/reset giữ nguyên.
- Review/rollback/cleanup: xem `verification/goi-viet/report.md`, `final-results.json`, `final-review.diff`, baseline/snapshot từng GV. Đã dọn browser/server riêng; không DB/container/env. Giữ evidence để review; không commit/push/deploy hoặc dừng dịch vụ của người dùng.

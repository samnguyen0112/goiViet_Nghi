# Kế hoạch trang chuyển tiếp “Dòng ký ức chảy về nhà”

> **Cập nhật theo duyệt mới của người dùng — native v4:** người dùng đã duyệt cảnh vịnh kết hợp ga quê và yêu cầu sinh lại riêng từng thành phần để có chi tiết thật, thay cho việc phóng lớn ảnh mẫu. Chỉ dẫn này thay thế giới hạn giữ pixel mẫu của revision 2 ở dưới. Bản chạy là `map-surroundings-preview-3.html`, lớp ảnh mới ở `assets/goi-viet/memory-native-v4/`, CSS bổ sung `memory-native-v4.css`. Có 29 ảnh được sinh riêng bằng built-in imagegen, giữ nguồn PNG, xuất WebP gốc lossless và biến thể nhỏ hơn. Nội dung và tương tác tiếp tục dùng HTML/CSS/JS thật. Xem `verification/memory-native-v4/REPORT.md` và `assets/goi-viet/memory-native-v4/generation-prompts-complete.json` để biết kết quả và nguồn gốc.

Ngày lập: 19/10/2026. Dự án: Gói Việt — Vietnam Heritage Map.

**Cập nhật sau phản hồi mới ngày 19/10/2026: bản triển khai đầu chưa đạt độ giống và đã được thay bằng revision 2.** Chỉ dẫn mới của người dùng bên dưới có ưu tiên cao hơn các đề xuất ban đầu trong tài liệu. Báo cáo revision 2 nằm ở `verification/memory-reference-v2/REPORT.md`; báo cáo `memory-chapter-3` chỉ ghi nhận bản lịch sử.

### Điều chỉnh chính thức — revision 2

1. Trang chủ khóa cuộn bằng overflow, wheel/touch và bàn phím; chương kế tiếp đặt `inert` và `aria-hidden`. Chỉ nút “Bắt đầu khám phá” hoặc nút mũi tên mới mở khóa. Quay lại trang chủ hoặc phát lại mở đầu phải khóa lại. Không dùng thao tác cuộn để tự bỏ qua mở đầu.
2. Dùng ảnh người dùng gửi lại làm chuẩn tọa độ 971 × 1619: `assets/goi-viet/memory-reference-v2/sources/official-reference.png`. SHA-256: `97339e9ee2d7e0a06f089fea0e354b49200ac52b33b2c13b04678dc336a6d221`.
3. Tách đồ vật và phong cảnh từ pixel ảnh gốc, có mặt nạ, tọa độ và nguồn gốc trong `layers.json`. Chỉ phục hồi vùng tranh bị che, mặt thẻ cần bỏ chữ và phần nối cảnh bằng imagegen. Bộ hình vẽ riêng của revision 1 không còn được dùng trong chương đang chạy.
4. Dòng sông là các lớp tranh gốc; tàu nhỏ và từng toa, cầu đá, đường ray, bản đồ Việt Nam mờ, các thuyền, núi, mây, hoa lá đều được đăng ký riêng. Không thay bằng đường sông SVG hay đoàn tàu đồ chơi lớn.
5. Nối cảnh bằng vùng chồng có phối cảnh và alpha, lấy ảnh canvas hiện tại ở mép trên và đăng ký mép dưới trùng phong cảnh chương. Không để hai hình chữ nhật gặp nhau ở đường cắt ngang.
6. Desktop giữ tọa độ và tỷ lệ mẫu. Mobile bố trí lại chữ và cụm đồ vật để đọc được, giữ nguyên tỷ lệ từng cụm; dòng sông dùng vật liệu tranh gốc ghép riêng. Không thu nhỏ toàn bộ trang mẫu thành chữ quá bé.
7. Kiểm tra khóa/mở cuộn, focus, touch giả lập, toàn bộ câu hỏi, quay lại/phát lại, vào bản đồ, tải thiếu tài nguyên, reduced motion và ảnh chụp đường nối. Kiểm tra đồ họa và chức năng là hai phần riêng; không suy ra độ giống chỉ từ test chức năng.

## 1. Mục tiêu và phạm vi

Tạo một chương trải nghiệm nằm giữa trang chủ và bản đồ chính, lấy **preview-3 làm tham chiếu thiết kế chính**. Người dùng bấm nút để mở hành trình; lúc đó trang chủ trượt lên để lộ miền ký ức và mới cho phép cuộn. Từ những điều quen thuộc, họ thử một lá bài gợi chuyện rồi đi vào bản đồ.

Luồng đích:

> Trang chủ preview-3 → Ba mảnh ký ức → Lá bài gợi chuyện → Lời mời khám phá → Bản đồ hiện có.

Giữ phần nội dung bắt đầu từ “Có những điều chỉ cần gợi, là nhớ” của ảnh tham khảo. Không xây lại phần hero gia đình trong ảnh đó. Mockup đã tạo là định hướng bố cục và mỹ thuật, không phải một ảnh dài để đưa nguyên vào trang.

Kết quả mong muốn:

- Cùng một thế giới tranh với trang chủ: núi xanh ngọc, mây cách điệu viền vàng, giấy kem ấm, sắc đỏ son và đoàn tàu.
- Có chữ thật, nút thật, lá bài tương tác được và bố cục thích nghi với kích thước màn hình.
- Chuyển động có thứ bậc; nội dung vẫn rõ khi đứng yên hoặc giảm chuyển động.
- Đưa người xem từ ký ức gia đình tới hành trình văn hóa, không biến đoạn giữa thành một trang quảng cáo riêng.

Ngoài phạm vi: thay dữ liệu địa lý, đổi nội dung trò chơi, xây hệ thống lưu câu trả lời, tạo tài khoản, kết nối Facebook, tự đăng bài hoặc xuất bản website.

## 2. Cơ sở tham chiếu và hiện trạng đã đọc

### 2.1. Thứ tự ưu tiên

1. Trang chủ của `map-surroundings-preview-3.html`: nguồn chính về nhận diện và trải nghiệm hiện tại.
2. `assets/goi-viet/homepage-layered-poster-3.webp`: tham chiếu trực quan về phong cảnh, màu sắc và nét tranh.
3. Mockup “Dòng ký ức chảy về nhà” trong cuộc trò chuyện: định hướng bố cục mới.
4. Ảnh trang mẫu người dùng gửi: tham chiếu nhóm nội dung từ “Có những điều…” trở xuống.
5. Bài fanpage đầu tiên trong ảnh người dùng gửi: nguồn giọng kể và thông điệp, không cần chép nguyên bài lên website.

Ảnh concept chính thức đã được lưu trong dự án tại `assets/goi-viet/memory-chapter-3/references/approved-concept.png`. Đây là tài liệu tham chiếu mỹ thuật, không được dùng nguyên làm ảnh nền trang chạy thật. Nguồn sinh ảnh ban đầu: `C:/Users/Uy/.codex/generated_images/01a14fd7-ebf8-7d13-aaf9-532e7b6605fb/exec-e0b0efd5-551e-4f33-a00d-b0cbec575a64.png`.

### 2.2. Các điểm tích hợp cần chú ý

Đã đọc một phần HTML, CSS và controller để lập kế hoạch:

- `#introScreen` đang là dialog, có `aria-modal="true"`.
- `#introWelcomeStage .gv-home-content` hiện được thiết kế theo chiều cao màn hình; CSS của preview-3 có quy tắc khóa overflow ở trạng thái welcome.
- `#btnQuickStartWelcome` hiện gọi `closeIntroModal()` để mở bản đồ trực tiếp.
- `.gv-home-content` có cơ chế `inert` và hiện nội dung theo thời gian của mở đầu.
- `#homeSceneCanvas` nằm cùng ảnh poster dự phòng trong cảnh trang chủ.
- `homepage-opening-controller.js` quản lý trạng thái mở đầu, chuyển động, khả năng hiển thị và nhạc.
- `#mapScene` có `tabindex="-1"`, là một điểm cần xem xét khi chuyển focus vào bản đồ.

Đây là khảo sát nguồn có giới hạn, chưa phải kiểm tra toàn bộ luồng chạy. Khi bắt đầu triển khai phải đọc lại các handler liên quan, cơ chế khóa cuộn, focus, nhạc, tải bản đồ và những thay đổi mới trong workspace. Không dựa vào số dòng cố định hoặc giả định rằng nguồn chưa đổi.

## 3. Hướng mỹ thuật và nguyên tắc dựng cảnh

### 3.1. Ý tưởng xuyên suốt

**Dòng sông là đường dẫn thị giác.** Nó xuất hiện từ phong cảnh trang chủ, đi qua ba mảnh ký ức, vòng quanh lá bài rồi mở thành cảnh dẫn vào bản đồ. Người xem luôn cảm thấy mình đang đi tiếp trong cùng một không gian.

Cấu trúc tranh cần có vùng yên cho chữ, vùng chi tiết cho minh họa và khoảng nghỉ giữa các điểm nhấn. Không tăng mật độ hoa lá chỉ để lấp chỗ trống. Núi, mây, sông và lá bài là những yếu tố nhận diện chính.

### 3.2. Màu và chữ

- Lấy màu trực tiếp từ bộ tài nguyên preview-3 khi sản xuất; không coi màu trong ảnh mockup là mã màu cuối cùng.
- Nền giấy kem ấm; xanh ngọc và xanh rừng cho cảnh, xanh đậm cho nội dung; đỏ son nhấn vào một số từ và hành động chính.
- Ưu tiên font đang có trong dự án. Kiểm tra Lora đang được khai báo trong `home-story-3.css` và Be Vietnam Pro cho nội dung trước khi quyết định bổ sung font.
- Chữ tiêu đề phải kiểm tra đầy đủ dấu tiếng Việt, xuống dòng có chủ đích; nội dung chính trên điện thoại dự kiến từ 16px và line-height khoảng 1,5–1,7.
- Không dùng ảnh chứa chữ cho tiêu đề, câu hỏi hoặc nút mới. Logo/lettering thương hiệu hiện có được đánh giá riêng theo thiết kế hiện tại.

### 3.3. Kỹ thuật theo vai trò

| Loại thành phần | Cách dựng dự kiến | Lý do |
|---|---|---|
| Nội dung, nút, thứ tự đọc | HTML và CSS | Dễ đọc, chọn chữ, dùng bàn phím và thích nghi màn hình |
| Núi, cây, đồ vật, cụm tranh | Ảnh minh họa có vùng trong suốt khi cần | Giữ chất tranh và cho phép bố trí từng lớp |
| Đường sông, đường dẫn, gợn sáng | SVG kết hợp chất liệu tranh | Kiểm soát đường cong theo bố cục desktop/mobile |
| Lá bài | Thành phần HTML gồm hai mặt và minh họa riêng | Đổi câu hỏi thật, lật thẻ và hỗ trợ bàn phím |
| Chuyển cảnh | CSS transform/opacity và JS điều phối vừa đủ | Kiểm soát thời điểm, hủy và hoàn tất trạng thái |
| Trang chủ và bản đồ | Tận dụng renderer hiện có | Giữ nhận diện và hành vi đã có |

Không mặc định thêm canvas, WebGL hoặc thư viện hoạt cảnh cho phần mới. Chỉ chọn khi thử nghiệm cho thấy HTML/CSS/SVG không đáp ứng được một yêu cầu cụ thể.

## 4. Phần A — Từ trang chủ vào miền ký ức

### Mục đích

Cho người xem cảm giác cuộn để khám phá phần bên dưới của phong cảnh, không bị đưa sang một trang khác đột ngột.

### Công việc

1. Lập sơ đồ trạng thái hiện có của mở đầu, các nút bỏ qua/phát lại và thao tác vào bản đồ.
2. Xác định vùng cuộn duy nhất cho trang chủ và phần kể chuyện; tránh hai thanh cuộn lồng nhau.
3. Đề xuất giữ vùng mở đầu và miền ký ức trong cùng luồng trước bản đồ; kiểm tra lại semantics của dialog và focus trap để phù hợp nội dung dài.
4. Cho nút “Bắt đầu” dẫn tới đầu miền ký ức. Cung cấp một đường “Vào bản đồ” nhỏ, dễ tìm cho người đã quen hoặc không muốn đọc đoạn giữa.
5. Trong lúc mở đầu đang phát, giữ cơ chế bỏ qua hiện tại. Bỏ qua hoạt cảnh phải đưa trang về trạng thái nội dung đã sẵn sàng, không buộc người xem chờ mới cuộn được.
6. Ghép chân cảnh trang chủ với đầu miền ký ức bằng màu nền, đường núi, sông và một lớp mây che mép có chủ đích.

### Hiệu ứng

- Cảnh xa dịch chuyển ít hơn cảnh gần theo tiến độ cuộn.
- Mây ở ranh giới tách nhẹ, không phủ lên chữ trong thời gian dài.
- Dùng tiến độ cuộn để điều khiển cảnh; không tự kéo trang hoặc khóa con lăn để phát phim.

### Nghiệm thu

- Cuộn bằng chuột, trackpad, vuốt và bàn phím đều đi từ trang chủ đến nội dung mới được.
- Không mắc kẹt khi mở đầu đang tải, đang phát, đã bỏ qua hoặc đã phát lại.
- Không nhảy vị trí khi ảnh/font tải xong; không có đường nối ngang dễ thấy ở mép cảnh.
- Người xem có đường vào bản đồ mà không phải xem hết hiệu ứng.

## 5. Phần B — “Có những điều chỉ cần gợi, là nhớ”

### Nội dung dự kiến

- Nhãn: “TỪ NHỮNG ĐIỀU THÂN QUEN”.
- Tiêu đề: “Có những điều / chỉ cần gợi, là nhớ.”
- Dòng dẫn: “Một tiếng gọi thân quen. Một mảnh quê nhà.”

Tinh thần lấy từ bài fanpage: một tiếng gọi, một món ăn, một câu chuyện cũ, một nét văn hóa nhỏ. Ba cụm bên dưới giúp cụ thể hóa thông điệp, không cần tạo thêm cụm thứ tư chỉ để đủ từng câu trong bài đăng.

### Công việc

1. Dựng chữ thật trên vùng giấy sáng, tách khỏi các lớp tranh chuyển động.
2. Chốt xuống dòng ở desktop và mobile; không ép cùng một cách xuống dòng cho mọi kích thước.
3. Đặt cảnh núi và đường sông để dẫn mắt vào tiêu đề rồi xuống cụm đầu tiên.

### Hiệu ứng và nghiệm thu

- Tiêu đề hiện nhẹ trong khoảng 400–600ms; dịch lên dự kiến 8–16px.
- Cụm “là nhớ” có thể xuất hiện muộn hơn khoảng 100–150ms, nhưng vẫn là một câu có thứ tự đọc đúng.
- Chỉ diễn lần đầu khi vào vùng nhìn; cuộn ngược không khiến chữ biến mất để diễn lại.
- Không tách animation từng ký tự; nội dung vẫn hiện nếu script hoạt cảnh lỗi.

## 6. Phần C — Ba mảnh ký ức

### Nội dung và bố cục

| Mảnh | Minh họa | Câu gợi chuyện |
|---|---|---|
| 01 · Một vị nhà | Bát món ăn, gốm men lam, hơi nóng | “Món gì khiến bạn nhớ bữa cơm nhà nhất?” |
| 02 · Một chuyện cũ | Cổng làng, thư viết tay, chi tiết sân nhà | “Có chuyện nào ông bà vẫn thường kể?” |
| 03 · Một nếp quen | Bàn tay đan tre và những nan tre | “Nhà mình còn giữ điều gì từ ngày xưa?” |

Desktop bố trí so le quanh sông, tránh ba ô hình chữ nhật đồng đều. Mobile chuyển thành ba cụm dọc theo thứ tự 01–02–03; thứ tự DOM và thứ tự đọc giữ thống nhất.

### Công việc

1. Vẽ sơ đồ vị trí, kích thước và vùng trống cho chữ trước khi sản xuất tranh.
2. Làm ba cụm minh họa cùng chất nét, ánh sáng, màu và mức chi tiết.
3. Tách hơi nóng khỏi bát; góc giấy khỏi nền thư nếu hiệu ứng cần; tách lớp nan tre tiền cảnh khi có ích.
4. Giữ chú thích gắn với đúng cụm tranh khi thay đổi chiều rộng màn hình.
5. Tránh làm mỗi mảnh giống nút bấm nếu chưa có hành động thực tế.

### Hiệu ứng

- Mỗi cụm hiện nhẹ khi tới vùng nhìn, không chờ cả ba cùng xuất hiện.
- Bát món ăn: 2–3 vệt hơi mảnh, chu kỳ dự kiến 5–8 giây, chỉ chạy khi cụm đang hiện.
- Lá thư: góc giấy nâng rất ít khi hover; không bắt buộc người dùng mobile chạm chỉ để xem trang trí.
- Đan tre: bàn tay giữ tĩnh; có thể tạo chênh lệch rất nhẹ giữa nan tiền cảnh và nền nếu không làm sai hình.

### Nghiệm thu

- Chữ không đè lên minh họa ở các kích thước mục tiêu.
- Không có viền cắt trắng, nền chữ nhật sót lại hoặc bóng quá khác biệt giữa các cụm.
- Nhìn khi đứng yên vẫn đẹp và đủ nội dung.
- Chuyển động nhỏ dừng khi ra khỏi màn hình; không có hiệu ứng hover gây hiểu nhầm là thao tác chính.

## 7. Phần D — Dòng sông nối cảnh

### Công việc

1. Dựng hai đường sông chủ đạo cho desktop và mobile; không ép một đường cong dài vào mọi tỷ lệ.
2. Chọn các điểm neo theo từng phần nội dung để sông không trôi lệch khi chữ xuống dòng hoặc chiều cao thay đổi.
3. Tạo lớp màu nền nước, chất liệu, đường viền và một số gợn sáng; tránh đường SVG quá sạch so với tranh.
4. Cho cây, đá và mây che mép ở các điểm cần nối, không che khuyết nội dung.
5. Chỉ thêm vài cánh hoa tại những đoạn ngắn; kiểm tra đường đi không cắt qua câu hỏi hoặc nút.

### Hiệu ứng và nghiệm thu

- Gợn sáng và hoa chạy chậm, vòng lặp không lộ điểm bật lại.
- Không chuyển động toàn bộ bề mặt nước bằng một lớp phủ lớn gây mờ hoặc nhấp nháy.
- Sông liên tục qua các phần ở mức zoom chữ 200% và màn hình hẹp; nếu cần, chuyển sang đoạn sông đơn giản hơn.
- SVG trang trí không nhận click và không tạo mục đọc dư trong cây accessibility.

## 8. Phần E — Lá bài gợi chuyện

### Nội dung dự kiến

- Tiêu đề: “Một lá bài mở. / Một câu chuyện được nối.”
- Lời dẫn: “Không cần trả lời đúng. Chỉ cần lắng nghe nhau.”
- Nhãn thẻ đầu: “VỊ NHÀ”.
- Câu hỏi đầu: “Nếu được về nhà ăn một bữa, bạn muốn ăn món gì?”.
- Nút đổi câu hỏi: “Thử một lời gợi khác”.

### Công việc

1. Dựng lá bài bằng HTML: mặt trước, mặt sau, khung, nhãn, biểu tượng và câu hỏi riêng.
2. Tạo mặt lưng theo cảnh núi–mây của preview-3; không dùng mockup đã có chữ làm mặt trước.
3. Chuẩn bị bộ 9 câu hỏi ngắn, chia đều cho vị nhà, chuyện cũ, nếp quen; giọng kể gần gũi, không chấm điểm và không bắt buộc nhập câu trả lời.
4. Bấm nút đổi thẻ: phản hồi ngay, khóa thao tác lặp trong lúc lật, đổi câu hỏi khi mặt thẻ khuất, mở lại nút khi xong.
5. Không lặp ngay câu vừa hiển thị. Quản lý trạng thái cục bộ; chưa cần lưu vào tài khoản hoặc bộ nhớ lâu dài.
6. Thông báo câu hỏi mới qua vùng live phù hợp; giữ focus trên nút đã bấm.

### Hiệu ứng

- Khi tới phần này, thẻ trước tách khỏi bộ bài một lần, biên độ nhỏ.
- Hover nghiêng dự kiến tối đa 2–3 độ, chỉ áp dụng thiết bị có con trỏ chính xác; không chạy theo con trỏ trên toàn trang.
- Lật thẻ khoảng 600–800ms; giữ chữ đúng chiều và rõ trong trạng thái ổn định.
- Khi giảm chuyển động, đổi câu hỏi trực tiếp hoặc fade ngắn, không xoay 3D.

### Nghiệm thu

- Chuột, chạm, Enter và Space đều đổi thẻ được.
- Bấm nhanh nhiều lần không làm câu hỏi, nhãn và hình minh họa lệch nhau.
- Câu hỏi dài nhất không tràn khung ở mobile hoặc khi tăng cỡ chữ.
- Không làm thẻ nổi liên tục gây khó đọc; lỗi hiệu ứng không làm mất câu hỏi.

## 9. Phần F — Dòng hướng dẫn ngắn

Nội dung: “01 Chọn một miền ký ức → 02 Mở một lá bài → 03 Cùng kể, cùng nghe”.

Đây là phần hướng dẫn cho hành trình trên bản đồ, không phải tiến độ bắt buộc người xem phải hoàn thành trong trang chuyển tiếp.

- Desktop có thể đặt thành một hàng trên khoảng giấy yên.
- Mobile xếp dọc hoặc ngắt hàng có kiểm soát, tránh chữ quá nhỏ.
- Không làm một khối ba cột lớn mới; không cần hoạt cảnh riêng ngoài hiện nhẹ cùng vùng.
- Nghiệm thu: hiểu được thứ tự, đọc tốt, không giống ba nút điều hướng khi chúng không có hành động.

## 10. Phần G — Lời mời và chuyển vào bản đồ

### Nội dung dự kiến

- Tiêu đề: “Chuyện nhà mình, / nối thành chuyện quê hương.”
- Lời dẫn: “Bắt đầu từ một miền đất thân quen.”
- Hành động chính: “Mở bản đồ ký ức”.
- Liên kết phụ: “Theo dõi hành trình Gói Việt”. Chỉ gắn URL khi đã có địa chỉ fanpage thật; không đoán URL từ tên trang.

### Công việc

1. Mở cảnh sông thành thung lũng, dùng núi hai bên làm khung và chừa vùng yên cho lời mời.
2. Dùng đoàn tàu và cầu làm điểm nối nhận diện với trang chủ.
3. Nếu cần hình bản đồ làm nền, dùng nguồn địa lý đã có trong dự án; không dùng silhouette địa lý sinh bởi AI làm bản đồ chính xác.
4. Xác định thời điểm bản đồ thực sự sẵn sàng tương tác; không mặc định có API ready nếu nguồn chưa cung cấp.
5. Khi bấm mở bản đồ: phản hồi nút ngay → đảm bảo bản đồ sẵn sàng → chạy chuyển cảnh ngắn → hoàn tất trạng thái intro và chuyển focus tới điểm phù hợp trong bản đồ.
6. Giữ một đường fallback vào bản đồ nếu hoạt cảnh lỗi. Không để mây che màn hình vô thời hạn khi tải chậm.
7. Tích hợp với cơ chế mở bản đồ hiện có sau khi xác minh thứ tự side effect của `closeIntroModal()`; không tạo thêm một luồng đóng độc lập dễ xung đột.
8. Giữ tùy chọn nhạc của người dùng xuyên suốt; không tự phát nhạc mới hoặc làm nhạc khởi động lại khi cuộn.

### Hiệu ứng

- Tàu chạy qua cầu một lần khi vùng cuối hiện; không phải đợi tàu chạy xong mới được bấm.
- Khi vào bản đồ, mây tách/nhạt dần và nội dung rời đi nhẹ. Thời lượng dự kiến 600–900ms sau khi bản đồ sẵn sàng.
- Không zoom cực mạnh, quay camera đột ngột hoặc bắt buộc màn hình trung gian kéo dài.

### Nghiệm thu

- Nút không thể kích hoạt hai lần chuyển cảnh đồng thời.
- Sau chuyển cảnh, bản đồ nhận thao tác pan/zoom/chọn điểm như trước; không còn lớp trang trí chặn pointer.
- Focus không ở lại trong vùng đã ẩn; tab không lọt vào bản đồ khi intro còn hoạt động.
- Phát lại/trở về trang chủ không nhân đôi listener hoặc renderer.
- Không thay dữ liệu địa lý, nhãn hoặc luồng hành trình hiện có để phục vụ cảnh minh họa.

## 11. Danh mục tài nguyên cần chuẩn bị

| Nhóm | Thành phần dự kiến | Đầu ra cần có |
|---|---|---|
| Chất liệu | Giấy ấm, màu nền | Texture nhỏ có thể lặp, không chứa chữ |
| Địa hình | Núi xa, núi gần, cảnh cuối | Các mảng đủ mép dư để co giãn/dịch chuyển |
| Ranh giới | Mây, sương, cây che mép | Mảng trang trí tách nền, kiểm tra trên nền sáng và xanh |
| Nước | Đường sông desktop/mobile, chất liệu, gợn | SVG/texture phối hợp; đường đi có thể điều chỉnh |
| Ký ức 01 | Bát món ăn, hơi nóng | Tranh chính và lớp hơi riêng |
| Ký ức 02 | Cổng làng, lá thư | Tranh chính; góc giấy riêng nếu dùng hiệu ứng |
| Ký ức 03 | Bàn tay đan tre | Tranh chính; lớp nan riêng nếu cần chiều sâu |
| Bàn trà | Ấm chén, bàn gỗ, cây | Một cụm hỗ trợ cảnh lá bài, tiết chế chi tiết |
| Thẻ | Mặt lưng, biểu tượng 3 nhóm | Tranh không chứa câu hỏi; khung và chữ dựng bằng web |
| Hành trình | Tàu, cầu | Tận dụng tài nguyên hiện có nếu phù hợp; xác minh nguồn và tỷ lệ |

Quy trình sản xuất: dựng bố cục trước → thử một cụm tranh để chốt nét → sản xuất phần còn lại → kiểm tra đồng bộ → xuất kích thước phù hợp → kiểm tra trong cảnh thật.

Không chỉ cắt cơ học từ mockup: vùng bị che cần được vẽ bù để khi dịch chuyển không lộ khoảng thiếu. Kiểm tra quầng màu, răng cưa và bóng đổ ở mép ảnh. Dùng WebP/PNG theo yêu cầu alpha và chất lượng; giữ bản nguồn riêng. Nếu dùng ảnh sinh bằng AI, rà lại vật thể, bàn tay, hoa văn và chữ giả trước khi đưa vào bộ tài nguyên.

## 12. Quy tắc chuyển động chung

Ba điểm nhấn: **mây mở cảnh → lá bài lật → cảnh mở vào bản đồ**. Những chuyển động còn lại hỗ trợ, không tranh sự chú ý với điểm đang đọc.

| Hiệu ứng | Thông số khởi điểm để thử | Quy tắc |
|---|---|---|
| Hiện chữ/cụm nội dung | 400–600ms, dịch 8–16px | Một lần; không ẩn lại khi cuộn ngược |
| Parallax núi | Xa 0–8px, gần 12–32px trong một vùng cuộn | Không áp dụng vào lớp chữ; giới hạn biên độ |
| Hơi nóng | 5–8 giây/vòng | Chỉ khi vùng nhìn thấy; opacity thấp |
| Mây/hoa | 12–24 giây/vòng tùy đoạn | Rất ít phần tử; tránh đường đi qua nội dung |
| Lật thẻ | 600–800ms | Kích hoạt bằng thao tác; có chống bấm lặp |
| Tàu | 5–8 giây cho một lượt ngắn | Một lần khi đến vùng cuối; không chặn hành động |
| Vào bản đồ | 600–900ms | Tách thời gian tải khỏi thời gian hoạt cảnh |

Các con số là điểm bắt đầu, không phải thông số đã tối ưu. Chốt theo trải nghiệm thực tế trên thiết bị. Không dùng nháy sáng, rung liên tục hoặc chuyển động bám chuột trên diện rộng.

## 13. Responsive, khả năng tiếp cận và trạng thái dự phòng

### Responsive

- Desktop: bố cục so le, khoảng trống rộng; kiểm tra ít nhất 1280×720 và 1440×900.
- Tablet: giảm lớp tiền cảnh, giảm độ lệch các cụm; kiểm tra cả dọc và ngang.
- Mobile: nội dung theo một cột; lá bài và câu hỏi là trọng tâm, hình phụ được thu gọn; kiểm tra chiều rộng 360, 390 và 430px.
- Các breakpoint dựa trên lúc bố cục bắt đầu chật, không chỉ tên thiết bị. Không khóa chiều cao cả chương vào một màn hình.
- Chừa không gian cho thanh trình duyệt động, safe area và thao tác cuộn trên điện thoại.

### Khả năng tiếp cận

- Có hệ thống heading, thứ tự DOM và focus rõ ràng; trang trí ẩn khỏi trình đọc màn hình.
- Nút có tên và focus hiển thị; vùng chạm mục tiêu tối thiểu 44×44 CSS px.
- Mục tiêu tương phản WCAG AA: 4,5:1 với chữ thường, 3:1 với chữ lớn; đo trên nền thực tế sau khi ghép tranh.
- `prefers-reduced-motion` và tùy chọn giảm chuyển động hiện có phải được tôn trọng, kể cả khi thay đổi trong phiên.
- Khi giảm chuyển động: tắt parallax, vòng lặp nền, tàu và nghiêng thẻ; giữ toàn bộ nội dung và thao tác đổi câu hỏi.
- Kiểm tra zoom chữ 200%, chỉ dùng bàn phím và vùng thông báo câu hỏi mới.

### Dự phòng

- Ảnh tải chậm: giữ kích thước khung, nền giấy và chữ vẫn hiện.
- Script hoạt cảnh lỗi: nội dung và liên kết còn dùng được; không để opacity 0 vĩnh viễn.
- Lỗi tạo cảnh trang chủ: tận dụng poster dự phòng theo cơ chế hiện có.
- Lỗi khởi tạo bản đồ: hiển thị trạng thái có thể hiểu và hành động thử lại; không giả vờ đã vào bản đồ.
- Mất mạng sau tải: không làm hỏng nội dung đã có; khả năng offline đầy đủ chưa thuộc phạm vi.

## 14. Hiệu năng và quản lý tài nguyên

1. Đo baseline preview-3 trước khi thêm chương mới, ghi thiết bị, trình duyệt, viewport và điều kiện tải.
2. Tải tài nguyên theo vùng sắp đến; ưu tiên nội dung đầu và đường vào bản đồ. Không preload mọi ảnh lớn.
3. Xuất biến thể ảnh desktop/mobile theo kích thước hiển thị; không đưa cùng ảnh 4K xuống mọi điện thoại.
4. Ưu tiên transform/opacity; hạn chế blur, filter và lớp compositing lớn trên vùng dài.
5. Dừng vòng lặp ở vùng ngoài màn hình và khi tab ẩn; tiếp tục đúng trạng thái khi quay lại.
6. Dùng một cơ chế cập nhật theo frame cho chuyển động cuộn nếu cần; không tạo một vòng requestAnimationFrame cho mỗi mảnh trang trí.
7. Kiểm tra renderer trang chủ và bản đồ có còn chạy phía sau khi không nhìn thấy; tránh ba hệ cảnh cùng render liên tục.
8. Mục tiêu ban đầu: nội dung đọc và cuộn không khựng trên thiết bị kiểm tra; thiết bị yếu giảm trang trí trước khi giảm khả năng dùng.
9. Ngân sách thử nghiệm cho tài nguyên ảnh mới: khoảng 2–3MB ở mobile và 4–6MB desktop cho toàn chương sau khi tải dần, không tính tài nguyên bản đồ hiện có. Điều chỉnh sau khi đo chất lượng; không dùng con số này như cam kết đã đạt.
10. Thu thập trace ở các điểm nghi ngờ; xử lý tác vụ đồng bộ dài, layout lặp và tăng bộ nhớ sau nhiều lần vào/ra nếu xuất hiện.

## 15. Cấu trúc mã nguồn dự kiến khi được triển khai

Đây là đề xuất phân chia, chưa tạo các file dưới đây:

- HTML của chương mới tích hợp vào luồng preview-3 sau khi chốt vùng cuộn và semantics.
- `assets/goi-viet/map-surroundings-preview/memory-chapter-3.css`: bố cục, responsive và trạng thái giảm chuyển động.
- `assets/goi-viet/map-surroundings-preview/memory-chapter-3.js`: hiện theo vùng nhìn, đổi thẻ, điều phối vòng đời và hook chuyển cảnh.
- `assets/goi-viet/memory-chapter-3/`: tài nguyên minh họa đã tối ưu, ghi chú nguồn và manifest kích thước.

Ưu tiên phạm vi riêng của preview-3. Chỉ sửa file dùng chung khi kiểm tra chứng minh cần thiết và có đánh giá ảnh hưởng tới bản khác. Không nhân bản toàn bộ renderer hoặc thêm framework chỉ để làm chương này.

## 16. Thứ tự triển khai và đầu ra từng chặng

### Chặng 0 — Khảo sát và ghi baseline

- Đọc hướng dẫn repository hiện hành, kiểm tra thay đổi có sẵn và các hook mở đầu/bản đồ.
- Xem preview-3 chạy thật, ghi màn hình và hành vi các nút hiện tại.
- Vẽ sơ đồ trạng thái, chọn vùng cuộn và cách chuyển focus.
- **Đầu ra:** bản ghi baseline, danh sách điểm tích hợp và rủi ro cụ thể.
- **Điều kiện xong:** hiểu đường vào/ra bản đồ, phát lại, nhạc và các cơ chế khóa tương tác.

### Chặng 1 — Bố cục tĩnh và nội dung thật

- Dựng đầy đủ các phần A–G với chữ/nút thật và khung tranh đơn giản, có thể dùng crop tham chiếu tạm trong bản thử.
- Kiểm tra desktop/mobile, thứ tự đọc và chiều dài chương.
- **Đầu ra:** bố cục cuộn tĩnh hoàn chỉnh, không phụ thuộc vào animation để hiểu nội dung.
- **Điều kiện xong:** các vùng chữ, thẻ và CTA đều đọc và thao tác tốt, không tràn ngang.

### Chặng 2 — Hai thử nghiệm quan trọng

- Làm thử thẻ với vài câu hỏi và xử lý bấm lặp.
- Làm thử chuyển từ đoạn cuối vào bản đồ bằng mây đơn giản, chưa cần toàn bộ tranh hoàn thiện.
- **Đầu ra:** hai tương tác chạy trọn vẹn trên desktop và mobile.
- **Điều kiện xong:** không kẹt trạng thái, không mất focus, giảm chuyển động hoạt động, bản đồ vẫn dùng được.
- Nếu cách ghép cảnh cần đổi, sửa tại đây trước khi sản xuất nhiều tài nguyên.

### Chặng 3 — Sản xuất và ghép các lớp tranh

- Chốt một cụm mẫu về màu/nét, làm các cụm còn lại và xuất biến thể kích thước.
- Dựng đường sông, nối mép trang chủ và cảnh cuối.
- **Đầu ra:** cảnh tĩnh hoàn thiện có manifest tài nguyên, nguồn và kích thước.
- **Điều kiện xong:** cùng chất preview-3, không lộ mép ảnh, bố cục không phụ thuộc vào một tỷ lệ duy nhất.

### Chặng 4 — Chuyển động có thứ bậc

- Thêm reveal, parallax nhẹ, hơi nóng và chuyển động nền được chọn.
- Thêm tàu và tinh chỉnh ba điểm nhấn; kết nối trạng thái nhìn thấy với vòng đời renderer.
- **Đầu ra:** bản chuyển động đầy đủ và bản giảm chuyển động.
- **Điều kiện xong:** người xem đọc được, tự điều khiển nhịp cuộn, không có hiệu ứng thừa hoặc lặp gây phân tâm.

### Chặng 5 — Tích hợp, tối ưu và nghiệm thu

- Hoàn thiện nhạc, skip, replay, đường vào nhanh và các trạng thái lỗi.
- Kiểm tra ma trận bên dưới, đo hiệu năng và review diff.
- **Đầu ra:** bản preview-3 hoàn chỉnh cùng ảnh/video kiểm chứng, lỗi còn lại nếu có và hướng dẫn xem.
- **Điều kiện xong:** đạt các tiêu chí chức năng, hình ảnh và tiếp cận; không có thay đổi ngoài phạm vi chưa giải thích.

Các chặng là thứ tự phụ thuộc và điểm kiểm tra nội bộ, không tự tạo yêu cầu xin phép lại sau mỗi bước nếu người dùng đã cho triển khai toàn bộ. Không ước lượng ngày hoàn thành trước khi thử hai tương tác quan trọng và xác định khối lượng tranh phải làm mới.

## 17. Ma trận kiểm tra trước khi bàn giao

| Nhóm | Tình huống | Kết quả cần thấy |
|---|---|---|
| Luồng | Trang chủ → chương mới → bản đồ | Không nhảy cảnh, không kẹt overlay, bản đồ tương tác được |
| Đường nhanh | Vào bản đồ không đọc hết | Thao tác hoạt động, focus và nhạc đúng |
| Mở đầu | Chưa phát / đang phát / bỏ qua / phát lại | Cuộn và nút không bị khóa vĩnh viễn |
| Cuộn | Chuột, trackpad, touch, PageDown/Space | Không chiếm thao tác hoặc tạo cuộn lồng ngoài ý muốn |
| Lá bài | Bấm thường, bấm nhanh, bàn phím | Câu hỏi đổi đúng, không lặp ngay, giữ focus |
| Kích thước | Desktop, tablet, mobile dọc/ngang | Chữ rõ, không tràn ngang hoặc cắt CTA |
| Tiếp cận | Zoom 200%, focus, trình đọc màn hình | Đọc đúng thứ tự, không đọc đồ trang trí, không mắc bẫy focus |
| Giảm chuyển động | Bật từ đầu và đổi trong phiên | Vòng lặp/parallax dừng, tính năng còn đầy đủ |
| Tài nguyên | Ảnh chậm/lỗi, font chậm, script animation lỗi | Nội dung không mất, layout ổn định, có fallback |
| Bản đồ | Vào bản đồ rồi pan/zoom/chọn điểm | Luồng hiện có vẫn hoạt động |
| Vòng đời | Ẩn/hiện tab, vào/ra và phát lại nhiều lần | Không nhân đôi listener, nhạc hoặc vòng render |
| Hiệu năng | Cuộn, lật thẻ, chuyển bản đồ | Không xuất hiện khựng kéo dài hoặc tăng bộ nhớ liên tục |

Kiểm tra trên Chromium hiện có và ít nhất một môi trường mobile thực tế nếu có thể tiếp cận. Nếu chỉ giả lập viewport, ghi rõ giới hạn, không tuyên bố đã kiểm tra thiết bị thật. Thêm kiểm tra tự động cho trạng thái quan trọng khi có ích; không viết test chỉ để so lại giá trị CSS hoặc lặp nguyên logic triển khai.

## 18. Rủi ro, phương án xử lý và quyết định mặc định

| Rủi ro | Cách xử lý dự kiến |
|---|---|
| Tranh mới lệch nét preview-3 | Thử một cụm trước, đối chiếu trực tiếp cảnh hiện tại; giảm chi tiết nếu cần |
| Đường sông khó thích nghi chiều cao nội dung | Neo theo từng vùng, có đường riêng cho mobile, không dùng một ảnh dài cố định |
| Dialog toàn màn hình xung đột trang cuộn dài | Kiểm tra và điều chỉnh semantics/focus/scroll trong cùng một thay đổi có kiểm chứng |
| Bản đồ đang chạy ngầm làm cuộn nặng | Kiểm tra vòng đời renderer và dừng đúng vùng; đo trước/sau |
| Chuyển cảnh che lỗi tải | Có trạng thái chờ rõ, fallback và cơ chế kết thúc/hủy an toàn |
| Lật thẻ làm chữ mờ hoặc nhảy chiều cao | Giữ kích thước tối thiểu theo câu dài nhất, giảm hiệu ứng nếu cần |
| Thêm quá nhiều chi tiết khiến trang rối | Giữ ba điểm nhấn; bỏ hoa, bóng hoặc lớp phụ trước khi giảm độ rõ của nội dung |

Quyết định mặc định để bắt đầu khi được giao triển khai:

- Giữ cùng một trang với preview-3, không tạo URL trung gian bắt buộc.
- Cuộn tự nhiên; có đường vào bản đồ nhanh, không bắt người xem hoàn thành ba mảnh ký ức.
- Thẻ dùng để trò chuyện, không nhập/lưu câu trả lời và không chấm điểm.
- Fanpage là liên kết phụ. Nếu chưa biết URL thật, chưa gắn liên kết hoạt động.
- Giữ lựa chọn nhạc hiện có; không bổ sung âm thanh hover, lật thẻ hoặc tiếng tàu mặc định.
- Mở chương mới từ đầu trong lần tải trang mới; chưa thêm cơ chế ghi nhớ vị trí hoặc tự bỏ qua theo lịch sử.

## 19. Tiêu chí hoàn thành toàn bộ

- [x] Trang chủ, miền ký ức và bản đồ tạo thành một hành trình liên tục.
- [x] Chất tranh bám preview-3; mockup không được dùng nguyên như một ảnh nền dài.
- [x] Toàn bộ nội dung và điều khiển mới là thành phần web thật.
- [x] Ba mảnh ký ức, lá bài và lời mời cuối đã hoàn thiện trên desktop/mobile giả lập.
- [x] Hiệu ứng có thứ bậc, chạy đúng vùng nhìn và có phiên bản giảm chuyển động.
- [x] Đường vào nhanh, skip, replay, nhạc, focus và fallback đã được kiểm tra.
- [x] Bản đồ nhận focus, pan/zoom và luồng vào/ra hiện có hoạt động sau tích hợp; không thay dữ liệu hành trình.
- [x] Hiệu năng được đo và ghi điều kiện; giới hạn kiểm tra được nêu rõ.
- [x] Có ảnh kiểm chứng bố cục và kiểm tra tự động cho những tương tác quan trọng.
- [x] Review diff xác nhận giữ nguyên thay đổi có sẵn và không mở rộng ngoài phạm vi.

## 20. Bàn giao sau triển khai

- Trang chạy: `map-surroundings-preview-3.html` — “Bắt đầu” mở chương, “Mở bản đồ ký ức” vào bản đồ; có đường “Vào bản đồ” để đi nhanh.
- Ảnh chính thức và nguồn minh họa: `assets/goi-viet/memory-chapter-3/`.
- Ảnh desktop/mobile toàn chương: `verification/memory-chapter-3/chapter-desktop-full.png` và `chapter-mobile-full.png`.
- Báo cáo, kết quả từng test và giới hạn: `verification/memory-chapter-3/REPORT.md`.
- Cả sáu chặng đã hoàn thành. Fanpage không gắn URL giả; kiểm tra thiết bị thật là giới hạn đã ghi trong báo cáo, không được tính như đã thử nghiệm.

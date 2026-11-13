# Kế hoạch nâng cấp hiệu năng — Preview-4 (bản 3, sau GĐ0)

> Trạng thái: **GĐ0 hoàn thành** (`BAO-CAO-GD0-PREVIEW-4.md`); **GĐ1 hoàn thành** (`BAO-CAO-GD1-PREVIEW-5.md`: 1.1 và 1.5 xong; 1.2, 1.3, 1.4 điều tra bằng số liệu, không có sửa an toàn đáng ship; Fast/Slow 4G đã đo). Các giai đoạn sau chưa thực hiện, chờ duyệt. Chỉ `map-surroundings-preview-5.html` (3 chỗ) và `tools/perf/` được thêm/sửa; preview-3/4 và tài nguyên dùng chung giữ nguyên.
> **GĐ2 đã làm e2e** (`BAO-CAO-GD2-PREVIEW-5.md`): nướng sẵn raster và hiện sớm **không làm** (pilot: lợi ích nhỏ / đổi hình); nguyên nhân thật là ngân sách raster 3 ms/tick khi màn che đang giữ → `raster-scheduler-5.js` (chỉ trong `holding()`): vào bản đồ ×4 −38,9% (25,7 → 15,7 s), 0/10 lượt chạm ngưỡng 30 s (preview-4: 3/10), bản đồ lúc mở hoàn chỉnh; mốc nội bộ `firstGroundFrame` (+3,2 s, nằm dưới màn che) được chuyển thành chỉ số không chặn theo quyết định của bạn → cổng ĐẠT ở ×4 và ×1. Điều kiện tiên quyết cho `:has()` và `drawAtmosphere` đã kiểm tra (báo cáo GĐ2 phần B).
> **`drawAtmosphere` đã làm** (`BAO-CAO-DRAWATMOSPHERE-PREVIEW-5.md`): `homepage-layered-renderer-5.js` (cache tổng tiền tố + làm tròn nhanh có đường lui chính xác), đồng nhất từng bit (0 byte lệch trên trang thật; stress 3,6 triệu giá trị), hàm −36% ở ×4 (3× mỗi lần cập nhật), CPU mở đầu ×1 −16%; FPS ×4 +3% nhưng trong nhiễu. Cổng ĐẠT. **Đã quyết định giữ `homepage-layered-renderer-5.js`.** `:has()` → class và kế hoạch cho nhóm không có GPU: **tạm gác** theo quyết định của bạn (chưa làm).
> **GĐ3 đã làm** (`BAO-CAO-GD3-PREVIEW-5.md`): đo trang chủ ×4 (vẽ cảnh ~40%, prewarm ~16%, trình duyệt ~38%; trần bỏ toàn bộ vẽ cảnh +42% FPS) và thử 2 hướng giữ nguyên hình (bỏ thao tác trạng thái vô ích; cache 5 nhóm lớp tĩnh, lệch 393/1,84 triệu điểm ≤2/255): **không có lợi ích đo được → không giao thay đổi nào**; khởi tạo ngoài cổng chỉ ≤10% thời gian cổng → không làm. Còn lại đều đòi hỏi đánh đổi (nhóm B).
> **GĐ4 đã làm** (`BAO-CAO-GD4-PREVIEW-5.md`): cử chỉ kéo/xoay/zoom không có việc panel DOM; chi phí là vẽ cảnh phân tán, ép style trong khung chỉ là dời việc → không có sửa nhóm A đáng ship. Đường chọn địa danh có 3 lần ép style đồng bộ → hoãn `scrollIntoView` sang khung kế tiếp trong `selectDemoPlace` (preview-5): xử lý click −51% ở ×4, −52% ở ×1, layout 3 → 2, chức năng giữ nguyên. Hướng "tạm dừng raster khi camera chuyển động" (nhóm B) đo thử n=4, chưa kết luận, **chưa bật**.
> **GĐ6 đã làm** (`BAO-CAO-GD6-PREVIEW-5.md`): cổng hiệu năng cuối ĐẠT (GPU thật n=10; vào bản đồ ×4 màn che mở −32%, ×1 trong nhiễu, không chỉ số bắt buộc nào hồi quy); chức năng giống hệt preview-4; dự phòng 14/14; không rò rỉ khi vào/ra bản đồ; hình ảnh trong nhiễu A/A; Fast/Slow 4G −27%/−30%. Phát hiện và sửa 1 hồi quy ở đường WebGL tắt (lát raster 12 ms của GĐ2 chỉ dùng khi terrain WebGL dùng được). **Đã ghép thẻ bài** theo `card-testing.html` vào preview-5 (33 hunk từ preview-3 + `conversation-cards-5.*`; chức năng và 18/21 ảnh giống preview-3; cổng toàn luồng ĐẠT; luồng thẻ mở modal +38 ms ở ×1 và khi rút có 4 khung >50 ms, xem báo cáo mục 10). **Không làm:** kiểm tra trên máy thật khác. Mục tiêu đề xuất vào bản đồ ×4 ≤ 6 s và FPS kéo/xoay/bay ×4 **chưa đạt**.
> Bản 3: số baseline thay bằng trung vị 10 lượt; GĐ5 (nhóm B) đã loại; thẻ bài làm riêng.
> **Mục tiêu ở các giai đoạn sau là đề xuất cho đến khi bạn duyệt** bảng ở báo cáo GĐ0 mục 10.

---

## 0. Nguyên tắc làm việc

1. **Khóa phương pháp đo trước, rồi mới khóa mục tiêu.** Không đặt ngưỡng hồi quy (ví dụ ±5%) trước khi biết độ nhiễu của bộ đo.
2. **Baseline là preview-4 đo lại bằng bộ đo đã khóa.** Số preview-3 trước đây không thay thế baseline.
3. **Chỉ kết luận nguyên nhân khi có trace.** Thời gian "mang tên" một hàm chưa phải nguyên nhân gốc; "(program)" chưa mặc định là raster/GPU.
4. **Tách hai nhóm thay đổi:**
   - **Nhóm A — không đổi hình, không đổi chuyển động:** làm theo mặc định.
   - **Nhóm B — có đánh đổi** (hạ FPS ambient, tắt hiệu ứng, giảm DPR, hạ chất lượng thích ứng): **chỉ làm khi người dùng duyệt riêng**, và phải ghi rõ cái gì khác đi.
5. **Đo, sửa, đo lại** sau từng giai đoạn; không đạt thì không sang giai đoạn tiếp.
6. **Làm đủ, không làm dư.** Chỉ sửa phạm vi đã duyệt cho giai đoạn đó.
7. **Không phá bản khác.** Làm trên bản sao `map-surroundings-preview-5.html`. Giữ nguyên `index.html`, preview-3, preview-4. Tài nguyên dùng chung chỉ nhân bản bằng hậu tố `-5`.
8. **Ưu tiên máy tính** (trình chiếu trên máy lớp học chưa biết cấu hình). Mobile để sau.
9. **Mỗi giai đoạn có đường lui:** cờ bật/tắt hoặc revert một commit.

> Nền: preview-4 hiện **chưa có thiết kế thẻ bài mới** (`card-testing.html` là tham chiếu theo `AGENTS.md`; p4 đã bỏ `conversation-cards-3.*`). Khuyến nghị ghép thẻ **sau Giai đoạn 2**, rồi đo riêng luồng thẻ.

---

## 1. Hiện trạng — số đo GĐ0 (preview-4, máy tính, trung vị 10 lượt)

Các số bản 2 (một lượt) đã được thay bằng trung vị 10 lượt từ GĐ0 (biên nhiễu: báo cáo mục 2). Hệ số "×4" **không** là máy chậm gấp 4 (vòng tính toán chậm 6,6–7,3×, vòng bộ nhớ 4,0–5,4×); chỉ dùng để so sánh tương đối cùng mức đặt.

### 1.1 Baseline

| Chỉ số | 1× | ×4 |
|---|---|---|
| Tải trước cổng (byte truyền) | 13,6 MiB | cùng |
| Cổng sẵn sàng (trong trang / tường) | 0,44 s / 1,22 s | 2,6 s / 4,9 s |
| Vào bản đồ: khung đầu / màn che mở / gỡ hẳn | 0,82 / 1,46 / 1,96 s | 2,3 / **11,1** / 11,5 s |
| FPS mở đầu / trang chủ đứng yên | 59,5 / 58,5 | 52,2 / 51,0 |
| CPU bận mở đầu / trang chủ | 34% / 40% | 88% / 91% |
| FPS kéo / zoom / xoay / 2D-3D / bay tới Huế | 58 / 54 / 57 / 58 / 48 | 50 / 51 / 35 / 37 / 36 |
| Khung dài nhất khi vào bản đồ (LoAF) | 349 ms | 1.693 ms |

### 1.2 Nguyên nhân đã xác nhận bằng trace (báo cáo mục 5)

| Thao tác | Xác nhận | Bác bỏ / sửa |
|---|---|---|
| Vào bản đồ | Khung dài nhất = callback `setTimeout` của `memory-reference-v2.js`; forced layout+style 1,83 s (×4); style recalc 1,6 s; chờ prewarm làm màn che mở sau ~11 s dù `firstGroundFrame` ở 2,3 s | raster-scheduler không phải nút cổ chai (tick tối đa 55 ms) |
| Mở đầu / trang chủ | JS `tick` của `homepage-opening-controller-3.js:82` + renderer chiếm phần lớn; ở 1× tiến trình GPU bận ~42% (Canvas 2D chuyển sang GPU); style recalc 1,3 s (×4) | "Đứng yên" vẫn có chuyển động liên tục nên không thể "dừng vẽ" |
| Kéo/xoay/bay | `animateLoop` (preview-4.html:10424) dẫn đầu; DoUpdateLayers và style recalc đáng kể | "(program) ~55–60% là raster/GPU" sai: phần đó chủ yếu là style/layout/commit/GC của luồng chính |
| Tải trang | Cổng nặng nhất: ảnh chương Miền ký ức 4,26, `assets-2k.js` 2,02, ảnh intro cũ 1,92, Wikimedia 1,15 MiB | Mục tiêu ≤ 3 MiB chưa khả thi chỉ bằng 3 nhóm đầu |

### 1.3 Những thứ preview-4 đã có (không làm lại)

- Mesh/texture địa hình giữ trên GPU, có LOD (`webgl-terrain-renderer-3.js`); coverage mesh GPU (`webgl-coverage-3.js`).
- Worker raster có kiểm ngân sách `BUDGET_MS = 3` **giữa các tác vụ**, `MAX_JOBS = 128`, `MAX_READY_BYTES = 4 MB` (`raster-scheduler-4.js`). Lưu ý: không ngắt được một tác vụ đang chạy, nên một lát công việc vẫn có thể vượt 3 ms.
- Prewarm bản đồ khi ở trang chủ (`map-prewarm-3.js`); `pixel-budget.js`; tự phục hồi mất context WebGL.
- **Cache độ rộng chữ** (khóa theo font + chuỗi, 2048 mục, xử lý khi font thay đổi) — `label-performance.js:60`.
- **Tái dùng bố cục nhãn** khi camera chưa đổi đáng kể — `province-legibility.js:90`.
- **Giải mã từng lớp ảnh trang chủ thành `ImageBitmap`** — `homepage-layered-renderer-4.js:31`.
- Bản đồ đứng yên: CPU chỉ ~2,5%.

---

## 2. Giai đoạn 0 — Khóa phương pháp đo — ✅ **ĐÃ HOÀN THÀNH** (kết quả: `BAO-CAO-GD0-PREVIEW-4.md`)

Mục tiêu: có bộ đo đủ tin cậy để mọi số sau đó có giá trị so sánh; chưa sửa hành vi sản phẩm.

### 0.1 Dấu vân tay môi trường (ghi vào mọi báo cáo)
- Phiên bản Chrome, hệ điều hành, CPU, **RAM**, **GPU/backend** (GPU thật, ANGLE, SwiftShader…), nguồn điện (cắm sạc/pin, chế độ nguồn).
- Trạng thái cache (lạnh/ấm), băng thông và RTT khi giả lập mạng, độ phân giải/DPR cửa sổ.
- **Hash toàn bộ tài nguyên phụ thuộc** của trang (HTML, JS, CSS, ảnh, font, worker), không chỉ file HTML.

### 0.2 Đo độ nhiễu của bộ đo (A/A)
- Chạy **cùng một bản, cùng điều kiện, ≥ 10 lần** mỗi kịch bản; báo trung vị, min, max, độ lệch (IQR).
- Kiểm tra riêng: cache lạnh vs ấm; RAM thấp; chạy trùng/đồng thời; CPU throttling ×4 có cho hệ số chậm ổn định không (so với 1×).
- **Biên hồi quy chấp nhận được = suy ra từ độ nhiễu đo được**, không áp ±5% cố định.

### 0.3 Định nghĩa chính xác từng mốc
Ví dụ: `gate-ready`, `opening-start/end`, `home-idle-window`, `map-enter-start`, **`first-usable-map-frame`** (khung đầu dùng được), **`full-quality-map`** (đủ chất lượng), `first-input-response`. Mỗi mốc ghi bằng `performance.mark/measure` + điều kiện kết thúc (sự kiện/DOM/canvas nào).

### 0.4 Trace để xác định nguyên nhân
- Dùng Chrome Tracing/Performance: tách track **Main / Raster / GPU**, phân biệt **Self vs Total time**, xác định công việc lồng nhau.
- Với mỗi điểm nóng ở mục 1.2: ghi công việc thật sự (layout? style recalc? paint? raster? GC? decode?) và phần có thể tránh được.
- Đo **độ dài lát công việc lớn nhất** của raster-scheduler (long task / long-animation-frame) thay vì tin hằng số 3 ms.
- Kết quả: cập nhật lại bảng 1.2 từ "giả thuyết" thành "đã xác nhận / bác bỏ".

### 0.5 Kiểm kê tài nguyên thực
Bảng cho từng tài nguyên: URL, **byte truyền (nén)**, **dung lượng giải mã (RAM/GPU)**, pha cần dùng (cổng / mở đầu / trang chủ / chương / bản đồ), có trùng với mục khác không. Mục đích: tránh đếm chồng và chốt trần tải trước cổng bằng số thật.

*(Kiểm tra sơ bộ: 12,5 − 2,26 − 4,47 − 2,1 = 3,67 MB, tức còn dư ~0,67 MB so với mục tiêu "≤3 MB" ban đầu nếu ba nhóm tách biệt — cần kiểm kê mới biết.)*

### 0.6 Kiểm kê cờ và phụ thuộc của bản sao preview-5
- Preview-4 mang đồng thời `data-performance-preview="4"` và `data-preview-version="3"` (dòng 4557); prewarm còn kiểm tra phiên bản `"3"`. Liệt kê **mọi** nơi đọc các cờ này và các đường dẫn `-3`/`-4`.
- Quyết định có đổi số/đổi tên hay giữ nguyên; **không đổi số hàng loạt**.
- Với việc tách JS inline sau này: liệt kê thứ tự khởi tạo, biến toàn cục, hàm được gọi trực tiếp từ HTML.

### 0.7 Ma trận kiểm thử dự phòng (chạy ở baseline để biết trạng thái ban đầu)
Mở bằng `file://`; xuất PNG; **thiếu texture**; **worker lỗi**; **mất rồi khôi phục WebGL**; **WebGL không khả dụng** (tắt hẳn — khác với SwiftShader, vốn là WebGL dựng bằng phần mềm); SwiftShader; cache lạnh/ấm; chuyển tab ẩn/hiện.

### 0.8 Chốt mục tiêu
Sau 0.1–0.7: viết lại bảng mục tiêu bằng số thật, mỗi mục tiêu kèm biên nhiễu. **Dừng, báo cáo, chờ duyệt** trước khi sang Giai đoạn 1.

**Nghiệm thu GĐ0:** có báo cáo baseline preview-4 (trung vị + biên nhiễu) cho mọi mốc ở 0.3; bảng trace ở 0.4; bảng tài nguyên ở 0.5; danh sách cờ/phụ thuộc ở 0.6; kết quả ma trận 0.7. Chưa đổi hành vi người dùng.

---

## 3. Giai đoạn 1 — Nhóm A, ít rủi ro (sau khi GĐ0 xong) — ✅ **đã thực hiện** (xem `BAO-CAO-GD1-PREVIEW-5.md`)

> **Kết quả GĐ1:** tải đến cổng 13,61 → 9,68 MiB (−29%); cổng sẵn sàng −26…−36% trên Fast 4G (n=5) và −29…−41% trên Slow 4G (n=3); cổng hiệu năng A/B n=10 ở 1× và ×4: không hồi quy thật. Không cải thiện FPS/vào bản đồ (không nằm trong phạm vi GĐ1). **Cảnh báo phương pháp:** số tuyệt đối khác nhau 2× giữa các phiên đo (vào bản đồ ×4: 11,1 s ở GĐ0 vs 24,1 s ở GĐ1) → chỉ dùng A/B xen kẽ cùng phiên.

> **Cập nhật sau GĐ0 (định hướng cho 1.1–1.3):** (a) khung dài nhất khi vào bản đồ là callback `setTimeout` trong `memory-reference-v2.js` (LoAF tới 1.549 ms ở ×4, 10/10 lượt), không phải raster-scheduler; (b) forced layout+style trong script = 1,83 s ở ×4; (c) tải trước cổng có sàn ≈ 5,4 MiB nếu hoãn được 3 nhóm đã biết (8,2 MiB), không phải ≤ 3; (d) 3 ảnh Wikimedia hotlink 1,15 MiB nằm trong cổng; (e) header cache của hosting quyết định chi phí tải lại. Chi tiết: `BAO-CAO-GD0-PREVIEW-4.md` mục 5–6.

Chỉ làm những mục mà trace/kiểm kê ở GĐ0 xác nhận có lợi.

### 1.1 Tải theo giai đoạn (không đổi hình)
- Dựa trên bảng 0.5, hoãn tài nguyên chưa cần ở cổng: ảnh intro cũ ẩn, ảnh chương Miền ký ức, `assets-2k.js`… theo pha cần dùng. Prefetch lúc idle để vào chương không bị chậm/chớp.
- Trần tải trước cổng **chốt theo bảng kiểm kê** (đã tính byte truyền, không đếm chồng).
- **Nghiệm thu:** tải trước cổng đạt trần đã chốt; không ảnh vỡ/thiếu ở mọi chương (ảnh chụp so khớp); Fast/Slow 4G đến cổng cải thiện vượt biên nhiễu.

### 1.2 Gỡ chi phí layout *đã được trace xác nhận*
- Chỉ xử lý các lần ép layout mà 0.4 chứng minh là forced layout và tránh được (gộp đọc/ghi, `focus({preventScroll:true})`, bỏ `scrollIntoView` không cần).
- **Nghiệm thu:** thời gian layout trong "vào bản đồ" giảm vượt biên nhiễu; hành vi focus/truy cập bàn phím không đổi.

### 1.3 Giảm chi phí *mỗi khung* của trang chủ mà không đổi hình
- Dựa trace: tìm phần ghép lớp còn tốn thật (ví dụ `drawAtmosphere`, lượt `clip`/`save`/`restore`, vẽ lại vùng không đổi). Hướng khả dĩ: cache kết quả khí quyển theo tham số, vẽ chỉ vùng thay đổi, gộp lượt vẽ.
- **Không** dừng vẽ hay hạ FPS ambient ở nhóm này (đó là nhóm B).
- Chỉ **dừng vẽ khi cảnh thật sự tĩnh** (không có chuyển động ambient nào đang chạy) và tab ẩn; khi đó nghiệm thu bằng **CPU ≈ nhàn rỗi** và **thời gian phản hồi khi hoạt động lại**, không bằng FPS.
- **Nghiệm thu:** CPU/khung giảm vượt biên nhiễu; ảnh chụp các khung then chốt và nhịp chuyển động **không đổi** (so sánh trực quan + chênh pixel nhỏ).

### 1.4 Điều tra chi phí nhãn (chưa viết cache mới)
- Cache chữ và tái dùng bố cục **đã có**. Việc cần làm: đo tỉ lệ hit/miss (`GoiVietLabelPerformance.inspect()`), xác định khi nào `reuse` bị phá (`significant`, `key` đổi, `obstacles` đổi), và **chi phí tạo khóa** (`JSON.stringify` 9 trường trong mỗi `measure()`; `JSON.stringify` khóa bố cục và vật cản mỗi khung).
- Chỉ sửa nếu trace cho thấy khóa/invalidate là phần tốn. Ví dụ: khóa số nguyên thay chuỗi JSON, hoặc sửa điều kiện làm cache vô hiệu quá thường xuyên.
- **Nghiệm thu:** CPU nhãn mỗi khung giảm vượt biên nhiễu; vị trí và va chạm nhãn không tệ hơn baseline (đếm bằng script).

### 1.5 Cổng kiểm hiệu năng
- Đưa `perf-check` vào quy trình trước mỗi lần chốt, dùng ngưỡng đã khóa ở GĐ0.

---

## 4. Giai đoạn 2 — Vào bản đồ nhanh (**rủi ro cao**, làm thử nghiệm trước)

Nướng sẵn raster theo tọa độ thế giới là khả thi, nhưng **không tự bảo đảm** vào bản đồ ≤ 6 s: ảnh nướng sẵn vẫn phải tải, giải mã và đưa lên GPU.

### 2.0 Thử nghiệm giới hạn (pilot) — bắt buộc trước khi mở rộng
- Chọn **một vùng**, **vài mức chi tiết**, và **cả hai theme**. Đo: byte, thời gian tải+giải mã+upload GPU, RAM/GPU, chất lượng hình.
- Phân loại raster hiện có: **cố định** (nướng được) vs **phụ thuộc mật độ / theme / camera / lựa chọn người dùng** (không nướng được hoặc phải nướng theo tổ hợp).
- Thiết kế cùng lúc: bảng mức zoom, **xử lý mép ghép ô** (seam), trần dung lượng, **phiên bản dữ liệu** (hash trong tên), **chiến lược giải phóng bộ nhớ**.
- Quyết định đi/dừng dựa trên số của pilot.

### 2.1 Nướng sẵn lúc build (nếu pilot đạt)
- Script build sinh texture/ảnh tĩnh theo vùng/mức zoom; loader ưu tiên texture sẵn, **giữ đường raster cũ làm fallback** (thiếu file, lỗi, cờ tắt).

### 2.2 Hiện sớm, tinh chỉnh dần — đo **hai mốc riêng**
- `first-usable-map-frame`: khung đầu dùng được (có thể ở LOD thấp).
- `full-quality-map`: hình đầy đủ chất lượng.
- Mở màn che sớm chưa chứng minh cả quá trình nhanh hơn; **cả hai mốc đều phải được báo cáo**, và tổng công việc nền không được làm tệ thêm các thao tác ngay sau đó (kéo/zoom).
- Có cross-fade khi nâng chất lượng; timeout an toàn cho màn che.

### 2.3 Prewarm khôn hơn
- Chạy khi idle, giới hạn CPU mỗi khung trong lúc animation trang chủ; không phá điều kiện phiên bản của prewarm.

**Nghiệm thu GĐ2:** `first-usable-map-frame` và `full-quality-map` cải thiện vượt biên nhiễu ở 1× và ×4; hình giống baseline ở 3 mức zoom × 2 theme; không chớp rõ rệt; RAM/GPU nằm trong trần; ma trận 0.7 (thiếu texture, worker lỗi, mất WebGL) vẫn qua.

---

## 5. Giai đoạn 3 — Phần còn lại của ghép lớp trang chủ (dựa trace)

- Lớp ảnh đã là `ImageBitmap`; **không** làm lại việc đó. Chỉ xử lý phần còn tốn mà trace chỉ ra (khí quyển, clip, lớp có alpha lớn, vẽ vùng không đổi).
- Hoãn khởi tạo hiệu ứng **ngoài cổng** (khói tàu, bánh xe, hạc WebGL, khung) tới sau khi cổng sẵn sàng — nhóm A **nếu** không đổi lúc chúng xuất hiện; nếu đổi thì chuyển nhóm B.
- Tách JS inline (~910 KB): **chỉ khi** giữ nguyên thứ tự khởi tạo, biến toàn cục và hàm gọi từ HTML (theo 0.6); có kiểm thử mở `file://`.
- **Nghiệm thu:** CPU/khung và thời điểm cổng sẵn sàng cải thiện vượt biên nhiễu; ảnh chụp khung then chốt không đổi; nhịp chuyển động không đổi.

## 6. Giai đoạn 4 — Tách việc nặng khỏi đường thao tác bản đồ (dựa trace)

- Khi camera đang chạy (bay/xoay/2D-3D): hoãn cập nhật panel DOM nặng (render danh sách, `scrollIntoView`, đo layout) tới khi camera dừng hoặc gom một lần/khung cuối — **chỉ phần trace xác nhận là tốn**.
- Nhãn: theo kết luận 1.4 (invalidate/khóa); nhãn WebGL atlas/SDF **không làm** trừ khi sau các bước trên vẫn không đạt mục tiêu đã khóa.
- **Nghiệm thu:** FPS và thời gian khung (p95) khi kéo/xoay/bay cải thiện vượt biên nhiễu; nhãn không nhảy bất thường; panel đúng nội dung và phản hồi trong ngưỡng đã định.

---

## 7. ~~Giai đoạn 5 — Nhóm B: đánh đổi~~ — **LOẠI KHỎI KẾ HOẠCH**

Theo quyết định của bạn: các mục hạ FPS ambient, tắt/giảm hiệu ứng, giảm DPR, chất lượng thích ứng, bỏ hiệu ứng chuyển cảnh **không nằm trong kế hoạch này**; xem xét sau, riêng, có duyệt riêng. Lưu ý từ GĐ0 (báo cáo mục 8 và 10.3): ở mức không có GPU thật (SwiftShader/WebGL tắt) mở đầu chỉ ~2–7 FPS; nhóm A không thể kéo mức đó lên mượt.

---

## 8. Giai đoạn 6 — Hợp nhất và nghiệm thu cuối

- Ghép thiết kế thẻ bài theo `card-testing.html` (nếu được duyệt); đo riêng luồng thẻ trước/sau.
- Chạy toàn bộ `perf-check` (1×, ×4, Fast/Slow 4G, SwiftShader, WebGL tắt) với phương pháp đã khóa.
- Chạy lại kịch bản chức năng/bố cục: tìm kiếm không dấu, lọc chủ đề, chọn địa danh, thẻ bài, ghi kỷ niệm, âm nhạc, phím tắt (kể cả hành vi Escape hiện tại).
- Kiểm tra thủ công trên ít nhất 2 cấu hình thật nếu có.

---

## 9. Tiêu chí đạt — tách làm hai nhóm

### 9.1 Bắt buộc (không đạt = chưa nghiệm thu, bất kể hiệu năng)
- Không mất dữ liệu hoặc chức năng (địa danh, câu hỏi, hoạt động, ghi kỷ niệm, tìm kiếm, lọc, âm nhạc).
- Hình ảnh nằm trong ngưỡng đã thống nhất so với baseline (ảnh chụp các khung/mức zoom/theme then chốt).
- Bộ nhớ (RAM/GPU) nằm trong trần; không rò rỉ khi vào/ra bản đồ nhiều lần.
- Đường dự phòng vẫn hoạt động: `file://`, xuất PNG, thiếu texture, worker lỗi, mất/khôi phục WebGL, WebGL tắt hẳn.
- Nhóm B không được bật ngầm.

### 9.2 Hiệu năng (theo từng luồng, giới hạn hồi quy theo độ nhiễu)
- Mỗi luồng (tải/cổng, mở đầu, trang chủ, vào bản đồ, kéo/xoay/bay, thẻ bài) có **mục tiêu riêng** và **giới hạn hồi quy = biên nhiễu đo ở GĐ0**.
- **Vào bản đồ** (cả `first-usable-map-frame` và `full-quality-map`) là chỉ số bắt buộc phải đạt; không được bù bằng chỉ số khác (không dùng quy tắc "đạt X% chỉ số").
- Không luồng nào được tệ hơn baseline vượt biên nhiễu.

### 9.3 Mục tiêu — **đề xuất sau GĐ0, chờ duyệt**

Bảng baseline và mục tiêu theo số đo thật (trung vị 10 lượt, biên nhiễu IQR, mốc `firstGroundFrame` / `curtainReveal`) nằm ở **`BAO-CAO-GD0-PREVIEW-4.md` mục 2–3 (baseline) và mục 10 (mục tiêu đề xuất)**. Các số "hiện tại" cũ trong bản 2 (bay tới ga ×4 = 15,7 FPS; vào bản đồ ×4 = 15,4 s) đã được thay bằng **35,5 FPS** và **11,1 s**. Quy tắc "vượt biên nhiễu": |Δ trung vị| ≥ IQR gộp của baseline **và** Mann-Whitney p < 0,05, n ≥ 10 lượt mỗi bên.

---

## 10. Lộ trình

| Thứ tự | Giai đoạn | Nhóm | Công sức ước tính | Phụ thuộc |
|---|---|---|---|---|
| 1 | GĐ0 Khóa phương pháp đo | — | 2–3 ngày | — |
| 2 | GĐ1 Ít rủi ro (1.1–1.5) | A | 2–4 ngày | GĐ0 |
| 3 | GĐ2 Vào bản đồ (pilot → mở rộng) | A | pilot 1–2 ngày; mở rộng 3–6 ngày nếu đạt | GĐ0, GĐ1.2 |
| 4 | GĐ3 Ghép lớp trang chủ còn lại | A | 2–4 ngày | GĐ0 |
| 5 | GĐ4 Thao tác bản đồ | A | 2–4 ngày | GĐ0, GĐ2 |
| ~~6~~ | ~~GĐ5 Đánh đổi~~ | B | **loại khỏi kế hoạch (quyết định của bạn); xem xét sau, riêng** | — |
| 7 | GĐ6 Hợp nhất & nghiệm thu | — | 1–2 ngày | tất cả |

Điểm dừng hợp lý nếu thời gian gấp: **sau GĐ0 + GĐ1**. Sau mỗi giai đoạn: báo cáo số đo trước/sau (kèm biên nhiễu) và chờ duyệt.

---

## 11. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Bộ đo quá nhiễu để thấy cải thiện nhỏ | Cao | A/A ≥10 lần; biên hồi quy suy ra từ nhiễu; cố định môi trường (0.1–0.2) |
| Kết luận nguyên nhân sai (forced layout, "(program)" là raster/GPU) | Cao | Trace Main/Raster/GPU, Self/Total (0.4) trước khi sửa |
| Nướng sẵn texture không đạt kỳ vọng (tải/giải mã/GPU upload, seam, RAM, phiên bản) | Cao | Pilot giới hạn, đi/dừng theo số đo, giữ fallback raster |
| Cải thiện giả: màn che mở sớm nhưng tổng quá trình không nhanh hơn | Vừa | Hai mốc riêng; đo thao tác ngay sau khi vào |
| Thay đổi làm khác hình/chuyển động mà không ai duyệt | Vừa | Tách nhóm A/B; ảnh chụp so khớp; nhóm B có cổng duyệt |
| Cờ phiên bản `3`/`4` lẫn nhau làm hỏng prewarm hoặc phụ thuộc khi sao chép | Vừa | Kiểm kê 0.6; không đổi số hàng loạt |
| Tách JS inline phá thứ tự khởi tạo/biến toàn cục | Vừa | Kiểm kê thứ tự; test `file://`; tách từng phần nhỏ |
| Lazy-load làm ảnh chương trễ khi vào nhanh | Vừa | Prefetch idle; test Slow 4G |
| Hồi quy chức năng | Vừa | `func/layout/verify` mỗi giai đoạn |
| Ghép thẻ bài mới làm đổi số đo | Vừa | Đo riêng luồng thẻ trước/sau |
| Gần ngày trình chiếu | Cao | Có thể dừng sau GĐ1; mọi giai đoạn có cờ tắt |

---

## 12. Mẫu báo cáo mỗi giai đoạn

| Chỉ số | Baseline (trung vị ± IQR) | Sau (trung vị ± IQR) | Δ | Vượt biên nhiễu? | Đạt? |
|---|---|---|---|---|---|

Kèm: dấu vân tay môi trường, file đã sửa, cờ bật/tắt, ảnh chụp trước/sau, kết quả `func/layout/verify`, trace liên quan, và các điểm chưa đạt cùng nguyên nhân.

---

## 13. Ngoài phạm vi

- Kim tự tháp ô vector nhị phân kiểu Google Maps đầy đủ; nhãn WebGL SDF toàn bản đồ (chỉ cân nhắc nếu GĐ4 xong mà vẫn chưa đạt mục tiêu đã khóa).
- Tối ưu mobile.
- Đổi thiết kế/nội dung giao diện.
- Thay đổi `index.html` và các preview cũ.

---

## 14. Quyết định đã duyệt và việc còn lại

**Đã duyệt (sau bản 2):**
1. Làm trên bản sao `map-surroundings-preview-5.html` (đã tạo, byte-identical với preview-4).
2. Phạm vi lần này: **chỉ Giai đoạn 0** (đã hoàn thành, xem `BAO-CAO-GD0-PREVIEW-4.md`).
3. **Loại hẳn Giai đoạn 5 (nhóm B)** khỏi kế hoạch này; xem xét sau, riêng và có duyệt riêng.
4. Thẻ bài (`card-testing.html`) **làm riêng**, không nằm trong chuỗi nâng cấp hiệu năng này.
5. Nghiệm thu bằng giả lập (×4, SwiftShader, WebGL tắt), ghi rõ giới hạn (báo cáo GĐ0 mục 9).

**Còn chờ bạn:** duyệt bộ quy tắc "vượt biên nhiễu" và bảng mục tiêu đề xuất (báo cáo GĐ0 mục 2 và 10); quyết định có làm GĐ1 hay không; cân nhắc kiểm tra `chrome://gpu` trên máy lớp học (báo cáo GĐ0 mục 10.3).

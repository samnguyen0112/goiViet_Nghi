# Báo cáo Giai đoạn 4 — Tách việc nặng khỏi đường thao tác bản đồ (preview-5)

> Trạng thái: **hoàn thành, giao 1 thay đổi nhỏ (nhóm A)**. Phần còn lại điều tra bằng số liệu, không có sửa an toàn đáng ship; một hướng nhóm B được đo thử và **chưa áp dụng**, chờ bạn quyết.
> File dự án được sửa: **chỉ `map-surroundings-preview-5.html`** (1 chỗ trong `selectDemoPlace`). Bản gốc trước GĐ4: `tools/perf/results/gd4-map/preview-5-before-gd4.html`. `index.html`, preview-3/4 và tài nguyên dùng chung không đổi.

## 1. Phương pháp

- Hồ sơ CPU V8 (lấy mẫu 200 µs) với tách hàm theo thời gian bao gồm/riêng và theo từng dòng; LoAF kèm `forcedStyleAndLayoutDuration`; trace Chrome có stack JS cho mọi lần `UpdateLayoutTree`/`Layout` đồng bộ; đếm style/layout bằng CDP.
- Chrome 1707×1067, GPU thật (ANGLE D3D11), CPU ×4 (chính) và ×1 (kiểm tra).
- **Số tuyệt đối dao động tới 2× giữa các lượt** (ví dụ FPS kéo ×4: 41–56). Vì vậy mọi so sánh dùng **A/B xen kẽ trong cùng phiên** hoặc xen kẽ nhiều trình duyệt; tỷ lệ phân bổ thì ổn định giữa các lượt.
- Công cụ mới (chỉ đọc, không sửa site): `tools/perf/profile-interaction.cjs`, `trace-forced.cjs`, `ab-select.cjs`, `verify-gd4-select.cjs`, `ab-pause.sh`, `analyze-pause.cjs`. Kết quả: `tools/perf/results/gd4-map/`.

## 2. Phát hiện (có bằng chứng)

### 2.1 Khi kéo / xoay / zoom / đổi góc nhìn
- Gần như toàn bộ thời gian là `renderMainScene` (~16 ms/khung ở ×4). Phân bổ (so với `renderMainScene`, 3 lượt, khoảng giữa các lượt): backdrop 18–36%, nhãn quốc gia (`placeCountryLabels`) 9–30%, WebGL địa hình 9–20%, nhãn tỉnh (`paintLabels`) 7–20%, biểu tượng (`paintLandmarks`) 8–13%, nhãn đảo 6–9%.
- **Không có việc panel DOM nào chạy trong cử chỉ**: `renderDemoPlaceList`, `renderSidebarTrackers`, `updateSessionHeaderUI` đều có 0 lần gọi khi kéo/xoay/zoom. Phần "hoãn cập nhật panel khi camera chạy" của kế hoạch vì thế không có gì để hoãn ở các cử chỉ này.
- **Bác bỏ giả thuyết "ép layout trong khung là lãng phí".** Trace cho thấy `ctx.font`/`measureText` trong `placeCountryLabels` (preview-3.js:202–203) và nhãn đảo (preview-5.html:9332) buộc `UpdateLayoutTree` đồng bộ (113 ms kéo, 149 ms zoom ở ×4). Nhưng đó là do khung vừa ghi `style.transform` của canvas; phần tính style này **trình duyệt vẫn phải làm** ở bước render của khung, nên chỉ bị dời sớm, không phải tính thêm. Phần lãng phí thật (lần ép thứ hai, preview-5.html:9332) chỉ ~1,2 ms/khung ở ×4 (≈0,3 ms ở ×1): dưới biên nhiễu, không sửa.
- Nhãn: điểm nóng theo dòng là `context.font = canvasFont(...)` (preview-3.js:202), cộng `measure` (khóa JSON). Khớp kết luận GĐ1 mục 6.4: cache trúng cao, không phải lỗi khóa; giảm đáng kể phải đổi thuật toán đặt nhãn.
- `tick` của bộ lập lịch raster (3 ms mỗi 8 ms) chiếm 7–61% so với thời gian vẽ; phần lớn là tinh chỉnh backdrop **sau** khi cử chỉ dừng và nạp ô (`putImageData`). Xem 4.

### 2.2 Khi chọn địa danh (click thẻ trong danh sách, hoặc `selectDemoPlace`)
Đây là chỗ có việc nặng thật trên đường thao tác. Trace có stack, ×4, một lần click:

| Lần ép style đồng bộ | Dòng | ms (×4) |
|---|---|---|
| đọc `bar.getBoundingClientRect()` trong `focus()` của hành trình | journey-system-4.js:96 | ~80 |
| `listEl.innerHTML = …` | preview-5.html:7241 | ~59 |
| `cardEl.scrollIntoView(...)` | preview-5.html:7075 | ~59 |

Cả 3 nằm trong một handler `onclick` (LoAF: 229–231 ms, chặn 301–341 ms, trong đó ép style/layout 195–207 ms). Lần đọc thanh hành trình quyết định đích camera nên không thể dời; `scrollIntoView` thì có thể.

## 3. Thay đổi đã giao (nhóm A, không đổi hình)

`selectDemoPlace` (preview-5.html, sau `renderDemoPlaceList()`): `scrollIntoView` của thẻ được chọn chuyển sang `requestAnimationFrame`, tra lại thẻ theo id trong khung đó. Cuộn vẫn `smooth`/`auto` theo `reducedMotion`, `block: 'nearest'`; chỉ trễ ≤1 khung (~16 ms). Cuộn chung lượt layout của chính khung đó thay vì ép thêm một lượt riêng.

Thử nghiệm đã loại: đổi thứ tự ghi `aria-pressed` ở `renderDemoPlaceList` (v1) — không có lợi (nằm trong nhiễu), không giao.

### Số đo
A/B xen kẽ trong cùng phiên, 10 lượt mỗi bên:

| Chỉ số (trung vị [IQR]) | Trước | Sau | Δ | Vượt nhiễu? |
|---|---|---|---|---|
| ×4 xử lý click (ms) | 115,8 [109–137] | 57,3 [55–60] | **−51%** | có |
| ×4 style recalc trong 1,2 s sau click (ms) | 166 [161–180] | 120 [117–128] | −28% | có |
| ×4 khung dài nhất (ms) | 225 [200–275] | 175 [167–183] | −22% | có |
| ×4 số lần layout | 3 | 2 | −1 | có |
| ×1 xử lý click (ms) | 16,4 [14,0–18,7] | 7,95 [7,7–9,2] | **−52%** | có |
| ×1 style recalc (ms) | 33 [30–36] | 23 [23–25] | −30% | có |
| ×1 khung dài nhất (ms) | 16,8 | 16,8 | 0 | — (không rớt khung trước hay sau) |

Kiểm tra chéo trên chính file đã sửa so với bản sao lưu (trình duyệt riêng, xen kẽ, ×4, n=12 vs 18): xử lý click 84,7 → 60,3 ms (−29%, IQR không chồng nhau), layout 3 → 2. Cùng chiều, biên độ nhỏ hơn do nhiễu giữa trình duyệt.

**Đọc đúng ý nghĩa:** ở tốc độ thật (×1) lợi ích là ~8 ms mỗi lần chọn và không có khung rớt nào bị loại bỏ; ở máy yếu (×4) bớt được khoảng 60 ms chặn luồng chính mỗi lần chọn. Đây là cải thiện nhỏ, đúng hướng, không phải sửa một lỗi giật.

### Kiểm tra chức năng (`verify-gd4-select.cjs`, trên file đã sửa)
- Danh sách 36 địa danh; chọn thẻ cuối, giữa, và khi bật giảm chuyển động: thẻ được chọn luôn nằm trong vùng nhìn thấy của danh sách (top 512, vùng 500–892).
- `selectDemoPlace(id); renderDemoPlaceList();` liên tiếp: vẫn cuộn đúng thẻ đang chọn (nhờ tra lại theo id).
- Người gọi đồng bộ vẫn thấy `#placeCard-hue.selected` và `state.selectedPlaceId==='hue'` ngay sau lời gọi.
- 0 lỗi trang ở cả hai bản. Không script kiểm thử nào trong `tools/` phụ thuộc cuộn thẻ này.

## 4. Thử nghiệm nhóm B — **chưa áp dụng, chờ quyết định**

Giả thuyết: bộ lập lịch raster (`raster-scheduler-5.js`) bỏ qua `tick` khi camera đang chuyển động (ngoài lúc màn che giữ). Vá tạm bằng route, không sửa file; A/B xen kẽ, ×4, n=4 mỗi bên (kết quả: `ab-pause-x4.txt`):

| Thao tác | FPS base → pause | Khung >50 ms | Kết luận |
|---|---|---|---|
| kéo | 38,6 → 40,8 | 20 → 13,5 | trong nhiễu |
| zoom | 29,5 → 31,5 | 15,5 → 14 | trong nhiễu |
| xoay | 21,6 → 20,6 | 22,5 → 24 | không khác |
| đổi góc nhìn | 27,6 → 26,2 | 24,5 → 21 | không khác |
| bay tới Huế | 21,3 → 27,1 | 14,5 → 7 | gợi ý có lợi, n=4 |
| kéo sau khi chọn | 38,5 → 43,1 | 17,5 → 5,5 | gợi ý có lợi, n=4 |

Chưa đủ chắc (n=4, đa số IQR chồng nhau) và có đánh đổi nhìn thấy được: ô bản đồ chi tiết và backdrop đến muộn hơn trong lúc kéo/zoom. Theo nguyên tắc nhóm B của kế hoạch, **không bật**. Nếu bạn muốn thử, cần chạy lại với n≥10 và so ảnh chụp lúc kéo.

## 5. Không làm (kèm lý do)
- Dời `focus()`/`positionBar()` của hành trình: quyết định đích camera và vị trí thanh, đổi hành vi.
- Đổi thuật toán nhãn / bỏ qua nhãn khi chuyển động: nhóm B, và GĐ1 đã chốt cache không có lỗi.
- Giảm ép style trong khung (`ctx.font`): chỉ là dời việc, lợi ích thật dưới nhiễu.
- Sửa `:has()`/CSS nặng — nguyên nhân sâu của các lần style recalc 60–80 ms: vẫn **tạm gác** theo quyết định của bạn.
- Các khung dài ~500 ms trong LoAF không có script (`block 0`) là công việc render/paint/GPU, không sửa được bằng JS ở GĐ này.

## 6. Cổng nghiệm thu GĐ4
- Mục tiêu "FPS và p95 khi kéo/xoay/bay cải thiện vượt nhiễu": **không đạt và không đạt được bằng nhóm A** (cử chỉ không có việc panel; chi phí là vẽ cảnh phân tán, đã chứng minh).
- Mục chọn địa danh: **đạt** (vượt nhiễu, chức năng giữ nguyên, có đường lui).
- Đường lui: khôi phục khối `scrollIntoView` đồng bộ trong `selectDemoPlace`, hoặc chép lại `tools/perf/results/gd4-map/preview-5-before-gd4.html` đè lên `map-surroundings-preview-5.html`.
- Giới hạn: đo trên một máy, Chrome headless giả lập CPU; chưa đo máy lớp học (`chrome://gpu` vẫn nên kiểm tra).

# Báo cáo Giai đoạn 2 (vào bản đồ nhanh) + kiểm tra điều kiện tiên quyết cho 2 mục "để sau"

> Phạm vi: GĐ2 làm e2e trên `map-surroundings-preview-5.html` (đo → pilot → sửa → A/B → kiểm chứng), sau đó kiểm tra điều kiện tiên quyết cho (1) thay `:has()` bằng class và (2) đổi thuật toán `drawAtmosphere`. Hai mục (1)(2) **chưa được sửa**, chỉ đo và kiểm tra.
> Sửa trong GĐ2: `map-surroundings-preview-5.html` (đổi 1 dòng tham chiếu script) và **một file mới** `assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js`. Preview-3, preview-4 và mọi file dùng chung giữ nguyên.

---

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Vào bản đồ ×4 (click → màn che mở), n=10 mỗi bên | **25,7 → 15,7 s (−38,9%)**, p<0,001 |
| Số lượt phải chờ tới **ngưỡng an toàn 30 s** ở ×4 | preview-4: **3/10** → preview-5: **0/10** |
| Độ biến thiên (IQR) của thời gian vào bản đồ ×4 | 8,3 s → 3,1 s |
| Vào bản đồ ×1 | 2,17 → 2,01 s (trong biên nhiễu; không hồi quy) |
| Bản đồ lúc mở màn che có hoàn chỉnh không? | **Có**: 0,042% điểm ảnh đổi trong 6 s sau đó, không điểm nào lệch >64; bản đồ cuối giống preview-4 (0,029%) |
| FPS/CPU mọi thao tác khác (mở đầu, trang chủ, kéo, zoom, xoay, 2D/3D, bay) | Không đổi trong biên nhiễu (cả 1× và ×4) |
| 6 kịch bản dự phòng (WebGL tắt, `file://`, worker lỗi ×2, mất/khôi phục WebGL, xuất PNG) | 6/6 PASS |
| **Cổng hiệu năng (`perf-check`)** | **ĐẠT ở cả ×4 và ×1** sau khi `firstGroundFrame` được chuyển thành chỉ số **không chặn** theo quyết định của bạn (mục 4.3). Mốc này vẫn được báo cáo: chậm hơn +3,2 s (+38%) ở ×4, nhưng nằm dưới màn che nên không nhìn thấy |

Lưu ý quan trọng: số tuyệt đối của phiên đo này chậm hơn phiên GĐ0 (preview-4 ×4: 25,7 s thay vì 11,1 s). Vì vậy kết luận chỉ dựa trên **A/B xen kẽ trong cùng phiên** (n=10 mỗi bên).

## 2. Pilot (mục 2.0 của kế hoạch): quyết định đi/dừng theo số liệu

### 2.1 Nướng sẵn raster (2.1): **KHÔNG ĐI** (chưa đáng làm)

Các số đo (preview-4/5 ×4, CPU profile + trace + timeline):
- Công việc tính tile nằm ở **worker** (Dedicated Worker ~1,6 + 0,6 + 0,3 s ở ×4), không chặn luồng chính. Phần luồng chính mà nướng sẵn có thể loại bỏ chỉ là `putImageData` (~0,8 s) + `getContext` (~0,3 s) trong **~12–19 s** bận ở pha vào bản đồ (≈ 6–9%).
- Backdrop (`buildBackdrop`) được vẽ theo **kích thước vùng nhìn thực** (`width`, `height`, `pad`, camera) và mức zoom tổng quan phụ thuộc kích thước màn hình (0,81–1,0×); không nướng sẵn một ảnh cố định cho màn hình lớp học chưa biết được.
- Nướng sẵn tile theo tọa độ thế giới thì vẫn phải tải (MiB), giải mã và đưa lên GPU; lợi ích ròng nhỏ so với rủi ro (mép ghép ô, 2 theme, phiên bản dữ liệu, bộ nhớ).
→ Pilot kết luận: **không triển khai**. Nguyên nhân thật của thời gian chờ nằm ở chỗ khác (mục 3).

### 2.2 Hiện sớm khi "khung đầu dùng được" (2.2): **KHÔNG LÀM**

Màn che của preview-4 được thiết kế để người xem thấy ngay **bản đồ đã hoàn chỉnh**. Hiện sớm nghĩa là cho thấy bản đồ chưa đủ chi tiết rồi nâng dần — đổi trải nghiệm hình ảnh, không thuộc nhóm A. Với cách sửa ở mục 3, thời gian chờ đã giảm gần 40% **mà vẫn giữ nguyên bản đồ hoàn chỉnh khi mở màn che**, nên không cần hiện sớm.

### 2.3 Prewarm khi ở trang chủ: **không cải thiện được an toàn**

Ở ×4 trang chủ chiếm ~91–97% CPU, nên prewarm (chạy bằng `requestIdleCallback`) gần như không có thời gian rảnh: **sau 45 s ở trang chủ `preparedMs` vẫn rỗng**, và vào bản đồ ở thời điểm đó vẫn mất 9,2 s (so với 25,7 s nếu bấm sau 4 s). Đẩy ngân sách prewarm lên sẽ làm tụt FPS trang chủ (thay đổi nhìn thấy được → nhóm B). Không làm.

## 3. Nguyên nhân gốc (đo bằng timeline, không suy đoán)

`probe-hold.cjs` lấy mẫu mỗi 0,5 s các điều kiện của `complete()` trong `map-prewarm-3.js` khi màn che đang giữ (×4, preview-5 ban đầu = preview-4):

| Điều kiện | Diễn biến |
|---|---|
| Terrain: textures còn chờ | 128 → 0 tại ~11,9 s; `active` từ 9,7 s |
| Raster (tile, worker) | `pending` về ~0–1 từ ~6,7 s nhưng `completed` tăng đều (194 → 997 trong 33 s) |
| **Backdrop** | `commits = 0`, `pending = true`, `dirty = true` **suốt 30 s** |
| Màn che mở | đúng ở **~32,6 s** = giới hạn an toàn `SAFETY_MS = 30000` + chờ khung đều |

Tức là ở ×4 trong phiên này, backdrop **không bao giờ hoàn tất** và màn che chỉ mở nhờ cơ chế an toàn (log của trang: "Hết thời gian chờ chuẩn bị bản đồ; mở bản đồ hiện có"). Ở preview-4, 3/10 lượt chạm ngưỡng này (chờ 30,3 / 29,2 / 30,2 s), các lượt còn lại 18–27 s.

Lý do cấu trúc: `raster-scheduler-4.js` chạy việc phụ (xây backdrop theo từng bước, nạp tile) trong `tick`, được kích hoạt bằng `setTimeout(tick, 8)` với **ngân sách 3 ms mỗi tick**. Khi luồng chính bị chiếm bởi vẽ khung (×4), mỗi tick chỉ chạy ~1 lần/khung với 3 ms, nên thông lượng công việc rất thấp ngay cả khi người dùng chỉ đang nhìn màn che. Mã terrain (`webgl-terrain-renderer-3.js`) **đã** có chế độ "lấy nhiều việc mỗi lượt khi `holding()`" nhưng scheduler thì không.

Giả thuyết đã thử và **bác bỏ**: "`quiet()` chờ hết 3 s vì ngưỡng khung đều 25 ms không thể đạt ở máy chậm". Bản sửa thử cho `quiet` kết thúc sau 83–98 ms nhưng tổng thời gian không đổi (28,8–32,5 s so với 27,8–28,6 s), nên bản gốc không phí 3 s ở chế độ tải này. Đã hoàn tác, không ship.

## 4. Thay đổi đã làm và kết quả

### 4.1 Thay đổi (chỉ preview-5)

`natural/raster-scheduler-5.js` = bản sao của `raster-scheduler-4.js` với vài thay đổi nhỏ (xem `diff`: 1 hằng số, 1 hàm `holding()`, 4 chỗ dùng ngân sách động): **chỉ khi `GoiVietMapPrewarm3.holding()` là đúng** (màn che đang che bản đồ), ngân sách mỗi tick là **12 ms** thay vì 3 ms, tối đa 32 tile nạp mỗi lượt thay vì 8, và tick kế tiếp được hẹn sau 0 ms thay vì 8 ms. Ngoài lúc giữ màn che mọi thứ **giữ nguyên** (3 ms/8 ms/8 tile) nên tương tác không đổi. Tiếp nối cùng nguyên tắc mã terrain đã dùng. HTML preview-5 chỉ đổi dòng tham chiếu script.

### 4.2 Kết quả A/B (xen kẽ, n=10 mỗi bên, cùng phiên)

| Chỉ số | ×4 preview-4 | ×4 preview-5 | Δ | Kết luận |
|---|---|---|---|---|
| Vào bản đồ: màn che mở | 25.742 ms (IQR 8.302) | **15.736 ms (IQR 3.088)** | **−38,9%** | **Cải thiện thật** (p<0,001) |
| Vào bản đồ: màn che gỡ hẳn | 26.057 ms | 16.107 ms | −38,2% | Cải thiện thật |
| Số lượt chạm ngưỡng 30 s | 3/10 | 0/10 | | |
| Thời gian chờ màn che (min–max) | 18,4–30,3 s | 9,5–16,2 s | | |
| `firstGroundFrame` (nội bộ, dưới màn che) | 8.240 ms | 11.394 ms | **+38%** | Hồi quy thật nhưng **không chặn** (xem 4.3) |
| FPS mở đầu / trang chủ | 37,5 / 35,3 | 34,7 / 36,2 | −7% / +2% | trong biên nhiễu |
| FPS kéo / zoom / xoay / 2D-3D / bay | 40 / 39 / 21 / 26 / 21 | 44 / 34 / 20 / 24 / 19 | −12…+8% | trong biên nhiễu |
| Khung dài nhất khi vào bản đồ | 3.546 ms | 3.319 ms | −6% | trong biên nhiễu |
| TBT đến cổng / byte truyền | — | −16% / −2,15 MiB | | cải thiện (do GĐ1) |
| Lượt lỗi | 0/10 | 0/10 | | |

| Chỉ số | ×1 preview-4 | ×1 preview-5 | Δ | Kết luận |
|---|---|---|---|---|
| Vào bản đồ: màn che mở | 2.165 ms | 2.012 ms | −7% | trong biên nhiễu |
| `firstGroundFrame` | 1.110 ms | 1.094 ms | −1% | trong biên nhiễu |
| Mọi chỉ số FPS/CPU | | | −2…+0% | trong biên nhiễu |

Cổng ở ×1: **ĐẠT**. Kết quả đầy đủ: `tools/perf/results/gd2/perfcheck-x4.md`, `perfcheck-x1.md`.

Ghi chú: ở ×1 một lượt preview-5 có thời gian mở 8,9 s (ngoại lệ; 9/10 lượt còn lại 1,8–3,6 s). Không đủ dữ liệu để quy kết nguyên nhân; nằm trong biên nhiễu IQR của chỉ số này (1,3 s).

### 4.3 Hồi quy `firstGroundFrame` (+3,2 s ở ×4) — đã xử lý theo phương án (a)

- `firstGroundFrame` là mốc **nội bộ**: khung WebGL địa hình đầu tiên được vẽ *dưới màn che*. Trong preview-4/5 người dùng **không thấy** khung này; họ chỉ thấy bản đồ khi màn che mở (đã nhanh hơn ~39%).
- Cơ chế có khả năng (suy luận, chưa kiểm chứng): lát 12 ms và tick 0 ms giành thời gian của các callback rảnh (`requestIdleCallback`) mà terrain dùng để dựng texture đầu tiên, nên khung đầu đến muộn hơn trong khi tổng công việc xong sớm hơn.
- **Quyết định (bạn chọn phương án a):** chuyển `firstGroundFrame` thành chỉ số **không chặn** trong `tools/perf/perf-check.cjs` (nhãn "hidden by curtain"), vẫn báo cáo số liệu và vẫn gắn nhãn "HỒI QUY thật (không chặn)". Không tinh chỉnh ngân sách (phương án b).
- **Điều kiện đảo ngược:** nếu sau này có thay đổi nào cho phép **mở màn che trước khi bản đồ hoàn chỉnh** (ví dụ "hiện sớm"), mốc này phải trở lại là chỉ số chặn, vì khi đó người dùng sẽ thấy nó. Điều này đã ghi trong chú thích của `perf-check.cjs`.
- Chạy lại cổng sau thay đổi tiêu chí (cùng dữ liệu A/B): **ĐẠT** ở ×4 và ×1 (`tools/perf/results/gd2/perfcheck-x4.md`, `perfcheck-x1.md`).

## 5. Kiểm chứng bổ sung

| Kiểm tra | Cách làm | Kết quả |
|---|---|---|
| Bản đồ lúc mở có hoàn chỉnh? | `verify-reveal.cjs`: ảnh chụp ngay sau khi màn che gỡ vs +6 s, ×4 | p4: 0,012%; p5: 0,042% điểm ảnh khác (>16), 0% >64 (thuyền/sóng chuyển động) |
| Bản đồ cuối giống preview-4? | Cùng script, p4.S1 vs p5.S1 | 0,029% (>16), 0% (>64) |
| Đường dự phòng trên preview-5 | `fallback.cjs` | 6/6 PASS (WebGL tắt, `file://`, worker ném lỗi, worker sự kiện lỗi, mất/khôi phục WebGL, xuất PNG) |
| Worker lỗi | so p4/p5 hai lần xen kẽ | Vào bản đồ ~32–33 s ở cả hai (chạm ngưỡng 30 s; nhánh raster chạy trên luồng chính không được GĐ2 cải thiện). FPS đứng yên ngay sau đó dao động ở cả hai (1,4–2,4 hoặc 60), không quy được cho thay đổi |

## 6. Việc GĐ2 không làm và giới hạn

- Nướng sẵn raster (2.1) và hiện sớm (2.2): không làm, lý do ở mục 2.
- Kịch bản không có GPU thật (SwiftShader/WebGL tắt) **chưa A/B lại** với thay đổi này; chỉ kiểm tra rằng mở được và không lỗi.
- Pha vào bản đồ ở ×1 vốn đã nhanh (≈2 s) nên GĐ2 không tạo khác biệt đo được ở máy mạnh; lợi ích tập trung ở máy chậm.
- Số tuyệt đối phụ thuộc phiên đo (RAM trống ~0,5–2,5 GB, ứng dụng nền); chỉ so sánh trong cùng đợt.
- `HOLD_BUDGET_MS = 12` là giá trị tôi chọn từ lý luận khung ~16 ms, chưa quét các giá trị khác (xem 4.3b).

---

# PHẦN B — Điều kiện tiên quyết cho 2 mục "để sau"

## 7. Mục (1): thay `:has(#introScreen.intro-hidden)` bằng class

### 7.1 Đính chính số liệu trước đó
Tôi từng nói "327 selector ở 17 file". Đếm lại **chỉ các CSS mà preview-5 thực sự nạp**: **304 lần dùng `:has()` trong 15 file**, trong đó **300** là `:has(#introScreen.intro-hidden)`, 1 là `:has(#introScreen:not(.intro-hidden))`, 2 là `:has(#demoPlaceList)`, 1 là `:has(#btnHomeClipRetry[hidden])`. Phân bố: `map-reference-ui.css` 90, `polish.css` 51, `map-station-panel-phase4.css` 48, `map-controls-phase3.css` 39, `island-controls.css` 28, `heritage-frame.css` 17, còn lại ≤8 mỗi file. Không có `:has` trong `<style>` nội tuyến.

### 7.2 Điều kiện tiên quyết — kết quả

| Điều kiện | Kết quả |
|---|---|
| Ai ghi/xoá `intro-hidden`? | **Chỉ 2 nơi**: `openIntroModal` (dòng 8826) và `closeIntroModal` (dòng 8848) trong HTML → gắn class **đồng bộ** tại đây là khả thi |
| Có mã nào ghi đè toàn bộ `body.className`/`class`? | **Không** → class trên `body` không bị xoá |
| CSS có dùng chung với preview-3/4? | **Có**, cả 15 file → phải làm bản `-5` của 15 file CSS (và bản html trỏ tới) |
| **Gắn class bằng `MutationObserver` (trễ một nhịp) có tương đương hình ảnh không?** | **KHÔNG.** Camera tổng quan của bản đồ khác hẳn (Cần Thơ y=896 thay vì 849, Cao Bằng y=192 thay vì 237): **19,86% điểm ảnh khác** ở trạng thái "bản đồ sáng", lặp lại 2 lần. Nguyên nhân: bản đồ đo layout ngay lúc vào (`syncHeaderOffset`, `syncMapControlLayout`) và `:has` có hiệu lực đồng bộ cùng class, còn class trễ nhịp khiến lần đo thấy style cũ |
| Gắn class **đồng bộ** có tương đương không? | Trong 7 trạng thái (cổng, trang chủ, chương ký ức, bản đồ sáng, panel + ga Huế, bản đồ tối, phạm vi "tất cả"), so với đối chứng cùng đường `route`: mọi trạng thái bản đồ ≤ 0,03%, bằng với nền nhiễu của harness (xem 7.3) |
| Độ ưu tiên (specificity) | `:has(#id.class)` có specificity của đối số = (1,1,0); `.gv-map-open` chỉ (0,1,0). Biến thể giữ đúng specificity: `.gv-map-open:not(#gvNone)` (1,1,0). Khác biệt 0,55% ở trạng thái bản đồ tối xuất hiện ở **cả hai** biến thể (giữ và không giữ specificity) khi so với đối chứng không qua `route`, nhưng **biến mất khi so cùng đường `route`** ⇒ đó là artefact của `route`, không phải của specificity. Vẫn nên giữ specificity để loại trừ rủi ro lý thuyết |

### 7.3 Harness kiểm tra hình ảnh (`tools/perf/visual-states.cjs`)
7 trạng thái, hai theme (sáng/tối ở trạng thái bản đồ), diff điểm ảnh trong trình duyệt. **Nền nhiễu** (cùng bản vs cùng bản, đo lặp):

| Trạng thái | Nền nhiễu (% điểm ảnh lệch >16) |
|---|---|
| Cổng, chương ký ức | 0 |
| Trang chủ (cảnh động) | 0,22–0,24 |
| Bản đồ sáng / panel / tối / phạm vi tất cả | 0,003–0,04 |

Ngưỡng phát hiện: hồi quy CSS nào làm đổi >0,05% điểm ảnh ở bản đồ hoặc >0,3% ở trang chủ sẽ bị bắt. Lưu ý: so sánh trực tiếp (không route) với bản dùng `route` có nhiễu cao hơn chút (artefact thời gian); cần luôn so cùng đường `route` (`--variantA passthru`).

### 7.4 Lợi ích: có đáng không?

Tỉ lệ thời gian style recalc trên thời gian bận luồng chính (preview-4, trung vị 10 lượt):

| Pha | ×1 | ×4 |
|---|---|---|
| Mở đầu | 8,1% | 13,0% |
| Trang chủ đứng yên | 1,7% | 7,1% |
| Vào bản đồ | 19,9% | 11,1% |
| Kéo | 6,8% | 5,5% |
| Xoay | 4,9% | 3,9% |
| Bay tới Huế | 5,3% | 13,9% |

Thí nghiệm `route` trước đó giảm style recalc −25% (mở đầu), −97% (trang chủ), −38% (vào bản đồ) ⇒ tiết kiệm thực tế ước **~3% / ~7% / ~4%** thời gian bận ở ×4 (trần lý thuyết nếu loại bỏ hoàn toàn style ≈ 13%). FPS không đo được thay đổi (5 lượt, nhiễu lớn do overhead `route`).

**Kết luận điều kiện tiên quyết (1):** khả thi và an toàn **nếu** (a) gắn class đồng bộ trong 2 hàm, (b) giữ specificity, (c) làm bản `-5` của 15 file CSS, (d) chạy harness hình ảnh + A/B n≥10 sau khi làm. Lợi ích kỳ vọng nhỏ (3–7% CPU ở ×4); thiếu bằng chứng nó chuyển thành FPS. Chưa có lý do mạnh để làm ngay.

## 8. Mục (2): đổi thuật toán `drawAtmosphere`

### 8.1 Điều kiện tiên quyết — kết quả

| Điều kiện | Kết quả |
|---|---|
| Kích thước bài toán có phụ thuộc màn hình? | **Không**: mặt nạ cố định **n = 142.560 điểm** (480 × 297, chế độ managed), **k = 8 lớp** → cùng chi phí trên mọi máy |
| Có đúng là điểm nóng? | Có: vòng lặp chạy 106–154 lần trong hoạt cảnh mở đầu, tổng **2,1–2,6 s ở ×4** (tối đa ~38 ms mỗi lần gọi, dài hơn 1 khung) |
| **Trần lợi ích** (bỏ hẳn vòng lặp, chỉ để đo; hình sai) | FPS mở đầu ×4: **31,4 → 42,8 (+36%)**; khung p95 66,7 → 50 ms; số khung >33 ms 88 → 52; CPU bận 95,3% → 88,6% (3 lượt xen kẽ) |
| Lớp đã hiện hết có luôn là **tiền tố** của danh sách lớp khác 0 không? (điều kiện để cache tổng tiền tố mà vẫn **đồng nhất từng bit**) | **Có**, với manifest thật (`homepage-reference-v9`), ở cả 366 khung của 6,1 s (`verify-atmo-prefix.cjs`) |
| Cache tiền tố có đồng nhất từng bit với bản gốc? | **Có**: phát lại toàn bộ hoạt cảnh (363 khung phân biệt), **0 khung** có byte alpha khác |
| Giảm bao nhiêu công việc? | Số phép cộng lớp mỗi điểm còn **53%** của bản gốc (trung bình 5,98 lớp khác 0/khung, 3,16 lớp còn đang đổi/khung, tối đa 5); thời gian node nhanh hơn **×1,42** (không gấp đôi vì phần đọc/làm tròn mỗi điểm vẫn còn) |

### 8.2 Lợi ích kỳ vọng thực tế
Trần là +36% FPS (nếu xoá hẳn chi phí). Cache tiền tố loại được khoảng 30% chi phí vòng lặp ⇒ ước tính **~+3–4 FPS (~+10%) ở ×4 trong 6 s đầu**, một lần mỗi lần tải trang; ở ×1 (chi phí ~3 ms/khung) gần như không đáng kể. Con số này là **ước tính từ trần và tỉ lệ công việc**, chưa được đo bằng bản cài đặt thật.

Hướng giảm nhiều hơn (cập nhật mặt nạ thưa hơn, độ phân giải thấp hơn, chuyển sang GPU) **sẽ đổi hình/chuyển động** hoặc cần viết lại lớn; không thuộc nhóm A.

**Kết luận điều kiện tiên quyết (2):** các điều kiện cho một bản cache tiền tố **đồng nhất từng bit** đều đã thỏa; rủi ro hình ảnh gần như bằng 0 (đã chứng minh bằng phát lại), chỉ cần 1 file renderer `-5` và 1 dòng tham chiếu. Lợi ích kỳ vọng khiêm tốn (~10% FPS ở ×4 trong 6 s đầu) nên là một cải thiện **nhỏ nhưng gần như không rủi ro**.

## 9. Tệp mới và cách chạy lại

- Mới: `assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js`; sửa 1 dòng trong `map-surroundings-preview-5.html`.
- Công cụ mới (`tools/perf/`): `probe-hold.cjs`, `profile-prewarm.cjs`, `verify-reveal.cjs`, `probe-atmo.cjs`, `verify-atmo-prefix.cjs`, `inspect-home-manifest.cjs`, `visual-states.cjs`; cập nhật `flow.cjs` (`--dwell`, snapshot prewarm).
- Kết quả: `tools/perf/results/gd2/` (`ab-*.jsonl`, `perfcheck-x4.md`, `perfcheck-x1.md`, `hold-timeline-*.json`, `dwell-x4.jsonl`, `prewarm-profile-*.json`, `atmo-probe-x4.json`, `visual-*.json`).
- Chạy lại cổng: `node tools/perf/server.cjs`; `bash tools/perf/ab-batch.sh 10 tools/perf/results/gd2 "4 1"`; `node tools/perf/perf-check.cjs tools/perf/results/gd2/ab-p4-x4.jsonl tools/perf/results/gd2/ab-p5-x4.jsonl`.

## 10. Cần bạn quyết định

1. ~~Cổng GĐ2 ở ×4~~ — **đã quyết định**: phương án (a), `firstGroundFrame` là chỉ số không chặn khi còn màn che (mục 4.3).
2. **Giữ thay đổi `raster-scheduler-5.js` trong preview-5** (−39% thời gian vào bản đồ ×4, giảm hẳn các lượt chạm ngưỡng 30 s)?
3. **Mục (2) `drawAtmosphere` (cache tiền tố):** điều kiện tiên quyết đã thỏa, rủi ro hình ảnh ≈ 0, lợi ích ~10% ở ×4. Làm không?
4. **Mục (1) `:has()`:** điều kiện khả thi nhưng lợi ích nhỏ và cần bản `-5` cho 15 file CSS. Làm không, hay để sau?
5. Các kịch bản không GPU (SwiftShader/WebGL tắt) vẫn là rủi ro lớn nhất cho buổi trình chiếu (mở đầu 2–7 FPS); muốn lên kế hoạch riêng cho nhóm này không?

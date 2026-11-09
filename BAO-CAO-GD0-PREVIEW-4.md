# Báo cáo Giai đoạn 0 — Khóa phương pháp đo (preview-4, bản máy tính)

> Phạm vi: **chỉ Giai đoạn 0** theo duyệt của bạn. Không sửa file nào của site. File mới: `map-surroundings-preview-5.html` (bản sao byte-identical của preview-4) và thư mục `tools/perf/` (bộ đo + kết quả thô).
> Môi trường: **giả lập** (CPU throttle, SwiftShader, WebGL tắt) trên một máy duy nhất; không có máy yếu thật. Giới hạn ghi ở mục 9.
> Mọi số "mục tiêu" ở mục 8 là **đề xuất chờ bạn duyệt**, chưa khóa.

---

## 0. Tóm tắt — những điều GĐ0 thay đổi so với giả định cũ

1. **Số baseline cũ (một lượt đo) lệch so với trung vị 10 lượt.** Ví dụ "bay tới ga ×4 = 15,7 FPS" thực ra trung vị là **35,5 FPS**; "vào bản đồ ×4 = 15,4 s" là **11,1 s**. Hai số này đo theo thứ tự thao tác khác nhau và chỉ một mẫu. Bảng "hiện trạng" trong kế hoạch phải thay (mục 3).
2. **"×4" không phải máy chậm gấp 4.** Vòng lặp tính toán chậm **6,6–7,3×**, vòng lặp bộ nhớ **4,0–5,4×**; tác vụ thật chậm 2,6–7,6× tùy loại. Chỉ so sánh A/B cùng mức đặt mới có ý nghĩa; không dùng "×4" để nói "máy yếu gấp 4".
3. **Lỗi trong bộ đo của tôi đã được sửa:** `waitForFunction(fn, {timeout})` bị hiểu là đối số nên mọi timeout rơi về 30 s. Việc tôi báo trước đây "SwiftShader ×4 không mở được bản đồ trong 30 s" là **do lỗi này**, không phải lỗi sản phẩm. Đo lại: SwiftShader ×4 mở được bản đồ sau **20–39 s**. Dữ liệu A/A không bị ảnh hưởng (không lượt nào quá 22 s).
4. **Nút cổ chai khi vào bản đồ không nằm ở raster-scheduler.** Khung dài nhất là callback `setTimeout` trong `memory-reference-v2.js` (LoAF: tới 369 ms ở 1×, 1.549 ms ở ×4; xuất hiện ở **10/10** lượt). Tick của raster-scheduler tối đa 55 ms. Forced layout + style trong script là **1,83 s** (×4), chiếm ~14% thời gian bận của luồng chính; trace không thấy luồng raster riêng (raster nằm ở tiến trình GPU).
5. **Kịch bản không có WebGL tăng hạng mức rủi ro lên cao nhất.** SwiftShader ×1: mở đầu ~6,5 FPS, xoay 3 FPS. WebGL tắt hẳn ×1: mở đầu ~4 FPS, trang chủ ~3 FPS (CPU 97%). Đây không phải "mượt vừa phải": nếu máy lớp học rơi vào nhóm này thì trải nghiệm tệ ngay từ trang chủ.
6. **Mục tiêu tải "≤ 3 MB" không khả thi chỉ bằng việc hoãn 3 nhóm đã biết**: sàn thực tế ≈ **5,4 MiB** (mục 6).
7. **Hotlink ngoài:** cổng tải **3 ảnh từ `thumb.wikimedia.org`** (1,15 MiB). Máy lớp học không internet sẽ lỗi các ảnh này (site không sập: đã thử chặn, bản đồ vẫn mở).

---

## 1. Môi trường và dấu vân tay (0.1)

| Mục | Giá trị |
|---|---|
| Máy | Windows 11 Home 10.0.26300; Intel Core Ultra 7 155H (16 lõi / 22 luồng) |
| RAM | 15,6 GB tổng. Trống trong lúc A/A: **2,46–4,17 GB** (trung vị 3,03). Lúc smoke test chỉ **0,56 GB** |
| GPU | Intel Arc Graphics, ANGLE D3D11 (driver 32.0.101.5768) |
| Chrome | 155.0.8059.85, headless qua Playwright; viewport 1707×1067, DPR 1 |
| Nguồn điện | Cắm sạc, pin 28%, gói nguồn **Balanced** |
| Tải nền hệ thống trước mỗi lượt | CPU bận trung vị **17–21%** (min 9,5%, max 42,5%) |
| Server | `tools/perf/server.cjs`, gzip mức 6, `Cache-Control: max-age=0`, **không ETag** |
| Cache trình duyệt | **Tắt** trong A/A (để mỗi lượt giống nhau); có kịch bản bật riêng |
| Phiên bản mã | `map-surroundings-preview-4.html` sha256 `c4228717…abad18`; preview-5 trùng hệt |
| Manifest tài nguyên | 141 file đã tải đến lúc vào bản đồ, sha256 manifest `5adc6980…` (xem `tools/perf/results/gd0/env.json`) |

Ghi nhận rủi ro nhiễu: pin 28%/Balanced, RAM trống dao động, CPU nền 10–40%. Các yếu tố này đã nằm trong biên nhiễu đo ở mục 2.

## 2. Độ nhiễu của bộ đo — A/A (0.2)

Phương pháp: 10 lượt preview-4 xen kẽ 10 lượt preview-5 (bản sao y hệt), mỗi lượt là một trình duyệt mới; ở 1× và ×4; warm-up bỏ đi. Kiểm định Mann-Whitney p4 vs p5: **không phân biệt được** ở hầu hết chỉ số (p>0,05; một chỉ số p=0,041 trong ~30 phép thử, mức ngẫu nhiên bình thường). 40/40 lượt không lỗi.

Bảng dưới là trung vị p4, IQR gộp (20 lượt), tỉ lệ IQR/trung vị = **biên nhiễu tương đối**. Dữ liệu đầy đủ: `tools/perf/results/gd0/aa-summary.md`.

| Chỉ số | ×1 trung vị | IQR (%) | ×4 trung vị | IQR (%) |
|---|---|---|---|---|
| Cổng sẵn sàng, trong trang (ms) | 436 | 49 (11%) | 2.619 | 376 (14%) |
| Cổng sẵn sàng, tường (ms, sau `load`) | 1.222 | — | 4.925 | — |
| FCP (ms) | 732 | 44 (6%) | 832 | 176 (19%) |
| TBT đến cổng (ms) | 193 | 39 (20%) | 1.509 | 316 (20%) |
| Mở đầu: FPS | 59,5 | 0,7 (1%) | 52,2 | 4,5 (9%) |
| Mở đầu: CPU bận | 34% | 6,0 (18%) | 88% | 4,6 (5%) |
| Trang chủ đứng yên: FPS | 58,5 | 3,1 (5%) | 51,0 | 2,9 (6%) |
| Trang chủ đứng yên: CPU bận | 40% | 4,5 (11%) | 91% | 2,2 (2%) |
| Vào bản đồ → khung đầu (`firstGroundFrame`, ms) | 823 | 280 (34%) | 2.306 | 1.113 (46%) |
| Vào bản đồ → màn che mở (`curtainReveal`, ms) | 1.456 | 550 (38%) | **11.138** | 1.617 (15%) |
| Vào bản đồ → màn che gỡ hẳn (ms) | 1.956 | 505 (26%) | 11.507 | 1.575 (14%) |
| Vào bản đồ → raster rảnh (ms) | 2.151 | 505 (23%) | 11.709 | 1.579 (14%) |
| Vào bản đồ: LoAF lớn nhất (ms) | 349 | 265 (77%) | 1.693 | 290 (17%) |
| Bản đồ đứng yên: CPU bận | 2,4% | — | 8,7% | — |
| Kéo: FPS | 58,4 | 1,6 (3%) | 49,6 | 2,6 (5%) |
| Zoom: FPS | 54,0 | 4,2 (8%) | 50,7 | 1,8 (3%) |
| Xoay: FPS | 57,4 | 2,9 (5%) | 35,4 | 4,7 (13%) |
| Đổi 2D/3D: FPS | 57,8 | 3,3 (6%) | 37,2 | 2,0 (5%) |
| Bay tới Huế: FPS | 48,2 | 4,7 (10%) | 35,5 | 4,3 (12%) |

**Quy tắc "vượt biên nhiễu" đề xuất (áp dụng từ GĐ1):** một thay đổi chỉ được coi là thật khi (a) |Δ trung vị| ≥ IQR gộp của baseline cho chỉ số đó **và** (b) Mann-Whitney p < 0,05, với **n ≥ 10 lượt mỗi bên**. Với chỉ số có IQR/trung vị > 30% (khung đầu, LoAF ở 1×) cần n ≥ 20 hoặc đánh giá ở ×4, nơi biên nhiễu nhỏ hơn.

**Hệ quả:** ±5% cố định là sai. Biên nhiễu thực từ 1% (FPS mở đầu) đến 77% (LoAF ở 1×). Cải thiện "vào bản đồ ở 1×" dưới ~0,5 s **không phân biệt được với nhiễu**.

### 2.1 Hệ số CPU throttling (không nhất quán)

Vòng lặp tổng hợp, 2 lượt × 9 mẫu (`tools/perf/results/gd0/cpu-calib.json`):

| Mức đặt | Vòng tính toán (hệ số thực) | Vòng bộ nhớ (hệ số thực) |
|---|---|---|
| ×2 | 2,74–2,79 | 1,96–2,46 |
| ×4 | **6,62–7,29** | **4,05–5,44** |
| ×6 | 11,5–15,8 | 8,3–8,6 |

Trên trang thật, tỉ lệ ×4/×1 của các tác vụ: gateReady 6,0×; sự kiện `load` 4,1×; màn che mở khi vào bản đồ 7,6×; CPU bận mở đầu 2,6× (do ×1 chưa bão hòa). Vì vậy "×4" chỉ là **mức đặt danh nghĩa**; số tuyệt đối trên máy yếu thật có thể khác.

## 3. Baseline đã thay (trung vị 10 lượt, preview-4) so với số một lượt trước đây

> **Cập nhật từ GĐ1:** các số baseline tuyệt đối ở mục này và mục 2 chỉ đúng **trong phiên đo GĐ0**. Ở phiên GĐ1 (cách ~5 giờ) cùng preview-4 cho vào bản đồ ×4 = 24,1 s (GĐ0: 11,1 s), xoay ×4 = 25 FPS (35), bay ×4 = 20,6 FPS (35,5). Biên nhiễu "trong phiên" ở mục 2 do đó **đánh giá thấp** sai khác giữa các phiên; mọi so sánh cần A/B xen kẽ cùng phiên (xem `BAO-CAO-GD1-PREVIEW-5.md` mục 5).

| Chỉ số | Số cũ (1 lượt) | Số mới (trung vị) |
|---|---|---|
| Vào bản đồ ×4 | 15,4 s (11–27) | **11,1 s** (9,1–13,0; ngoại lệ 21,5 ở p5) |
| Vào bản đồ ×1 | 2,2 s | **1,46 s** mở màn che; 1,96 s gỡ hẳn |
| Mở đầu FPS ×4 | 48 | 52 |
| Trang chủ đứng yên FPS ×4 | 43 | 51 |
| Kéo FPS ×4 | 45 | 50 |
| Xoay FPS ×4 | 31 | 35 |
| Bay tới ga FPS ×4 | 15,7 | **35,5** (khác thứ tự thao tác nên không so trực tiếp) |
| Trang chủ CPU ×4 | ~97% | 91% |
| Cổng sẵn sàng ×4 | 6,5 s (tường, gồm `load`) | 4,9 s tường; 2,6 s trong trang |

Lưu ý định nghĩa: "cổng sẵn sàng trong trang" là lúc nút bắt đầu bật (ghi bằng `performance.now()`); "tường" là thời gian harness chờ xong sau `load`. Hai số khác nhau và phải luôn ghi rõ loại nào.

## 4. Định nghĩa các mốc (0.3)

| Mốc | Định nghĩa (quan sát từ bên ngoài, không sửa site) |
|---|---|
| `gateReady` | rAF đầu tiên khi `#btnHomeOpeningStart` bật và `GoiVietHomeIntro` tồn tại |
| `openingEnd` | rAF đầu tiên khi `#introScreen[data-home-opening]==='complete'`, tính từ lúc click bắt đầu |
| `firstGroundFrame` | Khung WebGL địa hình đầu tiên được vẽ sau khi bấm "mở bản đồ" (`GoiVietWebGLTerrain3.inspect().frames` tăng) |
| `curtainReveal` | `#memoryMapTransition` có `.is-revealing`. **Trong preview-4, mốc này chỉ xảy ra khi `map-prewarm-3.js` xác nhận bản đồ đã đầy đủ** (mặt đất, hàng đợi raster, backdrop, 5 khung đều) — nên nó gần với "đủ chất lượng" |
| `curtainClear` | Màn che không còn `is-covering/is-waiting/is-revealing` |
| `rasterIdle` | `GoiVietRasterTasks` không còn `pending/auxiliaryTasks/updating` trong 3 mẫu liên tiếp (100 ms) |
| FPS / p95 khung | Khoảng cách `requestAnimationFrame` trong cửa sổ từng pha |
| CPU bận | Δ`TaskDuration` (CDP `Performance.getMetrics`) / thời gian tường của pha |

**Phát hiện về định nghĩa:** ở preview-4, "khung đầu dùng được" (`firstGroundFrame`: 0,8 s ở 1×, 2,3 s ở ×4) và "đủ chất lượng" (`curtainReveal`: 1,5 s ở 1×, **11,1 s** ở ×4) cách nhau rất xa, vì màn che chờ prewarm hoàn tất. Đây là cơ hội của GĐ2.2: chênh lệch ~8,8 s ở ×4. Cần đo cả hai mốc ở mọi lần so sánh sau.

## 5. Nguyên nhân CPU từ trace (0.4)

Phương pháp: Chrome Tracing (`devtools.timeline`, `v8`, `cc`, `gpu`, `viz`, `toplevel`, `blink`), tách theo luồng, tính **Self time** bằng ngăn xếp sự kiện; "forced layout" = Layout/UpdateLayoutTree nằm trong `FunctionCall/EvaluateScript/v8.run/...`. Tracing tự nó thêm overhead; số dùng để **phân bổ**, không phải baseline hiệu năng. Kết quả: `tools/perf/results/gd0/trace-p4-x1.json`, `trace-p4-x4.json` (1 lượt mỗi cấu hình).

### Luồng chính (ms), ×4

| Pha | Tường | Luồng chính bận | JS (FunctionCall self) | Style recalc | Layout | DoUpdateLayers | Forced layout+style | GC | Tác vụ dài nhất | Tác vụ > 50 ms | GPU main bận |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Mở đầu | 11.353 | 10.588 | 4.994 | 1.344 | 0 | 231 | 54 | 133 | 183 | 35 | 3.067 |
| Trang chủ đứng yên | 4.003 | 3.905 | 2.219 | 0 | 0 | 98 | 0 | 9 | 25 | 0 | 1.560 |
| **Vào bản đồ** | 17.672 | 12.622 | 4.749 | 1.622 | 469 | 618 | **1.826** | 141 | **1.847** | 22 | 3.778 |
| Kéo | 5.010 | 3.299 | 975 | 170 | 0 | 508 | 181 | 50 | 202 | 29 | 719 |
| Xoay | 2.276 | 1.868 | 656 | 45 | 0 | 338 | 48 | 16 | 94 | 15 | 406 |
| Bay tới Huế | 2.740 | 2.402 | 890 | 212 | 19 | 414 | 67 | 26 | 233 | 12 | 535 |

### Luồng chính (ms), ×1

| Pha | Tường | Luồng chính bận | JS | Style recalc | Forced layout+style | Tác vụ dài nhất | GPU main bận |
|---|---|---|---|---|---|---|---|
| Mở đầu | 10.451 | 4.545 | 2.666 | 304 | 0 | 26 | **4.428** |
| Trang chủ đứng yên | 4.016 | 875 | 508 | 0 | 0 | 25 | 1.333 |
| Vào bản đồ | 3.648 | 1.047 | 344 | 175 | 268 | 395 | 1.630 |
| Kéo | 2.587 | 667 | 237 | 45 | 47 | 38 | 992 |
| Xoay | 1.639 | 482 | 205 | 24 | 25 | 30 | 684 |
| Bay tới Huế | 2.563 | 1.206 | 541 | 47 | 17 | 65 | 1.984 |

### Hàm JS tốn nhiều nhất (self time ×4)

- **Mở đầu:** `tick` @ `homepage-opening-controller-3.js:82` ≈ 4,3 s; `run` @ `homepage-layered-renderer-4.js:205`; `tick` @ `homepage-layered-renderer-4.js:86`.
- **Trang chủ đứng yên:** `tick` @ `homepage-opening-controller-3.js:82` ≈ 1,4 s; `tick` @ `raster-scheduler-4.js:118` ≈ 0,56 s; `tick` @ `map-prewarm-3.js:35`.
- **Vào bản đồ:** `tick` @ `raster-scheduler-4.js:118` ≈ **2,1 s** (tổng, nhiều tick nhỏ); `animateLoop` @ `preview-4.html:10424` ≈ 1,4 s; callback @ `memory-reference-v2.js:13` ≈ 0,36 s; `run` @ `webgl-terrain-renderer-3.js:133` ≈ 0,35 s; `check` @ `map-prewarm-3.js:71`.
- **Kéo/xoay/bay:** `animateLoop` @ `preview-4.html:10424` đứng đầu (0,6–1,0 s), rồi `raster-scheduler-4.js tick`, `webgl-terrain-renderer-3.js run`, `map-reference-ui.js:29`, `polish-3.js decorate`.

### LoAF (khung dài) ở pha vào bản đồ, 10 lượt mỗi mức

| Mức | Nguồn khung dài nhất | Tần suất | Tổng/Tối đa |
|---|---|---|---|
| ×1 | `memory-reference-v2.js` `TimerHandler:setTimeout` | 10/10 | tối đa 369 ms |
| ×1 | `animateLoop` (preview-4.html) | 23 khung | tối đa 759 ms |
| ×4 | `memory-reference-v2.js` `TimerHandler:setTimeout` | 10/10 | **tối đa 1.549 ms** |
| ×4 | `animateLoop` | 29 khung | tối đa 602 ms |
| ×4 | `raster-scheduler-4.js` `tick` | 6 | tối đa 55 ms |

### Kết luận có bằng chứng và những kết luận **bị bác bỏ**

Xác nhận:
- Khung chặn lớn nhất lúc vào bản đồ do **callback `setTimeout` của `memory-reference-v2.js`** (chuỗi đóng intro → mở bản đồ, kèm layout/style ép buộc). Đây là mục tiêu chính của GĐ1.2.
- **Forced layout + style trong script**: 1,83 s ở ×4 (14% thời gian bận luồng chính), 0,27 s ở ×1, chủ yếu ở pha vào bản đồ. Ở pha kéo/xoay/bay chỉ 17–181 ms.
- **Style recalc** đáng kể: 1,3–1,6 s ở ×4 khi mở đầu và vào bản đồ. Có thể liên quan CSS nặng (372 KB CSS inline và nhiều selector `body[data-regional-preview]:has(#introScreen.intro-hidden) …`); **chưa chứng minh**, cần thử nghiệm riêng.
- Mở đầu ở 1×: luồng chính chỉ bận ~43%, nhưng **tiến trình GPU bận ~42%** (4,4 s/10,5 s): chi phí Canvas 2D chuyển sang GPU nên đo "CPU luồng chính" đơn thuần đánh giá thấp chi phí thực.
- Raster nằm ở GPU và Worker riêng (Dedicated Worker ~1,6 + 0,6 + 0,3 s ở ×4 khi vào bản đồ), không phải "luồng raster của compositor".

Bị bác bỏ hoặc phải sửa:
- "(program) ~55–60% là raster/GPU" — **sai**: phần ngoài JS của luồng chính chủ yếu là style recalc, layout, commit/PaintArtifactCompositor, cập nhật layer, GC (xem bảng).
- "`BUDGET_MS = 3` là nguyên nhân/không đủ" — **không phải nút cổ chai**: tick của scheduler tối đa 55 ms; khung dài ~1,5 s đến từ nơi khác.
- "Tổng `getBoundingClientRect` + `focus()` = forced layout" — số trước chỉ là tên hàm. Số forced layout/style thật từ trace là 1,83 s (×4), cao hơn ước tính 1,26 s trước đó.
- `Blink.Accessibility.UpdateTime` (0,3–0,5 s ở ×4) có thể là **hiện vật của headless/CDP**; cần kiểm lại ở trình duyệt thường trước khi xem là chi phí của site.

## 6. Kiểm kê tài nguyên (0.5)

Nguồn: một lượt có cache bật, `tools/perf/results/gd0/inventory-p4.json` (203 file duy nhất, 27,08 MiB tổng cả flow). "Byte truyền" = byte trên dây (gzip mức 6 cho text); "RGBA" = rộng×cao×4, **cận trên** chi phí RAM/GPU khi giải mã (Chrome không luôn giữ hết).

### Theo pha (byte truyền, không đếm chồng)

| Pha | File | MiB truyền | RGBA ảnh (MiB) |
|---|---|---|---|
| A. đến cổng sẵn sàng | 166 | **13,61** | 46,9 |
| D. trang chủ (sau mở đầu) | 13 | 4,64 | 12,0 |
| E. chương Miền ký ức | 20 | 8,79 | 56,2 |
| F. vào bản đồ | 4 | 0,04 | — |
| Tổng | 203 | 27,08 | 115,1 |

### Cổng sẵn sàng (13,61 MiB) theo nhóm

| Nhóm | File | MiB truyền | RGBA (MiB) | Ghi chú |
|---|---|---|---|---|
| Ảnh chương Miền ký ức (`memory-reference-v5`, `memory-native-v4`, `memory-rail-v6`) | 9 | **4,26** | 17,6 | Chương thật ở pha E; 9 ảnh đã nằm sẵn trong cổng |
| `homepage-reference-v9/assets-2k.js` | 1 | **2,02** | — | JS dữ liệu ảnh 2K |
| Ảnh intro cũ (`scenery-clean-master.jpg`, `fg-mountain-*.png`) | 3 | **1,92** | 10,3 | Cần kiểm tra có còn dùng không |
| `homepage-transport-3` | 4 | 1,31 | 13,4 | Cảnh tàu |
| Ảnh khung thiệp (`invitation*`) | 11 | 1,24 | 2,4 | |
| Ảnh Wikimedia (hotlink ngoài) | 3 | **1,15** | — | `thumb.wikimedia.org`; cần internet |
| Brand/font | 10 | 0,78 | 2,6 | |
| HTML | 1 | 0,40 | — | 1,04 MB JS + 0,37 MB CSS inline trước nén |
| Còn lại (JS, CSS, hạc, favicon…) | 124 | 0,53 | — | 48 file JS tổng 2,23 MiB (gồm `assets-2k.js`) |

**Kiểm tra số học:** 13,61 − 4,26 − 2,02 − 1,92 = **5,41 MiB**. Hoãn đúng ba nhóm đã biết (8,20 MiB) **chưa đủ** để đạt ≤3 MiB; nếu hoãn thêm ảnh Wikimedia còn ~4,3 MiB. Mục tiêu ≤3 MiB chỉ khả thi nếu còn cắt được `homepage-transport-3` (1,31), thiệp (1,24) hoặc brand. Việc nhóm nào **thật sự hoãn được** phải kiểm chứng bằng thí nghiệm ở GĐ1.

### Phát hiện phụ về cache

- Server dev trả `max-age=0` không ETag, nên **tải lại vẫn tải 12,29/13,53 MiB** (lần ấm 555 ms so với 1.225 ms lạnh). Nếu hosting thật cũng thiếu header cache, người xem tải lại toàn bộ mỗi lần. Đây là cấu hình hosting, không phải code.
- Hai ảnh (`hanoi-lake-illustration.png` 2,85 MiB; `reference-original.png` 0,77 MiB) bị tải **hai lần** (pha D và pha F) kể cả khi bật cache, do cùng nguyên nhân header.

## 7. Cờ phiên bản và phụ thuộc cho preview-5 (0.6)

- `<body data-performance-preview="4" data-regional-preview="true" data-preview-version="3" …>` (`preview-4.html:4557`).
- **`data-preview-version="3"` được đọc ở 27 file (446 lần)**:
  - JS: `homepage-layered-scene-3.js` (4), `homepage-layered-renderer-4.js:17`, `homepage-opening-controller-3.js` (2), `homepage-transport-3/transport.js`, `home-station-feedback-3.js`, `memory-chapter-3.js`, `memory-reference-v2.js`, **`map-prewarm-3.js:11`** (`return` sớm nếu khác `'3'` — mất prewarm).
  - CSS: ~13 file (`home-*-3.css`, `invitation-*.css`, `memory-*.css`, `postcard-logo-3.css`…).
  → **preview-5 phải giữ `data-preview-version="3"`.** Không đổi số hàng loạt.
- **`data-performance-preview`**: không có nơi nào đọc trong `assets/` (JS/CSS). Chỉ cờ trình bày; có thể giữ `"4"` hoặc đổi `"5"` mà không ảnh hưởng (nếu cần xác nhận cho inline script trong HTML, kiểm tra riêng).
- `preview-3.js` dùng `?view=map` qua `location.href`; `homepage-music-3.js` dùng `document.baseURI`. Không thấy mã nào kiểm tra tên file `preview-4.html`.
- Khi tách JS inline ở giai đoạn sau: JS inline 1.037.289 byte, CSS inline 372.265 byte; cần giữ thứ tự khởi tạo và hàm toàn cục được HTML gọi (danh sách chi tiết sẽ lập khi đến bước đó).

## 8. Ma trận kiểm thử dự phòng (0.7)

Chạy trên preview-4; ảnh chụp ở `%TEMP%\perf-shots\`. "Mở bản đồ" = flow đến màn hình bản đồ và có FPS đo được.

| Kịch bản | Kết quả | Quan sát |
|---|---|---|
| Baseline GPU thật | PASS | WebGL ANGLE D3D11, terrain `usable` |
| `file://` | PASS (hình giống baseline) | **3 file dữ liệu địa hình tải lỗi** (`terrain-data.js`, `bathymetry-data.js`, `regional-terrain-data.js`) nhưng bản đồ vẫn vẽ; mức ảnh hưởng chi tiết chưa xác minh |
| Không có WebGL (`--disable-3d-apis`) | PASS, nhưng **hình khác** | Terrain `failed: "WebGL unavailable"` → Canvas 2D; địa hình phẳng hơn, ít đổ bóng |
| SwiftShader (WebGL phần mềm) 1× | PASS | Mở bản đồ sau 14–16 s |
| Thiếu 2 ảnh bản đồ (hồ Hà Nội, khung tham chiếu) | PASS | Bản đồ mở, chỉ báo lỗi tải trong console |
| Chặn 3 ảnh Wikimedia | PASS | Bản đồ mở |
| Thiếu `hydrology-data.js` | PASS (suy giảm) | Terrain WebGL `failed: "Cannot load hydrology-data.js"` → Canvas; hình phẳng hơn |
| Thiếu `islands-data.js` | PASS | Terrain vẫn dùng được |
| **Worker lỗi (khởi tạo ném lỗi / sự kiện `error`)** | PASS nhưng **rất chậm** | Raster chuyển sang luồng chính (`fallback:true`); vào bản đồ **33 s** (chạm giới hạn an toàn của prewarm, cảnh báo "Hết thời gian chờ chuẩn bị bản đồ"), so với ~2–5 s bình thường; FPS đứng yên ngay sau khi vào 39–46 (chưa đo thao tác) |
| Mất/khôi phục context WebGL | PASS | `lost:true` rồi `usable:true`; FPS 12 ở 1,5 s đầu sau khôi phục; console cảnh báo `restoreContext: context restoration not allowed` ở một số canvas |
| Tab ẩn/hiện (giả lập bằng `document.hidden`) | PASS | FPS trở lại 60. **Giả lập, không phải ẩn tab thật** |
| Xuất PNG bưu thiếp | PASS | `goi-viet-buu-thiep-gia-dinh.png` 139.618 byte; thông báo "Đã tạo PNG…" |
| Cache lạnh/ấm | Xem mục 6 | Ấm vẫn tải ~12,3 MiB do header |

### Các mức suy giảm (3 lượt mỗi ô, CPU/GPU giả lập)

| Cấu hình | Mở đầu FPS | Trang chủ FPS | Vào bản đồ (màn che gỡ) | Kéo | Xoay | Bay tới Huế |
|---|---|---|---|---|---|---|
| GPU thật 1× (baseline) | 59,5 | 58,5 | 2,0 s | 58 | 57 | 48 |
| SwiftShader 1× | 6,4–7,0 | 5,4–6,1 | 13,7–15,3 s | 21 | 3–4 | 8 |
| SwiftShader ×4 | 7,3–7,8 | 5,5–5,7 | 19,9–34,8 s | 13–20 | 7 | 7–10 |
| WebGL tắt 1× | 3,8–5,2 | ~3 (CPU 97–102%) | 6,1–7,4 s | 13–16 | 8 | 17–22 |
| WebGL tắt ×4 | 1,9–2,9 | 0,2–3,2 | 34,0–38,0 s | 3 | 2 | 1–2 |

Đây là số **giả lập trên CPU 16 lõi**; SwiftShader/Canvas trên PC lớp học 2–4 lõi sẽ **tệ hơn** đáng kể.

## 9. Giới hạn của phép đo (ghi rõ)

1. **Không có máy yếu thật.** "×4", SwiftShader, WebGL tắt chỉ là giả lập. Hệ số ×4 không nhất quán (mục 2.1).
2. **Một máy duy nhất**, 16 lõi, GPU Intel Arc; SwiftShader ở đây chạy đa luồng mạnh hơn PC cũ.
3. **Headless Chrome**, không có thanh địa chỉ/extension; accessibility overhead trong trace có thể là hiện vật.
4. **Tracing** thêm overhead; chỉ 1 lượt mỗi cấu hình (không có biên nhiễu cho trace).
5. **Cache trình duyệt tắt** trong A/A; server dev không giống hosting thật (header cache, HTTP/2, nén).
6. **RAM thấp chỉ được theo dõi chứ chưa ép**: trống 2,5–4,2 GB trong A/A (0,56 GB ở lượt smoke). Chưa có thử nghiệm giới hạn RAM cho trình duyệt.
7. **Chạy trùng/đồng thời chưa thử** (A/A chạy tuần tự); CPU nền hệ thống 10–40% là nguồn nhiễu đã ghi nhận.
8. **Flow không gồm luồng thẻ bài** (để riêng theo quyết định của bạn), cũng không gồm audio.
9. Số mẫu ở ma trận dự phòng và các mức suy giảm chỉ **3 lượt** — dùng để định hướng rủi ro, không để so sánh nhỏ.
10. Tab ẩn/hiện chỉ giả lập; `file://` chỉ kiểm tra khả năng mở và dữ liệu lỗi.

## 10. Đề xuất mục tiêu (0.8) — **chờ bạn duyệt, chưa khóa**

Nguyên tắc: mục tiêu là cải thiện **vượt biên nhiễu** ở mục 2; mỗi hồi quy cho phép = IQR gộp. Nhóm hiệu năng nào cũng phải giữ các điều kiện **bắt buộc** (không mất chức năng/dữ liệu, hình ảnh trong ngưỡng, bộ nhớ kiểm soát, đường dự phòng ở mục 8 vẫn chạy).

### 10.1 Chỉ số bắt buộc phải đạt

| Chỉ số | Baseline (trung vị) | Hồi quy tối đa | Mục tiêu đề xuất |
|---|---|---|---|
| Vào bản đồ ×4, `curtainReveal` | 11,1 s | +1,6 s | **≤ 6 s** (sau khi pilot GĐ2 xác nhận khả thi) |
| Vào bản đồ ×4, `firstGroundFrame` | 2,3 s | +1,1 s | giữ ≤ 2,3 s (đã khá tốt) |
| Vào bản đồ: LoAF lớn nhất ×4 | 1,69 s | +0,29 s | **≤ 0,6 s** (nhắm callback `memory-reference-v2.js`) |
| Vào bản đồ: LoAF lớn nhất ×1 | 349 ms | không đáng tin (nhiễu 77%) | ≤ 150 ms, đo bằng n ≥ 20 |
| Forced layout+style khi vào bản đồ ×4 | 1,83 s (trace) | — | ≤ 0,7 s |
| Tải trước cổng (byte truyền) | 13,6 MiB | không tăng | **≤ 5,4 MiB** nếu hoãn được 3 nhóm; còn lại là mục tiêu sau thí nghiệm GĐ1 |

### 10.2 Chỉ số hiệu năng theo luồng (hồi quy tối đa = IQR gộp)

| Luồng | Chỉ số | Baseline ×1 | Baseline ×4 | Mục tiêu đề xuất ×4 |
|---|---|---|---|---|
| Cổng | `gateReady` trong trang | 436 ms | 2.619 ms | ≤ 1.800 ms |
| Mở đầu | FPS / CPU bận | 59,5 / 34% | 52,2 / 88% | ≥ 56 / ≤ 65% |
| Trang chủ | FPS / CPU bận | 58,5 / 40% | 51,0 / 91% | ≥ 56 / ≤ 70% (không đòi FPS khi cảnh thật sự tĩnh) |
| Kéo | FPS | 58,4 | 49,6 | ≥ 55 |
| Xoay | FPS / p95 khung | 57,4 | 35,4 / 54 ms | ≥ 45 / ≤ 34 ms |
| 2D/3D | FPS | 57,8 | 37,2 | ≥ 45 |
| Bay tới ga | FPS | 48,2 | 35,5 | ≥ 45 |

Các mục tiêu ×4 chỉ có ý nghĩa như chỉ số **tương đối so với baseline**, vì ×4 không là hệ số chậm cố định.

### 10.3 Điểm cần bạn quyết định về rủi ro nhóm B

Đã loại GĐ5 theo yêu cầu của bạn. Nhưng GĐ0 cho thấy ở mức suy giảm (không GPU: SwiftShader hoặc WebGL tắt), **mở đầu chỉ 2–7 FPS** ngay cả trên máy 16 lõi. Với nhóm A (không đổi hình), giảm chi phí mỗi khung có thể cải thiện nhưng **không thể kéo những mức này lên mượt**. Nếu máy lớp học có thể rơi vào nhóm đó, bạn nên cân nhắc lại một phương án dự phòng (ví dụ cảnh trang chủ đơn giản hơn trong chế độ không GPU) **ở một giai đoạn sau, riêng và có duyệt riêng**. Đề xuất: trước buổi trình chiếu, mở thử `chrome://gpu` trên máy lớp học để biết có tăng tốc phần cứng hay không.

## 11. Tệp tạo ra và cách chạy lại

- `map-surroundings-preview-5.html` — bản sao y hệt preview-4 (sha256 trùng).
- `tools/perf/`: `lib.cjs`, `server.cjs`, `flow.cjs` (flow chính, tham số `--cpu --gpu --net --cache --reps --out`), `aa-batch.sh`, `analyze-aa.cjs`, `cpu-calib.cjs`, `trace.cjs`, `inventory.cjs`, `fallback.cjs`, `degraded-batch.sh`.
- `tools/perf/results/gd0/`: `aa-*.jsonl` (40 lượt), `aa-summary.md|json`, `cpu-calib.json`, `trace-p4-x1.json`, `trace-p4-x4.json`, `inventory-p4.json`, `env.json`, `fallback-*.json`, `deg-*.jsonl`, `smoke.jsonl`.
- Chạy lại: `node tools/perf/server.cjs` (cổng 8770) rồi `bash tools/perf/aa-batch.sh 10`, `node tools/perf/analyze-aa.cjs`, `node tools/perf/trace.cjs --cpu 4 --label p4-x4`, `node tools/perf/fallback.cjs`, `bash tools/perf/degraded-batch.sh`.
- Playwright và Chrome lấy từ đường dẫn trong `lib.cjs` (ghi đè bằng biến môi trường `PLAYWRIGHT_PATH`, `CHROME_PATH`).

## 12. Cần bạn duyệt trước khi sang GĐ1

1. Bộ quy tắc "vượt biên nhiễu" (mục 2) và bảng mục tiêu đề xuất (mục 10): duyệt, sửa hoặc từ chối từng dòng.
2. Có làm GĐ1 hay dừng ở GĐ0?
3. Có muốn kiểm tra thêm, trước GĐ1, ở môi trường gần thật hơn (ví dụ giới hạn RAM, chạy trùng, hoặc chạy trên máy lớp học nếu có)?

# Báo cáo Pha 2 — Triển khai và nghiệm thu "Phương án 2 thu gọn" cho A-04 và A-03 (preview-5)

- **Nhánh & mốc đối chiếu**: nhánh `p5-05`, bản nền `HEAD = f85e7d1`, bản mới = cây làm việc hiện tại (chưa commit, chưa push, chưa xóa tệp nào được git theo dõi).
- **Tài liệu liên quan**: [AGENTS.md](file:///d:/HCMUS/vietnam-heritage-map-2/AGENTS.md), [BAO-CAO-A-DO-HOA-WEBGL.md](file:///d:/HCMUS/vietnam-heritage-map-2/docs/06-ra-soat-chuyen-sau/BAO-CAO-A-DO-HOA-WEBGL.md), [BAO-CAO-A-03-04-PHA-1.md](file:///d:/HCMUS/vietnam-heritage-map-2/docs/06-ra-soat-chuyen-sau/BAO-CAO-A-03-04-PHA-1.md).
- **Quy ước gắn nhãn**:
  - `đã đo`: số liệu định lượng thu trực tiếp từ A/B benchmark (`n = 10` mỗi bên), trace Chromium, bộ đếm API, phép đo hình học, phép đo pixel-diff và Canvas fallback.
  - `đã tái hiện`: trạng thái giao diện / hành vi / kết quả kiểm tra trực tiếp trên trình duyệt thật.
  - `suy luận từ mã`: giải thích nhân quả từ mã nguồn và đề xuất bước tiếp theo.

---

## 1. Các thay đổi đã thực hiện theo đúng 8 mục được duyệt

Toàn bộ chỉnh sửa giới hạn trong `map-surroundings-preview-5.html`, các tệp tài nguyên riêng hậu tố `-5`, tệp tách mới `heritage-frame-5.js` và `offline-manifest-5.js` dựng lại. Không chỉnh sửa `index.html`, `map-surroundings-preview(-2/-3/-4).html`, `map-surroundings-preview-5-arrival-demo.html`, `card-testing.html`, `heritage-frame.js`, `webgl-coverage-3.js`, `province-legibility-5.js`, hay bất kỳ tệp CSS nào.

| Mục | Tệp : dòng đã sửa / tạo | Nội dung đã thực hiện |
|---:|---|---|
| **1** | [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L4182-L4255), [L8661–L8739](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8661-L8739), [L9109–L9120](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L9109-L9120) | • Chuyển `ctx.font`, `ctx.textAlign`, `ctx.measureText(label)`, `halfLabelWidth`, `leftEdge/rightEdge`, `labelX` vào bên trong nhánh fallback `if (!window.GoiVietRegionalPreview?.paintIslandLabel(...))` (`L9109–9120`).<br>• Gộp `syncHeaderOffset()` và `syncMapControlLayout(cachedRects)` theo thứ tự đọc-trước-ghi-sau; chỉ `setProperty` `--header-offset`, `--dock-offset`, `--map-center-x`, `--map-space-width` khi chuỗi giá trị đổi; bỏ cặp ghi trùng cuối `syncHeaderOffset()`; bỏ lần đọc trùng `dock.getBoundingClientRect()` (ở đợt sửa bổ sung Mục 9.2 đã bỏ `effectiveDockRect` và đo lại `dock.getBoundingClientRect()` thật đúng 1 lần khi `centerChanged`, ngược lại tái dùng `dockRect`); truyền `finalDockRect` và `headerRect` xuống `GoiVietMapControlPlacement.sync(...)` và `GoiVietJourneyPreview.adjustControlLayout(...)`.<br>• Trỏ `heritage-frame.js` → `heritage-frame-5.js` (`L4189`) và nâng `?v=20261126-a04-1` cho các tài nguyên JS đã đổi/thêm (riêng `arrival-demo-5.js` nâng tiếp lên `?v=20261126-a04-2` ở Mục 9.2). |
| **2** | [polish-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/polish-arrival-5.js#L37-L39) | • `setCollapsed()`: thoát sớm khi `collapsed`, `panel.hidden` và lớp `preview-panel-collapsed` đã khớp giá trị mới (vẫn xử lý `focus` nếu được yêu cầu).<br>• `animateLayout()`: bỏ lệnh gọi `syncHeaderOffset()` đồng bộ thừa và gom vào 1 `rAF` trước khung vẽ kế tiếp. |
| **3** | [arrival-demo-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L114-L121), [L167](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L167), [L253](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L253), [L289-L330](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L289-L330) | • `closeList()`: chỉ gọi `setCollapsed(true)` khi danh sách đang mở (`!panel.hidden \|\| !preview-panel-collapsed`).<br>• `openSheet()` gọi `refresh({ fit: false })`, bỏ lời gọi `fitSheet()` đồng bộ đầu tiên và chạy `fitSheet()` đúng 1 lần trong rAF của `focusCurrent()` (trước khi trình duyệt vẽ khung mở phiếu); khi phiếu đã mở sẵn (đổi VI↔EN, rút thẻ) `refresh()` vẫn gọi `fitSheet()` ngay như cũ. |
| **4** | [journey-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L14), [L102-L106](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L102-L106), [L152-L185](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L152-L185), [L225-L228](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L225-L228) | • `adjustControlLayout(dockRect)`: nhận `dockRect` tùy chọn (thiếu thì tự đọc `.bottom-dock`), chỉ đặt `barLayoutDirty = true` khi khóa vị trí/kích thước `dock` thực sự đổi.<br>• `syncControls()`: bỏ gọi `positionBar()` đồng bộ ngay sau loạt ghi `.hidden`, gom vào 1 `rAF` (`scheduleBarPosition`) trước lần vẽ kế; nếu `focus()` chạy lần đầu trước khi `bar` có `dataset.position`, hoãn `focus()` chạy ngay sau `positionBar()` trong cùng `rAF` đó. |
| **5** | [map-controls-island-reference-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-controls-island-reference-5.js#L46-L56) | • `sync(canvasRect, dockRect, headerRect)`: tái dùng `headerRect` nếu được truyền (fallback tự đọc `.top-header` cho `arrival-demo`), chỉ ghi `--gv-camera-menu-height` khi giá trị chuỗi đổi. |
| **6** | [heritage-frame-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/heritage-frame-5.js) *(tạo mới, 145 dòng)* | • Tách mới từ `heritage-frame.js` (giữ nguyên `heritage-frame.js` cho các bản khác và giữ nguyên global `GoiVietHeritageFrame`, `GoiVietMapFrame`).<br>• Chỉ ghi `--hf-scale` khi đổi; cache `insets()` và `obstacleBounds` khi `active()` có kích thước khác 0; xóa cache khi resize (`window.resize` + `ResizeObserver` trên `scene`, `.top-header`, `.bottom-dock`), đổi ngôn ngữ (`goiviet:langchange`), đổi theme (`MutationObserver` `data-theme`), `document.fonts` `ready`/`loadingdone`, và khi `active()` đổi. |
| **7** | [preview-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L124-L135), [L259-L283](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L259-L283), [L346-L350](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L346-L350), [L373](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L373), [L433](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L433), [L462-L463](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L462-L463), [L599](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L599), [L626](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L626) | • `panBy`: chỉ gọi `mainCanvas.getBoundingClientRect()` khi `x == null \|\| y == null`.<br>• Đổi ẩn/hiện `overviewCanvas`, `coverageCanvas`, `background` sang `style.display` (`'none'` / `''`) qua `setCanvasVisible()` (chỉ ghi khi đổi); khi hiện `coverageCanvas` xóa thêm `hidden = false` nếu `webgl-coverage-3.js` đã đặt `hidden = true`; khởi tạo `coverageCanvas` giữ `hidden = true` + `display = 'none'` để `webgl-coverage-3.js:56` không ghi lại `.hidden` trên WebGL; cập nhật `inspect()` dùng `isCanvasVisible()` (`!hidden && style.display !== 'none'`). Đã quét toàn bộ `assets/` và `tools/*.cjs`: không có script kiểm nào khác đọc `.hidden` của 3 canvas này. |
| **8** | [label-performance-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/label-performance-arrival-5.js#L65) | • `measure()`: thay `JSON.stringify([...])` bằng nối chuỗi phân cách `'\0'`, giữ nguyên đủ 9 thành phần (`font`, `fontKerning`, `fontStretch`, `fontVariantCaps`, `letterSpacing`, `wordSpacing`, `textRendering`, `direction`, `text`). |
| **Gói ngoại tuyến** | [offline-manifest-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | • Chạy `python tools/build-preview-5-offline.py` (`643 resources; 180.02 MB; f01e9efbeae6e56b` sau đợt sửa bổ sung Mục 9.2, đã thay `heritage-frame.js` bằng `heritage-frame-5.js`) và `python tools/build-preview-5-offline.py --check` ⇒ **PASS** (`đã tái hiện`). |

### Kiểm tra phạm vi tệp (`git diff --stat` sau Mục 9.2, `đã tái hiện`)
```text
 assets/goi-viet/map-controls-island-reference-5.js |  7 +-
 .../arrival-demo-5/arrival-demo-5.js               | 40 +++++-----
 .../arrival-demo-5/journey-arrival-5.js            | 33 ++++++--
 .../arrival-demo-5/label-performance-arrival-5.js  |  2 +-
 .../arrival-demo-5/polish-arrival-5.js             |  4 +-
 .../map-surroundings-preview/offline-manifest-5.js | 22 ++---
 .../goi-viet/map-surroundings-preview/preview-5.js | 38 +++++----
 map-surroundings-preview-5.html                    | 93 +++++++++++++---------
 8 files changed, 143 insertions(+), 96 deletions(-)
 (+ tệp mới: assets/goi-viet/map-surroundings-preview/heritage-frame-5.js)
```

---

## 2. Kết quả đo A/B trước / sau (WebGL GPU thật, `n = 10` mỗi bên) — `đã đo`

- **Thiết lập đo**: Chrome 157 thật, GPU `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`, `1920×1080`, `DPR 1`, CPU throttle `×4`, bản đồ đã ổn định (`backdropPad = 260`, `terrainActive = true`), máy chủ `node tools/perf/server.cjs` (cổng `8770`).
- **Đối chứng A/B sạch**: bản nền (`base`) phục vụ byte gốc `HEAD = f85e7d1` qua `page.route` cho đúng 8 tệp đã đổi và `unroute` ngay sau khi trang nạp xong (trước khi vào bất kỳ pha đo nào); bản mới (`new`) nạp trực tiếp từ cây làm việc. Tổng cộng **60 tiến trình Chrome mới độc lập** (`10` vòng xen kẽ `base/new` ở vòng lẻ, `new/base` ở vòng chẵn), `0` lỗi ở cả 60 phiên. Dữ liệu thô tại [ab-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/ab-summary.json).
- **Quy tắc kết luận bắt buộc**: chỉ ghi **"Cải thiện"** (hoặc **"Xấu đi"**) khi `|Δ trung vị| ≥ IQR bản nền` **VÀ** kiểm định Mann–Whitney hai phía `p < 0,05`. Các trường hợp khác ghi **"Không đủ ngưỡng"** (kể cả khi `p < 0,05` nhưng `|Δ| < IQR bản nền`).

| Kịch bản | Chỉ số | Bản nền `f85e7d1` Trung vị (Q1–Q3; IQR) | Bản mới Trung vị (Q1–Q3; IQR) | `Δ` Trung vị | Mann–Whitney `U` | `p` (2 phía) | Kết luận |
|---|---|---:|---:|---:|---:|---:|---|
| **(a) VI: Chọn Hà Nội + bay + mở phiếu ga** | **FPS** | 26,17 (22,73–29,10; IQR 6,37) | **30,50** (28,86–31,30; IQR 2,44) | +4,33 | 26,0 | 0,07526 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 1785,40 (1705,95–1914,50; IQR 208,55) | **1594,90** (1557,50–1674,45; IQR 116,95) | -190,50 | 13,0 | 0,00389 | Không đủ ngưỡng *(`|Δ| < IQR`)* |
| | **`maxGap` (ms)** | 341,65 (300,00–364,55; IQR 64,55) | **246,00** (216,60–266,68; IQR 50,08) | **-95,65** | **5,5** | **0,00086** | **Cải thiện** |
| **(b) VI: Bay riêng tới Huế (không mở phiếu)** | **FPS** | 34,42 (28,55–38,00; IQR 9,45) | 34,41 (28,69–36,58; IQR 7,89) | -0,01 | 44,5 | 0,70525 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 549,80 (546,48–559,75; IQR 13,27) | 561,05 (549,22–591,60; IQR 42,38) | +11,25 | 36,0 | 0,31500 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 66,65 (50,10–66,70; IQR 16,60) | 50,10 (50,02–66,67; IQR 16,65) | -16,55 | 37,0 | 0,33184 | Không đủ ngưỡng |
| **(c) VI: Kéo trái 14 bước (ổn định)** | **FPS** | 51,77 (50,65–53,54; IQR 2,90) | 52,72 (51,88–54,34; IQR 2,46) | +0,95 | 36,0 | 0,31500 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 1015,80 (953,70–1095,95; IQR 142,25) | 987,65 (942,62–1016,53; IQR 73,90) | -28,15 | 35,0 | 0,27986 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 50,00 (49,92–50,08; IQR 0,15) | 33,40 (33,40–50,00; IQR 16,60) | -16,60 | 27,5 | 0,08212 | Không đủ ngưỡng |
| **(d) VI: Xoay phải 14 bước (ổn định)** | **FPS** | 37,01 (36,12–38,53; IQR 2,42) | 38,80 (35,48–41,18; IQR 5,71) | +1,79 | 37,0 | 0,35268 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 883,90 (863,08–921,38; IQR 58,30) | 834,35 (793,12–914,67; IQR 121,55) | -49,55 | 32,0 | 0,19032 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 133,40 (120,78–150,00; IQR 29,22) | 116,75 (83,40–133,30; IQR 49,90) | -16,65 | 26,0 | 0,07434 | Không đủ ngưỡng |
| **(e-a) EN: Chọn Hà Nội + bay + mở phiếu ga** | **FPS** | 25,17 (22,47–27,02; IQR 4,55) | **29,05** (27,05–29,60; IQR 2,55) | +3,88 | 15,0 | 0,00684 | Không đủ ngưỡng *(`|Δ| < IQR`)* |
| | **Thời gian (ms)** | 1778,45 (1714,08–1898,33; IQR 184,25) | **1622,70** (1572,45–1657,38; IQR 84,92) | -155,75 | 6,0 | 0,00032 | Không đủ ngưỡng *(`|Δ| < IQR`)* |
| | **`maxGap` (ms)** | 350,00 (300,10–387,52; IQR 87,42) | **233,30** (220,78–245,85; IQR 25,07) | **-116,70** | **4,0** | **0,00057** | **Cải thiện** |
| **(e-c) EN: Kéo trái 14 bước (ổn định)** | **FPS** | 54,13 (51,67–56,34; IQR 4,66) | 53,34 (51,91–55,72; IQR 3,80) | -0,79 | 41,0 | 0,52037 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 985,80 (944,55–1031,75; IQR 87,20) | 973,30 (939,30–1047,17; IQR 107,87) | -12,50 | 47,0 | 0,85343 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 41,70 (33,40–50,08; IQR 16,68) | 33,40 (33,40–45,85; IQR 12,45) | -8,30 | 45,5 | 0,74505 | Không đủ ngưỡng |
| **(e-d) EN: Xoay phải 14 bước (ổn định)** | **FPS** | 36,94 (35,31–39,37; IQR 4,06) | 38,38 (36,73–43,16; IQR 6,42) | +1,44 | 34,0 | 0,24097 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 882,20 (804,48–916,12; IQR 111,65) | 832,95 (764,58–885,68; IQR 121,10) | -49,25 | 35,0 | 0,27986 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 125,00 (116,70–162,47; IQR 45,77) | 91,70 (70,85–129,10; IQR 58,25) | -33,30 | 24,5 | 0,05802 | Không đủ ngưỡng |

**Tóm tắt A/B (`đã đo`)**:
- **Không có bất kỳ chỉ số nào xấu đi** (`0/21` chỉ số "Xấu đi").
- **2/21 chỉ số đạt ngưỡng "Cải thiện"**: `maxGap` của **(a) VI `fly`** giảm `-95,65 ms` (`341,65 → 246,00 ms`, `p = 0,00086`) và `maxGap` của **(e-a) EN `fly`** giảm `-116,70 ms` (`350,00 → 233,30 ms`, `p = 0,00057`).
- **3 chỉ số khác của `fly` có `p < 0,007`** nhưng `|Δ|` hơi nhỏ hơn `IQR` bản nền nên giữ đúng nhãn "Không đủ ngưỡng": VI `ms` (`-190,50 ms` vs `IQR 208,55`, `p = 0,00389`), EN `ms` (`-155,75 ms` vs `IQR 184,25`, `p = 0,00032`), EN `FPS` (`+3,88` vs `IQR 4,55`, `p = 0,00684`). Ngoài ra, độ phân tán `IQR` của `fly` cũng thu hẹp mạnh (VI FPS `IQR 6,37 → 2,44`, EN `maxGap IQR 87,42 → 25,07`).

---

## 3. So sánh trace Chromium và bộ đếm API (Pha 1 vs Pha 2) — `đã đo`

Chạy `1` phiên trace riêng và `1` phiên đếm API riêng cho từng kịch bản trên bản mới (không tính vào thống kê `n = 10`). Dữ liệu trích xuất tại [trace-drilldown-p2.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/trace-drilldown-p2.json) và [counters-summary-p2.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/counters-summary-p2.json). Raw trace và hồ sơ Chrome tạm tại `verification/audit-06/a03-a04-tmp/` đã được dọn sạch.

| Kịch bản | `getBoundingClientRect` (Pha 1 → Pha 2) | Forced `UpdateLayoutTree` n / tổng / max ms (Pha 1 → Pha 2) | Normal `UpdateLayoutTree` tổng ms (Pha 1 → Pha 2) | Forced `Layout` n / tổng ms (Pha 1 → Pha 2) | Normal `Layout` tổng ms (Pha 1 → Pha 2) | `measureText` (Pha 1 → Pha 2) | `drawImage` (Pha 1 → Pha 2) |
|---|---:|---:|---:|---:|---:|---:|---:|
| **(a) VI `fly`** | **309 → 128** (-58,6%) | 62 / 458,1 / 116,6 → **61 / 301,3 / 105,8** | **293,4 → 101,8** | 10 / 28,6 → **8 / 24,3** | 65,1 → **43,6** | **280 → 107** (-61,8%) | 66 → 50 |
| **(e-a) EN `fly`** | **309 → 128** (-58,6%) | 74 / 337,3 / 87,2 → **62 / 275,0 / 83,8** | **181,2 → 103,8** | 10 / 23,2 → 8 / 29,3 | 30,1 → 36,5 | **275 → 105** (-61,8%) | 70 → 61 |
| **(b) VI `focus_hue`** | 0 → 0 | 31 / 79,3 / 50,3 → **37 / 66,9 / 30,6** | 0 → 0 | 1 / 3,4 → 1 / 2,5 | 0 → 0 | **117 → 32** (-72,6%) | 74 → 71 |
| **(c) VI `drag`** | **29 → 15** (-48,3%) | 46 / 36,1 / 2,8 → 43 / 40,1 / 3,1 | 50,2 → 57,6 | 0 → 0 | 0 → 0 | **65 → 1** (-98,5%) | 139 → 147 |
| **(e-c) EN `drag`** | **29 → 15** (-48,3%) | 42 / 27,6 / 1,2 → 42 / 35,4 / 1,6 | 47,4 → 56,5 | 0 → 0 | 0 → 0 | **65 → 1** (-98,5%) | 117 → 109 |
| **(d) VI `rotate`** | 15 → 15 | 34 / 80,1 / **48,2** → **33 / 47,7 / 5,65** | 48,6 → 66,0 | **1 / 1,4 → 0 / 0** | 0,8 → 2,2 | **65 → 1** (-98,5%) | 81 → 97 |
| **(e-d) EN `rotate`** | 15 → 15 | 34 / 54,8 / **30,0** → **33 / 26,2 / 1,40** | 39,7 → 40,2 | **1 / 1,2 → 0 / 0** | 0,6 → 1,5 | **65 → 1** (-98,5%) | 69 → 109 |

**Giải thích điểm nghẽn còn lại từ trace (`đã đo` + `suy luận từ mã`)**:
1. Trong `fly`, callback `polish-arrival-5.js:37` đã giảm từ **115,1 ms → 0 ms** (VI) và **91,9 ms → 0 ms** (EN); `arrival-demo-5.js:53` giảm từ **181,5 → 88,9 ms** (VI) và **118,7 → 83,4 ms** (EN); `insets()` của khung di sản giảm từ **52 → ~4** lần `gBCR`; `adjustControlLayout()` giảm từ **36 → 11** lần `gBCR`.
2. Phần `UpdateLayoutTree` còn lại trong `fly` (`301,3 + 101,8 = 403,1 ms` ở VI) nằm ở hai chỗ ngoài phạm vi thu gọn:
   - Các bộ chọn `:has(#introScreen.intro-hidden)` / `:has([hidden])` trong CSS vẫn gây recalc toàn trang (~84–106 ms/lần) mỗi khi `hint.hidden`, `bar.hidden`, `clearButton.hidden`, `sheet.hidden` đổi.
   - Trong `heritage-frame-5.js`, `ResizeObserver` theo dõi `.bottom-dock` (theo đúng mục 6 đã duyệt) bị kích hoạt khi `#btnClearJourney` hiện lên làm `.bottom-dock` rộng thêm 40 px → xóa cache và đo lại `8` `obstacleBounds` cùng 1 lượt `syncSafeArea()` dư (`heritage-frame-5.js:103` còn `195,8 ms` ở VI, bao gồm phần recalc sau `sheet.hidden = false`).
3. Trong `rotate`, cú `ForcedStyle` cực đại đã giảm rất mạnh (`48,2 → 5,65 ms` VI; `30,0 → 1,40 ms` EN) nhờ bỏ `.hidden` trên `overviewCanvas`. Phần thời gian còn lại (~830 ms) đến từ `paintLabels` chạy `4` lượt bố cục đầy đủ + GC (`province-legibility-5.js`), `paintLandmarks` vẽ trực tiếp 4 ảnh SVG, và `webgl-coverage-3.js` (đều thuộc danh sách không được làm ở đợt này).

---

## 4. Đối chiếu hình học trạng thái tĩnh (`≤ 1 px`) trên 3 viewport và 2 tình huống động — `đã đo`

Chạy xen kẽ `base (f85e7d1)` và `new` với **`n = 10` lượt cho mỗi tình huống**, đo tọa độ cuối sau khi ổn định (`left, top, width, height`) của `#arrivalSheet`, `#journeyRouteBar`, `.top-header`, `.bottom-dock`, `.left-helper`, `#stationPanel` (khi mở), các nút điều khiển (`#previewPanelOpen`, `#btnRecenterMap`, `#btnRandomTicket`, `#headerSettings > summary`, `#arrivalExplore`), `mapCompass` và `mapScreenArea`. Kết quả chi tiết tại [geom-demo-report.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/geom-demo-report.json).

> **Đính chính phạm vi kết luận `0,00 px`**: phép đo tại bảng này chỉ đối chiếu **vị trí cuối ở trạng thái ổn định giữa bản nền (`base`) và bản mới (`new`)** trên các lượt đơn lẻ, **không** kiểm độ tươi của cache bố cục (`cache vs đọc mới`) sau chuỗi chuyển cảnh / đổi kích thước / hiệu ứng `arrival-sheet-in` liên tiếp. Phép kiểm độ tươi của cache và đợt sửa bổ sung được trình bày tại [Mục 9](#9-đợt-sửa-bổ-sung-xác-nhận-cache-bố-cục-sửa-2-điểm--nghiệm-thu-lại).

| Tình huống kiểm hình học | n (cặp A/B) | Sai lệch lớn nhất (`maxDelta`) | Số phần tử lệch `> 1 px` | Lỗi console / pageerror | Kết luận |
|---|---:|---:|---:|---:|---|
| `1920×1080` (mở `#stationPanel` + mở `#arrivalSheet`) | 10 | **0,00 px** | 0 | 0 | **PASS** |
| `1366×768` (mở `#stationPanel` + mở `#arrivalSheet`) | 10 | **0,00 px** | 0 | 0 | **PASS** |
| `1024×768` (mở `#stationPanel` + mở `#arrivalSheet`) | 10 | **0,00 px** | 0 | 0 | **PASS** |
| Đổi kích thước cửa sổ khi phiếu mở (`1920×1080 → 1366×768 → 1024×768`) | 10 | **0,00 px** | 0 | 0 | **PASS** |
| Đổi ngôn ngữ `VI ↔ EN` khi phiếu đang mở (`1366×768`) | 10 | **0,00 px** | 0 | 0 | **PASS** |

---

## 5. Ảnh đối chiếu trước / sau — `đã đo` & `đã tái hiện`

Đã chụp đủ **36 ảnh (`18` cặp `base` vs `new`)** tại [verification/audit-06/a03-a04-phase2/snaps/](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/) (danh mục đầy đủ tại [snaps-manifest.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps-manifest.json)), phủ đủ: toàn cảnh biên khung di sản (`01-overview`), sau xoay (`02-after-rotate`), sau bay mở phiếu ga Hà Nội (`03-after-fly-hn`), Huế (`04-after-fly-hue`), TP.HCM (`05-after-fly-hcm`), ở cả **VI và EN**, **Sáng và Tối**.

- **Kiểm định lượng điểm ảnh (`base` vs `new`, `đã đo`)**:
  - 11/18 cặp giống hệt nhau từng điểm ảnh (`diff > 3 = 0,000%`, `maxDiff = 0–1`), bao gồm **toàn bộ 4 cặp `01-overview`**, **toàn bộ 4 cặp `02-after-rotate`**, **2 cặp `05-after-fly-hcm`** và `vi-dark-04-after-fly-hue`.
  - 7 cặp `03-after-fly-hn` / `04-after-fly-hue` còn lại lệch rất nhỏ `0,016%–0,406%` điểm ảnh do `focusCurrent()` bỏ 1 `rAF` chờ nên camera êm tới đích sớm hơn đúng 1 khung tại mốc chụp `600 ms` (`suy luận từ mã`).
- **Kiểm tra trực quan bằng mắt (`đã tái hiện`)** trên các cặp đại diện ([new-vi-light-01-overview.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-vi-light-01-overview.png), [base/new-vi-light-02-after-rotate.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-vi-light-02-after-rotate.png), [base/new-vi-light-03-after-fly-hn.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-vi-light-03-after-fly-hn.png), [new-vi-dark-02-after-rotate.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-vi-dark-02-after-rotate.png), [base/new-en-dark-04-after-fly-hue.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-en-dark-04-after-fly-hue.png), [new-en-light-05-after-fly-hcm.png](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/snaps/new-en-light-05-after-fly-hcm.png)):
  - Khung di sản 4 cạnh khít tuyệt đối, không lộ kẽ hở nền biển sau khi xoay hay bay.
  - Nhãn tỉnh, nhãn 3 ga Hà Nội / Huế / TP.HCM, nhãn cụm đảo Hoàng Sa / Trường Sa / Phú Quốc / Côn Đảo hiển thị rõ nét, không chồng nhãn, không che ghim ga hay đường ray, tương phản tốt ở cả Sáng và Tối, VI và EN.

---

## 6. Kết quả Canvas fallback (`--disable-webgl`) và trang độc lập `arrival-demo`

### 6.1. Đường Canvas 2D fallback (`--disable-webgl --disable-webgl2`, `n = 10` mỗi bên) — `đã đo`
- **Chức năng (`20/20` phiên)**: đủ `34` tỉnh (`renderedHitProvinces.length = 34`), đủ `4` cụm đảo, mở được phiếu ga Hà Nội (`fallbackSheetOpen = true`), kéo & xoay hoạt động bình thường, **`0` lỗi console / pageerror**.
- **So sánh hiệu năng A/B (`n = 10` xen kẽ, CPU `×4`, `1920×1080`)** — chi tiết tại [fallback-ab-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2/fallback-ab-summary.json):

| Kịch bản Canvas fallback | Chỉ số | Bản nền Trung vị (Q1–Q3; IQR) | Bản mới Trung vị (Q1–Q3; IQR) | `Δ` | `U` | `p` (2 phía) | Kết luận |
|---|---|---:|---:|---:|---:|---:|---|
| **Kéo trái 14 bước** | **FPS** | 22,30 (21,63–22,58; IQR 0,95) | 21,69 (21,20–22,20; IQR 1,01) | -0,61 | 36,0 | 0,30731 | Không đủ ngưỡng (không xấu đi) |
| | **Thời gian (ms)** | 2002,70 (1956,97–2061,75; IQR 104,78) | 1987,25 (1919,70–2086,70; IQR 167,00) | -15,45 | 49,0 | 0,97051 | Không đủ ngưỡng (không xấu đi) |
| | **`maxGap` (ms)** | 133,25 (116,70–133,38; IQR 16,67) | 133,30 (133,20–145,85; IQR 12,65) | +0,05 | 38,5 | 0,40068 | Không đủ ngưỡng (không xấu đi) |
| **Xoay phải 14 bước** | **FPS** | 14,54 (13,75–15,18; IQR 1,43) | 14,20 (13,91–15,43; IQR 1,52) | -0,34 | 45,0 | 0,73354 | Không đủ ngưỡng (không xấu đi) |
| | **Thời gian (ms)** | 1829,80 (1752,38–1875,65; IQR 123,28) | 1865,25 (1658,60–1926,75; IQR 268,15) | +35,45 | 46,0 | 0,79594 | Không đủ ngưỡng (không xấu đi) |
| | **`maxGap` (ms)** | 149,85 (133,40–149,97; IQR 16,57) | 133,35 (133,30–149,97; IQR 16,67) | -16,50 | 35,0 | 0,26831 | Không đủ ngưỡng (không xấu đi) |

### 6.2. Trang độc lập `map-surroundings-preview-5-arrival-demo.html` — `đã tái hiện`
- Mở trang, vào bản đồ, chọn ga Hà Nội → mở phiếu ga (`hnOpen = true`), chọn tiếp ga Huế từ danh sách → mở phiếu ga (`hueOpen = true`), đổi sang EN (`enTitle = "Huế"`): **PASS, `0` lỗi console / pageerror**.

---

## 7. Kết quả 8 bộ kiểm tự động — `đã tái hiện`

Tất cả **8/8 bộ kiểm** chạy qua `http://127.0.0.1:8770` đều **PASS** (`EXIT = 0`, không sửa bất kỳ tệp kiểm nào):

1. `node tools/check-books-5.cjs` → **PASS** (`EXIT_BOOKS=0`, 0 lỗi).
2. `node tools/check-i18n-5.cjs` → **PASS** (`EXIT_I18N=0`, 260 markup keys, 245 code keys đủ VI/EN).
3. `node tools/check-memory-v5.cjs` → **PASS** (`EXIT_MEM=0`, 0 lỗi, 8 chiều rộng đạt).
4. `node tools/verify-preview5-conversation-cards.cjs` → **PASS** (`EXIT_CARDS=0`, 6 viewport đạt).
5. `node tools/check-station-panel-5.cjs` → **PASS** (`EXIT_PANEL=0`, 6 kích thước + dark mode đạt).
6. `node tools/check-family-voyage-5.cjs` → **PASS** (`EXIT_VOYAGE=0`, 11/11 nhóm đạt).
7. `node tools/check-station-photos-5.cjs` → **PASS** (`EXIT_PHOTOS=0`, 35 ảnh + Hoàng Sa, 6 viewport × 2 ngôn ngữ, 72 khung cold-offline đạt).
8. `node tools/check-arrival-demo-5.cjs --preview-5` → **PASS** (`EXIT_ARRIVAL=0`, **61/61 ca chức năng PASS**, 0 lỗi; Perf `1366×768` & `1920×1080` `slowdownPct = 0`, `longTaskCountMedian = 0`).

---

## 8. Đánh giá trung thực từng mục & vấn đề ngoài phạm vi

### 8.1. Đánh giá từng mục đã duyệt (kèm đề xuất giữ / bỏ minh bạch)
- **Các mục có đóng góp đo được rõ ràng (`đã đo`, đề xuất GIỮ)**:
  - **Mục 1–5** (`map-surroundings-preview-5.html`, `polish-arrival-5.js`, `arrival-demo-5.js`, `journey-arrival-5.js`, `map-controls-island-reference-5.js`): đóng góp trực tiếp vào việc cắt `getBoundingClientRect` (`309 → 128`), cắt `measureText` chết (`280 → 107`, `65 → 1`), loại bỏ hoàn toàn callback `polish-arrival-5.js` (`115 ms → 0 ms`), và mang lại mức cải thiện đạt ngưỡng thống kê cho `maxGap` của `fly` (`-95,65 ms` VI / `-116,70 ms` EN ở Pha 2; `-74,95 ms` cả VI & EN ở đợt sửa bổ sung, `p < 0,0022`) với sai lệch đối chiếu vị trí cuối `base vs new` là `0,00 px` (cùng `0/20` chuỗi lệch ở phép kiểm cache vs đọc mới tại Mục 9). *Ghi chú hành vi*: trong `journey-arrival-5.js`, khi `#journeyRouteBar` vừa chuyển từ ẩn sang hiện (chưa có `dataset.position`), hàm `focus()` chạy chậm hơn 1 khung (`1 rAF`, ngay sau `positionBar()`).
  - **Mục 6 (`heritage-frame-5.js`)**: cắt `insets()` từ `52 → ~4` và `updateObstacles()` từ `24 → 8` lần `gBCR`, không còn ghi `--hf-scale` vô điều kiện, sai lệch đối chiếu trạng thái tĩnh `base vs new` là `0,00 px`. *Ghi chú*: vì mục 6 yêu cầu gắn `ResizeObserver` lên `.bottom-dock`, việc hiện nút `#btnClearJourney` trong `.bottom-dock` lúc chọn ga vẫn xóa cache `heritage-frame-5.js` một lần giữa pha `fly` dù khung di sản chỉ phụ thuộc kích thước `#mapScene`.
  - **Mục 7 (`preview-5.js`)**: cắt một nửa `gBCR` trong `drag` (`29 → 15`) và diệt cú `ForcedStyle` cực đại khi xoay (`48,2 → 5,65 ms` VI; `30,0 → 1,40 ms` EN) mà không gây hồi quy nào trên Canvas fallback (`0` lỗi). **Đánh giá trung thực A-03**: tổng thể **A-03 chưa đạt ngưỡng cải thiện FPS ổn định** — ở Pha 2 cả `drag` lẫn `rotate` VI/EN đều không đạt ngưỡng (`p = 0,24–0,52`); ở đợt sửa bổ sung (Mục 9.4), `drag` vẫn không đạt ngưỡng (`> 54 FPS` cả hai bên, `p = 0,165–0,427`) và `rotate` EN FPS không đạt ngưỡng (`p = 0,05859`) dù `rotate` VI FPS đạt ngưỡng (`+6,04 FPS`, `p = 0,00130`), vì phần lớn chi phí `rotate` vẫn nằm ở các điểm nghẽn ngoài phạm vi duyệt.
- **Mục không đo được cải thiện tách biệt trên A/B (`đã đo`, nêu để bạn quyết định giữ hay bỏ)**:
  - **Mục 8 (`label-performance-arrival-5.js:65`)**: thay `JSON.stringify` bằng nối chuỗi `'\0'` (chỉ 1 dòng) không tạo chênh lệch đạt ngưỡng trên `focus_hue` (`34,42 → 34,41 FPS, p = 0,705`) hay `drag`/`rotate` ở `n = 10` vì chi phí `JSON.stringify` nhỏ hơn biến thiên nền. Nếu bạn muốn giữ kỷ luật nghiêm ngặt "chỉ giữ mục chứng minh cải thiện đo được", có thể bỏ mục 8 (hoàn lại đúng 1 dòng); nếu ưu tiên dọn cấp phát thừa trên đường nóng với rủi ro bằng 0 thì có thể giữ.

### 8.2. Vấn đề ngoài phạm vi (chỉ ghi nhận, không sửa)
1. **Bộ chọn `:has([hidden])` trong `arrival-demo-5.css` và `legibility-5.css`** vẫn là nguồn gốc của phần `UpdateLayoutTree` lớn nhất còn lại trong pha `fly` (~403 ms ở VI, ~379 ms ở EN) khi ẩn/hiện `#arrivalStartHint`, `#journeyRouteBar`, `#btnClearJourney` và `#arrivalSheet` (`đã đo` + `suy luận từ mã`).
2. **`heritage-frame-5.js` gắn `ResizeObserver` lên `.bottom-dock`** (theo đúng đặc tả mục 6) gây 1 lượt xóa cache + `updateObstacles()` (`8` `gBCR`) khi `#btnClearJourney` hiện trong `.bottom-dock` lúc chọn ga (`đã đo`). Thực tế kích thước `.hf-rail`/`.hf-corner` chỉ phụ thuộc `scene`, còn `.top-header`/`.bottom-dock` đã có `ResizeObserver(syncHeaderOffset)` riêng tại [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8770-L8775).
3. **`arrival-demo-5.js:133` `focusRoute()`** gọi `.focus()` đồng bộ ngay sau khi `bar.hidden = false` và `hint.hidden = true`, gây ~88 ms `UpdateLayoutTree` + `Layout` trong handler click chọn ga (`arrival-demo-5.js:53`) (`đã đo` + `suy luận từ mã`).
4. **Phần còn lại của `rotate` (`~38,5 FPS`, `maxGap ~92–117 ms`) và `focus_hue` (`~34,4 FPS`)** bị chi phối bởi: `province-legibility-5.js` chạy `4` lượt relayout nhãn giữa cú xoay 14 bước kèm `MajorGC`, `preview-5.js` vẽ trực tiếp 4 ảnh SVG bằng `drawImage` mỗi khung, ghi `style.transform` trước `context.font` gây 33–43 lượt Forced `UpdateLayoutTree` nhỏ (~1 ms/lần) trong `animateLoop`, và `webgl-coverage-3.js` (`-3` dùng chung) (`đã đo`).
5. Cảnh báo `LF will be replaced by CRLF` của git trên `journey-arrival-5.js` và `label-performance-arrival-5.js` do hai tệp gốc trên `HEAD` dùng kết thúc dòng LF trong khi cấu hình git trên Windows bật `autocrlf`.

---

## 9. Đợt sửa bổ sung (xác nhận cache bố cục, sửa 2 điểm & nghiệm thu lại)

Đợt sửa bổ sung xử lý 2 phát hiện từ rà soát độc lập sau Pha 2: (1) rủi ro giữ số đo bố cục cũ khi `#arrivalSheet` kết thúc hiệu ứng `arrival-sheet-in` (`translate: 28px 0 → 0 0`) và (2) nhánh `effectiveDockRect` tự suy đoán trong `syncMapControlLayout()` nằm ngoài phạm vi duyệt và sai khi bề rộng `.bottom-dock` bị giới hạn bởi `max-width`.

### 9.1. Việc 1 — Phép kiểm "cache vs đọc mới" trước khi sửa (`n = 20` chuỗi mỗi bên) — `đã đo` & `suy luận từ mã`

- **Phương pháp**: dựng [review-a04-cache.cjs](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/review-a04-cache.cjs) phục vụ bản `HEAD = f85e7d1` qua `ctx.route` từ bản trích xuất `git show HEAD:<file>` (7 tệp JS + `map-surroundings-preview-5.html`). Mỗi chuỗi chạy trên 1 trang Chrome mới độc lập qua **14 bước liên tiếp**: `1920×1080`, `1366×768`, `1024×768` (mỗi cỡ: mở phiếu Hà Nội → đóng phiếu → chọn Huế), sau đó ở `1920×1080` mở phiếu Hà Nội → đổi cỡ `1366×768` → `1024×768` → `EN` → `VI` → đổi theme Tối. Tại mỗi bước, chờ `700 ms + 2 rAF`, chụp snapshot `{mapScreenArea, mapCompass, --header-offset, --dock-offset, --map-center-x, --map-space-width, --gv-camera-menu-height, GoiVietHeritageFrame.insets(), GoiVietHeritageFrame.obstacles(), rect #arrivalSheet/.bottom-dock/.journey-route-bar/.top-header}`, sau đó phát `resize` + `syncMapControlLayout(null)` + `syncHeaderOffset()`, chờ lại và đối chiếu khớp tuyệt đối.
- **Kết quả trước khi sửa (`n = 20` chuỗi xen kẽ, 40 tiến trình Chrome mới, `đã đo`)** — dữ liệu tại [cache-check-viec1.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/cache-check-viec1.json):
  - **`HEAD f85e7d1`**: **0/20 chuỗi lệch** (`0/280` bước, `0` lỗi).
  - **Bản mới Pha 2 (trước Việc 2)**: **0/20 chuỗi lệch** (`0/280` bước, `0` lỗi).
- **Giải thích cơ chế lỗi race (`suy luận từ mã`)**: dù trong 20 chuỗi chạy độc lập này điều kiện tranh chấp không nổ, phân tích mã xác nhận lỗi mà rà soát độc lập ghi nhận (`1/11` chuỗi lệch `28 px` ở `mapScreenArea.right` và `14 px` ở `--map-center-x` / `.bottom-dock` / thanh hành trình / la bàn) là có cơ sở rõ ràng:
  1. `#arrivalSheet` chạy animation `arrival-sheet-in 280ms` dịch `translate: 28px 0 → 0 0` ([arrival-demo-5.css:102, 291](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css#L102)), kết thúc bắn `animationend → focusCurrent()` ([arrival-demo-5.js:536](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L536)).
  2. Bản Pha 2 trước Việc 2 bỏ qua `syncHeaderOffset()` trong `focusCurrent()` khi `GoiVietMapFrame.active()` đúng, chỉ dựa vào `syncSafeArea()`. Nếu `syncSafeArea()` thoát sớm vì `pending || syncing` ngay tại nhịp kết thúc `arrival-sheet-in`, lần đồng bộ bố cục cuối sau `animationend` không diễn ra, để lại rect cũ đang dịch `28 px`.
  3. Ngoài ra, nhánh suy đoán `effectiveDockRect` theo `--map-center-x` trong `syncMapControlLayout()` vừa ngoài phạm vi duyệt vừa sai khi bề rộng `.bottom-dock` bị `max-width` giới hạn.

### 9.2. Việc 2 — Đúng 2 điểm sửa mã nguồn & dựng lại gói ngoại tuyến

| Điểm sửa | Tệp : dòng | Thay đổi thực hiện |
|---:|---|---|
| **1** | [arrival-demo-5.js:289–308](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L289-L308) | Trong `rAF` của `focusCurrent()`, khôi phục lời gọi `syncHeaderOffset()` vô điều kiện (`L297`) như `HEAD`, không còn bỏ qua khi `GoiVietMapFrame.active()` là `true`. |
| **2** | [map-surroundings-preview-5.html:8697–8708](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8697-L8708), [L4255](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L4255) | Bỏ hoàn toàn `effectiveDockRect`; thay bằng `const finalDockRect = centerChanged && dock ? dock.getBoundingClientRect() : dockRect;` (`L8703`) rồi truyền `finalDockRect` xuống `GoiVietMapControlPlacement?.sync(...)` và `GoiVietJourneyPreview?.adjustControlLayout?.(...)`. Nâng `arrival-demo-5.js?v=20261126-a04-1` → `?v=20261126-a04-2` (`L4255`). |
| **Manifest** | [offline-manifest-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | Dựng lại qua `python tools/build-preview-5-offline.py` (`643 resources; 180.02 MB; f01e9efbeae6e56b`) và xác nhận `python tools/build-preview-5-offline.py --check` ⇒ **PASS** (`đã tái hiện`). |

### 9.3. Việc 3a — Kiểm tra lại "cache vs đọc mới" sau khi sửa (`n = 20` chuỗi) — `đã đo`

Chạy lại [review-a04-cache.cjs](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/review-a04-cache.cjs) (`n = 20` chuỗi, 14 bước/chuỗi) trên bản mới sau Việc 2 — dữ liệu tại [cache-check-viec3.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/cache-check-viec3.json):
- **Bản mới sau Việc 2**: **0/20 chuỗi lệch** (`0/280` bước, `0` lỗi) ⇒ **PASS**.
- **Đối chiếu `HEAD f85e7d1`** (từ Việc 1): **0/20 chuỗi lệch** (`0/280` bước, `0` lỗi).

### 9.4. Việc 3b — Đo lại A/B bản mới sau Việc 2 vs `HEAD f85e7d1` (VI & EN, `n = 10` xen kẽ) — `đã đo`

- **Thiết lập**: giữ nguyên điều kiện Pha 2 (`1920×1080`, `DPR 1`, Intel Arc D3D11, CPU throttle `×4`, `backdropPad = 260`, 40 tiến trình Chrome mới độc lập, xen kẽ `base/new`, `0` lỗi). Quy tắc kết luận: chỉ ghi **"Cải thiện"** (hoặc **"Xấu đi"**) khi `|Δ trung vị| ≥ IQR bản nền` **VÀ** `p < 0,05` (Mann–Whitney hai phía). Dữ liệu tại [phase2b-ab-bench.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/phase2b-ab-bench.json) và [ab-p2b-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/ab-p2b-summary.json).

| Kịch bản | Chỉ số | `HEAD f85e7d1` Trung vị (Q1–Q3; IQR) | Bản mới (sau Việc 2) Trung vị (Q1–Q3; IQR) | `Δ` Trung vị | Mann–Whitney `U` | `p` (2 phía) | Kết luận |
|---|---|---:|---:|---:|---:|---:|---|
| **(a) VI: Chọn HN + bay + mở phiếu** | **FPS** | 29,09 (27,88–29,84; IQR 1,96) | **32,73** (29,35–33,98; IQR 4,62) | **+3,64** | 22,0 | 0,03742 | **Cải thiện** |
| | **Thời gian (ms)** | 1656,20 (1625,35–1677,23; IQR 51,88) | **1523,35** (1478,05–1545,08; IQR 67,03) | **-132,85** | 14,0 | 0,00520 | **Cải thiện** |
| | **`maxGap` (ms)** | 291,65 (270,93–300,00; IQR 29,07) | **216,70** (216,60–229,22; IQR 12,62) | **-74,95** | **8,0** | **0,00161** | **Cải thiện** |
| **(c) VI: Kéo trái 14 bước** | **FPS** | 54,64 (53,08–55,90; IQR 2,82) | 55,58 (52,30–57,49; IQR 5,19) | +0,94 | 39,0 | 0,42718 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 944,75 (923,75–1011,43; IQR 87,68) | 928,90 (907,17–988,50; IQR 81,33) | -15,85 | 46,0 | 0,79594 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 41,70 (33,40–50,00; IQR 16,60) | 41,65 (33,32–62,45; IQR 29,12) | -0,05 | 47,5 | 0,87528 | Không đủ ngưỡng |
| **(d) VI: Xoay phải 14 bước** | **FPS** | 34,81 (33,34–36,24; IQR 2,91) | **40,85** (39,80–41,26; IQR 1,45) | **+6,04** | **7,0** | **0,00130** | **Cải thiện** |
| | **Thời gian (ms)** | 943,05 (885,48–946,23; IQR 60,75) | **810,45** (790,83–826,60; IQR 35,77) | **-132,60** | **10,0** | **0,00282** | **Cải thiện** |
| | **`maxGap` (ms)** | 158,35 (137,55–166,70; IQR 29,15) | **108,30** (99,93–116,70; IQR 16,77) | **-50,05** | **12,0** | **0,00441** | **Cải thiện** |
| **(e-a) EN: Chọn HN + bay + mở phiếu** | **FPS** | 27,24 (26,74–28,91; IQR 2,17) | **32,26** (31,05–32,89; IQR 1,84) | **+5,02** | **5,0** | **0,00021** | **Cải thiện** |
| | **Thời gian (ms)** | 1647,85 (1620,20–1674,45; IQR 54,25) | **1540,80** (1499,50–1570,47; IQR 70,97) | **-107,05** | **5,0** | **0,00021** | **Cải thiện** |
| | **`maxGap` (ms)** | 283,30 (241,75–295,85; IQR 54,10) | **208,35** (187,57–229,15; IQR 41,58) | **-74,95** | **9,0** | **0,00217** | **Cải thiện** |
| **(e-c) EN: Kéo trái 14 bước** | **FPS** | 55,98 (54,68–56,45; IQR 1,77) | 54,01 (51,76–55,06; IQR 3,30) | -1,97 | 31,0 | 0,16549 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 870,55 (853,17–907,08; IQR 53,90) | 916,65 (897,20–947,08; IQR 49,88) | +46,10 | 27,0 | 0,08921 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 33,40 (33,40–49,98; IQR 16,58) | 33,50 (33,40–49,98; IQR 16,58) | +0,10 | 43,0 | 0,60541 | Không đủ ngưỡng |
| **(e-d) EN: Xoay phải 14 bước** | **FPS** | 36,35 (35,58–38,69; IQR 3,11) | 39,80 (38,96–43,32; IQR 4,36) | +3,45 | 24,5 | 0,05859 | Không đủ ngưỡng |
| | **Thời gian (ms)** | 879,40 (834,15–922,88; IQR 88,73) | 816,45 (774,40–846,12; IQR 71,73) | -62,95 | 25,0 | 0,06301 | Không đủ ngưỡng |
| | **`maxGap` (ms)** | 149,90 (120,85–150,00; IQR 29,15) | **100,00** (87,47–133,30; IQR 45,83) | **-49,90** | 22,0 | 0,03635 | **Cải thiện** |

**Nhận xét (`đã đo` + `suy luận từ mã`)**:
- **A-04 (`fly`) giữ vững kết quả sau khi khôi phục `syncHeaderOffset()` và bỏ `effectiveDockRect`**: `maxGap` của `fly` tiếp tục đạt **"Cải thiện"** ở cả VI (`-74,95 ms`, `p = 0,00161`) và EN (`-74,95 ms`, `p = 0,00217`), đồng thời cả FPS và tổng thời gian của `fly` đều đạt "Cải thiện" ở cả hai ngôn ngữ (`0/18` chỉ số "Xấu đi").
- **A-03 (`drag` / `rotate`) chưa đạt ngưỡng cải thiện FPS ổn định**: `drag` ở cả hai ngôn ngữ đều không đạt ngưỡng (`p = 0,165–0,427`); ở `rotate`, tuy đợt đo này VI FPS (`+6,04 FPS`, `p = 0,00130`) và EN `maxGap` (`-49,90 ms`, `p = 0,03635`) đạt ngưỡng, **EN `rotate` FPS không đạt ngưỡng (`p = 0,05859`)** và ở lần đo Pha 2 trước đó cả VI/EN `rotate` FPS đều không đạt ngưỡng (`p = 0,24–0,35`).
- **Lưu ý hành vi `journey-arrival-5.js`**: khi `#journeyRouteBar` mới chuyển từ ẩn sang hiện (`dataset.position` chưa có), hàm `focus()` chạy chậm hơn `1` khung (`1 rAF` ngay sau `positionBar()`, [journey-arrival-5.js:152–163](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L152-L163)).

### 9.5. Việc 3c — Ảnh đối chiếu bổ sung & pixel diff (ngưỡng `> 8`) — `đã đo` & `đã tái hiện`

- **Phạm vi chụp**: lưu tại [verification/audit-06/a03-a04-phase2b/snaps/](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/snaps/) và ảnh crop tại [snaps/crops/](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/snaps/crops/), báo cáo định lượng tại [snaps-diff-report.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/snaps-diff-report.json):
  - **10 cặp toàn khung (`base` vs `new`)**: TP.HCM theme tối (`vi-dark-05-after-fly-hcm`, `en-dark-05-after-fly-hcm`); toàn cảnh (`01-overview`) và sau xoay (`02-after-rotate`) ở đủ 4 tổ hợp `VI/EN × Sáng/Tối`.
  - **48 cặp crop (`base` vs `new`)**: 4 mép khung di sản (`edge-top`, `edge-bottom`, `edge-left`, `edge-right`) + vùng quần đảo (`hoang-sa`, `truong-sa`) trên cả `01-overview` và `02-after-rotate` ở đủ `VI/EN × Sáng/Tối`.
- **Kết quả định lượng pixel diff (ngưỡng `> 8` trên kênh RGB, `đã đo`)**:
  - **Toàn khung (`10/10` cặp)**: **`0` cặp vượt ngưỡng `> 8`** (`0` pixel khác biệt trên toàn bộ 8 cặp `01-overview` và `02-after-rotate`, `maxDiff = 0`; trên TP.HCM theme tối `maxDiff = 5` ở VI và `maxDiff = 7` ở EN, `diffPixelsGt8 = 0`).
  - **Ảnh crop (`48/48` cặp)**: **`0` cặp vượt ngưỡng `> 8`** (`maxDiff = 0`, `diffPixelsGt8 = 0` trên cả `48/48` cặp).
- **Kiểm tra trực quan (`đã tái hiện`)**: phiếu TP.HCM theme tối (VI/EN) sắc nét, không lỗi tương phản hay lệch khung; 4 mép khung di sản khít tuyệt đối; cụm Hoàng Sa và Trường Sa rõ nét trên `01-overview` (lưu ý trên khung `02-after-rotate`, 14 bước xoay phải đưa cụm Trường Sa xuống ngoài rìa dưới khung nhìn `1920×1080` giống hệt nhau ở cả bản nền và bản mới, `maxDiff = 0`).

### 9.6. Việc 3d — Kết quả 8 bộ kiểm kèm log riêng có mốc thời gian — `đã tái hiện` & `đã đo`

Mỗi bộ kiểm được lưu thành tệp log riêng kèm mốc `Start`/`End` UTC và mã thoát trong [verification/audit-06/a03-a04-phase2b/suites/](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/) (tổng hợp tại [summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/summary.json)):

| # | Bộ kiểm | Bắt đầu (UTC) | Kết thúc (UTC) | Thời lượng | Mã thoát | Kết quả | Log chi tiết |
|---:|---|---|---|---:|---:|---|---|
| 1 | `check-books-5` | `2026-11-26T12:52:51.320Z` | `12:52:51.445Z` | 0,12 s | 0 | **PASS** | [check-books-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-books-5.log) |
| 2 | `check-i18n-5` | `2026-11-26T12:52:51.447Z` | `12:52:51.554Z` | 0,11 s | 0 | **PASS** | [check-i18n-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-i18n-5.log) |
| 3 | `check-memory-v5` | `2026-11-26T12:52:51.555Z` | `12:53:12.414Z` | 20,86 s | 0 | **PASS** | [check-memory-v5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-memory-v5.log) |
| 4 | `verify-preview5-conversation-cards` | `2026-11-26T12:53:12.414Z` | `12:53:44.006Z` | 31,59 s | 0 | **PASS** | [verify-preview5-conversation-cards.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/verify-preview5-conversation-cards.log) |
| 5 | `check-station-panel-5` | `2026-11-26T12:53:44.006Z` | `12:54:26.921Z` | 42,91 s | 0 | **PASS** | [check-station-panel-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-station-panel-5.log) |
| 6 | `check-family-voyage-5` | `2026-11-26T12:54:26.922Z` | `12:55:23.302Z` | 56,38 s | 0 | **PASS** | [check-family-voyage-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-family-voyage-5.log) |
| 7 | `check-station-photos-5` | `2026-11-26T13:29:40.295Z` | `13:38:31.077Z` | 530,78 s | 0 | **PASS** | [check-station-photos-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-station-photos-5.log) |
| 8 | `check-arrival-demo-5 --preview-5` | `2026-11-26T15:24:49.800Z` | `15:34:28.357Z` | 578,56 s | 0 | **PASS** *(61/61 ca, 3/3 lượt sau sửa ca F — xem Mục 10)* | [check-arrival-demo-5--preview-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/check-arrival-demo-5--preview-5.log) |

**Chẩn đoán lỗi ca `[1920×1080] F` & `G` trong `check-arrival-demo-5 --preview-5` (`đã đo` + `suy luận từ mã`)**:
- Cả 2 lượt chạy lại `check-arrival-demo-5 --preview-5` đều đạt **57/59 ca chức năng PASS** (toàn bộ `1366×768` gồm cả `F` với `delay = 1203 ms` và `G` đều PASS; `390×844` PASS; `0` lỗi console/HTTP), chỉ FAIL duy nhất `[1920×1080] F` tại `assert(delay <= 1600)` ([tools/check-arrival-demo-5.cjs:673](file:///d:/HCMUS/vietnam-heritage-map-2/tools/check-arrival-demo-5.cjs#L673)) kéo theo dây chuyền `[1920×1080] G` (`assert(firstStamp)` tại `L678` vì `firstStamp` được gán phía sau dòng `assert(delay <= 1600)`).
- Chạy chẩn đoán tách mốc thời gian **3 lượt xen kẽ `HEAD f85e7d1` vs bản mới** ở `1920×1080` ([diag-case-f.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/diag-case-f.json), `đã đo`):

| Phiên bản | Lượt | `shot()` PNG `1920×1080` | `delay = Date.now() - start` | Thời gian thật trên trang (`banner → sheet`) | `assert(delay <= 1600)` |
|---|---:|---:|---:|---:|---|
| `HEAD f85e7d1` | 1 | 1313 ms | 1570 ms | **1225,3 ms** | PASS |
| `HEAD f85e7d1` | 2 | 1470 ms | **1806 ms** | **1215,3 ms** | **FAIL** |
| `HEAD f85e7d1` | 3 | 1347 ms | **1601 ms** | **1209,8 ms** | **FAIL** |
| Bản mới (sau Việc 2) | 1 | 1375 ms | **1649 ms** | **1217,9 ms** | **FAIL** |
| Bản mới (sau Việc 2) | 2 | 1277 ms | 1535 ms | **1227,5 ms** | PASS |
| Bản mới (sau Việc 2) | 3 | 1588 ms | **1904 ms** | **1208,6 ms** | **FAIL** |

- **Kết luận chẩn đoán**: hành vi thực của trang (`banner → sheet`) đúng chuẩn `~1215 ms` (khớp `setTimeout(..., 1200)` tại [arrival-demo-5.js:445](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L445)) trên cả `HEAD` (`1209,8–1225,3 ms`) lẫn bản mới (`1208,6–1227,5 ms`) — **không phải hồi quy từ mã đã sửa**. Nguyên nhân là [tools/check-arrival-demo-5.cjs:671–673](file:///d:/HCMUS/vietnam-heritage-map-2/tools/check-arrival-demo-5.cjs#L671-L673) đặt `waitForTimeout(200)` + chụp ảnh PNG `1920×1080` (`shot()`, tốn `1277–1588 ms`) nằm trong cửa sổ `start .. delay <= 1600`, làm cả `HEAD` lẫn bản mới đều FAIL `2/3` lượt. Cách sửa đã được duyệt và nghiệm thu tại [Mục 10](#10-sửa-cách-đo-ca-f).

---

## 10. Sửa cách đo ca F

- **Tệp : dòng đã sửa**: [tools/check-arrival-demo-5.cjs:655–691](file:///d:/HCMUS/vietnam-heritage-map-2/tools/check-arrival-demo-5.cjs#L655-L691) (duy nhất ca `F`, không sửa ca khác, không đổi ngưỡng `1600 ms`, không sửa bất kỳ tệp website nào).
- **Nguyên nhân (`đã đo` + `suy luận từ mã`)**: trước khi sửa, `const start = Date.now()` đặt trước loạt kiểm tra, `waitForTimeout(200)` và `shot()` PNG `1920×1080` (tốn `1,3–2,9 s` trên máy này), nên `delay = Date.now() - start` đo cả thời gian chụp ảnh thay vì khoảng chờ `banner → phiếu` (`~1200 ms`), gây FAIL giả trên cả `HEAD` và bản mới và kéo theo ca `G` (`assert(firstStamp)` gán sau dòng `assert(delay <= 1600)`).
- **Thay đổi áp dụng**: gắn 2 `MutationObserver` ngay trong trang trước khi bấm `#arrivalExplore` để ghi `performance.now()` khi `#mapStationArrivalBanner` có lớp `'show'` (`bannerAt`) và khi `#arrivalSheet` bỏ `hidden` với `data-place="hue"` (`sheetAt`); sau khi `isSheetOpen()` đúng, ngắt cả 2 observer, kiểm `bannerAt`/`sheetAt` tồn tại, tính `delay = Math.round((sheetAt - bannerAt) * 10) / 10`, giữ `assert(delay > 0 && delay <= 1600)` và trả `delay` vào `row.detail` của ca `F`.

### Kết quả nghiệm thu (`đã đo` & `đã tái hiện`)

Dữ liệu tổng hợp tại [case-f-verification.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/case-f-verification.json) (toàn bộ tệp tạm dưới `verification/audit-06/case-f-tmp/` đã được dọn sạch):

1. **Đối chứng âm (`ctx.route`, không sửa tệp gốc)**: dùng wrapper Playwright `ctx.route` phục vụ `arrival-demo-5.js` với `bannerTimer` đổi từ `1200` thành `2000` (`4` lượt khớp route) rồi chạy `check-arrival-demo-5.cjs --preview-5 --sizes=1920x1080` ⇒ ca `F` (`[1920×1080]`) **FAIL đúng kỳ vọng** với `AssertionError: Unexpected arrival banner→sheet delay 1998 ms ({"bannerAt":56916.79999999702,"sheetAt":58914.79999999702})`.
2. **3 lần liên tiếp `node tools/check-arrival-demo-5.cjs --preview-5`**: **3/3 lần PASS toàn bộ 61/61 ca** (59 ca chức năng gồm `F`, `G` ở cả `1366×768` & `1920×1080`, và 2 ca hiệu năng `C` với `slowdownPct = 0`, `0` lỗi console/HTTP):
   - **Lần 1** (`exit 0`, [case-f-preview-5-run1.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/case-f-preview-5-run1.log)): **61/61 PASS** — `delay` ca `F`: `1366×768 = 1194,2 ms`, `1920×1080 = 1212,8 ms`.
   - **Lần 2** (`exit 0`, [case-f-preview-5-run2.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/case-f-preview-5-run2.log)): **61/61 PASS** — `delay` ca `F`: `1366×768 = 1189,7 ms`, `1920×1080 = 1203,1 ms`.
   - **Lần 3** (`exit 0`, [case-f-preview-5-run3.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/case-f-preview-5-run3.log)): **61/61 PASS** — `delay` ca `F`: `1366×768 = 1189,9 ms`, `1920×1080 = 1197,8 ms`.
3. **Trang `arrival-demo` riêng (`node tools/check-arrival-demo-5.cjs`)** ([case-f-arrival-demo.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/case-f-arrival-demo.log)): **61/61 ca chức năng & hiệu năng PASS** (`0` lỗi console/HTTP, `slowdownPct = 0`), `delay` ca `F`: `1366×768 = 1197,2 ms`, `1920×1080 = 1196,7 ms`, ca `G` PASS cả 2 cỡ. *(Ghi chú: mã thoát cuối là `1` chỉ do kiểm tra `tracked-baseline` tại cuối script đối chiếu `git status` với ảnh chụp cũ `verification/arrival-demo-5/tracked-baseline.json` ngày `2026-11-13`, không khớp cây làm việc Pha 2 chưa commit; giữ nguyên không sửa tệp baseline này.)*
4. **Bản `HEAD f85e7d1` (`--preview-5` phục vụ 8 tệp `HEAD` qua `ctx.route`)** ([case-f-head-preview-5.log](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase2b/suites/case-f-head-preview-5.log)): **59/59 ca chức năng PASS** (`0` lỗi console/HTTP), gồm ca `F` (`1366×768 = 1202,1 ms`; `1920×1080 = 1193,3 ms`) và ca `G` PASS ở cả 2 cỡ — chứng minh lỗi trước đây trên `HEAD` hoàn toàn do cách đo ca `F`. *(Ca hiệu năng `[1366×768] C` FAIL trên `HEAD` do `HEAD` có `longTaskTotalMedian = 76 ms` vs `0 ms` trên `arrival-demo`, trong khi bản mới Pha 2 PASS `3/3` lần với `0 ms`.)*
5. **Phạm vi `git diff --stat` (`đã tái hiện`)**: so với trước đợt sửa ca `F`, chỉ thêm duy nhất `tools/check-arrival-demo-5.cjs | 21 ++++-` (toàn bộ 8 tệp website của Pha 2 + đợt sửa bổ sung giữ nguyên).

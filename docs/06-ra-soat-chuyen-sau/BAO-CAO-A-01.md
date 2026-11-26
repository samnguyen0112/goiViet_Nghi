# Báo cáo sửa A-01 · Màn che kéo dài khi vào bản đồ (preview-5)

- **Ngày hoàn tất:** 2026-11-26
- **Nhánh / mốc nền:** `p5-05`, gốc so sánh `HEAD = 6901d54` (đã merge đợt sửa 3).
- **Phương án triển khai:** **Phương án 2** theo đúng phê duyệt (tách mới 2 tệp riêng cho `preview-5`: `natural/regional-renderer-5.js` và `map-prewarm-5.js`; giữ nguyên hoàn toàn `regional-renderer-4.js`, `map-prewarm-3.js`, `map-surroundings-preview-5-arrival-demo.html`, `index.html`, các bản preview 2/3/4, `card-testing.html` và mọi tệp `-3`/`-4` dùng chung; giữ nguyên nhịp rèm `440 ms` và fade `470 ms`, không áp dụng phần nào của Phương án 3).
- **Môi trường đo (`đã đo`):** Windows 11, Google Chrome `158.0.8127.38`, GPU thật `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`, viewport `1920×1080`, `DPR 1`, `vi-VN`, CPU throttle `×4`, máy chủ tĩnh `node tools/perf/server.cjs` (cổng `8770`), mỗi lượt một tiến trình Chrome mới (hồ sơ tạm dưới `verification/a01-phase2/` tự dọn ngay sau mỗi lượt). Báo cáo Pha 1 gốc: [BAO-CAO-A-01-PHA-1.md](BAO-CAO-A-01-PHA-1.md).

---

## 1. Tóm tắt kết quả chính (`đã đo`)

- **Vào bản đồ WebGL `×4` (`n = 10` mỗi bên):** giảm từ trung vị **`8,54 s`** (Q1–Q3 `8,28–8,70 s`, IQR `0,42 s`) xuống **`5,02 s`** (Q1–Q3 `4,89–5,34 s`, IQR `0,45 s`, mọi lượt `4,56–5,58 s` đều đạt mục tiêu **`≤ 6,00 s`**) → **`Δ = −3,52 s` (`−41,2%`)**, Mann–Whitney `U = 0`, `p = 1,08×10⁻⁵` → **Cải thiện**.
- **Đường Canvas fallback không WebGL (`nowebgl`, `n = 10` mỗi bên):** giảm từ trung vị **`35,25 s`** xuống **`26,69 s`** (`Δ = −8,56 s`, `U = 0`, `p = 1,08×10⁻⁵`, **Cải thiện**); `10/10` lượt vẽ đủ `34` tỉnh + `4` cụm đảo + lớp nền chi tiết (`backdropCommits = 2`, không còn đụng `SAFETY_MS` và không rơi về `coverageFallback` như mốc nền).
- **Kéo & xoay tức thì trong `0–2 s` đầu sau hé màn (`n = 10`, `×4`):** trung vị **`52,81 FPS`** (kéo) và **`48,29 FPS`** (xoay), không tụt mà tăng so với mốc nền (`46,48 / 33,34 FPS`, **Cải thiện**); ảnh chụp khi kéo sớm (`+145/+42 px` và `+220/+110 px`) kín toàn bộ khung hình, không lộ ô trống hay vệt cắt nền.
- **Nhánh fallback không hỗ trợ `ImageBitmap` (`n = 10`), giả lập lỗi worker (`n = 10`), và ngoại tuyến thật trên hồ sơ lưu đĩa (`n = 10`):** đều mở bản đồ trọn vẹn, `0` lỗi `pageerror`.
- **Gói ngoại tuyến:** đã cập nhật và kiểm `--check PASS` (`642` tài nguyên, `180,0 MB`, phiên bản `a983f70dec83220b`), đã bao gồm `map-prewarm-5.js` và `natural/regional-renderer-5.js`, loại `regional-renderer-4.js`.
- **Bộ kiểm tự động:** **8/8 suite PASS hoàn toàn** (sau khi bổ sung `await page.waitForTimeout(320);` tại `tools/check-family-voyage-5.cjs:201` theo phê duyệt, khớp khóa chống bấm đúp `300 ms` của `family-voyage-5.js:731–732`; chạy độc lập `check-family-voyage-5.cjs` đạt **`10/10 PASS`**).

---

## 2. Danh sách tệp đã tạo và sửa (`tệp:dòng`)

### 2.1. Tệp tách mới riêng cho `preview-5` (giữ nguyên `-3.js`/`-4.js` dùng chung)

1. **[assets/goi-viet/map-surroundings-preview/natural/regional-renderer-5.js](../../assets/goi-viet/map-surroundings-preview/natural/regional-renderer-5.js)** *(tách từ `regional-renderer-4.js`)*:
   - `dòng 52–62`: dùng 1 canvas placeholder `4×4` dùng chung theo `(id, dark)` khi `GoiVietMapPrewarm3?.holding() || preparing()` thay vì cấp phát hàng trăm canvas placeholder riêng lẻ.
   - `dòng 76–127`: thêm lọc ô theo đa giác thực `candidates(polygons, size)` bằng duyệt cạnh Liang–Barsky kết hợp quét dòng nội miền (biên an toàn `4` đơn vị thế giới > gutter tối đa `2,67`, lưu cache `WeakMap` theo `country.polygons`), loại bỏ các tile hộp bao rỗng ngoài đường biên quốc gia/đất liền mà không mất pixel nào.
   - `dòng 145–156`: `paintSteps()` chỉ vẽ các ô thuộc `candidates(country.polygons, size)` giao với `extent`, ghi nhận `culledTiles` trong `inspect()`.
2. **[assets/goi-viet/map-surroundings-preview/map-prewarm-5.js](../../assets/goi-viet/map-surroundings-preview/map-prewarm-5.js)** *(tách từ `map-prewarm-3.js`, giữ nguyên global `window.GoiVietMapPrewarm3`)*:
   - `dòng 32`: dừng xếp hàng tile rộng ở trang chủ ngay khi `#memoryMapTransition` đã mang lớp `is-covering`.
   - `dòng 55–59`: rút `quiet()` từ `5` khung `< 25 ms` (timeout `3 000 ms`) xuống `2` khung `< 50 ms` (timeout `400 ms`), giữ nguyên điều kiện `complete()` đòi đủ `ground && tiles && sea`.
   - `dòng 65–88`: trước khi vẽ khung vào đầu tiên trong `hold()`, đẩy `requestedFrame` qua `terrain.prepare([], state.cam, dark)` (3 lần) để xả ngay các job zoom cao cũ từ trang chủ mà không chạm `webgl-terrain-renderer-3.js`; rút chu kỳ thăm dò `50 ms → 35 ms`; gọi `window.GoiVietRegionalPreview?.expandAfterReveal?.()` ngay trước `reveal()`.

### 2.2. Tệp `preview-5` đã sửa

3. **[map-surroundings-preview-5.html](../../map-surroundings-preview-5.html)**:
   - `dòng 4165, 4167, 4173, 4200, 4212–4213`: trỏ sang `natural/regional-renderer-5.js` và `map-prewarm-5.js`, đồng thời tăng tham số `?v=20261126-a01-1` cho toàn bộ 6 tệp JS tạo/sửa.
   - `dòng 8576–8607`: `closeIntroModal(options)` chỉ bỏ qua lượt `renderMainScene()` Canvas 2D đồng bộ trước khi gắn `intro-hidden` khi đi qua rèm (`options.curtainHold`) **VÀ** đường WebGL khả dụng thật (`terrain?.usable() && terrain.inspect().available`, có thăm dò `terrain.prepare([], ...)` nếu `init()` chưa chạy). Đường vào trực tiếp và đường Canvas fallback (không WebGL) giữ nguyên lượt vẽ đồng bộ.
4. **[assets/goi-viet/map-surroundings-preview/memory-reference-5.js](../../assets/goi-viet/map-surroundings-preview/memory-reference-5.js)**:
   - `dòng 79–80, 119`: dừng vòng vẽ trang chủ (`artworkVisible = false; GoiVietHomeIntro?.setArtworkVisible?.(false)`) ngay khi bấm `#memoryOpenMap` và chặn bật lại trong khi `exiting === true`.
   - `dòng 91–93, 96, 111`: truyền `{ curtainHold: true }` vào `window.closeIntroModal({ curtainHold: true })`; giữ nguyên `later(finish, 440)` và fade-out `motion() ? 470 : 0`.
5. **[assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js](../../assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js)**:
   - `dòng 9–10, 14–15, 209–210`: thêm `HOLD_MAX_JOBS = 512` khi `GoiVietMapPrewarm3?.holding()` (giữ `MAX_JOBS = 128` khi tương tác bình thường; giữ nguyên nhịp `BUDGET_MS = 3 ms / 8 ms` cho nhánh không WebGL theo GD6).
   - `dòng 21–36, 69`: `notify(name)` gom tập `dirtyNames` gửi cho listener; khi WebGL `holding()` dùng chu kỳ `32 ms` (thay `120 ms`) và chỉ kích `requestMapRender()` khi `jobs.size === 0` hoặc tối đa mỗi `160 ms` để tránh làm đói `requestIdleCallback` của `webgl-terrain-renderer-3.js`.
   - `dòng 44–54, 111–115, 138–155, 301`: `workerMain()` chuyển pixel sang `ImageBitmap` qua `createImageBitmap(new ImageData(...))` và transfer `[bitmap]` về luồng chính (tự động fallback về `ArrayBuffer` + `putImageData` nếu `createImageBitmap` không có hoặc reject); `w.onmessage` hoàn tất trực tiếp `ImageBitmap` không cần tạo canvas/gọi `putImageData` và đóng bitmap bị hủy; xuất `bitmapCompletions`, `putImageDataCompletions` trong `inspect()`.
6. **[assets/goi-viet/map-surroundings-preview/natural/landscape-5.js](../../assets/goi-viet/map-surroundings-preview/natural/landscape-5.js)**:
   - `dòng 11–12, 69`: `seaTile()` dùng 1 canvas placeholder `2×2` dùng chung theo theme khi `GoiVietMapPrewarm3?.holding() || preparing()`, loại bỏ hàng trăm lần tạo canvas `8×8` + `sampleDepth` + `putImageData` tạm thời dưới rèm kín; giữ nguyên placeholder độ sâu `8×8` khi người dùng kéo tương tác.
7. **[assets/goi-viet/map-surroundings-preview/preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js)**:
   - `dòng 171, 420, 614`: dùng trực tiếp `cachedViewport` cho biến đổi ma trận nền/sóng khi kích thước `pad` thay đổi giữa Pha 1 và Pha 2.
   - `dòng 314–347`: dựng `backdrop` 2 pha — Pha 1 dưới rèm dùng `holdGuard(width)` (`160 px` trên màn desktop để kéo sớm `0–2 s` kín mép không lộ đường nối coverage; `32 px` trên màn `≤ 768 px`) với `margin = 16 / zoom`, chu kỳ chờ thử lại `32 ms`; sau khi hé màn, `expandAfterReveal()` hẹn `deferBackdrop(520)` mở rộng lên `pad = 260 px` ở ngân sách tương tác `3 ms` bình thường (tự hủy/hoãn ngay nếu người dùng kéo/xoay).
   - `dòng 414–459`: bỏ qua `drawCoverage()` dưới màn che kín (vẫn chạy `prepareCoverage()` để sẵn lưới WebGL coverage); chờ tile Pha 1 xong trước khi chạy lượt `backdrop` hoàn thiện thứ 2; trì hoãn truy vấn layout UI (`visibleUI`, nhãn, sóng, chim hạc) cho đến khi `backdrop` Pha 1 commit xong trước khi hé màn.
   - `dòng 611–618`: xuất `expandAfterReveal`, `backdropPad`, và lọc `onUpdate(names)` chỉ đánh dấu bẩn `backdrop` khi có tile `'sea'` hoặc `'regional'` (không bị `terrain:gpu` kích dựng lại `backdrop` lượt 3).
8. **[tools/build-preview-5-offline.py](../../tools/build-preview-5-offline.py)** (`dòng 25`) & **[assets/goi-viet/map-surroundings-preview/offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js)**:
   - Thêm `'regional-renderer-4.js'` vào `excluded_natural`, chạy lại `python tools/build-preview-5-offline.py` và `python tools/build-preview-5-offline.py --check` → **`PASS`** (`642` tài nguyên, `180,0 MB`, phiên bản `a983f70dec83220b`).

---

## 3. So sánh số liệu Trước / Sau (`n = 10` mỗi bên, `đã đo`)

Quy tắc kết luận áp dụng thống nhất: chỉ kết luận **Cải thiện** (hoặc **Xấu đi**) khi đồng thời thỏa `|Δ trung vị| ≥ IQR nền` **VÀ** kiểm định Mann–Whitney hai phía `p < 0,05`.

| Phép đo (`1920×1080`, Intel Arc, CPU `×4`) | Trước · Trung vị (Q1–Q3; IQR) | Sau · Trung vị (Q1–Q3; IQR) | Δ trung vị | `|Δ| ≥ IQR` | Mann–Whitney `U` | `p` hai phía | Kết luận |
| --- | --- | --- | ---: | :---: | ---: | ---: | --- |
| **Vào bản đồ WebGL (`entry`, s)** | **8,54** (8,28–8,70; 0,42) | **5,02** (4,89–5,34; 0,45) | **−3,52 s (−41,2%)** | Đạt | 0 | `1,08×10⁻⁵` *(exact)* | **Cải thiện** *(đạt ≤ 6 s)* |
| `map-prewarm` giữ màn (`lastCurtainWaitMs`, s) | 6,64 (6,41–6,83; 0,42) | 3,69 (3,57–4,04; 0,47) | −2,95 s (−44,4%) | Đạt | 0 | `1,08×10⁻⁵` *(exact)* | **Cải thiện** |
| Kéo bản đồ chuẩn sau vào (`×4`, FPS) | 46,48 (44,66–50,16; 5,49) | 49,62 (48,09–52,16; 4,08) | +3,14 FPS | Không | 26 | `0,0753` *(exact)* | **Không đổi đáng kể** *(không tụt)* |
| Xoay bản đồ chuẩn sau vào (`×4`, FPS) | 33,34 (32,19–34,86; 2,68) | 46,27 (44,66–47,34; 2,68) | +12,93 FPS | Đạt | 0 | `1,82×10⁻⁴` *(norm)* | **Cải thiện** |
| **Kéo tức thì `0–2 s` sau hé (`×4`, FPS)** | 46,48 (44,66–50,16; 5,49) | **52,81** (50,56–53,62; 3,06) | **+6,33 FPS** | Đạt | 13 | `0,0039` *(exact)* | **Cải thiện** *(không tụt)* |
| **Xoay tức thì `0–2 s` sau hé (`×4`, FPS)** | 33,34 (32,19–34,86; 2,68) | **48,29** (46,97–49,06; 2,10) | **+14,95 FPS** | Đạt | 0 | `1,82×10⁻⁴` *(norm)* | **Cải thiện** *(không tụt)* |
| **Canvas fallback `nowebgl` (`entry`, s)** | **35,25** (33,76–35,40; 1,63) | **26,69** (25,76–27,87; 2,10) | **−8,56 s (−24,3%)** | Đạt | 0 | `1,08×10⁻⁵` *(exact)* | **Cải thiện** |
| Nhánh fallback không `ImageBitmap` vs nền WebGL (s) | 8,54 (8,28–8,70; 0,42) | **5,84** (5,74–6,24; 0,51) | −2,70 s (−31,6%) | Đạt | 0 | `1,08×10⁻⁵` *(exact)* | **Cải thiện** *(bảo lưu fallback)* |
| WebGL có `ImageBitmap` vs không `ImageBitmap` (s) | 5,84 (5,74–6,24; 0,51) | **5,02** (4,89–5,34; 0,45) | −0,82 s (−14,0%) | Đạt | 0 | `1,08×10⁻⁵` *(exact)* | **Cải thiện** *(đóng góp riêng của `ImageBitmap`)* |

- *Ghi chú đối chứng chéo:* Trên lô `early-drag-rotate` (`n = 10` độc lập thứ hai trên cùng mã sau sửa), thời gian `entry` đạt trung vị **`4,72 s`** (Q1–Q3 `4,64–4,85 s`, IQR `0,21 s`, max `5,51 s`), `0` lỗi.
- Dữ liệu đo gốc: [baseline-n10.json](../../verification/a01-phase1/baseline-n10.json), [after-n10.json](../../verification/a01-phase2/after-n10.json), [early-drag-rotate-n10.json](../../verification/a01-phase2/early-drag-rotate-n10.json), [nowebgl-baseline-n10.json](../../verification/a01-phase2/nowebgl-baseline-n10.json), [nowebgl-after-n10.json](../../verification/a01-phase2/nowebgl-after-n10.json), [no-imagebitmap-n10.json](../../verification/a01-phase2/no-imagebitmap-n10.json).

---

## 4. Đối chiếu Trace & Kiểm kê Tile trước / sau (`1` lượt riêng mỗi bên, `đã đo`)

| Thành phần (trace luồng chính) | Trước (`9 700,5 ms`) | Sau (`4 583,6 ms`) | Mức giảm |
| --- | ---: | ---: | ---: |
| Tổng `RunTask` luồng chính | `9 142,6 ms` (`94,2%`) | `3 588,0 ms` (`78,3%`) | **`−60,8%`** |
| `tick` (`raster-scheduler-5.js`) | `3 173,3 ms` (`264` lần) | `574,6 ms` (`53` lần) | **`−81,9%`** |
| `animateLoop` (`preview-5.html`) | `1 662,4 ms` (`86` lần) | `761,9 ms` (`66` lần) | **`−54,2%`** |
| `GC` (`GarbageCollect`) | `1 169,1 ms` (`547` đợt) | `376,1 ms` (`509` đợt) | **`−67,8%`** |
| `Commit` | `636,2 ms` (`369` lượt) | `164,2 ms` (`155` lượt) | **`−74,2%`** |
| `closeIntroModal` (`memory-reference-5.js:15`) | `564,8 ms` | `192,4 ms` | **`−65,9%`** |
| `w.onmessage` (`raster-scheduler-5.js`) | `258,7 ms` (`1 062` lần) | `152,5 ms` (`705` lần) | **`−41,1%`** |
| 3 worker dựng pixel (`runTaskMs`) | `1 761 / 1 654 / 1 705 ms` | `1 202 / 1 225 / 1 170 ms` | **`−29,7%`** |

- **Kiểm kê tile & lượt `backdrop` trong lượt `probe` riêng** ([probe.json](../../verification/a01-phase2/probe.json), `entry = 5,04 s`):
  - `backdrop` Pha 1 chỉ còn **2 lượt** (`1 097 → 2 163 ms` xếp hàng, `2 945 → 3 239 ms` hoàn tất `missing = false`, so với trước đây `3` lượt kéo dài tới `8 183 ms`), **`0` lượt `queueFull`** (trước `27`), **`0` lượt `abort`** (trước `3`), **`0` lượt `putImageData` trong `raster-scheduler-5.js`** (trước `1 079`).
  - `terrain:2d` cho đất liền giảm từ **`104` → `0`** (chỉ còn `4` tile hợp lệ do `bakeIslandTile` dựng đảo Phú Quốc / Côn Đảo).
  - `regional` đã lọc sạch các tile hộp bao rỗng: `laos` `120 → 63`, `cambodia` `49 → 41`, `thailand` `240 → 121`, `context` `260 → 133`, `sea` `276 → 217` (đã gồm dải đệm `160 px` cho kéo sớm).
- Tệp trace sau sửa: [after-entry.trace.json.gz](../../verification/a01-phase2/after-entry.trace.json.gz) và [after-entry-analysis.json](../../verification/a01-phase2/after-entry-analysis.json).

---

## 5. Kết quả các điều kiện kiểm chứng bổ sung (`đã đo` & `đã tái hiện`)

1. **Khung hình đầu tiên ngay sau khi hé màn (`n = 10`, WebGL):**
   - `10/10` lượt của [after-n10.json](../../verification/a01-phase2/after-n10.json): `provincesCount = 34`, `islandGroupIds = 4` (`phu-quoc`, `con-dao`, `hoang-sa`, `truong-sa`), `terrain.active = true`, `terrain.islandTiles = 62`, `bgCoversViewport = true`, `bgSampledOpaque = 35/35`, `coverageFallback = false`, `bitmapCompletions = 669–671`, `putImageDataCompletions = 0`, `0` lỗi.
   - Ảnh minh chứng: [after-first-frame-1.png](../../verification/a01-phase2/after-first-frame-1.png) — kín 100% khung nhìn, không ô trống, không nền thô.
2. **Pha 2 nền mở rộng `160 → 260 px` & kéo/xoay trong `0–2 s` đầu (`n = 10`):**
   - Trong `0–2 s` ngay sau khi rèm hết, `earlyDrag = 52,81 FPS` và `earlyRotate = 48,29 FPS` (`n = 10`, `0` lỗi), không tụt so với mốc nền (`46,48 / 33,34 FPS`).
   - Ảnh chụp ngay khi kéo tức thì: [early-drag-mid.png](../../verification/a01-phase2/early-drag-mid.png) (`+145/+42 px`) và [early-drag-end.png](../../verification/a01-phase2/early-drag-end.png) (`+220/+110 px`) đều hiển thị nền biển và địa hình chi tiết kín đến sát khung viền, không lộ ô trống hay vệt cắt nền.
3. **Đường Canvas fallback không WebGL (`nowebgl`, `n = 10` trước vs `n = 10` sau):**
   - `10/10` lượt sau sửa có `terrainUsable = false`, `provincesCount = 34`, `islandGroupIds = 4`, **`backdropCommits = 2`**, **`coverageFallback = false`** (so với mốc nền đụng `SAFETY_MS` `35,25 s` với `backdropCommits = 0, coverageFallback = true`). Trung vị giảm **`35,25 s → 26,69 s`** (`Cải thiện`).
   - Ảnh đối chứng: [nowebgl-baseline-first-frame.png](../../verification/a01-phase2/nowebgl-baseline-first-frame.png) vs [nowebgl-after-first-frame.png](../../verification/a01-phase2/nowebgl-after-first-frame.png).
4. **Nhánh fallback không hỗ trợ `ImageBitmap` (`n = 10`, giả lập `createImageBitmap = undefined` trong worker và luồng chính):**
   - `10/10` lượt: `bitmapCompletions = 0`, `putImageDataCompletions = 661–679`, `scheduler.failed = false`, `provincesCount = 34`, trung vị **`5,84 s`** (Q1–Q3 `5,74–6,24 s`, IQR `0,51 s`), `0` lỗi. Ảnh: [no-imagebitmap-first-frame.png](../../verification/a01-phase2/no-imagebitmap-first-frame.png).
5. **Giả lập lỗi worker (`n = 10`, `new Worker` ném lỗi):**
   - `10/10` lượt: `scheduler.failed = true`, `fallbackRows = 30 684–45 347`, `putImageDataCompletions = 258–410`, màn che tự mở an toàn qua `SAFETY_MS` ở trung vị **`31,55 s`** (Q1–Q3 `31,46–31,67 s`, IQR `0,20 s`), không treo, `provincesCount = 34`, `0` lỗi. Dữ liệu: [worker-fail-n10.json](../../verification/a01-phase2/worker-fail-n10.json), ảnh: [worker-fail-first-frame.png](../../verification/a01-phase2/worker-fail-first-frame.png).
6. **Chế độ ngoại tuyến thật trên hồ sơ lưu đĩa (`launchPersistentContext`, không incognito, `offline: true`, `n = 10`):**
   - Mỗi lượt tải gói ngoại tuyến thật qua `#btnPrepareOffline`, đóng trang, bật `setOffline(true)` rồi mở trang mới và vào bản đồ ở `×4`: `10/10` lượt `swControlled = true`, **`0` request thất bại**, `provincesCount = 34`, `islandGroupIds = 4`, `backdropCommits = 2`, `coverageFallback = false`, trung vị **`5,45 s`** (Q1–Q3 `4,95–5,56 s`, IQR `0,62 s`), `0` lỗi. Dữ liệu: [offline-real-n10.json](../../verification/a01-phase2/offline-real-n10.json), ảnh: [offline-real-first-frame.png](../../verification/a01-phase2/offline-real-first-frame.png).

---

## 6. Kết quả 8 bộ kiểm tự động trên `preview-5`

- **Chỉnh sửa script kiểm được duyệt:** thêm đúng 1 dòng `await page.waitForTimeout(320);` ngay sau `await act('skip');` tại [tools/check-family-voyage-5.cjs](../../tools/check-family-voyage-5.cjs#L200-L201) (giống dòng 221 cùng tệp) để tôn trọng khóa chống bấm đúp `300 ms` thiết kế sẵn trong `family-voyage-5.js:731–732` (trước A-01 vòng lặp lọt qua ngẫu nhiên vì luồng chính chậm `> 300 ms`; sau A-01 vòng lặp chạy chỉ còn `219,5–235,6 ms`). Không sửa `family-voyage-5.js` hay bất kỳ tệp mã A-01 nào.
- **Kiểm độ ổn định `node tools/check-family-voyage-5.cjs` 10 lần liên tiếp (`n = 10`):** **`10/10 PASS`, `0/10 FAIL`** (`11 groups` mỗi lượt, thời lượng `56,5–58,2 s/lượt`).

| # | Bộ kiểm (chạy trọn một lượt sau sửa) | Kết quả | Chi tiết |
| ---: | --- | :---: | --- |
| 1 | `node tools/check-books-5.cjs` | **PASS** | `0 lỗi` (cảnh báo tập nháp bình thường; `0,1 s`) |
| 2 | `node tools/check-i18n-5.cjs` | **PASS** | `260` khóa markup + `245` khóa mã đủ VI/EN (`0,1 s`) |
| 3 | `node tools/check-memory-v5.cjs` | **PASS** | `0 lỗi`, 8 kích thước màn hình, 9 câu hỏi vừa khung (`21,4 s`) |
| 4 | `node tools/verify-preview5-conversation-cards.cjs` | **PASS** | 6 viewport, hoạt ảnh & đủ vòng chơi (`30,7 s`) |
| 5 | `node tools/check-station-panel-5.cjs` | **PASS** | 6 kích thước, hành trình, thẻ bài, kỷ niệm, bưu thiếp, 32 lời mời, giao diện tối (`44,6 s`) |
| 6 | `node tools/check-family-voyage-5.cjs` | **PASS** | `11 groups` (`file://`, trang bảo vệ, layout, bưu cục, deck, stress, `2× DPI`; `55,6 s`; kiểm lặp **`10/10 PASS`**) |
| 7 | `node tools/check-station-photos-5.cjs` | **PASS** | 35 ảnh + biểu tượng Hoàng Sa, 6 viewport × 2 ngôn ngữ, 36 mục sách, ngoại tuyến lạnh 72 khung (`353,7 s`) |
| 8 | `node tools/check-arrival-demo-5.cjs --preview-5` | **PASS** | `61/61` ca chức năng + hiệu năng `1366×768` & `1920×1080` (`slowdownPct: 0`; `441,7 s`) |

---

## 7. Vấn đề ngoài phạm vi ghi nhận thêm (chỉ ghi, không sửa)

1. **`map-prewarm-3.js` trong `offline-manifest-5.js`:** `map-prewarm-3.js` vẫn nằm trong `offline-manifest-5.js` do bộ dựng gói (`tools/build-preview-5-offline.py:12`) bắt tên tệp trong chú thích của `map-prewarm-5.js` / `hydrology-5.js` (cũng như `webgl-terrain-renderer-3.js` và `memory-reference-v2.css`) — thừa 1 tệp nhỏ (`~4 KB`), vô hại.
2. **Thu hồi `ImageBitmap` khi đẩy khỏi cache tile:** `ImageBitmap` bị đẩy khỏi cache tile (`RasterCache4` trong `raster-scheduler-5.js`) không được gọi `close()` chủ động mà chờ GC thu hồi để tránh đóng bề mặt đang được `backdrop` tham chiếu (`check-memory-v5` vẫn PASS).
3. **`assets/goi-viet/homepage-layered-renderer-5.js:86` (`đã đo` trong trace):** `prepare()` vẫn tiếp tục chạy `prepareRevealSteps()` trên `requestIdleCallback` (`17` lần, `139,4 ms` trong trace `4,58 s` sau sửa) kể cả khi người dùng đã bấm bỏ qua phim mở đầu và mở bản đồ. Ghi nhận để tối ưu ở đợt khác nếu cần.

# Báo cáo Pha 1 · A-01: Màn che kéo dài khi vào bản đồ (preview-5)

- **Ngày thực hiện:** 2026-11-26
- **Nhánh / mốc nền:** `p5-05`, `HEAD = 6901d54` (đã merge đợt sửa 3, cây làm việc sạch, **chưa sửa bất kỳ tệp mã nào ở Pha 1**).
- **Môi trường đo (`đã đo`):** Windows 11, Google Chrome `158.0.8127.38`, GPU thật `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`, viewport `1920×1080`, `DPR 1`, ngôn ngữ `vi-VN`, CPU throttle `×4`, máy chủ tĩnh `node tools/perf/server.cjs` (cổng `8770`), mỗi lượt một tiến trình Chrome mới (hồ sơ tạm đặt dưới `verification/a01-phase1/` và tự dọn ngay sau khi đóng trình duyệt).
- **Đường vào giữ nguyên theo bộ đo gốc** (`scratch/audit-06/graphics-session.cjs`): bỏ qua phim mở đầu (`GoiVietHomeIntro.skip()`), chờ `550 ms`, bấm `#btnHomeExploreMemory` (Miền ký ức), đo pha `entry` từ lúc bấm `#memoryOpenMap` đến khi `#introScreen.intro-hidden` và `#memoryMapTransition` không còn cả 3 lớp `is-(covering|waiting|revealing)`, cộng `2` nhịp rAF.

---

## 1. Mốc nền trên HEAD hiện tại (`n = 10` lượt sạch + `1` lượt trace riêng)

### 1.1. Thống kê `n = 10` lượt sạch không bật trace (`đã đo`)

| Phép đo (`1920×1080`, Intel Arc, CPU `×4`) | n | Trung vị | Q1–Q3 | IQR | Min – Max | CV (%) | Mục tiêu |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| **Vào bản đồ (`entry`, s)** | **10** | **8,54** | **8,28–8,70** | **0,42** | 7,93–8,73 | 3,6% | **≤ 6,00 s** *(chưa đạt, +2,54 s)* |
| Thời gian `map-prewarm-3` giữ màn (`lastCurtainWaitMs`, s) | 10 | 6,64 | 6,41–6,83 | 0,42 | 6,16–7,05 | 4,8% | — |
| Kéo bản đồ `×4` (FPS) *(mốc nền cho Pha 2)* | 10 | 46,48 | 44,66–50,16 | 5,49 | 41,92–51,00 | 7,2% | Không tụt |
| Xoay bản đồ `×4` (FPS) *(mốc nền cho Pha 2)* | 10 | 33,34 | 32,19–34,86 | 2,68 | 28,18–35,77 | 7,0% | Không tụt |

- **0 lỗi `pageerror`** trên cả 10 lượt. Dữ liệu gốc lưu tại [baseline-n10.json](../../verification/a01-phase1/baseline-n10.json).
- **Đối chiếu với con số `15,26 s` trong `BAO-CAO-A-DO-HOA-WEBGL.md` (`đã đo` & đối chiếu dữ liệu gốc):** trong `tools/perf/results/audit-06/graphics-bench-summary.json`, 2 lượt đầu của đợt audit-06 đạt `8,83 s` và `9,25 s` (rất sát `8,54 s` hiện tại), sau đó 8 lượt sau tăng lên `12,16–19,27 s` do tải nhiệt khi chạy nối chuỗi dài và bản Chrome cũ `157.0.8103.79` (nay là `158.0.8127.38`). Ở mốc sạch ổn định hiện tại (`CV = 3,6%`), thời gian vào bản đồ trung vị **`8,54 s`** vẫn vượt xa mục tiêu **`≤ 6,00 s`** (`+42,3%`), và toàn bộ chuỗi điểm nghẽn bên dưới giữ nguyên bản chất.

### 1.2. Bóc tách chi phí từ 1 lượt trace riêng (không tính vào `n = 10`) (`đã đo`)

- **Lượt trace riêng:** `entry = 9 700,5 ms`, `269 975` sự kiện timeline, `23 423` mẫu CPU profiler trên luồng chính (`~0,414 ms/mẫu`). Tệp gốc: [baseline-entry.trace.json.gz](../../verification/a01-phase1/baseline-entry.trace.json.gz) và [baseline-entry-analysis.json](../../verification/a01-phase1/baseline-entry-analysis.json).
- **Điểm then chốt về luồng thực thi:** Luồng chính chạy `RunTask = 9 142,6 ms` (**bão hòa `94,2%`** suốt thời gian giữ màn), trong khi 3 luồng worker dựng pixel chỉ tiêu tốn lần lượt **`1 760,5 ms`**, **`1 654,4 ms`** và **`1 704,6 ms`** (`runTaskMs`). **Nút cổ chai nằm trên luồng chính, không phải ở tốc độ tính pixel của worker.**

| Nhóm công việc trên luồng chính (pha `entry`, tổng `9 700,5 ms`) | Thời gian timeline (`totalMs`, số lần) | Mẫu CPU (ước lượng ms) | Ghi chú trực tiếp từ trace |
| --- | ---: | ---: | --- |
| **Scheduler `tick` (`raster-scheduler-5.js:123`)** | **`3 173,3 ms`** (`264` lần, max `63,3 ms`) | `6 002` inclusive (`~2 486 ms`) | Lớn nhất toàn pha; chứa cả `ingest` lẫn `buildBackdrop` |
| ↳ `buildBackdrop` (`preview-5.js:297`: `regional` + `sea` + `backdropPath`) | *(nằm trong `tick`)* | `3 787` inclusive (`~1 568 ms`) | `regional-renderer-4.js:72` `1 612` mẫu; `backdropPath` `1 341` mẫu (`displayLine` `387`); `paintSeaSteps` `626` mẫu |
| ↳ `ingest` (`raster-scheduler-5.js:117`: `putImageData` + `getContext`) | *(nằm trong `tick`)* | `1 121` inclusive (`~464 ms`) | `putImageData` `689` mẫu + `getContext` `236` mẫu cho `1 079` canvas; cộng `w.onmessage` **`258,7 ms`** (`1 062` lần) |
| ↳ Placeholder `seaTile` (`landscape-5.js:63`: `putImageData` + `getContext`) | *(nằm trong `buildBackdrop`)* | `183` self (`~76 ms`) | Tạo `276` canvas `8×8` rồi `putImageData` từng ô |
| **`animateLoop` (`map-surroundings-preview-5.html:10212`)** | **`1 662,4 ms`** (`86` lần, max `618,2 ms`) | `2 560` inclusive (`~1 060 ms`) | Vẽ `86` khung bản đồ trong khi màn che đang đậy kín! |
| ↳ Vẽ coverage (`drawCoverage` / `webgl-coverage-3.js:47`) | *(nằm trong `animateLoop`)* | `813` inclusive (`~337 ms`) | Vẽ **`48` khung coverage** dưới màn che không ai nhìn thấy |
| **Thu gom rác (`GC` / `GarbageCollect`)** | **`1 169,1 ms`** (`547` đợt, max `178,2 ms`) | `515` self V8 (`~213 ms`) | Hệ quả của **`2 373` lần `createElement('canvas')`**, `1 363` `putImageData` và buffer tạm |
| **`UpdateLayoutTree` + `Layout` + `Commit`** | `817,1` + `145,9` + `636,2 ms` | `getBoundingClientRect` `399` mẫu | `mount map-controls-island-reference-5.js:65` **`226,9 ms`**, `369` lượt `Commit` dưới màn che |
| **`closeIntroModal()` qua `memory-reference-5.js:15`** | **`564,8 ms`** (`3` timer, max `563,3 ms`) | `1 021` inclusive (`~423 ms`) | Chạy `renderMainScene()` **Canvas 2D đồng bộ** trước khi bật `holding = true`! |
| **WebGL terrain `run` (`webgl-terrain-renderer-3.js:133`)** | **`346,2 ms`** (`76` lần, max `15,5 ms`) | `617` inclusive (`~256 ms`) | Ghép `gpuTexture` (`67` mẫu `drawImage`), `texImage2D` (`60` mẫu), `earcut`, `shadow` |
| **Trang chủ còn chạy (`homepage-layered-renderer-5.js:86`)** | **`255,3 ms`** (`23` lần, max `169,5 ms`) | `459` inclusive (`~190 ms`) | Chạy trong `440 ms` rèm đang phủ lên trang chủ |
| **Bản thân JS của `map-prewarm-3.js`** (`check`, `tick`, `loads`, `step`) | **`71,5 ms`** (`45,3 + 15,7 + 7,2 + 3,3`) | Rất thấp | Chi phí bản thân nhỏ; tác động nằm ở **điều kiện `complete()`** buộc chờ toàn bộ hàng đợi |
| **Giải mã ảnh (`Decode Image`)** | **`0,1 ms`** (`1` sự kiện) | Không đáng kể | Ảnh trang chủ đã giải mã trước đó; không phải nút cổ chai của pha `entry` |

---

## 2. Điều kiện hé màn hiện tại và danh sách tile màn đang chờ (`đã tái hiện` & `suy luận từ mã`)

### 2.1. Chuỗi biến/hàm quyết định thời điểm màn che hết

1. **Pha phủ rèm (`memory-reference-5.js:75–111`):** Khi bấm `#memoryOpenMap`, gán `curtain.classList.add('is-covering')` rồi đợi **`later(finish, 440)`** (`440 ms` cố định) mới gọi `finish()`.
2. **Mở bản đồ đồng bộ (`map-surroundings-preview-5.html:8576–8600`):** `finish()` gọi `window.closeIntroModal()`, trong đó dòng `8593` gọi **`renderMainScene(performance.now())` TRƯỚC `intro.classList.add('intro-hidden')` và TRƯỚC `prewarm.hold()`**. Vì `GoiVietMapPrewarm3.holding()` lúc này còn là `false`, dòng bảo vệ `8955` (`if (!gpuTerrain && window.GoiVietMapPrewarm3?.holding() && window.GoiVietWebGLTerrain3?.usable()) return;`) **bị bỏ qua**, khiến `closeIntroModal()` chạy luôn nhánh **Canvas 2D fallback cho 34 tỉnh** và đẩy **`104` tile `terrain:2d`** thừa vào hàng đợi worker!
3. **Vòng chờ `hold()` (`map-prewarm-3.js:48–82`):** Ngay sau `closeIntroModal()`, `prewarm.hold(reveal, waiting)` đặt `holding = true`, gọi `terrain.resetLod()`, rồi thăm dò `complete(frames0)` mỗi `50 ms` cho đến khi đạt `true` **`2` lần liên tiếp** (`ok >= 2`, tối đa `SAFETY_MS = 30 000 ms`). `complete(frames0)` đòi đồng thời **3 nhóm điều kiện**:
   - `ground` (`map-prewarm-3.js:51`): `!t || (t.active && !t.pending && t.frames > frames0)` — WebGL terrain đã dựng hết toàn bộ 65 ring tỉnh và 62 tile đảo (`entries = 65`, `islandTiles = 62`, `pending = 0`) và vẽ ít nhất 1 khung thật.
   - `tiles` (`map-prewarm-3.js:53`): `!raster.pending && !raster.auxiliaryTasks && !raster.updating` — **toàn bộ** hàng đợi worker (`pending = 0`), **toàn bộ** tác vụ phụ (`backdrop`, `coverage-gpu3`, `auxiliaryTasks = 0`) và bộ đệm thông báo **`120 ms`** (`raster-scheduler-5.js:27`, `updating = false`) phải trống hoàn toàn.
   - `sea` (`map-prewarm-3.js:54`): `backdropCommits > 0 && !backdropPending && !backdropDirty && !coverageFallback && !refinePending` — `preview-5.js` đã hoàn tất dựng và commit lớp nền `regionalLandSeaCanvas` (`2440×1600`) **không thiếu bất kỳ tile nào** (`missing === false`), không còn hẹn giờ `deferBackdrop(180)` (`refinePending = false`).
4. **Pha yên tĩnh `quiet()` và mở rèm (`map-prewarm-3.js:58–62, 79`, `memory-reference-5.js:84, 93`):** Sau khi `ok === 2`, `quiet()` chờ **`5` khung rAF liên tiếp `< 25 ms`** (timeout `3 000 ms`), rồi gọi `reveal()` kích `is-revealing` và đợi thêm **`470 ms`** mới gọi `clearCurtain()`.

### 2.2. Dòng thời gian thực đo trong lượt `probe` riêng (`entry = 8 973 ms`, `đã đo`)

Dữ liệu gốc: [baseline-probe.json](../../verification/a01-phase1/baseline-probe.json), ảnh khung đầu sau khi hé: [baseline-first-frame.png](../../verification/a01-phase1/baseline-first-frame.png).

- `0 → 554,8 ms`: chờ `later(finish, 440)` (phủ rèm).
- `554,8 → 1 238,6 ms` (**`683,8 ms`**): `closeIntroModal()` chạy đồng bộ (sinh thừa `104` tile `terrain:2d`).
- `1 239,4 ms`: `prewarm.hold()` bắt đầu. `coverage-gpu3` chạy từ `284 → 2 411 ms`.
- `1 815,5 → 6 768,5 ms` (**`4 953 ms`**): `backdrop` lượt 1 (`2440×1600`, `missing = true` vì đụng `MAX_JOBS = 128`, **từ chối `27` tile `regional:thailand`**).
- `6 189,4 ms`: điều kiện **`ground` đã xong hoàn toàn** (`tEntries = 65`, `islandTiles = 62`, `tPend = 0`), nhưng màn vẫn phải chờ `tiles` và `sea` thêm **`2,11 s`** nữa!
- `6 981,1 → 7 533,3 ms` (**`552 ms`** + `213 ms` chờ `deferBackdrop(180)`): `backdrop` lượt 2 (xếp `27` tile Thái Lan bị từ chối ở lượt 1, vẫn `missing = true`).
- `7 637,2 → 8 182,6 ms` (**`545 ms`** + `104 ms` chờ): `backdrop` lượt 3 (`missing = false`, `backdropCommits = 2`).
- `8 294,8 ms`: lần đầu cả `ground && tiles && sea` cùng `true`; `8 444,2 ms`: `quiet()` xong và gọi `reveal()`.
- `8 444,2 → 8 973,3 ms` (`529 ms`): fade-out `470 ms` + 2 rAF cuối.

### 2.3. Kiểm kê tile đang phải chờ: trong viewport vs ngoài viewport / rỗng (`đã đo` từ `probe` + tính cắt đa giác trên `regional-geometry.js`)

Tại camera vào bản đồ (`1920×1080`, `zoom = 0,782`, `origin = [960; 555,5]`):
- **Khung nhìn thật `vpExact` (`pad = 0`):** `x ∈ [-891,0 ; 1660,4]`, `y ∈ [-275,3 ; 1151,4]`.
- **Khung nền đệm `vpMargin` (`pad = 260 px` + `margin = 70 / 0,782`):** `x ∈ [-1356,2 ; 2125,6]`, `y ∈ [-741,4 ; 1554,8]` (**diện tích gấp `1,88×` khung nhìn thật!**).

| Nhóm tile (`GoiVietRasterTasks.build`) | Tổng gọi | Hoàn tất | Bị từ chối (`queue full` / `abort`) | Tile duy nhất | Thực sự chạm nội dung trong `1920×1080` | Ngoài viewport (`guard + margin`) | Trong viewport nhưng **rỗng / không dùng** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `terrain:gpu` (`48×48`, `d=2`) | 33 | 33 | 0 | 33 | **33** | 0 | 0 |
| `sea` (`192×192`, `100×100 px`) | 276 | 273 | 0 / 3 | 276 | **112** | **164** *(148 guard + 16 ngoài guard)* | 0 *(chưa trừ ô dưới đất liền)* |
| `regional:context` (`192×192`, `148×148 px`) | 260 | 260 | 0 | 260 | **86** | **148** | **26** *(nằm hoàn toàn trên biển)* |
| `regional:laos` (`48×48`, `76×76 px`) | 120 | 120 | 0 | 120 | **59** | 0 | **61** *(ngoài đa giác Lào, bị `destination-in` cắt bỏ)* |
| `regional:cambodia` (`48×48`, `76×76 px`) | 49 | 49 | 0 | 49 | **39** | 0 | **10** *(ngoài đa giác Campuchia)* |
| `regional:thailand` (`48×48`, `76×76 px`) | 267 | 240 | **27** / 0 | 240 | **118** | 0 | **122** *(ngoài đa giác Thái Lan)* |
| `terrain:2d` (`48×48`, `d=1,5`) | 104 | 104 | 0 | 104 | **0** *(WebGL không dùng)* | 0 | **104** *(sinh thừa do `closeIntroModal` trước `hold`)* |
| **Tổng cộng** | **1 109** | **1 079** | **27 / 3** | **1 082** | **447 (`41,3%`)** | **312 (`28,8%`)** | **323 (`29,9%`)** |

**Kết luận kiểm kê:** Trong `1 082` tile duy nhất mà màn che bắt buộc phải chờ xong hết, **chỉ `447` tile (`41,3%`) thực sự đóng góp pixel cho khung nhìn đầu tiên `1920×1080`**. Tới **`635` tile (`58,7%`)** là dư thừa đối với khung đầu (`104` `terrain:2d` vô ích + `312` tile ngoài viewport + `219` tile hộp bao rỗng của `regional-renderer-4.js:82–83` bị cắt bỏ hoàn toàn bởi `destination-in`). Ngoài ra, cả 4 cụm đảo (`hoang-sa`, `truong-sa`, `phu-quoc`, `con-dao`) đều nằm trọn trong `vpExact` (`62` tile đảo dựng trong `webgl-terrain-renderer-3.js`).

---

## 3. Đề xuất 3 phương án sửa (chờ duyệt trước khi vào Pha 2)

> **Lưu ý tuân thủ quy tắc tệp dùng chung:** `git grep` xác nhận `map-prewarm-3.js` dùng chung với `preview-3/4` và `natural/regional-renderer-4.js` dùng chung với `preview-4`. Do đó **KHÔNG phương án nào sửa 2 tệp gốc này**; các phương án cần thay đổi chúng đều đề xuất **tách bản riêng `-5.js`** và chỉ trỏ `map-surroundings-preview-5.html` sang bản mới.

### Phương án 1 · Tối ưu luồng chính chỉ trên các tệp `-5` sẵn có (không tách tệp `-3`/`-4`)

- **Nội dung thay đổi:**
  1. **Loại pha vẽ Canvas 2D thừa và `104` tile `terrain:2d` lúc vào:** trong `memory-reference-5.js:85–97` và `map-surroundings-preview-5.html:8593`, cho `closeIntroModal()` bỏ qua lượt `renderMainScene()` Canvas 2D đồng bộ khi đang vào qua rèm có `GoiVietMapPrewarm3` và `GoiVietWebGLTerrain3.usable()`, để `prewarm.hold()` bật `holding = true` trước khi khung đầu tiên chạy. Đồng thời dừng vòng vẽ trang chủ (`setArtworkVisible(false)`) ngay khi bấm `#memoryOpenMap`.
  2. **Chuyển `ingest()` sang tạo `ImageBitmap` ngay trong worker (`natural/raster-scheduler-5.js:10, 29–38, 89–133`):** trong `workerMain`, gọi `createImageBitmap(new ImageData(...))` và transfer `ImageBitmap` về luồng chính (fallback về `ArrayBuffer` + `putImageData` nếu `createImageBitmap` không có hoặc lỗi), xóa bỏ `1 079` lần `createElement('canvas')` + `getContext('2d')` + `putImageData` trên luồng chính; nâng `MAX_JOBS` từ `128 → 256` khi `holding()` để loại `27` lần từ chối queue-full (bỏ được lượt `backdrop` thứ 3).
  3. **Bỏ `drawCoverage` dưới màn che kín và dùng chung 1 placeholder biển (`preview-5.js:437`, `natural/landscape-5.js:67`):** khi `GoiVietMapPrewarm3?.holding()` đang bật, không gọi `drawCoverage()` (tiết kiệm `48` khung vẽ phủ không ai thấy) và dùng 1 canvas mẫu nhỏ dùng chung thay cho `276` lần tạo canvas `8×8` gọi `putImageData`.
- **Tệp dự kiến đổi (0 tệp tách mới):** `map-surroundings-preview-5.html`, `memory-reference-5.js`, `natural/raster-scheduler-5.js`, `preview-5.js`, `natural/landscape-5.js`, kèm rebuild `offline-manifest-5.js`.
- **Ước lượng mức giảm (từ trace `9,70 s` / nền `8,54 s`):** cắt `~0,6–0,9 s` (`closeIntroModal` + `104` `terrain:2d`) + `~0,9–1,3 s` (`ingest`/`putImageData`/placeholder/GC) + `~0,8–1,1 s` (`drawCoverage` + bỏ 1 lượt `backdrop`) ⇒ **giảm `~2,3–3,3 s`**, trung vị dự kiến **`~5,2–6,2 s`**.
- **Rủi ro:**
  - *Biên đạt mục tiêu `≤ 6 s` khá sát*, vì vẫn còn `312` tile ngoài viewport + `219` tile hộp bao rỗng (`531` tile) phải chờ xong trước khi hé màn.
  - *Lộ ô trống:* rất thấp (giữ nguyên toàn bộ điều kiện `complete()` và `pad = 260 px`).
  - *Canvas fallback:* an toàn nếu chỉ bỏ bước `renderMainScene()` trước `hold()` khi `GoiVietWebGLTerrain3.usable() === true`, và giữ nguyên ngân sách lát `3 ms` khi không có WebGL.
  - *Hoàng Sa / Trường Sa:* không ảnh hưởng (vẫn chờ đủ `ground`).
  - *Worker lỗi:* nhánh `failWorker()` giữ nguyên đường `d.kernel` từng hàng + `putImageData` trên luồng chính.
  - *Ngoại tuyến / `file://`:* `createImageBitmap(new ImageData(...))` hoạt động thuần bộ nhớ, không dính CORS `file://`.
- **Cách kiểm:** đủ bộ kiểm Pha 2 (`n ≥ 10` ×4, kiểm ảnh khung đầu, Canvas fallback, worker lỗi, kéo/xoay FPS, ngoại tuyến `launchPersistentContext`, 8 suite).

---

### Phương án 2 *(Khuyến nghị)* · Phương án 1 + Lọc tile hộp bao rỗng (`regional-renderer-5.js`) + Dựng viewport trước, mở rộng dải đệm `260 px` sau khi hé (`map-prewarm-5.js`)

- **Nội dung thay đổi:** Gồm toàn bộ **Phương án 1**, cộng thêm 2 tối ưu giải quyết đúng `531` tile thừa trong bảng mục 2.3:
  1. **Tách `assets/goi-viet/map-surroundings-preview/natural/regional-renderer-5.js` (sao chép từ `regional-renderer-4.js`, giữ nguyên `-4.js` cho `preview-4`):**
     - Trước khi gọi `image(tx, ty, ...)` trong `paintSteps()` (dòng ~83), lọc ô `(tx, ty)` bằng phép kiểm cắt đa giác thực của `country.polygons` (lưu cache theo `country.id` tương tự `terrain-renderer-5.js:candidates()`), loại bỏ ngay **`219` tile hộp bao rỗng** (`61` Lào, `122` Thái Lan, `10` Campuchia, `26` context trên biển) mà **không mất 1 pixel nào**.
  2. **Tách `assets/goi-viet/map-surroundings-preview/map-prewarm-5.js` (sao chép từ `map-prewarm-3.js`, giữ nguyên global `window.GoiVietMapPrewarm3` và giữ nguyên `-3.js` cho `preview-3/4`) + dựng `backdrop` 2 pha trong `preview-5.js`:**
     - **Pha 1 (trong lúc giữ màn che):** khi `holding()` đang bật và chưa có `cachedCamera`, `startBackdrop()` dựng nền cho **đúng viewport `1920×1080` + viền an toàn nhỏ `pad = 32 px`** (thay vì `pad = 260 px + 70/zoom`) ⇒ loại **`~296` tile ngoài viewport** khỏi đường găng hé màn (giảm số tile bắt buộc từ **`1 082` → `~447`**, tức **`−58,7%`**) và giảm `42%` diện tích canvas `backdrop` lần đầu (`2,27 MP` thay vì `3,90 MP`). Đồng thời rút `notify` (`120 → 32 ms`) và `deferBackdrop` (`180 → 32 ms`) khi `holding()`.
     - **Điều kiện hé màn (`map-prewarm-5.js`):** giữ chặt nguyên tắc **100% khung nhìn `1920×1080` hoàn thiện** (`ground` đủ 34 tỉnh + 4 cụm đảo, `backdrop` Pha 1 đã `commit` với `missing === false`, toàn bộ tile của Pha 1 xong hết); tinh gọn `quiet()` từ `5` khung `< 25 ms` (timeout `3 000 ms`) xuống `2` khung rAF `< 50 ms` (timeout `400 ms`).
     - **Pha 2 (ngay sau khi rèm hé, chạy nền ở ngân sách tương tác `3 ms` bình thường):** tự động nâng cấp `backdrop` lên dải đệm đầy đủ `pad = 260 px` (tái dùng `100%` tile trong viewport đã cache, chỉ bổ sung `~296` tile ngoài mép rồi hoán đổi canvas nguyên tử khi hoàn tất).
- **Tệp dự kiến tách mới (cần duyệt trước khi làm):**
  - `assets/goi-viet/map-surroundings-preview/map-prewarm-5.js` *(mới, tách từ `map-prewarm-3.js`)*
  - `assets/goi-viet/map-surroundings-preview/natural/regional-renderer-5.js` *(mới, tách từ `natural/regional-renderer-4.js`)*
- **Tệp dự kiến sửa:** `map-surroundings-preview-5.html` (trỏ 2 thẻ `<script>` sang `-5.js`, sửa `closeIntroModal()`, nâng `?v=`), `memory-reference-5.js`, `natural/raster-scheduler-5.js`, `preview-5.js`, `natural/landscape-5.js`, `tools/build-preview-5-offline.py` (loại `regional-renderer-4.js` khỏi tập quét `natural/` để gói ngoại tuyến không dư bản cũ), rebuild `offline-manifest-5.js`.
- **Ước lượng mức giảm (có cơ sở từ trace + đếm tile):** giảm **`58,7%` tổng số tile đường găng** (`1 082 → ~447`) kết hợp `ImageBitmap` trong worker + bỏ Canvas 2D thừa + bỏ 2 lượt vẽ `backdrop` trùng + bỏ `48` khung `drawCoverage` dưới màn che ⇒ **ước giảm `~3,8–4,8 s`**, trung vị dự kiến **`~3,7–4,7 s`** (**vượt mục tiêu `≤ 6,0 s` với biên an toàn `~1,3–2,3 s`**).
- **Rủi ro & giảm thiểu:**
  - *Lộ ô trống:* khung đầu `1920×1080` kín 100% vì `pad = 32 px` vượt quá mép màn hình và chỉ hé khi `missing === false`. Nếu người dùng kéo mạnh ngay trong 1–2 giây đầu trước khi Pha 2 `260 px` xong, phần mép mới lộ dùng ngay `webgl-coverage-3` (đã dựng xong) như cơ chế kéo nhanh hiện hữu, rồi được thay mịn khi Pha 2 commit.
  - *Canvas fallback (không WebGL):* `regional-renderer-5.js` (bỏ `219` tile rỗng) và Pha 1 `pad = 32 px` (bỏ `296` tile ngoài viewport) giúp cả nhánh Canvas fallback **vào nhanh hơn** trong khi vẫn giữ ngân sách lát `3 ms / 8 ms` (theo GĐ6 dòng 11–12 của `raster-scheduler-5.js`).
  - *Hoàng Sa / Trường Sa:* cả hai quần đảo nằm trong `vpExact` và vẫn do `ground` (`webgl-terrain-renderer-3.js`, `62` tile đảo) bảo đảm hoàn thiện trước khi hé màn.
  - *Worker lỗi:* `failWorker()` giữ nguyên cơ chế fallback luồng chính từng hàng và `SAFETY_MS` bảo vệ không treo rèm.
  - *Ngoại tuyến / `file://`:* `map-prewarm-5.js` và `regional-renderer-5.js` được đưa vào `offline-manifest-5.js`, kiểm `--check PASS` và chạy ngoại tuyến thật trên hồ sơ lưu đĩa; `ImageBitmap` thuần bộ nhớ hoạt động cả trên `file://`.
- **Cách kiểm:** đầy đủ bộ kiểm Pha 2 (`n ≥ 10` ×4 + Mann–Whitney hai phía, ảnh khung đầu sau hé, Canvas fallback `n ≥ 10`, worker lỗi `n ≥ 10`, kéo/xoay FPS `n ≥ 10`, ngoại tuyến `launchPersistentContext`, đủ 8 suite).

---

### Phương án 3 · Phương án 2 + Chạy song song dựng bản đồ ngay trong pha phủ rèm `440 ms` & rút fade-out

- **Nội dung thay đổi:** Toàn bộ **Phương án 2**, cộng thêm:
  1. Trong `memory-reference-5.js:84, 105–108`: bắt đầu `closeIntroModal()` + `prewarm.hold()` song song sớm hơn (hoặc ngay khi rèm đạt độ mờ che kín) thay vì chờ trọn `440 ms` rồi mới khởi động dựng bản đồ, và rút thời gian fade-out mở rèm (`470 ms → 240 ms`, thêm ghi đè CSS chuyển cảnh trong CSS riêng của preview-5 thay vì sửa `memory-reference-v2.css`).
  2. Trong `map-prewarm-5.js:38–42`: khi prewarm ở trang chủ, chỉ chuẩn bị 1 mức zoom `overview` chính thay vì xếp hàng đồng thời cả `high` và `low` zoom.
- **Tệp dự kiến đổi:** toàn bộ tệp của **Phương án 2** + thêm quy tắc rút `transition` của `.mc-transition` trong CSS riêng preview-5.
- **Ước lượng mức giảm:** giảm thêm `~0,5–0,8 s` so với Phương án 2 ⇒ trung vị dự kiến **`~3,0–4,0 s`**.
- **Rủi ro:** thay đổi cảm giác nhịp chuyển cảnh rèm (có thể gây khựng nhẹ khi rèm đang phủ lên Miền ký ức vì `closeIntroModal()` + `mount` DOM chạy trùng với animation phủ rèm) và có nguy cơ tác động tới thời điểm chờ của các test chuyển cảnh (`check-memory-v5.cjs`, `check-arrival-demo-5.cjs`).

---

## 4. Tóm tắt so sánh để chọn phương án cho Pha 2

| Tiêu chí | Phương án 1 | Phương án 2 *(Khuyến nghị)* | Phương án 3 |
| --- | --- | --- | --- |
| Tách thêm tệp `-5.js` | Không (`0` tệp mới) | Có: `map-prewarm-5.js`, `regional-renderer-5.js` | Như Phương án 2 + chỉnh nhịp rèm |
| Chạm tệp `-3`/`-4` dùng chung | Không | Không | Không |
| Giảm số tile đường găng | `1 082 → 978` (`−9,6%`) | **`1 082 → ~447` (`−58,7%`)** | `1 082 → ~447` (`−58,7%`) |
| Dự kiến trung vị vào bản đồ `×4` (mục tiêu `≤ 6 s`) | `~5,2–6,2 s` *(sát ngưỡng)* | **`~3,7–4,7 s`** *(dư biên an toàn)* | `~3,0–4,0 s` |
| Giữ nguyên trải nghiệm chuyển cảnh rèm | Giữ nguyên 100% | Giữ nguyên 100% | Đổi nhịp phủ/hé rèm |

**Đề xuất:** Chọn **Phương án 2** để đạt chắc chắn mục tiêu `≤ 6 s` với biên an toàn lớn, không đổi nhịp hoạt cảnh rèm, không lộ ô trống trong viewport và hoàn toàn cô lập trên `preview-5`. Đang dừng tại Pha 1 chờ bạn chọn phương án để triển khai Pha 2.

# Báo cáo Pha 1 — Đo mốc nền, bóc chi phí và đề xuất phương án cho A-04 và A-03 (preview-5)

- **Phạm vi**: Chỉ đo đạc, phân tích và đề xuất phương án trên `map-surroundings-preview-5.html` tại `HEAD = f85e7d1` (nhánh `p5-05`, sau khi đã gộp A-01 và theme tối T-01…T-06). **Chưa sửa bất kỳ tệp mã nào ở Pha 1** (`git status` sạch ngoài tệp báo cáo này).
- **Tài liệu tham chiếu**: [AGENTS.md](file:///d:/HCMUS/vietnam-heritage-map-2/AGENTS.md), [BAO-CAO-A-DO-HOA-WEBGL.md](file:///d:/HCMUS/vietnam-heritage-map-2/docs/06-ra-soat-chuyen-sau/BAO-CAO-A-DO-HOA-WEBGL.md) (phần 2, mục A-03, A-04 và mục "Bay camera tách khỏi mở phiếu ga").
- **Quy ước gắn nhãn trong báo cáo**:
  - `đã đo`: số liệu trực tiếp từ 30 phiên benchmark sạch (`n = 10` mỗi nhóm), 3 trace Chromium độc lập và 3 lượt đếm API độc lập.
  - `đã tái hiện`: hành vi/chuỗi gọi quan sát trực tiếp khi chạy kịch bản trên `preview-5`.
  - `suy luận từ mã`: giải thích nhân quả từ mã nguồn và ước lượng mức cải thiện dự kiến ở Pha 2.

---

## 1. Môi trường, phương pháp đo và mốc nền hiện tại (`HEAD = f85e7d1`)

### 1.1. Điều kiện đo (`đã đo`)
- **Trình duyệt & GPU**: Google Chrome 157 (kênh thật, không SwiftShader), WebGL `UNMASKED_RENDERER_WEBGL = ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`.
- **Khung hình & CPU**: viewport `1920×1080`, `devicePixelRatio = 1`, `Emulation.setCPUThrottlingRate(4)` (`×4`), nền tải CPU hệ thống ở trạng thái nghỉ trước mỗi lượt.
- **Đường vào và trạng thái bản đồ**: tái sử dụng đúng đường vào như `scratch/audit-06/graphics-session.cjs` (mở trang chính → bấm `Miền ký ức` → bấm `Mở bản đồ` → chờ màn che mở hẳn và bản đồ ổn định ở trạng thái sau pha 2 của A-01: `backdropPad = 260`, `terrainActive = true`, không đang có tác vụ raster nền).
- **Kỹ thuật lấy mẫu**: `n = 10` tiến trình Chrome mới độc lập cho từng chuỗi (`30/30` tiến trình sạch, `0` lỗi console/pageerror), chạy xen kẽ theo thứ tự vòng tròn `VI-main → EN-main → VI-focus` (`10` vòng) để loại trừ trôi nhiệt/nền. Trace Chromium (`3` phiên) và bộ đếm API (`3` phiên) chạy tách biệt hoàn toàn, **không tính** vào thống kê `n = 10`.
- **Dọn dữ liệu tạm**: toàn bộ hồ sơ Chrome và tệp trace thô tạm đặt ở ổ `D:` (`verification/audit-06/a03-a04-tmp/`) đã được xóa sau khi trích xuất bản tóm tắt gọn tại [bench-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase1/bench-summary.json), [trace-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase1/trace-summary.json), [trace-drilldown.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase1/trace-drilldown.json) và [counters-summary.json](file:///d:/HCMUS/vietnam-heritage-map-2/verification/audit-06/a03-a04-phase1/counters-summary.json).

### 1.2. Bảng mốc nền `HEAD = f85e7d1` (`n = 10`, `×4`, `1920×1080`) — `đã đo`

| Kịch bản | n | FPS Trung vị | FPS Q1–Q3 | FPS IQR | Thời gian Trung vị (ms) | Thời gian Q1–Q3 (ms) | Thời gian IQR (ms) | `maxGap` rAF Trung vị (ms) | Mốc audit gốc (trước A-01) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| **(a) VI: Chọn Hà Nội + bay + mở phiếu ga** | 10 | **24,62** | 23,09–27,20 | 4,11 | **1799,75** | 1690,08–1908,18 | 218,10 | **358,30** | 10,83 FPS (IQR 4,58) |
| **(b) VI: Bay riêng tới Huế (không mở phiếu)** | 10 | **34,45** | 31,90–36,78 | 4,88 | **543,75** | 534,30–565,00 | 30,70 | **66,60** | 20,49 FPS / 616,65 ms |
| **(c) VI: Kéo trái 14 bước (ổn định, `pad = 260`)** | 10 | **53,62** | 53,11–54,28 | 1,17 | **982,60** | 966,07–1020,72 | 54,65 | **41,70** | 37,65 FPS (IQR 10,02) |
| **(d) VI: Xoay phải 14 bước (ổn định, `pad = 260`)** | 10 | **35,34** | 34,91–38,17 | 3,26 | **914,25** | 862,75–934,38 | 71,62 | **149,95** | 24,47 FPS (IQR 3,14) |
| **(e-a) EN: Chọn Hà Nội + bay + mở phiếu ga** | 10 | **26,80** | 25,31–27,18 | 1,87 | **1772,30** | 1692,53–1850,10 | 157,57 | **325,05** | — |
| **(e-c) EN: Kéo trái 14 bước (ổn định, `pad = 260`)** | 10 | **53,34** | 50,17–55,72 | 5,55 | **985,25** | 959,05–1008,58 | 49,53 | **50,00** | — |
| **(e-d) EN: Xoay phải 14 bước (ổn định, `pad = 260`)** | 10 | **37,29** | 35,52–38,32 | 2,80 | **882,40** | 860,67–929,68 | 69,00 | **133,40** | — |

**Nhận xét nhanh từ mốc nền (`đã đo`)**:
1. Sau khi A-01 loại bỏ tranh chấp raster nền lúc mở bản đồ, mọi kịch bản đều đã cải thiện đáng kể so với đợt rà soát gốc, nhưng **3 kịch bản vẫn dưới ngưỡng mượt**:
   - **(a) Chọn Hà Nội + bay + mở phiếu ga**: chỉ đạt **24,62 FPS (VI)** / **26,80 FPS (EN)**, có cú khựng dài tới **358,30 ms (VI)** / **325,05 ms (EN)** (~20 khung hình bị đứng), tổng thời gian ~1,80 s.
   - **(b) Bay riêng tới Huế**: đạt **34,45 FPS**, mất **543,75 ms**, vẫn có cú khựng **66,60 ms** ngay đầu pha bay.
   - **(d) Xoay phải 14 bước**: chỉ đạt **35,34 FPS (VI)** / **37,29 FPS (EN)**, có cú khựng **149,95 ms (VI)** / **133,40 ms (EN)**.
2. **(c) Kéo trái 14 bước** ở trạng thái ổn định đã đạt **53,62 FPS (VI, IQR 1,17)** và **53,34 FPS (EN, IQR 5,55)** — vượt ngưỡng 50 FPS.
3. **So sánh VI vs EN**: tiếng Anh **không chậm hơn tiếng Việt** ở cả 3 kịch bản (`fly` 26,80 vs 24,62; `drag` 53,34 vs 53,62; `rotate` 37,29 vs 35,34). Do đó, nhãn tiếng Anh dài hơn không tạo ra điểm nghẽn riêng trên bản đồ đã ổn định.

---

## 2. Bóc chi phí từ trace Chromium và bộ đếm API (tách biệt với `n = 10`)

### 2.1. Bảng tổng hợp Forced/Normal `UpdateLayoutTree`, `Layout` và số lần gọi API (`đã đo`)

> Lưu ý phương pháp bóc `Forced Layout` / `Forced RecalcStyle`: trong trace Chromium 157 (khi không bật `disabled-by-default-devtools.timeline.stack`), các sự kiện `UpdateLayoutTree` và `Layout` nằm **lồng trọn bên trong một span `FunctionCall` trên luồng chính** được đếm là cưỡng bức (`Forced`), còn các sự kiện chạy ở chu kỳ vẽ bình thường ngoài `FunctionCall` được tách thành `Normal`.

| Kịch bản (1 lượt trace / 1 lượt đếm API) | Thời lượng trace (ms) | Forced `UpdateLayoutTree` (lần / tổng ms / max ms) | Normal `UpdateLayoutTree` (lần / tổng ms / max ms) | Forced `Layout` (lần / tổng ms / max ms) | Normal `Layout` (lần / tổng ms / max ms) | `getBoundingClientRect` (lần) | `measureText` (lần) | `drawImage` (lần) | `legibility` (`layouts` / `reuses`) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **(a) VI `fly`** | 2342,6 | **62 / 458,1 / 116,6** | **11 / 293,4 / 76,3** | **10 / 28,6 / 13,2** | **7 / 65,1 / 41,7** | **309** | **280** | **66** | 8 / 35 |
| **(e-a) EN `fly`** | 1885,3 | **74 / 337,3 / 87,2** | **11 / 181,2 / 50,0** | **10 / 23,2 / 11,1** | **7 / 30,1 / 16,9** | **309** | **275** | **70** | 8 / 35 |
| **(b) VI `focus_hue`** | 602,1 | **31 / 79,3 / 50,3** | 0 / 0 / 0 | 1 / 3,4 / 3,4 | 0 / 0 / 0 | **0** | **117** | **74** | 1 / 21 |
| **(c) VI `drag`** | 1120,3 | 46 / 36,1 / 2,8 | 23 / 50,2 / 4,0 | 0 / 0 / 0 | 0 / 0 / 0 | **29** | **65** | **139** | 1 / 15 |
| **(e-c) EN `drag`** | 1013,6 | 42 / 27,6 / 1,2 | 19 / 47,4 / 3,6 | 0 / 0 / 0 | 0 / 0 / 0 | **29** | **65** | **117** | 1 / 15 |
| **(d) VI `rotate`** | 1150,9 | **34 / 80,1 / 48,2** | 17 / 48,6 / 4,0 | 1 / 1,4 / 1,4 | 1 / 0,8 / 0,8 | **15** | **65** | **81** | **4 / 12** |
| **(e-d) EN `rotate`** | 871,2 | **34 / 54,8 / 30,0** | 17 / 39,7 / 3,4 | 1 / 1,2 / 1,2 | 1 / 0,6 / 0,6 | **15** | **65** | **69** | **4 / 12** |

### 2.2. Bóc chi tiết từng điểm nghẽn theo kịch bản

#### A. Pha **(a) `fly` — Chọn Hà Nội + bay + mở phiếu ga (A-04, ưu tiên 1)**

1. **Tổng chi phí Style + Layout chiếm gần 36% thời lượng pha `fly` (`đã đo`)**:
   - VI: `UpdateLayoutTree` tổng **751,53 ms** (trong đó **458,11 ms** là cưỡng bức) + `Layout` tổng **93,65 ms** (cưỡng bức **28,55 ms**) = **845,18 ms** trên 2342,6 ms!
   - EN: `UpdateLayoutTree` tổng **518,50 ms** (cưỡng bức **337,29 ms**) + `Layout` tổng **53,25 ms** (cưỡng bức **23,16 ms**) = **571,75 ms** trên 1885,3 ms.
   - **5 tác vụ dài nhất (`LongTask`) trong trace VI `fly` (`đã đo`)**:
     - `314,0 ms` (`EventDispatch` click `#arrivalExplore`): `UpdateLayoutTree 215,2 ms + Layout 56,0 ms`.
     - `270,4 ms` (`FireAnimationFrame`: `polish-arrival-5.js:37` = `110,4 ms` + `animateLoop` = `50,6 ms`): chứa `UpdateLayoutTree 176,7 ms + Layout 9,5 ms`.
     - `209,8 ms` (`EventDispatch` click chip Hà Nội `arrival-demo-5.js:53` = `181,5 ms`): chứa `UpdateLayoutTree 141,2 ms + Layout 20,4 ms`.
     - `159,4 ms` (`FireAnimationFrame`: `heritage-frame.js:49` = `123,5 ms` + `animateLoop` = `18,5 ms`): chứa `UpdateLayoutTree 119,1 ms + Layout 3,4 ms`.
     - `147,0 ms` (`FireAnimationFrame`: `animateLoop` = `124,5 ms`): chứa `UpdateLayoutTree 48,0 ms + Layout 1,6 ms`.
   - Top hàm trong `callsMs` (VI / EN `fly`, `đã đo`): `animateLoop` (`871,3 / 770,6 ms`), `arrival-demo-5.js:53` (`181,5 / 118,7 ms`), `heritage-frame.js:49` (`127,2 / 84,8 ms`), `polish-arrival-5.js:37` (`115,1 / 91,9 ms`).
   - Top V8 `selfSamples` (VI / EN `fly`, `đã đo`): `getBoundingClientRect` (**1157 / 747**), `label-performance-arrival-5.js:52` (**240 / 175**), `measureText` (**214 / 188**), `measure label-performance-arrival-5.js:64` (**104 / 72**), `renderMainScene` (`79 / 82`), `placeCountryLabels` (`71 / 81`).

2. **Phân rã đầy đủ `309` lần `getBoundingClientRect` trong 1 lượt `fly` (VI và EN giống hệt nhau, `đã đo`)**:
   Trong chỉ 1 lần bấm chọn Hà Nội → bấm Khám phá để mở phiếu ga, `syncMapControlLayout()` bị gọi **13 lần** và `syncHeaderOffset()` bị gọi **10 lần**:

   | Nguồn gọi (`tệp:dòng`) | Số lần `gBCR` | Ghi chú thực tế (`đã tái hiện` / `suy luận từ mã`) |
   |---|---:|---|
   | [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8661-L8696) `syncMapControlLayout()` | **91** (`13 × 7`) | Đọc lại `mainCanvas`, `dock` (**2 lần** tại L8664 và L8696!), `header`, `helper`, `panel`, `switcher` ở mỗi lượt |
   | [journey-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L106-L157) `positionBar` + `adjustControlLayout` + `focus` | **75** | `positionBar` (`24` + `7` + `7` `Range`) + `adjustControlLayout` (`13×2 + 5×2 = 36`, tự đọc lại `dock` và đặt `barLayoutDirty = true` kéo theo đọc lặp!) + `focus` (`1`) |
   | [heritage-frame.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/heritage-frame.js#L25-L31) `insets()` (gọi từ `syncMapControlLayout` L8690) | **52** (`13 × 4`) | Đọc 4 thanh `.hf-rail` lặp lại 13 lần dù kích thước khung `mapScene` **không hề đổi** trong pha `fly` |
   | [label-performance-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/label-performance-arrival-5.js#L52-L56) `ui()` | **28** (`42 reads`, `revisionDelta = 5`) | Quét 7 phần tử UI mỗi khi `MutationObserver` bắt thấy đổi `hidden`/`style`/`class` |
   | [heritage-frame.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/heritage-frame.js#L33-L38) `updateObstacles()` (gọi từ `syncSafeArea` L53) | **24** (`3 × 8`) | Đọc 4 rail + 4 góc `.hf-corner` 3 lần dù cửa sổ không resize |
   | [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8706-L8721) `syncHeaderOffset()` | **20** (`10 × 2`) | Đọc `header` và `dock`, ghi vô điều kiện `--header-offset` & `--dock-offset`, gọi `syncMapControlLayout()` (đọc lại đúng `header` & `dock`!), rồi ghi trùng `--map-center-x` & `--map-space-width` (L8718–8719) |
   | [map-controls-island-reference-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-controls-island-reference-5.js#L46-L54) `sync()` | **13** (`13 × 1`) | Đọc lại `.top-header` dù `syncMapControlLayout()` vừa đọc ở L8669; ghi vô điều kiện `--gv-camera-menu-height` (L54) |
   | [arrival-demo-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L266-L285) `fitSheet()` | **6** (`3 × 2`) | Bị gọi cả trong `openSheet` (L320, ngay sau `sheet.hidden = false`) lẫn lặp lại trong double-rAF của `focusCurrent` (L296) |
   | **Tổng cộng** | **309** | **Khớp 100% với tổng đo được** (`đã đo`) |

3. **Vì sao chuỗi gọi nhân bản lên 10–13 lượt và mỗi lần `UpdateLayoutTree` tốn 48–116 ms (`suy luận từ mã`, khớp trace `đã đo`)**:
   - **Vòng lặp gọi thừa giữa 4 tệp**:
     - Khi danh sách `#stationPanel` **đã đóng sẵn** (`collapsed === true`), bấm chip Hà Nội (`arrival-demo-5.js:142` `closeList`) và sau đó mở phiếu (`arrival-demo-5.js:313` `closeList`) đều gọi `polish-arrival-5.js:39` `setCollapsed(true)`. Do `setCollapsed` **không kiểm tra `collapsed === next`**, nó vẫn chạy `layout()` + `animateLayout()` (`L37`), gọi ngay `syncHeaderOffset()` đồng bộ **và** lên lịch thêm 1 `rAF` gọi `syncHeaderOffset()` + `GoiVietMapFrame.syncSafeArea()` (lên lịch tiếp 1 `rAF` khác ở `heritage-frame.js:49` gọi `fitArtwork(); updateObstacles(); syncHeaderOffset();`).
     - Song song đó, `journey-arrival-5.js:162` `syncControls()` bị gọi 2 lần ngay khi bấm chip (từ `journey.select → transition` và từ `arrivalDemo.selected`), rồi thêm 2 lần khi bấm Khám phá (`journey.explore` và `arrivalDemo.openSheet`); mỗi lần `syncControls()` đều ghi nhiều thuộc tính `.hidden` rồi gọi ngay `positionBar()` (`L205`) đọc `getBoundingClientRect()` đồng bộ (gây forced layout ngay trong sự kiện click!), và khi `bar.hidden` đổi (`L206`) lại lên lịch thêm `rAF` gọi `syncMapControlLayout(); syncSafeArea(); positionBar();`.
     - Khi mở phiếu (`openSheet` → `focusCurrent`, `arrival-demo-5.js:287–307`), lại gọi thêm `syncSafeArea()` + double-rAF gọi `syncHeaderOffset()` và `fitSheet()` lần nữa.
   - **Tại sao mỗi lần `UpdateLayoutTree` nặng bất thường (48–116 ms ở ×4)**:
     - `arrival-demo-5.css` và `legibility-5.css` chứa ~25 bộ chọn mức gốc dạng `body[data-arrival-demo][data-regional-preview]:has(#introScreen.intro-hidden)` và `:has(#stationPanel:not([hidden]))` / `:not(:has(> button:not([hidden])))`.
     - Bất kỳ lệnh ghi biến CSS trên `documentElement` / `#mapScene` (`--header-offset`, `--dock-offset`, `--map-center-x`, `--map-space-width` ghi vô điều kiện ở `syncHeaderOffset` L8710–8719; `--hf-scale` ghi vô điều kiện ở `heritage-frame.js:22`) hoặc gán thuộc tính `.hidden` trên DOM đều làm mất hiệu lực style trên quy mô lớn toàn trang; ngay sau đó một lệnh đọc `getBoundingClientRect()` (hoặc gán `ctx.font`) ép Blink chạy `UpdateLayoutTree` toàn trang ngay lập tức.

#### B. Pha **(b) `focus_hue` — Bay riêng tới Huế, không mở phiếu (`34,45 FPS`, `maxGap 66,60 ms`)**

- **`getBoundingClientRect` = `0` lần (`đã đo`)!** Điều này bác bỏ giả thuyết cũ rằng `getBoundingClientRect` là nguyên nhân chậm khi bay camera thuần túy.
- **Nguyên nhân thật trong trace `focus_hue` (`đã đo` + `suy luận từ mã`)**:
  1. **Forced `UpdateLayoutTree` = `31` lần / `79,34 ms` (cú khựng lớn nhất `50,27 ms` nằm gọn trong `animateLoop` đầu tiên dài `105,9 ms`)**:
     - Trong `renderMainScene` → `paintBackdrop`, `preview-5.js:175` ghi `background.style.transform = css; waveCanvas.style.transform = css;` và ở khung đầu tiên khi vượt vùng đệm `preview-5.js:271` gán `overviewCanvas.hidden = !show` (làm bẩn style toàn trang vì các quy tắc `:has(...[hidden])`, tương tự ghi chú đã có sẵn ở `webgl-coverage-3.js:58` và `archipelago-renderer-5.js:98`).
     - Ngay sau đó, `placeCountryLabels` (`preview-5.js:210`), vòng lặp đảo (`map-surroundings-preview-5.html:9091`) và `paintIslandLabel` (`preview-5.js:545`) gán `context.font = ...` — buộc Blink chạy `UpdateLayoutTree` đồng bộ bên trong `animateLoop`!
  2. **Công việc thừa trên vòng lặp vẽ mỗi khung (`đã đo`)**:
     - **`88 / 117` lần `measureText` (75,2%) là tính toán chết** tại [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L9091-L9102): vòng `DATA.islands.forEach` gán `ctx.font` và gọi `ctx.measureText(label)` cho 4 cụm đảo **trước** khi gọi `GoiVietRegionalPreview.paintIslandLabel(...)`, trong khi hàm này luôn trả `true` khi bản đồ mở và vứt bỏ hoàn toàn `halfLabelWidth`/`labelX`! (Ở `fly` con số chết này là `172 / 280`, ở `drag` và `rotate` là `64 / 65` — chiếm 98,5%!)
     - `placeCountryLabels` (`preview-5.js:204`): **127 mẫu V8 self** (đứng #1 toàn JS trong `focus_hue`), cùng `measure` (`label-performance-arrival-5.js:64`, **37 mẫu self**, gọi `JSON.stringify` mảng 9 thuộc tính context **468 lần** chỉ trong 0,6 s!). Ngoài ra `size = Math.round(... * 4) / 4` (`preview-5.js:208, 218, 544`) tạo ra nhiều cỡ chữ lệch 0,25 px liên tục khi zoom thay đổi trong lúc bay → `29` lần `measureText` miss cache và raster lại glyph.
     - `paintLandmarks` (`preview-5.js:528`): `66` lần `drawImage` (**24 mẫu self**) vẽ trực tiếp ảnh nguồn `data:image/svg+xml` lên Canvas 2D ở mỗi khung hình.

#### C. Pha **(c) `drag` và (d) `rotate` — Trạng thái ổn định (`pad = 260`) (A-03, ưu tiên 2)**

1. **`drag` (`53,62 FPS` VI / `53,34 FPS` EN)**:
   - Không có `Layout` nào (`0` lần). `29` lần `getBoundingClientRect` gồm `14` lần ở `mousemove` (`map-surroundings-preview-5.html:9786`), `1` lần ở `L9805`, và **`14` lần đọc thừa ở [preview-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L124-L130) `panBy(dx, dy, x, y)`** — hàm này đọc `mainCanvas.getBoundingClientRect()` dù `x, y` đã được truyền sẵn và biến `bounds` không dùng tới!
   - `46` lần Forced `UpdateLayoutTree` nhỏ (~0,8 ms/lần, tổng `36,1 ms` VI / `27,6 ms` EN) đến từ `style.transform` → `context.font` trong `animateLoop`.
   - `64 / 65` lần `measureText` là lệnh chết tại HTML `L9096`. `76` lần `drawImage` ở `paintSeaSteps` chạy sau thao tác khi tinh chỉnh nền ở trạng thái nghỉ.
2. **`rotate` (`35,34 FPS` VI / `37,29 FPS` EN, `maxGap 149,95 ms` VI / `133,40 ms` EN)**:
   - Trace VI `rotate` lộ rõ nguyên nhân cú khựng ~150 ms (`LongTask = 210,6 ms` ở VI; `123,6 ms` ở EN, `đã đo`):
     1. **Forced `UpdateLayoutTree` = `34` lần / `80,05 ms` (đỉnh `48,21 ms` ở VI; `54,78 ms` / đỉnh `30,0 ms` ở EN)** khi xoay vượt dải đệm `260 px` khiến `placeOverview` (`preview-5.js:271`) và `drawCoverage` (`preview-5.js:453`) đổi `.hidden`, kéo theo `UpdateLayoutTree` toàn trang ngay bên trong `animateLoop`!
     2. **`placeCountryLabels` (`preview-5.js:204`) = `128` mẫu self (VI) / `83` (EN)** + **`measure` (`label-performance-arrival-5.js:64`) = `65` mẫu self (VI) / `42` (EN)**: gọi `JSON.stringify` **837 lần** trong 0,9 s!
     3. **`paintLabels` (`province-legibility-5.js:68`) = `48` mẫu self (VI) / `30` (EN)**, `inclusive = 156` mẫu + **GC tăng vọt (`134` mẫu self ở VI, `59` ở EN; có `MajorGC 50,3 ms` trong trace VI và `28,2 ms` trong trace EN)**: do ngưỡng `Math.abs(cam.yaw - layoutCamera.yaw) > 0.16` (`province-legibility-5.js:98`) kích hoạt tính toán bố cục nhãn đầy đủ **`4` lần** chỉ trong một cú xoay 14 bước (`yaw` đi từ `0` đến `0,65` rad), tạo lượng lớn đối tượng tạm và kiểm tra va chạm 34 tỉnh giữa lúc đang xoay.
     4. **`drawImage` trong `paintLandmarks` (`preview-5.js:528`) = `61` lần (`35` mẫu self VI / `21` EN)**: vẽ lại trực tiếp 4 ảnh SVG ở mỗi khung.
     5. **`paint webgl-coverage-3.js:47` = `121` mẫu self VI / `26` EN**: bật lên khi xoay làm hở mép nền đệm. *(Lưu ý: `webgl-coverage-3.js` là tệp đuôi `-3` dùng chung — **không sửa** theo quy tắc dự án.)*
     6. **`64 / 65` lần `measureText` chết** tại HTML `L9096`.

---

## 3. Kết luận về A-03 dựa trên mốc nền mới

- **Kéo bản đồ (`drag`)**: đã đạt **53,62 FPS (VI)** / **53,34 FPS (EN)** (`≥ 50 FPS`, `maxGap 41,7–50,0 ms`). **Không cần** tối ưu riêng cho kéo bản đồ (trừ việc sửa 1 dòng đọc thừa `getBoundingClientRect()` trong `panBy` vì không có rủi ro).
- **Xoay bản đồ (`rotate`)**: **vẫn còn chậm** ở **35,34 FPS (VI)** / **37,29 FPS (EN)** với cú khựng **~133–150 ms** — và **bay riêng tới Huế (`focus_hue`)** cũng chỉ đạt **34,45 FPS** với cú khựng **~67 ms**.
- **Kết luận đề xuất**: **Giữ một gói sửa A-03 chọn lọc, rủi ro thấp** đi cùng A-04, **không bỏ hẳn A-03**, vì 4 nguyên nhân gốc nặng nhất của `rotate` (`overviewCanvas.hidden`/`coverageCanvas.hidden` gây cú `UpdateLayoutTree` 30–50 ms; `measureText` chết ở HTML L9096; `JSON.stringify` trong `label-performance-arrival-5.js:65`; và SVG `drawImage` trong `paintLandmarks`) **trùng khớp trực tiếp** với nguyên nhân làm chậm cả `focus_hue` (A-04) lẫn `fly` (A-04). Không đụng vào thuật toán tránh chồng nhãn tỉnh ở trạng thái dừng để giữ an toàn hiển thị tuyệt đối.

---

## 4. Đề xuất 3 phương án sửa cho Pha 2

> **Lưu ý về tệp dùng chung `heritage-frame.js`**: qua `git grep`, [heritage-frame.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/heritage-frame.js) hiện được nạp bởi cả 6 trang (`preview`, `preview-2`, `preview-3`, `preview-4`, `preview-5`, `preview-5-arrival-demo`). Theo quy tắc dự án, **tuyệt đối không sửa trực tiếp `heritage-frame.js`**. Phương án 2 và 3 đề xuất xin phép **tách mới tệp riêng `assets/goi-viet/map-surroundings-preview/heritage-frame-5.js`** và chỉ trỏ [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L4189) sang tệp mới (giống tiền lệ đã duyệt cho `regional-renderer-5.js` và `map-prewarm-5.js` ở A-01).
>
> **Lưu ý về `map-surroundings-preview-5-arrival-demo.html`**: trang demo riêng cũng nạp các tệp `-5.js` (`preview-5.js`, `polish-arrival-5.js`, `arrival-demo-5.js`, `journey-arrival-5.js`, `label-performance-arrival-5.js`, `province-legibility-5.js`, `map-controls-island-reference-5.js`). Mọi tham số mới truyền vào các hàm (`sync(canvasRect, dockRect, headerRect)`, `adjustControlLayout(bounds)`, v.v.) đều sẽ để **tùy chọn có fallback** để không phá vỡ trang `arrival-demo`!

### Phương án 1 — Tối thiểu (không tách `heritage-frame-5.js`, chỉ sửa HTML preview-5 và tệp `-5.js`)

- **Phạm vi tệp:dòng dự kiến sửa**:
  1. [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L8661-L8721):
     - Gộp `syncHeaderOffset()` và `syncMapControlLayout()` theo mô hình **đọc một lần → ghi một lần (read-then-write)**; bỏ đọc trùng `dock.getBoundingClientRect()` ở `L8696`; truyền sẵn `headerRect`, `dockRect`, `canvasRect` xuống `GoiVietMapControlPlacement.sync(...)` và `GoiVietJourneyPreview.adjustControlLayout(...)`; chỉ `setProperty` cho `--header-offset`, `--dock-offset`, `--map-center-x`, `--map-space-width` khi chuỗi giá trị thực sự đổi; xóa cặp ghi trùng ở `L8718–8719`.
     - Chuyển lệnh `ctx.font` và `ctx.measureText(label)` tại [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L9091-L9102) vào **bên trong** nhánh fallback `if (!window.GoiVietRegionalPreview?.paintIslandLabel(...))` → loại bỏ 100% các lần `measureText` chết (`172` lần ở `fly`, `88` lần ở `focus_hue`, `64` lần ở `drag`/`rotate`).
  2. [polish-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/polish-arrival-5.js#L37-L39):
     - Trong `setCollapsed(value)`: thoát sớm nếu `collapsed === Boolean(value)` và `panel.hidden === collapsed` (chỉ xử lý `focus` nếu yêu cầu), không gọi lặp `layout()` + `animateLayout()` khi danh sách đã đóng sẵn.
     - Trong `animateLayout()`: bỏ gọi `syncHeaderOffset()` đồng bộ ngay trước `requestAnimationFrame`; gom đồng bộ bố cục vào 1 `rAF` duy nhất.
  3. [arrival-demo-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L114-L119), [L287-L327](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js#L287-L327):
     - `closeList()`: chỉ gọi `setCollapsed(true)` nếu danh sách đang mở (`!panel.hidden`).
     - `openSheet()` + `focusCurrent()`: không gọi `fitSheet()` hai lần sát nhau (gom vào 1 lượt sau khi `sheet.hidden = false` và bố cục đã đồng bộ trong 1 `rAF`), giảm `syncHeaderOffset()` lặp.
  4. [journey-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/journey-arrival-5.js#L131-L207):
     - `adjustControlLayout(bounds)`: nhận `dockRect` tùy chọn (fallback tự đọc nếu không truyền), **không** đặt `barLayoutDirty = true` khi vị trí thanh không đổi.
     - `syncControls()`: không gọi `positionBar()` đồng bộ ngay sau khi vừa sửa một loạt `.hidden`; gom `positionBar()` + `syncMapControlLayout()` vào cùng 1 `rAF` (nhưng vẫn cập nhật trước lần vẽ kế tiếp để không có khung lệch vị trí).
  5. [map-controls-island-reference-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-controls-island-reference-5.js#L46-L55):
     - `sync(canvasRect, dockRect, headerRect)`: tái dùng `headerRect` nếu đã truyền; chỉ `dock.style.setProperty('--gv-camera-menu-height', ...)` khi giá trị đổi.
  6. [preview-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L124-L130), [L257-L272](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L257-L272), [L336-L364](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L336-L364), [L452-L454](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L452-L454):
     - `panBy`: chỉ gọi `mainCanvas.getBoundingClientRect()` khi `x == null || y == null`.
     - Đổi cách ẩn/hiện `overviewCanvas`, `coverageCanvas`, `background` từ thuộc tính `.hidden` sang `style.display` (cùng kỹ thuật đã kiểm chứng tại `webgl-coverage-3.js:58`) để diệt cú `UpdateLayoutTree` 30–50 ms do `:has(...[hidden])` trong lúc bay/xoay.
  7. [label-performance-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/label-performance-arrival-5.js#L64-L70):
     - Thay `JSON.stringify([...])` trong `measure(context, text)` bằng khóa chuỗi nhẹ nối trực tiếp (`context.font + '\0' + context.letterSpacing + '\0' + context.direction + '\0' + text` — giữ đủ các thuộc tính thực sự khác mặc định).
- **Ước lượng cải thiện (`suy luận từ mã` dựa trên trace)**:
  - `fly (a)`: cắt `getBoundingClientRect` từ `309` xuống còn ~`100–130` lần (vẫn còn `52 + 24 = 76` lần từ `heritage-frame.js` + một phần `label-performance`), `UpdateLayoutTree` giảm mạnh; dự kiến **~35–42 FPS**, `maxGap` giảm từ ~358 ms xuống ~120–170 ms.
  - `focus_hue (b)`: diệt cú `UpdateLayoutTree 50 ms` + `88` `measureText` chết + `JSON.stringify`; dự kiến **~43–48 FPS**.
  - `rotate (d)`: diệt cú `UpdateLayoutTree 48 ms` + `64` `measureText` chết + `JSON.stringify`; dự kiến **~42–47 FPS**.
- **Nhược điểm**: `heritage-frame.js:22` vẫn ghi `--hf-scale` vô điều kiện và `heritage-frame.js:28,35` vẫn gọi `getBoundingClientRect()` trên 8 phần tử khung ở mỗi `syncSafeArea`/`constrainMapArea` (trong trace VI `fly`, riêng `heritage-frame.js:49` chiếm `127,2 ms` và `211` mẫu `gBCR`!).

---

### Phương án 2 (Khuyến nghị) — A-04 triệt để (tách mới `heritage-frame-5.js`) + A-03 chọn lọc, rủi ro thấp

Bao gồm **toàn bộ Phương án 1**, cộng thêm 2 nhóm cải tiến trực tiếp vào phần chi phí còn lại trong trace:

1. **Tách mới [heritage-frame-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/heritage-frame-5.js) (sao từ `heritage-frame.js`), chỉ trỏ [map-surroundings-preview-5.html](file:///d:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-5.html#L4189) sang bản `-5.js`, giữ nguyên `heritage-frame.js` cho các trang khác**:
   - `fitArtwork()` (tương ứng `heritage-frame.js:20–23`): lưu `lastScale`, **chỉ ghi `--hf-scale`** khi giá trị đổi (khi mở phiếu ga ở cùng kích thước cửa sổ, `scene.clientWidth/Height` không đổi → `0` style invalidation).
   - Cache kết quả `insets()` và `obstacleBounds` theo khóa `(scene.clientWidth, scene.clientHeight, active())`, chỉ đọc lại DOM khi `resize`, `fonts.ready`, hoặc chuyển trạng thái `active()` (không đo lại 12 `getBoundingClientRect` chỉ vì mở/đóng phiếu ga hay thanh hành trình!).
   - Gộp hàng đợi `rAF` của `syncSafeArea()` với `syncHeaderOffset()`/`syncMapControlLayout()` (cung cấp 1 điểm điều phối `scheduleMapLayoutSync()` trong `map-surroundings-preview-5.html`) để trong cùng 1 khung hình chuyển cảnh chỉ chạy **đúng 1 pha đọc hình học → 1 pha ghi CSS** dù cả `heritage-frame-5`, `polish-arrival-5`, `arrival-demo-5` và `journey-arrival-5` cùng yêu cầu đồng bộ!
   - Bổ sung tệp `heritage-frame-5.js` vào gói ngoại tuyến qua `python tools/build-preview-5-offline.py` + `--check`.

2. **Tối ưu A-03 rủi ro thấp (cùng nâng FPS cho `rotate`, `focus_hue` và `fly`)**:
   - **Cache bitmap cho 4 biểu tượng SVG trong [preview-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L470-L529)**: khi `image.onload`, vẽ sẵn SVG 1 lần ra offscreen canvas 2× (có cả bản sáng và bản tối đã lọc sẵn thay vì bật `context.filter = 'brightness(.78) saturate(.8)'` trên luồng nóng mỗi khung); đưa `if (mapCompass) blocked.push(...)` ở `L510` ra ngoài vòng lặp 4 landmark.
   - **Giảm `measureText` miss & ép `UpdateLayoutTree` trong `animateLoop` ở [preview-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L174-L225), [L544](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/preview-5.js#L544)**:
     - Khi đang chuyển động (`moving || journey.isMoving()`), làm tròn cỡ chữ nhãn nước/quần đảo theo bậc `1 px` (thay vì `0,25 px`), trở về `0,25 px` khi dừng hẳn → tăng tỷ lệ trúng cache `measureText` khi zoom/bay.
     - Trì hoãn ghi `background.style.transform` / `waveCanvas.style.transform` / `overviewCanvas.style.transform` và `GoiVietArchipelagoArt.positionButton` (hoặc đặt `placeCountryLabels` trước khi chạm style DOM trong cùng khung) để tránh ép `UpdateLayoutTree` mỗi khung khi `context.font` chạy ngay sau `style.transform`!
   - **Giảm relayout nhãn tỉnh lặp giữa thao tác xoay ở [province-legibility-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/province-legibility-5.js#L98-L100)**:
     - Chỉ khi **đang chuyển động (`!quiet`)**, nới ngưỡng `Math.abs(cam.yaw - layoutCamera.yaw)` từ `0,16` lên `0,32` (còn khi dừng `quiet === true` sau 180 ms vẫn chạy đầy đủ thuật toán đặt nhãn như cũ, giữ nguyên mọi quy tắc tránh chồng/che đường ray/che ghim). Dự kiến giảm `layouts` giữa cú xoay 14 bước từ `4` xuống `1–2`, giảm mạnh GC (`134` mẫu trong trace VI `rotate`).
   - **Lọc sớm mutation không liên quan trong [label-performance-arrival-5.js](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/label-performance-arrival-5.js#L12-L25)**:
     - Bỏ qua nhanh `style` mutation trên các canvas nền (`#regionalLandSeaCanvas`, `#regionalWavesCanvas`, `#regionalOverviewCanvas`, `#regionalCoverageCanvas`, `#regionalCoverageGPU3`) và `.archipelago-detail-button` trước khi gọi `target.closest(selector)`.
     - Tái dùng kết quả `ui` bounds từ `scheduleMapLayoutSync` khi có sẵn để không gọi `getBoundingClientRect()` trùng thêm lượt ngay trong cùng khung.

- **Ước lượng cải thiện (`suy luận từ mã` dựa trên trace)**:
  - **`fly (a)`**: giảm `getBoundingClientRect` từ `309` xuống khoảng **`~15–30` lần (-90%)**, cắt phần lớn Forced `UpdateLayoutTree` (`458 ms → < 60 ms`), rút `maxGap` từ ~358 ms xuống ~70–110 ms; dự kiến đẩy FPS từ `24,62 (VI) / 26,80 (EN)` lên **`~44–52 FPS`** và tổng thời gian từ `~1800 ms` xuống **`~1150–1350 ms`**.
  - **`focus_hue (b)`**: loại bỏ cú `UpdateLayoutTree 50 ms`, `88` `measureText` chết, `JSON.stringify`, SVG `drawImage` mỗi khung và `UpdateLayoutTree` 30 lần nhỏ từ `style.transform → ctx.font`; dự kiến đẩy FPS từ `34,45` lên **`~48–55 FPS`**.
  - **`rotate (d)`**: loại bỏ cú `UpdateLayoutTree 48 ms`, giảm `paintLabels` relayout từ `4 → 1–2` + giảm GC, bitmap landmark, `measure` nhanh; dự kiến đẩy FPS từ `35,34 (VI) / 37,29 (EN)` lên **`~47–54 FPS`** (`maxGap` giảm từ ~150 ms xuống ~45–65 ms).
- **Lý do khuyến nghị**: đánh trúng toàn bộ gốc rễ đo được trong cả 3 trace mà không phải viết lại bộ chọn CSS toàn trang.

---

### Phương án 3 — Mở rộng (Phương án 2 + thay bộ chọn `:has(...)` trong CSS `-5`)

- Bao gồm **toàn bộ Phương án 2**, cộng thêm:
  - Thay ~25 bộ chọn `body[data-arrival-demo][data-regional-preview]:has(#introScreen.intro-hidden)` và `:has(#stationPanel:not([hidden]))` / `:has(> button:not([hidden]))` trong [arrival-demo-5.css](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.css) và [legibility-5.css](file:///d:/HCMUS/vietnam-heritage-map-2/assets/goi-viet/map-surroundings-preview/legibility-5.css) bằng các lớp trạng thái tường minh trên `body` / `#mapScene` đồng bộ qua JS (`arrival-demo-5.js`, `journey-arrival-5.js`).
- **Ước lượng cải thiện (`suy luận từ mã`)**: cắt sâu thêm phần Normal `UpdateLayoutTree` còn lại khi mở phiếu (`293 ms` VI / `181 ms` EN trong trace `fly`), có thể đẩy `fly` lên **`~50–56 FPS`**.
- **Nhược điểm / rủi ro cao hơn**: động chạm ~25 quy tắc CSS trong `arrival-demo-5.css` (tệp này cũng được nạp bởi `map-surroundings-preview-5-arrival-demo.html`) và `legibility-5.css`; rủi ro lệch ưu tiên CSS (`specificity`) hoặc ảnh hưởng giao diện mobile/tablet/dark-theme cao hơn rõ rệt so với Phương án 2. Nên để làm bước dự phòng nếu kết quả đo Pha 2 của Phương án 2 vẫn còn dưới mục tiêu.

---

## 5. Phân tích rủi ro và biện pháp phòng ngừa

| Nhóm rủi ro | Tình huống cụ thể cần tránh | Cách phòng ngừa trong thiết kế |
|---|---|---|
| **Vị trí phiếu ga & thanh hành trình** | Gom `rAF` làm phiếu ga (`#arrivalSheet`) hoặc thanh hành trình (`.journey-route-bar`) nhảy vị trí 1 khung hoặc không kịp `fitSheet()` trên màn nhỏ (`1024×768`) | Vẫn chạy `fitSheet()` và `positionBar()` ngay trong khung mở phiếu (gộp read-then-write 1 lượt, không tách sang khung thứ 3); khi resize cửa sổ lúc phiếu đang mở, vô hiệu hóa cache `heritage-frame-5` và gọi lại `fitSheet()` + `scheduleMapLayoutSync()`. |
| **Điều khiển bị che khi resize** | Cache `insets()` / `obstacleBounds` trong `heritage-frame-5.js` bị cũ khi đổi kích thước cửa sổ hoặc đổi độ cao `.top-header` / `.bottom-dock` (ví dụ đổi ngôn ngữ VI↔EN) | Khóa cache phụ thuộc `(scene.clientWidth, scene.clientHeight, active())` **và** bắt `ResizeObserver` trên `scene`, `.top-header`, `.bottom-dock` + lắng nghe `goiviet:langchange` & `fonts.ready`. |
| **Nhãn tỉnh / đảo / nước chồng, nhấp nháy, che ga (VI & EN)** | Nới ngưỡng `yaw` trong `province-legibility-5.js` làm nhãn tỉnh tràn khỏi ranh giới, đè lên đường ray/ghim ga trong lúc xoay; hoặc làm tròn cỡ chữ 1 px gây giật chữ khi dừng | Trong nhánh `reuse` (`L109–121`), mã gốc **vẫn kiểm tra `inside(x,y)`, `blocked`, `placed`, `coversTrack` ở mọi khung** nên nhãn không thể đè lên ghim hay tràn biên; sau khi dừng `180 ms`, `refineAfterRest` luôn tính lại đầy đủ ở độ chính xác gốc (`0,25 px` + đầy đủ ứng viên nhãn). |
| **Biểu tượng landmark mờ hoặc sai màu theme tối** | Offscreen bitmap của SVG bị mờ ở màn hình zoom lớn hoặc không đổi khi chuyển Sáng↔Tối | Rasterize sẵn bitmap ở hệ số `2×` kích thước lớn nhất (`scale ≤ 1,45`) cho cả 2 biến thể `light` và `dark` (không giữ `context.filter` trên luồng vẽ nóng), kiểm tra lại cả 2 theme. |
| **Đường Canvas 2D fallback (không WebGL)** | Đổi `.hidden` sang `style.display` trên `coverageCanvas`/`overviewCanvas` hoặc trì hoãn `style.transform` gây lộ viền/sai thứ tự lớp trên chế độ không WebGL | Giữ nguyên z-order DOM, luôn bật `style.display = ''` khi hiện và `'none'` khi ẩn (đúng hành vi `hidden`), kiểm riêng chế độ tắt WebGL ở Pha 2. |
| **Trang `map-surroundings-preview-5-arrival-demo.html`** | Sửa chữ ký hàm trong tệp `-5.js` dùng chung với trang demo riêng | Mọi tham số truyền sẵn (`headerRect`, `dockRect`, `bounds`) đều tùy chọn và có fallback đọc DOM nếu không được truyền. |

---

## 6. Kế hoạch kiểm tra cho Pha 2 (sau khi được duyệt phương án)

1. **Đo hiệu năng so sánh `trước/sau` (`n ≥ 10` xen kẽ)**:
   - Chạy xen kẽ bản nền (`HEAD = f85e7d1`, từ git worktree/bản đối chiếu sạch hoặc đối chứng A/B cùng phiên máy) và bản sau sửa trên đủ 7 phép đo `(a)–(e)` tại `1920×1080`, `DPR 1`, GPU Intel Arc, CPU `×4`, bản đồ ổn định (`pad = 260`).
   - Báo cáo trung vị, Q1–Q3, IQR, `maxGap` và kiểm định Mann–Whitney U (hai phía, báo `p-value`) cho từng chỉ số; kèm 1 lượt trace + đếm API tách biệt để xác nhận mức giảm `getBoundingClientRect`, Forced `UpdateLayoutTree`/`Layout`, `measureText`, `drawImage`.
2. **Kiểm sai lệch hình học bố cục (`≤ 1 px`) trên 3 kích thước viewport**:
   - Chụp và so sánh tọa độ (`left, top, width, height`) của `#arrivalSheet`, `.journey-route-bar`, `.top-header`, `.bottom-dock`, `.left-helper`, `#stationPanel`, và `mapCompass` trên `1920×1080`, `1366×768`, `1024×768` — bao gồm cả kịch bản **đổi kích thước cửa sổ trong khi phiếu ga đang mở** và **chuyển VI ↔ EN**.
3. **Kiểm tra thị giác (ảnh chụp + mắt kiểm)**:
   - Chụp màn hình vùng biên khung di sản, 3 ga mẫu (Hà Nội, Huế, TP.HCM), cụm đảo Hoàng Sa / Trường Sa / Côn Đảo / Phú Quốc, ở cả **VI và EN**, cả **theme Sáng và Tối**, trước và sau khi xoay/bay. Xác nhận không chồng nhãn, không che ghim/đường ray, không lộ kẽ hở nền biển.
4. **Kiểm đường không WebGL (Canvas 2D fallback)**:
   - Khởi chạy Chrome với `--disable-webgl` (hoặc chặn context WebGL), xác nhận đủ 34 tỉnh + 4 cụm đảo + mở phiếu ga + xoay/kéo hoạt động bình thường, `0` lỗi console.
5. **Tài nguyên ngoại tuyến & 8 bộ kiểm tự động**:
   - Tăng `?v=` cho mọi tệp đã sửa/thêm trong `map-surroundings-preview-5.html`, chạy `python tools/build-preview-5-offline.py` và `python tools/build-preview-5-offline.py --check` (`PASS`).
   - Chạy đủ 8 suite kiểm (`check-books-5`, `check-i18n-5`, `check-memory-v5`, `verify-preview5-conversation-cards`, `check-station-panel-5`, `check-family-voyage-5`, `check-station-photos-5`, `check-arrival-demo-5 --preview-5`) — tất cả phải `PASS`.
   - Kiểm tra `git diff --stat` xác nhận không sửa `index.html`, `preview-2/3/4`, `card-testing.html` hay bất kỳ tệp dùng chung không có hậu tố `-5`.

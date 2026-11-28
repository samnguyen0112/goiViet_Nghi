# Báo cáo P5-09 — Khắc phục nhãn và nút quần đảo Hoàng Sa, Trường Sa trên preview-5

Ngày: 28/11/2026. Nhánh `p5-09-nhan-hoang-sa`, tách từ `main` tại `309d8e1`. Chỉ thay đổi bản preview-5 (`map-surroundings-preview-5.html`, `map-surroundings-preview-5-arrival-demo.html` và các tệp hậu tố `-5`). Không sửa `index.html`, các preview trước, `card-testing.html` hay tệp dùng chung của các bản khác.

## Tóm tắt vấn đề

1. **Đợt 1 — Mất nhãn và nút "Nhà mình có thư" của Quần đảo Hoàng Sa ở `1280×720`** *(đã đo, đã tái hiện)*:
   - Trong [preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js), `paintIslandLabel()` chỉ thử 6 ứng viên dọc theo cùng kinh tuyến `x = p[0]` (`0:below`, `1:p1+18`, `2:above`, `3:p1-18`, `4:p1-radius-5`, `5:below+18`).
   - Ở `1280×720` (`zoom = 0.455`, cả VI/EN × sáng/tối, cả khi đóng lẫn mở `#arrivalSheet`), Hoàng Sa bị kẹp dọc giữa nhãn `BIỂN ĐÔNG` phía dưới (`0, 1, 5`) và hình thuyền buồm `sailboat` phía trên (`2, 3, 4`). Nguyên nhân trực tiếp là `sailboat` ở `[700, 250]` bị kẹp sàn tỉ lệ tối thiểu `0.7` (cao hơn `p[3] = 0.455`), khiến đáy hộp thuyền chạm sát ứng viên `3:p1-18` đúng `1 px` (`273 < 274`) *(đã đo)*.
   - Khi cả 6 ứng viên đều trượt, `positionButton('hoang-sa', null)` ẩn luôn nút `#detailButton-hoang-sa` (`display: none`) *(suy luận từ mã, đã đo)*.

2. **Đợt 2 — Nút và nhãn Quần đảo Trường Sa va chạm `#arrivalSheet` / `#stationPanel` ở `1280×800`** *(đã đo, đã tái hiện)*:
   - Khi mở `#arrivalSheet` (hoặc `#stationPanel`) và bấm "Về giữa" trên `1280×800`:
     - **VI (sáng/tối)**: hộp nhãn Trường Sa `729..823` vừa lọt bên trái `#arrivalSheet` (`sheetL = 833`), nhưng nút `#detailButton-truong-sa` thực tế rộng `120 px` (theo [family-voyage-5.css](../../assets/goi-viet/map-surroundings-preview/family-voyage-5.css)) trong khi `paintIslandLabel()` vẫn giả định `94 px` và đặt lệch trái tại `placement.x - 47` (`729..849`), khiến mép phải nút bị `#arrivalSheet` che mất `16 px` *(đã đo)*.
     - **EN (sáng/tối)**: nhãn `TRƯỜNG SA (SPRATLY) ISLANDS` rộng `131 px` (`tsP.x = 776`, nửa rộng `65.5 px` + đệm UI `7 px` → cần tới `848.5 px > 833`), khiến cả 6 ứng viên dọc đều chạm `#arrivalSheet` nên nhãn và nút Trường Sa bị ẩn *(đã đo)*.
   - Nguyên nhân gốc thứ hai nằm ở `mapScreenArea` trong [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html): khi `cw > 1080` và mở bảng phải, `left = helperRect.right + 16` (`351 px`) đẩy tâm bản đồ sang phải (chừa tới `73–82 px` khoảng trống giữa `.left-helper` và đất liền Việt Nam) trong khi `getBestOverviewZoom()` dùng `availW / 860` chưa tính phần nửa bề rộng nhãn/nút Trường Sa sát mép bảng phải *(suy luận từ mã, đã đo)*.

## Thay đổi đã thực hiện

### Đợt 1 — Hoàng Sa và thuyền buồm

- [preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js):
  - Hạ mức tỉ lệ tối thiểu của `sailboat` từ `0.7` → `0.52` và dịch điểm neo ra khơi phía đông bắc từ `[700, 250]` → `[860, 244]`. Thuyền nằm trọn trên biển thoáng, không chạm `.top-header`, đảo Hải Nam, `#arrivalStartHint` (VI/EN) hay nhãn Hoàng Sa/Trường Sa trên cả 7 khổ desktop *(đã đo)*.
  - Trong `paintIslandLabel()`: chỉ với `hoang-sa` và `truong-sa`, nếu cả 6 vị trí đều vướng thì chạy thêm một lượt dự phòng **chỉ bỏ qua va chạm với `sailboat`**, vẫn giữ nguyên các ràng buộc `insideScreen`, `blocked` (giao diện, khung viền, la bàn, `"Biển Đông"`), `objectBoxes` đất liền và `islandLabels`. Không dịch ngang nhãn sang đông, không đổi vị trí `"Biển Đông"`.

### Đợt 2 — Trường Sa, bề rộng nút thật và khung toàn cảnh khi mở bảng

- [preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js):
  - Trong `paintIslandLabel()`: đo bề rộng thật của `#detailButton-<id>` bằng `offsetWidth` (dự phòng theo `getComputedStyle(buttonEl).width` rồi `120 px` trên `> 960 px` / `94 px` trên `≤ 960 px`). Hộp va chạm `textWidth` bao trọn cả nhãn lẫn nút, và nút được căn giữa đúng tâm nhãn bằng `placement.x - buttonWidth / 2`.
- [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html):
  - Trong `syncMapControlLayout()` (`mapScreenArea`): khi mở `#arrivalSheet` hoặc `#stationPanel` trên desktop (`cw > 768`), đặt `panelOpen = true`, trừ phần bảng phải (`panelRect.left - 16`) và cân lại biên trái khi `cw > 1080` (`Math.max(14, helperRect.right - 56)`) để phần đất liền vẫn cách thoáng `.left-helper` (`≥ 35 px`) mà không ép Trường Sa sát bảng phải. Khi không có bảng nào mở hoặc trên `≤ 768 px`, `mapScreenArea` giữ nguyên như trước.
  - Trong `getBestOverviewZoom()`: chỉ khi `area?.panelOpen`, giới hạn `zoomX = Math.min(availW / 860, Math.max(0, availW / 2 - 64) / 373)` để khung "Về giữa" luôn chứa trọn cả nhãn lẫn nút Trường Sa bên trái bảng đang mở.
- Cập nhật `?v=20261128-ts-label-1` cho `preview-5.js` trong cả [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html) và [map-surroundings-preview-5-arrival-demo.html](../../map-surroundings-preview-5-arrival-demo.html).
- Dựng lại [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) (chuẩn hóa LF) và bổ sung bộ kiểm mới [check-archipelago-labels-5.cjs](../../tools/check-archipelago-labels-5.cjs).

## Bảng đối chiếu 7 khổ × đóng/mở bảng ga (trước / sau) *(đã đo)*

Mỗi ô kiểm đủ 4 biến thể `VI/EN × sáng/tối` (tổng `56` tổ hợp). Ảnh nghiệm thu lưu tại `verification/ts-label-fix/` (`results.json` và 20 ảnh).

| Khổ màn | Đóng `#arrivalSheet` — Trước | Đóng `#arrivalSheet` — Sau | Mở `#arrivalSheet` (toàn cảnh) — Trước | Mở `#arrivalSheet` (toàn cảnh) — Sau |
| --- | --- | --- | --- | --- |
| `1024×768` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.513`, nút căn giữa `120 px`, thuyền `0.52`) | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.504`, `sheetL=586`, Trường Sa `431..561`) |
| `1280×720` | **FAIL 4/4** — Mất Hoàng Sa + mất `#detailButton-hoang-sa` | **PASS 4/4** (`z=0.455`, Hoàng Sa `692..812`, thuyền `0.52`) | **FAIL 4/4** — Mất Hoàng Sa + mất `#detailButton-hoang-sa` | **PASS 4/4** (`z=0.455`, `sheetL=837`, Trường Sa `652..783`) |
| `1280×800` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.528`, Hoàng Sa `709..829`, thuyền `0.524`) | **FAIL 4/4** — VI: nút Trường Sa bị che (`849 > 833`); EN: mất nhãn & nút Trường Sa | **PASS 4/4** (`z=0.522`, `sheetL=833`, Trường Sa `677..808`, nút `683..803`) |
| `1366×768` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.499`, Hoàng Sa `745..865`, thuyền `0.52`) | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.499`, `sheetL=921`, Trường Sa `712..842`) |
| `1440×900` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.619`, Hoàng Sa `812..932`, thuyền `0.614`) | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.619`, `sheetL=987`, Trường Sa `793..924`) |
| `1536×864` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.586`, Hoàng Sa `852..972`, thuyền `0.581`) | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.586`, `sheetL=1057`, Trường Sa `815..946`) |
| `1920×1080` | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.782`, Hoàng Sa `1092..1212`, thuyền `0.776`) | Đủ Hoàng Sa, Trường Sa; nút lệch phải 13 px | **PASS 4/4** (`z=0.782`, `sheetL=1349`, Trường Sa `1034..1177`) |

Ngoài 56 ca trên, đã đo bổ sung trạng thái mở `#stationPanel` + "Về giữa" ở `1280×800` (VI/EN): `panelL = 860`, `z = 0.528`, Hoàng Sa `624..758`, Trường Sa `693..824`, cả hai nút `120 px` (`631..751` và `698..818`) đều nằm trọn bên trái `#stationPanel` *(đã đo)*.

## Tệp đã thay đổi / thêm mới

| Tệp | Thay đổi |
| --- | --- |
| [preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js) | Sàn tỉ lệ thuyền `0.52` và tọa độ `[860, 244]`; lượt dự phòng bỏ qua thuyền cho Hoàng Sa/Trường Sa; đo `offsetWidth` nút `#detailButton-<id>` (dự phòng `120`/`94 px`) để bao va chạm và căn giữa nút |
| [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html) | Cập nhật `mapScreenArea` & `getBestOverviewZoom` khi mở `#arrivalSheet`/`#stationPanel` trên desktop; đổi `?v=20261128-ts-label-1` cho `preview-5.js` |
| [map-surroundings-preview-5-arrival-demo.html](../../map-surroundings-preview-5-arrival-demo.html) | Đổi `?v=20261128-ts-label-1` cho `preview-5.js` |
| [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | Dựng lại gói ngoại tuyến (645 tài nguyên, `86b15f64599e7372`), chuẩn hóa LF |
| [check-archipelago-labels-5.cjs](../../tools/check-archipelago-labels-5.cjs) | Mới: bộ kiểm 56 ca cho 7 khổ desktop × VI/EN × sáng/tối × đóng/mở `#arrivalSheet` |
| [BAO-CAO-NHAN-QUAN-DAO-5.md](BAO-CAO-NHAN-QUAN-DAO-5.md) | Mới: báo cáo đợt P5-09 |
| [docs/README.md](../README.md) | Thêm mục cho thư mục `08-nhan-quan-dao/` |

## Kết quả các bộ kiểm *(đã đo)*

Chạy trên Windows 11, Chrome thật (headless, ANGLE D3D11), ngày 28/11/2026, máy chủ `node tools/perf/server.cjs` (cổng 8770, đã dừng sau khi kiểm xong):

| Lệnh | Kết quả |
| --- | --- |
| `node tools/check-archipelago-labels-5.cjs` | `SUMMARY: 56/56 checks passed; 0 failed; 0 console/page errors.` |
| `node tools/check-arrival-demo-5.cjs --preview-5` | `61/61 functional cases passed; 0 failures.` *(gồm ca `G. ... boat stays clear`, các ca mở bảng ga/danh sách ga và ca hồi quy `C. Performance` cố định 3 lượt đạt `slowdownPct: 0` — chỉ dùng làm hồi quy, không dùng kết luận hiệu năng)* |
| `node tools/check-station-panel-5.cjs` | `PASS: preview-5 station panel, 6 sizes, journey, cards, memory, postcard, draft books, 32 community invitations and dark mode.` |
| `node tools/check-family-voyage-5.cjs` | `PASS: 11 groups. Evidence: D:\HCMUS\vietnam-heritage-map-2\verification\sea-postoffice-5` |
| `node tools/check-so-tay-5.cjs` | `29/29 checks passed` |
| `node tools/check-i18n-5.cjs --walk` | `PASS` |
| `python tools/build-preview-5-offline.py --check` | `PASS: offline manifest is up to date; no files written.` |
| `git diff --check` & `git ls-files --eol` | Đạt (exit 0); mọi tệp đã sửa đều `i/lf w/lf`, tệp mới có `0` CRLF |

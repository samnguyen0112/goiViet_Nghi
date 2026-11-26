# Báo cáo đợt sửa 3 trên preview-5

- **Ngày thực hiện:** 2026-11-25
- **Nhánh git:** `p5-05` (mốc nền `3106838`, giữ nguyên trạng thái chưa commit theo quy tắc)
- **Phạm vi sửa đổi:** chỉ `map-surroundings-preview-5.html` và tài nguyên riêng của `preview-5`; không chạm `index.html`, `map-surroundings-preview-2/3/4.html`, `card-testing.html` hay bất kỳ tệp đuôi `-3` dùng chung nào.
- **Trạng thái gói ngoại tuyến sau sửa:** `python tools/build-preview-5-offline.py` và `python tools/build-preview-5-offline.py --check` đều **PASS** (`641` tài nguyên, `179,98 MB`, bản dựng `86f21471dc6a9991`).
- **Báo cáo rà soát theme tối đi kèm:** [BAO-CAO-THEME-TOI.md](BAO-CAO-THEME-TOI.md) (chỉ rà soát và đề xuất, không sửa mã).

---

## 0. Đối chiếu `git status`

- **Trước khi bắt đầu đợt sửa 3:** nhánh `p5-05` ở commit `3106838`, cây làm việc hoàn toàn sạch (`git status -s` rỗng).
- **Sau khi hoàn tất đợt sửa 3:** chỉ có 4 tệp bị thay đổi thuộc đúng 3 mục sửa phần 1 (và 2 báo cáo mới trong `docs/06-ra-soat-chuyen-sau/`), không phát hiện tệp nào bị sửa ngoài phạm vi:
  - `assets/goi-viet/map-surroundings-preview/card-table-5.js`
  - `assets/goi-viet/map-surroundings-preview/offline-manifest-5.js`
  - `map-surroundings-preview-5.html`
  - `tools/build-preview-5-offline.py`

---

## 1. Mục A-05 (phần còn lại) · Tối ưu `fitTable()` trong `card-table-5.js`

### 1.1. Tệp và vị trí đã sửa

- `assets/goi-viet/map-surroundings-preview/card-table-5.js`:
  - Dòng `12`: lưu sẵn tham chiếu `const flipper = byId('card3DFlipper');`.
  - Dòng `127–197`: thay vòng tìm kiếm nhị phân 5 bước (`setProperty('--card-table-scale')` + đọc `scrollHeight`/`clientHeight` lặp lại 6–7 lần gây layout đồng bộ) bằng hàm `setTableScale(value)` có bộ nhớ đệm `appliedScale` và công thức tính tỉ lệ 1 nhịp dựa trên chiều cao trống của `.modal-sheet`, phần khung trên/dưới (`.deck-stage` trừ `flipper`, cộng đệm dọc của `.modal-body`) và chiều cao hiện tại của `flipper` ở tỉ lệ `1`. Giữ nguyên nhánh nén `data-reading-explanation` trên màn hình hẹp và bổ sung kiểm tra chống tràn 1 bước khi co hẹp gây ngắt dòng lại (kẹp trần `0,995` tương ứng bước nhị phân cũ, áp lại tỉ lệ nếu `!fits()`, tức `scrollBody.scrollHeight > scrollBody.clientHeight`, không có ngưỡng `+2`).
  - Dòng `295`: trong `render()`, khi chuyển sang lá bài mới (`peek.dataset.cardId !== card.id`) gọi `setTableScale(1)` trước để bố cục ban đầu ở đúng tỉ lệ `1`.
- `map-surroundings-preview-5.html`:
  - Dòng `4239`: nâng tham số phiên bản nạp lên `card-table-5.js?v=20261125-audit-3`.

### 1.2. Đối chiếu độ lệch `--card-table-scale` và chống tràn ở 7 kích thước màn hình (`đã đo`)

Kiểm bằng script đo tự động trên cùng 6 viewport của `verify-preview5-conversation-cards.cjs` (`1440×900`, `1366×768`, `1024×768`, `820×1180`, `390×844`, `320×568`) cộng thêm `1920×1080`, đi qua tổng cộng **31 trạng thái** (lá bài trắc nghiệm còn dấu sen, đã mở giải thích + mặt gắn kết, lá bài Canva, chuyển mặt trên màn hẹp):

| Viewport | Số trạng thái | `|Δ scale|` lớn nhất | Ngưỡng yêu cầu | Tràn dọc sau sửa |
| --- | ---: | ---: | ---: | ---: |
| `1920×1080` | 5 | `0,0069` (`1,213125 → 1,2200`) | `≤ 0,01` | `0 / 5` |
| `1440×900` | 5 | `0,0000` | `≤ 0,01` | `0 / 5` |
| `1366×768` | 5 | `0,0000` | `≤ 0,01` | `0 / 5` |
| `1024×768` | 5 | `0,0000` | `≤ 0,01` | `0 / 5` |
| `820×1180` | 3 | `0,0000` | `≤ 0,01` | `0 / 3` |
| `390×844` | 4 | `0,0000` | `≤ 0,01` | `0 / 4` |
| `320×568` | 4 | `0,0000` (giữ khớp `0,995` ở `hn-quiz:sealed`) | `≤ 0,01` | `0 / 4` |
| **Tổng cộng** | **31** | **`0,0069`** | **`≤ 0,01` (ĐẠT)** | **`0 / 31` (ĐẠT)** |

### 1.3. Đo hiệu năng trước và sau (`đã đo`, Chrome GPU thật, `n ≥ 10`)

- **Môi trường đo:** Google Chrome dùng GPU thật (Intel Arc D3D11), viewport `1920×1080`, ga **TP. Hà Nội**, rút bài với **chuyển động bình thường** (không bật reduced-motion).
- **Cỡ mẫu:** `n = 12` lượt mỗi bên ở chế độ không bật CDP trace (đo rAF và `Performance.getMetrics` ít nhiễu nhất) và `n = 10` lượt mỗi bên ở chế độ ghi Chrome trace (bóc tách thời gian hàm `fitTable` và các sự kiện `Layout`).
- **Quy tắc kết luận:** chỉ kết luận **Cải thiện** khi đồng thời thỏa `|Δ trung vị| ≥ IQR nền` **VÀ** kiểm định Mann–Whitney hai phía `p < 0,05`.

| Chỉ số (cỡ mẫu mỗi bên) | Trước sửa: Trung vị (Q1–Q3; IQR) | Sau sửa: Trung vị (Q1–Q3; IQR) | Δ Trung vị | Mann–Whitney `U` | `p`-value | Kết luận |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Số khoảng rAF > 50 ms (`n = 12`) | `2` (`2–2`; IQR `0`) | `1` (`1–1`; IQR `0`) | `−1` | `5,5` | `0,000016` | **Cải thiện** |
| Khoảng rAF dài nhất (`n = 12`) | `166,80 ms` (`166,70–183,30`; IQR `16,60`) | `166,70 ms` (`162,45–183,13`; IQR `20,68`) | `−0,10 ms` | `52,0` | `0,2506` | **Chưa cải thiện** |
| Tổng `LayoutDuration` qua CDP (`n = 12`) | `108,14 ms` (`99,11–112,26`; IQR `13,15`) | `46,22 ms` (`42,24–54,10`; IQR `11,85`) | `−61,92 ms` (`−57,3%`) | `0,0` | `0,000037` | **Cải thiện** |
| Số lần `LayoutCount` qua CDP (`n = 12`) | `11` (`11–11`; IQR `0`) | `7` (`7–7`; IQR `0`) | `−4` | `0,0` | `0,000004` | **Cải thiện** |
| Thời gian `fitTable()` trong trace (`n = 10`) | `84,12 ms` (`73,94–92,47`; IQR `18,53`) | `0,26 ms` (`0,24–0,27`; IQR `0,02`) | `−83,86 ms` (`−99,7%`) | `0,0` | `0,000183` | **Cải thiện** |
| Tổng thời gian `Layout` trong trace (`n = 10`) | `108,05 ms` (`92,89–119,50`; IQR `26,61`) | `52,57 ms` (`47,73–57,21`; IQR `9,48`) | `−55,48 ms` (`−51,3%`) | `0,0` | `0,000183` | **Cải thiện** |
| Số sự kiện `Layout` trong trace (`n = 10`) | `11` (`11–12`; IQR `1`) | `7` (`7–7`; IQR `0`) | `−4` | `0,0` | `0,000046` | **Cải thiện** |
| Sự kiện `Layout` đơn lẻ dài nhất (`n = 10`) | `26,33 ms` (`22,64–29,61`; IQR `6,97`) | `25,26 ms` (`23,23–29,94`; IQR `6,71`) | `−1,07 ms` | `47,0` | `0,8501` | **Chưa cải thiện** |

**Phân tích trung thực (`đã đo` từ trace Chrome):**
- Điểm nghẽn trực tiếp của `fitTable()` đã giảm gần như triệt để (`84,12 ms → 0,26 ms`, loại bỏ hoàn toàn nhịp khựng thứ 2 trên 50 ms sau khi chốt bài, giảm `LayoutCount` từ `11 → 7` và tổng thời gian layout giảm hơn một nửa).
- Tuy nhiên, **khoảng rAF dài nhất (`~166,7 ms`) chưa đổi** vì khung chậm duy nhất còn lại thuộc pha dựng và raster hóa lần đầu của `#drawnCardViewport` khi `commit()` hiện hai mặt bài (`conversation-cards-5.js:20`, gồm layout đầu tiên `~21–25 ms`, sơn/giải mã ảnh nền bìa bài và lớp hiệu ứng bóng/bộ lọc). Phần này nằm ngoài phạm vi `fitTable()`, ghi nhận để xử lý ở đợt sau nếu cần hạ đỉnh đơn khung dưới 50 ms.

---

## 2. Mục D-05 · Nhớ theme tối sau khi tải lại trang

### 2.1. Tệp và vị trí đã sửa

- `map-surroundings-preview-5.html`:
  - Dòng `7–14`: thêm `<script>` đồng bộ ngay trong `<head>` (trước toàn bộ `<style>` và `<link>`), đọc `localStorage.getItem('goiviet-theme')` trong `try/catch`; nếu là `'dark'` hoặc `'light'` thì gán ngay `document.documentElement.setAttribute('data-theme', t)` trước lần vẽ đầu tiên để không bị nháy nền sáng.
  - Dòng `5552`: khởi tạo `state.theme` đồng bộ theo thuộc tính `data-theme` hiện hành của `<html>` (`=== 'dark' ? 'dark' : 'light'`) thay vì cứng `'light'`.
  - Dòng `8628–8634`: trong `toggleMaterialTheme()`, lưu `state.theme` vào `localStorage.setItem('goiviet-theme', state.theme)` trong `try/catch`, đồng thời thêm `requestMapRender()` để bản đồ vẽ lại ngay theo nền mới (hàm không nhận tham số; số `4` truyền vào là thừa, vô hại, ghi nhận để dọn ở đợt sau — đây là thay đổi nhỏ ngoài phạm vi D-05).
  - Dòng `10152`: gọi `syncThemeLabels()` lúc khởi động để nhãn nút đổi nền (bao gồm `#btnIntroTheme`) khớp với theme vừa khôi phục.

### 2.2. Kết quả kiểm tra (`đã tái hiện` & `đã đo`)

Kiểm tự động qua kịch bản riêng trên Chromium (lưu kết quả JSON ở bước kiểm tra):

| Kịch bản kiểm tra | Kết quả thực tế | Trạng thái |
| --- | --- | --- |
| **HTTP mặc định** (`127.0.0.1:8770`) | Vào trang mới → `data-theme="light"`, không lỗi console/pageerror. | **PASS** |
| **HTTP bật tối → tải lại → không nháy sáng** | Mở Cài đặt → bấm `#btnTheme` → `data-theme="dark"`, `localStorage['goiviet-theme'] === 'dark'`. Sau `reload()`: ngay tại khung `first-raf` (`readyState === 'loading'`) và `DOMContentLoaded`, `data-theme` đã là `'dark'` (không nháy sáng); `#btnTheme[aria-pressed="true"]`, `#btnIntroTheme` hiển thị `"Nền sáng"`. | **PASS** |
| **HTTP chuyển lại sáng → tải lại** | Bấm `#btnTheme` về sáng → `localStorage['goiviet-theme'] === 'light'`, sau tải lại giữ `'light'`. | **PASS** |
| **Giá trị hỏng trong `localStorage`** | Ghi `localStorage['goiviet-theme'] = 'corrupt-value'` → tải lại rơi an toàn về `'light'`, 0 lỗi. | **PASS** |
| **Giao thức `file://`** (hồ sơ lưu đĩa `launchPersistentContext`) | Mở `file:///.../map-surroundings-preview-5.html`, bật nền tối → tải lại vẫn giữ `data-theme="dark"`, 0 `pageerror`. | **PASS** |
| **Khi `localStorage` bị chặn** (giả lập ném `SecurityError`) | Tải trang giữ mặc định `'light'`, bấm chuyển sang `'dark'` hoạt động bình thường trong phiên, 0 `pageerror`. | **PASS** |

---

## 3. Mục B-02 · Loại bỏ 3 scheduler đời trước khỏi gói ngoại tuyến

### 3.1. Xác nhận không còn sử dụng (`suy luận từ mã` qua `git grep`)

Đã quét toàn bộ repo bằng `git grep` cho `raster-scheduler.js`, `raster-scheduler-3.js`, `raster-scheduler-4.js` cùng các đường nạp tĩnh (`<script>`) và nạp động (`C.load`, `new URL`, `createElement('script')`):
- `map-surroundings-preview-5.html` và chuỗi script riêng của preview-5 (`landscape-5.js`, `natural/core-5.js`, `preview-5.js`) **chỉ nạp `natural/raster-scheduler-5.js`**.
- Ba tệp cũ `raster-scheduler.js`, `raster-scheduler-3.js`, `raster-scheduler-4.js` chỉ thuộc bản cũ / preview-3/4, **không hề được preview-5 gọi tĩnh hay động**.

### 3.2. Tệp và vị trí đã sửa

- `tools/build-preview-5-offline.py`:
  - Dòng `20–35`: bổ sung tập loại trừ `excluded_natural = {'raster-scheduler.js', 'raster-scheduler-3.js', 'raster-scheduler-4.js'}` khi quét thư mục `assets/goi-viet/map-surroundings-preview/natural`.
- `assets/goi-viet/map-surroundings-preview/offline-manifest-5.js`:
  - Sinh lại bằng `python tools/build-preview-5-offline.py`.

### 3.3. Kết quả đóng gói và kiểm ngoại tuyến thật (`đã đo` & `đã tái hiện`)

| Hạng mục kiểm | Kết quả | Trạng thái |
| --- | --- | --- |
| Số tệp trong manifest | Giảm từ **`644` → `641`** (giảm đúng `3` tệp đã loại; tổng dung lượng `179,98 MB`, bản dựng `86f21471dc6a9991`). | **PASS** |
| `python tools/build-preview-5-offline.py --check` | `PASS` (khớp toàn bộ đường dẫn và mã băm SHA-256). | **PASS** |
| Chạy ngoại tuyến thật trên hồ sơ lưu đĩa (`launchPersistentContext`, `1920×1080`) | Chuẩn bị gói xong trong `3 642 ms` (`ready`), ngắt mạng thật qua CDP (`offline: true`, tắt HTTP cache, `navigator.onLine === false`, xác nhận probe tài nguyên không có trong cache bị từ chối). Tải lại trang khi ngoại tuyến: `GoiVietRasterTasks.managed === true`, vào bản đồ thành công, **kéo bản đồ** (`dragDelta = 196,72 px`), **xoay bản đồ** (`yawDelta = 0,598 rad`), **mở ga TP. Hà Nội** (ảnh địa danh nạp đủ `naturalWidth = 1600 px`), **`0` request lỗi**, **`0` `pageerror`**. | **PASS** |

---

## 4. Kết quả chạy đủ 8 bộ kiểm tra tự động (`đã tái hiện` & `đã đo`)

Tất cả 8 suite được chạy tuần tự với máy chủ tĩnh cục bộ `node tools/perf/server.cjs` (`127.0.0.1:8770`):

| STT | Lệnh kiểm tra | Kết quả | Ghi chú chi tiết |
| ---: | --- | --- | --- |
| 1 | `node tools/check-books-5.cjs` | **PASS** | Hoàn tất trong `0,5 s`, kiểm toàn bộ danh mục sách & trang đọc preview-5. |
| 2 | `node tools/check-i18n-5.cjs` | **PASS** | Hoàn tất trong `0,1 s`, đủ khóa song ngữ VI/EN. |
| 3 | `node tools/check-memory-v5.cjs` | **PASS** | Hoàn tất trong `21,4 s`, không rò bộ nhớ/DOM sau các chu kỳ tương tác. |
| 4 | `node tools/verify-preview5-conversation-cards.cjs` | **PASS** | Hoàn tất trong `33,4 s`, đạt đủ 6 viewport và các kịch bản bộ bài sau sửa `fitTable()`. |
| 5 | `node tools/check-station-panel-5.cjs` | **PASS** | Hoàn tất trong `~66 s`, danh sách ga, tìm kiếm, phiếu ga đạt. |
| 6 | `node tools/check-family-voyage-5.cjs` | **PASS** | Đạt `11/11` nhóm kiểm (Hoàng Sa, Trường Sa, Bưu điện biển đảo, Hải đồ, Sổ thư). Xem ghi chú mục 5 về lỗi race sẵn có ngoài phạm vi. |
| 7 | `node tools/check-station-photos-5.cjs` | **PASS** | Hoàn tất trong `6 phút 13 giây`: 35 ảnh ga + Hoàng Sa + kịch bản tải lạnh ngoại tuyến (`72` khung kiểm) đều PASS. |
| 8 | `node tools/check-arrival-demo-5.cjs --preview-5` | **PASS** | Đạt **`61 / 61`** kiểm tra (`0` fail); mục `C. Performance` ghi nhận `slowdownPct: 0` ở cả `1366×768` và `1920×1080`. |

---

## 5. Vấn đề ngoài phạm vi phát hiện trong quá trình kiểm (không tự sửa theo quy tắc)

1. **Điều kiện tranh chấp 300 ms trong kịch bản `tools/check-family-voyage-5.cjs` (`đã tái hiện`):**
   - Trong hai lần chạy thử tốc độ cao, `tools/check-family-voyage-5.cjs:193–201` thất bại tại `hoang-sa letter 3: postmark place` trước khi chạy đạt `11/11` ở lần chạy tiếp theo.
   - **Nguyên nhân (`suy luận từ mã` & `đã tái hiện`):** `assets/goi-viet/map-surroundings-preview/family-voyage-5.js:732` đặt khóa chống bấm đúp `completingUntil = performance.now() + 300` (300 ms). Vòng lặp ở `tools/check-family-voyage-5.cjs:193–201` gọi `act('skip')` liên tiếp mà không có `waitForTimeout(320)` (trong khi dòng `220` cùng tệp có chờ 320 ms). Khi hai lần bấm xảy ra trong dưới 300 ms, lượt `skip` thứ hai bị bỏ qua.
   - **Ghi nhận:** không tự sửa vì nằm ngoài phạm vi đợt 3; đề xuất bổ sung chờ `320 ms` (hoặc đợi thuộc tính DOM đổi lá thư) ở đợt bảo trì script kiểm.
2. **Hai chi tiết bố cục nhỏ phát hiện khi đối chiếu ảnh chụp phần 2 (`đã tái hiện` trên ảnh `1920×1080`):**
   - Trong ảnh `12-journal-1920x1080-vi-dark.png`, viền focus của chip `Hà Nội` trong mục *"Đã đặt chân 1/36"* hơi chạm nhẹ vào tiêu đề *"Đã đóng ấn 1"* ngay bên dưới.
   - Trong ảnh `14c-island-hoang-sa-atlas-1920x1080-vi-dark.png`, nhãn tọa độ góc dưới phải (`16.413°B · 112.037°Đ`) đè nhẹ lên nhãn kinh độ `113.0°Đ` trên canvas, và mũi tên hướng Bắc `B ↑` đè nhẹ lên `17.0°B`.
   - Cả hai không liên quan đến 3 mục sửa đợt 3 và không thuộc lỗi màu/tương phản theme tối nên chỉ ghi nhận để xử lý riêng.
3. **Lời gọi `syncThemeLabels()` bị lặp lúc khởi động (`suy luận từ mã`):**
   - `syncThemeLabels()` được gọi 2 lần khi khởi động (dòng ~10152 mới thêm và lời gọi sẵn có ở cuối khởi tạo tại dòng 10189) — thừa, vô hại, dọn ở đợt sau.

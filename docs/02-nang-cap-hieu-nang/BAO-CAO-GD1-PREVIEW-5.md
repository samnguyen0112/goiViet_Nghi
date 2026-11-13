# Báo cáo Giai đoạn 1 — Nhóm A, ít rủi ro (preview-5)

> Phạm vi đã duyệt: GĐ1 (mục 1.1–1.5 của kế hoạch), chỉ nhóm A (không đổi hình, không đổi chuyển động), làm trên `map-surroundings-preview-5.html`.
> Trạng thái: **hoàn thành** — 1.1 và 1.5 xong; 1.2, 1.3 và 1.4 đã điều tra bằng số liệu và **không có thay đổi an toàn đáng ship** (mục 6). Đã có số liệu Fast 4G (n=5) và Slow 4G (n=3).
> Đã chỉnh sửa: chỉ `map-surroundings-preview-5.html` (và `tools/perf/`). `index.html`, preview-3, preview-4 và tài nguyên dùng chung **không bị sửa**.

---

## 1. Kết quả tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Dung lượng tải đến cổng (byte truyền) | **13,61 → 9,68 MiB (−3,93 MiB, −29%)** |
| Fast 4G: cổng sẵn sàng (trong trang), n=5 mỗi bên | **5,84 → 3,76 s (−2,1 s, −36%)** |
| Fast 4G: cổng sẵn sàng (tường, sau `load`), n=5 | **13,01 → 9,58 s (−3,4 s, −26%)** |
| Slow 4G (1,6 Mbps, 150 ms): cổng sẵn sàng (trong trang), n=3 mỗi bên | **33,2 → 19,4 s (−41%)** |
| Slow 4G: cổng sẵn sàng (tường, sau `load`) | **68,7 → 49,0 s (−29%)** |
| Cổng hiệu năng (A/B cùng phiên, n=10 mỗi bên, 1× và ×4) | **ĐẠT — không có hồi quy thật nào** ở 18 chỉ số; 0/40 lượt lỗi |
| Mọi chỉ số FPS/CPU/vào bản đồ | **Không đổi trong biên nhiễu** (đúng kỳ vọng: GĐ1 không nhắm vào chúng) |
| Hình ảnh / chuyển động | Không đổi (đã kiểm chứng từng thay đổi, mục 3) |

Lưu ý trung thực: **GĐ1 chỉ cải thiện được tải trang** (byte, thời gian đến cổng trên mạng chậm). Các mục tiêu về "vào bản đồ ×4 ≤ 6 s", LoAF, FPS thao tác **chưa được động tới**; chúng thuộc GĐ2–GĐ4.

## 2. Những gì đã thay đổi trong preview-5

So với preview-4, preview-5 khác ở **đúng 3 chỗ** (đã xác minh bằng cách hoàn tác chính xác các thay đổi này và so sánh byte-by-byte với preview-4: trùng khớp):

1. **6 thẻ `<img>` ẩn của cảnh intro cũ** thêm `loading="lazy" decoding="async"`: `scenery-clean-master.jpg`, `crane-left.png` (×2), `crane-right.png`, `fg-mountain-left.png`, `fg-mountain-right.png`. Tiết kiệm **2,15 MiB** ở cổng (RGBA giải mã −10,8 MiB).
   - Cơ sở: đo bằng `probe-hidden.cjs`, các ảnh này nằm trong tổ tiên `display:none` (`.gv-landscape`) ở **cả ba pha** (cổng, trang chủ, chương ký ức); không file JS nào tham chiếu chúng.
2. **Khối `<style id="gd1-curtain-art">`** (trước `</head>`): `body[data-preview-version="3"]:not([data-curtain-art]) .mc-transition>div{background-image:none}`.
3. **Khối `<script>`** ngay sau `#memoryMapTransition`: đặt `body[data-curtain-art]="ready"` khi chương Miền ký ức mở khóa, khi bấm `#memoryOpenMap`/`#memoryMapShortcut`, hoặc 8 s sau `load`. Hai khối 2–3 hoãn ảnh màn che `bay-water.webp` (**1,87 MiB**) khỏi đường tải đến cổng.

Không có file CSS/JS dùng chung nào bị sửa; không đổi `data-preview-version="3"`.

## 3. Kiểm chứng từng thay đổi

| Thay đổi | Cách kiểm | Kết quả |
|---|---|---|
| Lazy ảnh ẩn | Inventory có cache, so phase A | 5 file ảnh (+ ảnh trùng) không còn được tải; gate 13,61 → 11,46 MiB |
| Hoãn `bay-water` | `verify-curtain-art.cjs` p4 vs p5 qua các pha | Cổng: 0 request, `background-image: none`. Từ sau khi mở đầu xong (chương được mở khóa tự động): `bay-water.webp`, `background-size: cover`, `background-position: 50% 50%`, màu nền — **giống hệt preview-4**; ảnh được yêu cầu 1 lần, trước khi người dùng có thể bấm vào bản đồ |
| Tổng thể | A/B 10+10 lượt ở 1× và ×4 (mục 4) | 0 lỗi, 0 hồi quy thật |

Rủi ro còn lại (đã nêu, chưa kiểm vì không có mạng chậm thật): nếu mạng cực chậm và người dùng đi thẳng bản đồ ngay lúc ảnh `bay-water` chưa tải xong, màn che có thể hiện nền giấy trơn thay vì ảnh vịnh trong khoảnh khắc đầu. Bình thường ảnh đã tải xong từ lúc mở đầu kết thúc.

## 4. Cổng hiệu năng 1.5 — `tools/perf/perf-check.cjs`

Quy tắc (theo GĐ0): thay đổi chỉ tính là **thật** khi |Δ trung vị| ≥ IQR baseline **và** Mann-Whitney p < 0,05 **và** n ≥ 10 mỗi bên; có chỉ số "chặn" (hồi quy thật làm cổng không đạt) và chỉ số không chặn. Baseline = preview-4, candidate = preview-5, **xen kẽ trong cùng phiên**. Kết quả đầy đủ: `tools/perf/results/gd1/perfcheck-x1.md`, `perfcheck-x4.md`.

| Chỉ số | ×1 Δ | ×4 Δ | Kết luận |
|---|---|---|---|
| Tổng byte truyền cả flow | −2,16 MiB | −2,15 MiB | **Cải thiện thật** (p ≤ 0,001) |
| Cổng sẵn sàng (trong trang) | −5 ms (−1%) | −333 ms (−10%, p=0,009 nhưng nhỏ hơn IQR) | trong biên nhiễu |
| FCP / TBT đến cổng | ±2% | −19% / −9% (p=0,07 / 0,007) | trong biên nhiễu |
| FPS mở đầu / trang chủ | −0,4 / +2,6 | +0,3 / +4,3 | trong biên nhiễu |
| Vào bản đồ (khung đầu / màn che mở / gỡ hẳn) | −18% / −2% / −1% | −9% / −6% / −6% | trong biên nhiễu |
| FPS kéo / zoom / xoay / 2D-3D / bay | ±4% | −12% … +7% | trong biên nhiễu |
| Heap cuối | −5% | −4% | trong biên nhiễu |

**Kết quả cổng: ĐẠT** ở cả 1× và ×4; 0/20 lượt lỗi mỗi mức.

### Tải trên Fast 4G (9 Mbps, 40 ms), 5 lượt xen kẽ mỗi bên, 1×

| | preview-4 | preview-5 |
|---|---|---|
| Byte truyền đến cổng | 13,61 MiB | 9,68 MiB |
| Cổng sẵn sàng, trong trang (median, min–max) | 5.841 ms (5.188–6.100) | **3.756 ms (2.922–3.888)** |
| Cổng sẵn sàng, tường (median, min–max) | 13.013 ms (12.943–13.066) | **9.582 ms (9.465–9.594)** |
| Lượt lỗi | 0/5 | 0/5 |

Khoảng min–max **không chồng lấn** giữa hai bên (mọi lượt p5 nhanh hơn mọi lượt p4), nhưng n=5 < 10 nên **theo quy tắc nghiêm ngặt không phải kết luận chính thức**; coi là chỉ báo mạnh.

### Tải trên Slow 4G (1,6 Mbps, 150 ms), 3 lượt xen kẽ mỗi bên, 1×

| | preview-4 | preview-5 |
|---|---|---|
| Byte truyền đến cổng | 13,61 MiB | 9,68 MiB |
| Cổng sẵn sàng, trong trang (median, min–max) | 33.202 ms (31.959–35.347) | **19.415 ms (19.097–22.105)** |
| Cổng sẵn sàng, tường / sự kiện `load` | 68,7 s / 68,6 s | **49,0 s / 48,9 s** |
| Lượt lỗi | 0/3 | 0/3 |

Khoảng min–max không chồng lấn; n=3 nên chỉ là chỉ báo (không đạt n≥10). Người dùng thấy nút bắt đầu sớm hơn ~14 s, và trang tải xong sớm hơn ~20 s.

## 5. Cảnh báo phương pháp từ GĐ1 (quan trọng)

1. **Chênh lệch giữa các phiên đo lớn hơn nhiễu trong phiên.** Cùng preview-4, ×4: vào bản đồ (màn che mở) là **11,1 s** ở phiên GĐ0 nhưng **24,1 s** ở phiên GĐ1; xoay ×4: 35 → 25 FPS; bay ×4: 35,5 → 20,6 FPS; trang chủ ×4: 51 → 35 FPS. Nguyên nhân chưa xác định (hai phiên cách nhau ~5 giờ; RAM trống 3,0 → 2,5 GB; pin 28% → 76% khi cắm sạc; ứng dụng nền khác nhau là ứng viên, **chưa kiểm chứng**).
   → **Báo cáo GĐ0 mục 3 (baseline) chỉ có giá trị trong phiên đó.** Mọi so sánh phải là A/B xen kẽ trong cùng một đợt (như `ab-batch.sh`); không so số tuyệt đối giữa các ngày. Mục tiêu tuyệt đối ở GĐ0 mục 10 cần đọc là **tương đối so với baseline cùng phiên**.
2. **Lỗi bộ đo đã sửa:** server đo cache gzip theo đường dẫn nên phục vụ bản HTML cũ sau khi sửa file; đã sửa theo `mtime`. Lần đo đầu của "lazy ảnh" vì thế ra số giống hệt trước (13,61); sau sửa mới thấy 11,46 MiB. Mọi số trong báo cáo này lấy **sau** khi sửa.
3. Đường truyền qua `page.route` (thí nghiệm `:has()`) làm chậm trang rõ rệt (vào bản đồ ×4 ~23 s vs ~11 s trực tiếp), nên số tuyệt đối của thí nghiệm đó không dùng được; chỉ so sánh tương đối trong cùng thí nghiệm.

## 6. Đã điều tra nhưng KHÔNG đưa vào (có số liệu)

### 6.1 Forced layout khi vào bản đồ (mục 1.2) — không có sửa an toàn

CPU profile ×4 (2 lượt, `profile-enter.cjs`), thời gian mỗi lượt:

| Trong `closeIntroModal` (1.770 ms) | ms |
|---|---|
| `renderMainScene` (vẽ khung bản đồ đầu) | 876 |
| `focus()` trên `#mapScene` | 754 (587 ở lượt khác) |
| `playTrainWhistle` (khởi tạo âm thanh) | 130 |

| Nguồn `getBoundingClientRect` | ms |
|---|---|
| `syncMapControlLayout` ← `syncHeaderOffset` ← `mount` (`map-controls-island-reference.js`) | 401 + 292 |
| `layout` ← `mount` (`polish-3.js`) | 222 |

Cả hai `mount` chạy **lần đầu** khi intro ẩn và DOM bản đồ vừa thay đổi; các lệnh đọc layout phải trả giá cho lần layout/style đầu tiên của toàn giao diện bản đồ. Gom đọc/ghi hoặc dời `focus()` chỉ **chuyển** chi phí sang nơi khác, không giảm tổng. Ở pha kéo/xoay/bay forced layout chỉ 17–181 ms (không đáng sửa). → **Không sửa.**

### 6.2 Vòng lặp `drawAtmosphere` (mục 1.3) — nhanh hơn nhưng dưới biên nhiễu

- Dòng 110 của `homepage-layered-renderer-4.js` (vòng lặp pixel×lớp) chiếm ~99% self-time của `drawAtmosphere` (~2,1–2,4 s ở ×4 trong 10,6 s mở đầu).
- Đã viết 3 phiên bản (layer-major, khai triển theo số lớp, gộp 4 lớp/lượt), **đồng nhất từng bit** với bản gốc (61/61 ca thử ngẫu nhiên, `verify-atmosphere.cjs`), nhưng chỉ nhanh hơn **1,4–1,65×** trong benchmark và **~9% self-time của hàm** trên trang thật (1.959 vs 2.148 ms, ×4, 3 lượt) ≈ **1,5% CPU mở đầu** — dưới biên nhiễu (IQR 5–9%).
- Theo nguyên tắc "làm đủ, đừng làm dư": **không đưa vào**, đã bỏ file thử nghiệm (`homepage-layered-renderer-5.js`) và hoàn tác tham chiếu. Chi phí thật nằm ở độ phức tạp O(pixel×lớp) mỗi khung; muốn giảm đáng kể cần đổi thuật toán (ví dụ cache tổng tiền tố của các lớp đã hiện hết), có rủi ro lệch bit — để lại cho giai đoạn sau nếu bạn muốn.

### 6.3 Thay `:has(#introScreen.intro-hidden)` bằng class (thí nghiệm, không ship)

327 selector ở 17 file CSS dùng `:has(#introScreen.intro-hidden)`. Thí nghiệm (route viết lại CSS, 5 lượt mỗi bên, ×4, cùng phiên):

| Chỉ số | passthru (median) | thay `:has` bằng class (median) | Δ |
|---|---|---|---|
| Style recalc khi vào bản đồ | 1.801 ms | 1.110 ms | **−38%** |
| Style recalc khi mở đầu | 1.234 ms | 930 ms | **−25%** |
| Style recalc ở trang chủ đứng yên (4 s) | 302 ms | 10 ms | **−97%** |
| Thời gian vào bản đồ (màn che mở) | 22,99 s | 22,42 s | −2,5% (trong nhiễu) |
| CPU bận / FPS mở đầu, trang chủ | — | — | không đổi |

Chi phí style giảm thật, nhưng **không chuyển được thành FPS/thời gian đo được** ở mức ×4 hiện tại, trong khi cần sửa 17 file CSS (bản `-5` riêng) và có rủi ro hồi quy hình ảnh. Ghi nhận là **cơ hội tiềm năng** (đặc biệt chi phí style liên tục ở trang chủ), không ship ở GĐ1.

### 6.4 Chi phí nhãn (mục 1.4) — cache hoạt động tốt, không có sửa đáng ship

`profile-labels.cjs`, preview-5, ×4, 1 lượt mỗi cử chỉ (CPU profile + `GoiVietLabelPerformance.inspect()` trước/sau):

| Cử chỉ | Bận (ms) | Cache chữ: trúng / trượt | Nhãn tổng (ms, gồm đặt + vẽ + đo) | `measure()` self (ms) | `measureText` gốc (ms) |
|---|---|---|---|---|---|
| Kéo | 4.174 | 791 / 1 (99,9%) | ~400 (~10%) | 52 | 29 |
| Zoom | 2.816 | 1.501 / 100 (93,8%) | ~600 (~21%) | 72 | 113 |
| Xoay | 2.802 | 1.394 / 5 (99,6%) | ~290 (~10%) | 76 | 59 |
| Bay tới Huế | 3.255 | 889 / 25 (97,3%) | ~330 (~10%) | 60 | 57 |

- Cache chữ **trúng 94–99,9%**; trượt chỉ khi đổi mức zoom (hợp lý). `revision`/`fontRevision` hầu như không đổi trong cử chỉ nên **không bị vô hiệu hóa quá thường xuyên**; số lần đọc layout (`reads`) bằng 0–12.
- Chi phí nhãn là 10–21% thời gian bận của cử chỉ, chủ yếu ở logic `placeCountryLabels` (117–237 ms), `paintLabels` (109–175 ms), `paintIslandLabel` (36–81 ms), không phải ở việc đo chữ. Phần "tạo khóa bằng `JSON.stringify` 9 trường" của `measure()` là ≤ 76 ms (≤ 3–6% bận); thay bằng khóa nhẹ hơn tiết kiệm tối đa ~1–3% — **dưới biên nhiễu**, nên **không sửa**.
- Kết luận: giả thuyết "cache bị vô hiệu quá thường xuyên / chi phí tạo khóa lớn" **bị bác bỏ**. Nếu muốn giảm chi phí nhãn đáng kể cần thay đổi thuật toán đặt/vẽ nhãn (GĐ4), không phải cache.

### 6.5 Gate còn lại sau GĐ1

Gate hiện 9,68 MiB (đo ở Fast 4G). Phần còn lớn: `assets-2k.js` 2,02 MiB (cần cho cảnh trang chủ), `paper-grain.webp` 1,68 MiB (nền thật của dải nối trang chủ–chương; hoãn sẽ đổi hình), ảnh Wikimedia 1,15 MiB (hotlink ngoài, ảnh hiển thị ở panel bản đồ; hoãn cần đổi cách tạo `<img>` trong JS và không giải quyết rủi ro offline), `homepage-transport-3` 1,31 MiB, thiệp `invitation/` 1,24 MiB (ảnh hiển thị ở trang chủ). Mục tiêu "≤ 5,4 MiB" của báo cáo GĐ0 **chưa đạt** (9,68 MiB). Báo cáo GĐ0 đã tính `assets-2k.js` là hoãn được; suy luận từ mã (cảnh trang chủ nạp dữ liệu từ đó) cho thấy nó nhiều khả năng **cần cho cổng**, nhưng tôi **chưa thử chặn để xác nhận**. Phần còn lại hoặc cần cho cổng, hoặc hoãn sẽ đổi hình; chưa có ước tính mới về "sàn" tải đến cổng.

## 7. Trạng thái các mục GĐ1

| Mục | Trạng thái |
|---|---|
| 1.1 Tải theo giai đoạn | Xong cho 2 nhóm an toàn (−3,93 MiB). Các nhóm còn lại cần đổi hình hoặc cần thiết cho cổng |
| 1.2 Layout | Điều tra xong, không có sửa an toàn (6.1) |
| 1.3 Chi phí mỗi khung trang chủ | Điều tra xong; hai hướng khả thi đều dưới biên nhiễu hoặc rủi ro cao (6.2, 6.3) |
| 1.4 Chi phí nhãn | Điều tra xong: cache trúng 94–99,9%, giả thuyết bị bác bỏ, không sửa (6.4) |
| 1.5 Cổng hiệu năng | Xong (`perf-check.cjs`, dùng được ngay) |
| Đo mạng | Fast 4G (n=5) và Slow 4G (n=3) xong (mục 4) |

## 8. Sự cố trong quá trình đo

- Lần chạy mạng đầu (`net-batch.sh`, shell nền) bị hệ thống dừng khi **RAM trống xuống ~0,5 GB** (máy 15,6 GB). Fast 4G đã xong; Slow 4G đã **chạy lại ở foreground** khi RAM trống ~2 GB và có đủ 3 lượt mỗi bên.
- Một tiến trình `flow.cjs` mồ côi của lượt bị dừng đã được tắt (chỉ tiến trình node của bộ đo; Chrome ẩn của nó tự thoát). Không đụng tới Chrome của bạn.
- Server đo (cổng 8770) chỉ bật khi cần: `node tools/perf/server.cjs`.

## 9. Tệp mới / thay đổi

- Sửa: `map-surroundings-preview-5.html` (3 chỗ, mục 2).
- Mới trong `tools/perf/`: `perf-check.cjs`, `ab-batch.sh`, `net-batch.sh`, `has-experiment.sh`, `profile-enter.cjs`, `profile-opening.cjs`, `probe-hidden.cjs`, `profile-labels.cjs`, `verify-curtain-art.cjs`, `verify-atmosphere.cjs`; cập nhật `flow.cjs` (tuỳ chọn `--cache`, `--variant`, sửa timeout), `server.cjs` (cache gzip theo mtime).
- Kết quả thô: `tools/perf/results/gd1/` (`ab-*.jsonl`, `perfcheck-*.md`, `has-*.jsonl`, `net-*.jsonl`), `tools/perf/results/gd0/inventory-p5-a1.json`.
- Cách chạy cổng: `node tools/perf/server.cjs`; `bash tools/perf/ab-batch.sh 10`; `node tools/perf/perf-check.cjs tools/perf/results/gd1/ab-p4-x4.jsonl tools/perf/results/gd1/ab-p5-x4.jsonl`.

## 10. Cần bạn quyết định

1. **Chấp nhận kết quả GĐ1** (tải −29% byte; cổng sẵn sàng nhanh hơn 26–36% trên Fast 4G và 29–41% trên Slow 4G; không hồi quy) và sang bước kế?
2. **GĐ2 (vào bản đồ nhanh, rủi ro cao)** bắt đầu bằng pilot nướng sẵn trên một vùng — duyệt hay chưa? GĐ1 cho thấy vào bản đồ ×4 bị chi phối bởi tổng công việc luồng chính (raster-scheduler `tick` ~4,3 s, `renderMainScene` ~4,8 s, `buildBackdrop` ~2,5 s), nên GĐ2 mới là nơi có thể cải thiện thật.
3. Có muốn xem xét **thay `:has()` bằng class** (6.3) hoặc **đổi thuật toán `drawAtmosphere`** (6.2) ở giai đoạn sau không? Cả hai cần duyệt riêng.
4. Giảm chi phí nhãn đáng kể cần đổi thuật toán đặt/vẽ nhãn (6.4), tức thuộc GĐ4 — để sau.

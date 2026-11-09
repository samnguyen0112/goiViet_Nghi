# Báo cáo Giai đoạn 3 — Trang chủ: giảm chi phí mỗi khung mà không đổi hình

> Phạm vi: GĐ3 của kế hoạch (chi phí mỗi khung của cảnh trang chủ; khởi tạo ngoài cổng), nhóm A (không đổi hình, không đổi chuyển động), trên preview-5.
> **Kết luận: không có thay đổi nào đáng giao.** Tôi đã đo, thử hai hướng giữ nguyên điểm ảnh, đều không cho lợi ích đo được, nên **không sửa mã giao nào** trong GĐ3. Preview-5 giữ nguyên như sau GĐ2 và `drawAtmosphere`. Chỉ thêm công cụ đo vào `tools/perf/`; file thử `homepage-layered-renderer-6.js` đã tạo rồi **gỡ bỏ**, HTML chưa từng tham chiếu nó.

---

## 1. Chi phí trang chủ đứng yên ở ×4 nằm ở đâu

CPU profile 6 s × 2 lượt, preview-5 ở ×4 (`profile-home.cjs`), FPS 46, p95 khung 33 ms:

| Thành phần (tự thời gian, mỗi 6 s) | ms | Tỉ lệ |
|---|---|---|
| Việc gốc của trình duyệt (`(program)`: ghép lớp, gửi lệnh GPU, chờ) | ~2.580 | ~38% |
| Vẽ cảnh Canvas 2D (`tick`→`render`→`draw`, tính cả bao gồm) | ~2.520 | ~40% |
| — trong đó: `restore` 920, `drawImage` 654, `closePath` 121, `clip` 115, `save` 110 | | |
| Prewarm bản đồ chạy ngầm (`raster-scheduler` tick) | ~1.010 | ~16% |
| Style recalc / layout | ~0 (Performance.getMetrics) / 0 | — |

Chi phí vẽ cảnh theo loại lớp (đo bằng hàm `draw()` có gắn đồng hồ, 309 khung):

| Loại lớp | ms / 6 s | Số lần gọi |
|---|---|---|
| Núi (mountain) | 850–1.150 | 1.854 |
| Mây (cloud) | 500–630 | 5.562 |
| Cây (tree) | 250–330 | 3.399 |
| Lá, cánh hoa (leaf) | 180–420 | 5.871 |
| Chim/hạc (bird) | 160–190 | 618 |
| Nhà cố định, bầu trời, khói, thung lũng | 13–100 mỗi loại | |

## 2. Cắt bỏ thử (chỉ để đo trần; hình sai), ×4, n=3

| Cấu hình | FPS trang chủ (median, min–max) | p95 khung |
|---|---|---|
| Bình thường | **40,8** (34,7–45,7) | 41,6 ms |
| Bỏ riêng núi và thung lũng | 52,4 (50,1–54,9) | 33,4 ms |
| Bỏ toàn bộ việc vẽ cảnh (trần) | **57,9** (56,5–58,5) | 16,8 ms |

Trần lý thuyết của "vẽ cảnh nhanh hơn" là +42% FPS ở ×4 (trong phiên đo này), riêng núi chiếm khoảng +28%. Đây là lý do GĐ3 đáng thử; hai cách sau đều không chạm được trần đó.

## 3. Hướng 1: bỏ thao tác trạng thái vô ích cho lớp tĩnh — không có lợi ích

Sau hoạt cảnh mở đầu, một lớp tĩnh (núi, nhà…) vẫn chạy `save() → globalAlpha=1 → transform đơn vị → drawImage → restore()` mỗi khung, mọi thao tác trạng thái đều là phép không làm gì. Bỏ chúng cho **kết quả giống hệt từng điểm ảnh theo cấu trúc**. Đo n=3 mỗi bên, ×4:

| | Bình thường | Bỏ thao tác vô ích |
|---|---|---|
| Thời gian `draw()` của núi | ~900 ms | **~70 ms (−92%)** |
| Thời gian `draw()` của mây | ~550 ms | ~1.500 ms (**+170%**) |
| Tổng tác vụ luồng chính | 5.853 ms | 5.846 ms (**không đổi**) |
| FPS | 50,6 | 45,2 (trong nhiễu) |

Chi phí không biến mất mà **chuyển sang lệnh vẽ kế tiếp** (Canvas 2D ghi lệnh rồi xử lý dồn): số tự đo theo từng loại lớp không phản ánh chi phí thật. Hướng này vô ích.

## 4. Hướng 2: cache từng nhóm lớp tĩnh liền kề (prototype `renderer-6`) — không có lợi ích

Thiết kế: sau hoạt cảnh mở đầu, 12 lớp tĩnh (núi, thung lũng, nhà, cầu, tàu) tạo thành **5 nhóm** nằm giữa các lớp chuyển động (mây, khói); mỗi nhóm được vẽ một lần vào bitmap cỡ canvas bằng chính mã `draw()` cũ, rồi mỗi khung chỉ một `drawImage` 1:1 cho mỗi nhóm; thứ tự vẽ giữ nguyên, cache bị hủy khi đổi kích thước canvas hoặc tập lớp.

**Độ lệch hình** (`verify-run-cache.cjs`, so trực tiếp trên canvas cảnh, 5 thời điểm `t`): đối chứng tắt–tắt **0 điểm ảnh lệch**; bản có cache so với bản gốc: **393 trên 1.835.000 điểm (0,021%), lệch tối đa 2/255** (389 điểm lệch 1, 4 điểm lệch 2), giống hệt ở mọi `t`. Tức là gần như đồng nhất nhưng **không phải từng bit** (hợp nhất alpha theo nhóm gây lệch làm tròn ở viền bán trong suốt).

**Hiệu năng:**

| Chỉ số (đối chứng `route` cùng đường) | Renderer-5 | Renderer-6 | Kết luận |
|---|---|---|---|
| FPS trang chủ đứng yên ×4, A/B n=10 | 54,15 (IQR 5,6) | 55,3 (IQR 3,3) | +2,1%, trong biên nhiễu |
| CPU trang chủ ×4 | 92,95% | 92,75% | không đổi |
| CPU bận tổng, profile 6 s ×3 | 6.704 ms | 6.586 ms | −1,8% |
| `restore` / `drawImage` (profile) | 1.044 / 467 ms | 927 / 453 ms | không đáng kể |
| Cổng hiệu năng | | | ĐẠT (không hồi quy) |

→ **Bác bỏ**: thêm ~40 dòng và 393 điểm lệch ≤2/255 mà không có lợi ích đo được, vì chi phí không nằm ở số lần vẽ lớp tĩnh. File đã gỡ.

**Phát hiện phương pháp (quan trọng cho các lần sau):** gọi lặp `getImageData` trên canvas cảnh khiến Chrome chuyển canvas từ kết xuất GPU sang CPU, và bản thân việc đó làm đổi điểm ảnh (tôi từng thấy "9,6% khác, lệch tới 72" hoàn toàn do artefact này). Phép so hình phải đọc bằng `createImageBitmap` rồi đọc từ canvas riêng.

## 5. Khởi tạo ngoài cổng: không theo đuổi

Profile từ lúc điều hướng đến khi cổng sẵn sàng, ×4 (`profile-gate.cjs`, n=3): cổng sau **3.029 ms**; luồng chính bận 3.000 ms, trong đó `(program)` 2.145 ms (71%, parse/style/layout/giải mã của trình duyệt), script nội tuyến của HTML ~700 ms (hàm lớn nhất 652 ms), lần vẽ bản đồ đầu tiên (`renderMainScene`) 362 ms, `resizeCanvases` 198 ms (có ép layout 186 ms), các script hiệu ứng (khói tàu, hạc…) chỉ ~45 ms mỗi file.

Phần có thể hoãn tối đa (lần vẽ bản đồ đầu) chỉ ≈ **10%** thời gian cổng ở ×4 (~0,36 s) và đòi hỏi sắp xếp lại thứ tự khởi tạo trong script nội tuyến 1 MB (rủi ro hồi quy cao so với lợi ích). Các hiệu ứng "ngoài cổng" mà kế hoạch nhắc không tốn đáng kể ở giai đoạn này. Không làm.

## 6. Những gì còn lại — đều đòi hỏi đánh đổi

| Hướng | Lợi ích kỳ vọng | Vì sao chưa làm |
|---|---|---|
| Giảm tần suất cập nhật ambient, bớt mây/lá, hạ độ phân giải cảnh | Chạm gần trần +42% FPS ×4 | **Đổi hình/chuyển động** (nhóm B, bạn đã loại) |
| Giảm hoặc hoãn prewarm bản đồ trên trang chủ (~16% CPU luồng chính) | Tăng FPS trang chủ | Làm vào bản đồ chậm lại (đang cần prewarm; ở ×4 prewarm vốn chưa kịp xong sau 45 s) |
| `:has()` → class (đã gác) | Style ~7% thời gian bận ở trang chủ ×4 | Công lớn, lợi ích nhỏ; đã gác theo yêu cầu |

## 7. Giới hạn

- Số tuyệt đối phụ thuộc phiên đo (ở phiên này FPS trang chủ ×4 đo ra 35–54 tùy lúc); so sánh chỉ có giá trị trong cùng đợt xen kẽ.
- Cắt bỏ thử chỉ n=3 mỗi cấu hình; dùng để thấy thứ tự độ lớn, không để kết luận số chính xác.
- Headless Chrome trên một máy; hành vi trên GPU/CPU yếu thật có thể khác (đặc biệt nơi GPU là nút cổ chai).

## 8. Tệp mới và cách chạy lại

- Công cụ (`tools/perf/`): `profile-home.cjs`, `probe-home-layers.cjs` (đồng hồ theo loại lớp + cắt bỏ thử + tuỳ chọn `--fast`), `verify-run-cache.cjs` (so điểm ảnh bằng `createImageBitmap`), `profile-gate.cjs`; `flow.cjs` có thêm `--variant r5pass|r6` (route riêng script renderer).
- Kết quả: `tools/perf/results/gd4/` (`home-profile-*.json`, `home-layers-x4.json`, `run-cache-diff-x1.json`, `ab-r5pass-x4.jsonl`, `ab-r6-x4.jsonl`, `perfcheck-r6-x4.md`, `gate-profile-x4.json`).
- Không có thay đổi mã giao trong GĐ3.

## 9. Cần bạn quyết định

1. **Chấp nhận kết luận GĐ3** ("không có thay đổi an toàn đáng giao") và chuyển sang GĐ4 (thao tác bản đồ), hay bỏ GĐ4 và sang GĐ6 (nghiệm thu cuối)? Dựa trên GĐ3, tôi dự đoán GĐ4 cũng sẽ cho kết quả tương tự (nhãn đã có cache trúng 94–99,9%; chi phí vẽ tập trung ở Canvas 2D).
2. Nếu muốn FPS trang chủ cao hơn ở máy yếu, con đường duy nhất còn lại là nhóm B (đổi chuyển động/độ phân giải). Bạn có muốn xem xét lại nhóm này, riêng và có duyệt riêng?

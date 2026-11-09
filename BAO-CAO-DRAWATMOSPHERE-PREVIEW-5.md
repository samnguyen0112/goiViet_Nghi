# Báo cáo: tối ưu `drawAtmosphere` (preview-5) — đồng nhất từng bit

> Phạm vi đã duyệt: làm mục `drawAtmosphere` (hoạt cảnh mở đầu, lớp sương) trên preview-5, không đổi hình.
> Sửa: **một file mới** `assets/goi-viet/homepage-layered-renderer-5.js` (bản sao của `-4` với 2 thay đổi trong `drawAtmosphere`) và **một dòng tham chiếu script** trong `map-surroundings-preview-5.html`. Preview-3, preview-4 và file dùng chung giữ nguyên.

---

## 1. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Đồng nhất với bản gốc | **Từng bit**: 0 byte alpha lệch trong 294 lần cập nhật mặt nạ (1×) + 113 lần (×4) trên **dữ liệu trọng số và khung thật** của trang |
| Thời gian của riêng hàm `drawAtmosphere`, ×4 (profile, n=5 mỗi bên) | **2.529 → 1.615 ms (−36%)**, các lượt không chồng nhau (2.209–2.826 so với 1.512–1.746) |
| Mỗi lần cập nhật mặt nạ (vi đo trong Chrome, 142.560 điểm) | ×1: 2,8 → 0,8 ms (**3,5×**); ×4: 18,8–20,5 → 6,3–6,8 ms (**~3×**) |
| CPU pha mở đầu ở **1×** (A/B xen kẽ, n=10) | **40,6% → 34,0% (−16,3%)**, cải thiện thật (p<0,001) |
| FPS pha mở đầu ở 1× | 58,8 → 58,9 (không đổi; đã chạm trần 60 FPS) |
| FPS pha mở đầu ở ×4 (n=10) | 37,6 → 38,75 (+3%), **trong biên nhiễu** (IQR 7–12 FPS): không chứng minh được bằng cổng |
| Cổng hiệu năng | **ĐẠT** ở ×4 và ×1; 0/40 lượt lỗi |
| Hình ảnh (7 trạng thái) | Trong nền nhiễu (xem mục 5) |

## 2. Thay đổi trong `homepage-layered-renderer-5.js`

Chỉ vòng lặp cập nhật mặt nạ trong `drawAtmosphere` (dòng 108–123); mọi thứ khác giống hệt `-4`:

1. **Cache tổng tiền tố.** Các lớp đã hiện hết (gain đúng bằng 1) luôn nằm đầu danh sách lớp khác 0 (đã kiểm với manifest thật, 366 khung), nên tổng của chúng được giữ trong một `Float64Array` và mỗi khung chỉ cộng nốt các lớp còn đang đổi, **theo đúng thứ tự phép cộng của bản gốc**. Cache tự dựng lại nếu các lớp không còn là tiền tố, hoặc nếu `revealWeights` đổi (đổi kích thước).
2. **Làm tròn nhanh có đường lui chính xác.** `Math.round` hóa ra là phần chậm nhất của vòng lặp (xem mục 3). Thay bằng `(x+0,5)|0`, và **chỉ khi `x+0,5` bị làm tròn lên đúng một số nguyên** (`y===r`, trường hợp duy nhất kết quả có thể khác) mới gọi `Math.round`.

## 3. Điều tôi đã dự đoán sai và điều đo được

Tôi dự đoán lợi ích chủ yếu đến từ cache tiền tố (≈ +10% FPS). **Đo thực tế cho thấy không phải vậy:**
- Trong V8, riêng cache tiền tố gần như **không giúp gì** khi vẫn dùng `Math.round` (vi đo ×4: bản gốc 19,7 ms, bản có cache nhưng vẫn `Math.round` 19,4 ms).
- Phần chậm thật là **`Math.round`**: vòng lặp giống hệt nhưng làm tròn bằng `(x+0,5)|0` nhanh hơn ~2,5–4,7× (×1: 1,3 → 0,3 ms).
- Cache tiền tố chỉ phát huy **sau khi** bỏ nút thắt làm tròn: ở ×1, cùng cấu trúc "cộng theo lớp + làm tròn nhanh", có cache 0,8 ms so với không cache 1,3 ms (−38%). (Số đo ×4 của biến thể "không cache" không đáng tin: 1,5 ms thấp bất thường so với 1,3 ms ở 1×; nghi artefact của giới hạn CPU với tác vụ ngắn, nên tôi không dùng.)

## 4. Chứng minh đồng nhất từng bit

| Kiểm tra | Phạm vi | Kết quả |
|---|---|---|
| Bất biến "lớp đã hiện hết luôn là tiền tố" (`verify-atmo-prefix.cjs`) | Manifest thật `homepage-reference-v9`, 366 khung của 6,1 s | **Đúng** ở mọi khung |
| Phát lại toàn bộ hoạt cảnh, trọng số ngẫu nhiên chuẩn hóa | 363 khung phân biệt | **0** khung lệch |
| Vi đo trong Chrome: các biến thể so với bản gốc | 11 biến thể | Tất cả `identical=true` |
| Stress công thức làm tròn nhanh vs `Math.round` (sau khi kẹp 0–255) | **3.603.135** giá trị: ngẫu nhiên, mọi `k+0,5 ± 3 ulp`, sát số nguyên, giá trị quanh biên (0,4999…94, 254,5, 255,5…) | **0 lệch** (hai "lệch" ở lần chạy đầu là artefact NaN của bộ sinh dữ liệu, đã loại) |
| **Kiểm tra trực tiếp trên trang thật** (`verify-atmo-live.cjs`): sau mỗi lần cập nhật, tính lại bằng vòng lặp *gốc* vào mảng đối chứng và so từng byte alpha | 294 cập nhật ở 1×, 113 ở ×4; 142.560 điểm mỗi lần; cache tiền tố dài tới 7 lớp | **0 byte lệch** |

Đoạn kiểm tra trực tiếp chỉ chèn vào một bản sao tạm qua `route`, không nằm trong mã giao.

## 5. Đo hiệu năng và hình ảnh

### 5.1 A/B xen kẽ, n=10 mỗi bên (`--stop home`, mở đầu + trang chủ)

| Chỉ số | ×1 preview-4 → preview-5 | ×4 preview-4 → preview-5 |
|---|---|---|
| Mở đầu: CPU bận | **40,6% → 34,0% (−16,3%)**, cải thiện thật | 94,4% → 93,4% (trong nhiễu) |
| Mở đầu: FPS | 58,8 → 58,9 | 37,6 → 38,75 (+3%, trong nhiễu; IQR 6,9 → 12,4) |
| Trang chủ đứng yên: FPS / CPU | 51,9 → 52,0 / 47,0 → 47,9% | 32,3 → 30,1 / 96,95 → 96,9% (trong nhiễu; hàm này không chạy ở trang chủ) |
| Cổng sẵn sàng, FCP, TBT | không đổi | không đổi (trong nhiễu) |
| Lượt lỗi | 0/10 | 0/10 |

Cổng (`perf-check`): **ĐẠT** ở cả hai. Kết quả: `tools/perf/results/gd3/perfcheck-x4.md`, `perfcheck-x1.md`.

### 5.2 CPU profile ×4 (`profile-opening.cjs`, n=5 xen kẽ)
`drawAtmosphere` tự thời gian: **2.529 → 1.615 ms**. CPU bận tổng của pha mở đầu: 9.950 → 9.538 ms (−4%, trong nhiễu). Phần còn lại của hàm (dòng profile): cộng các lớp đang đổi (~53% số mẫu), lượt làm tròn cuối (~34%), sao chép tổng tiền tố (~13%).

### 5.3 Hình ảnh (`visual-states.cjs`, 7 trạng thái, so p4 vs p5, lặp 4 lần)
- Cổng, chương ký ức: 0%. Bản đồ sáng / panel Huế / phạm vi "tất cả": ≤ 0,04%. Trang chủ (cảnh động): 0,07–0,69% (nền nhiễu cùng bản vs cùng bản: 0,22–0,51%).
- Bản đồ **tối** hiện hai pha: ~0,02% hoặc ~0,55% (bbox [413,154,1077,1066]). Pha 0,55% xuất hiện **cả khi so p4 với p4 (0,542%) và p5 với p5 (0,555%)**, cũng như 1/4 lần p4 vs p5 → là dao động có sẵn của bản đồ tối (khung chụp rơi vào thời điểm khác nhau), **không do thay đổi này**. Lý do chính xác chưa xác định.
- Bằng chứng mạnh nhất về hình ảnh vẫn là mục 4: mặt nạ giống hệt từng byte.

## 6. Đánh giá thẳng thắn về lợi ích

- **Chắc chắn:** hàm nhanh hơn ~3× mỗi lần cập nhật và −36% tổng thời gian hàm ở ×4; CPU mở đầu ở 1× giảm 16% (đo được, p<0,001). Hình ảnh không đổi.
- **Không chứng minh được:** FPS mở đầu ở ×4 tăng. Ước tính trần trước đó là +36% nếu **xóa hẳn** chi phí; ở đây còn khoảng 64% chi phí của hàm, và +3% đo được nằm trong nhiễu (IQR 7–12 FPS). Cần n≫10 hoặc chỉ số khác để xác nhận.
- **Phạm vi hẹp:** chỉ ảnh hưởng 6 s đầu hoạt cảnh mở đầu, một lần mỗi lần tải; không ảnh hưởng trang chủ đứng yên hay bản đồ. Ở 1× lợi ích chủ yếu là CPU thấp hơn (ít nóng/ít pin), không phải FPS.
- Không giải quyết nhóm không có GPU (mở đầu 2–7 FPS do vẽ canvas, không phải hàm này).

## 7. Tệp và cách chạy lại

- Mới: `assets/goi-viet/homepage-layered-renderer-5.js`; sửa 1 dòng trong `map-surroundings-preview-5.html`.
- Công cụ (`tools/perf/`): `verify-atmo-live.cjs` (kiểm tra trực tiếp), `verify-atmo-prefix.cjs`, `bench-atmo-browser.cjs` (vi đo + stress làm tròn), `probe-atmo.cjs`, `profile-opening.cjs`, `visual-states.cjs`.
- Kết quả: `tools/perf/results/gd3/` (`ab-*.jsonl`, `perfcheck-*.md`, `atmo-live-check-*.json`, `atmo-bench-browser.json`).
- Chạy lại: `node tools/perf/server.cjs`; `node tools/perf/verify-atmo-live.cjs --cpu 1`; `node tools/perf/bench-atmo-browser.cjs --cpu 4`; A/B: `node tools/perf/flow.cjs --target map-surroundings-preview-5.html --cpu 4 --stop home ...` rồi `node tools/perf/perf-check.cjs <p4.jsonl> <p5.jsonl>`.

## 8. Cần bạn quyết định

1. **Giữ `homepage-layered-renderer-5.js` trong preview-5?** (đồng nhất từng bit, CPU mở đầu ×1 −16%, không hồi quy; FPS ×4 chưa chứng minh được.)
2. Mục còn lại **`:has()` → class** (khả thi, lợi ích 3–7% CPU ×4, cần bản `-5` cho 15 file CSS): làm hay để sau?
3. Kế hoạch riêng cho nhóm không có GPU (rủi ro lớn nhất cho buổi trình chiếu)?

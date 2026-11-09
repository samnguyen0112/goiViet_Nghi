# Báo cáo Giai đoạn 6 — Hợp nhất và nghiệm thu cuối (preview-5)

> Trạng thái: **hoàn thành, nghiệm thu ĐẠT cho các tiêu chí đo được trên máy này (đã gồm ghép thẻ bài, mục 10)**; 1 hồi quy được phát hiện và sửa trong GĐ6; một số mục của kế hoạch **không làm** (mục 7).
> File dự án sửa trong GĐ6 (ngoài phần thẻ bài ở mục 10): `assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js` (1 điều kiện) và `map-surroundings-preview-5.html` (chỉ số phiên bản của script đó). `index.html`, preview-3/4 và tài nguyên dùng chung không đổi.
> Bản gốc trước GĐ6 của scheduler: `tools/perf/results/gd6/raster-scheduler-5-before-gd6.js`.

## 1. Phạm vi GĐ6 và những gì không làm

Theo `KE-HOACH-NANG-CAP-PREVIEW-4.md` mục 8:

| Mục | Kết quả |
|---|---|
| `perf-check` toàn bộ (1×, ×4, Fast/Slow 4G, SwiftShader, WebGL tắt) | **Làm** — mục 2–5 |
| Kịch bản chức năng/bố cục (tìm không dấu, lọc chủ đề, chọn địa danh, thẻ bài, ghi kỷ niệm, âm nhạc, phím tắt kể cả Escape) | **Làm** — mục 3 |
| Đường dự phòng, rò rỉ bộ nhớ, so ảnh | **Làm** — mục 4 |
| Ghép thiết kế thẻ bài theo `card-testing.html` | **Làm sau khi bạn duyệt** — mục 10. Các mục 2–6 đo **trước** khi ghép; mục 10 kiểm riêng thẻ bài và chạy lại cổng toàn luồng sau khi ghép. |
| Kiểm tra thủ công trên ≥ 2 cấu hình thật | **Không làm được** — chỉ có một máy (16 lõi, Intel Arc). Đây là việc của bạn trước buổi trình chiếu (mục 7). |

## 2. Hồi quy phát hiện và sửa: lát raster 12 ms khi không có WebGL

**Phát hiện.** Ở bảng suy giảm (n=3) cho WebGL tắt ×1, vào bản đồ 6,5 → 8,1 s. Chạy A/B xen kẽ 6 cặp: preview-4 6,7 s, preview-5 9,2 s (chậm hơn ở 5/6 cặp). Theo tiêu chí 9.2 ("không luồng nào tệ hơn baseline") đây là điều chặn nghiệm thu.

**Nguyên nhân (đã kiểm bằng thí nghiệm cùng phiên).** GĐ2 cho `raster-scheduler-5.js` dùng lát 12 ms, không nghỉ, khi màn che đang giữ. Ở đường Canvas 2D luồng chính đã bận ~97% nên lát này làm khung không đều và kéo dài việc chờ của màn che. Đổi riêng scheduler về bản `-4`: vào bản đồ nhanh hơn ở 5/6 cặp, trung vị 7,8 → 4,4 s.

**Sửa (nhóm A, 1 điều kiện).** `holding()` trong scheduler giờ chỉ true khi màn che đang giữ **và** `GoiVietWebGLTerrain3.usable()`. Không có WebGL thì dùng nhịp 3 ms / 8 ms như preview-4.

**Kiểm tra bản sửa:**
- WebGL tắt ×1, preview-4 so với preview-5 đã sửa, 6 cặp xen kẽ: 2,67 s so với 2,61 s (ngang nhau; kéo, xoay, bay không đổi).
- Đối chứng cùng phiên, khi máy bình thường: scheduler GĐ2 gốc 2,82 s so với bản sửa 2,61 s (bản sửa nhanh hơn ở 6/6 cặp, IQR hẹp).
- **GPU thật không bị ảnh hưởng.** Đo trực tiếp 122 mẫu mỗi 50 ms từ lúc bấm vào bản đồ ×4: trong 106 mẫu giai đoạn giữ, `usable()` luôn true, nên logic ở đường GPU giống hệt bản GĐ2. Một phép A/B cùng phiên (GĐ2 gốc so với bản sửa) ban đầu cho chênh 7,1 → 9,0 s. Phép A/A (cùng mã sửa, hai đường dẫn nạp) cũng cho chênh 9,35 so với 8,3 s với thứ tự lẫn lộn, nên chênh đó là nhiễu, không phải tác dụng của bản sửa.

**Lưu ý đo lường:** lượt A/B đầu tiên cho preview-4 6,7 s, còn lượt kiểm tra sau cho cùng mã 2,7 s. Ngay sau lượt đầu hệ thống báo thiếu RAM (đo được 0,8 GB trống), nên nghi máy bị áp lực bộ nhớ lúc đó; tôi không đo RAM tại thời điểm từng lượt nên đây là nghi ngờ, không phải kết luận. Vì vậy nguyên nhân được xác nhận bằng các phép so cùng phiên ở trên, chạy lại khi RAM trống ≥ 2,8 GB.

## 3. Chức năng (so từng bước preview-4 với preview-5, mã cuối)

`tools/perf/verify-gd6-functional.cjs`: cùng một kịch bản người dùng chạy trên hai bản, so mọi quan sát. Kết quả: **không có khác biệt, 0 lỗi trang** ở cả hai.

Phủ: chọn file nhạc (tên, ghi chú lưu, nút xóa/nghe thử, âm lượng); thẻ "3 ga mẫu" (hn, hue, hcm) và "34 tỉnh thành & 2 quần đảo" (36 thẻ, `aria-pressed` đúng); tìm không dấu ("hue" 1, "HA NOI" 1, "ho chi minh" 1, "pho" 11, "banh" 7, "da lat" 1, "zzzzqq" 0 kèm thông báo rỗng, xóa tìm trả 36); 5 bộ lọc chủ đề và tìm + lọc cùng lúc; chọn địa danh bằng click thật (đầu, giữa, cuối, Huế) và đóng modal bằng Escape; rút bài, lật bài, ghi kỷ niệm "Đà Lạt" + ghi chú (lưu đúng, ô nhập được xóa), gợi ý nhanh "Huế", lưu rỗng ra thông báo nhắc; phím R tái định tâm (R trong ô nhập không tái định tâm); Escape đóng modal bộ bài; bẫy focus trong modal sau 12 lần Tab.

**Quan sát không do GĐ nào gây ra (giống hệt preview-4):** 5 bộ lọc chủ đề đều trả 36 thẻ trong phạm vi "tất cả"; Escape khi không có modal không bỏ chọn địa danh hiện tại. Ghi lại vì kế hoạch yêu cầu "hành vi Escape hiện tại", không sửa.

## 4. Dự phòng, rò rỉ bộ nhớ, hình ảnh

- **Ma trận dự phòng** (`fallback.cjs`, mã cuối): **14/14 đạt**, 0 lỗi trang. Gồm `file://`, WebGL tắt, SwiftShader, thiếu ảnh bản đồ, chặn ảnh ngoài, thiếu `hydrology-data.js`/`islands-data.js`, worker lỗi (2 ca), mất/khôi phục WebGL, ẩn/hiện tab, xuất PNG, cache lạnh/ấm. Số tải lỗi trong từng ca bằng preview-4. Hai ca worker lỗi vào bản đồ ~32 s (chạm giới hạn an toàn của prewarm), giống preview-4; đây là điểm yếu có sẵn, không đổi.
- **Rò rỉ** (`verify-gd6-leak.cjs`, ép GC trước mỗi mẫu): vào/ra bản đồ 12 lần — heap 18,3 → 18,1 MB, nút DOM 6.006 → 6.006 (preview-4) và 6.011 → 5.999 (preview-5): **phẳng ở cả hai**. Chọn địa danh 36 lần làm heap tăng ~3,7 MB và +47 nút DOM, **như nhau ở cả hai bản** (không do các thay đổi của kế hoạch); chưa tìm nguyên nhân, nên đưa vào việc để sau.
- **Hình ảnh** (`visual-states.cjs`, 7 trạng thái, 2 chủ đề): preview-5 so với preview-4 nằm trong mức nhiễu A/A của chính preview-4 (nền tối 0,542% pixel lệch >16 ở cả A/A và A/B; 6 trạng thái còn lại 0–0,023%).
- **Nhóm B không bật ngầm:** thay đổi tích lũy của preview-5 so với preview-4 chỉ gồm hoãn tải ảnh màn che/ảnh nền lười (GĐ1), lát raster khi màn che giữ (GĐ2, nay có điều kiện), `drawAtmosphere` đồng nhất từng bit (kế hoạch), hoãn `scrollIntoView` (GĐ4). Không có hạ FPS, giảm DPR, tắt hiệu ứng.

## 5. Cổng hiệu năng cuối (GPU thật, n=10 mỗi bên, xen kẽ, mã cuối)

`perf-check.cjs` (quy tắc: |Δ trung vị| ≥ IQR của baseline **và** Mann-Whitney p < 0,05, n ≥ 10): **ĐẠT ở cả ×1 và ×4**, 0 lượt lỗi ở cả hai bên.

| Chỉ số | ×1 p4 → p5 | ×4 p4 → p5 |
|---|---|---|
| `gateReady` trong trang (ms) | 401 → 402 (nhiễu) | 2.548 → 2.507 (nhiễu) |
| FPS mở đầu | 59,6 → 59,6 | 50,0 → 52,6 (nhiễu) |
| CPU bận mở đầu | 33,1% → 27,1% (**−18%, thật**) | 79 → 79 (nhiễu) |
| FPS trang chủ | 58,4 → 58,6 | 45,9 → 45,1 (nhiễu) |
| **Vào bản đồ → màn che mở (ms)** | 1.310 → 1.364 (nhiễu) | **13.933 → 9.481 (−32%, thật)** |
| **Vào bản đồ → màn che gỡ (ms)** | 1.805 → 1.807 (nhiễu) | **14.412 → 9.907 (−31%, thật)** |
| Khung dài nhất khi vào bản đồ (ms) | 311 → 304 | 1.733 → 1.776 (nhiễu) |
| FPS kéo / zoom / xoay / 2D-3D | 58,4/55,9/58,0/58,5 → 57,8/55,7/58,3/58,6 | 50,4/46,6/29,2/31,2 → 48,6/46,8/31,7/36,0 (nhiễu) |
| FPS bay tới Huế | 48,2 → 49,1 | 31,3 → 38,3 (+22%, **trong nhiễu**) |

Chỉ số không chặn, nên ghi: `firstGroundFrame` ×4 3,7 → 7,1 s (**hồi quy thật**, nhưng khung đó nằm dưới màn che và đã được chuyển thành chỉ số không chặn ở GĐ2 theo quyết định của bạn; người dùng nhìn thấy mốc "màn che mở/gỡ", cả hai đều cải thiện).

Số ×4 tuyệt đối dao động theo phiên: lần chạy cuối cho p4 13,9 s và lần chạy trước (trước khi sửa scheduler) cho p4 17,1 s với cùng mã. Kết luận dựa trên so sánh xen kẽ cùng phiên, không dựa trên số tuyệt đối giữa các phiên.

**So với mục tiêu đề xuất (GĐ0 mục 10, chưa được bạn khóa):**

| Mục tiêu đề xuất | Kết quả cuối |
|---|---|
| Vào bản đồ ×4, màn che mở ≤ 6 s | **chưa đạt** (9,5 s; từ 13,9 s). Đã cải thiện thật nhưng chưa tới mục tiêu. |
| LoAF lớn nhất khi vào bản đồ ×4 ≤ 0,6 s | **chưa đạt** (1,78 s, không đổi) |
| Kéo ≥ 55, xoay ≥ 45, 2D/3D ≥ 45, bay ≥ 45 (×4) | **chưa đạt**, không đổi so với baseline (GĐ4: nhóm A không với tới) |
| Hồi quy tối đa = IQR gộp ở mọi luồng | **đạt** |

Ba hàng đầu là mục tiêu *đề xuất* ở GĐ0, chưa từng được duyệt thành tiêu chí; chúng không chặn nghiệm thu theo mục 9, nhưng bạn cần biết chúng chưa đạt.

## 6. Mạng và các mức suy giảm

**Mạng giả lập, tải đến cổng, cache tắt, p4 so với p5 xen kẽ:**

| | p4 | p5 |
|---|---|---|
| Fast 4G, `gateReady` (n=5) | 5.236 ms [5.201–5.842] | **3.812 ms [3.236–3.928]** (−27%) |
| Slow 4G, `gateReady` (n=3) | 29.781 ms [28.961–31.066] | **20.815 ms [17.669–21.392]** (−30%) |
| Byte truyền đến cổng | 13,53 MiB | **9,60 MiB** (−3,9 MiB) |
| FCP Fast 4G | 900 ms | 956 ms (khoảng giá trị chồng nhau) |

**Mức suy giảm, n=3 mỗi ô, chỉ để định hướng** (`degraded-gd6.sh`, so với GĐ0 trên preview-4; các ô WebGL tắt ×1 đã được thay bằng phép A/B ở mục 2 sau khi phát hiện hồi quy):

| | p4 → p5 (trung vị) |
|---|---|
| SwiftShader ×1: mở đầu / trang chủ FPS, vào bản đồ | 6,5→7,5 / 5,5→5,6, 14,7→15,4 s |
| SwiftShader ×4 | 7,3→8,1 / 5,5→5,7, 34,4→22,1 s |
| WebGL tắt ×4 | 2,3→2,5 / 0,6→0,6, 36,2→34,0 s |

Ở WebGL tắt ×4, thời gian vào bản đồ của p5 dao động rất lớn (28–96 s trong 3 lượt) nên ô này không dùng để kết luận. Ở các mức không có GPU thật, trang chủ vẫn chỉ 0,6–5,7 FPS (như GĐ0 mục 10.3): nhóm A không thể kéo mức đó lên mượt.

## 7. Việc còn lại và giới hạn

**Của bạn trước buổi trình chiếu:**
1. Mở `chrome://gpu` trên máy lớp học để biết có tăng tốc phần cứng không. Nếu không có, kỳ vọng theo mục 6: trang chủ chỉ vài FPS, và quyết định về phương án dự phòng nhóm B (GĐ0 mục 10.3) vẫn đang bỏ ngỏ.
2. Chạy thử preview-5 trên ít nhất một máy khác nếu có (kế hoạch yêu cầu 2 cấu hình thật; tôi không có).
3. Cấu hình hosting: server dev không gửi header cache (GĐ0 mục 6); nếu hosting thật cũng vậy, người xem tải lại toàn bộ mỗi lần.

**Chưa làm, cần quyết định riêng:** `:has()` → class (tạm gác); nhóm B (tạm dừng raster khi camera chuyển động — GĐ4 mục 4); tìm nguyên nhân heap tăng ~100 KB mỗi lần chọn địa danh (có sẵn từ preview-4); hai ca worker lỗi vào bản đồ ~32 s.

**Giới hạn của phép đo:** một máy, Chrome headless, CPU giả lập (×4 không phải máy chậm 4×); không đo RAM bị ép (nhưng có lúc máy thiếu RAM tự nhiên và số đo lệch rõ); mạng Slow 4G chỉ n=3; mức suy giảm n=3; mọi A/B hiệu năng GPU thật n=10; số tuyệt đối thay đổi theo phiên.

## 8. Đường lui

- Hoàn tác riêng GĐ6: chép `tools/perf/results/gd6/raster-scheduler-5-before-gd6.js` đè lên `assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js` và đổi lại `?v=20261104-gd6-hold-2` thành `?v=20261103-gd2-hold-1` trong `map-surroundings-preview-5.html`. (Chú ý: bản này tái hiện hồi quy WebGL tắt ở mục 2.)
- Hoàn tác cả GĐ2: dùng lại `raster-scheduler-4.js` trong thẻ script (một dòng).
- Hoàn tác GĐ4: `tools/perf/results/gd4-map/preview-5-before-gd4.html`.
- Chưa có commit nào; mọi thay đổi còn ở working tree.

## 9. Tệp mới và cách chạy lại (GĐ6)

`tools/perf/`: `ab-cards.cjs`, `ab-cards-flow.sh`, `verify-gd6-functional.cjs`, `verify-gd6-leak.cjs`, `probe-gd6-usable.cjs`, `pair-stats.cjs`, `degraded-gd6.sh`, `ab-nowebgl-gd6.sh`, `ab-nowebgl-sched.sh`, `ab-gpu-sched.sh`, `net-gd6.sh`. Kết quả: `tools/perf/results/gd6/` (`ab-p{4,5}-x{1,4}.jsonl`, `perfcheck-x{1,4}.md`, `functional.json`, `leak.json`, `fallback-p5.json`, `deg-*.jsonl`, `nw*.jsonl`, `net-*.jsonl`; `prefix/` là lượt A/B trước khi sửa scheduler).
Chạy lại cổng: `node tools/perf/server.cjs` rồi `bash tools/perf/ab-batch.sh 10 tools/perf/results/gd6 "1 4"` và `node tools/perf/perf-check.cjs <p4.jsonl> <p5.jsonl>`.

## 10. Ghép thiết kế thẻ bài vào preview-5 (theo `card-testing.html`)

**Cách làm.** Bản chạy thật của thiết kế là `conversation-cards-3.css/.js` + markup/hook trong preview-3. So preview-3 với preview-4 có 40 hunk; 33 hunk là thẻ bài (markup bộ bài, hai mặt, dấu sen, `GoiVietConversationCards.*` trong các hàm rút/lật/mở, và vài câu chữ), 7 hunk là tối ưu của preview-4 (scheduler/terrain/landscape/journey, cờ body, bộ nhớ đệm danh sách, renderer). Tôi áp **đúng 33 hunk thẻ bài** lên preview-5 bằng script (mỗi hunk được kiểm là khớp từng dòng với preview-4 trước khi thay), giữ nguyên 7 hunk còn lại và mọi thay đổi GĐ1–GĐ6.
- Tài nguyên mới: `conversation-cards-5.css`, `conversation-cards-5.js` (bản sao, chỉ đổi dòng chú thích đầu; file `-3` của preview-3 không đổi). Thẻ nạp bằng 2 dòng trong preview-5 với `?v=20261104-gd6-cards-1`.
- Dữ liệu địa danh, câu hỏi, hoạt động, ghi kỷ niệm: không đổi (chỉ markup và hook).

**Kiểm tra.**
- Bộ kiểm thử thẻ bài sẵn có của preview-3, chạy trên preview-5 (`tools/verify-preview5-conversation-cards.cjs`): **đạt** — 6 kích thước (1440→320), hover xòe quạt, chọn bằng bàn phím, hai mặt song song, dấu sen khóa/mở phần gắn kết, hoạt ảnh gom–xáo–chọn–rút, khóa bấm liên tiếp, hủy khi đóng giữa chừng, một vòng chơi đầy đủ gồm bốn lá rồi chơi lại.
- Chức năng preview-3 so với preview-5 (`verify-gd6-functional.cjs`, cùng kịch bản mục 3): **không có khác biệt, 0 lỗi** (gồm rút bài, lật, lưu kỷ niệm, Escape đóng bộ bài, bẫy focus).
- Hình ảnh preview-3 so với preview-5: **18/21 ảnh giống từng pixel** (deck, sealed, opened ở 6 kích thước, hover). 3 ảnh còn lại (`shuffle`, `picked`, `dark`) chụp giữa lúc hoạt ảnh/hiện dần 0,28 s dưới đồng hồ giả nên không so xác định được: chạy preview-3 hai lần cũng lệch nhau ở `dark` (6,7%) và `shuffle` (76%), và ở `picked` có lần modal hiện, có lần chưa. Kiểm DOM tại thời điểm đó: modal đúng trạng thái `open` và đạt `opacity: 1` sau khi chờ.

**Đo riêng luồng thẻ, preview-5 trước và sau khi ghép** (`ab-cards.cjs`, n=10, xen kẽ, trung vị [IQR]):

| | ×1 trước → sau | ×4 trước → sau |
|---|---|---|
| Mở modal bộ bài (xử lý đồng bộ) | 21 → **59 ms** [53–66] | 94 → **209 ms** [141–258] |
| — trong đó layout | 9 → 46 ms | 41 → 152 ms |
| Từ bấm rút đến có lá bài | 0,61 → **3,05 s** | 0,82 → 3,2 s |
| FPS trong lúc rút | 57,1 → 54,6 | 48,1 → 49,0 |
| Khung >50 ms khi rút | 0 → **4** | 1,5 → **5,5** |
| Khung dài nhất khi rút | 50 → 116 ms | 217 → 300 ms |
| Lật/mở phần gắn kết (xử lý đồng bộ) | 50 → **32 ms** | 183 → **66 ms** |
| Khung dài nhất khi lật | 50 → 33 ms | 233 → 92 ms |
| Heap JS | 31,2 → 30,6 MB | 32,0 → 33,8 MB |

Đọc đúng ý nghĩa: (1) thời gian rút dài hơn là **do thiết kế** (chuỗi gom–xáo–chọn–rút 2,85 s thay cho một cú rút 0,52 s), không phải lỗi. (2) Mở modal nặng hơn ~38 ms ở ×1 vì markup và bộ bài được dựng bằng JS (phần lớn là layout); (3) khi rút có 4–6 khung rớt >50 ms mà bản cũ gần như không có. Chưa xác định chúng nằm ở đầu hay cuối chuỗi; đây là chỗ có thể tối ưu thêm. (4) Phần lật/mở phần gắn kết thì nhẹ hơn bản cũ.

**Cổng toàn luồng sau khi ghép** (`ab-cards-flow.sh`, preview-5 trước/sau ghép thẻ, n=10 mỗi bên, GPU thật, xen kẽ): **ĐẠT ở ×1 và ×4**, 0 lượt lỗi, mọi chỉ số (cổng, mở đầu, trang chủ, vào bản đồ, kéo/zoom/xoay/2D-3D/bay) trong biên nhiễu. Ghép thẻ không làm tải trước cổng hay vào bản đồ chậm đi.

**Chưa kiểm sau khi ghép:** ma trận dự phòng 14 kịch bản không chạy lại (không có bộ bài trong ma trận; chỉ file `.css/.js` mới thêm 24 KB đã được chứng minh mở được qua `file://` bởi bộ kiểm thử thẻ bài); không đo thẻ bài ở mức suy giảm (SwiftShader/WebGL tắt); nguyên nhân các khung rớt khi rút chưa điều tra.

**Đường lui thẻ bài:** chép `tools/perf/results/gd6/preview-5-before-cards.html` đè lên `map-surroundings-preview-5.html` (khôi phục cả hai dòng nạp, hook và markup; hai file `conversation-cards-5.*` khi đó không còn được dùng và có thể xóa).

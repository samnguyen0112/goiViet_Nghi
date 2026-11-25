# Kế hoạch rà soát chuyên sâu preview-5 (audit)

> Ngày lập: 19/11/2026 · Người thực hiện: Codex · Trạng thái: **chờ thực hiện**
> Trang mục tiêu: `map-surroundings-preview-5.html`
> Tính chất: **chỉ rà soát, đo và đề xuất.** Không sửa, không xoá bất kỳ tệp nào của dự án. Mọi thay đổi chỉ làm sau khi chủ dự án duyệt từng mục.

---

## 0. Quy tắc bắt buộc (đọc trước khi làm bất cứ việc gì)

1. **Không sửa gì của dự án.** Không sửa, định dạng lại, đổi tên, di chuyển hay xoá tệp có sẵn, kể cả khi thấy lỗi hiển nhiên. Lỗi chỉ được ghi vào báo cáo.
2. **Git chỉ được đọc.** Được dùng `git status`, `git log`, `git diff`, `git show`, `git ls-files`, `git grep`, `git blame`. Không `add`, `commit`, `stash`, `checkout`, `switch`, `reset`, `restore`, `clean`, `rm`, `push`.
3. **Cây làm việc đang có thay đổi chưa commit**: thẻ bài, `card-covers-5.*`, `assets/goi-viet/card-covers-5/`, `arrival-demo-5/*`, font mới trong `assets/fonts/heritage/`, `offline-manifest-5.js`, các `tools/check-*`. Hãy rà soát **đúng trạng thái hiện tại** này và không làm mất nó.
4. **Chỉ được tạo tệp mới ở các nơi sau:**
   - `docs/06-ra-soat-chuyen-sau/`: các báo cáo (mục 9).
   - `verification/audit-06/`: ảnh chụp, log console/network.
   - `tools/perf/results/audit-06/`: số đo hiệu năng (JSONL, trace).
   - `scratch/audit-06/`: script đo hoặc kiểm tạm. Không thêm script vào `tools/`.

   Ba thư mục sau cùng đã bị `.gitignore` bỏ qua.
5. **Không bịa số.** Mỗi phát hiện phải ghi rõ trạng thái: `đã tái hiện`, `đã đo` hay `suy luận từ mã`. Nếu môi trường không chạy được trình duyệt, GPU hay một công cụ nào đó, ghi rõ trong báo cáo và tiếp tục bằng cách đọc mã.
6. **Không xoá tệp, kể cả tệp chắc chắn không dùng.** Hạng mục B chỉ lập danh sách đề xuất. Việc xoá theo quy trình mục 10, sau khi có duyệt.
7. Nếu một bước buộc phải sửa mã mới làm tiếp được, **dừng bước đó**, ghi lý do và chuyển sang bước khác.

## 1. Bối cảnh cần đọc

- `AGENTS.md`: mọi thay đổi chỉ trên preview-5; giữ `index.html` và các preview cũ nguyên trạng; `card-testing.html` là tham chiếu chính thức cho thẻ trò chuyện.
- `docs/README.md` và các đợt trước: `docs/02-nang-cap-hieu-nang/` (GĐ0–GĐ6, đặc biệt `BAO-CAO-GD6-PREVIEW-5.md` mục 7), `docs/03-p5-song-ngu-va-sach/`, `docs/04-den-ga/`, `docs/05-hai-trinh-gia-dinh/`.
- **Trang vào (entry) của repo:** `index.html`, `map-surroundings-preview.html`, `map-surroundings-preview-2.html`, `-3`, `-4`, `-5`, `map-surroundings-preview-5-arrival-demo.html`, `card-testing.html`. Ngoài ra còn service worker `preview-5-offline-worker.js`, nạp `offline-manifest-5.js`.
- **Đặc điểm cần biết:**
  - Preview-5 đặt `data-preview-version="3"`, nên các module kiểm tra giá trị `'3'` cũng chạy trên preview-5.
  - Nhiều tệp hậu tố -3/-4 vẫn được preview-5 nạp.
  - HTML preview-5 nặng khoảng 1,38 MB, gồm một `<script>` nội tuyến khoảng 766 KB (TopoJSON và bộ bài 36 vùng) và vòng vẽ chính của bản đồ.
- **Việc còn mở từ GĐ6:**
  - Chưa đạt: vào bản đồ ở CPU ×4 ≤ 6 s, và FPS kéo/xoay/bay ở CPU ×4. Số cũ: bay tới ga ×4 đạt 35,5 FPS; vào bản đồ ×4 mất 11,1 s.
  - Thẻ bài: khi rút có 4 khung > 50 ms; mở modal chậm thêm 38 ms.
  - Heap tăng khoảng 100 KB mỗi lần chọn địa danh.
  - Hai ca worker lỗi làm việc vào bản đồ mất khoảng 32 s.
  - Chưa kiểm trên máy thật thứ hai.
- **Bối cảnh trình chiếu:** máy lớp học chưa rõ cấu hình. Máy có thể không có tăng tốc phần cứng (SwiftShader), có thể không có mạng, màn hình hoặc máy chiếu từ 1024×768 đến 4K. Ưu tiên desktop và màn lớn; mobile ưu tiên thấp, chỉ ghi các lỗi chặn sử dụng.

## 2. Hạng mục A: Đồ hoạ, WebGL, hiệu năng render

**A.1 Danh sách tệp thực sự được nạp.** Lập danh sách từ `<script>`/`<link>` của preview-5, đối chiếu với log network khi chạy toàn bộ luồng (gồm tệp nạp động). Danh sách này cũng dùng cho hạng mục B.

**A.2 Terrain WebGL** (`assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js`):
- Thuộc tính context (powerPreference, preserveDrawingBuffer, antialias), giới hạn `MAX_TEXTURE_SIZE`.
- Shader: fragment dùng `precision highp float`. Xét chi phí phép chiếu trong vertex shader và số uniform cập nhật mỗi lần vẽ.
- Số draw call mỗi khung; batching; số lần đổi program/texture/state.
- Tải texture: chỉ có `texImage2D`, không có `texSubImage2D`. Kiểm tra có tải lại toàn bộ khi chỉ cần một phần không; xét NPOT, mipmap, filter, và việc tải đồng bộ trên luồng chính.
- Ngân sách `TEXTURE_LIMIT` 64 MB, `MESH_LIMIT` 16 MB, `ISLAND_LIMIT` 32 MB: thuật toán loại bỏ, `deleteTexture`/`deleteBuffer` có giải phóng đủ không, tổng VRAM ước tính.
- Tam giác hoá bằng `vendor/earcut-3.0.2.js`: chạy ở đâu, mất bao lâu, có chặn luồng chính không.
- Mất/khôi phục context, cờ `?renderer=canvas`, hàm `usable()`.

**A.3 Các WebGL context khác:**
- `webgl-coverage-3.js`: context thứ hai, có stencil, antialias, `'high-performance'`.
- `assets/goi-viet/homepage-crane-flight-3.js`: context `'low-power'`, `preserveDrawingBuffer:!direct`.

Đếm số context sống đồng thời ở từng giai đoạn: trang chủ, vào bản đồ, trên bản đồ, quay lại trang chủ. Kiểm tra context có được giải phóng không (`loseContext`), và rủi ro khi trộn `'low-power'` với `'high-performance'` trên máy hai GPU.

**A.4 Đường Canvas 2D và raster:**
- `preview-5.js` (canvas nền, sóng, nhãn, overview, coverage), `surface-cache.js`.
- `render-performance.js`: ghi đè `project3D`, culling, đơn giản hoá tường.
- `pixel-budget.js`: trần 64 M pixel, DPR tối đa 2.
- `natural/terrain-renderer-5.js`, `landscape-5.js`, `archipelago-renderer-5.js`, `regional-renderer-4.js`, `island-chart-5.js`: các vòng lặp tính từng pixel bằng `material()`/`sampleDepth()` rồi `putImageData` trên luồng chính; kích thước và giới hạn của các cache tile.
- `natural/raster-scheduler-5.js`, `raster-tasks.js`:
  - Pool worker; các hằng `BUDGET_MS=3`, `HOLD_BUDGET_MS=12` (12 ms chỉ áp dụng khi WebGL dùng được), `MAX_JOBS`, `MAX_READY_BYTES`.
  - Độ dài thực của một lát việc: một tác vụ đang chạy không ngắt được giữa chừng.
- `map-prewarm-3.js`: chuẩn bị bản đồ khi đang ở trang chủ, màn che, `SAFETY_MS` 30 s.
- Nhãn: `arrival-demo-5/label-performance-arrival-5.js`, `province-legibility-5.js`.
- `journey-vehicles.js`, `family-voyage-5.js` (canvas 1800×1200).

**A.5 Trang chủ 2D:** `homepage-layered-renderer-5.js` (`ctx.filter` blur, ImageData, atmosphere), `memory-train-smoke-v6.js`, `memory-train-wheels-v7.js`, `homepage-transport-3/transport.js`.

**A.6 Hiệu ứng DOM/CSS:** `conversation-cards-5.*`, `card-covers-5.*` (bộ bài xoè, gom–xáo–chọn–rút), fortune ritual, các CSS `homepage-*`, `legibility-5.css`. Tìm các vấn đề sau:
- Animate thuộc tính gây layout hoặc paint: top/left/width/box-shadow/filter.
- `will-change` dư thừa, quá nhiều compositing layer, `backdrop-filter`.
- `:has()` gây style recalc.
- Layout thrashing: JS đọc rồi ghi kích thước xen kẽ.

**A.7 Tài nguyên đồ hoạ:** ảnh và font mới (`assets/fonts/heritage/*.woff`, `assets/goi-viet/card-covers-5/`): kích thước, định dạng, thời điểm tải, chi phí decode ảnh lớn.

**A.8 Câu hỏi trọng tâm:**
- Vòng đời một khung hình khi kéo/xoay/bay: phần nào chạy trên GPU, phần nào vẫn vẽ lại bằng Canvas 2D mỗi khung, mỗi phần mất bao nhiêu ms.
- Nút cổ chai **thật**, xác định bằng trace chứ không đoán, của hai mục tiêu chưa đạt và của thẻ bài.
- Rò rỉ heap và VRAM khi vào/ra bản đồ nhiều lần, chọn nhiều địa danh, rút nhiều lượt bài.
- Hành vi ở từng mức máy: GPU thật, SwiftShader, tắt WebGL, CPU ×4, ở các độ phân giải 1080p, 1440p, 4K.

## 3. Hạng mục B: Kiểm kê tệp cũ (-2, -3, -4, không hậu tố, v2…v9) và đề xuất dọn

Mục tiêu: biết chính xác tệp nào còn được dùng, ở đâu dùng, tệp nào có thể xoá. **Không xoá ở bước này.**

**B.1 Phạm vi kiểm kê:**
- Toàn bộ `assets/` (js, css, mjs, json, ảnh, font, âm thanh) và `image/`.
- Tệp ở thư mục gốc.
- Các thư mục phiên bản tham chiếu, ví dụ `homepage-reference-v8/`, `v9/`, `memory-reference-v5/`, `memory-native-v4/`, `memory-rail-v6/`, `homepage-*-3/`.

**B.2 Lập đồ thị tham chiếu:**
- Gốc gồm: 8 trang vào ở mục 1, `preview-5-offline-worker.js`, `offline-manifest-5.js`, `tools/build-preview-5-offline.py`, các script trong `tools/`.
- Các dạng tham chiếu cần dò: `src`/`href`, CSS `url()`, `srcset`, `importScripts`, `import`, `fetch`, `new Worker`, `new Image().src`, JSON manifest, đường dẫn ghép chuỗi (ví dụ `'...-' + n + '.js'`), đường dẫn nằm trong khối `<script>` nội tuyến của HTML.
- Tính tập tệp **đến được** từ mỗi gốc, kể cả gián tiếp: tệp A chỉ được tham chiếu từ tệp B, mà B không ai dùng, thì A cũng không ai dùng.
- Đối chiếu với log network thực tế khi chạy các trang vào, để bắt tham chiếu động mà phân tích tĩnh bỏ sót.

**B.3 Phân loại mỗi tệp vào đúng một nhóm:**

| Nhóm | Định nghĩa | Hướng xử lý |
|---|---|---|
| 1 | preview-5 dùng (trực tiếp, gián tiếp, hoặc qua offline manifest) | Giữ |
| 2 | Chỉ trang khác dùng: `index.html`, preview, -2, -3, -4, arrival-demo, `card-testing.html` | **Giữ** theo `AGENTS.md` |
| 3 | Chỉ công cụ trong `tools/` dùng (kiểm thử, build, đo) | Giữ; ghi công cụ nào dùng |
| 4 | Chỉ tài liệu `docs/` nhắc tới | Ứng viên xoá; ghi liên kết tài liệu sẽ bị gãy |
| 5 | Không ai tham chiếu | **Ứng viên xoá** |
| 6 | Không chắc chắn: có thể là tham chiếu động, dữ liệu nguồn, ảnh gốc để dựng lại | Giữ; ghi lý do nghi ngờ |

**B.4 Kiểm tra thêm:**
- Các tệp chỉ khác nhau vài dòng giữa các bản -3/-4/-5 (trùng lặp mã), và dung lượng lặp lại.
- Tham số `?v=` của cùng một tệp có khác nhau giữa các trang không.
- `offline-manifest-5.js` có liệt kê đủ mọi tệp preview-5 thực sự tải không, và có liệt kê thừa tệp không dùng không.
- Tệp được tham chiếu nhưng không tồn tại (404).
- Thư mục bị `.gitignore` (`scratch/`, `verification/`, `exports/`, `tools/perf/results/`): **chỉ báo dung lượng**, không đưa vào đề xuất xoá của đợt này.

**B.5 Đầu ra:**
- `kiem-ke-tep.csv`, một dòng mỗi tệp, với các cột: đường dẫn, dung lượng, có trong git không, nhóm, được dùng bởi (danh sách), lần commit cuối, ghi chú.
- `DE-XUAT-XOA.md`: chỉ nhóm 4 và 5, gom theo thư mục, có tổng dung lượng, bằng chứng không dùng, và rủi ro. Kèm sẵn lệnh `git rm` cho từng nhóm **nhưng không chạy**.

## 4. Hạng mục C: Lỗi giao diện

**C.1 Ma trận kiểm tra:**
- Độ phân giải: 1024×768, 1280×720, 1280×800, 1366×768, 1536×864, 1920×1080, 2560×1440, 3840×2160.
- DPR 1 / 1,25 / 1,5 / 2; zoom trình duyệt 90 / 110 / 125 / 150%.
- Trình duyệt: Chrome và Edge là chính, Firefox phụ.
- Tablet 1024×768 và 768×1024 là phụ; mobile chỉ ghi lỗi chặn sử dụng.
- Mỗi tổ hợp kiểm cả **tiếng Việt và tiếng Anh**, và cả hai theme sáng/tối nếu có.

**C.2 Các màn hình và trạng thái cần chụp và soát:**
- Trang chủ, hoạt cảnh mở đầu, thư mời, cổng.
- Bản đồ ở mức tổng quan và khi zoom sâu; quần đảo Hoàng Sa và Trường Sa.
- Bảng ga và luồng "đến ga".
- Bộ thẻ trò chuyện: xoè, gom, xáo, chọn, rút, lật, mặt câu hỏi, mặt gắn kết, dấu sen.
- Ghi kỷ niệm; bưu thiếp và bưu thiếp cộng đồng; bưu điện biển đảo; Hải trình gia đình.
- Trình đọc sách (HCM, HN, Huế, Thanh Hóa) và trạng thái "sắp ra mắt" kèm liên kết fanpage.
- Fortune ritual, bảng cài đặt, chế độ ngoại tuyến, âm nhạc, thanh lệnh, nhật ký.

**C.3 Lỗi cần tìm:**
- Chữ tràn, bị cắt, xuống dòng xấu; chuỗi tiếng Anh dài hơn làm vỡ bố cục.
- Font thiếu glyph tiếng Việt: kiểm tra subset của các woff mới (Oswald, Barlow Semi Condensed, Dancing Script); fallback; FOUT/FOIT.
- Chồng lớp sai z-index; modal vượt chiều cao 768; cuộn bị khoá hoặc cuộn kép.
- Ảnh vỡ, sai tỉ lệ, mờ ở 4K; icon lệch; trạng thái hover/focus/active thiếu; con trỏ sai.
- Lệch so với tham chiếu `card-testing.html`: màu đỏ son, viền vàng, độ xoè, hai mặt song song, dấu sen.
- Thiếu nhất quán giữa các màn: màu, khoảng cách, cỡ chữ, nút.
- Tôn trọng `prefers-reduced-motion`.

## 5. Hạng mục D: Lỗi chức năng

**D.1 Chạy hết các luồng, theo cả thứ tự bình thường lẫn bất thường:**
- Tìm kiếm: có dấu, không dấu, chữ hoa, chuỗi rỗng, chuỗi không khớp.
- Lọc chủ đề, và lọc kết hợp tìm kiếm. GĐ6 ghi nhận cả 5 bộ lọc đều trả 36 thẻ; cần đánh giá đây là lỗi hay chủ ý.
- Chọn địa danh bằng click và bằng bàn phím.
- Bảng ga và hai chế độ tại ga (trò chơi / sách văn hoá).
- Thẻ bài: rút, lật, xáo lại; rút liên tục nhiều lượt.
- Ghi kỷ niệm: lưu, sửa, xoá, lưu rỗng.
- Bưu thiếp: tạo, xuất PNG, tải xuống.
- Bưu điện biển đảo, Hải trình gia đình, fortune ritual.
- Trình đọc sách: lật trang, đổi ngôn ngữ trong khi đọc.
- Âm nhạc: chọn tệp, nghe thử, âm lượng, xoá.
- Cài đặt; bật chế độ ngoại tuyến rồi tải lại khi mất mạng.
- Phím tắt: R tái định tâm, Escape, Tab và bẫy focus. GĐ6 ghi nhận Escape khi không có modal không bỏ chọn địa danh.

**D.2 Tình huống biên:**
- Bấm nhanh hoặc bấm kép trong lúc đang có hoạt cảnh.
- Đổi ngôn ngữ, theme hoặc kích thước cửa sổ giữa hoạt cảnh.
- Chuyển tab rồi quay lại; vào/ra bản đồ nhiều lần.
- Mở và đóng modal liên tục; kiểm tra có bị đăng ký listener trùng không.

**D.3 Lưu trữ:**
- Dữ liệu trong localStorage (kỷ niệm, cài đặt, ngôn ngữ) có còn sau khi tải lại không.
- Hành vi khi localStorage bị chặn, bị đầy, hoặc chứa JSON hỏng.

**D.4 Môi trường:**
- Mở bằng `file://`; không có mạng; chặn ảnh ngoài; mạng chậm (Fast/Slow 4G).
- Worker lỗi; mất WebGL; WebGL tắt hẳn.

**D.5 Dữ liệu:**
- Đủ 34 tỉnh thành và 2 quần đảo, tức 36 bộ bài; mỗi bộ có câu hỏi và hoạt động.
- Mọi chuỗi giao diện có bản tiếng Anh: chạy `tools/check-i18n-5.cjs` và soát tay, tìm chuỗi tiếng Việt còn sót ở chế độ EN và ngược lại.
- Liên kết ngoài (fanpage, nguồn ảnh) còn sống.
- Ảnh ga đầy đủ.

**D.6** Ghi mọi lỗi console, cảnh báo, unhandled rejection và request lỗi trong suốt các luồng.

**D.7** Với mỗi lỗi, xác định lỗi **có sẵn từ preview-4** hay **mới xuất hiện ở preview-5**, bằng cách chạy cùng bước trên preview-4 nếu luồng đó có ở preview-4.

## 6. Hạng mục E: Độ bền mã, bảo mật, khả năng tiếp cận, phụ thuộc ngoài

- **Bảo mật:** dữ liệu người dùng nhập (ghi chú kỷ niệm, tên, bưu thiếp) có được đưa vào `innerHTML` không, tức có nguy cơ XSS không. `JSON.parse` dữ liệu lưu có được bọc lỗi không.
- **Kiến trúc:**
  - Phụ thuộc thứ tự nạp script; xung đột namespace `window.GoiViet*`.
  - Các chỗ monkey-patch, ví dụ `render-performance.js` ghi đè `project3D`, dễ vỡ ra sao.
  - Cờ `data-preview-version="3"` dùng chung cho preview-3 và preview-5: module nào bị bật hoặc tắt theo cờ này.
- **Mã chết** trong các tệp preview-5 có nạp: nhánh chỉ dành cho preview-2/3, hàm không bao giờ được gọi, CSS không khớp phần tử nào (dùng Coverage của DevTools).
- **Khả năng tiếp cận:** điều hướng bàn phím, `aria-*`, độ tương phản, thứ tự focus, thuộc tính `lang` có được cập nhật khi đổi ngôn ngữ không, văn bản thay thế cho ảnh.
- **Phụ thuộc ngoài:** ảnh hotlink (Wikimedia…), CDN, font từ xa. Cái gì sẽ hỏng nếu máy lớp học không có mạng.
- **Giấy phép:** font OFL, `THREE-LICENSE.txt`, earcut, ghi nguồn ảnh.
- **Trọng lượng tải:** tổng dung lượng truyền, chi phí parse khối nội tuyến 766 KB, tài nguyên tải nhưng không dùng.

## 7. Công cụ có sẵn

Đọc phần đầu mỗi tệp để biết cách chạy. **Không sửa các công cụ này.**

- **Server tĩnh:** `node tools/perf/server.cjs` (cổng 8770, có gzip; `NOGZIP=1` để tắt).
- **Hiệu năng** (`tools/perf/`):
  - `perf-check.cjs`: cổng so baseline với candidate.
  - Trace và profile: `trace.cjs`, `trace-forced.cjs`, `profile-interaction.cjs`, `profile-labels.cjs`, `profile-enter.cjs`, `profile-home.cjs`.
  - Dự phòng và rò rỉ: `fallback.cjs`, `verify-gd6-leak.cjs`, `verify-gd6-functional.cjs`.
  - So A/B và môi trường suy giảm: `ab-nowebgl-*.sh`, `degraded-*.sh`, `net-*.sh`, `ab-cards.cjs`.
  - Khác: `inventory.cjs`, `visual-states.cjs`.
- **Kiểm tra preview-5** (`tools/`): `check-arrival-demo-5.cjs`, `check-books-5.cjs`, `check-family-voyage-5.cjs`, `check-i18n-5.cjs`, `check-memory-v5.cjs`, `check-station-panel-5.cjs`, `check-station-photos-5.cjs`, `verify-preview5-conversation-cards.cjs`. Chạy tất cả và ghi kết quả đạt/không đạt làm nền.
- **Quy tắc nhiễu khi so hiệu năng:** một thay đổi chỉ được coi là thật khi |Δ trung vị| ≥ IQR baseline, Mann-Whitney p < 0,05 và n ≥ 10 mỗi bên.
- **Chỉ số nên đo thêm:** số draw call mỗi khung; số texture và VRAM ước tính; số WebGL context; tổng pixel của mọi canvas so với trần 64 M; Long Animation Frames kèm script gây ra; forced layout và style recalc.

## 8. Thứ tự thực hiện và điểm dừng

1. Đọc mục 0–1, `git status`, các báo cáo đợt trước.
2. Chạy các kiểm tra có sẵn ở mục 7 để có nền.
3. A.1 (danh sách tệp được nạp), sau đó B.1–B.2 (đồ thị tham chiếu). Hai bước này làm nền cho các hạng mục khác.
4. Hạng mục A → viết `BAO-CAO-A-DO-HOA-WEBGL.md`.
5. Hạng mục C → viết `BAO-CAO-C-GIAO-DIEN.md`.
6. Hạng mục D → viết `BAO-CAO-D-CHUC-NANG.md`.
7. Hạng mục E → viết `BAO-CAO-E-DO-BEN-MA.md`.
8. Hạng mục B (phân loại, đề xuất xoá) → viết `BAO-CAO-B-KIEM-KE-TEP.md`, `kiem-ke-tep.csv`, `DE-XUAT-XOA.md`.
9. Viết `BAO-CAO-TONG-HOP.md`.

**Điểm dừng:** viết xong báo cáo của hạng mục nào thì lưu ngay, trước khi sang hạng mục tiếp theo, để không mất kết quả nếu phiên bị ngắt.

## 9. Định dạng báo cáo

Tất cả báo cáo viết bằng tiếng Việt, đặt trong `docs/06-ra-soat-chuyen-sau/`. Liên kết tới tệp dự án thêm `../../` ở đầu.

**Mỗi phát hiện có mã riêng** (A-01, B-01, C-01, …) và các trường:

| Trường | Nội dung |
|---|---|
| Mức độ | **Nghiêm trọng**: chặn trình chiếu, mất dữ liệu, sập trang. **Cao**: chức năng chính sai hoặc hiệu năng tệ rõ. **Trung bình**: sai nhưng có cách đi vòng. **Thấp**: thẩm mỹ nhỏ. **Ghi chú**: không phải lỗi |
| Vị trí | `tệp:dòng` |
| Mô tả | Một hai câu |
| Tái hiện | Các bước, môi trường (độ phân giải, ngôn ngữ, trình duyệt, mức máy) |
| Mong đợi / Thực tế | |
| Bằng chứng | Ảnh hoặc log trong `verification/audit-06/`, số đo, trích mã ngắn |
| Trạng thái | `đã tái hiện` / `đã đo` / `suy luận từ mã` |
| Nguồn gốc | Có sẵn từ preview-4 / mới ở preview-5 / không xác định |
| Đề xuất sửa | Hướng sửa cụ thể; **không sửa** |
| Rủi ro khi sửa | Hình ảnh, chức năng, đường dự phòng, các preview khác |
| Cách kiểm sau sửa | Lệnh hoặc bước để xác nhận |

**`BAO-CAO-TONG-HOP.md` gồm:**
1. Tóm tắt một trang.
2. Bảng đếm phát hiện theo hạng mục và mức độ.
3. **Top 10 việc nên làm trước buổi trình chiếu.**
4. Đề xuất chia ba nhóm: sửa nhỏ, ít rủi ro; thay đổi lớn, cần thử A/B; không nên làm, kèm lý do.
5. Checklist kiểm tra nhanh trên máy lớp học: `chrome://gpu`, cờ `?renderer=canvas`, chế độ ngoại tuyến, độ phân giải máy chiếu.
6. Những gì chưa kiểm được và vì sao.

**Ràng buộc cho mọi đề xuất:**
- Giữ nguyên dữ liệu địa danh, câu hỏi, hoạt động, chức năng ghi kỷ niệm, và giao diện thẻ theo `card-testing.html`.
- Giữ các đường dự phòng: `file://`, xuất PNG, worker lỗi, mất/khôi phục WebGL, WebGL tắt.
- Không đổi `index.html` hay các preview cũ.

## 10. Sau rà soát: quy trình xoá tệp (chỉ chạy khi chủ dự án đã duyệt)

Codex **không** thực hiện mục này trong đợt rà soát. Khi chủ dự án đã duyệt `DE-XUAT-XOA.md`, duyệt theo từng nhóm hoặc từng tệp, mới làm như sau:

1. Tạo nhánh riêng từ nhánh hiện tại, sau khi các thay đổi chưa commit đã được chủ dự án commit hoặc cất.
2. Chỉ xoá các tệp đã được duyệt, bằng `git rm`, để có thể khôi phục từ lịch sử git. Không xoá tệp ngoài git.
3. Trước và sau khi xoá, mở cả 8 trang vào và service worker preview-5. So sánh log network (0 request 404 mới), log console (0 lỗi mới) và các kiểm tra ở mục 7 (kết quả không đổi).
4. Gom vào một commit riêng, liệt kê tệp và tổng dung lượng giải phóng. Không push.

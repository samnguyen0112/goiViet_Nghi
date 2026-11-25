# Đồ hoạ và WebGL của preview-5 · Lượt 2/4

Ở Intel Arc, CPU ×4, mở bản đồ mất trung vị **15,26 giây** so với mục tiêu 6 giây; kéo **37,65 FPS**, xoay **24,47 FPS**, bay riêng tới Huế **20,49 FPS** (n=10). Trên SwiftShader ở 4K, xoay còn **1,65 FPS** (n=3). Khi rút lá ở CPU ×1, chi phí bố cục của phiếu ga phía sau xuất hiện trong đường gọi chốt lá. Các kết quả sau GC và phép lặp lại cùng 24 địa danh ở phần 3.

## 1. Canvas và vòng đời khung hình

Preview-5, tiếng Việt, Chrome 157.0.8103.79, Intel Arc/D3D11, 1920×1080 CSS px, DPR 1. Cùng một trang đi từ trang chủ qua Miền ký ức, vào bản đồ rồi mở lại trang chủ. Dùng lại [danh sách nạp của Lượt 1](tep-duoc-nap-preview-5.csv).

| Pha | Canvas trong DOM | Canvas đã lấy context còn quan sát được¹ | WebGL còn sống | Tổng pixel của tập đã lấy context¹ |
|---|---:|---:|---:|---:|---:|
| Trang chủ | 18 | 51 | 2 | 14,212,288 |
| Đang vào | 19 | 150 | 3 | 14,886,168 |
| Bản đồ | 19 | 1197 | 3 | 52,363,797 |
| Về trang chủ | 19 | 1216 | 3 | 54,865,548 |

¹ Tính theo backing store và tham chiếu yếu trong luồng chính, kể cả canvas rời DOM chưa được GC. Số pixel này không quy đổi trực tiếp thành RAM/VRAM. Bảng dưới dùng kích thước thật ở từng pha. Các canvas tạo tạm, cache rời DOM và vị trí gọi getContext của từng instance nằm trong [ảnh chụp trạng thái JSON](../../tools/perf/results/audit-06/inventory-real-1920-1.json).

| Canvas DOM (id hoặc lớp) | Context | Trang chủ | Đang vào | Bản đồ | Về trang chủ |
|---|---|---|---|---|---|
| homeSceneCanvas | 2d | 1920×1189 | 1920×1189 | 1920×1189 | 1920×1189 |
| gv-home-scene-overlay | webgl | 1920×1189 | 1920×1189 | 1×1 | 1920×1189 |
| memorySeamCanvas | chưa lấy | 300×150 | 300×150 | 300×150 | 300×150 |
| n7-coach-wheels | 2d | 331×504, 344×504, 365×504, 491×504 | 331×504, 344×504, 365×504, 491×504 | 331×504, 344×504, 365×504, 491×504 | 331×504, 344×504, 365×504, 491×504 |
| n7-native-wheels | 2d | 2102×504 | 2102×504 | 2102×504 | 2102×504 |
| n6-smoke | 2d | 1800×892 | 1800×892 | 1800×892 | 1800×892 |
| regionalCoverageCanvas | 2d | 300×150 | 300×150 | 1920×1080 | 1920×1080 |
| regionalOverviewCanvas | 2d | 300×150 | 300×150 | 2440×1600 | 2440×1600 |
| regionalLandSeaCanvas | 2d | 300×150 | 300×150 | 2440×1600 | 2440×1600 |
| regionalWavesCanvas | 2d | 300×150 | 300×150 | 1787×1172 | 1787×1172 |
| regionalContextLabelsCanvas | 2d | 300×150 | 300×150 | 1920×1080 | 1920×1080 |
| terrainWebGL3 | webgl | 300×150 | 300×150 | 1920×1080 | 1920×1080 |
| mainCanvas | 2d | 1920×1080 | 1920×1080 | 1920×1080 | 1920×1080 |
| journeyVehicleCanvas | 2d | 300×150 | 300×150 | 1920×1080 | 1920×1080 |
| postcardExportCanvas | chưa lấy | 1080×680 | 1080×680 | 1080×680 | 1080×680 |
| regionalCoverageGPU3 | webgl | — | 300×150 | 1920×1080 | 1920×1080 |

| Context WebGL | Nơi tạo | powerPreference | AA / depth / stencil / preserveDrawingBuffer | MAX_TEXTURE_SIZE |
|---|---|---|---|---:|
| Hạc trang chủ | homepage-crane-flight-3.js:42 | low-power | có / có / không / không | 16384 |
| terrainWebGL3 | webgl-terrain-renderer-3.js:72 | high-performance | có / có / không / không | 16384 |
| regionalCoverageGPU3 | webgl-coverage-3.js:20 | high-performance | có / không / có / không | 16384 |

Cả ba context trả về cùng Intel Arc. Context hạc tồn tại khi vào bản đồ. Hai context bản đồ vẫn tồn tại sau khi quay về trang chủ. Hàm clear của terrain/coverage thu hồi cache, giữ context để tái sử dụng. Hàm dispose của hạc có loseContext ở homepage-crane-flight-3.js:117. Tác động của hai powerPreference trên máy hai GPU chưa được đo.

**Một khung khi di chuyển camera.** Sự kiện chuột gom delta pan/rotate vào hàng đợi. animateLoop gọi renderMainScene, flushMapInput và advanceMapCamera áp delta hoặc nội suy đích bay. Lớp hành trình có thể kết thúc sớm khung. Ở nhánh bản đồ, JS xác định vùng thấy được, sắp độ sâu, chọn LOD và chuẩn bị hình học. WebGL nhận mesh/texture đã giữ lại, vertex shader chiếu điểm, fragment shader tô màu/lấy mẫu. Nền vùng, sóng, nhãn, phương tiện, hit-test và các lớp phủ đi qua JS/Canvas 2D theo trạng thái hoặc cache. Khi terrain thiếu tài nguyên, ứng dụng dùng nhánh Canvas. Chrome raster/composite các lớp. Khi có modal, trang ẩn hoặc camera đã dừng, vòng lặp chính có thể nghỉ. [Điểm vào khung hình](../../map-surroundings-preview-5.html#L8743) · [Vòng rAF](../../map-surroundings-preview-5.html#L10082).

**Đối chiếu canvas theo mã.** Danh mục vị trí tạo canvas/lấy context trong HTML và các nguồn JS thuộc CSV A.1, kể cả nhánh xuất ảnh và nhánh chưa kích hoạt, có trong [danh mục theo dòng](../../verification/audit-06/canvas-source-sites.txt). Một vị trí có thể tạo nhiều tile.

**Canvas rời DOM, nhóm theo nơi lấy context đầu tiên.** Bảng đếm từng instance còn quan sát được. PNG xuất theo thao tác và các đường khác có vị trí tạo trong danh mục nguồn.

| Nơi tạo | Context | Kích thước nhỏ nhất → lớn nhất theo diện tích | Trang chủ | Đang vào | Bản đồ | Về trang chủ |
|---|---|---|---:|---:|---:|---:|
| Image.prepare (assets/goi-viet/map-surroundings-preview/memory-train-wheels-v7.js:41:16) | 2d | 2102×504 → 2102×504 | 1 | 1 | 1 | 1 |
| Image.prepare (assets/goi-viet/map-surroundings-preview/memory-train-wheels-v7.js:41:39) | 2d | 2102×504 → 2102×504 | 1 | 1 | 1 | 1 |
| Image.prepare (assets/goi-viet/map-surroundings-preview/memory-train-wheels-v7.js:57:32) | 2d | 112×112 → 112×112 | 4 | 4 | 4 | 4 |
| Image.prepare (assets/goi-viet/map-surroundings-preview/memory-train-wheels-v7.js:73:36) | 2d | 112×112 → 112×112 | 8 | 8 | 8 | 8 |
| Object.bakeIslandTile [as bake] (assets/goi-viet/map-surroundings-preview/natural/landscape-5.js:92:25) | 2d | 152×152 → 152×152 | 0 | 0 | 21 | 21 |
| bake (assets/goi-viet/map-surroundings-preview/natural/terrain-renderer-5.js:40:124) | 2d | 4×4 → 4×4 | 4 | 24 | 5 | 5 |
| deformSprite (assets/goi-viet/homepage-layered-renderer-5.js:262:70) | 2d | 77×68 → 209×111 | 0 | 0 | 0 | 19 |
| assets/goi-viet/map-surroundings-preview/memory-train-smoke-v6.js:22:16 | 2d | 96×96 → 96×96 | 8 | 8 | 8 | 8 |
| ingest (assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js:120:11) | 2d | 76×76 → 196×196 | 0 | 17 | 1087 | 1087 |
| layerFor (assets/goi-viet/map-surroundings-preview/natural/regional-renderer-4.js:68:71) | 2d | 2440×1600 → 2440×1600 | 0 | 0 | 1 | 1 |
| prepareRevealSteps (assets/goi-viet/homepage-layered-renderer-5.js:56:95) | 2d | 480×297 → 480×297 | 1 | 1 | 1 | 1 |
| prepareRevealSteps (assets/goi-viet/homepage-layered-renderer-5.js:61:45) | 2d | 480×297 → 480×297 | 5 | 5 | 0 | 0 |
| prepareRevealSteps (assets/goi-viet/homepage-layered-renderer-5.js:66:45) | 2d | 480×297 → 480×297 | 5 | 5 | 0 | 0 |
| reefTile (assets/goi-viet/map-surroundings-preview/natural/landscape-5.js:76:248) | 2d | 100×100 → 100×100 | 0 | 0 | 2 | 2 |
| seaTile (assets/goi-viet/map-surroundings-preview/natural/landscape-5.js:67:129) | 2d | 8×8 → 8×8 | 0 | 61 | 0 | 0 |
| startBackdrop (assets/goi-viet/map-surroundings-preview/preview-5.js:319:26) | 2d | 2440×1600 → 2440×1600 | 0 | 0 | 1 | 1 |
| tile (assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-5.js:59:25) | 2d | 100×100 → 100×100 | 0 | 0 | 40 | 40 |

Cộng thêm các canvas DOM còn chưa lấy context, hợp hai tập tại bốn mốc lần lượt là 15.081.688, 15.755.568, 53.143.197 và 55.644.948 pixel, thấp hơn 67.108.864 pixel ở cả bốn mốc 1080p. Đây là ảnh chụp theo pha, chưa phải đỉnh theo thời gian.

### CPU gửi lệnh và GPU thực thi mỗi khung

Phiên chẩn đoán riêng ở CPU ×1, Intel Arc, 1080p. Bọc các draw/uniform/bind WebGL và các lệnh Canvas 2D thường gặp bên trong callback animateLoop. Mẫu bao gồm cả khung tái sử dụng nền. Cột CPU là thời gian đồng hồ JS quanh lời gọi; submit 2D có thể chỉ xếp lệnh. Phép bọc tạo overhead, các median cột tính riêng nên không cộng/trừ để suy ra thời gian GPU.

| Pha | Khung map | CPU callback ms | CPU API 2D ms | CPU API GL ms | Draw GL/khung | Uniform/khung | Bind texture/khung | useProgram/khung | Đổi enable/disable/depthMask |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Vào | 61 | 0.6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Kéo | 16 | 4.1 | 0.3 | 0.4 | 315.0 | 766.0 | 138.0 | 1.0 | 15.0 |
| Xoay | 15 | 6 | 0.5 | 0.5 | 502 | 775 | 138 | 2 | 17 |
| Đến ga | 49 | 3.1 | 0.2 | 0.2 | 194 | 476 | 80 | 1 | 9 |

Cả terrainWebGL3 và regionalCoverageGPU3 đều hỗ trợ EXT_disjoint_timer_query.

- drag, terrainWebGL3: GPU elapsed từ draw đầu đến cuối callback, trung vị 0.64 ms trên 16 kết quả query hợp lệ.
- rotate, terrainWebGL3: GPU elapsed từ draw đầu đến cuối callback, trung vị 0.62 ms trên 15 kết quả query hợp lệ.
- rotate, regionalCoverageGPU3: GPU elapsed từ draw đầu đến cuối callback, trung vị 0.50 ms trên 12 kết quả query hợp lệ.
- fly, terrainWebGL3: GPU elapsed từ draw đầu đến cuối callback, trung vị 0.54 ms trên 48 kết quả query hợp lệ.
- fly, regionalCoverageGPU3: GPU elapsed từ draw đầu đến cuối callback, trung vị 0.54 ms trên 2 kết quả query hợp lệ.

Earcut trên luồng chính: 170 lần, trung vị dưới độ phân giải đồng hồ, lớn nhất 22.80 ms, tổng 27.10 ms. Số này chỉ gồm triangulation; tạo typed array và buffer thực hiện sau đó.
texImage2D: 275 lần, trung vị thời gian gọi JS dưới độ phân giải đồng hồ, lớn nhất 14.90 ms; có cả các context WebGL trên trang.
[Lời gọi và thời gian theo từng khung](../../tools/perf/results/audit-06/diag-real-1920-1.json).

## 2. Trace và phân bố của 10 lượt

Mỗi mẫu dùng một tiến trình Chrome mới, localhost, 1920×1080, DPR 1, tiếng Việt. Bỏ qua phim mở đầu, bấm Miền ký ức rồi mở bản đồ. Đo từ sát lúc kích hoạt nút đến khi màn che đã hết cả ba lớp trạng thái và qua hai rAF. Kéo trái và xoay phải 14 bước trên mainCanvas, thêm 240 ms ở cuối; bay đo cả thao tác chọn ga Hà Nội, mở phiếu đến ga và 700 ms cuối. Camera thực sự đổi pan, yaw/pitch và đích ga. Rút ngẫu nhiên bằng nút, gồm 300 ms sau khi có lá. CPU ×4 cho bản đồ, trả về ×1 trước khi mở bộ bài. FPS là nhịp callback rAF, tính trên các khoảng nằm trọn trong pha, không phải FPS phần cứng trình chiếu. Phân vị nội suy tuyến tính theo từng phiên. Mẫu 2–11 không bật trace; mẫu 1 riêng cho chẩn đoán.

| Phép đo | n | Trung vị | Q1–Q3 | IQR |
|---|---:|---:|---:|---:|
| Vào bản đồ ×4 (s) | 10 | 15.26 | 12.87–16.71 | 3.83 |
| Kéo ×4 (FPS) | 10 | 37.65 | 31.99–42.01 | 10.02 |
| Xoay ×4 (FPS) | 10 | 24.47 | 22.69–25.82 | 3.14 |
| Chỉnh camera và mở phiếu Hà Nội ×4 (FPS) | 10 | 10.83 | 9.19–13.77 | 4.58 |
| Rút bài ×1 (số khoảng rAF >50 ms) | 10 | 3.00 | 3.00–3.75 | 0.75 |
| Rút bài ×1 (khoảng dài nhất, ms) | 10 | 166.65 | 135.45–204.12 | 68.68 |

| Pha trong trace chẩn đoán | Callback tích luỹ đáng chú ý (ms) | Tác vụ quan sát được |
|---|---|---|
| Vào bản đồ | tick raster-scheduler-5.js:123 4242, animateLoop map-surroundings-preview-5.html:10082 2627 | Worker trả tile; luồng chính nhận ImageData, vẽ coverage và dựng khung dưới màn che. |
| Kéo | animateLoop map-surroundings-preview-5.html:10082 400, tick raster-scheduler-5.js:123 23 | Chiếu/vẽ bản đồ và nhãn; drawImage, dựng hình học và đo chữ cùng chiếm mẫu CPU. |
| Xoay | animateLoop map-surroundings-preview-5.html:10082 638, tick raster-scheduler-5.js:123 23 | placeCountryLabels nổi lên khi hướng chiếu đổi; có mẫu GC và đo nhãn. |
| Bay và mở ga | animateLoop map-surroundings-preview-5.html:10082 954, (ẩn danh) heritage-frame.js:49 228 | Đọc getBoundingClientRect và measureText nằm trong đường nóng. Pha này gồm cả chuyển UI khi tới ga. |
| Rút bài | (ẩn danh) conversation-cards-5.js:20 93, run webgl-terrain-renderer-3.js:133 70 | Pha commit lá có đọc hình học, style và layout đồng bộ. Khoảng chậm khác có thời gian nằm ngoài việc chính trên renderer. |

Trong trace rút bài, một khoảng giữa callback khoảng 106 ms chứa một FunctionCall 91,7 ms, lồng trong đó Layout 63,5 ms. Các thời gian lồng nhau không cộng lại. Khoảng giữa hai lần gọi JS trong trace và khoảng timestamp rAF dùng cho thống kê có mốc khác nhau. Khi đối chiếu, cần giữ cùng định nghĩa khung. Khoảng rAF lưu ở độ phân giải 0,1 ms. Mẫu n=10 cho tần suất và mức giật; một trace nhận diện đường thực thi, không xác lập tỷ lệ nguyên nhân cho cả mười lần. [Trace Chrome gốc](../../tools/perf/results/audit-06/bench-real-1920-1.trace.json.gz) · [Phân rã callback, V8 và layout](../../tools/perf/results/audit-06/trace-analysis.json) · [Số đo từng lượt và IQR](../../tools/perf/results/audit-06/graphics-bench-summary.json).
 

**Định vị chi phí ở phần 2.** Khi rút lá, cả 135 mẫu tự thân của getBoundingClientRect trong pha này đi qua commit → drawOneCard → renderDemoPlaceList → refresh → fitSheet. Bố cục được đọc ở phiếu đến ga phía sau bộ bài. Khi bay đến ga, 674 mẫu đi qua syncMapControlLayout do hai callback của heritage-frame và polish-arrival gọi. Khi xoay, 217 mẫu đi qua placeCountryLabels. Khi vào bản đồ, 1.141 mẫu putImageData đi qua ingest của raster-scheduler. Đây là số mẫu CPU, đơn vị khác với mili giây. [Ngăn xếp gọi theo pha](../../tools/perf/results/audit-06/renderer-hot-stacks.json).

### Bay camera tách khỏi mở phiếu ga

Hà Nội là ga khởi đầu. Phép “đến ga” ở phần 2 và ma trận gồm cả chỉnh camera và mở phiếu tại ga hiện tại. Để tách chi phí bay, chọn Huế, đưa camera về toàn cảnh trước từng lần, gọi focusSelectedStationOnMap rồi đợi hai trục pan sai khác dưới 1 đơn vị, zoom sai khác dưới 0,005. Mười lượt trên cùng bản đồ đã ấm ở CPU ×4, 1920×1080; một lượt trace đầu được loại khỏi thống kê. Không mở phiếu ga trong khoảng này.

**Bay camera tới Huế** đạt 20.49 FPS (Q1–Q3 17.21–22.60, IQR 5.38, n=10). Thời gian trung vị 617 ms, IQR 58 ms. Trong trace, callback chiếm nhiều thời gian nhất là animateLoop map-surroundings-preview-5.html (465 ms cộng dồn). Các hàm ứng dụng xuất hiện trong mẫu CPU tự thân gồm ẩn danh label-performance-arrival-5.js (107), ẩn danh map-surroundings-preview-5.html (57), placeCountryLabels preview-5.js (38), measure label-performance-arrival-5.js (27), projectRing render-performance.js (20), paintIslandGroup webgl-terrain-renderer-3.js (20), paintLabels province-legibility-5.js (18), paint webgl-terrain-renderer-3.js (15), renderMainScene map-surroundings-preview-5.html (14), paintLandmarks preview-5.js (14), paintBackdrop preview-5.js (13). [Trace bay riêng](../../tools/perf/results/audit-06/flight-real-1920-1.trace.json.gz) · [Số đo bay và điểm nóng](../../tools/perf/results/audit-06/focus-summary.json).

## 3. Theo dõi bộ nhớ

Phiên thăm dò ghi nhận ba WebGL context trong suốt 12 vòng vào/ra và 24 lần chọn lặp ba ga. Bộ đếm terrain giữ ở 14,94 MiB. Phần rút lặp của phiên này dừng tại điều kiện phải đến ga mới được mở bộ bài. Bản thăm dò giữ thông tin vị trí tạo canvas để kiểm kê nên không dùng mức tăng heap của mẫu này để kết luận rò rỉ. [Dữ liệu thăm dò và lỗi của bộ đo](../../tools/perf/results/audit-06/leak-real-1920-1.json).

### Phiên kiểm sau GC

Dùng Chrome mới, Intel Arc, 1080p, CPU ×1. Hai lần collectGarbage trước mỗi mẫu; dừng lưu mảng khoảng rAF và theo dõi WebGL bằng tham chiếu yếu. Cùng một trang, cùng thứ tự các đợt. Đợt chọn có 24 địa danh khác nhau. Bộ nhớ Windows lấy từ tiến trình GPU riêng của phiên Chrome qua SystemInfo.getProcessInfo và GPU Process Memory. Giá trị dedicated/shared là số Windows quy cho tiến trình, có cả compositor và các surface khác. Đơn vị MiB.

| Đợt | Lần | Heap V8 | DOM | Listener | GL sống | Cache terrain | GPU dedicated | GPU shared |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ban đầu | 0 | 18.35 | 5652 | 284 | 3 | 20.69 | 0.0 | 1267.14 |
| Chờ 5 s | 0 | 18.7 | 5652 | 284 | 3 | 25.06 | 0.0 | 1022.28 |
| Vào/ra | 3 | 19.69 | 5652 | 284 | 3 | 25.06 | 0.0 | 1204.65 |
| Vào/ra | 6 | 19.85 | 5665 | 284 | 3 | 25.06 | 0.0 | 1192.29 |
| Vào/ra | 9 | 19.98 | 5665 | 284 | 3 | 25.06 | 0.0 | 1195.79 |
| Vào/ra | 12 | 20.14 | 5665 | 284 | 3 | 25.06 | 0.0 | 1185.26 |
| Chọn ga | 6 | 20.29 | 5664 | 284 | 3 | 25.06 | 0.0 | 1217.16 |
| Chọn ga | 12 | 20.55 | 5687 | 284 | 3 | 41.01 | 0.0 | 1265.48 |
| Chọn ga | 18 | 20.97 | 5986 | 284 | 3 | 41.45 | 0.0 | 1317.87 |
| Chọn ga | 24 | 21.39 | 6036 | 284 | 3 | 41.89 | 0.0 | 1280.36 |
| Rút và kết thúc lá | 3 | 20.93 | 6079 | 285 | 3 | 51.33 | 0.0 | 1266.06 |
| Rút và kết thúc lá | 6 | 20.53 | 5957 | 282 | 3 | 51.33 | 0.0 | 1082.4 |
| Rút và kết thúc lá | 9 | 20.6 | 5999 | 283 | 3 | 51.33 | 0.0 | 1086.2 |
| Rút và kết thúc lá | 12 | 20.61 | 6041 | 284 | 3 | 51.33 | 0.0 | 1089.39 |

Mức đổi heap sau GC so với mẫu ngay trước từng đợt.

- 12 lần vào/ra: +1.44 MiB heap, +13 nút, +0 listener. Cache terrain 25.06 → 25.06 MiB.
- 24 lần chọn: +1.25 MiB heap, +371 nút, +0 listener. Cache terrain 25.06 → 41.89 MiB.
- 12 lần rút: -0.78 MiB heap, +5 nút, +0 listener. Cache terrain 41.89 → 51.33 MiB.

Chênh của đợt thẻ bao gồm cả lần trở lại ga Hà Nội trước khi rút. Mỗi lá hoàn tất có thay đổi tiến trình trò chơi, cache và dữ liệu có chủ đích có thể tồn tại sau GC. Một chuỗi hữu hạn chưa chứng minh một đối tượng bị giữ vĩnh viễn. Số đo Windows không chia bộ nhớ riêng từng canvas. [Chuỗi đo, PID, bộ đếm Windows và cache gốc](../../tools/perf/results/audit-06/leak-real-1920-2.json).

### Chọn lại cùng 24 địa danh sau khi cache đã ấm

Một phiên độc lập chạy bốn vòng giống nhau, tổng cộng 96 lần chọn. Mở toàn bộ danh sách, không rút bài. Từ vòng 1 trở đi, điểm cuối luôn cùng ga. Trang nghỉ 2,5 giây, thu gom GC hai lần trước khi đọc. Hai heap snapshot lấy sau mẫu của vòng 1 và vòng 4.

| Vòng | Heap (MiB) | Nút DOM | Listener | Cache terrain (MiB) | GPU shared (MiB) |
|---|---:|---:|---:|---:|---:|
| 0 | 17.83 | 6004 | 275 | 11.53 | 859.68 |
| 1 | 19.67 | 6081 | 275 | 16.41 | 1158.29 |
| 2 | 19.71 | 6082 | 275 | 32.79 | 919.28 |
| 3 | 19.86 | 6082 | 275 | 32.79 | 919.29 |
| 4 | 19.88 | 6082 | 275 | 32.79 | 897.25 |

Từ cuối vòng 1 đến cuối vòng 4, heap đổi +0.21 MiB sau 72 lần chọn lặp. Snapshot đếm native node mang cờ detached của V8 từ 1280 đến 1280. Hai nhóm tăng nhiều nhất tính theo shallow size là native / Path2D (+52 KiB) và code / (code) (+47 KiB). Chỉ số này phân loại đối tượng còn tồn tại; cần đường giữ tham chiếu để quy trách nhiệm cho một module. [Chuỗi cùng ga cuối](../../tools/perf/results/audit-06/steady-real-1920-1.json) · [So sánh heap snapshot](../../tools/perf/results/audit-06/steady-heap-diff.json).

## 4. Ba đường render ở ba độ phân giải

Mỗi ô là trung vị của ba phiên Chrome mới, CPU ×1, DPR 1, cùng luồng và điểm kết thúc như phần 2. Đếm thành công khi đến phiếu ga Hà Nội và rút được lá. Bộ đếm pixel chỉ cộng backing store của canvas trong DOM tại mốc bản đồ. Hai cột bộ nhớ ở phần 3 có phạm vi khác.

| Renderer | Viewport | Đạt/n | Vào bản đồ (s) | Kéo (FPS) | Xoay (FPS) | Hà Nội + mở phiếu (FPS) | Rút bài (>50 ms) | Triệu pixel DOM |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Intel Arc | 1920×1080 | 3/3 | 7.44 | 58.54 | 53.15 | 49.83 | 4.0 | 26.81 |
| Intel Arc | 2560×1440 | 3/3 | 8.11 | 59.15 | 56.36 | 48.78 | 4.0 | 35.63 |
| Intel Arc | 3840×2160 | 3/3 | 9.91 | 60.0 | 58.13 | 45.58 | 5.0 | 52.19 |
| SwiftShader | 1920×1080 | 3/3 | 23.51 | 12.57 | 5.85 | 5.34 | 19.0 | 28.84 |
| SwiftShader | 2560×1440 | 3/3 | 26.74 | 18.23 | 9.04 | 2.43 | 19.0 | 35.63 |
| SwiftShader | 3840×2160 | 3/3 | 38.97 | 3.92 | 1.65 | 0.43 | 6.0 | 54.24 |
| WebGL tắt | 1920×1080 | 3/3 | 7.69 | 19.33 | 11.88 | 16.92 | 22.0 | 24.7 |
| WebGL tắt | 2560×1440 | 3/3 | 8.67 | 14.38 | 6.22 | 11.47 | 15.0 | 31.9 |
| WebGL tắt | 3840×2160 | 3/3 | 11.23 | 6.96 | 2.46 | 2.46 | 6.0 | 43.85 |

Intel Arc và SwiftShader được xác nhận qua UNMASKED_RENDERER của chính terrain. Khi tắt WebGL, lấy context trả null, không có renderer GL; giá trị available/failed, số lần fallback và camera sau mỗi pha nằm trong từng JSON. Các mốc >50 ms dùng khoảng rAF; qua luồng chứng minh bản đồ, thao tác camera, phiếu ga và lá bài hoạt động ở viewport đã thử. [Tổng hợp đủ 27 lượt và phân vị](../../tools/perf/results/audit-06/graphics-matrix-summary.json).

Ảnh chụp lượt đầu sau khi đến ga, trước khi mở bộ bài.

- real · [1920px](../../verification/audit-06/matrix-real-1920-1.png) · [2560px](../../verification/audit-06/matrix-real-2560-1.png) · [3840px](../../verification/audit-06/matrix-real-3840-1.png)
- swiftshader · [1920px](../../verification/audit-06/matrix-swiftshader-1920-1.png) · [2560px](../../verification/audit-06/matrix-swiftshader-2560-1.png) · [3840px](../../verification/audit-06/matrix-swiftshader-3840-1.png)
- nowebgl · [1920px](../../verification/audit-06/matrix-nowebgl-1920-1.png) · [2560px](../../verification/audit-06/matrix-nowebgl-2560-1.png) · [3840px](../../verification/audit-06/matrix-nowebgl-3840-1.png)

## 5. Đối chiếu nguồn và tài nguyên

### Terrain WebGL (A.2–A.3)

Địa hình khai báo một program với hai shader highp. Vertex shader chiếu world → camera → clip space, tận dụng sin/cos yaw/pitch tính trước trên JS; fragment shader chọn texture hoặc màu. Mỗi pass cập nhật sáu uniform camera; mỗi ring thêm height, box, textured, wall và các uniform viền. Một ring đủ LOD thường có năm draw (bóng, vách, mặt, hai viền), rồi mới tính đảo và coverage. Dữ liệu gom theo ring và pass, chưa gom toàn bộ tỉnh vào một draw. Chế độ blend/depth đổi giữa các pass. Coverage dùng context stencil riêng. [Shader và pass](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L16) · [Coverage](../../assets/goi-viet/map-surroundings-preview/webgl-coverage-3.js#L47).

Mỗi texture mới được gửi trọn bằng texImage2D trên luồng chính; LINEAR cho min/mag, CLAMP_TO_EDGE hai chiều, không tạo mipmap nên dùng được ảnh NPOT trong WebGL1. Cache dùng khóa ring, mật độ LOD, chủ đề và mức style. Khi camera đổi zoom còn giữ texture cũ trong lúc chờ LOD đích. Khi cache hit không cần upload lại. Không thấy bằng chứng sửa một ô trong texture hiện hữu mà buộc phải tải lại toàn bộ trong luồng đã đo. Diện tích texture có kiểm MAX_TEXTURE_SIZE. Ở nhánh terrain, bóng và mặt là hai texture riêng. [Tạo texture](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L97) · [Chọn lại LOD](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L262).

Cache terrain dùng thứ tự Map, đưa mục vừa dùng về cuối và loại mục đầu khi tổng texture vượt 64 MiB hoặc mesh vượt 16 MiB. Cache đảo có giới hạn riêng 32 MiB, mỗi mục chứa texture và buffer. Tổng danh nghĩa 112 MiB cho các cache này. Mặt dựng, depth/stencil, MSAA, coverage, bản sao driver, hạc và backing store Canvas 2D nằm ngoài tổng. remove xóa bốn buffer và hai texture của một ring. Khi khởi tạo dở dang có nhánh ngoại lệ trước lúc đăng ký cache, xem A-06. [Quản lý cache](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L105).

Earcut và phép kiểm sai lệch diện tích chạy đồng bộ trong geometry. Lịch idle hoặc màn che dời thời điểm dựng mesh; một lời gọi đang chạy vẫn giữ luồng chính tới khi trả kết quả. Terrain usable() dựa trên disabled/failed/lost, còn inspect().available đòi context đã tạo. Do đó có thể usable trước khi init biết kết quả. Mất context kích hoạt preventDefault, clear và vẽ lại; khi nhận restored module tạo canvas/program mới. [Tam giác hoá](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L84) · [Trạng thái GL](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L331).

**Kiểm đường dự phòng.** Ở phiên cưỡng bức mất context terrain bằng WEBGL_lose_context, usable/available/active cùng chuyển từ true sang false, cache từ 71 về 0 mục. Sau restore, terrain tạo lại context, vẽ được và đã có 59 mục tại mốc quan sát. Sau đó đã kéo, xoay, tới ga và rút lá, không có pageerror. Phiên có tham số renderer=canvas hoàn tất cùng luồng, terrain báo disabled=true, available=false, draws=0. Đây là hai phép chức năng n=1, tách khỏi ma trận hiệu năng n=3. [Mất và phục hồi](../../tools/perf/results/audit-06/loss-real-1920-1.json) · [Ép dùng Canvas](../../tools/perf/results/audit-06/flag-real-1920-1.json).

### Canvas 2D, raster và lớp trang chủ (A.4–A.5)

| Thành phần | Đường thực thi và giới hạn |
|---|---|
| preview-5.js, render-performance.js:6–46, surface-cache.js:6 | Culling theo bounds, cache sin/cos, đơn giản vách và tái dùng mặt/bóng. Cache mặt 32 MiB; nhãn, hit-test và viền vẫn theo camera hiện tại. Overview, nền, sóng, coverage và nhãn có surface riêng. |
| pixel-budget.js:4–15 | Trần thiết kế 64×1024² pixel chia theo vai trò, DPR ≤2, mỗi nền khoảng 4 Mi pixel, sóng/coverage 2 Mi, xe 6 Mi. Cache tile và canvas xuất ảnh có vòng đời riêng. Tổng của tất cả đối tượng còn chờ GC không dùng làm phép thử duy nhất cho ngân sách này. |
| natural/terrain-renderer-5.js:17–41, landscape-5.js:43–70 | Tile đất 48 đơn vị thế giới + mép, 64 MiB; tile offshore 16 MiB. Biển 100×100 px tính sampleDepth, cache 32 MiB; placeholder biển 8×8, đất 4×4. Offshore có vòng material từng pixel khi trượt cache. |
| natural/archipelago-renderer-5.js:63, regional-renderer-4.js:51–61, island-chart-5.js:86–101 | Cache raster quần đảo 24 MiB, vùng 64 MiB khi scheduler quản lý, nhánh còn lại giới hạn 640 tile. Bản đồ đảo dùng đường/vector, chữ, minimap và lớp nền; chi phí tính pixel phụ thuộc nhánh raster được gọi. |
| natural/raster-scheduler-5.js:68–173, raster-tasks.js:27 | Tối đa 3 worker, 2 tác vụ đang bay mỗi worker; 128 job, ngưỡng ready 4 MiB nhân số slot. Nhận buffer và putImageData trên main. Ngân sách lát 3 ms hoặc 12 ms khi đang giữ màn và terrain báo usable. Kiểm mốc thời gian giữa các item, iterator.next hoặc hàng fallback; một bước đơn lẻ có thể vượt ngân sách. |
| map-prewarm-3.js:12,67–79 | Chuẩn bị dữ liệu ở trang chủ, hoàn thiện trước khi hé màn; đợi hai lần kiểm sẵn sàng, có ngưỡng an toàn 30 giây và còn chờ khoảng yên trước reveal. Ngưỡng này không phải cam kết thời gian từ click tới khi nhìn thấy bản đồ. |
| label-performance-arrival-5.js:45–74, province-legibility-5.js:68 | Observer đánh dấu bẩn, đọc kiểu và bounds theo trạng thái/transition; cache tối đa 2.048 số đo chữ. Khi camera xoay, đặt nhãn và tránh chồng vẫn chạy. |
| journey-vehicles.js, family-voyage-5.js:802 | Phương tiện có canvas riêng. Ảnh kỷ niệm hải trình tạo canvas 1800×1200 theo yêu cầu, tương đương 8,24 MiB RGBA thô. |
| homepage-layered-renderer-5.js:56–67,99–124 | Blur mask rồi đọc ImageData khi chuẩn bị, drawAtmosphere cập nhật trường raster rồi putImageData. Chi phí tạo mask khác chi phí mỗi khung. |
| memory-train-smoke-v6.js, memory-train-wheels-v7.js:42–111, homepage-transport-3/transport.js:2 | Khói có surface riêng, bánh/toa tạo sprite rồi drawImage khi chuyển động, bộ vận tải thay ảnh theo tier màn hình. Các surface bánh và khói vẫn xuất hiện trong bảng DOM lúc vào bản đồ. |

Ở ba phiên Intel 1080p ×1, scheduler báo maxSliceMs là 79.1, 80.7, 65.2 ms tại mốc bản đồ. Đây là lát dài nhất từ lúc tải trang, có thể nằm trong giai đoạn giữ màn; cả ba vượt cả mức đặt lịch 12 ms. Ba worker đã hoạt động. Thời gian của putImageData trong trace gắn việc giao kết quả với luồng chính. [Phiên đầu 1080p](../../tools/perf/results/audit-06/matrix-real-1920-1.json).

### Hiệu ứng DOM/CSS (A.6)

Bộ bài dùng transform/opacity, thay z-index khi xáo. Trạng thái hover/chọn có box-shadow, phase-pick có quầng sáng. card-covers-5.css bố trí mặt trang trí SVG theo container; width/left/top dùng để bố trí không tự động có nghĩa là animate layout. Fortune ritual dùng backdrop-filter blur(10px) và keyframe xoay/di chuyển/opacity. Homepage giới hạn một số will-change vào trạng thái playing; reduced-motion đưa về auto. legibility-5.css dùng :has theo trạng thái màn intro. Trace có UpdateLayoutTree và Paint, nhưng chưa tách được riêng chi phí của selector :has, số compositing layer do will-change hay blur của nghi thức. Ngăn xếp fitSheet trong thao tác rút bài là bằng chứng trực tiếp hơn cho việc ưu tiên sửa. [Hiệu ứng bộ bài](../../assets/goi-viet/map-surroundings-preview/conversation-cards-5.css#L61) · [Bố trí bìa](../../assets/goi-viet/map-surroundings-preview/card-covers-5.css#L44) · [Nghi thức](../../assets/goi-viet/map-surroundings-preview/fortune-ritual.css#L12) · [CSS nhãn](../../assets/goi-viet/map-surroundings-preview/legibility-5.css#L5).

### Ảnh và font (A.7)

CSV Lượt 1 ghi 6 font WOFF heritage (162,492 byte) và 9 ảnh bìa WebP của luồng Hà Nội, gồm giấy nền và tám mảnh (104,832 byte, 2.42 MiB nếu giải mã tất cả sang RGBA). Thời điểm từng yêu cầu lấy từ cột pha của A.1. Họ Playfair/Oswald, Barlow, Dancing Script và Philosopher có mục riêng trong bảng tài nguyên. [Kích thước, định dạng, giai đoạn và dung lượng từng tệp](../../tools/perf/results/audit-06/graphic-assets.json).

Ba lần tạo ImageBitmap từ cùng blob đã fetch trong Chrome, tuần tự, đóng bitmap sau mỗi lần. Đây là độ trễ giải mã riêng, phụ thuộc cache của decoder, chưa gồm mạng, raster màn hình hoặc thời gian layout font. [Mẫu giải mã gốc](../../tools/perf/results/audit-06/asset-decode.json).

| Tệp | Pixel | Byte tệp | RGBA thô (MiB) | Trung vị giải mã (ms) |
|---|---|---:|---:|---:|
| assets/goi-viet/homepage-transport-3/poster-2k.webp | 1920×1189 | 922,756 | 8.71 | 54.20 |
| assets/goi-viet/station-photos-5/hn.webp | 1600×1068 | 733,590 | 6.52 | 44.00 |
| assets/goi-viet/memory-reference-v5/bay-water.webp | 1774×887 | 1,866,652 | 6.00 | 37.50 |
| assets/goi-viet/memory-reference-v5/river-registered.webp | 926×1699 | 601,432 | 6.00 | 12.70 |
| assets/goi-viet/card-covers-5/paper-red.webp | 512×512 | 10,048 | 1.00 | 2.10 |
| assets/goi-viet/card-covers-5/hn/tc.webp | 332×237 | 26,274 | 0.30 | 2.80 |

## 6. Các phát hiện và cách kiểm lại

Mức độ phản ánh ảnh hưởng tới thao tác trình chiếu. Cùng một trace có thể chứa các tác vụ lồng nhau; thời gian trong các phát hiện không được cộng thành tổng.

### A-01 · Màn che kéo dài khi vào bản đồ

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | natural/raster-scheduler-5.js:117–131, map-prewarm-3.js:67–79 |
| Mô tả | Ở ×4, luồng chính vừa nhận buffer worker bằng putImageData vừa vẽ coverage và chuẩn bị bản đồ. Trong một trace, các callback tick của scheduler cộng dồn 4,24 s. |
| Tái hiện | 1920×1080, Arc, ×4; vào Miền ký ức rồi mở bản đồ như phần 2. |
| Mong đợi / Thực tế | Mục tiêu ≤6 s; trung vị 15,26 s, Q1–Q3 12,87–16,71 s. |
| Bằng chứng | [Trace và số liệu](../../tools/perf/results/audit-06/trace-analysis.json) · [Ngăn xếp](../../tools/perf/results/audit-06/renderer-hot-stacks.json) |
| Trạng thái | đã đo |
| Nguồn gốc | Có sẵn từ preview-4 theo đối chiếu GĐ6 về thời gian vào; tỷ lệ chi phí theo hàm ở preview-4 chưa đo lại. |
| Đề xuất sửa | Ưu tiên tile thực sự che viewport, hạn chế khối lượng mỗi lần ingest; chỉ hé màn khi lớp đang hiển thị đã có nền phù hợp. |
| Rủi ro khi sửa | Hé sớm có thể lộ ô trống, ảnh hưởng Canvas fallback hoặc vùng đảo. |
| Cách kiểm sau sửa | Lặp n≥10 ×4 với cùng đường vào, so trung vị/IQR, kiểm khung hé màn và cả worker lỗi. |

### A-02 · WebGL phần mềm không giữ được nhịp xoay ở 4K

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | webgl-terrain-renderer-3.js:252–292, webgl-coverage-3.js:47 |
| Mô tả | SwiftShader vẫn chạy các pass bản đồ trên CPU. Tăng kích thước surface làm cấu hình trình chiếu này đặc biệt chậm. |
| Tái hiện | Chrome --use-angle=swiftshader, 3840×2160, DPR 1, ×1. Mở bản đồ, kéo rồi xoay chuột phải. |
| Mong đợi / Thực tế | Kỳ vọng camera theo kịp chuột; trung vị ở 4K là 1.65 FPS khi xoay, kéo 3.92 FPS, vào bản đồ 38.97 s (n=3). |
| Bằng chứng | [Ma trận](../../tools/perf/results/audit-06/graphics-matrix-summary.json) · [Ảnh 4K](../../verification/audit-06/matrix-swiftshader-3840-1.png) |
| Trạng thái | đã đo |
| Nguồn gốc | Không xác định ở đúng 4K. |
| Đề xuất sửa | Thử hạ tỷ lệ backing store của địa hình/coverage khi nhận diện renderer phần mềm; giữ độ phân giải chữ. |
| Rủi ro khi sửa | Biên địa hình có thể mờ, hit-test và nhãn cần giữ đúng hệ toạ độ. |
| Cách kiểm sau sửa | So A/B ít nhất 10 lượt trên máy trình chiếu và SwiftShader, đối chiếu bằng mắt với WebGL tắt. |

### A-03 · Kéo và xoay vẫn tốn công trên luồng chính

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | preview-5.js:204,458, province-legibility-5.js:68, map-surroundings-preview-5.html:8743 |
| Mô tả | Trace kéo ghi nhận drawImage trong paintLandmarks; khi xoay, placeCountryLabels và đo chữ nằm trong đường nóng. Camera đổi làm mất cơ hội dùng lại nền và vị trí nhãn. |
| Tái hiện | Intel Arc, ×4, 1080p. Kéo trái và xoay phải trên mainCanvas. |
| Mong đợi / Thực tế | Tham chiếu 60 FPS tương đương 16,7 ms/khung. Trung vị kéo 37,65 FPS, xoay 24,47 FPS. |
| Bằng chứng | [Trace và số liệu](../../tools/perf/results/audit-06/trace-analysis.json) · [Ngăn xếp](../../tools/perf/results/audit-06/renderer-hot-stacks.json) |
| Trạng thái | đã đo |
| Nguồn gốc | Hiện tượng có sẵn từ preview-4 theo GĐ6; cấu hình nội dung nhãn hiện tại có thay đổi. |
| Đề xuất sửa | Thử tái dùng kết quả va chạm nhãn trong khoảng dịch chuyển nhỏ; chỉ dựng lại khi mật độ, hướng nhìn hoặc vùng UI thực sự đổi. |
| Rủi ro khi sửa | Chữ có thể chồng nhau, nhấp nháy, hoặc che ga khi góc nhìn đổi. |
| Cách kiểm sau sửa | Lặp bộ kéo/xoay của phần 2; chụp so sánh nhãn vùng biên và các ga ở cả VI/EN. |

### A-04 · Chuyển camera và mở phiếu ga tranh thời gian với bố cục giao diện

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | map-surroundings-preview-5.html:8510,8555; heritage-frame.js:49; polish-arrival-5.js:37 |
| Mô tả | Đường bay tới ga ban đầu gồm cả thao tác UI. Hai callback cùng đi qua syncHeaderOffset và syncMapControlLayout, đọc getBoundingClientRect trong khoảng chuyển cảnh. |
| Tái hiện | Giữ CPU ×4; sau thao tác xoay, chọn ga Hà Nội và mở phiếu. Đối chứng bằng bay camera riêng tới Huế, không mở phiếu. |
| Mong đợi / Thực tế | Luồng có phiếu đạt 10,83 FPS; bay camera riêng đạt 20.49 FPS (n=10 mỗi phép, điều kiện/phạm vi khác nhau). |
| Bằng chứng | [Trace và số liệu](../../tools/perf/results/audit-06/trace-analysis.json) · [Ngăn xếp](../../tools/perf/results/audit-06/renderer-hot-stacks.json) · [Bay riêng](../../tools/perf/results/audit-06/focus-summary.json) |
| Trạng thái | đã đo |
| Nguồn gốc | Không xác định. Không so trực tiếp với phép bay GĐ6. |
| Đề xuất sửa | Gộp các lần đo header/panel vào một lần đọc theo khung và tái dùng bounds cho các lớp cần cùng dữ liệu. |
| Rủi ro khi sửa | Sai thứ tự đo có thể làm phiếu ga lệch vị trí hoặc che điều khiển khi đổi kích thước. |
| Cách kiểm sau sửa | Đo riêng bay và đến ga; đối chiếu dấu vết Layout và vị trí phiếu trên ba viewport. |

### A-05 · Chốt lá bài kích hoạt layout của phiếu ga phía sau

| Trường | Kết quả |
|---|---|
| Mức độ | Cao |
| Vị trí | conversation-cards-5.js:102, map-surroundings-preview-5.html:7425, arrival-demo-5.js:259 |
| Mô tả | drawOneCard dựng lại danh sách; refresh của phiếu ga gọi fitSheet và đọc hình học khi DOM vừa đổi. Có một layout 63,5 ms nằm trong callback chốt lá. |
| Tái hiện | Arc ×1, 1080p, tới ga Hà Nội, mở bộ bài, bấm rút ngẫu nhiên với chuyển động bình thường. |
| Mong đợi / Thực tế | Mong đợi hoạt cảnh rút liền mạch. Trung vị 3 khoảng >50 ms mỗi lần rút, khoảng dài nhất trung vị 166,65 ms. |
| Bằng chứng | [Trace và số liệu](../../tools/perf/results/audit-06/trace-analysis.json) · [Ngăn xếp](../../tools/perf/results/audit-06/renderer-hot-stacks.json) |
| Trạng thái | đã đo |
| Nguồn gốc | Đường gọi commit thuộc bộ bài preview-5. GĐ6 đã ghi nhận khung dài ở cả bản cũ. |
| Đề xuất sửa | Hoãn fitSheet của phiếu bị bộ bài che đến khi cần hiển thị lại; gộp lần cập nhật danh sách sau khi chốt lá. |
| Rủi ro khi sửa | Phải giữ focus, đúng lá đã rút, số tiến độ và hành vi khi đóng giữa hoạt cảnh. |
| Cách kiểm sau sửa | So lại trace n≥10, chạy kiểm tra thẻ và đối chiếu gom–xáo–chọn–rút với card-testing.html. |

### A-06 · Nhánh dựng tài nguyên GPU lỗi có thể bỏ sót thu hồi tường minh

| Trường | Kết quả |
|---|---|
| Mức độ | Trung bình |
| Vị trí | webgl-terrain-renderer-3.js:82,155–185,208–211 |
| Mô tả | Buffer/texture được cấp trước khi đưa entry vào Map. Nếu cấp phát tiếp theo ném lỗi hoặc phát hiện vượt ngân sách, clear chỉ duyệt các entry đã đăng ký. Điều này có thể để tài nguyên chờ GC/driver thu hồi. |
| Tái hiện | Đọc nhánh tạo geometry, texture và shadowBuffer rồi throw trước entries.set. Chưa ép lỗi cấp phát vật lý. |
| Mong đợi / Thực tế | Mong đợi thu hồi mọi handle đã tạo dở ngay trong nhánh lỗi. Chỉ thấy vòng xóa cho handle đã được ghi vào cache. |
| Bằng chứng | [Tạo và kiểm ngân sách](../../assets/goi-viet/map-surroundings-preview/webgl-terrain-renderer-3.js#L180) |
| Trạng thái | suy luận từ mã |
| Nguồn gốc | Không xác định. |
| Đề xuất sửa | Gom các handle mới vào danh sách tạm và xóa trong nhánh lỗi; kiểm ngân sách sớm nếu đã biết kích thước. |
| Rủi ro khi sửa | Xoá nhầm handle đã chuyển quyền cho cache làm mất địa hình hoặc lỗi khi phục hồi context. |
| Cách kiểm sau sửa | Trong bản sửa thử nghiệm, mô phỏng lỗi sau từng lần cấp handle và kiểm số create/delete cân bằng; kiểm lại mất/khôi phục GL. |

## 7. Giới hạn và đối chiếu sau sửa

- Máy đo dùng một Intel Arc tích hợp. Chưa đo máy lớp học, máy hai GPU, màn hình vật lý/DPR khác 1 hay tỷ lệ khung thực sự được trình chiếu trên máy chiếu. CPU ×4 là hệ số throttle của Chrome.
- Timer GL có số cho terrain và một số pass coverage. Chưa có phân rã GPU chính xác của toàn bộ Canvas 2D, raster, compositor, hạc và từng shader. Phần 1 ghi rõ các pass có query hợp lệ. Chưa tách hiệu ứng của riêng :has, backdrop-filter và từng font bằng thử A/B.
- Windows tách được bộ nhớ dedicated/shared của tiến trình GPU. Chưa quy được VRAM vật lý từng texture, surface hoặc canvas cho riêng trang. Theo dõi dưới tải hữu hạn và hai heap snapshot chưa xác định được một rò rỉ dài hạn. Chưa cưỡng bức lỗi cấp phát vật lý giữa chừng ở A-06.
- Đã kiểm mất/phục hồi **context terrain** và ép Canvas. Chưa giả lập mất riêng context coverage hoặc hạc, máy hai GPU chuyển adapter, lỗi worker ở từng viewport, hoặc đo toàn bộ phim mở đầu. Các phép đến ga và rút lá dùng Hà Nội; phép bay camera riêng dùng Huế.
- Nhịp trình bày ở các pha không đồng nhất: đọc giá trị theo định nghĩa ngay dưới tiêu đề từng bảng. Không dùng chênh lệch giữa các ô n=3 để xác nhận cải thiện sau sửa. Quy tắc A/B của dự án cần n≥10 mỗi bên, |Δ trung vị| ≥ IQR nền và Mann–Whitney p<0,05.

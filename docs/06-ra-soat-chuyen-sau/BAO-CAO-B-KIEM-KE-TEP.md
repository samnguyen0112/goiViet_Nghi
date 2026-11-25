# Báo cáo B — Kiểm kê tệp và tham chiếu

Lượt 1/4 · 19/11/2026 · Rà soát cây làm việc hiện tại trên Windows.

**1717 tệp**, trong đó **51 ứng viên xoá** chiếm **16.796.773 byte (16,02 MiB)**. [Bảng kê từng tệp](kiem-ke-tep.csv) · [Đề xuất theo thư mục](DE-XUAT-XOA.md).

## B.1–B.3 Phạm vi, đồ thị và phân loại

Bảng kê gồm các tệp trong `assets/`, `image/` và các tệp cấp gốc. Đồ thị lấy tám trang vào, service worker, manifest và 220 script trong `tools/` làm gốc, bao gồm bộ dựng manifest. Dò 20 tài liệu Markdown trong `docs/` để xác định tham chiếu tài liệu. Tài nguyên trong thư mục phiên bản được tính như các tệp khác.

Đường dẫn được chuẩn hoá từ `src`, `href`, `srcset`, CSS `url()`, chuỗi trong mã và danh mục. Đồ thị ghi cả đường dẫn lồng trong script nội tuyến, request của worker và tài nguyên nạp khi mở các chức năng. Phân loại dựa vào tập đích đến được theo cạnh tham chiếu. Tên rời chưa phân giải và tài nguyên dựng lại được giữ nếu chưa đủ bằng chứng. Cột commit cuối lấy từ `git log HEAD`; cột dung lượng lấy theo byte của bản làm việc.

[Cạnh tham chiếu và phiên bản trong URL](../../verification/audit-06/reference-graph.json) · [Đường ghép động và đầu vào công cụ đã đối chiếu](../../verification/audit-06/reference-graph-reviewed.json) · [Dấu vết runtime các trang vào](../../verification/audit-06/network-entrypoints.jsonl) · [Dấu vết preview-5 VI/EN](../../verification/audit-06/network-preview-5.jsonl).

| Nhóm | Phân loại | Tệp | Dung lượng |
|---:|---|---:|---:|
| 1 | Dùng bởi preview-5 hoặc gói ngoại tuyến | 659 | 187.684.756 byte (178,99 MiB) |
| 2 | Dùng bởi các trang vào khác | 44 | 8.729.359 byte (8,32 MiB) |
| 3 | Chỉ công cụ dùng | 447 | 369.710.140 byte (352,58 MiB) |
| 4 | Chỉ tài liệu nhắc tới | 1 | 3.479 byte (0,00 MiB) |
| 5 | Chưa thấy gốc nào đến được | 50 | 16.793.294 byte (16,02 MiB) |
| 6 | Chưa chắc chắn, giữ | 516 | 161.292.025 byte (153,82 MiB) |

| Gốc | Tệp trong phạm vi đi đến được |
|---|---:|
| [index.html](../../index.html) | 195 |
| [map-surroundings-preview.html](../../map-surroundings-preview.html) | 266 |
| [map-surroundings-preview-2.html](../../map-surroundings-preview-2.html) | 263 |
| [map-surroundings-preview-3.html](../../map-surroundings-preview-3.html) | 365 |
| [map-surroundings-preview-4.html](../../map-surroundings-preview-4.html) | 363 |
| [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html) | 659 |
| [map-surroundings-preview-5-arrival-demo.html](../../map-surroundings-preview-5-arrival-demo.html) | 502 |
| [card-testing.html](../../card-testing.html) | 1 |
| [preview-5-offline-worker.js](../../preview-5-offline-worker.js) | 659 |
| [assets/goi-viet/map-surroundings-preview/offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) | 659 |

Các tập trên có thể giao nhau. Danh sách “được dùng bởi” trong CSV giữ tất cả các gốc và tài liệu xác định được, kể cả ở một nhóm ưu tiên cao hơn.

### Phạm vi quan sát runtime

| Trang | Ngôn ngữ | Chế độ | Pha đã xác nhận | Pha lỗi |
|---|---|---|---|---|
| `map-surroundings-preview-5.html` | VI | Mặc định | Trang chủ, Vào bản đồ, Chọn ga Hà Nội, Thẻ bài, Sách, Bưu thiếp, Cài đặt | — |
| `map-surroundings-preview-5.html` | EN | Mặc định | Trang chủ, Vào bản đồ, Chọn ga Hà Nội, Thẻ bài, Sách, Bưu thiếp, Cài đặt | — |
| `map-surroundings-preview-5.html` | VI | Sách nháp | Trang chủ, Vào bản đồ, Chọn ga Hà Nội, Thẻ bài, Sách, Bưu thiếp, Cài đặt | — |
| `map-surroundings-preview-5.html` | EN | Sách nháp | Trang chủ, Vào bản đồ, Chọn ga Hà Nội, Thẻ bài, Sách, Bưu thiếp, Cài đặt | — |
| `index.html` | VI | Mặc định | Trang chủ, Vào bản đồ | — |
| `map-surroundings-preview.html` | VI | Mặc định | Trang chủ, Vào bản đồ | — |
| `map-surroundings-preview-2.html` | VI | Mặc định | Trang chủ, Vào bản đồ | — |
| `map-surroundings-preview-3.html` | VI | Mặc định | Trang chủ, Vào bản đồ | — |
| `map-surroundings-preview-4.html` | VI | Mặc định | Trang chủ, Vào bản đồ | — |
| `map-surroundings-preview-5-arrival-demo.html` | VI | Mặc định | Trang chủ, Vào bản đồ, Chọn ga Hà Nội | — |
| `card-testing.html` | VI | Mặc định | Trang chủ, Thẻ thử nghiệm | — |

## B.4 Tài nguyên theo phiên bản, gói ngoại tuyến và đường dẫn lỗi

| Thư mục sinh tự động | Dung lượng đo được |
|---|---:|
| `exports/` | 558.949.482 byte (533,06 MiB) |
| `scratch/` | 82.423.633 byte (78,61 MiB) |
| `tools/perf/results/` | 34.361.466 byte (32,77 MiB) |
| `verification/` | 8.118.650.783 byte (7742,55 MiB) |

Số đo của các thư mục trên dùng dung lượng nội dung tại thời điểm chụp đồ thị. Các mục nằm ngoài bảng kê và danh sách ứng viên.

**Trùng lặp theo họ tên tệp.** Có 13 cặp giống nhau hoặc khác tối đa 12 dòng và có ít nhất 80% byte ở các dòng giống hệt. Phần trùng chính xác tính một bản cho mỗi băm có **0 byte (0,00 MiB)**. Cột byte chung cộng các dòng căn khớp theo thứ tự, kể cả ký tự xuống dòng.

| Tệp A | Tệp B | Dòng thay đổi | Byte chung | Hai tệp giống hệt |
|---|---|---:|---:|---|
| [assets/goi-viet/map-surroundings-preview/journey-system-3.js](../../assets/goi-viet/map-surroundings-preview/journey-system-3.js) | [assets/goi-viet/map-surroundings-preview/journey-system.js](../../assets/goi-viet/map-surroundings-preview/journey-system.js) | 9 | 20389 | — |
| [assets/goi-viet/map-surroundings-preview/polish-3.js](../../assets/goi-viet/map-surroundings-preview/polish-3.js) | [assets/goi-viet/map-surroundings-preview/polish-5.js](../../assets/goi-viet/map-surroundings-preview/polish-5.js) | 3 | 11830 | — |
| [assets/goi-viet/map-surroundings-preview/natural/hydrology-3.js](../../assets/goi-viet/map-surroundings-preview/natural/hydrology-3.js) | [assets/goi-viet/map-surroundings-preview/natural/hydrology-5.js](../../assets/goi-viet/map-surroundings-preview/natural/hydrology-5.js) | 4 | 7725 | — |
| [assets/goi-viet/map-surroundings-preview/natural/landscape-3.js](../../assets/goi-viet/map-surroundings-preview/natural/landscape-3.js) | [assets/goi-viet/map-surroundings-preview/natural/landscape-4.js](../../assets/goi-viet/map-surroundings-preview/natural/landscape-4.js) | 3 | 29090 | — |
| [assets/goi-viet/map-reference-ui-5.js](../../assets/goi-viet/map-reference-ui-5.js) | [assets/goi-viet/map-reference-ui.js](../../assets/goi-viet/map-reference-ui.js) | 8 | 8333 | — |
| [assets/goi-viet/heritage-overlays-3.js](../../assets/goi-viet/heritage-overlays-3.js) | [assets/goi-viet/heritage-overlays.js](../../assets/goi-viet/heritage-overlays.js) | 4 | 3429 | — |
| [assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-4.js](../../assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-4.js) | [assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js](../../assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js) | 12 | 13492 | — |
| [assets/goi-viet/postcard-design-3.js](../../assets/goi-viet/postcard-design-3.js) | [assets/goi-viet/postcard-design.js](../../assets/goi-viet/postcard-design.js) | 2 | 4671 | — |
| [assets/goi-viet/map-surroundings-preview/natural/terrain-renderer-4.js](../../assets/goi-viet/map-surroundings-preview/natural/terrain-renderer-4.js) | [assets/goi-viet/map-surroundings-preview/natural/terrain-renderer-5.js](../../assets/goi-viet/map-surroundings-preview/natural/terrain-renderer-5.js) | 3 | 13623 | — |
| [assets/goi-viet/map-surroundings-preview/heritage-command-bar-3.js](../../assets/goi-viet/map-surroundings-preview/heritage-command-bar-3.js) | [assets/goi-viet/map-surroundings-preview/heritage-command-bar.js](../../assets/goi-viet/map-surroundings-preview/heritage-command-bar.js) | 4 | 4402 | — |
| [assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-3.js](../../assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-3.js) | [assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-5.js](../../assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-5.js) | 11 | 8362 | — |
| [assets/goi-viet/homepage-layered-renderer-3.js](../../assets/goi-viet/homepage-layered-renderer-3.js) | [assets/goi-viet/homepage-layered-renderer.js](../../assets/goi-viet/homepage-layered-renderer.js) | 4 | 28103 | — |
| [assets/goi-viet/map-surroundings-preview/province-legibility-5.js](../../assets/goi-viet/map-surroundings-preview/province-legibility-5.js) | [assets/goi-viet/map-surroundings-preview/province-legibility.js](../../assets/goi-viet/map-surroundings-preview/province-legibility.js) | 12 | 14298 | — |

**Tham số phiên bản.** 26 đường dẫn có tập giá trị `v=` khác giữa các trang. `∅` là URL không mang `v=`.

| Tệp | Theo trang |
|---|---|
| [assets/goi-viet/homepage-content.css](../../assets/goi-viet/homepage-content.css) | index.html → 20261023-crane-layer-1; map-surroundings-preview-2.html → ∅; map-surroundings-preview-3.html → 20261023-crane-layer-1; map-surroundings-preview-4.html → 20261023-crane-layer-1; map-surroundings-preview-5-arrival-demo.html → 20261023-crane-layer-1; map-surroundings-preview-5.html → 20261023-crane-layer-1; map-surroundings-preview.html → ∅ |
| [assets/goi-viet/homepage-layered-opening.js](../../assets/goi-viet/homepage-layered-opening.js) | index.html → gentle-cranes-v13; map-surroundings-preview-2.html → gentle-cranes-v13; map-surroundings-preview-3.html → phase5-20261018; map-surroundings-preview-4.html → phase5-20261018; map-surroundings-preview.html → phase5-20261018 |
| [assets/goi-viet/homepage-layered-renderer.js](../../assets/goi-viet/homepage-layered-renderer.js) | index.html → articulated-cranes-layer-20261023-1; map-surroundings-preview-2.html → clean-train-cached-motion-20261015; map-surroundings-preview.html → 60fps-20261018 |
| [assets/goi-viet/homepage-layered-scene.js](../../assets/goi-viet/homepage-layered-scene.js) | index.html → gentle-cranes-v13; map-surroundings-preview-2.html → gentle-cranes-v13; map-surroundings-preview.html → 60fps-20261018 |
| [assets/goi-viet/homepage-opening-controller.js](../../assets/goi-viet/homepage-opening-controller.js) | index.html → ∅; map-surroundings-preview-2.html → ∅; map-surroundings-preview.html → 60fps-20261018 |
| [assets/goi-viet/map-reference-ui.js](../../assets/goi-viet/map-reference-ui.js) | index.html → 20261013-1; map-surroundings-preview-2.html → 20261015-scope-summary; map-surroundings-preview-3.html → 20261015-scope-summary; map-surroundings-preview-4.html → 20261015-scope-summary; map-surroundings-preview.html → 20261015-scope-summary |
| [assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261113-polish-1; map-surroundings-preview-5.html → 20261116-group-play-2 |
| [assets/goi-viet/map-surroundings-preview/arrival-demo-5/fortune-ritual-arrival-5.js](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/fortune-ritual-arrival-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261113-round3-1; map-surroundings-preview-5.html → 20261116-group-play-1 |
| [assets/goi-viet/map-surroundings-preview/arrival-demo-5/i18n-arrival-5.js](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/i18n-arrival-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261113-arrival-1; map-surroundings-preview-5.html → 20261116-group-play-1 |
| [assets/goi-viet/map-surroundings-preview/arrival-demo-5/station-panel-arrival-5.js](../../assets/goi-viet/map-surroundings-preview/arrival-demo-5/station-panel-arrival-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261113-round3-1; map-surroundings-preview-5.html → 20261116-group-play-1 |
| [assets/goi-viet/map-surroundings-preview/conversation-cards-5.css](../../assets/goi-viet/map-surroundings-preview/conversation-cards-5.css) | map-surroundings-preview-5-arrival-demo.html → 20261112-p505-1; map-surroundings-preview-5.html → 20261119-card-labels-2 |
| [assets/goi-viet/map-surroundings-preview/conversation-cards-5.js](../../assets/goi-viet/map-surroundings-preview/conversation-cards-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-i18n-1; map-surroundings-preview-5.html → 20261119-covers-1 |
| [assets/goi-viet/map-surroundings-preview/i18n-ui-5.js](../../assets/goi-viet/map-surroundings-preview/i18n-ui-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261112-offline-2; map-surroundings-preview-5.html → 20261119-covers-1 |
| [assets/goi-viet/map-surroundings-preview/journey-system.js](../../assets/goi-viet/map-surroundings-preview/journey-system.js) | map-surroundings-preview-2.html → arrival-journal-3; map-surroundings-preview.html → phase4-20261017 |
| [assets/goi-viet/map-surroundings-preview/journey-vehicles.js](../../assets/goi-viet/map-surroundings-preview/journey-vehicles.js) | map-surroundings-preview-2.html → 2; map-surroundings-preview-3.html → phase5-20261018; map-surroundings-preview-4.html → phase5-20261018; map-surroundings-preview-5-arrival-demo.html → phase5-20261018; map-surroundings-preview-5.html → phase5-20261018; map-surroundings-preview.html → phase5-20261018 |
| [assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-5.js](../../assets/goi-viet/map-surroundings-preview/natural/archipelago-renderer-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-i18n-2; map-surroundings-preview-5.html → 20261113-voyage-1 |
| [assets/goi-viet/map-surroundings-preview/natural/core.js](../../assets/goi-viet/map-surroundings-preview/natural/core.js) | map-surroundings-preview-2.html → 6; map-surroundings-preview.html → 60fps-20261018 |
| [assets/goi-viet/map-surroundings-preview/natural/hydrology.js](../../assets/goi-viet/map-surroundings-preview/natural/hydrology.js) | map-surroundings-preview-2.html → smooth-labels-20261015-1; map-surroundings-preview.html → phase3-20261017 |
| [assets/goi-viet/map-surroundings-preview/natural/island-chart-5.js](../../assets/goi-viet/map-surroundings-preview/natural/island-chart-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-content-1; map-surroundings-preview-5.html → 20261113-voyage-1 |
| [assets/goi-viet/map-surroundings-preview/natural/landscape-5.js](../../assets/goi-viet/map-surroundings-preview/natural/landscape-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-content-1; map-surroundings-preview-5.html → 20261113-postoffice-3 |
| [assets/goi-viet/map-surroundings-preview/natural/landscape.js](../../assets/goi-viet/map-surroundings-preview/natural/landscape.js) | map-surroundings-preview-2.html → 14; map-surroundings-preview.html → phase4-20261017 |
| [assets/goi-viet/map-surroundings-preview/natural/regional-renderer.js](../../assets/goi-viet/map-surroundings-preview/natural/regional-renderer.js) | map-surroundings-preview-2.html → 6; map-surroundings-preview.html → phase3-20261017 |
| [assets/goi-viet/map-surroundings-preview/natural/terrain-renderer.js](../../assets/goi-viet/map-surroundings-preview/natural/terrain-renderer.js) | map-surroundings-preview-2.html → 5; map-surroundings-preview.html → 60fps-20261018 |
| [assets/goi-viet/map-surroundings-preview/preview-5.js](../../assets/goi-viet/map-surroundings-preview/preview-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-content-1; map-surroundings-preview-5.html → 20261116-group-play-1 |
| [assets/goi-viet/map-surroundings-preview/province-legibility-5.js](../../assets/goi-viet/map-surroundings-preview/province-legibility-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-i18n-2; map-surroundings-preview-5.html → 20261116-group-play-1 |
| [assets/goi-viet/postcard-design-5.js](../../assets/goi-viet/postcard-design-5.js) | map-surroundings-preview-5-arrival-demo.html → 20261111-i18n-2; map-surroundings-preview-5.html → 20261116-group-play-2 |

**Gói ngoại tuyến.** Có 629 tài nguyên trong manifest. 2 tệp của A.1 và 2 tệp tìm thêm qua lượt kiểm trang chủ 4K nằm ngoài manifest. Có 449 mục chưa xuất hiện trong các lượt tải trực tuyến đã đối chiếu. 21 mục trong số tài nguyên của gói chỉ được nối vào đồ thị preview-5 qua worker hoặc manifest theo phép dò hiện tại. Các tập này có thể chứa tài nguyên dành cho ga khác, viewport khác, chức năng ít dùng hoặc tải dự phòng.

Tài nguyên thấy khi chạy nhưng nằm ngoài manifest:

- [assets/goi-viet/homepage-reference-v9/assets-2k.js](../../assets/goi-viet/homepage-reference-v9/assets-2k.js)
- [assets/goi-viet/homepage-reference-v9/assets-4k.js](../../assets/goi-viet/homepage-reference-v9/assets-4k.js)
- [assets/goi-viet/homepage-transport-3/train-2k.webp](../../assets/goi-viet/homepage-transport-3/train-2k.webp)
- [assets/goi-viet/homepage-transport-3/train-4k.webp](../../assets/goi-viet/homepage-transport-3/train-4k.webp)

Hai danh sách đối chiếu với manifest nằm ở khóa `manifestNotSeen` và `manifestOnly` trong [đối chiếu đầy đủ](../../verification/audit-06/inventory-classification.json).

**Đường dẫn lỗi.** Có 0 mục runtime HTTP 404 khi gộp theo trang, ngôn ngữ, pha và URL. Quét cấu trúc HTML/CSS ghi 0 khai báo không phân giải được trong cây hiện tại.


## Phát hiện và cách kiểm lại

### B-01 · Bốn tệp trang chủ vắng mặt trong gói ngoại tuyến

| Trường | Nội dung |
|---|---|
| Mức độ | Trung bình |
| Vị trí | [homepage-layered-scene-3.js](../../assets/goi-viet/homepage-layered-scene-3.js):37; [transport.js](../../assets/goi-viet/homepage-transport-3/transport.js):2; [preview-5-offline-worker.js](../../preview-5-offline-worker.js):71 |
| Mô tả | Hai bundle v9 và hai sprite tàu được ghép đường dẫn từ chất lượng 2K/4K. Bộ dựng manifest hiện bỏ sót bốn đường dẫn này. |
| Tái hiện | Mở preview-5 trên Chrome headless Windows ở 1440×900 và 3840×2160, DPR 1, mặc định VI và chuyển động thường. So đường dẫn sau khi bỏ query với `files` trong manifest. |
| Mong đợi / Thực tế | Gói chứa đủ phụ thuộc của hai chất lượng trang chủ. Thực tế cả bốn request trực tuyến được HTTP 200 và cả bốn vắng trong `files`. Worker chỉ xử lý request nằm trong `allowed`. |
| Bằng chứng | [Log HTTP hai độ phân giải](../../verification/audit-06/network-home-transport-b.json). [Đối chiếu đối tượng manifest](../../verification/audit-06/inventory-classification.json). |
| Trạng thái | đã đo |
| Nguồn gốc | Gói và worker dành riêng cho preview-5. |
| Đề xuất sửa | Bổ sung hai biến thể bundle và sprite bằng đường dẫn tường minh trong bộ dựng manifest. |
| Rủi ro khi sửa | Gói ngoại tuyến sẽ lớn hơn. Cần kiểm đường dự phòng ảnh tĩnh và quá trình nâng gói cũ. |
| Cách kiểm sau sửa | Chạy `python tools/build-preview-5-offline.py --check` sau khi gói đã được dựng lại. Chuẩn bị rồi ngắt mạng, kiểm request gói 2K/4K trên preview-5 với chuyển động thường. |

### B-02 · Gói ngoại tuyến kèm các scheduler đời trước

| Trường | Nội dung |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [tools/build-preview-5-offline.py](../../tools/build-preview-5-offline.py):22; [offline-manifest-5.js](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js):493; [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html):4147 |
| Mô tả | Bộ dựng nạp toàn bộ đuôi `.js` trong `natural/`. Ba scheduler cũ đi vào manifest qua tập rộng này. |
| Tái hiện | Đối chiếu danh sách `files` với thẻ script của preview-5 và đồ thị khi bỏ hai gốc ngoại tuyến. |
| Mong đợi / Thực tế | Scheduler được khai báo cho preview-5 là `raster-scheduler-5.js`. Manifest còn có `raster-scheduler.js`, `raster-scheduler-3.js` và `raster-scheduler-4.js`. |
| Bằng chứng | [Danh sách manifest](../../assets/goi-viet/map-surroundings-preview/offline-manifest-5.js) và khóa `manifestOnly` trong [đối chiếu](../../verification/audit-06/inventory-classification.json). |
| Trạng thái | suy luận từ mã |
| Nguồn gốc | Phạm vi gói riêng của preview-5. |
| Đề xuất sửa | Xét thu hẹp mắt xích tạo gói sau khi xác nhận đường dự phòng. Giữ các tệp phiên bản cũ mà các trang khác dùng. |
| Rủi ro khi sửa | Giảm phạm vi gói quá sớm có thể bỏ tài nguyên được nạp theo điều kiện hoặc cần cho chế độ ngoại tuyến. |
| Cách kiểm sau sửa | Đối chiếu đầy đủ request trực tuyến và ngoại tuyến ở các nhánh đã được đo, rồi xác nhận những trang cũ vẫn nạp scheduler của chính chúng. |

### B-03 · Cùng tệp có các giá trị v khác nhau giữa các trang

| Trường | Nội dung |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [index.html](../../index.html), [map-surroundings-preview-2.html](../../map-surroundings-preview-2.html), [map-surroundings-preview-5.html](../../map-surroundings-preview-5.html):4175 |
| Mô tả | Ví dụ `homepage-content.css` có `v=20261023-crane-layer-1` ở index và preview-5, còn preview-2 dùng URL không có tham số. |
| Tái hiện | Đọc các thẻ khai báo và ghi lại URL qua Chrome khi mở tám trang vào trên localhost. |
| Mong đợi / Thực tế | Bảng nguồn chỉ rõ trang dùng giá trị nào. Các trang đang có nhiều URL cho một đường dẫn vật lý. |
| Bằng chứng | Bảng truy vấn B.4 và khóa `versions` trong [đồ thị](../../verification/audit-06/reference-graph.json). |
| Trạng thái | đã tái hiện |
| Nguồn gốc | Có sẵn trong các trang trước preview-5. |
| Đề xuất sửa | Giữ danh sách khác biệt để đối chiếu khi đổi `v` trên preview-5. |
| Rủi ro khi sửa | Đồng bộ các URL hàng loạt có thể thay danh tính bộ nhớ đệm của trang cũ. |
| Cách kiểm sau sửa | Mở lại các trang thay đổi được duyệt và đối chiếu URL cùng nội dung phản hồi. |

### B-04 · Nhiều bản mã theo phiên bản có các đoạn trùng lặp

| Trường | Nội dung |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [natural/](../../assets/goi-viet/map-surroundings-preview/natural/) và các họ tệp trong bảng B.4. |
| Mô tả | Số byte giống nhau được tính trên dòng khớp theo thứ tự. Các bundle một dòng có nội dung khác nhau không bị quy thành bản gần giống chỉ vì số dòng sửa thấp. |
| Tái hiện | So theo họ tên sau khi bỏ hậu tố phiên bản ở thư mục hoặc tên tệp. Đọc bảng số dòng và byte chung. |
| Mong đợi / Thực tế | Giữ tệp các gốc vẫn dùng. Một số cặp chia sẻ phần lớn byte dù tên phiên bản và đường nạp khác nhau. |
| Bằng chứng | Bảng các cặp tại B.4. |
| Trạng thái | đã đo |
| Nguồn gốc | Có các cặp giữa các trang trước và sau preview-5. |
| Đề xuất sửa | Dùng kết quả để nhận biết nhánh riêng của từng bản khi duyệt thay đổi. |
| Rủi ro khi sửa | Gộp tệp có thể làm khác hành vi ở các trang cũ hoặc đổi đường dự phòng. |
| Cách kiểm sau sửa | Nếu có thay đổi được duyệt, chạy lại trang và công cụ được liệt kê trong CSV của từng tệp. |

### B-05 · Ứng viên xoá và liên kết tài liệu

| Trường | Nội dung |
|---|---|
| Mức độ | Ghi chú |
| Vị trí | [kiem-ke-tep.csv](kiem-ke-tep.csv) và [DE-XUAT-XOA.md](DE-XUAT-XOA.md). |
| Mô tả | Có các tệp chỉ xuất hiện ở tài liệu hoặc nhánh không đến được từ các gốc đang xét. |
| Tái hiện | Đọc chuỗi tham chiếu từ tám trang, worker, manifest, script trong tools/ và các hậu tố dựng động. Đối chiếu HTTP 200 của các luồng đã chạy. |
| Mong đợi / Thực tế | Ứng viên chỉ thuộc nhóm 4–5. Giữ đầu vào dựng tài nguyên và các trường hợp chưa đủ bằng chứng ở nhóm 3 hoặc 6. |
| Bằng chứng | [Bảng kê tệp](kiem-ke-tep.csv), [đồ thị](../../verification/audit-06/reference-graph.json) và [cạnh đã rà](../../verification/audit-06/reference-graph-reviewed.json). |
| Trạng thái | suy luận từ mã |
| Nguồn gốc | Tập nhiều đời tệp. Nguồn gốc theo từng tệp nằm ở cột commit cuối. |
| Đề xuất sửa | Duyệt từng thư mục hoặc từng tệp theo mục 10 của kế hoạch. |
| Rủi ro khi sửa | Xoá ứng viên nhóm 4 có thể làm hỏng liên kết hoặc hướng dẫn. Luồng hiếm và tham chiếu ghép còn là giới hạn của phép dò. |
| Cách kiểm sau sửa | Chạy tám trang vào, worker và các kiểm tra nền trước và sau thay đổi, đối chiếu log HTTP cùng console. |

## B.5 Đầu ra

- [Bảng kê từng tệp](kiem-ke-tep.csv)
- [Ứng viên xoá, rủi ro và lệnh theo từng thư mục](DE-XUAT-XOA.md)

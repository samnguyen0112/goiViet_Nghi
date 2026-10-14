# Bản đồ Gói Việt — vector có độ nổi và cảnh cố định

Bản nâng cấp đang hoạt động dùng `map-camera.js`, `map-vector-art.js`, `map-vector-scene.js` và `map-vector-layout.css`. `index.html` vẫn sở hữu DATA và động cơ hành trình. Chi tiết kiểm chứng và giới hạn: `verification/map-vector-upgrade-20261013/REPORT.md`.

34 hình tỉnh được dựng từ các cung địa lý dùng chung trong DATA, không lấy ranh giới từ mặt nạ ảnh. Camera, vùng bấm, nhãn, tuyến ray và công trình cùng tọa độ. Mỗi tỉnh có mặt trên và thành bên theo phép chiếu trực giao. Đây là cảnh có độ nổi trên canvas, không phải một cảnh WebGL đầy đủ.

Các tệp `map-frame-left-v4.webp`, `map-frame-middle-v4.webp`, `map-frame-right-v4.webp`, hạc và logo thuộc khung màn hình. Tranh có alpha thật; PNG gốc và prompt được giữ trong báo cáo. SVG `map-art/landmark-*-v4.svg` neo bằng chân công trình. Các nét địa lý, đảo và sóng được vẽ lại ở độ phân giải màn hình. Một lớp chất liệu tỉnh mờ chỉ dùng ở toàn cảnh, tắt khi zoom vượt 1,65 lần toàn cảnh.

Tái tạo số liệu vector: `python tools/build-map-vector-art.py`. Chuyển PNG cảnh sang WebP không mất dữ liệu: `python tools/build-map-frame-webp.py`. Kiểm tra mới: `node verification/map-vector-upgrade-20261013/check-vector.cjs`.

Ảnh tham chiếu là ảnh phẳng. Phong cảnh mới giữ phong cách nhưng không khớp từng pixel; dữ liệu địa lý hiện có được giữ, phép khớp bố cục là minh họa. Không coi bản sửa này là việc phục hồi bản vẽ gốc hoặc thẩm định lại dữ liệu địa chính.

## Ghi nhận phiên bản trước — 52 lớp ảnh

Phần dưới mô tả phiên bản ảnh cũ để đối chiếu. `map-source-scene.js` không còn được nạp làm renderer trong index hiện tại; các PNG/manifest cũ được giữ làm nguồn màu/chất liệu và lịch sử.

Bản sửa 2026-10-13. Xem `verification/map-repair-20261013/REPORT.md` và báo cáo so sánh; **chưa đạt pixel diff bằng 0**.

## Thành phần phiên bản trước

| Thành phần | Tệp |
|---|---|
| 34 tỉnh, địa hình, biển/đất, núi, mây, hạc, logo, công trình, đảo, ray | `map-art-v3/manifest.json`, các PNG và `.mask.png` riêng |
| Tọa độ, kích thước, thứ tự, không gian camera | `map-art-v3/layout.js` (tạo từ builder) |
| Atlas vùng bấm, tỉnh/đảo, đường biên, điểm nhãn và phép khớp địa lý | `map-art-v3/geometry.js`, `hit-atlas.png` |
| Vẽ lớp và nhãn thật, vùng chọn, hệ camera | `map-source-scene.js` |
| Bố cục, typography, nhóm điều khiển desktop/mobile | `map-source-layout.css` |
| Tranh Hà Nội và icon nguồn cho điều khiển | `map-source-layers/panel-art-manifest.json` và các PNG liên quan |
| Dữ liệu và động cơ tàu–thuyền, thẻ/câu chuyện/kỷ niệm | `index.html` |

Cảnh có vùng mở rộng mềm ngoài biên ảnh để khi kéo/xoay không lộ cạnh chữ nhật. Các vùng ngoài nguồn được coi là gần đúng. Các tỉnh là từng PNG alpha riêng. Renderer ghép 34 PNG vào một canvas trung gian để tránh khe alpha khi scale; đây là bộ đệm dựng hình từ các lớp, không phải ảnh tham chiếu. Đổi vị trí/kích thước một lớp trong cấu hình làm bộ đệm được ghép lại.

Các lớp địa lý dùng cùng camera. Logo và điều khiển dùng tọa độ giao diện. Hạc thuộc cảnh nên di chuyển cùng cảnh. Trên màn nhỏ, logo hiển thị trong nút trang chủ ở header. Công trình vẽ trước thân tàu; không tự tìm chỗ khác hoặc ẩn để né ray. Nhãn tỉnh chỉ dẫn chuột xuyên xuống vùng bản đồ, nhưng vẫn có thể focus và kích hoạt bằng bàn phím.

## Chỉnh lớp

`x/y/width/height` tính theo 1597 × 985. `z` điều khiển thứ tự. `space: map` đi cùng camera; `fixed` theo màn hình. Có thể chỉnh từng lớp trong `layout.js` hoặc chỉnh mask/tọa độ trong builder rồi tái tạo. `manifest.json` cung cấp bản dễ đọc và vùng nguồn.

Di chuyển tỉnh hoặc thay hình dáng tỉnh phải đồng thời cập nhật atlas/geometry; không chỉ thay vị trí ảnh rồi giữ vùng bấm cũ. Nhãn ga nằm trong mảng `specs` của renderer; nhãn tỉnh lấy từ geometry. Phông dùng Be Vietnam Pro và Playfair Display đã nhúng trong index.

Trang `verification/map-repair-20261013/layers.html` dùng để bật/tắt và thử di chuyển từng lớp; thao tác trên trang đó không ghi vào mã sản phẩm. Ô caro cho thấy alpha. Các PNG/mask vẫn sửa và thay thế độc lập.

## Tái tạo / kiểm tra

```powershell
python tools/build-map-art-v3.py
python -u -m http.server 8770 --bind 127.0.0.1
node verification/map-repair-20261013/verify-v3.cjs
node verification/map-repair-20261013/qa-flows.cjs final
python tools/compare-map-repair.py
```

Builder cần Pillow, NumPy, OpenCV và SciPy. Nó dùng ảnh tham chiếu đã lưu, các mask nguồn ở map-source-layers/ và geometry đã khớp với DATA. Harness ghi đường dẫn Chrome/Playwright của máy này; cập nhật khi chuyển máy. HTTP harness kiểm tra website thật. Bộ flows dùng fixture nguồn cô lập và chặn ảnh ngoài mạng để kiểm tra fallback.

## Nguồn thiếu

`missing-source.mask.png` và các trường `occlusionRepair` ghi những phần không có pixel gốc phía sau đối tượng/chữ/UI. Vật liệu bù ở đó là gần đúng, không phải thông tin được phục hồi. PNG tranh Hà Nội riêng có mask vùng chữ gốc và file bù được khai báo. Các giới hạn này và sai lệch chữ/khung/mép mask được báo trung thực trong REPORT.md.

Trang chủ, DATA, các ID và nội dung cũ được giữ. Browser kiểm thử không dùng hồ sơ hoặc reset phiên thật của người dùng.

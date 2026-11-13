# Ảnh ga và ngoại tuyến preview-5 — nghiệm thu sau rà soát

Ngày: 12/11/2026. Chỉ chỉnh preview-5 và tài nguyên riêng. Không commit, không push.

## Kết quả chính

- Đã sửa đủ 5 nhóm vấn đề. **18/18 bộ kiểm bắt buộc Đạt; 0 Lỗi; 0 Chưa chạy.** Có thêm ca lỗi 503 → thử lại và ca manifest cũ không ghi tệp, đều đạt.
- Giữ nguyên hash index.html, preview-2/3/4, community-postcards-5.js và conversation-cards-5.css từ đầu lượt này. Giữ khối p5-05-curtain-input, quy tắc :not(button *), chú thích có dấu và khóa js.postcard.filename. Arcs bản đồ không đổi.
- Còn **35 ảnh cục bộ + biểu tượng Hoàng Sa**, đủ 36 ga. Ảnh Tri Tôn đã gỡ khỏi assets, catalog, ghi công và manifest; không còn URL ảnh Wikimedia trong HTML preview-5.

## Bật ngoại tuyến bằng nút

Vào bản đồ → **Tùy chọn / Options** → **Chuẩn bị chạy không mạng / Prepare for offline use**. Nút báo khoảng **164 MB**, số tệp và thanh tiến độ; trạng thái xong/lỗi đổi theo VI/EN. Khi xong, có thể ngắt mạng, mở tab mới, tải lại và chọn đủ 36 ga. Mở file:// không cài worker và vẫn dùng tài nguyên cục bộ.

Probe xác nhận khi chỉ vào trang chủ và chưa bấm: **0 yêu cầu do worker tạo, 0 MiB từ worker, 0 tệp sách dữ liệu/ảnh trước khi mở sách**. Sau bấm: **491/491** tài nguyên, **35 tệp ảnh ga**, khoảng 142,2 MiB truyền qua mạng ở máy kiểm thử (nhỏ hơn tổng byte giải nén khoảng 164 MB). Có tiến độ trung gian và trạng thái hoàn tất VI/EN.

Đã thử cố tình trả 503 cho một request hn/book.js của worker: báo lỗi đúng hai ngôn ngữ, ready=false, nút bật để thử lại. Bỏ chặn và bấm lại: 491/491, ready=true, không lỗi.

[Ảnh Tùy chọn sẵn sàng VI](../../verification/offline-fix-5/screenshots/offline-options-ready-vi.png) · [EN](../../verification/offline-fix-5/screenshots/offline-options-ready-en.png) · [Ảnh lỗi](../../verification/offline-fix-5/screenshots/offline-options-error-vi.png)

## Scope, cache và chống bản cũ

- Chỉ đăng ký mới sau khi bấm; lần vào sau chỉ đọc registration đã có để nhận trạng thái. Scope chính xác là URL map-surroundings-preview-5.html. Probe xác nhận index/preview 1–4 không có registration điều khiển.
- Cài đặt cũ có scope rộng được chuyển sang scope hẹp khi online; chỉ gỡ registration cũ của chính worker này sau khi bản hẹp dùng được. Nếu đang offline với bản cũ, giữ khả năng chạy và chuyển khi có kết nối. Các tab đã mở dưới controller cũ sẽ thoát controller đó khi tải lại; browser không thay controller của tab đang mở chỉ vì unregister.
- Navigation và .html/.js/.css/.json lấy mạng trước, giữ query phiên bản và bỏ HTTP cache. Chỉ khi kết nối thất bại mới trả bản lưu. Ảnh/phông lấy cache trước. Không còn nhánh proxy fetch dành cho client của trang khác.
- Tài nguyên có SHA-256 khớp được dùng lại từ bộ cũ khi nâng cấp, giảm tải lại không cần thiết. Chỉ kích hoạt bộ mới khi đủ manifest; lỗi cài bản mới không xóa bộ cũ.
- `python tools/build-preview-5-offline.py --check` dựng lại trong bộ nhớ, không ghi. Cây hiện tại đạt. Fixture thay một tài nguyên chứng minh mã thoát 1 và byte/mtime manifest không đổi.

## Hoàng Sa — chờ người dùng chọn, chưa tải ứng viên

Ga hiện chỉ có biểu tượng tàu. photoTitle Việt/Anh trùng dòng Danh thắng: **Đảo Phú Lâm & Cụm đảo Hoàng Sa / Phú Lâm Island & the Hoàng Sa island cluster**; không hiển thị ghi công ảnh đã gỡ. Hai ứng viên chính dưới đây mới chỉ đọc trang mô tả/metadata, chưa tải và chưa kiểm tra cắt khung:

| Lựa chọn | Trang nguồn | Tác giả | Giấy phép nguồn | Kích thước | Lý do / cách ghi tên |
|---|---|---|---|---|---|
| 1 — ưu tiên ảnh địa danh | [Nhà trưng bày Hoàng Sa – Đà Nẵng](https://commons.wikimedia.org/wiki/File:Hoang_Sa_Exhibition_House,_Da_Nang.jpeg) | Linhcandng | CC BY-SA 3.0 (cũng có lựa chọn GFDL) | 4160 × 3120 | Công trình trưng bày lịch sử Hoàng Sa ở Đà Nẵng, tên tệp Hoang Sa/Da Nang. Nếu chọn, cả tiêu đề ảnh và Danh thắng sẽ ghi Nhà trưng bày Hoàng Sa – Đà Nẵng, không ghi là đảo Phú Lâm. |
| 2 — hướng tư liệu chủ quyền | [Phủ biên tạp lục về Hoàng Sa](https://commons.wikimedia.org/wiki/File:PhuBienTapLuc-HoangSa.png) | Lê Quý Đôn; bản số hóa do Doãn Hiệu đưa lên | Public Domain / PD-old-70-expired, PDM 1.0 | 7000 × 2320 | Tư liệu cổ thư, có [bản số hóa chữ Nôm gốc](https://lib.nomfoundation.org/collection/1/volume/884/page/69); tên tệp phiên âm Việt Nam. Phải giữ đủ đoạn tư liệu và đặt cùng chú thích/Danh thắng tương ứng. |

Đã đối chiếu thêm [Châu bản Hoàng Sa 1830](https://commons.wikimedia.org/wiki/File:ChauBanHoangSa2706a1830.jpg), 5500 × 1200, nhưng chưa đưa vào hai lựa chọn chính vì trang nguồn còn cảnh báo cần bổ sung căn cứ Public Domain tại Mỹ. Hồ sơ và giới hạn nằm trong [danh mục ứng viên](../../verification/station-photos-5/hoang-sa-candidates.md). Không dùng ảnh báo chí chưa rõ giấy phép. Không ứng viên nào đã được tải hoặc tích hợp.

## Đường dịch chung

Đã thêm 24 tiêu đề ảnh còn dùng, đồng bộ 4 bản EN đã có để đúng photoTitleEn, và dùng lại cặp Phú Lâm sẵn có. Đủ 36/36 photoTitle qua HIGHLIGHTS. Gỡ 15 mục bảng cũ không còn xuất hiện. Giữ mục Na Hang vì còn trong dữ liệu địa danh và câu hỏi; build chỉ còn **1 cảnh báo unused**, không lỗi, --check đạt. Đã sinh lại content-en-5.js và chạy walk đạt.

## Trạng thái từng bộ kiểm

Các tên ngắn dưới đây nằm trong verification/p5-books/scripts/. Mỗi hàng có log và mã thoát 0. Riêng bộ GD6 còn được đối chiếu mảng diffs với mốc, không chỉ dựa vào mã thoát.

| Bộ kiểm | Trạng thái | Kết quả / log |
|---|---|---|
| `tools/check-station-photos-5.cjs` | **Đạt** | 504 lượt: 490 ảnh + 14 biểu tượng; bấm chuẩn bị, mở tab mới/tải lại offline · [log](../../verification/offline-fix-5/logs/station-photos.log) |
| `tools/check-station-panel-5.cjs` | **Đạt** | 6 cỡ, hành trình/thẻ/kỷ niệm/bưu thiếp/sách · [log](../../verification/offline-fix-5/logs/station-panel.log) |
| `tools/verify-preview5-conversation-cards.cjs` | **Đạt** | 6 cỡ và trọn lượt chơi · [log](../../verification/offline-fix-5/logs/conversation-cards.log) |
| `tools/check-i18n-5.cjs --walk` | **Đạt** | Không còn chữ Việt sót, không lỗi trang · [log](../../verification/offline-fix-5/logs/i18n-walk.log) |
| `tools/build-content-en-5.cjs --check` | **Đạt** | 710 bản dịch, 36 ga, 144 thẻ; tệp sinh khớp · [log](../../verification/offline-fix-5/logs/content-en-check.log) |
| `python tools/build-preview-5-offline.py --check` | **Đạt** | Manifest khớp; không ghi tệp · [log](../../verification/offline-fix-5/logs/offline-manifest-check.log) |
| `tools/check-books-5.cjs --render` | **Đạt** | Không lỗi; giữ cảnh báo nội dung sách nháp · [log](../../verification/offline-fix-5/logs/books-render.log) |
| `verify-p5-01.cjs` | **Đạt** | 21/21 · [log](../../verification/offline-fix-5/logs/verify-p5-01.log) |
| `verify-p5-02.cjs` | **Đạt** | 43/43; ca C2 dùng đúng cardIds thử · [log](../../verification/offline-fix-5/logs/verify-p5-02.log) |
| `verify-dialog-lang-5.cjs` | **Đạt** | 17/17 · [log](../../verification/offline-fix-5/logs/dialog-lang.log) |
| `walk-presentation-p5-05.cjs` | **Đạt** | 8/8 tổ hợp; có tải PNG · [log](../../verification/offline-fix-5/logs/presentation.log) |
| `net-before-book-p5-05.cjs` | **Đạt** | 0 request sách trước mở, 3 sau mở; đếm cả worker · [log](../../verification/offline-fix-5/logs/net-before-book-p5-05.log) |
| `probe-offline-sw-5.cjs` | **Đạt** | Idle 0 worker / 0 sách; sau bấm 491/491; scope đúng · [log](../../verification/offline-fix-5/logs/probe-offline-sw-5.log) |
| `probe-offline-stale-5.cjs` | **Đạt** | JS/CSS/JSON ?v mới và navigation tới mạng; cache fallback khi offline · [log](../../verification/offline-fix-5/logs/probe-offline-stale-5.log) |
| `check-file-url.cjs` | **Đạt** | file:// vẫn hoạt động; không worker · [log](../../verification/offline-fix-5/logs/file-url.log) |
| `check-shared-files-p3p4.cjs` | **Đạt** | Preview-3/4 giống hệt · [log](../../verification/offline-fix-5/logs/shared-p3p4.log) |
| `scan-layout-en-5.cjs` | **Đạt** | 0 lỗi chỉ ở EN, cả 5 cỡ · [log](../../verification/offline-fix-5/logs/layout-en.log) |
| `tools/perf/verify-gd6-functional.cjs --a verification/p5-books/baseline/map-surroundings-preview-5.html --b map-surroundings-preview-5.html --out ../../../../verification/p5-books/p5-05/gd6-functional-offline-fix.json` | **Đạt** | Đúng 13 khác biệt, khớp từng dòng; 0 lỗi · [log](../../verification/offline-fix-5/logs/gd6-functional.log) |

**Ca bổ sung:** [503 → thử lại](../../verification/offline-fix-5/logs/probe-offline-retry-5.log) và [manifest cũ → exit 1, không ghi](../../verification/offline-fix-5/logs/manifest-stale-fixture.log) đều Đạt.

[Tổng hợp trạng thái JSON](../../verification/offline-fix-5/final-results.json) · [Báo cáo 504 lượt ga](../../verification/station-photos-5/e2e/report.json) · [GD6 mới](../../verification/p5-books/p5-05/gd6-functional-offline-fix.json)

## Hồ sơ ảnh và bàn giao

- [Catalog 36 ga: 35 ảnh + 1 placeholder](../../assets/goi-viet/station-photos-5/catalog.json), [ghi công](../../assets/goi-viet/station-photos-5/CREDITS.md), [hướng dẫn bảo trì và --check](../../assets/goi-viet/station-photos-5/README.md).
- [Bảng ảnh desktop 1](../../verification/station-photos-5/e2e/desktop-contact-1.jpg), [desktop 2](../../verification/station-photos-5/e2e/desktop-contact-2.jpg); [mobile 1](../../verification/station-photos-5/e2e/mobile-contact-1.jpg), [mobile 2](../../verification/station-photos-5/e2e/mobile-contact-2.jpg). Các bảng đã thay Hoàng Sa bằng biểu tượng.
- Cập nhật mục 5 và danh sách tệp mục 9 của BAO-CAO-P5-05.md; không xóa lịch sử nghiệm thu P5-05.
- Các harness trong verification được sửa theo yêu cầu nhưng thư mục này bị Git bỏ qua, nên chúng hiện nằm trong workspace. Không stage/commit/push.

**Việc chờ duy nhất:** người dùng chọn ứng viên Hoàng Sa; chưa tải hoặc áp ảnh mới. Khi được chọn, cập nhật đồng thời tiêu đề, Danh thắng, catalog/ghi công, bản dịch và manifest, rồi kiểm lại khung.

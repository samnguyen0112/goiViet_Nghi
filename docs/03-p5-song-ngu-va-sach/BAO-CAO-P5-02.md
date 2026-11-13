# Báo cáo P5-02 — Hai chế độ tại ga, trang chờ, fanpage và sửa lỗi mở nhầm bộ thẻ

- **Ngày** 10/11/2026 · theo [plan.md](plan.md) mục P5-02 · nhánh `p5-02` (tách từ `main` 2089faf).
- **Trạng thái** Hoàn thành, **chưa commit**. Bốn điều kiện qua bước đều đạt (mục 4). Bộ kiểm thử P5-02: **43/43 ca đạt**.
- **Bằng chứng** `verification/p5-books/` (thư mục bị `.gitignore` bỏ qua): `p5-02-verify.json`, ảnh trong `p5-02-verify/`, nhật ký hồi quy `regress-p5-02.log`.

## 1. Tóm tắt

| Hạng mục | Kết quả |
| --- | --- |
| Hai chế độ ở mọi lối vào | Khung ga trong panel, thẻ **Đã đến** trên thanh hành trình, nút **Khám phá** khi đang ở ga, ảnh danh thắng của ga, ống xăm, lá bài: tất cả đi qua **một hàm** `openPlaceMode(placeId, mode, { source, cardId })`. |
| Sửa lỗi mở nhầm bộ thẻ (P5-00) | Bộ thẻ có trạng thái riêng `state.deckPlaceId`. Mở bộ thẻ không còn đổi ga đang chọn; rút lá, xáo lại và hoàn thành lượt đều lấy ga của bộ thẻ đang mở. |
| Bỏ đường đọc truyện demo công khai | Không còn lối nào gọi bộ đọc truyện cũ (`openStoryModal`): đã đếm bằng công cụ đo trong mọi ca kiểm thử, **0 lần gọi**. 12 truyện đã thẩm định giữ nguyên trong dữ liệu và được chép ra làm tư liệu cho nhóm. |
| Trang **Sắp có** | Thêm lời mời gửi chuyện (món ăn, tiếng gọi, phong tục, ảnh tự chụp, tên tỉnh cũ trước sáp nhập), **mã QR SVG tĩnh** và **nút fanpage** (mở tab mới), kèm lời hứa xin phép trước khi đăng. Vẫn hiện đủ khi mất mạng. Không ghi dấu "đã đọc". |
| Lá bài → sách → lá bài | Lá của tỉnh có sách đọc được hiện lời mời **Đọc sách về …**. Sách mở chồng lên bộ thẻ; đóng sách là về đúng lá, đúng mặt, ấn sen đã mở, nháp ký ức còn nguyên. Phần sách có `cardIds` chứa lá đó thì mở thẳng tới phần ấy. |
| Ghi dấu "đã đọc" | Chỉ khi nội dung sách thật đã hiện (sự kiện `goiviet:bookshown`). Trang chờ và trang lỗi không tính. Bưu thiếp ghi "(Đã đọc sách)". |
| Câu hoạt động phụ thuộc tranh | 17 lượt dùng chung câu "nhìn bức tranh minh họa trong câu chuyện" được viết lại thành nhìn quanh nơi cả nhà ngồi hoặc ảnh danh thắng trong khung ga; 1 câu của `hn-c2` sửa tương tự. |
| Chữ giao diện mới | Viết bằng lõi song ngữ (`i18n-5.js`) ngay từ đầu, có đủ VI và EN; đổi ngôn ngữ trực tiếp cập nhật nhãn. |

## 2. Rà soát trước khi làm (các chỗ phải sửa)

1. **Lỗi mở nhầm bộ thẻ** có gốc ở chỗ bộ thẻ đọc `state.selectedPlaceId`, mà biến này là ga chọn để đi tiếp. Nút Khám phá ở thẻ Đã đến lại đặt lại biến này khi mở truyện. Kết quả: tới Huế, đã chọn trước TP.HCM, bấm thẻ thì ra bộ TP.HCM.
2. **Năm lối đọc truyện demo công khai:** ảnh danh thắng ở khung ga, ngăn "Câu chuyện văn hóa" (4 truyện mỗi ga), nút Khám phá trên thanh hành trình và thẻ Đã đến, nút đọc của ống xăm, hộp gợi ý truyện trên lá bài.
3. **Chữ mô tả chuỗi ba bước cũ** ("1. Ngắm danh thắng • 2. Đọc mẩu chuyện xưa • 3. Rút thẻ bài") ở biểu ngữ đến ga; ghi chú "Mở câu chuyện để khám phá ga" ở khung ga; nhãn bưu thiếp "Đã đọc chuyện"; nhãn ống xăm "Đọc chuyện văn hóa".
4. **17 câu hoạt động** dựa vào "bức tranh minh họa trong câu chuyện", không còn hiện khi truyện demo bị ẩn.
5. **Sách mở chồng lên bộ thẻ** cần khóa bộ thẻ (`inert`, `aria-hidden`) để Tab và trình đọc màn hình không lọt xuống dưới.

## 3. Tệp mới và tệp sửa

Mọi tệp dưới đây **chỉ preview-5 nạp** (đã dò `<script>`/`<link>` của mọi trang HTML). `index.html`, preview 1–4 và các tệp dùng chung không đổi.

| Tệp | Việc |
| --- | --- |
| `map-surroundings-preview-5.html` | `openPlaceMode`, `state.deckPlaceId` + `getDeckPlace()`, lời mời sách trên lá bài, ống xăm mở sách, khóa bộ thẻ khi sách ở trên (bộ thẻ đang mở không bị đẩy lại vào ngăn tiêu điểm), chữ biểu ngữ/bưu thiếp, viết lại 18 câu hoạt động, trỏ sang `journey-system-5.js` và `fortune-ritual-5.js`, tăng `?v=` các tệp đã sửa. |
| `map-surroundings-preview/journey-system-5.js` (**mới**) | Chép từ `journey-system-4.js` (preview-4 giữ bản cũ). Thẻ Đã đến có hai nút **Chơi thẻ / Đọc sách** của ga vừa đến; nút Khám phá khi đang ở ga hiện lại hai nút đó thay vì mở truyện; nhãn theo ngôn ngữ. |
| `map-surroundings-preview/fortune-ritual-5.js` (**mới**) | Chép từ `fortune-ritual.js` (5 trang khác đang dùng), chỉ đổi nhãn nút thành **Đọc sách văn hóa**. |
| `map-surroundings-preview/station-panel-5.js`, `.css` | Ảnh ga mở sách; bỏ ngăn truyện demo; Khám phá đưa tiêu điểm tới hai nút chế độ kèm hiệu ứng nhắc; kiểu hai nút trên thẻ Đã đến; nhãn "Đã đọc sách". |
| `map-surroundings-preview/conversation-cards-5.js` | Hiệu ứng rút lá lấy ga của bộ thẻ đang mở. |
| `map-surroundings-preview/i18n-5.js` | 15 khóa mới VI/EN cho trang chờ, lời mời trên lá bài và thẻ Đã đến. |
| `books-5/book-reader-5.js`, `.css` | Lời mời + QR + nút fanpage ở trang chờ (không hiện ở trang lỗi); mở từ lá bài tới phần có `cardIds`; phát `goiviet:bookshown`. |
| `books-5/catalog-5.js` | `GoiVietBookContribute = { url, qr }`. Xóa `url` là ẩn lời mời. |
| `books-5/fanpage-qr.svg` (**mới**) | QR phiên bản 6, sửa lỗi mức Q (chịu được lóa máy chiếu), 3 KB, tạo bằng segno 1.6.6 từ URL fanpage đã kiểm 09/11. |
| `books-5/_mau/TU-LIEU-TRUYEN-DA-THAM-DINH.md` (**mới**) | 12 truyện đã thẩm định của HN, Huế, TP.HCM kèm nguồn và mã lá bài liên quan, cho nhóm làm trang `notes`. |
| `books-5/_mau/HUONG-DAN-NHAP-NOI-DUNG.md` | Ghi rõ tác dụng của `cardIds` và chỉ tới tệp tư liệu trên. |
| `tools/check-station-panel-5.cjs` | Cập nhật theo luồng mới: bỏ ca ngăn truyện, thêm ca ảnh ga mở sách và Khám phá đưa tới hai nút. |

## 4. Điều kiện qua bước

`verification/p5-books/scripts/verify-p5-02.cjs`: **43/43 ca đạt**, bấm thật trên preview-5, chặn mọi mạng ngoài (như khi mất mạng).

| Điều kiện trong plan | Kết quả |
| --- | --- |
| Mọi lối vào đi đúng trạng thái | **Đạt.** Bấm Hà Nội trên bản đồ (tìm điểm bằng chính hàm dò của bản đồ), tìm "da nang" trong danh sách, nút đảo Hoàng Sa, ảnh danh thắng, thẻ Đã đến, ống xăm, lá bài, nút Chơi thẻ của trang chờ: mỗi lối mở đúng chế độ của đúng ga, đóng thì tiêu điểm về nút nguồn. |
| Chọn ga mới khi tàu đang chạy, đọc tại ga vừa tới, bấm Chơi thẻ thì mở đúng bộ của ga vừa tới | **Đạt.** Hà Nội → Huế, chọn TP.HCM khi tàu đang chạy. Tới Huế: **Đọc sách** mở sách Huế, **Chơi thẻ** mở "Thẻ trò chuyện · TP. Huế", lá rút là `hue-c1`, hoàn thành lượt ghi dấu cho Huế; ga chọn tiếp vẫn là TP.HCM và bộ TP.HCM chưa bị rút lá nào. |
| Từ lá đang mở dấu sen sang sách rồi quay lại vẫn giữ nháp và trạng thái lá | **Đạt.** Lá `hn-c1`, đã mở ấn, nháp "Nam Định / Bánh cuốn sáng chủ nhật": trước và sau khi đọc sách giống hệt nhau; trong lúc đọc, bộ thẻ bị `inert` + `aria-hidden`; đóng sách tiêu điểm về nút Mở sách. Đi tiếp tới bìa sau bấm Chơi thẻ vẫn về đúng lá; một lần Escape đóng bộ thẻ, không bị chồng hai lớp. |
| Quét đủ 36 điểm: chỉ tập có trong danh mục mới mở sách, còn lại vào trang chờ | **Đạt.** Công khai: 36/36 hiện Sắp có, đủ lời mời, link fanpage đúng (tab mới, `noopener noreferrer`), QR tải được từ tệp cục bộ, không tải dữ liệu sách nào, không ghi dấu đã đọc. Với `?sach=nhap`: đúng 4 ga mở sách (HN, Huế, TP.HCM, Thanh Hóa), 32 ga Sắp có, và chỉ 4 ga đó được ghi "đã đọc". |

Ca bổ sung cũng đạt: trang lỗi tải không hiện lời mời và không ghi dấu; xóa `url` trong danh mục thì ẩn lời mời; tiếng Anh (thẻ Đã đến, trang chờ, lời mời trên lá bài, đổi ngôn ngữ trực tiếp); màn 1366×768 (hai nút cao 40 px không tràn chữ, trang chờ kèm QR vừa màn hình); 0 lỗi trang ở mọi ca.

## 5. Lỗi tìm ra khi kiểm thử và đã sửa

1. **Mất tiêu điểm sau đường lá bài → sách → bìa sau → Chơi thẻ.** Bộ thẻ đang mở bên dưới bị đẩy vào ngăn tiêu điểm lần thứ hai, nên khi đóng bộ thẻ tiêu điểm rơi về `body`. Sửa trong `openDeckModal`: bộ thẻ đang mở cho đúng ga thì giữ nguyên, không đẩy thêm lớp. Ca C7 đạt sau khi sửa.
2. **Lời mời trên lá bài ghi "Đọc sách về TP. Hà Nội"** (tiếng Anh thành "Read the TP. Hà Nội book"). Bỏ tiền tố "TP./Thành phố/Tỉnh" như khung ga đang làm.
3. **Nút ống xăm vẫn ghi "Đọc chuyện văn hóa"** dù đã mở sách. `fortune-ritual.js` dùng chung với 4 trang khác nên tách bản `-5`, chỉ đổi nhãn thành "Đọc sách văn hóa".
4. **Câu đọc cho trình đọc màn hình khi tàu đến** còn "Chọn Khám phá để mở câu chuyện." Đổi thành "Chơi thẻ hoặc đọc sách để tìm hiểu vùng đất này." (có bản EN).
5. Dọn mã chết do P5-02 tạo ra: hàm vẽ ngăn truyện cũ và phần nhớ trạng thái ngăn trong `station-panel-5.js`, hàm `openStoryFromCardContext`, biến thừa trong `drawOneCard`.

## 6. Hồi quy

Chạy lại sau lần sửa cuối (nhật ký `regress-p5-02.log`, `regress-p5-02-b.log`):

| Bộ kiểm | Kết quả |
| --- | --- |
| `verify-p5-01.cjs` (trình đọc sách) | **20/20 đạt** |
| `tools/check-books-5.cjs` và `--render` | 0 lỗi; 0 trang tràn chữ ở cả 5 tập, hai ngôn ngữ (như P5-01) |
| `tools/verify-preview5-conversation-cards.cjs` (thẻ bài, 6 cỡ màn hình, trọn một lượt chơi) | **PASS** |
| `tools/check-station-panel-5.cjs` (khung ga của Codex, đã cập nhật theo luồng mới) | **PASS** |
| `check-file-url.cjs` (mở thẳng tệp HTML bằng `file://`) | Sách mở được, 0 lỗi |
| Ca chức năng GĐ6, mốc P5-00 so với hiện tại | 0 lỗi mỗi bên. 13 khác biệt, **trùng khớp từng dòng** với lần chạy ngày 09/11 sau khung ga mới của Codex (đã merge): bỏ bộ lọc chủ đề, chữ "không tìm thấy" mới, Escape bỏ chọn ga. P5-02 **không thêm khác biệt nào**. |
| Trang khác | Không tệp nào preview 1–4 hay `index.html` nạp bị sửa; `journey-system-4.js` và `fortune-ritual.js` giữ nguyên. |

**Chi phí tải:** không thêm yêu cầu nào lúc mở trang (hai tệp `-5` thay đúng chỗ hai tệp cũ). Tổng các tệp tăng khoảng 3,6 KB gzip. QR (0,8 KB gzip) chỉ tải khi mở trang Sắp có.

## 7. Ảnh để xem nhanh (`verification/p5-books/p5-02-verify/`)

- `B1-arrival-hue-next-hcm-1920.png`: tới Huế khi đã chọn TP.HCM, thẻ Đã đến có hai nút.
- `B3-deck-hue-1920.png`: bộ thẻ Huế mở từ thẻ Đã đến.
- `C1-card-book-invite-1920.png`, `C2-book-over-card-1920.png`: lời mời đọc sách trên lá bài và sách mở chồng lên lá.
- `A4-coming-soon-dn-vi-1920.png`, `E2-coming-soon-en-1920.png`, `G2-coming-soon-1366.png`: trang Sắp có VI/EN kèm QR.
- `E1-arrival-en-1920.png`, `G1-arrival-1366.png`: thẻ Đã đến bản tiếng Anh và màn 1366×768.

## 8. Còn lại và lưu ý

- **Cả 4 tập vẫn là `draft`**, nên khách xem công khai sẽ thấy trang Sắp có ở mọi tỉnh. Buổi thuyết trình: mở với `?sach=nhap`, hoặc đổi tập đã đủ nội dung sang `published` trong `catalog-5.js`.
- **Thuộc P5-03:** tên tỉnh vẫn là tiếng Việt trên trang tiếng Anh ("Coming soon · TP. Đà Nẵng", "Read the Hà Nội book"); tiêu đề thẻ Đã đến ("Đã đến Huế"), chú thích thanh hành trình, biểu ngữ đến ga và phần còn lại của giao diện cũ chưa dịch. Lời mời trên lá bài đang mở không tự đổi ngôn ngữ cho tới lá kế tiếp.
- **Đã bỏ qua phần tùy chọn** dấu 📖 trên ghim bản đồ (plan ghi "làm nếu còn thời gian").
- **Mã còn lại nhưng không có lối công khai:** `openStoryModal` và hộp truyện cũ (dữ liệu truyện vẫn được lá bài tham chiếu); kiểu CSS của ngăn truyện cũ trong `station-panel-5.css`.
- **QR chưa được giải mã bằng máy** trong lần kiểm này (không có thư viện đọc QR offline); tệp được tạo trực tiếp từ URL, sinh lại bằng `make-fanpage-qr.py` cho ra đúng từng byte. Nên quét thử bằng điện thoại một lần trước buổi thuyết trình.
- Ở tiếng Anh, nút "Send it via the Gói Việt Facebook page" xuống hai dòng ở 1920 px; vẫn đọc rõ.

## 9. Cập nhật sau P5-02 (10/11, trước khi commit): trang "Tủ sách cộng đồng"

- 32 ga **không có trong danh mục sách** chuyển sang bố cục mới: bưu thiếp danh thắng (ảnh `books-5/postcards/<mã ga>.webp`, chú thích VI/EN trong `community-postcards-5.js`), lời mời gửi chuyện, nút fanpage, QR và nút Chơi thẻ. 4 tập nháp (HN, Huế, TP.HCM, Thanh Hóa) khi chưa có `?sach=nhap` vẫn dùng trang Sắp có cũ.
- Đã kiểm lại trên đúng trạng thái này: `verify-p5-02.cjs` 43/43 (ca E2 đổi theo chữ tiếng Anh mới "Send via Facebook" / "Scan to open Facebook"), `check-station-panel-5.cjs` PASS (có thêm ca 32 lời mời cộng đồng), bộ test thẻ PASS. Đủ 32 ảnh và 32 chú thích, ảnh tải được khi chặn mạng ngoài.
- Cần nhóm xác nhận nguồn và quyền dùng của 32 ảnh bưu thiếp trước khi công khai.

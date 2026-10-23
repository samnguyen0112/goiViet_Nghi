# Bộ lớp Miền ký ức — revision 2

Chuẩn bố cục: ảnh chính thức 971 × 1619 tại `sources/official-reference.png`. Không đưa ảnh tham chiếu nguyên trang vào giao diện.

`layers.json` ghi nguồn, mặt nạ và tọa độ native cho **60 lớp**. Trong đó **27 lớp đồ vật lấy pixel trực tiếp từ ảnh gốc**, 33 lớp còn lại chia phong cảnh, sông, hoa lá, núi, mây, thuyền, bản đồ mờ và phần giấy còn dư. Hoa lá được nhóm theo cụm cảnh, không tuyên bố mỗi chiếc lá là một lớp độc lập.

## Đồ vật gốc

- Bát phở, khay tre, chén nước chấm, cụm hoa lá và hơi nóng.
- Cổng làng, mái ngói, cửa gỗ, xe đạp và thư tay.
- Giỏ tre phía sau, mặt đan và đôi bàn tay.
- Khung cửa, dây nhài, bàn gỗ, ấm sứ, hai chén và giấy viết tay.
- Phần mặt sau lá bài nhìn thấy trong ảnh.
- Cầu đá, đường ray, bốn đoạn toa và đầu máy nhỏ ở đúng vị trí cuối tranh.

## Phong cảnh

Ba đoạn sông dùng tranh gốc và mặt nạ theo bờ sông. Núi đầu cảnh, núi cuối cảnh, vịnh, bản đồ Việt Nam trong sương, ba thuyền buồm đỏ và thuyền đánh cá nhỏ, mây và tiền cảnh có lớp riêng. Phần cảnh đang nhìn thấy giữ pixel ảnh gốc; imagegen chỉ phục hồi phần bị chữ/đồ vật che, phục hồi thẻ và tạo cầu nối giữa hai cảnh khác nhau.

`card-front.webp` và `card-back.webp` phục hồi từ chi tiết tham chiếu; chữ câu hỏi/category là HTML. `seam-landscape.webp` có mép dưới được đăng ký lại với đúng phong cảnh đầu chương; canvas mép trên lấy hình trang chủ hiện tại. `mobile-river.webp` chỉ ghép nước, không kéo dài các cụm cây và đồ vật cùng dòng nước.

## Dựng và kiểm tra

- `tools/memory-reference-v2-spec.cjs`: mặt nạ và tọa độ chuẩn.
- `tools/build-memory-reference-v2.cjs`: xuất WebP alpha, vật liệu thẻ, vùng nối và bảng đối tượng.
- `tools/integrate-memory-reference-v2.cjs`: ghép các lớp vào chương HTML.
- `tools/check-memory-reference-v2.cjs`: bố cục 9 màn hình và tương tác chính.
- `tools/check-memory-reference-v2-edge-cases.cjs`: chạm, bàn phím, reduced motion, lỗi tải, nhạc và vòng đời bản đồ.
- `tools/review-memory-reference-v2.cjs`: xác minh pixel đồ vật, nguồn, tài nguyên và cú pháp.

Các đường dẫn trên tương đối từ gốc repository. Báo cáo và ảnh kiểm chứng: `verification/memory-reference-v2/`. Các PNG trong `sources/` và ảnh tham chiếu chỉ phục vụ sản xuất/đối chiếu, không phải tài nguyên cần tải khi chạy trang.

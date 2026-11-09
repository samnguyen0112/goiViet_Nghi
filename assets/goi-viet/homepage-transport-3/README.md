# Preview-3: tàu và dáng cò theo preview-2

Chỉ dùng trên trang chủ `map-surroundings-preview-3.html`. Không sửa hình, HTML, chuyển động bánh hay khói của đoàn tàu ở cuối chương ký ức. Không thay `index.html`, preview-2, các bộ cảnh v8/v9 hoặc bộ cò dùng chung.

## Tài nguyên

- `references/preview2-train.webp`, `references/preview2-bird-one.webp`: ảnh gốc trích nguyên byte từ bộ cảnh 4K mà preview-2 đang dùng. Các bản `*-visible.png` chỉ làm nền sáng cho ảnh tham chiếu, không dùng trên website.
- `train-restored-source.png`: tàu được phục hồi bằng công cụ tạo ảnh tích hợp, theo đúng mẫu tàu cũ. Nguồn 2172 × 724; phần tàu có alpha được đóng gói thành `train-2k.webp` (1387 × 137) và `train-4k.webp` (2774 × 274), cùng tỷ lệ mẫu cũ. Hai hậu tố chỉ mức cảnh sử dụng, không khẳng định ảnh nguồn được tạo ở 4K.
- `crane-body-source.png`: phần thân không cánh được vẽ lại bằng công cụ tạo ảnh tích hợp; dáng cò preview-2 là tham chiếu chính, thân cũ của rig chỉ là tham chiếu cách tách bộ phận.
- `crane-parts.webp`: texture 2048 × 512; thay ô thân đầu tiên, giữ nguyên alpha và RGB nhìn thấy của hai cánh cũ. Không dùng các ảnh tư thế khác góc độ, không trộn ảnh để giả chuyển động.
- `transport.js`: chỉ đổi lớp `train` và vị trí `smoke` của cảnh trang chủ preview-3. Chuyển tàu cũ về một ảnh phẳng hoàn chỉnh thay cho bốn đoạn hiệu chỉnh phối cảnh. Giữ ray ở y = 1294, đặt lại khói theo ống khói.
- `poster-2k.webp`, `poster-4k.webp`: xuất từ chính cảnh preview-3 và rig mới, dùng cho giảm chuyển động và khi cảnh động không tải được. Việc chép WebGL khi xuất ảnh chỉ là bước tạo tài nguyên, không diễn ra mỗi khung trong website.
- `build.json`: vùng cắt, vị trí, kích thước và dấu kiểm tra nguồn.

`homepage-crane-flight-3.js` là bản riêng của preview-3. Giữ nguyên hàm pha, nhịp, chuyển động cánh/cổ/chân và cơ chế WebGL hiển thị trực tiếp; chỉ đổi nguồn texture và nới vùng lưới thân để không cắt dáng mới. `homepage-layered-scene-3.js` áp dụng phần thay tàu sau khi tải bộ cảnh, nên giữ nguyên phần màu P1 và các lớp phong cảnh hiện có.

Tạo lại tài nguyên: `node tools/build-home-transport-3.cjs`. Xuất ảnh tĩnh: `node tools/check-home-transport-3.cjs posters`. Kiểm tra: `verify`; đo đối chiếu: `performance`. Công cụ thử nghiệm dùng máy chủ localhost và Chrome riêng, tự đóng sau khi chạy. Dữ liệu kiểm chứng nằm trong `verification/home-train-crane-20261023/`.

## Cách tạo ảnh

Dùng **công cụ imagegen tích hợp**, nền trong suốt, không dùng CLI/API dự phòng. Hai prompt đầy đủ được lưu trong `PROMPTS.md`. Ảnh được sao chép vào dự án; website không phụ thuộc đường dẫn ảnh trong thư mục Codex.

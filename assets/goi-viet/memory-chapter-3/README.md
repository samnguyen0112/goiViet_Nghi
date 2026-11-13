# Miền ký ức · Preview 3

Tham chiếu chính thức: `references/approved-concept.png` và `../../../docs/01-preview-3-mien-ky-uc/PLAN-MIEN-KY-UC-PREVIEW-3.md`. Ảnh tham chiếu không được tải bởi trang chạy thật.

## Các lớp được sản xuất riêng

- `taste`: bát phở, bàn tre và cây; hơi nóng là lớp CSS riêng.
- `story`: cổng làng, xe đạp và lá thư trống; góc thư là chi tiết CSS riêng.
- `tradition`: bàn tay đan tre; bàn tay giữ tĩnh, không tạo chuyển động giả.
- `tea`: bàn trà và khung cửa; chữ của phần lá bài nằm ở lớp HTML bên trên, không in vào tranh.
- `water`: chất liệu nước, đặt trong SVG pattern; đường sông và gợn sáng được điều khiển bằng SVG/CSS.

Bốn cụm đầu có alpha thật, đã kiểm tra kênh trong suốt khi xuất. Bản PNG nguồn được giữ trong `sources/`. Các file WebP thường có chiều rộng 1100px, bản `-small` rộng 600px. `water.webp` rộng 600px. Kích thước và dung lượng chính xác nằm trong `manifest.json`.

Tạo bằng công cụ image_gen tích hợp, với ảnh concept và phong cảnh preview-3 làm tham chiếu. `prompts.json` lưu prompt; prompt taste được tóm tắt, các prompt còn lại lưu nguyên nội dung gửi công cụ. Không dùng ảnh chụp cả mockup làm background trang hoặc mặt thẻ.

## Tài nguyên tái sử dụng

- Núi xa, núi giữa, núi gần và thung lũng sông: `../homepage-balanced-3/`.
- Cầu, tàu và mây: `../homepage-layered/`.
- Mặt lưng thẻ: phong cảnh `../homepage-layered-poster-3.webp`, trang trí trong khung CSS.
- Chất liệu giấy: `../paper.svg`, lặp ở kích thước nhỏ.
- Font: Lora đã có trong `home-story-3.css`, nội dung dùng font sans sẵn có của dự án.

Các mảng núi gốc thuộc một cảnh nhiều lớp, có mép đăng ký theo cảnh. CSS mask che mép khi dùng ở vị trí mới. Cầu và tàu giữ tỷ lệ riêng; tàu được lật hướng để đầu máy tiến vào hành trình.

## Nội dung và tương tác

HTML thật nằm trong `map-surroundings-preview-3.html`; bố cục và controller là `memory-chapter-3.css` / `memory-chapter-3.js` trong `../map-surroundings-preview/`.

Chín câu hỏi chia đều ba nhóm. Thẻ có hai mặt, khung, biểu tượng, nhãn và câu hỏi độc lập; không thu câu trả lời. Câu hỏi mới được thông báo bằng vùng live; nút không mất focus lúc lật.

Cuộn dùng một vùng `#introScreen`. Nút “Bắt đầu” cuộn tới chương, “Vào bản đồ” đi nhanh, CTA cuối qua đúng `closeIntroModal()` hiện có. Không có URL fanpage trong nguồn được xác minh nên không tạo liên kết giả.

Chuyển động chạy theo vùng nhìn; giảm chuyển động tắt parallax, hiệu ứng nền và lật 3D nhưng giữ thao tác. Renderer trang chủ tạm dừng khi đi sâu vào chương, tách khỏi trạng thái nhạc người dùng chọn.

## Tạo lại tài nguyên và kiểm tra

`node tools/build-memory-art-3.cjs` xuất lại bốn cụm từ PNG nguồn. Thông số và prompt nước được giữ riêng trong nguồn; tool build cũng xuất lại nước khi nguồn tồn tại.

Các bài kiểm tra chuyên biệt nằm trong `tools/check-memory-chapter-3.cjs`, `tools/check-memory-chapter-edge-cases.cjs` và `tools/inspect-memory-3.cjs`. Kết quả, ảnh và giới hạn kiểm chứng nằm trong `verification/memory-chapter-3/`.

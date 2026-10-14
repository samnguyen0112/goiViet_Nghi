# Phong cảnh Canvas của trang chủ

Nguồn: `exports/landscape-layers-lab-20261012`. Bộ vẽ được sao chép từ `scene.js`; 63 ảnh được đăng ký theo tọa độ 3840 × 2378, trong đó các vật thể có alpha thật.

`tools/build-homepage-layered.cjs` tạo hai gói ảnh, manifest, bộ vẽ dùng chung và hai ảnh dự phòng. Chạy lại sau khi sửa asset, độ sâu hoặc chuyển động trong bản thử. Gói 2K giảm kích thước ảnh riêng lẻ; tọa độ bố cục không thay đổi. Gói 4K giữ nguyên ảnh WebP lossless của bộ asset đã kiểm tra.

`homepage-layered-scene.js` tải gói phù hợp và đưa bộ vẽ vào giao diện điều khiển hiện có. `homepage-layered-opening.js` thêm phần xuất hiện ban đầu trên cùng bộ vẽ. Mốc logo/chữ/nút, lựa chọn nhạc, bỏ qua/phát lại và điều hướng bản đồ vẫn dùng các file điều khiển/CSS hiện có.

Mây dùng phép dịch chuyển ngang, với biên độ và chu kỳ theo độ sâu. Sương dưới cầu được vẽ sau núi gần; mây tiền cảnh có đường che khuất cố định theo sống núi. Núi, cầu, tàu, công trình không bị biến dạng. Khi tab bị ẩn hoặc rời trang chủ, bộ điều khiển hiện có dừng vẽ.

Chân trụ cầu được phục dựng ở phần ảnh gốc bị mây che. Dải mây/sương dưới cầu nằm sau cầu; đường núi tiền cảnh cố định che phần trụ đi vào sườn núi. Mặt cầu và vòm đã nhìn thấy giữ nguyên pixel gốc. `tools/verify-bridge-feet.cjs` kiểm tra sự liên tục của trụ, alpha rỗng bên trong vòm, phần ảnh gốc được giữ và chân trụ không mất khi mây trôi. Báo cáo/ảnh nằm trong `verification/bridge-feet-fix-20261013`.

Phần mở cảnh cho sáu đối tượng núi hiện dần tại vị trí cuối cùng, theo các mốc riêng ở ba độ sâu. Chân núi bị che được phục dựng bằng ImageGen để không lộ vết cắt khi núi hiện riêng. Mây và cò chuyển động ngay trong lúc xuất hiện; cây, công trình, cầu/tàu, lá và hoa vào cảnh theo nhịp riêng. Không có màn quét chung từ trên xuống hoặc di chuyển các lớp núi. Phần chữ/nút giữ mốc 12 giây hiện có. Có tám lá và mười cánh hoa với pha, kích thước và đường bay khác nhau.

Kiểm tra: `tools/verify-homepage-layered.cjs` chạy đúng bộ vẽ và hai bộ chuyển tiếp bằng Canvas gốc. Báo cáo và ảnh kiểm tra nằm trong `verification/homepage-layered-integration-20261012`. Kiểm tra giao diện được thực hiện thêm trong trình duyệt.

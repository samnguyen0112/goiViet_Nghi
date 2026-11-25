# Bàn giao Lượt 1/4

## Môi trường và quyền

- Node `v26.13.0`, Chrome `157.0.8103.79`, Playwright `1.62.1`. Chrome headless mở preview-5 qua `localhost:8770` và `127.0.0.1:8770`. WebGL 1/2 báo `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`.
- Sandbox chặn truy cập localhost của Chrome và thao tác khởi tạo MSYS của Git Bash. Quyền thực thi ngoài sandbox đã được cấp cho Git Bash theo đường dẫn đầy đủ, server cục bộ và các lần chạy Chrome của audit. `bash` trong PATH là alias tại `WindowsApps`. Dùng `C:/Program Files/Git/bin/bash.exe` cho lượt cần script `.sh`. [Chi tiết lệnh và lỗi](MOI-TRUONG-VA-KIEM-TRA-NEN.md).
- Tám bộ kiểm tra nền đạt. Hải trình gia đình đạt sau khi sao tệp đối chiếu vào thư mục audit. `check-memory-v5.cjs` kiểm qua preview-3 theo đích sẵn có của công cụ. Bộ ảnh ga chuẩn bị đủ 629 mục và đi qua ca tải lại ngoại tuyến. [Kết quả và log](MOI-TRUONG-VA-KIEM-TRA-NEN.md).

## Dữ liệu đã lưu

- A.1 ghi 182 tệp tải thành công, gồm 24 đường dẫn nạp động, và 50 đường dẫn khai báo chưa thấy request trong bốn lượt Hà Nội ở 1440×900, DPR 1. Có một phiên trình duyệt mới cho mỗi tổ hợp VI/EN và mặc định/sách nháp. Bộ chạy bỏ qua hoạt cảnh giới thiệu bằng `GoiVietHomeIntro.skip()` rồi dùng các nút của trang. 24 URL `blob:` sinh trong phiên nằm ở log gốc. [CSV](tep-duoc-nap-preview-5.csv) · [Log HTTP và console](../../verification/audit-06/network-preview-5.jsonl) · [Khai báo HTML và số dòng](../../verification/audit-06/preview-5-static-declarations.json).
- B đã đối chiếu cả tám trang vào. Bốn tệp động 2K/4K của trang chủ có HTTP 200 nhưng nằm ngoài manifest. `python tools/build-preview-5-offline.py --check` trả về đạt vì đối chiếu đúng với bộ dựng hiện tại. [Báo cáo B](BAO-CAO-B-KIEM-KE-TEP.md) · [Log hai độ phân giải](../../verification/audit-06/network-home-transport-b.json).

## Phát hiện tình cờ để chuyển lượt sau

- **Khả năng tiếp cận, đã tái hiện qua log.** Khi mở bộ thẻ Hà Nội, Chrome báo `Blocked aria-hidden on an element because its descendant retained focus` ở cả bốn lượt VI/EN. Log chỉ ra nút còn focus là `#deck-open-hn`, nằm trong `#mapScene` đang nhận `aria-hidden`. Luồng mở, rút, lật và đóng thẻ vẫn hoàn tất trong bốn lượt. Chuyển hạng mục E để kiểm thứ tự focus. [Log console theo pha Thẻ bài](../../verification/audit-06/network-preview-5.jsonl).

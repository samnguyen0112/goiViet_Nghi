# Tài liệu dự án

Kế hoạch và báo cáo xếp theo từng đợt, mỗi đợt một thư mục, theo thứ tự thời gian. Trang web, `AGENTS.md`, `assets/`, `image/` và `tools/` vẫn ở thư mục gốc, vì website và bộ kiểm thử dùng các đường dẫn đó.

| Thư mục | Đợt | Tài liệu |
| --- | --- | --- |
| [01-preview-3-mien-ky-uc](01-preview-3-mien-ky-uc/) | Trang chuyển tiếp "Dòng ký ức chảy về nhà" (preview-3), 10/2026 | [Kế hoạch](01-preview-3-mien-ky-uc/PLAN-MIEN-KY-UC-PREVIEW-3.md) |
| [02-nang-cap-hieu-nang](02-nang-cap-hieu-nang/) | Nâng cấp hiệu năng preview-4 → preview-5, giai đoạn GĐ0–GĐ6, 09/11/2026 | [Kế hoạch](02-nang-cap-hieu-nang/KE-HOACH-NANG-CAP-PREVIEW-4.md) · [GĐ0](02-nang-cap-hieu-nang/BAO-CAO-GD0-PREVIEW-4.md) · [GĐ1](02-nang-cap-hieu-nang/BAO-CAO-GD1-PREVIEW-5.md) · [GĐ2](02-nang-cap-hieu-nang/BAO-CAO-GD2-PREVIEW-5.md) · [GĐ3](02-nang-cap-hieu-nang/BAO-CAO-GD3-PREVIEW-5.md) · [GĐ4](02-nang-cap-hieu-nang/BAO-CAO-GD4-PREVIEW-5.md) · [GĐ6](02-nang-cap-hieu-nang/BAO-CAO-GD6-PREVIEW-5.md) · [drawAtmosphere](02-nang-cap-hieu-nang/BAO-CAO-DRAWATMOSPHERE-PREVIEW-5.md) |
| [03-p5-song-ngu-va-sach](03-p5-song-ngu-va-sach/) | Song ngữ, hai chế độ tại ga và khung sách văn hóa (P5-00 → P5-05), 09–12/11/2026 | [Kế hoạch](03-p5-song-ngu-va-sach/plan.md) · [P5-00](03-p5-song-ngu-va-sach/BAO-CAO-P5-00.md) · [P5-01](03-p5-song-ngu-va-sach/BAO-CAO-P5-01.md) · [P5-02](03-p5-song-ngu-va-sach/BAO-CAO-P5-02.md) · [P5-03](03-p5-song-ngu-va-sach/BAO-CAO-P5-03.md) · [P5-05](03-p5-song-ngu-va-sach/BAO-CAO-P5-05.md) · [Ảnh ga và ngoại tuyến](03-p5-song-ngu-va-sach/BAO-CAO-ANH-GA-PREVIEW-5.md) |
| [04-den-ga](04-den-ga/) | Luồng "Đến ga mới mở bảng", demo và tích hợp vào preview-5, 12–13/11/2026 | [Báo cáo](04-den-ga/BAO-CAO-DEMO-DEN-GA-5.md) |
| [05-hai-trinh-gia-dinh](05-hai-trinh-gia-dinh/) | Hải trình gia đình và Bưu điện biển đảo, 13/11/2026 | [Báo cáo](05-hai-trinh-gia-dinh/BAO-CAO-HAI-TRINH-GIA-DINH-5.md) |

Đợt mới: tạo thư mục `docs/06-<tên-đợt>/`, đặt kế hoạch và các báo cáo của đợt đó vào cùng thư mục. Liên kết từ tài liệu tới tệp của dự án thì thêm `../../` ở đầu, ví dụ `../../assets/...` hoặc `../../verification/...`.

Ảnh chụp và log nghiệm thu nằm trong `verification/` ở thư mục gốc. Thư mục này bị `.gitignore` bỏ qua, nên các liên kết tới đó chỉ mở được trên máy đã chạy kiểm thử.

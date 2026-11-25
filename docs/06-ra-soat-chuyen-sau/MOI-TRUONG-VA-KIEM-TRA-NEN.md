# Môi trường và kiểm tra nền — Lượt 1/4

19/11/2026 · Windows · Trang mục tiêu `map-surroundings-preview-5.html`.

## Bước 0 — Môi trường

| Kiểm tra | Kết quả |
|---|---|
| `node -v` | `v26.13.0` |
| `git --no-optional-locks status --short --branch --untracked-files=all` | Nhánh `p5-05` theo dõi `origin/p5-05`. Có 20 tệp đã sửa và 135 tệp chưa theo dõi lúc bắt đầu. Danh sách đầy đủ ở cuối báo cáo. |
| Chrome tại `C:/Program Files/Google/Chrome/Application/chrome.exe` | Có, phiên bản `157.0.8103.79`. |
| Playwright theo `tools/perf/lib.cjs` | Nạp được bản `1.62.1` từ `C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`. |
| `& 'C:/Program Files/Git/bin/bash.exe' --version` | Có Git Bash `5.2.37(1)-release (x86_64-pc-msys)`. Xác nhận bằng đường dẫn đầy đủ ngoài sandbox. |
| `node tools/perf/server.cjs` | Server chạy tại `127.0.0.1:8770`. Chrome headless nhận HTTP 200 cho cả `http://localhost:8770/map-surroundings-preview-5.html` và URL dùng `127.0.0.1` khi server và Chrome chạy ngoài sandbox. |
| `UNMASKED_RENDERER_WEBGL` | `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)` trên cả WebGL 2 và WebGL 1. Đã đo qua `WEBGL_debug_renderer_info` trong Chrome headless. Đây là GPU Intel Arc qua ANGLE/D3D11. |

### Sandbox và các lần thử lại

- `bash --version` trong PATH trỏ vào alias tại `WindowsApps` và thất bại với `The file cannot be accessed by the system.` Git Bash theo đường dẫn cài đặt chạy trong sandbox báo `fatal error - NtCreateDirectoryObject(\BaseNamedObjects\msys-2.0S5-1888ae32e00d56aa): 0xC0000022`. Chạy đúng tệp Git Bash với quyền ngoài sandbox thành công.
- `node -e` nạp `./tools/perf/lib.cjs`, gọi `launch()` rồi `page.goto('http://localhost:8770/map-surroundings-preview-5.html')` trong sandbox báo `net::ERR_NETWORK_ACCESS_DENIED`. Khi chỉ Chrome chạy ngoài sandbox, lần thử báo `net::ERR_CONNECTION_TIMED_OUT`. Lần khởi động server thứ hai gặp `EADDRINUSE` từ server audit đầu tiên. Sau khi dừng tiến trình audit đầu tiên và chạy cả server lẫn Chrome ngoài sandbox, truy cập thành công.
- Bộ chạy `node scratch/audit-06/run-checks.cjs`, hai chế độ `check-books-5.cjs --render` và `check-i18n-5.cjs --walk`, cùng lần chạy lại Hải trình gia đình dùng quyền thực thi ngoài sandbox để Chrome và các ca HTTP cục bộ hoạt động.

## Bước 1 — Bối cảnh và kiểm tra nền

Đối chiếu [quy tắc dự án](../../AGENTS.md), [kế hoạch rà soát](audit.md), [mục lục tài liệu](../README.md), [các đợt nâng hiệu năng GĐ0–GĐ6](../02-nang-cap-hieu-nang/), [P5-00 đến P5-05](../03-p5-song-ngu-va-sach/), [tích hợp đến ga](../04-den-ga/BAO-CAO-DEMO-DEN-GA-5.md) và [Hải trình gia đình](../05-hai-trinh-gia-dinh/BAO-CAO-HAI-TRINH-GIA-DINH-5.md). Mục 7 của GĐ6 ghi nhận các việc còn mở gồm kết quả trên máy lớp học, heap tăng khoảng 100 KB mỗi lượt chọn địa danh và hai ca worker lỗi vào bản đồ khoảng 32 giây. Đây là số liệu lịch sử. [Báo cáo GĐ6](../02-nang-cap-hieu-nang/BAO-CAO-GD6-PREVIEW-5.md#7-việc-còn-lại-và-giới-hạn)

Các bài kiểm tra chạy từ tệp có sẵn. Bộ nạp tạm chuyển các đường dẫn xuất ảnh và JSON vào `verification/audit-06/checks/`. Hai chế độ kiểm bổ sung `--render` và `--walk` theo cách chạy trong báo cáo P5-05. Bộ đến ga chạy `--preview-5` và tự có ca so sánh với demo. Các script đo chuyên sâu trong `tools/perf/` dành cho lượt 2.

| Công cụ | Kết quả cuối | Chi tiết và log |
|---|---|---|
| `check-books-5.cjs` | Đạt, mã 0 | Nội dung nháp có cảnh báo ảnh và nguồn mẫu. [Log kiểm nội dung](../../verification/audit-06/checks/check-books-5.log). |
| `check-books-5.cjs --render` | Đạt, mã 0 | 0 trang tràn chữ ở VI/EN. Một số trang Hà Nội co chữ theo giới hạn trình đọc. [Log dựng trang](../../verification/audit-06/checks/check-books-5-render.log). |
| `check-i18n-5.cjs` | Đạt, mã 0 | 263 khóa markup có tiếng Anh, 242 khóa dùng trong mã có cả hai bản. [Log tĩnh](../../verification/audit-06/checks/check-i18n-5.log). |
| `check-i18n-5.cjs --walk` | Đạt, mã 0 | Vòng đổi VI → EN → VI và luồng EN đạt. [Log luồng](../../verification/audit-06/checks/check-i18n-5-walk.log). |
| `check-memory-v5.cjs` | Đạt, mã 0 | Kiểm hồi quy chương Miền ký ức qua preview-3 theo đích được viết sẵn trong công cụ. [Log](../../verification/audit-06/checks/check-memory-v5.log). |
| `verify-preview5-conversation-cards.cjs` | Đạt, mã 0 | Sáu cỡ cửa sổ, hoạt ảnh và một vòng chơi đầy đủ. [Log](../../verification/audit-06/checks/verify-preview5-conversation-cards.log). |
| `check-station-panel-5.cjs` | Đạt, mã 0 | Bảng ga, hành trình, thẻ, kỷ niệm, bưu thiếp và sách. [Log](../../verification/audit-06/checks/check-station-panel-5.log). |
| `check-family-voyage-5.cjs` | Đạt lần chạy lại, mã 0 | 11 nhóm ca. Lần đầu thiếu tệp đối chiếu trong thư mục đầu ra được chuyển hướng. Lần chạy lại dùng bản sao đúng tệp sẵn có. [Log lần đầu](../../verification/audit-06/checks/check-family-voyage-5.log) và [log chạy lại](../../verification/audit-06/checks/check-family-voyage-5-retry.log). |
| `check-station-photos-5.cjs` | Đạt, mã 0 | 35 ảnh, biểu tượng Hoàng Sa, 6 cỡ × 2 ngôn ngữ, 36 lối mở sách và 72 khung sau tải lại ngoại tuyến. [Log](../../verification/audit-06/checks/check-station-photos-5.log). |
| `check-arrival-demo-5.cjs --preview-5` | Đạt, mã 0 | 61/61 ca, 0 lỗi. Hai phép đối chiếu tích hợp với demo đều đạt. [Log](../../verification/audit-06/checks/check-arrival-demo-5.log) và [kết quả JSON](../../verification/audit-06/checks/arrival-preview-5/results.json). |

### Lỗi nguyên văn ở lần chạy đầu Hải trình gia đình

```text
node:internal/process/promises:324
    triggerUncaughtException(err, true /* fromPromise */);
    ^

[Error: ENOENT: no such file or directory, open 'D:\HCMUS\vietnam-heritage-map-2\verification\audit-06\checks\sea-postoffice-5\before-source\family-voyage-5.js'] {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'open',
  path: 'D:\\HCMUS\\vietnam-heritage-map-2\\verification\\audit-06\\checks\\sea-postoffice-5\\before-source\\family-voyage-5.js'
}

Node.js v26.13.0
```

### Danh sách thay đổi lúc bắt đầu

```text
## p5-05...origin/p5-05
 M assets/fonts/heritage/manifest.json
 M assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js
 M assets/goi-viet/map-surroundings-preview/arrival-demo-5/fortune-ritual-arrival-5.js
 M assets/goi-viet/map-surroundings-preview/arrival-demo-5/i18n-arrival-5.js
 M assets/goi-viet/map-surroundings-preview/arrival-demo-5/station-panel-arrival-5.js
 M assets/goi-viet/map-surroundings-preview/conversation-cards-5.css
 M assets/goi-viet/map-surroundings-preview/conversation-cards-5.js
 M assets/goi-viet/map-surroundings-preview/family-voyage-5.js
 M assets/goi-viet/map-surroundings-preview/i18n-ui-5.js
 M assets/goi-viet/map-surroundings-preview/offline-manifest-5.js
 M assets/goi-viet/map-surroundings-preview/preview-5.js
 M assets/goi-viet/map-surroundings-preview/province-legibility-5.js
 M assets/goi-viet/postcard-design-5.js
 M map-surroundings-preview-5.html
 M tools/build-preview-5-offline.py
 M tools/check-arrival-demo-5.cjs
 M tools/check-family-voyage-5.cjs
 M tools/check-i18n-5.cjs
 M tools/check-station-panel-5.cjs
 M tools/verify-preview5-conversation-cards.cjs
?? assets/fonts/heritage/BarlowSemiCondensed-500.woff
?? assets/fonts/heritage/DancingScript-700.woff
?? assets/fonts/heritage/Oswald-500.woff
?? assets/fonts/heritage/Oswald-600.woff
?? assets/fonts/heritage/barlowsemicondensed-METADATA.pb
?? assets/fonts/heritage/barlowsemicondensed-OFL.txt
?? assets/fonts/heritage/dancingscript-METADATA.pb
?? assets/fonts/heritage/dancingscript-OFL.txt
?? assets/fonts/heritage/oswald-METADATA.pb
?? assets/fonts/heritage/oswald-OFL.txt
?? assets/goi-viet/card-covers-5/SOURCES.md
?? assets/goi-viet/card-covers-5/ag/bc.webp
?? assets/goi-viet/card-covers-5/ag/bl.webp
?? assets/goi-viet/card-covers-5/ag/br.webp
?? assets/goi-viet/card-covers-5/ag/ml.webp
?? assets/goi-viet/card-covers-5/ag/mr.webp
?? assets/goi-viet/card-covers-5/ag/tc.webp
?? assets/goi-viet/card-covers-5/ag/tl.webp
?? assets/goi-viet/card-covers-5/ag/tr.webp
?? assets/goi-viet/card-covers-5/bn/bc.webp
?? assets/goi-viet/card-covers-5/bn/bl.webp
?? assets/goi-viet/card-covers-5/bn/br.webp
?? assets/goi-viet/card-covers-5/bn/ml.webp
?? assets/goi-viet/card-covers-5/bn/mr.webp
?? assets/goi-viet/card-covers-5/bn/tc.webp
?? assets/goi-viet/card-covers-5/bn/tl.webp
?? assets/goi-viet/card-covers-5/bn/tr.webp
?? assets/goi-viet/card-covers-5/ct/bc.webp
?? assets/goi-viet/card-covers-5/ct/bl.webp
?? assets/goi-viet/card-covers-5/ct/br.webp
?? assets/goi-viet/card-covers-5/ct/ml.webp
?? assets/goi-viet/card-covers-5/ct/mr.webp
?? assets/goi-viet/card-covers-5/ct/tc.webp
?? assets/goi-viet/card-covers-5/ct/tl.webp
?? assets/goi-viet/card-covers-5/ct/tr.webp
?? assets/goi-viet/card-covers-5/dl/bc.webp
?? assets/goi-viet/card-covers-5/dl/bl.webp
?? assets/goi-viet/card-covers-5/dl/br.webp
?? assets/goi-viet/card-covers-5/dl/ml.webp
?? assets/goi-viet/card-covers-5/dl/mr.webp
?? assets/goi-viet/card-covers-5/dl/tc.webp
?? assets/goi-viet/card-covers-5/dl/tl.webp
?? assets/goi-viet/card-covers-5/dl/tr.webp
?? assets/goi-viet/card-covers-5/dn/bc.webp
?? assets/goi-viet/card-covers-5/dn/bl.webp
?? assets/goi-viet/card-covers-5/dn/br.webp
?? assets/goi-viet/card-covers-5/dn/ml.webp
?? assets/goi-viet/card-covers-5/dn/mr.webp
?? assets/goi-viet/card-covers-5/dn/tc.webp
?? assets/goi-viet/card-covers-5/dn/tl.webp
?? assets/goi-viet/card-covers-5/dn/tr.webp
?? assets/goi-viet/card-covers-5/hcm/bc.webp
?? assets/goi-viet/card-covers-5/hcm/bl.webp
?? assets/goi-viet/card-covers-5/hcm/br.webp
?? assets/goi-viet/card-covers-5/hcm/ml.webp
?? assets/goi-viet/card-covers-5/hcm/mr.webp
?? assets/goi-viet/card-covers-5/hcm/tc.webp
?? assets/goi-viet/card-covers-5/hcm/tl.webp
?? assets/goi-viet/card-covers-5/hcm/tr.webp
?? assets/goi-viet/card-covers-5/hn/bc.webp
?? assets/goi-viet/card-covers-5/hn/bl.webp
?? assets/goi-viet/card-covers-5/hn/br.webp
?? assets/goi-viet/card-covers-5/hn/ml.webp
?? assets/goi-viet/card-covers-5/hn/mr.webp
?? assets/goi-viet/card-covers-5/hn/tc.webp
?? assets/goi-viet/card-covers-5/hn/tl.webp
?? assets/goi-viet/card-covers-5/hn/tr.webp
?? assets/goi-viet/card-covers-5/hue/bc.webp
?? assets/goi-viet/card-covers-5/hue/bl.webp
?? assets/goi-viet/card-covers-5/hue/br.webp
?? assets/goi-viet/card-covers-5/hue/ml.webp
?? assets/goi-viet/card-covers-5/hue/mr.webp
?? assets/goi-viet/card-covers-5/hue/tc.webp
?? assets/goi-viet/card-covers-5/hue/tl.webp
?? assets/goi-viet/card-covers-5/hue/tr.webp
?? assets/goi-viet/card-covers-5/nb/bc.webp
?? assets/goi-viet/card-covers-5/nb/bl.webp
?? assets/goi-viet/card-covers-5/nb/br.webp
?? assets/goi-viet/card-covers-5/nb/ml.webp
?? assets/goi-viet/card-covers-5/nb/mr.webp
?? assets/goi-viet/card-covers-5/nb/tc.webp
?? assets/goi-viet/card-covers-5/nb/tl.webp
?? assets/goi-viet/card-covers-5/nb/tr.webp
?? assets/goi-viet/card-covers-5/paper-red.webp
?? assets/goi-viet/card-covers-5/pt/bc.webp
?? assets/goi-viet/card-covers-5/pt/bl.webp
?? assets/goi-viet/card-covers-5/pt/br.webp
?? assets/goi-viet/card-covers-5/pt/ml.webp
?? assets/goi-viet/card-covers-5/pt/mr.webp
?? assets/goi-viet/card-covers-5/pt/tc.webp
?? assets/goi-viet/card-covers-5/pt/tl.webp
?? assets/goi-viet/card-covers-5/pt/tr.webp
?? assets/goi-viet/card-covers-5/qn/bc.webp
?? assets/goi-viet/card-covers-5/qn/bl.webp
?? assets/goi-viet/card-covers-5/qn/br.webp
?? assets/goi-viet/card-covers-5/qn/ml.webp
?? assets/goi-viet/card-covers-5/qn/mr.webp
?? assets/goi-viet/card-covers-5/qn/tc.webp
?? assets/goi-viet/card-covers-5/qn/tl.webp
?? assets/goi-viet/card-covers-5/qn/tr.webp
?? assets/goi-viet/card-covers-5/qng/bc.webp
?? assets/goi-viet/card-covers-5/qng/bl.webp
?? assets/goi-viet/card-covers-5/qng/br.webp
?? assets/goi-viet/card-covers-5/qng/ml.webp
?? assets/goi-viet/card-covers-5/qng/mr.webp
?? assets/goi-viet/card-covers-5/qng/tc.webp
?? assets/goi-viet/card-covers-5/qng/tl.webp
?? assets/goi-viet/card-covers-5/qng/tr.webp
?? assets/goi-viet/card-covers-5/qt/bc.webp
?? assets/goi-viet/card-covers-5/qt/bl.webp
?? assets/goi-viet/card-covers-5/qt/br.webp
?? assets/goi-viet/card-covers-5/qt/ml.webp
?? assets/goi-viet/card-covers-5/qt/mr.webp
?? assets/goi-viet/card-covers-5/qt/tc.webp
?? assets/goi-viet/card-covers-5/qt/tl.webp
?? assets/goi-viet/card-covers-5/qt/tr.webp
?? assets/goi-viet/card-covers-5/sl/bc.webp
?? assets/goi-viet/card-covers-5/sl/bl.webp
?? assets/goi-viet/card-covers-5/sl/br.webp
?? assets/goi-viet/card-covers-5/sl/ml.webp
?? assets/goi-viet/card-covers-5/sl/mr.webp
?? assets/goi-viet/card-covers-5/sl/tc.webp
?? assets/goi-viet/card-covers-5/sl/tl.webp
?? assets/goi-viet/card-covers-5/sl/tr.webp
?? assets/goi-viet/card-covers-5/th/bc.webp
?? assets/goi-viet/card-covers-5/th/bl.webp
?? assets/goi-viet/card-covers-5/th/br.webp
?? assets/goi-viet/card-covers-5/th/ml.webp
?? assets/goi-viet/card-covers-5/th/mr.webp
?? assets/goi-viet/card-covers-5/th/tc.webp
?? assets/goi-viet/card-covers-5/th/tl.webp
?? assets/goi-viet/card-covers-5/th/tr.webp
?? assets/goi-viet/map-surroundings-preview/card-covers-5.css
?? assets/goi-viet/map-surroundings-preview/card-covers-5.js
?? docs/06-ra-soat-chuyen-sau/audit.md
```

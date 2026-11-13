# Báo cáo P5-00 — Mốc gốc preview-5

- **Ngày** 09/11/2026 · theo [plan.md](plan.md) mục P5-00.
- **Trạng thái** Hoàn thành. Không sửa mã nguồn website. Thay đổi trong dự án gồm 1 commit mốc gốc và việc cập nhật `AGENTS.md`.
- **Bằng chứng** `verification/p5-books/` (thư mục bị `.gitignore` bỏ qua).

## 1. Tóm tắt

| Hạng mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| Mốc khôi phục | Commit `52bd8db` trên nhánh mới `p5-books`, chưa push | `git show --stat 52bd8db` |
| Bản sao chạy được để so A/B | `verification/p5-books/baseline/`, 346 tệp, 136 MB, có mã SHA-256 | `baseline-manifest.json`, `baseline-files.txt` |
| AGENTS.md | Trỏ sang preview-5, chưa commit | `git diff AGENTS.md` |
| Bộ test thẻ | **Đạt**: 6 cỡ màn hình, hiệu ứng, trọn một lượt chơi | `cards-baseline/`, `cards-baseline.log` |
| Ca chức năng GĐ6 (bản sao so với bản gốc) | **Đạt**: 17 nhóm thao tác, không khác biệt, 0 lỗi | `gd6-functional-baseline.json` |
| Số đo mốc (1920×1080, CPU ×1, n = 5 mỗi bên, xen kẽ) | Vào bản đồ: màn che mở hẳn sau khoảng 2,2–2,3 giây. Mở bộ thẻ: khoảng 70 ms | `perf/` |
| Lỗi có sẵn: mở nhầm bộ thẻ | **Tái hiện được** bằng thao tác bấm thật; ca đối chứng mở đúng bộ | `bug-wrong-deck/` |

## 2. Mốc khôi phục

**Commit `52bd8db`** "P5-00: lưu mốc gốc preview-5 trước đợt song ngữ và sách" trên nhánh `p5-books` (tách từ `main` tại `d9a2d31`).
- Gồm `map-surroundings-preview-5.html` và 19 tài nguyên trang này nạp mà Git trước đó chưa theo dõi (danh sách ở `verification/p5-books/baseline-untracked.txt`).
- Nội dung các tệp giữ nguyên.
- Không đưa vào commit các thay đổi dở khác: `map-surroundings-preview-3.html`, `AGENTS.md`, `plan.md`, các báo cáo, `tools/`, preview-4.
- Muốn quay về mốc: `git checkout 52bd8db -- <tệp>`.

**Cách chọn tệp cho bản sao `verification/p5-books/baseline/`** (script `snapshot-p5.cjs`):
1. Các yêu cầu thật mà trang gửi khi đi qua 13 bước luồng chính (script `inventory-p5.cjs`): cổng → mở đầu → chương ký ức → vào bản đồ → chọn ga → đi tàu tới Huế và bấm Khám phá → câu chuyện → bộ thẻ (rút, xem giải thích, lật) → quẻ tre → bưu thiếp → quần đảo → zoom → nền tối → về trang chủ.
2. Mọi đường dẫn tham chiếu tĩnh trong HTML (`src`, `href`, `srcset`, `url()`), trong CSS đã nạp và trong chuỗi đường dẫn của JS đã nạp.
3. Cặp anh em 2k/4k của ảnh trang chủ, vì trang chọn cỡ ảnh lúc chạy theo màn hình.

**Kiểm bản sao:** chạy lại cả 13 bước trên bản sao thì có đúng 144 yêu cầu cục bộ như bản gốc, 0 yêu cầu lỗi, 0 lỗi trang.

**Mở bản mốc** khi server đo đang chạy (`node tools/perf/server.cjs`):
`http://127.0.0.1:8770/verification/p5-books/baseline/map-surroundings-preview-5.html`

## 3. AGENTS.md

Đổi cả 7 chỗ `preview-3` thành `preview-5`, gồm 3 dòng phạm vi làm việc và 2 dòng tham chiếu thẻ bài. Các ý khác giữ nguyên. Chưa commit.

## 4. Kiểm tra chức năng

- **Bộ test thẻ:** chạy bản sao của `tools/verify-preview5-conversation-cards.cjs`. Kiểm tra giữ nguyên, chỉ đổi thư mục đầu ra sang `verification/p5-books/cards-baseline/` để không ghi đè bằng chứng GĐ6. Kết quả **Đạt**.
- **Ca chức năng GĐ6:** `tools/perf/verify-gd6-functional.cjs` với `--a` là bản sao mốc, `--b` là preview-5. Phủ phạm vi ga, tìm kiếm không dấu, lọc chủ đề, chọn ga, rút thẻ, lưu kỷ niệm, phím R, Escape và giữ tiêu điểm trong cửa sổ. Kết quả **không có khác biệt**, 0 lỗi mỗi bên.
- **Hai quan sát đã có từ GĐ6**, không phải lỗi mới: Escape khi không có cửa sổ nào mở không bỏ chọn địa danh; trong phạm vi "tất cả", các bộ lọc chủ đề đều trả 36 điểm.
- **Phụ thuộc mạng ngoài:** trong luồng đầy đủ, trang gửi 30 yêu cầu tới Wikimedia (ảnh danh thắng của ga và câu chuyện). Khi mất mạng, các ảnh này không tải được; trang có xử lý `onerror`.

## 5. Số đo mốc

**Môi trường:**
- Chrome 156.0.8078.80 headless, GPU thật (Intel Arc, D3D11).
- Viewport 1920×1080 (DPR 1), CPU ×1, không giả lập mạng, tắt cache.
- Máy bận trước mỗi lần chạy 7–34 %.

**Cách chạy:** A là bản sao mốc, B là preview-5 gốc, chạy xen kẽ, mỗi bên 5 lần. Trị số ghi dạng trung vị [tứ phân vị 1–3].

| Chỉ số | A — bản sao mốc | B — preview-5 |
| --- | --- | --- |
| gateReady (ms, trong trang) | 411 [401–420] | 408 [402–425] |
| FCP (ms) | 684 [668–696] | 688 [684–688] |
| Bấm Mở bản đồ → màn che bắt đầu mở (ms) | 1802 [1801–1911] | 1804 [1403–1902] |
| **Bấm Mở bản đồ → màn che mở hẳn (ms)** | **2307 [2306–2410]** | **2208 [1906–2402]** |
| Bấm Mở bản đồ → raster nghỉ (ms) | 2510 [2507–2610] | 2406 [2101–2604] |
| Vào bản đồ: FPS | 36,7 [35,7–36,8] | 36,5 [36,4–43,6] |
| Vào bản đồ: LoAF lớn nhất (ms) | 494 [484–556] | 511 [313–521] |
| Byte truyền cả luồng tới bản đồ (MiB) | 29,11 | 29,11 |
| Số yêu cầu cả luồng | 204 | 204 |
| Heap sau khi vào bản đồ (MB) | 35,7 | 35,7 |

**Mở bộ thẻ** (bản sao của `tools/perf/ab-cards.cjs`, đổi viewport 1920×1080 và thư mục đầu ra; mỗi bên 5 lần):

| Chỉ số | A — bản sao mốc | B — preview-5 |
| --- | --- | --- |
| **Hàm mở bộ thẻ chạy xong (ms)** | **67,6 [46,4–70]** | **71,6 [57,1–73]** |
| Tính lại style / layout trong 1 giây sau khi mở (ms) | 29,9 / 46,5 | 29,5 / 51,8 |
| Rút thẻ → lá đã sẵn sàng (ms, gồm hiệu ứng) | 3048 | 3036 |
| FPS khi rút / khi lật | 55,5 / 58,9 | 55,3 / 58,9 |
| Lỗi trang | 0 | 0 |

**Đọc kết quả:**
- Hai bên chạy cùng mã, chỉ khác đường dẫn, và mọi chênh lệch đều nằm trong khoảng dao động. Như vậy bản sao dùng được làm mốc so A/B ở P5-05.
- Byte truyền cả luồng (29,11 MiB, đo tới khi vào bản đồ ở 1920×1080) khác phạm vi với số "byte tới cổng" của GĐ6 (9,60 MiB), nên không so trực tiếp hai số này.
- Chưa đo CPU ×4. Plan gọn của đợt này chỉ yêu cầu desktop; có thể thêm khi cần mô phỏng máy lớp yếu.

## 6. Lỗi có sẵn: mở nhầm bộ thẻ ở ga vừa đến

Script `bug-wrong-deck/` (`repro-wrong-deck.cjs`) chỉ dùng thao tác bấm thật trên preview-5.

| Ca | Thao tác | Câu chuyện mở ra | Bộ thẻ mở ra | Kết quả |
| --- | --- | --- | --- | --- |
| A — lỗi | Hà Nội → Khởi hành tới Huế; **trong lúc tàu chạy chọn TP. HCM**; tới Huế bấm "Khám phá →" trong thẻ ga đến; bấm "Mở thẻ trò chuyện" | TP. Huế | **TP. Hồ Chí Minh** | Sai |
| B — đối chứng | Hà Nội → Khởi hành tới Huế; tới ga bấm "Khám phá" ở thanh hành trình; bấm "Mở thẻ trò chuyện" | TP. Huế | TP. Huế | Đúng |

**Nguyên nhân:**
- `explore()` trong `journey-system-4.js` mở câu chuyện của ga vừa đến.
- Sau đó hàm này đặt lại `state.selectedPlaceId` thành ga đã chọn để đi tiếp.
- `openDeckFromStory()` trong preview-5 mở bộ thẻ theo `state.selectedPlaceId`, không theo `state.activeStory.place` (vẫn là `hue`).

**Ảnh chụp:** `A-bug-1-arrived.png`, `A-bug-2-story.png`, `A-bug-3-deck.png` (tiêu đề "Thẻ trò chuyện · TP. Hồ Chí Minh") và ba ảnh tương ứng của ca B. Lỗi này sẽ được sửa ở P5-02 mục 3.

## 7. Ghi chú cho các bước sau

- **Hai vị trí của nút Khám phá ở preview-5.** Khi đang đứng tại ga, "Khám phá" là nút chính của thanh hành trình (`.journey-depart[data-action="explore"]`), còn nút "Khám phá →" trong thẻ ga đến bị ẩn. Nút trong thẻ ga đến chỉ hiện khi đã chọn ga đi tiếp. P5-02 phải đặt hai nút chế độ ở cả hai chỗ.
- **Chạy lại phép so ở P5-05** bằng `bash verification/p5-books/scripts/measure-baseline.sh 5`, với A là bản sao mốc và B là preview-5 lúc đó.
  - Tổng hợp bằng `node verification/p5-books/scripts/summarize-flow.cjs verification/p5-books/perf/flow-copy.jsonl verification/p5-books/perf/flow-orig.jsonl`.
  - Trước khi chạy, chép kết quả mốc hiện tại sang chỗ khác, vì script xóa `perf/flow-*.jsonl` cũ.
- **Không ghi đè bằng chứng cũ:** `tools/verify-preview5-conversation-cards.cjs` và `tools/perf/ab-cards.cjs` ghi cứng thư mục đầu ra của GĐ6. Đợt này dùng các bản sao trong `verification/p5-books/scripts/`; logic kiểm tra giữ nguyên.
- **Tệp ngoài commit:** working tree vẫn còn các thay đổi chưa commit có từ trước (`map-surroundings-preview-3.html`, `plan.md`, các báo cáo, `tools/`, preview-4 và các tệp khác). Commit mốc không động tới chúng.

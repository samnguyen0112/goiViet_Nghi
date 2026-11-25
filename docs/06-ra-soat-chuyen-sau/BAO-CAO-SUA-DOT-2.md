# Báo cáo đợt sửa 2 · Preview-5 (D-03 + E-01, E-04, A-05)

- **Ngày thực hiện:** 25/11/2026 · Windows 11 · Nhánh `p5-05` · Nền commit `e057fcf` (`P5-05: sửa đợt 1 sau rà soát, thẻ Canva, báo cáo docs/06`).
- **Trạng thái git trước khi sửa (`git status -s`):** sạch (đợt sửa 1 và phần thẻ Canva đã được commit tại `e057fcf`, không có thay đổi bên ngoài trong suốt quá trình sửa).
- **Xác nhận phạm vi A-05:** Chủ dự án đã xác nhận phiên AI làm thẻ Canva đã dừng (đã commit tại `e057fcf`), cho phép thực hiện đủ cả 3 mục gồm A-05.
- **Bảo toàn phạm vi và đợt sửa 1:** Chỉ sửa `map-surroundings-preview-5.html`, `preview-5-offline-worker.js` và các tài nguyên dành riêng cho preview-5 (`arrival-demo-5.js`, `conversation-cards-5.js`, `landscape-5.js`, `offline-control-5.js`, `offline-manifest-5.js`). Không sửa `index.html`, `map-surroundings-preview-2/3/4.html`, `card-testing.html` hay bất kỳ tệp đuôi `-3` dùng chung nào. Giữ nguyên toàn bộ thay đổi đợt sửa 1 (khối `C-01 (2026-11-21)` trong `conversation-cards-5.css`, 3 SVG `landmark-{hanoi,hue,saigon}-5.svg` + `preview-5.js`, 7 tệp cố định trong `tools/build-preview-5-offline.py`, dòng `"Khoảng 180 MB"`, `?v=20261121-audit-1` trên các tệp không đổi, và `launchPersistentContext` trong `tools/check-station-photos-5.cjs`).
- **Đóng gói ngoại tuyến sau sửa cuối:** `python tools/build-preview-5-offline.py` → `644 resources; 180.02 MB; 09cf82f2a6da8899`; `python tools/build-preview-5-offline.py --check` → **PASS**.

---

## 1. D-03 + E-01 · Thứ tự focus và `aria-hidden`/`inert` khi mở/đóng modal

### Đã sửa gì (tệp:dòng)
- `map-surroundings-preview-5.html:5875–6041`:
  - Bổ sung `isModalElementFocusable`, `getFocusableElementsInModal` (loại bỏ phần tử nằm trong nhánh `[inert]`, `[aria-hidden="true"]`, `<details:not([open])>` hoặc `visibility: hidden`/`display: none`).
  - Tách `syncBackgroundInertAndRenderState` thành hai pha rõ ràng: `unhideExposedLayers()` (gỡ `inert`/`aria-hidden` cho lớp sắp lộ ra) và pha ẩn nền qua `setLayerHiddenState()` (kèm chốt an toàn `blur()` nếu phần tử sắp ẩn vô tình vẫn giữ `activeElement`, đồng thời đặt `inert` trước `aria-hidden="true"`).
  - Sửa `focusFirstElementInModal`: kiểm tra phần tử đích thực sự focus được (gồm `#btnQuickStartWelcome` ở intro), fallback đặt `tabindex="-1"` lên chính container modal để focus luôn rời nền trước khi nền bị ẩn.
  - Sửa `pushModalFocus`: gọi `unhideExposedLayers()` → di chuyển focus vào modal đồng bộ bằng `focusFirstElementInModal(modalEl)` **TRƯỚC** khi gọi `syncBackgroundInertAndRenderState()` đặt `inert`/`aria-hidden="true"` cho nền (hoặc cho `#deckModal` khi `#bookModal` mở đè). Chỉ giữ hẹn giờ 30 ms nếu focus rơi vào fallback container modal.
  - Sửa `popModalFocus(modalId, { fallbackTarget })`: gọi `unhideExposedLayers()` **TRƯỚC** khi bật ngăn xếp trả focus về nút mở (`triggerEl`); nếu không có mục trong ngăn xếp (như `#introScreen` lúc mới mở trang) thì chuyển focus sang modal còn mở bên dưới hoặc `fallbackTarget` (`#mapScene`) rồi mới gọi `syncBackgroundInertAndRenderState()` để ẩn modal vừa đóng.
- `map-surroundings-preview-5.html:7430–7434, 7490`: đổi thứ tự nhánh `deckWasOpen` trong `openDeckModal` sang `unhideExposedLayers()` → `focusFirstElementInModal` → `syncBackgroundInertAndRenderState()`.
- `map-surroundings-preview-5.html:8586–8590`: sửa `closeIntroModal` gọi `popModalFocus('introScreen', { fallbackTarget: mapScene })`, vừa tránh ẩn `#introScreen` khi `#btnQuickStartWelcome` còn focus, vừa không ghi đè focus về `#mapScene` khi intro được mở từ `.brand-group` và đóng bằng `Escape`.
- `map-surroundings-preview-5.html:10077–10081`: bẫy phím `Tab`/`Shift+Tab` dùng `getFocusableElementsInModal(activeModal)` để không kẹt vào phần tử đang bị `inert` (như mặt gắn kết khi còn niêm dấu sen).
- `assets/goi-viet/map-surroundings-preview/natural/landscape-5.js:175` (tăng `?v=20261125-audit-2` tại `map-surroundings-preview-5.html:4165`): đảo thứ tự nhánh `wasOpen` sang `focusFirstElementInModal(dialog)` trước `syncBackgroundInertAndRenderState()`.

### Bằng chứng trước / sau
- **Môi trường kiểm:** Chrome (Intel Arc), 1920×1080, DPR 1, `http://127.0.0.1:8770/map-surroundings-preview-5.html?sach=nhap`, bật CDP `Accessibility.enable` và `Log.enable`, kèm hook theo dõi mọi lời gọi `setAttribute('aria-hidden', 'true')` khi phần tử tổ tiên đang chứa `document.activeElement`.
- **Trước khi sửa (đã tái hiện, 3 vòng mỗi modal):**
  - Chrome phát **4** cảnh báo `Blocked aria-hidden on an element because its descendant retained focus` (2 console + 2 CDP log): trên `<button#deck-open-hn>` bên trong `<div#mapScene>` và trên `<button.small-wood-btn>` bên trong `<div#deckModal>` khi mở `#bookModal` đè lên bộ bài.
  - Hook `setAttribute('aria-hidden', 'true')` ghi nhận **22 lượt vi phạm** trên đủ cả 4 modal và modal lồng: `#btnQuickStartWelcome` trong `#introScreen` (lần vào đầu và cả 3 vòng Escape intro), `#deck-open-hn` (3 vòng + 3 vòng lồng), `#book-open-hn` (3 vòng), `#stationPostcard` (3 vòng), `.brand-group` (3 vòng) và nút sách trên thẻ trong `#deckModal` (3 vòng lồng).
  - Ngay sau nhấn `Enter`, `activeElement` nằm trong modal ở `deck` chỉ đạt **0/3**, modal lồng `book-over-deck` đạt **2/3** (vì `setTimeout(..., 30)` chạy sau khi nền đã bị ẩn).
  - Đóng `#introScreen` (mở từ `.brand-group`) bằng `Escape` trả focus về `#mapScene` thay vì `.brand-group` (**0/3**).
- **Sau khi sửa (đã tái hiện và xác minh, 10 vòng mỗi modal):**
  - Cảnh báo Chrome `Blocked aria-hidden`: **0** (giảm từ 4).
  - Vi phạm `setAttribute('aria-hidden', 'true')` trên tổ tiên của `activeElement`: **0** (giảm từ 22).
  - Lần vào đầu từ `#btnQuickStartWelcome` (`Enter`): **0** cảnh báo, focus chuyển sang `#mapScene` trước khi `#introScreen` nhận `aria-hidden="true"` và `inert`.
  - Kết quả 10 vòng `Enter` → 6×`Tab` + 6×`Shift+Tab` → `Escape`:
    - Bộ bài (`#deck-open-hn`): **10/10** focus tức thời trong modal, **10/10** `Tab` không thoát modal, **10/10** `Escape` trả focus về `#deck-open-hn`, **0** cảnh báo.
    - Sách (`#book-open-hn`): **10/10** focus tức thời trong modal, **10/10** `Tab` không thoát modal, **10/10** `Escape` trả focus về `#book-open-hn`, **0** cảnh báo.
    - Bưu thiếp (`#stationPostcard`): **10/10** focus tức thời trong modal, **10/10** `Tab` không thoát modal, **10/10** `Escape` trả focus về `#stationPostcard`, **0** cảnh báo.
    - Intro (`.brand-group`): **10/10** focus tức thời trong modal, **10/10** `Tab` không thoát modal, **10/10** `Escape` trả focus về `.brand-group`, **0** cảnh báo.
    - Modal lồng (sách mở đè bộ bài từ `[data-card-book="hn"]`): **10/10** mở `#bookModal` với `#deckModal` bị `inert`/`aria-hidden="true"`, **10/10** `Tab` giữ trong `#bookModal`, **10/10** `Escape` lần 1 mở lại `#deckModal` và trả focus về `[data-card-book="hn"]`, **10/10** `Escape` lần 2 trả focus về `#deck-open-hn`, **0** cảnh báo.
  - `pageerror`: **0**.

### Rủi ro còn lại và phần chưa kiểm hết
- Đã kiểm bằng CDP `Accessibility.enable` trên Chrome; chưa kiểm trực tiếp với trình đọc màn hình thực (NVDA/JAWS) — *suy luận từ mã & kiểm tự động*.
- Nếu nút mở thuộc DOM động bị xóa trước khi đóng modal, `popModalFocus` fallback theo `id`, `onclick` hoặc `.brand-group` như thiết kế cũ.

---

## 2. E-04 · Trạng thái "sẵn sàng ngoại tuyến" phải phản ánh đúng nội dung

### Đã sửa gì (tệp:dòng)
- `preview-5-offline-worker.js:10–155`:
  - Tạo bảng tra `expectedHashes` từ `bundle.files` và `bundle.hashes`.
  - Thêm `digestBuffer` và `verifyFreshResponse`: với mỗi phản hồi tải mới, đọc `arrayBuffer()` một lần, đối chiếu SHA-256 với `bundle.hashes[file]` **trước khi** `cache.put`; nếu sai hash ném `offline-hash-mismatch` (thiếu hash ném `offline-hash-missing`), không ghi vào cache. Khi hợp lệ, tạo `Response` đã giải nén với `Content-Length` đúng thực tế và gỡ `Content-Encoding` để ghi vào Cache Storage an toàn.
  - Sửa `install`: mở trước danh sách `previousCaches`, chạy 4 luồng bằng `Promise.allSettled` với cờ `stopped`/`firstError` để khi một mục lỗi không còn luồng nào ghi tiếp sau `caches.delete(CACHE)`. Chỉ xóa `CACHE` (phiên bản mới thất bại), giữ nguyên hoàn toàn các cache cũ trong `previous` và không gọi `skipWaiting()` khi lỗi.
  - Sửa `fetch` nhánh `freshFirst`: trước khi `cache.put(key.href, response.clone())`, kiểm tra `response.ok && response.type !== 'opaque'` **và** SHA-256 khớp `expectedHashes.get(key.href)`. Phản hồi HTTP 200 sai nội dung không ghi đè mục hợp lệ trong cache.
  - Sửa trả lời `GOIVIET_OFFLINE_STATUS` qua `inspectCacheStatus()`: kiểm tra `caches.has(CACHE)` (không tạo cache rỗng), đối chiếu từng URL trong `bundle.files` có mặt đủ và không dư khóa (`matched === urls.length && present.size === urls.length`), đồng thời xác minh lại SHA-256 của trang lõi `map-surroundings-preview-5.html` trong cache trước khi báo `ready: true`.
- `assets/goi-viet/map-surroundings-preview/offline-control-5.js:10–14, 65–126` (tăng `?v=20261125-audit-2` tại `map-surroundings-preview-5.html:10226`):
  - Thêm `isReportReady(report)` kiểm tra đủ `ready === true`, `version` không rỗng, `expectedResources > 0` và `resources === expectedResources`.
  - Trong `startPreparation()`: khi đã có `registration.active` (chưa có `installing`/`waiting`), gọi `await registration.update()` để kiểm tra và tải phiên bản mới thay vì trả luôn worker cũ.
  - Lưu `workerError` từ thông điệp tiến độ để không làm mất mã lỗi chi tiết (`offline-hash-mismatch`) khi `activated()` ném `install-failed`, và không hủy đăng ký worker đang hoạt động nếu bản cập nhật mới lỗi.

### Bằng chứng trước / sau và số đo thời gian chuẩn bị gói 180 MB
- **Điều kiện đo:** Chrome `launchPersistentContext` với hồ sơ sạch lưu trên đĩa ở ổ D (`D:\HCMUS\vietnam-heritage-map-2\scratch\...`, trống ~54 GB; lưu ý khi thử đặt hồ sơ trên ổ C chỉ còn ~3,96 GB trống, Chromium báo `Cache.put() encountered a network error` quanh mục 244–248 nơi đặt `homepage-layered-assets-4k.js` 24,22 MB — phù hợp cảnh báo dung lượng ổ C trong `BAO-CAO-TONG-HOP.md#7`). Gói gồm **644 tài nguyên (~180,02 MB)**.

| Phép đo / kịch bản (đã đo & tái hiện) | Trước sửa (`44bb0ecb3368e9e2`) | Sau sửa (`09cf82f2a6da8899`) |
|---|---|---|
| Thời gian chuẩn bị 180 MB (n=3 hồ sơ sạch trên đĩa) | `[3567, 3185, 3203]` ms · trung vị **3203 ms** (IQR 191 ms, TB 3318 ms) | `[3349, 3266, 3878]` ms · trung vị **3349 ms** (IQR 306 ms, TB 3498 ms; Δ trung vị **+146 ms / +4,6%**) |
| Ngoại tuyến thật CDP (`offline: true`, tắt HTTP cache) tại **1920×1080** | `ready: true` (644/644), hoạt cảnh chạy (`phase: "playing"`, canvas `1920×1189`), vào map & mở ga Hà Nội (`naturalWidth=1600`), 0 lỗi | `ready: true` (644/644), `navigator.onLine=false`, probe ngoài cache lỗi, hoạt cảnh chạy (`phase: "playing"`, `clipReady: "true"`, canvas `1920×1189`), vào map & mở ga Hà Nội (`naturalWidth=1600`), **0** request lỗi, **0** `pageerror` |
| Ngoại tuyến thật CDP tại **3840×2160** | `ready: true` (644/644), hoạt cảnh chạy (`canvas 2601×1611`), vào map & mở ga Hà Nội, 0 lỗi | `ready: true` (644/644), `navigator.onLine=false`, probe ngoài cache lỗi, hoạt cảnh chạy (`phase: "playing"`, `clipReady: "true"`, canvas `2601×1611`), vào map & mở ga Hà Nội (`naturalWidth=1600`), **0** request lỗi, **0** `pageerror` |
| Giả lập HTTP 200 sai nội dung (`i18n-ui-5.js`) bằng **Playwright `context.route`** | **Bị chấp nhận**: ghi bản giả 45 byte vào cache (`tampered: true`), báo `ready: true` | **Bị từ chối**: `phase: "error"`, `ready: false`, `error: "offline-hash-mismatch"`, cache mới bị xóa (`names: []`), `cacheHasTampered: null` |
| Giả lập HTTP 200 sai nội dung khi cài mới qua proxy cục bộ | **Bị chấp nhận**: `tamperedFound: true`, `ready: true` | **Bị từ chối**: `phase: "error"`, `ready: false`, `error: "offline-hash-mismatch"`, `tamperedFound: false`, `names: []` |
| Giả lập HTTP 200 sai nội dung ở nhánh `fetch` (`freshFirst`) khi đang online | **Ghi đè cache cũ**: SHA-256 trong cache đổi từ `c6e63d5f…` sang `598348da…` (`freshFetchCacheIntact: false`) | **Không ghi đè cache**: SHA-256 trong cache giữ nguyên `c6e63d5f…` (`freshFetchCacheIntact: true`) |
| Nâng cấp lên manifest v2 giả (`ffff0000bad00002`) có 1 tệp HTTP 200 sai hash | Không gọi `registration.update()`, trả luôn v1 `ready: true` | Gọi `registration.update()`, từ chối v2 (`phase: "error"`, `ready: false`), xóa cache v2, giữ nguyên 644/644 mục của v1 (`goiviet-preview-5-09cf82f2a6da8899`), tải lại khi ngắt mạng thật chạy được bằng gói v1 (`oldBundleOfflineOk: true`) |

*Ghi chú số liệu phụ:* Trong một lượt đo trung gian trước chỉnh nhỏ cuối ở `conversation-cards-5.js` (manifest `969834d61c8a5a34`), n=3 thời gian chuẩn bị là `[3316, 3213, 3194]` ms (trung vị 3213 ms). Phần chi phí CPU thêm do SHA-256 toàn bộ 644 tệp rất nhỏ (~0,3–4,6%) nhờ WebCrypto dùng tăng tốc phần cứng và việc đọc `arrayBuffer()` một lần thay cho `response.clone()`.

### Rủi ro còn lại
- Khi cập nhật v2 thất bại trong lúc đã có v1 đang chạy, đôi khi sự kiện `redundant` đến trang trước thông điệp `postMessage` từ worker đang cài nên `status.error` hiển thị `install-failed` thay vì `offline-hash-mismatch` (đã thấy ở lượt đo cuối `proxyUpgradePreserveOldTest`, dù hành vi từ chối, xóa cache lỗi và bảo toàn v1 vẫn đúng hoàn toàn).
- `GOIVIET_OFFLINE_STATUS` xác minh đủ khóa của đúng phiên bản manifest và kiểm SHA-256 trang HTML lõi, không hash lại toàn bộ 180 MB mỗi lần mở trang để tránh chậm khởi động và chạm timeout 10 s — *suy luận từ mã*; nếu đĩa cứng làm hỏng ngẫu nhiên một tệp ảnh đã lưu từ trước, trạng thái `ready` không phát hiện trước khi ảnh được đọc.
- Máy có ổ chứa hồ sơ trình duyệt còn dưới ~4 GB trống vẫn có nguy cơ gặp lỗi quota/`Cache.put()` từ Chromium với tệp `homepage-layered-assets-4k.js` 24,22 MB (đã tái hiện trực tiếp trên ổ C trong quá trình đo).

---

## 3. A-05 · Chốt lá bài kích hoạt layout của phiếu ga phía sau

### Đã sửa gì (tệp:dòng)
- `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js:29–30, 168–172, 268–272, 332–348, 544, 551, 563` (tăng `?v=20261125-audit-2` tại `map-surroundings-preview-5.html:4246`):
  - Thêm cờ `deferredSheetRefresh`, `deferredSheetFit` và hàm `isCoveredByModal()` dựa trên `getTopOpenModalElement()`.
  - Hoãn cập nhật DOM phiếu ga trong `refresh()` và hoãn đo hình học `getComputedStyle`/`getBoundingClientRect` trong `fitSheet()` khi phiếu đang bị modal (như `#deckModal`, `#bookModal`) che phía trên.
  - Thêm `flushDeferred()` (xuất trên `window.GoiVietArrivalDemo`), được gọi đồng bộ khi modal đóng trong `syncBackgroundInertAndRenderState()` (và dự phòng qua `MutationObserver` trên `bookModal`/`deckModal`), bảo đảm số lá còn lại và kích thước phiếu ga cập nhật ngay khi phiếu lộ ra lại.
- `map-surroundings-preview-5.html:6832–6851, 7381, 7600, 5957–5960`:
  - Thêm `scheduleDemoPlaceListRender()` và `flushPendingDemoPlaceListRender()`, dùng trong `drawOneCard()` thay cho `renderDemoPlaceList()` đồng bộ, giúp gộp các cập nhật danh sách ga khi `#deckModal` đang mở và flush đồng bộ khi modal đóng (hoặc gộp luôn nếu `completeCardTurn()` gọi `renderDemoPlaceList()`).
  - Bỏ dựng lại bộ bài xòe ẩn trong `updateDeckRemainingUI()` khi `state.activeCard` đang mở (`#deckClosedState` đã `display: none`).
- `assets/goi-viet/map-surroundings-preview/conversation-cards-5.js:67, 78, 102–108` (tăng `?v=20261125-audit-2` tại `map-surroundings-preview-5.html:4232`):
  - Thêm tùy chọn `cancelDraw({ rerender = true } = {})` để `commit()` xóa khóa/class xáo bài mà không dựng lại hai lần bộ bài xòe đang bị ẩn, đồng thời bỏ lời gọi trùng `updateDeckRemainingUI(place)` (vì `drawOneCard` đã gọi).
  - Chuyển đặt `deckScrollBody.scrollTop = 0` lên trước `drawOneCard` (khi cây layout còn sạch) để tránh ép layout đồng bộ ngay sau khi đổi DOM.
  - Giữ nguyên 100% trình tự và mốc thời gian gom (0 ms) – xáo (340 ms) – chọn (1500 ms) – rút (2100 ms) – chốt (2850 ms) khớp `card-testing.html`, cùng hành vi hủy giữa chừng không mất lá.

### Bằng chứng đo trước / sau (Chrome, GPU thật Intel Arc, 1920×1080, ga Hà Nội, chuyển động bình thường)
- **GPU xác nhận qua WebGL:** `ANGLE (Intel, Intel(R) Arc(TM) Graphics (0x00007D55) Direct3D11 vs_5_0 ps_5_0, D3D11)`.
- **Độ đúng chức năng sau sửa (đã đo trên cả 12+3 lượt và bộ `verify-preview5-conversation-cards.cjs`):** `activeCard.id === pickedId` (15/15), `drawnCount === 1`, focus vào `#cardQuestionText`, đóng bộ bài bằng `Escape` khôi phục `#arrivalSheet` với nhãn `"Còn 3 lá"`, chân phiếu nằm gọn trong khung, focus trả về `#deck-open-hn`, 0 `pageerror`.
- **Phân rã chẩn đoán (đã đo):** Sau sửa, `drawOneCard()` chỉ còn **2,2 ms**, không còn gọi `renderDemoPlaceList()`, `arrival-demo-5.js:refresh()` hay `fitSheet()` (`getBoundingClientRect` trong đường chốt lá = **0 ms**); số `Layout` CDP trung vị giảm từ **12** xuống **11** (bỏ được đúng 1 lần `fitSheet` của phiếu ga phía sau).

| Chỉ số toàn pha rút bài (n=12 mỗi bên + 3 trace) | Trước sửa (`e057fcf`) | Sau sửa | Δ trung vị | Mann–Whitney (2 phía) | Đạt quy tắc `\|Δ\| ≥ IQR` & `p < 0,05`? |
|---|---|---|---:|---:|---|
| Số khoảng rAF > 50 ms (n=12) | Trung vị **2,00** · Q1–Q3 `2,00–2,00` · IQR `0,00` | Trung vị **2,00** · Q1–Q3 `2,00–2,00` · IQR `0,00` | `0,00` | U = 72, p = `1,0000` | **Không** |
| Khoảng rAF dài nhất, ms (n=12) | Trung vị **183,40** · Q1–Q3 `179,15–200,00` · IQR `20,85` | Trung vị **166,65** · Q1–Q3 `166,50–183,30` · IQR `16,80` | **−16,75 ms** | U = 33,5, **p = `0,0268`** | **Không** (`16,75 < IQR 20,85`) |
| `LayoutCount` CDP delta (n=12) | Trung vị **12** (12–13) | Trung vị **11** (11–12) | −1 lần | — | Giảm đúng 1 layout của `fitSheet` |
| `LayoutDuration` CDP delta, ms (n=12) | Trung vị **102,29** · IQR `18,34` | Trung vị **105,63** · IQR `17,67` | +3,34 ms | U = 46, p = `0,1410` | **Không** |
| `Layout` dài nhất trong trace (n=3) | `[29,62; 18,60; 19,48]` ms · trung vị **19,48 ms** | `[32,74; 18,58; 17,60]` ms · trung vị **18,58 ms** | −0,90 ms | — (n=3) | Không dùng n=3 để kết luận |
| Tổng `Layout` trong trace (n=3) | `[129,33; 88,25; 92,95]` ms · trung vị **92,95 ms** | `[122,48; 93,46; 88,74]` ms · trung vị **93,46 ms** | +0,51 ms | — (n=3) | — |

### Kết luận trung thực cho A-05 và phát hiện mới ghi nhận (không sửa theo quy tắc 3)
- **Đã đạt mục tiêu kỹ thuật của A-05:** Loại bỏ hoàn toàn `fitSheet()`/đo hình học phiếu ga phía sau và gộp `renderDemoPlaceList()` khỏi pha chốt lá bài (`drawOneCard` giảm xuống ~2,2 ms, giảm 1 lần Layout đồng bộ).
- **Chưa được kết luận "cải thiện" ở chỉ số toàn pha rút bài theo quy tắc thống kê dự án:** Dù `maxGapMs` có `p = 0,0268 < 0,05` (giảm trung vị 16,75 ms), độ giảm này nhỏ hơn `IQR nền = 20,85 ms`, và số khoảng rAF > 50 ms vẫn giữ ở 2.
- **Nguyên nhân đã đo từ Chrome trace (cả 3 trace trước và 3 trace sau):** Commit `e057fcf` (sau rà soát Lượt 2) đã thêm tệp `assets/goi-viet/map-surroundings-preview/card-table-5.js`. Hàm `fitTable()` tại `card-table-5.js:127` chạy ở khung `requestAnimationFrame` ngay sau `commit()` và lặp tìm kiếm nhị phân 5 bước (`setProperty('--card-table-scale', ...)` kèm đọc `scrollBody.scrollHeight <= scrollBody.clientHeight`), gây **6–7 lần Layout đồng bộ tổng cộng 74,5–108,1 ms** (là `FunctionCall` lớn nhất trong cả 6 trace trước/sau: trước sửa `108,1 / 73,9 / 74,1 ms`; sau sửa `90,9 / 78,9 / 74,6 ms`), tạo ra khoảng giật rAF thứ 2 (~166–200 ms). Khoảng > 50 ms thứ nhất (~83–116 ms) là lần dựng style/layout đầu tiên của `#drawnCardViewport` khi hiện thẻ mới (`focusFace('front')` ~34,5 ms). Theo quy tắc 3 (chỉ sửa đúng 3 mục được giao, không sửa ngoài phạm vi), `card-table-5.js` được giữ nguyên và ghi nhận tại đây để tối ưu ở đợt sau (ví dụ tính tỷ lệ từ 1 lần đo `scrollHeight`/`clientHeight` thay vì lặp nhị phân 5 lần).

### Rủi ro còn lại của A-05
- Bất kỳ đoạn mã nào đọc trực tiếp DOM `#demoPlaceList` hoặc `#arrivalSheet` trong khi `#deckModal` vẫn đang mở sẽ thấy trạng thái trước khi đóng modal cho tới khi modal đóng hoặc `renderDemoPlaceList()` được gọi tường minh; toàn bộ luồng người dùng và 6 bộ kiểm chức năng đều chạy ổn định vì nền đang bị `inert` và che phủ bởi modal.

---

## 4. Kết quả 8 bộ kiểm (trước sửa vs sau sửa)

Tất cả chạy tuần tự (không song song), máy chủ `node tools/perf/server.cjs` (cổng `8770`).

| # | Bộ kiểm | Trước sửa (`e057fcf`) | Sau sửa | Ghi chú |
|---:|---|---|---|---|
| 1 | `node tools/check-books-5.cjs` | **PASS** (exit 0) | **PASS** (exit 0, 0,1 s) | 0 lỗi |
| 2 | `node tools/check-i18n-5.cjs` | **PASS** (exit 0) | **PASS** (exit 0, 0,1 s) | 260 markup + 245 code keys khớp VI/EN |
| 3 | `node tools/check-memory-v5.cjs` | **PASS** (exit 0) | **PASS** (exit 0, 21,9 s) | 0 lỗi |
| 4 | `node tools/verify-preview5-conversation-cards.cjs` | **PASS** (exit 0, 38,3 s) | **PASS** (exit 0, 33,9 s) | Đủ 6 viewport, 4 pha hoạt cảnh, thẻ Canva |
| 5 | `node tools/check-station-panel-5.cjs` | **PASS** (exit 0, 66,9 s) | **PASS** (exit 0, 44,9 s) | Đủ 6 cỡ màn, sách nháp, chế độ tối |
| 6 | `node tools/check-family-voyage-5.cjs` | **PASS** (exit 0, 58,9 s) | **PASS** (exit 0, 57,1 s) | 11/11 nhóm đạt, các trang bảo vệ nguyên vẹn |
| 7 | `node tools/check-station-photos-5.cjs` | **FAIL sẵn trên nền** (exit 1, 306,1 s) | **FAIL giống nền** (exit 1, 300,4 s) | 432/432 khung ảnh (6 viewport × 2 ngôn ngữ × 36 ga) đều đạt; dừng ở dòng 241 chờ `#btnPrepareOffline` hiển thị (xem mục 5) |
| 8 | `node tools/check-arrival-demo-5.cjs --preview-5` | **57/59 PASS, 2 FAIL sẵn** (exit 1, 305,1 s) | **57/59 PASS, 2 FAIL giống nền** (exit 1, 313,9 s) | 2 ca fail duy nhất ở bước 1 (1366×768 & 1920×1080) tại dòng 250 `assert(btnPrepareOffline.isVisible())` (xem mục 5) |

---

## 5. Vấn đề có sẵn ngoài phạm vi (ghi nhận, không tự ý sửa)

1. **Lệch giữa `map-surroundings-preview-5.html` ở `e057fcf` với 2 script kiểm (`check-arrival-demo-5.cjs:250` và `check-station-photos-5.cjs:241`) — đã tái hiện cả trước và sau sửa:**
   - Commit `e057fcf` đổi `<section class="settings-offline">` thành `<details class="settings-offline">` đóng mặc định (`map-surroundings-preview-5.html:4796`), nên sau khi bấm `#headerSettings > summary`, nút `#btnPrepareOffline` chưa hiển thị cho đến khi bấm thêm `.settings-offline > summary`.
   - Hai bộ kiểm trên chưa cập nhật thao tác mở `.settings-offline > summary`, dẫn đến fail ở cùng hai điểm cả trước và sau đợt sửa 2. Đã giữ nguyên giao diện và script kiểm theo quy tắc 3; phần ngoại tuyến thực tế đã được kiểm đầy đủ trong phép kiểm E-04 chuyên biệt ở mục 2.
2. **Điểm nghẽn mới `card-table-5.js:127 fitTable()` — đã đo trong trace A-05:**
   - Lặp nhị phân 5 bước gây 6–7 Layout đồng bộ (74,5–108,1 ms) ở khung kế tiếp ngay sau `commit()`, là nguyên nhân chính khiến tổng pha rút bài vẫn còn 2 khoảng rAF > 50 ms (~166–200 ms) dù `fitSheet()` phía sau đã được hoãn. Cần một mục tối ưu riêng cho `card-table-5.js` ở đợt sau.

---

## 6. Danh sách tệp đã thay đổi trong đợt sửa 2

- `map-surroundings-preview-5.html`
- `preview-5-offline-worker.js`
- `assets/goi-viet/map-surroundings-preview/offline-control-5.js`
- `assets/goi-viet/map-surroundings-preview/offline-manifest-5.js` (dựng lại bởi `tools/build-preview-5-offline.py`)
- `assets/goi-viet/map-surroundings-preview/conversation-cards-5.js`
- `assets/goi-viet/map-surroundings-preview/arrival-demo-5/arrival-demo-5.js`
- `assets/goi-viet/map-surroundings-preview/natural/landscape-5.js`
- `docs/06-ra-soat-chuyen-sau/BAO-CAO-SUA-DOT-2.md` (tệp báo cáo mới)

---

## 7. Sửa 2 script kiểm

- **Lý do:** Từ commit `e057fcf`, mục ngoại tuyến trong `#headerSettings` là `<details class="settings-offline">` đóng mặc định (`map-surroundings-preview-5.html:4796`), nên cần mở `details.settings-offline > summary` trước khi kiểm tra hoặc bấm `#btnPrepareOffline`. Không chỉnh sửa HTML/CSS/JS của trang.
- **Tệp:dòng đã đổi:**
  - `tools/check-station-photos-5.cjs:241–244` (hàm `offline()`): sau bước bấm `#headerSettings > summary`, kiểm tra `details.settings-offline` chưa có thuộc tính `open` (`getAttribute('open') === null`) rồi bấm `details.settings-offline > summary` trước khi bấm `#btnPrepareOffline`.
  - `tools/check-arrival-demo-5.cjs:250–252` (hàm `verifySize()`, nhánh `if (integrated)`): sau bước bấm `#headerSettings > summary`, kiểm tra `details.settings-offline` chưa có thuộc tính `open` rồi bấm `details.settings-offline > summary` trước khi assert `#btnPrepareOffline` hiển thị.
- **Kết quả kiểm sau khi sửa (chạy tuần tự trên `node tools/perf/server.cjs`, cổng `8770`):**
  - `node tools/check-station-photos-5.cjs`: **PASS** (exit 0) — `PASS: 35 photos + Hoàng Sa symbol, 6 viewports × 2 languages, 36 book entries, opt-in preparation, and 72 cold-offline frames.`
  - `node tools/check-arrival-demo-5.cjs --preview-5`: **PASS** (exit 0) — **61/61** (`59/59` ca chức năng trên `1366x768`, `1920x1080`, `390x844` + `2/2` ca `C. Performance` với `slowdownPct: 0`, `rafMedian: 16.7 ms`, `longTaskCountMedian: 0`; `0` failures).

# Đề xuất xoá tệp sau rà soát Lượt 1

Có **51 ứng viên** thuộc nhóm 4–5, tổng **16.796.773 byte (16,02 MiB)**. Dung lượng tính theo tệp trong cây làm việc tại thời điểm rà soát.

Độ tin cậy của kết luận là **suy luận từ mã**, đối chiếu với các lượt tải trong Chrome. Chỉ chạy lệnh ghi bên dưới nếu chủ dự án duyệt từng nhóm hoặc từng tệp theo [mục 10 của kế hoạch](audit.md#10-sau-rà-soát-quy-trình-xoá-tệp-chỉ-chạy-khi-chủ-dự-án-đã-duyệt).

Mỗi ứng viên không đến được từ tám trang vào, worker, manifest và công cụ đã quét. Bảng kê lưu nguồn nhắc đến nếu chỉ có tài liệu hoặc nhánh không tới được. Các luồng ít dùng, tên đường dẫn ghép động và bản chạy từ `file://` cần được đối chiếu khi duyệt.

## `assets/fonts/`

1 tệp, tổng **164.700 byte (0,16 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/fonts/Manrope-Variable.ttf](../../assets/fonts/Manrope-Variable.ttf) | 5 | 164700 | Chỉ tham chiếu từ nhánh không đến được: assets/fonts/source.json. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'assets/fonts/Manrope-Variable.ttf'
```

## `assets/goi-viet/`

16 tệp, tổng **10.954.928 byte (10,45 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/goi-viet/homepage-clip.css](../../assets/goi-viet/homepage-clip.css) | 5 | 6080 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/README.md. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/homepage-clip.js](../../assets/goi-viet/homepage-clip.js) | 5 | 7925 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/README.md. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/homepage-layered-poster-3-4k.webp](../../assets/goi-viet/homepage-layered-poster-3-4k.webp) | 5 | 1572748 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/homepage-scene-assets.js](../../assets/goi-viet/homepage-scene-assets.js) | 5 | 4810331 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-camera.js](../../assets/goi-viet/map-camera.js) | 5 | 2786 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-frame-left-v4.webp](../../assets/goi-viet/map-frame-left-v4.webp) | 5 | 1715980 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md; assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-frame-middle-v4.webp](../../assets/goi-viet/map-frame-middle-v4.webp) | 5 | 1518890 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md; assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-frame-right-v4.webp](../../assets/goi-viet/map-frame-right-v4.webp) | 5 | 1238038 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md; assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-native.css](../../assets/goi-viet/map-native.css) | 5 | 15822 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-scene-config.js](../../assets/goi-viet/map-scene-config.js) | 5 | 2366 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-scene.js](../../assets/goi-viet/map-scene.js) | 5 | 16967 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-vector-layout.css](../../assets/goi-viet/map-vector-layout.css) | 5 | 6899 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-vector-scene.js](../../assets/goi-viet/map-vector-scene.js) | 5 | 26898 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-README.md. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/mountains-far.svg](../../assets/goi-viet/mountains-far.svg) | 5 | 4400 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/manifest.json. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/mountains-mid.svg](../../assets/goi-viet/mountains-mid.svg) | 5 | 4216 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/manifest.json. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/mountains-near.svg](../../assets/goi-viet/mountains-near.svg) | 5 | 4582 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/manifest.json. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'assets/goi-viet/homepage-clip.css' 'assets/goi-viet/homepage-clip.js' 'assets/goi-viet/homepage-layered-poster-3-4k.webp' 'assets/goi-viet/homepage-scene-assets.js' 'assets/goi-viet/map-camera.js' 'assets/goi-viet/map-frame-left-v4.webp' 'assets/goi-viet/map-frame-middle-v4.webp' 'assets/goi-viet/map-frame-right-v4.webp' 'assets/goi-viet/map-native.css' 'assets/goi-viet/map-scene-config.js' 'assets/goi-viet/map-scene.js' 'assets/goi-viet/map-vector-layout.css' 'assets/goi-viet/map-vector-scene.js' 'assets/goi-viet/mountains-far.svg' 'assets/goi-viet/mountains-mid.svg' 'assets/goi-viet/mountains-near.svg'
```

## `assets/goi-viet/books-5/`

1 tệp, tổng **3.479 byte (0,00 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/goi-viet/books-5/coming-soon-railway.svg](../../assets/goi-viet/books-5/coming-soon-railway.svg) | 4 | 3479 | Kiểm tra liên kết hoặc hướng dẫn trong [docs/03-p5-song-ngu-va-sach/BAO-CAO-P5-05.md](../../docs/03-p5-song-ngu-va-sach/BAO-CAO-P5-05.md). |

```powershell
git rm -- 'assets/goi-viet/books-5/coming-soon-railway.svg'
```

## `assets/goi-viet/invitation-memory-4/`

2 tệp, tổng **59.776 byte (0,06 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/goi-viet/invitation-memory-4/card-grandmother-small.webp](../../assets/goi-viet/invitation-memory-4/card-grandmother-small.webp) | 5 | 27642 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/invitation-memory-4/card-meal-small.webp](../../assets/goi-viet/invitation-memory-4/card-meal-small.webp) | 5 | 32134 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'assets/goi-viet/invitation-memory-4/card-grandmother-small.webp' 'assets/goi-viet/invitation-memory-4/card-meal-small.webp'
```

## `assets/goi-viet/map-art/`

8 tệp, tổng **9.979 byte (0,01 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/goi-viet/map-art/cuisine.svg](../../assets/goi-viet/map-art/cuisine.svg) | 5 | 467 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-hanoi-v4.svg](../../assets/goi-viet/map-art/landmark-hanoi-v4.svg) | 5 | 2367 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-hanoi.svg](../../assets/goi-viet/map-art/landmark-hanoi.svg) | 5 | 775 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-hue-v4.svg](../../assets/goi-viet/map-art/landmark-hue-v4.svg) | 5 | 2193 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-hue.svg](../../assets/goi-viet/map-art/landmark-hue.svg) | 5 | 893 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-saigon-v4.svg](../../assets/goi-viet/map-art/landmark-saigon-v4.svg) | 5 | 1778 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/landmark-saigon.svg](../../assets/goi-viet/map-art/landmark-saigon.svg) | 5 | 777 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/map-art/sailboat.svg](../../assets/goi-viet/map-art/sailboat.svg) | 5 | 729 | Chỉ tham chiếu từ nhánh không đến được: assets/goi-viet/map-vector-scene.js. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'assets/goi-viet/map-art/cuisine.svg' 'assets/goi-viet/map-art/landmark-hanoi-v4.svg' 'assets/goi-viet/map-art/landmark-hanoi.svg' 'assets/goi-viet/map-art/landmark-hue-v4.svg' 'assets/goi-viet/map-art/landmark-hue.svg' 'assets/goi-viet/map-art/landmark-saigon-v4.svg' 'assets/goi-viet/map-art/landmark-saigon.svg' 'assets/goi-viet/map-art/sailboat.svg'
```

## `assets/goi-viet/memory-native-v4/`

2 tệp, tổng **747.758 byte (0,71 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [assets/goi-viet/memory-native-v4/red-sailboat-1280.webp](../../assets/goi-viet/memory-native-v4/red-sailboat-1280.webp) | 5 | 374394 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [assets/goi-viet/memory-native-v4/sauce-dish-1280.webp](../../assets/goi-viet/memory-native-v4/sauce-dish-1280.webp) | 5 | 373364 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'assets/goi-viet/memory-native-v4/red-sailboat-1280.webp' 'assets/goi-viet/memory-native-v4/sauce-dish-1280.webp'
```

## `image/`

21 tệp, tổng **4.856.153 byte (4,63 MiB)**.

| Tệp | Nhóm | Byte | Bằng chứng và rủi ro |
|---|---:|---:|---|
| [image/bg_test_inpaint.jpg](../../image/bg_test_inpaint.jpg) | 5 | 509681 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/card_extracted.png](../../image/card_extracted.png) | 5 | 375378 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_l_alpha.png](../../image/crane_l_alpha.png) | 5 | 92138 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_l_from_flip.png](../../image/crane_l_from_flip.png) | 5 | 124218 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_l_mask_test.png](../../image/crane_l_mask_test.png) | 5 | 1797 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_left.png](../../image/crane_left.png) | 5 | 81099 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_map.png](../../image/crane_map.png) | 5 | 69034 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_r_alpha.png](../../image/crane_r_alpha.png) | 5 | 124240 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crane_right.png](../../image/crane_right.png) | 5 | 100400 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/crop_r_inspect.png](../../image/crop_r_inspect.png) | 5 | 109337 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/fg_left_crop.png](../../image/fg_left_crop.png) | 5 | 444730 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/fg_left_sway.png](../../image/fg_left_sway.png) | 5 | 458455 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/fg_right_crop.png](../../image/fg_right_crop.png) | 5 | 445789 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/fg_right_sway.png](../../image/fg_right_sway.png) | 5 | 458570 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/leaf_green.png](../../image/leaf_green.png) | 5 | 6481 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/logo_crane1.png](../../image/logo_crane1.png) | 5 | 54241 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/logo_crane2.png](../../image/logo_crane2.png) | 5 | 70153 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/logo_crop.png](../../image/logo_crop.png) | 5 | 141381 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/petal_pink.png](../../image/petal_pink.png) | 5 | 1563 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/top_crop.png](../../image/top_crop.png) | 5 | 641076 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |
| [image/train_crop.png](../../image/train_crop.png) | 5 | 546392 | Không tìm được tham chiếu đến đường dẫn trong phạm vi quét. Rủi ro còn lại là đường dẫn động chưa quan sát. |

```powershell
git rm -- 'image/bg_test_inpaint.jpg' 'image/card_extracted.png' 'image/crane_l_alpha.png' 'image/crane_l_from_flip.png' 'image/crane_l_mask_test.png' 'image/crane_left.png' 'image/crane_map.png' 'image/crane_r_alpha.png' 'image/crane_right.png' 'image/crop_r_inspect.png' 'image/fg_left_crop.png' 'image/fg_left_sway.png' 'image/fg_right_crop.png' 'image/fg_right_sway.png' 'image/leaf_green.png' 'image/logo_crane1.png' 'image/logo_crane2.png' 'image/logo_crop.png' 'image/petal_pink.png' 'image/top_crop.png' 'image/train_crop.png'
```

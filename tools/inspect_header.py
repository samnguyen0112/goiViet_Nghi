from PIL import Image
import numpy as np

header = np.asarray(Image.open('verification/header_ref.png'))
h, w = header.shape[:2]

# Let's find button bounding boxes in the header by looking at color changes along y=35
# Turn banner: starts around x=11, width ~394
# Progress banner: starts around x=415, width ~141
# Red button (Rút Vé Ngẫu Nhiên): starts around x=567
# Green button (Bưu Thiếp): starts around x=772
# Settings (Tùy chọn): starts around x=916 or so

# Let's check columns where vertical edges exist
diff = np.abs(header[15:55, 1:, :] - header[15:55, :-1, :]).mean(axis=(0, 2))
edges = np.where(diff > 15)[0]

print("Prominent vertical edges in header:", edges)

# Also let's inspect the actual rendered header in qa-final/map-entry-1597.png
entry = np.asarray(Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png'))
entry_header = entry[24:94, 465:1579]
Image.fromarray(entry_header).save('verification/header_actual.png')

mae = np.abs(header.astype(float) - entry_header.astype(float)).mean()
print(f"Header MAE before changes: {mae:.2f}")

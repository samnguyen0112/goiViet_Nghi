from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/hanoi_ref.png'))
act = np.asarray(Image.open('verification/hanoi_act.png'))

diff = np.abs(ref.astype(float) - act.astype(float))
Image.fromarray(diff.astype(np.uint8)).save('verification/hanoi_diff.png')

# Let's inspect rows
for y in range(0, 176, 25):
    print(f"Row {y:3d}..{min(y+25, 176):3d}: MAE = {diff[y:min(y+25, 176), :].mean():.2f}")

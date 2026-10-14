from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/header_ref.png'))
act = np.asarray(Image.open('verification/header_actual.png'))

# In ref, find columns where pixels are non-background:
# What is background of header? Header bg is a paper texture around (242, 230, 210)
# Let's inspect the buttons in ref:
# Let's print out the layout by scanning across x:
# 1. Turn banner:
# 2. Progress banner:
# 3. Header actions:
# Let's save a visualization where we draw bounding boxes
import cv2

# Look for borders:
# Red button has border/fill: #a61f1a / #b92822
# Green button has border/fill: #0c4d4e / #125e5e
# Let's find any column where ANY pixel in y in [15..55] has red button color
red_cols = np.any((ref[15:55, :, 0] > 130) & (ref[15:55, :, 1] < 70), axis=0)
green_cols = np.any((ref[15:55, :, 1] > 60) & (ref[15:55, :, 0] < 50) & (ref[15:55, :, 2] > 50), axis=0)

def col_extent(mask):
    idx = np.where(mask)[0]
    return idx.min(), idx.max(), idx.max() - idx.min() + 1

print("Ref Red button x-extent:", col_extent(red_cols))
print("Ref Green button x-extent:", col_extent(green_cols))

# Let's check act red and green extents
act_red_cols = np.any((act[15:55, :, 0] > 130) & (act[15:55, :, 1] < 70), axis=0)
act_green_cols = np.any((act[15:55, :, 1] > 60) & (act[15:55, :, 0] < 50) & (act[15:55, :, 2] > 50), axis=0)
print("Act Red button x-extent:", col_extent(act_red_cols))
print("Act Green button x-extent:", col_extent(act_green_cols))

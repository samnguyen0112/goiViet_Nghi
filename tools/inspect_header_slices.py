from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/map-repair-20261013/reference.png'))
h = ref[24:94, 465:1579]

names = ['turn', 'progress', 'red_btn', 'green_btn', 'settings']
slices = [h[:, 0:415], h[:, 415:565], h[:, 565:830], h[:, 830:970], h[:, 970:1114]]

for name, s in zip(names, slices):
    print(f"{name:10s}: mean={s.mean():.1f}, bg(y=35, x=15)={s[35, 15].tolist()}, border(y=10, x=15)={s[10, 15].tolist()}")

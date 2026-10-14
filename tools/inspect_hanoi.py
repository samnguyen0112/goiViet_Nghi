from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/map-repair-20261013/reference.png'))
act = np.asarray(Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png'))

a = ref[395:571, 1108:1558]
b = act[395:571, 1108:1558]

Image.fromarray(a).save('verification/hanoi_ref.png')
Image.fromarray(b).save('verification/hanoi_act.png')

print("Ref hanoi mean:", a.mean())
print("Act hanoi mean:", b.mean())
print("Diff max:", np.abs(a.astype(float) - b.astype(float)).max())
print("Diff mean:", np.abs(a.astype(float) - b.astype(float)).mean())

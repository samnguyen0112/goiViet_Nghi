from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/map-repair-20261013/reference.png'))[24:94, 465:1579]
act = np.asarray(Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png'))[24:94, 465:1579]

# Look at y=35 across x=600 to 1050
print("Comparing colors at y=35 every 20px:")
for x in range(600, 1050, 20):
    print(f"x={x:4d}: ref={ref[35, x].tolist()}  act={act[35, x].tolist()}  diff={np.abs(ref[35, x].astype(int)-act[35, x].astype(int)).sum()}")

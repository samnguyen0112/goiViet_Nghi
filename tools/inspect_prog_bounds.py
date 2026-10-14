from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/header_ref.png'))
act = np.asarray(Image.open('verification/header_actual.png'))

# Progress banner has tan/peach bg [240, 213, 176]
# Let's find first and last pixel of progress banner in ref and act
for x in range(350, 500):
    p = ref[25, x]
    if p[0] > 230 and p[1] > 200 and p[2] < 190:
        print(f"Ref Prog first pixel at x={x}: {p}")
        break

for x in range(500, 650):
    p = ref[25, x]
    if not (p[0] > 230 and p[1] > 200 and p[2] < 190):
        print(f"Ref Prog ends before x={x}: {p}")
        break

for x in range(350, 500):
    p = act[25, x]
    if p[0] > 230 and p[1] > 200 and p[2] < 190:
        print(f"Act Prog first pixel at x={x}: {p}")
        break

for x in range(500, 650):
    p = act[25, x]
    if not (p[0] > 230 and p[1] > 200 and p[2] < 190):
        print(f"Act Prog ends before x={x}: {p}")
        break

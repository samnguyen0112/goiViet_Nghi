from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/header_ref.png'))
act = np.asarray(Image.open('verification/header_actual.png'))

# Find the exact columns where the red button starts and ends in ref:
# Red button has dark crimson border around y=25
# Let's check pixel colors at y=25 across all x
for x in range(500, 800):
    p = ref[25, x]
    if p[0] > 140 and p[1] < 50: # red button fill
        print(f"Ref Red button first red pixel at x={x}: {p}")
        break

for x in range(700, 900):
    p = ref[25, x]
    if p[0] > 140 and p[1] < 50: # red button fill
        last_red = x
print(f"Ref Red button last red pixel at x={last_red}")

for x in range(700, 950):
    p = ref[25, x]
    if p[1] > 60 and p[0] < 40 and p[2] > 50: # green button fill
        print(f"Ref Green button first green pixel at x={x}: {p}")
        break

for x in range(800, 1000):
    p = ref[25, x]
    if p[1] > 60 and p[0] < 40 and p[2] > 50: # green button fill
        last_green = x
print(f"Ref Green button last green pixel at x={last_green}")

# Now check act!
for x in range(500, 800):
    p = act[25, x]
    if p[0] > 140 and p[1] < 50:
        print(f"Act Red button first red pixel at x={x}: {p}")
        break

for x in range(700, 900):
    p = act[25, x]
    if p[0] > 140 and p[1] < 50:
        last_act_red = x
print(f"Act Red button last red pixel at x={last_act_red}")

for x in range(700, 950):
    p = act[25, x]
    if p[1] > 60 and p[0] < 40 and p[2] > 50:
        print(f"Act Green button first green pixel at x={x}: {p}")
        break

for x in range(800, 1000):
    p = act[25, x]
    if p[1] > 60 and p[0] < 40 and p[2] > 50:
        last_act_green = x
print(f"Act Green button last green pixel at x={last_act_green}")

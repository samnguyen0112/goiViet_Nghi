from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/map-repair-20261013/reference.png'))
act = np.asarray(Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png'))

# Station panel box: (1085, 118, 1580, 895)
# width = 1580 - 1085 = 495, height = 895 - 118 = 777
sp_ref = ref[118:895, 1085:1580]
sp_act = act[118:895, 1085:1580]

Image.fromarray(sp_ref).save('verification/station_panel_ref.png')
Image.fromarray(sp_act).save('verification/station_panel_actual.png')

print("Station panel shape:", sp_ref.shape)
print("Station panel MAE before:", np.abs(sp_ref.astype(float) - sp_act.astype(float)).mean())

# Let's inspect rows to see which vertical sections have the largest MAE
for y in range(0, 777, 80):
    sub = np.abs(sp_ref[y:min(y+80, 777)].astype(float) - sp_act[y:min(y+80, 777)].astype(float)).mean()
    print(f"Row {y}..{min(y+80, 777)}: MAE = {sub:.2f}")

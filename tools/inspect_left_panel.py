from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/map-repair-20261013/reference.png'))
act = np.asarray(Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png'))

# Left helper box: (20, 248, 360, 478)
lp_ref = ref[248:478, 20:360]
lp_act = act[248:478, 20:360]

Image.fromarray(lp_ref).save('verification/left_panel_ref.png')
Image.fromarray(lp_act).save('verification/left_panel_actual.png')

print("Left panel shape:", lp_ref.shape)
print("Left panel MAE before:", np.abs(lp_ref.astype(float) - lp_act.astype(float)).mean())

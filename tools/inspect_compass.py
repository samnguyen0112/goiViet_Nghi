from PIL import Image
import numpy as np

# Check compass region in ref and act
ref = Image.open('verification/map-repair-20261013/reference.png')
act = Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png')

# Compass center: (109, 791), radius: 56
# Box: x: 53..165, y: 735..847
c_ref = ref.crop((53, 735, 165, 847))
c_act = act.crop((53, 735, 165, 847))

c_ref.save('verification/compass_crop_ref.png')
c_act.save('verification/compass_crop_act.png')

print("Compass MAE:", np.abs(np.asarray(c_ref).astype(float) - np.asarray(c_act).astype(float)).mean())

from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/header_ref.png'))
act = np.asarray(Image.open('verification/header_actual.png'))

settings_ref = ref[10:60, 975:1065]
settings_act = act[10:60, 975:1065]
Image.fromarray(settings_ref).save('verification/settings_ref.png')
Image.fromarray(settings_act).save('verification/settings_act.png')

print("Settings ref shape:", settings_ref.shape)
print("Settings ref bg:", settings_ref[25, 20])
print("Settings ref text color:", settings_ref[25, 45])
print("Settings act bg:", settings_act[25, 20])
print("Settings act text color:", settings_act[25, 45])
print("Settings MAE:", np.abs(settings_ref.astype(float) - settings_act.astype(float)).mean())

from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/header_ref.png'))
act = np.asarray(Image.open('verification/header_actual.png'))

prog_ref = ref[10:60, 415:556]
prog_act = act[10:60, 415:556]
Image.fromarray(prog_ref).save('verification/prog_ref.png')
Image.fromarray(prog_act).save('verification/prog_act.png')

print("Prog ref dimensions:", prog_ref.shape)
print("Prog ref background:", prog_ref[25, 20])
print("Prog ref text color:", prog_ref[25, 70])
print("Prog act background:", prog_act[25, 20])
print("Prog act text color:", prog_act[25, 70])
print("Progress banner MAE:", np.abs(prog_ref.astype(float) - prog_act.astype(float)).mean())

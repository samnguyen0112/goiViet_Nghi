from PIL import Image
import numpy as np

ref = np.asarray(Image.open('verification/hanoi_ref.png'))
act = np.asarray(Image.open('verification/hanoi_act.png'))

# Find green pills:
# green pill color: #194a3e (RGB: ~25, 74, 62)
# red pill color: #962820 (RGB: ~150, 40, 32)
# Find where green pill is in ref vs act:
ref_green_pill = (ref[:, :, 1] > 60) & (ref[:, :, 0] < 45) & (ref[:, :, 2] > 50) & (ref[:, :, 2] < 80)
act_green_pill = (act[:, :, 1] > 60) & (act[:, :, 0] < 45) & (act[:, :, 2] > 50) & (act[:, :, 2] < 80)

print("Ref green pill y-coords:", np.where(ref_green_pill)[0].min() if np.any(ref_green_pill) else None, "to", np.where(ref_green_pill)[0].max() if np.any(ref_green_pill) else None)
print("Act green pill y-coords:", np.where(act_green_pill)[0].min() if np.any(act_green_pill) else None, "to", np.where(act_green_pill)[0].max() if np.any(act_green_pill) else None)

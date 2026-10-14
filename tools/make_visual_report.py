from PIL import Image, ImageDraw, ImageFont
import numpy as np

ref = Image.open('verification/map-repair-20261013/reference.png').convert('RGB')
act = Image.open('verification/map-repair-20261013/qa-final/map-entry-1597.png').convert('RGB')

w, h = ref.size
# Create a side-by-side image with labels
combined = Image.new('RGB', (w * 2 + 20, h + 60), (245, 240, 230))
d = ImageDraw.Draw(combined)

combined.paste(ref, (0, 60))
combined.paste(act, (w + 20, 60))

# Save
combined.save('verification/final_side_by_side.png')
print("Saved verification/final_side_by_side.png")

# Also let's compute absolute diff image amplified by 3x for auditing
diff = Image.fromarray(np.clip(np.abs(np.asarray(ref).astype(float) - np.asarray(act).astype(float)) * 3, 0, 255).astype(np.uint8))
diff.save('verification/amplified_diff_3x.png')
print("Saved verification/amplified_diff_3x.png")

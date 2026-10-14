import cv2
import numpy as np
from PIL import Image, ImageFilter

# 1. Load original
im_pil = Image.open('image/Giao diện trang đầu.jpg').convert('RGB')
im = np.array(im_pil)
h, w, _ = im.shape

# Create working copy
scenery = im.copy()

# 2. CLEAN SKY & LOGO & SLOGAN
# Region: x=380..1220, y=20..335
# Above distant mountain horizon (y < 260):
# Sky is smooth peach watercolor: sample left sky (x=340..420) and right sky (x=1180..1260)
# Create seamless vertical peach gradient with subtle watercolor paper grain
y_coords = np.arange(260)
# Top sky color around [246, 230, 214], bottom sky color around [249, 241, 226]
top_color = im[10:30, 400:460].mean(axis=(0, 1))
bot_color = im[240:260, 400:460].mean(axis=(0, 1))

sky_patch = np.zeros((260, 840, 3), dtype=np.float32)
for y in range(260):
    t = y / 259.0
    col = (1.0 - t) * top_color + t * bot_color
    sky_patch[y, :, :] = col

# Add subtle watercolor grain
np.random.seed(42)
noise = np.random.normal(0, 1.2, sky_patch.shape)
sky_patch = np.clip(sky_patch + noise, 0, 255).astype(np.uint8)

# Feathered alpha blend into the sky
mask_sky = np.zeros((260, 840), dtype=np.float32)
# center is 1, edges blend to 0
for x in range(840):
    if x < 70:
        mask_sky[:, x] = x / 70.0
    elif x > 770:
        mask_sky[:, x] = (840 - x) / 70.0
    else:
        mask_sky[:, x] = 1.0

# Blend sky patch
orig_sky = scenery[20:280, 380:1220]
blended_sky = (sky_patch * mask_sky[:, :, None] + orig_sky * (1.0 - mask_sky[:, :, None])).astype(np.uint8)
scenery[20:280, 380:1220] = blended_sky

# 3. Clean Distant Horizon / Slogan area (y=260..335, x=380..1220)
# Inpaint text in this region
mask_text = np.zeros((h, w), dtype=np.uint8)
# Slogan text is dark red/brown: R < 140, G < 100, B < 90
crop_slogan = scenery[260:335, 380:1220]
slogan_mask = (crop_slogan[:, :, 0] < 155) & (crop_slogan[:, :, 1] < 120) & (crop_slogan[:, :, 2] < 110)
# Also logo bottom ribbons
mask_text[260:335, 380:1220] = (slogan_mask.astype(np.uint8)) * 255
# Dilate mask slightly
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
mask_text[250:340, 370:1230] = cv2.dilate(mask_text[250:340, 370:1230], kernel, iterations=2)
scenery = cv2.inpaint(scenery, mask_text, 5, cv2.INPAINT_TELEA)

# 4. Clean 3 Station Pills (y=335..395, x=310..1285)
# Inpaint the badges
mask_stations = np.zeros((h, w), dtype=np.uint8)
# Pills are at:
# Pill 1: x=310..610, y=340..395
# Pill 2: x=650..950, y=340..395
# Pill 3: x=985..1285, y=340..395
# Also dotted connector lines: y=360..375
mask_stations[338:398, 310:1285] = 255
# Dilate mask 2px
mask_stations = cv2.dilate(mask_stations, kernel, iterations=1)
scenery = cv2.inpaint(scenery, mask_stations, 7, cv2.INPAINT_TELEA)

# 5. Clean Cranes in Sky (Left & Right)
mask_cranes = np.zeros((h, w), dtype=np.uint8)
# Left crane feathers/legs: x=60..320, y=60..240
crop_cl = scenery[60:240, 60:320]
hsv_cl = cv2.cvtColor(crop_cl, cv2.COLOR_RGB2HSV)
m_cl = ((hsv_cl[:,:,1] < 50) & (hsv_cl[:,:,2] > 200)) | (hsv_cl[:,:,2] < 60) | ((hsv_cl[:,:,0] < 10) & (hsv_cl[:,:,1] > 100))
mask_cranes[60:240, 60:320] = cv2.dilate(m_cl.astype(np.uint8) * 255, kernel, iterations=2)

# Right crane: x=1330..1560, y=100..310
crop_cr = scenery[100:310, 1330:1560]
hsv_cr = cv2.cvtColor(crop_cr, cv2.COLOR_RGB2HSV)
m_cr = ((hsv_cr[:,:,1] < 50) & (hsv_cr[:,:,2] > 200)) | (hsv_cr[:,:,2] < 60) | ((hsv_cr[:,:,0] < 10) & (hsv_cr[:,:,1] > 100))
mask_cranes[100:310, 1330:1560] = cv2.dilate(m_cr.astype(np.uint8) * 255, kernel, iterations=2)

scenery = cv2.inpaint(scenery, mask_cranes, 5, cv2.INPAINT_TELEA)

# 6. Clean Card Area below the bridge (y=585..930, x=280..1315)
# Inpaint / reconstruct the river valley, water ripples, and clouds
mask_card = np.zeros((h, w), dtype=np.uint8)
mask_card[588:930, 280:1315] = 255
# Dilate
mask_card = cv2.dilate(mask_card, kernel, iterations=2)

# Use seamless cloning / Navier-Stokes inpaint with watercolor texture
scenery = cv2.inpaint(scenery, mask_card, 15, cv2.INPAINT_NS)

# Save result
out_img = Image.fromarray(scenery)
out_img.save('verification/previews/scenery_clean_test.jpg', quality=95)
print('Scenery clean test saved successfully.')

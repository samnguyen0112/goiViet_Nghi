import cv2
import numpy as np
from PIL import Image, ImageFilter

# Load original reference image
im_pil = Image.open('image/Giao diện trang đầu.jpg').convert('RGB')
orig = np.array(im_pil)
h, w, _ = orig.shape

scenery = orig.copy()

# =========================================================================
# 1. SKY RECONSTRUCTION (Remove logo, nón lá, slogan, and top cranes)
# =========================================================================
# Sky region: x = 340..1260, y = 0..270
# Sample authentic peach sky colors from undisturbed regions
# Left sky sample: x=340..420, y=10..220
# Right sky sample: x=1180..1260, y=10..220
left_sky = orig[10:240, 360:440]
right_sky = orig[10:240, 1160:1240]

# Build smooth 2D gradient based on actual sky color profile
# At top (y=0): peach tone
# At horizon (y=260): warm cream tone
top_l = orig[15:35, 380:440].mean(axis=(0, 1))
top_r = orig[15:35, 1160:1220].mean(axis=(0, 1))
bot_l = orig[230:260, 380:440].mean(axis=(0, 1))
bot_r = orig[230:260, 1160:1220].mean(axis=(0, 1))

sky_fill = np.zeros((265, 840, 3), dtype=np.float32)
for y in range(265):
    ty = y / 264.0
    for x in range(840):
        tx = x / 839.0
        # Bi-linear interpolation of natural sky corners
        c_top = (1.0 - tx) * top_l + tx * top_r
        c_bot = (1.0 - tx) * bot_l + tx * bot_r
        sky_fill[y, x] = (1.0 - ty) * c_top + ty * c_bot

# Add subtle watercolor paper texture noise
np.random.seed(123)
grain = np.random.normal(0, 1.4, sky_fill.shape)
sky_fill = np.clip(sky_fill + grain, 0, 255).astype(np.uint8)

# Feather mask horizontally so transitions to mountains are seamless
blend_mask = np.zeros((265, 840), dtype=np.float32)
for x in range(840):
    if x < 80:
        blend_mask[:, x] = (x / 80.0) ** 1.5
    elif x > 760:
        blend_mask[:, x] = ((840 - x) / 80.0) ** 1.5
    else:
        blend_mask[:, x] = 1.0

# Apply sky fill to center sky
current_area = scenery[10:275, 380:1220]
scenery[10:275, 380:1220] = (sky_fill * blend_mask[:, :, None] + current_area * (1.0 - blend_mask[:, :, None])).astype(np.uint8)

# Inpaint bottom ribbon of logo & slogan text at distant horizon (y=255..335)
kernel_s = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
mask_slogan = np.zeros((h, w), dtype=np.uint8)
# Slogan text is dark ink
sub = scenery[255:335, 370:1230]
text_pixels = (sub[:, :, 0] < 165) & (sub[:, :, 1] < 130) & (sub[:, :, 2] < 120)
mask_slogan[255:335, 370:1230] = cv2.dilate(text_pixels.astype(np.uint8) * 255, kernel_s, iterations=2)
scenery = cv2.inpaint(scenery, mask_slogan, 5, cv2.INPAINT_TELEA)

# =========================================================================
# 2. REMOVE CRANES FROM SKY (Leaving clean sky for live dynamic cranes)
# =========================================================================
mask_cranes = np.zeros((h, w), dtype=np.uint8)
# Left crane: x=60..300, y=60..230
cl_crop = scenery[60:230, 60:300]
hsv_cl = cv2.cvtColor(cl_crop, cv2.COLOR_RGB2HSV)
m_cl = ((hsv_cl[:,:,1] < 55) & (hsv_cl[:,:,2] > 200)) | (hsv_cl[:,:,2] < 60) | ((hsv_cl[:,:,0] < 10) & (hsv_cl[:,:,1] > 90))
mask_cranes[60:230, 60:300] = cv2.dilate(m_cl.astype(np.uint8) * 255, kernel_s, iterations=2)

# Right crane: x=1330..1560, y=95..310
cr_crop = scenery[95:310, 1330:1560]
hsv_cr = cv2.cvtColor(cr_crop, cv2.COLOR_RGB2HSV)
m_cr = ((hsv_cr[:,:,1] < 55) & (hsv_cr[:,:,2] > 200)) | (hsv_cr[:,:,2] < 60) | ((hsv_cr[:,:,0] < 10) & (hsv_cr[:,:,1] > 90))
mask_cranes[95:310, 1330:1560] = cv2.dilate(m_cr.astype(np.uint8) * 255, kernel_s, iterations=2)

scenery = cv2.inpaint(scenery, mask_cranes, 6, cv2.INPAINT_TELEA)

# =========================================================================
# 3. REMOVE STATION PILLS ABOVE TRAIN (y=340..395)
# =========================================================================
# The station pills sit right above the train and bridge
mask_station_pills = np.zeros((h, w), dtype=np.uint8)
mask_station_pills[340:398, 310:1285] = 255
mask_station_pills = cv2.dilate(mask_station_pills, kernel_s, iterations=2)
scenery = cv2.inpaint(scenery, mask_station_pills, 7, cv2.INPAINT_TELEA)

# =========================================================================
# 4. RESTORE NATURAL LOWER VALLEY (Below viaduct bridge, where card was)
# =========================================================================
# The stone bridge viaduct runs at y=520..585.
# Bridge pillars repeat every ~120px: x = 200, 320, 440, 560, 680, 800, 920, 1040, 1160, 1280...
# Under the bridge: extend pillars down to y=640, then rolling emerald green hills, mist, water ripples!
# On left (x < 280) and right (x > 1310), the hills are intact.
# We blend the hills from left and right into the center with soft organic mist.

# Sample rolling green tea hills from left and right
left_hills = scenery[590:930, 60:300]
right_hills = scenery[590:930, 1290:1530]

# Create gentle emerald valley background for y=585..930, x=270..1325
valley_w = 1325 - 270
valley_h = 930 - 585
valley_bg = np.zeros((valley_h, valley_w, 3), dtype=np.float32)

# Gradient from misty river water (top) to tea hill green (bottom)
mist_col = np.array([218, 230, 222], dtype=np.float32) # soft sage mist
water_col = np.array([120, 172, 156], dtype=np.float32) # emerald river water
hill_col = np.array([86, 142, 122], dtype=np.float32) # tea hill green

for y in range(valley_h):
    ty = y / (valley_h - 1.0)
    col = (1.0 - ty) * mist_col + ty * hill_col
    valley_bg[y, :] = col

# Add subtle watercolor ripples
x_coords = np.arange(valley_w)
y_grid = np.arange(valley_h)[:, None]
wave = np.sin(x_coords[None, :] * 0.04 + y_grid * 0.06) * 4.0
valley_bg[:, :, 0] += wave
valley_bg[:, :, 1] += wave * 1.2
valley_bg[:, :, 2] += wave * 0.8
valley_bg = np.clip(valley_bg, 0, 255).astype(np.uint8)

# Feather blend into existing landscape
valley_mask = np.ones((valley_h, valley_w), dtype=np.float32)
for x in range(valley_w):
    if x < 80:
        valley_mask[:, x] = (x / 80.0) ** 1.5
    elif x > valley_w - 80:
        valley_mask[:, x] = ((valley_w - x) / 80.0) ** 1.5

# Top feather (transition from bridge arches)
for y in range(min(50, valley_h)):
    valley_mask[y, :] *= (y / 50.0) ** 1.2
# Bottom feather (transition to tea hills at y=925)
for y in range(min(50, valley_h)):
    valley_mask[valley_h - 1 - y, :] *= (y / 50.0) ** 1.2

curr_valley = scenery[585:930, 270:1325]
scenery[585:930, 270:1325] = (valley_bg * valley_mask[:, :, None] + curr_valley * (1.0 - valley_mask[:, :, None])).astype(np.uint8)

# Extend stone bridge pillars down naturally from y=585 to y=630
# Pillar positions: x in [320, 440, 560, 680, 800, 920, 1040, 1160, 1280]
for px in [320, 440, 560, 680, 800, 920, 1040, 1160]:
    pillar_sample = scenery[560:585, px-18:px+18]
    # Fade pillar down into mist
    for dy in range(45):
        alpha = max(0.0, 1.0 - dy / 45.0)
        scenery[585+dy, px-18:px+18] = (pillar_sample[min(dy, 24), :] * alpha + scenery[585+dy, px-18:px+18] * (1.0 - alpha)).astype(np.uint8)

# Save the master clean scenery
out_path = 'assets/goi-viet/bg-landscape-master.jpg'
out_img = Image.fromarray(scenery)
out_img.save(out_path, quality=95)
out_img.save('verification/previews/clean_master_scenery.jpg', quality=95)
print('Successfully generated clean master landscape painting without baked UI!')

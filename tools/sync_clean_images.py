import shutil, os
from PIL import Image

src_clean = r'C:\Users\Uy\.gemini\antigravity\brain\b43a428e-40d5-4df0-9ae2-df5c2a4e80c7\clean_landscape_1791738227831.jpg'
clean_im = Image.open(src_clean)

# Find any file in image/ that starts with 'Giao di'
img_dir = 'image'
for fname in os.listdir(img_dir):
    if fname.startswith('Giao di') and not fname.endswith('.original.jpg'):
        orig_path = os.path.join(img_dir, fname)
        backup_path = os.path.join(img_dir, fname + '.original.jpg')
        if not os.path.exists(backup_path):
            shutil.copyfile(orig_path, backup_path)
        clean_orig_ratio = clean_im.resize((1594, 987), Image.Resampling.LANCZOS)
        clean_orig_ratio.save(orig_path, quality=95)

clean_1920 = clean_im.resize((1920, 1072), Image.Resampling.LANCZOS)
clean_1920.save('assets/goi-viet/scenery-clean-master.jpg', quality=95)
clean_1920.save('assets/goi-viet/bg-landscape-master.jpg', quality=95)
clean_1920.save('assets/goi-viet/bg-landscape-clean.jpg', quality=95)
clean_1920.save('image/bg_landscape_clean.jpg', quality=95)
clean_1920.save('image/bg_pure_landscape.jpg', quality=95)

print('Success: All scenery images synchronized with clean artwork!')

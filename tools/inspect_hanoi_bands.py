from PIL import Image
import numpy as np

top = np.asarray(Image.open('verification/hanoi_ref_top.png'))
mid = np.asarray(Image.open('verification/hanoi_ref_mid.png'))
bot = np.asarray(Image.open('verification/hanoi_ref_bot.png'))

print("Top band mean:", top.mean())
print("Mid band mean:", mid.mean())
print("Bot band mean:", bot.mean())

# In top band, what are the pixels?
# Is there a title at the top, or is the title at the bottom?
# Let's inspect where text is:
print("Top row 10 pixel colors sampled across width:")
for x in range(20, 450, 40):
    print(f"x={x}: top={top[10, x].tolist()}")

print("Bot row 30 pixel colors sampled across width:")
for x in range(20, 450, 40):
    print(f"x={x}: bot[30]={bot[30, x].tolist()}")

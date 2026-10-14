from PIL import Image
import numpy as np

turn = np.asarray(Image.open('verification/turn_ref.png'))
print("Turn ref dimensions:", turn.shape)
print("Top-left pixel:", turn[2, 2])
print("Middle background pixel:", turn[25, 20])
print("Text pixel:", turn[25, 50])
print("Button area middle pixel:", turn[25, 280])
print("Border color:", turn[0, 20])

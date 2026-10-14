from pathlib import Path
import json
import numpy as np
import cv2
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[1];O=R/'assets/goi-viet/map-source-layers'
im=Image.open(R/'verification/map-reference-20261013/reference.png').convert('RGB')
hero=im.crop((1108,395,1558,571));a=np.asarray(hero);mask=Image.new('L',hero.size);d=ImageDraw.Draw(mask)
d.rounded_rectangle((10,8,214,49),radius=20,fill=255)
d.rounded_rectangle((316,8,441,49),radius=20,fill=255)
ink=np.zeros((176,450),np.uint8)
for x,y,w,h in [(7,110,323,34),(7,142,421,27)]:
 region=a[y:y+h,x:x+w].astype(float)
 ink[y:y+h,x:x+w]=((region[:,:,0]>160)&(region[:,:,1]>152)&(region[:,:,2]>125)&(region.max(axis=2)-region.min(axis=2)<80)).astype('uint8')*255
ink=cv2.dilate(ink,np.ones((5,5),np.uint8))
allmask=np.maximum(np.asarray(mask),ink)
source=hero.convert('RGBA');source.putalpha(Image.fromarray(255-allmask));source.save(O/'hanoi-illustration-source.png')
Image.fromarray(allmask).save(O/'hanoi-illustration-missing.mask.png')
# Keep recovery distinct, auditable, and marked as approximate. No panel controls
# or source lettering are included in this painting asset.
repaired=cv2.inpaint(a,allmask,5,cv2.INPAINT_TELEA)
Image.fromarray(repaired).save(O/'hanoi-illustration-with-occlusion-repair.png')
for name,box in [('chip-hanoi',(1197,705,1253,743)),('chip-heritage',(1355,702,1406,742)),('chip-cuisine',(1492,701,1542,743))]:
 art=im.crop(box).convert('RGBA');pix=np.asarray(art);alpha=((pix[:,:,0]<215)|(pix[:,:,1]<165)|(pix[:,:,2]<125)).astype('uint8')*255
 art.putalpha(Image.fromarray(alpha));art.save(O/(name+'.png'))
meta={'heroSourceRegion':[1108,395,450,176],'heroOriginal':'hanoi-illustration-source.png','missingMask':'hanoi-illustration-missing.mask.png','displayFile':'hanoi-illustration-with-occlusion-repair.png','repairIsOriginal':False,'note':'Visible painting pixels unchanged. Only original badge/text occlusions filled approximately; live DOM labels cover those locations. No claim of exact hidden artwork.'}
icons={
 'filter-all':(1117,278,1137,303),'filter-food':(1201,279,1220,302),
 'filter-art':(1302,279,1326,303),'filter-festival':(1399,278,1420,303),
 'filter-craft':(1484,279,1507,305),'island-heading':(41,270,85,297),
 'turn':(748,45,775,73),'ticket':(1108,48,1129,70),'postcard':(1310,48,1333,69),
 'region':(1133,412,1151,434)}
meta['icons']=[]
for name,box in icons.items():
 art=im.crop(box).convert('RGBA');pix=np.asarray(art).astype(float)
 if name in ['ticket','postcard']:alpha=(pix[:,:,0]>170)&(pix[:,:,1]>160)&(pix[:,:,2]>135)
 else:alpha=(pix[:,:,0]>pix[:,:,1]*1.15)&(pix[:,:,1]<175)
 art.putalpha(Image.fromarray((alpha*255).astype('uint8')));art.save(O/(name+'.png'))
 meta['icons'].append({'file':name+'.png','sourceRegion':list(box),'mask':'pigment/foreground contrast; source RGB unchanged'})
(O/'panel-art-manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
print('Panel illustration extracted; missing background repair explicitly separated')

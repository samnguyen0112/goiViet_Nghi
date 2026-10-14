"""Independent scenery, object and province layers with continuous underpainting.

Visible pixels come from the reference. Missing underpainting is explicitly
marked as an approximation; it is not reported as recovered original artwork.
"""
from pathlib import Path
import json,hashlib
import numpy as np
import cv2
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt

R=Path(__file__).resolve().parents[1];O=R/'assets/goi-viet/map-art-v3';O.mkdir(exist_ok=True)
S=R/'verification/map-repair-20261013/reference.png'
im=Image.open(S).convert('RGB');rgb=np.asarray(im);H,W=rgb.shape[:2]
oldroot=R/'assets/goi-viet/map-source-layers'
old=json.loads((oldroot/'manifest.json').read_text(encoding='utf-8'))
gs=(oldroot/'geometry.js').read_text(encoding='utf-8');geo=json.loads(gs[gs.index('=')+1:].rstrip(';\n'))
data=json.loads((R/'verification/map-source-layers-20261013/geometry.json').read_text(encoding='utf-8'))
atlas=np.asarray(Image.open(oldroot/'province-hit-atlas.png')).copy()
layers=[]
def region(box=None,poly=None,ellipse=None):
 m=Image.new('L',(W,H));d=ImageDraw.Draw(m)
 if box:d.rectangle(box,fill=255)
 if poly:d.polygon(poly,fill=255)
 if ellipse:d.ellipse(ellipse,fill=255)
 return np.asarray(m)>0
def oldmask(name):
 l=next(l for l in old['layers'] if l['id']==name);m=np.zeros((H,W),np.uint8)
 a=np.asarray(Image.open(oldroot/l['file']).getchannel('A'));m[l['y']:l['y']+l['height'],l['x']:l['x']+l['width']]=a
 return m>0
def repair(image,mask,radius=5):
 return cv2.inpaint(image,(mask*255).astype('uint8'),radius,cv2.INPAINT_TELEA)
def save(name,image,mask,space,z,role,missing=None):
 ys,xs=np.where(mask)
 if not len(xs):return
 x,y,r,b=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
 art=Image.fromarray(image[y:b,x:r]).convert('RGBA');a=Image.fromarray((mask[y:b,x:r]*255).astype('uint8'))
 art.putalpha(a);art.save(O/(name+'.png'));a.save(O/(name+'.mask.png'))
 layers.append(dict(id=name,file=name+'.png',x=x,y=y,width=r-x,height=b-y,sourceRegion=[x,y,r-x,b-y],mask=name+'.mask.png',space=space,z=z,role=role,occlusionRepair=missing or 'none'))

ui=np.zeros((H,W),bool)
for box in [(465,24,1579,94),(20,248,360,478),(1085,118,1580,895),(16,886,351,956)]:ui|=region(box)
ui|=region(ellipse=(53,735,165,847))
labels=np.zeros_like(ui)
for box in old['excludedUI']:labels|=region(box)
labels=cv2.dilate(labels.astype('uint8'),np.ones((3,3),np.uint8))>0
without_text=repair(rgb,labels,5)
# Large hidden areas are reconstructed at low resolution; they remain behind
# fixed controls in the reference view. Export the repair mask for auditing.
small=cv2.resize(without_text,(W//3,H//3),interpolation=cv2.INTER_AREA)
smallmask=cv2.resize((ui*255).astype('uint8'),(W//3,H//3),interpolation=cv2.INTER_NEAREST)
reconstructed=cv2.resize(cv2.inpaint(small,smallmask,6,cv2.INPAINT_TELEA),(W,H),interpolation=cv2.INTER_CUBIC)
scenery=without_text.copy();scenery[ui]=reconstructed[ui]
sea_region=region(poly=[(908,0),(1596,0),(1596,984),(730,984),(500,930),(470,820),(555,755),(640,685),(675,580),(634,490),(582,375),(580,318),(620,277),(695,246),(758,201),(800,165),(834,110),(870,62)])
sea_sample=without_text[517:629,843:1073]
sea_row=np.concatenate([sea_sample,sea_sample[:,::-1]],axis=1)
sea_texture=np.concatenate([sea_row,sea_row[::-1]],axis=0)
sea_hidden=np.tile(sea_texture,(H//sea_texture.shape[0]+1,W//sea_texture.shape[1]+1,1))[:H,:W]
paper_sample=without_text[510:525,456:482]
paper_hidden=np.tile(paper_sample,(H//15+1,W//26+1,1))[:H,:W]
# Use known neighbouring painting at every repair boundary, then transition
# gradually into the inferred material. Every pixel outside UI remains 100% untouched.
near_indices=distance_transform_edt(ui,return_distances=False,return_indices=True)
near_paint=without_text[near_indices[0],near_indices[1]]
distance=distance_transform_edt(ui)
soft_near=cv2.GaussianBlur(near_paint,(0,0),7)
near_weight=np.clip(distance/10,0,1)
near_paint=(near_paint.astype(float)*(1-near_weight[:,:,None])+soft_near.astype(float)*near_weight[:,:,None]).astype('uint8')
weight=np.clip(distance/45,0,1);weight=weight*weight*(3-2*weight)
material=np.where(sea_region[:,:,None],sea_hidden,paper_hidden)
forest=region((12,238,368,486))|region((8,878,359,964))|region(ellipse=(53,735,165,847))
forest_sample=without_text[480:730,0:165]
forest_tile=np.tile(forest_sample,(H//250+1,W//165+1,1))[:H,:W]
material[forest]=forest_tile[forest]
blend=(near_paint.astype(float)*(1-weight[:,:,None])+material.astype(float)*weight[:,:,None]).astype('uint8')
scenery=without_text.copy();scenery[ui]=blend[ui]

# Object masks do not carry rectangular sea/background patches.
object_masks={n:oldmask(n) for n in ['logo-calligraphy','tower-hanoi','gate-hue','market-saigon','sailboat','railway-ink']}
crane_poly=[(170,653),(210,632),(237,611),(216,582),(232,568),(212,546),(201,523),(198,500),(192,479),(220,493),(251,519),(278,544),(290,570),(311,575),(327,544),(343,531),(391,513),(354,539),(342,559),(333,586),(321,602),(350,627),(386,665),(406,681),(378,676),(346,660),(320,648),(291,628),(268,624),(244,639),(216,655),(178,665)]
object_masks['crane']=region(poly=crane_poly)
gc=object_masks['crane'].astype('uint8')*cv2.GC_PR_FGD
near=cv2.dilate(object_masks['crane'].astype('uint8'),np.ones((9,9),np.uint8))>0
gc[~near]=cv2.GC_BGD
gc[cv2.erode(object_masks['crane'].astype('uint8'),np.ones((7,7),np.uint8))>0]=cv2.GC_FGD
cv2.grabCut(rgb.copy(),gc,None,np.zeros((1,65)),np.zeros((1,65)),3,cv2.GC_INIT_WITH_MASK)
object_masks['crane']=(gc==cv2.GC_FGD)|(gc==cv2.GC_PR_FGD)
for n in ['islands-hoang-sa','islands-truong-sa','island-phu-quoc','island-con-dao']:
 m=oldmask(n);warm=(rgb[:,:,0].astype(float)>rgb[:,:,1]*.95)&(rgb[:,:,0].astype(float)>rgb[:,:,2]*1.03)
 m=m&warm;m=cv2.dilate(m.astype('uint8'),np.ones((3,3),np.uint8))>0
 object_masks[n]=m

# Complete the terrain beneath original signboards and architectural objects.
terrain=np.asarray(Image.open(oldroot/'terrain-hit-mask.png'))>0
terrain=cv2.morphologyEx(terrain.astype('uint8'),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))>0
for box in old['excludedUI'][4:7]:
 candidate=region(box);ys,xs=np.where(candidate)
 for y in np.unique(ys):
  above=max(0,y-35);below=min(H-1,y+35)
  spans=[]
  for row in [above,below]:
   xx=np.where(terrain[row])[0]
   if len(xx):spans.append((xx.min(),xx.max()))
  if len(spans)==2:
   left=int(np.mean([s[0] for s in spans]));right=int(np.mean([s[1] for s in spans]))
   terrain[y,left:right+1]|=candidate[y,left:right+1]
terrain=cv2.morphologyEx(terrain.astype('uint8'),cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))>0
map_rgb=without_text.copy()
remove_arch=np.zeros_like(terrain)
for n in ['tower-hanoi','gate-hue','market-saigon']:remove_arch|=object_masks[n]
map_rgb=repair(map_rgb,remove_arch|object_masks['railway-ink'],4)

# Keep all 34 province cells and their hit geometry independent. No position,
# story, deck, ID or geographic source data is changed.
atlas[(atlas>34)]=0
atlas[~terrain]=0
missing=terrain&(atlas==0)
nearest=distance_transform_edt(atlas==0,return_distances=False,return_indices=True)
atlas[missing]=atlas[nearest[0][missing],nearest[1][missing]]
for idx,p in enumerate(data['provinces']):
 save('province-'+p['id'],map_rgb,atlas==idx+1,'map',2,'Province '+p['name'],'Original labels and landmarks removed; their hidden terrain is approximated')

relief=cv2.dilate(terrain.astype('uint8'),np.ones((9,9),np.uint8))>0
relief&=~terrain
save('terrain-relief-edge',without_text,relief,'map',1.8,'Painted relief side and cast shadow')
for n in ['railway-ink','tower-hanoi','gate-hue','market-saigon','sailboat','islands-hoang-sa','islands-truong-sa','island-phu-quoc','island-con-dao']:
 save(n,rgb,object_masks[n]&~labels&~ui,'map',4 if n=='railway-ink' else 5,n)
for n in ['logo-calligraphy','crane']:save(n,rgb,object_masks[n],'fixed' if n=='logo-calligraphy' else 'map',9,n)

# Build continuous underpainting. Every removed object is backed by a filled
# scene; moving the map no longer reveals UI-shaped or object-shaped holes.
removed=terrain|relief
for n,m in object_masks.items():
 if n!='railway-ink':removed|=m

small=cv2.resize(scenery,(W//3,H//3),interpolation=cv2.INTER_AREA)
rm=cv2.resize((removed*255).astype('uint8'),(W//3,H//3),interpolation=cv2.INTER_NEAREST)
fill=cv2.resize(cv2.inpaint(small,rm,7,cv2.INPAINT_TELEA),(W,H),interpolation=cv2.INTER_CUBIC)
continuous=scenery.copy();continuous[removed]=fill[removed]

sea=region(poly=[(908,0),(1596,0),(1596,984),(730,984),(500,930),(470,820),(555,755),(640,685),(675,580),(634,490),(582,375),(580,318),(620,277),(695,246),(758,201),(800,165),(834,110),(870,62)])
# Large-map inpainting must not propagate red terrain into the exposed ocean.
# Fill only the unavailable underpainting from clean, original sea/paper
# samples; all visible reference scenery stays untouched.
tile=without_text[517:629,843:1073].copy()
row=np.concatenate([tile,tile[:,::-1]],axis=1)
tile=np.concatenate([row,row[::-1]],axis=0)
Image.fromarray(tile).save(O/'ocean-extension.png')
sea_fill=np.tile(tile,(H//tile.shape[0]+1,W//tile.shape[1]+1,1))[:H,:W]
paper_tile=without_text[510:525,456:482].copy()
paper_fill=np.tile(paper_tile,(H//paper_tile.shape[0]+1,W//paper_tile.shape[1]+1,1))[:H,:W]
continuous[removed&sea]=sea_fill[removed&sea]
continuous[removed&~sea]=paper_fill[removed&~sea]
logo_repair=cv2.dilate(object_masks['logo-calligraphy'].astype('uint8'),np.ones((5,5),np.uint8))>0
logo_background=repair(scenery,logo_repair,5)
continuous[logo_repair]=logo_background[logo_repair]
green=(continuous[:,:,1]>continuous[:,:,0]*.94)&(continuous[:,:,1]>continuous[:,:,2]*.95)&(continuous.min(axis=2)<210)
warm=(continuous[:,:,0]>continuous[:,:,1]*1.13)&(continuous[:,:,0]>continuous[:,:,2]*1.12)
fore={
 'mountains-left':region(poly=[(0,165),(75,200),(140,265),(190,385),(290,490),(390,630),(450,770),(555,984),(0,984)])&(green|warm),
 'mountains-middle':region(poly=[(283,190),(395,162),(478,230),(548,329),(577,378),(624,475),(655,560),(644,669),(590,750),(541,804),(439,723),(372,523)])&green,
 'mountains-right':region(poly=[(1170,0),(1596,0),(1596,984),(1010,984),(1120,883),(1420,700),(1540,375),(1540,100)])&green,
 'clouds-bottom':region(poly=[(300,897),(390,908),(476,925),(560,950),(636,940),(790,971),(875,946),(940,916),(1010,914),(1080,930),(1190,984),(300,984)])&~green,
}
for name in fore:fore[name]&=~removed&~ui&~labels
fore_union=np.zeros_like(terrain)
for m in fore.values():fore_union|=m
base=repair(continuous,fore_union,7)
save('sea-plane',base,sea,'map',0,'Continuous sea plane, original waves; hidden regions reconstructed','Unseen pixels behind UI/map/objects approximated and marked in missing-source.mask.png')
save('mainland-paper-plane',base,~sea,'map',0,'Continuous mainland paper and distant atmosphere','Unseen pixels behind extracted objects approximated')
for n,m in fore.items():save(n,continuous,m,'map',1,n,'Sections originally hidden by controls approximated')
Image.fromarray(((ui|labels|removed)*255).astype('uint8')).save(O/'missing-source.mask.png')

hitIds=list(geo['provinceIds'])
for iid,n in [('hoang-sa','islands-hoang-sa'),('truong-sa','islands-truong-sa'),('phu-quoc','island-phu-quoc'),('con-dao','island-con-dao')]:
 atlas[object_masks[n]]=len(hitIds)+1;hitIds.append(iid)
Image.fromarray(atlas.astype('uint8')).save(O/'hit-atlas.png')
geo['hitIds']=hitIds
geo['provinceContours']={}
for idx,p in enumerate(data['provinces']):
 cs,_=cv2.findContours((atlas==idx+1).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 geo['provinceContours'][p['id']]=[cv2.approxPolyDP(c,.8,True).reshape(-1,2).tolist() for c in cs if cv2.contourArea(c)>5]
 geo['provinceCenters'][idx]['name']=p['name']
 geo['provinceCenters'][idx]['world']=p['center']
 # Visible and accessible label anchors stay inside the corresponding cell.
 x,y=np.round(geo['provinceCenters'][idx]['point']).astype(int)
 if atlas[y,x]!=idx+1:
  yy,xx=np.where(atlas==idx+1);j=np.argmin((xx-x)**2+(yy-y)**2)
  geo['provinceCenters'][idx]['point']=[int(xx[j]),int(yy[j])]

manifest=dict(version=3,source=str(S.relative_to(R)),sourceSha256=hashlib.sha256(S.read_bytes()).hexdigest(),viewport=[W,H],layers=layers,railCenterline=old['railCenterline'],backgroundContinuous=True,provinceLayerCount=34,missingSourceMask='missing-source.mask.png',limitations=['Hidden background/terrain cannot be recovered from a flattened reference; those repaired pixels are explicitly approximate.','Province geometry is fitted from the existing geographic dataset, not recovered source vectors.'],referenceImageIsRuntimeLayer=False)
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(O/'layout.js').write_text('window.GoiVietSourceLayout='+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
(O/'geometry.js').write_text('window.GoiVietSourceGeometry='+json.dumps(geo,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f"Built {len(layers)} independent layers, including 34 province layers and continuous scenery")

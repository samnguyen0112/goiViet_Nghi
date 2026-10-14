"""Semantic, independently editable layers from the supplied flattened painting.

No full-screen reference layer is exported. UI/text is excluded. The manifest
records missing/occluded pixels instead of inventing an original behind them.
"""
from pathlib import Path
import json, hashlib
import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'verification/map-reference-20261013/reference.png'
OUT=ROOT/'assets/goi-viet/map-source-layers'; OUT.mkdir(exist_ok=True)
im=Image.open(SRC).convert('RGBA'); W,H=im.size
rgb=np.asarray(im)[:,:,:3]; occupied=np.zeros((H,W),bool)
layers=[]
def shape(poly=None,rect=None,ellipse=None,rounded=None):
    a=Image.new('L',(W,H));d=ImageDraw.Draw(a)
    if poly:d.polygon(poly,fill=255)
    if rect:d.rectangle(rect,fill=255)
    if ellipse:d.ellipse(ellipse,fill=255)
    if rounded:d.rounded_rectangle(rounded[:4],radius=rounded[4],fill=255)
    return np.asarray(a)>0

# Exclude complete live panels. No panel or information-card screenshot is used.
ui=np.zeros((H,W),bool)
for box in [(465,24,1578,93,16),(20,248,359,476,17),(1086,119,1579,894,22),(17,887,350,954,16)]:ui|=shape(rounded=box)
ui|=shape(ellipse=(47,731,172,852))
labels=np.zeros_like(ui)
label_boxes=[(718,129,841,152),(439,364,483,387),(490,530,581,555),(500,657,616,680),
 (634,211,773,265),(726,452,829,494),(533,700,665,756),(404,750,526,790),(720,874,811,913),
 (916,438,1062,507),(889,788,1051,858)]
for i,box in enumerate(label_boxes):
    if 4<=i<=8:labels|=shape(rounded=(*box,22 if i in [4,6] else 18))
    else:
        region=shape(rect=box)
        if i<4:
            ink=(rgb[:,:,0]<195)&(rgb[:,:,1]<184)&(rgb[:,:,2]<164)
        else:
            ink=(rgb[:,:,0]>154)&(rgb[:,:,1]>160)&(rgb[:,:,2]>135)
        glyph=(region&ink).astype('uint8')
        labels|=cv2.dilate(glyph,np.ones((3,3),np.uint8))>0
excluded=ui|labels

def save(name,mask,role,space='scenery',z=0,exclusive=True):
    global occupied
    mask=mask&~excluded
    if exclusive:mask&=~occupied
    ys,xs=np.where(mask)
    if not len(xs):return
    x,y,r,b=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
    crop=im.crop((x,y,r,b));alpha=Image.fromarray((mask[y:b,x:r]*255).astype('uint8'))
    crop.putalpha(alpha);crop.save(OUT/(name+'.png'));alpha.save(OUT/(name+'.mask.png'))
    layers.append(dict(id=name,file=name+'.png',mask=name+'.mask.png',sourceRegion=[x,y,r-x,b-y],x=x,y=y,width=r-x,height=b-y,z=z,space=space,role=role,sourcePixels=True,missing='Underlying pixels behind other extracted objects, panels, text, and controls are not present in the source.'))
    if exclusive:occupied|=mask
    return mask

# Object-level masks keep the exact boundary pixels, including painted shadows.
save('logo-calligraphy',shape(rect=(43,17,384,226)) & ((rgb[:,:,0]>rgb[:,:,1]*1.2)&(rgb[:,:,0]>rgb[:,:,2]*1.15)) | shape(poly=[(298,34),(343,46),(327,91),(308,79)]),'Calligraphy, ribbon and folded paper','fixed',20)
crane=shape(poly=[(173,650),(208,634),(238,610),(218,583),(230,568),(208,544),(197,519),(192,487),(221,499),(251,522),(278,548),(288,568),(308,574),(327,545),(343,534),(391,514),(357,536),(343,555),(331,583),(320,602),(343,628),(379,669),(349,663),(320,648),(292,628),(269,623),(244,637),(216,651),(180,660)])
save('crane',crane,'Crane silhouette, original feathers and ink','fixed',8)
objects={
 'tower-hanoi':[(596,225),(601,207),(601,187),(607,185),(606,175),(613,173),(614,166),(619,173),(626,176),(631,193),(636,218),(635,228)],
 'gate-hue':[(691,451),(694,432),(695,412),(708,411),(711,404),(723,408),(735,399),(743,406),(756,410),(769,403),(774,418),(780,430),(782,451)],
 'market-saigon':[(704,785),(708,771),(719,768),(720,749),(727,745),(731,737),(737,744),(744,748),(746,768),(761,770),(768,787)],
 'sailboat':[(904,284),(918,279),(914,263),(917,229),(926,216),(947,204),(965,191),(973,205),(983,223),(990,252),(996,269),(1018,276),(1018,285),(1002,305),(976,312),(947,310),(923,300)]}
for name,poly in objects.items():save(name,shape(poly=poly),name,'map',5)
for name,box in [('islands-hoang-sa',(852,354,1002,439)),('islands-truong-sa',(907,626,1068,786)),('island-phu-quoc',(432,793,491,850)),('island-con-dao',(695,848,737,875))]:
    save(name,shape(rect=box),name,'map',3)

# Terrain includes relief sides and shadow. White railway pixels are separated.
terrain_roi=shape(poly=[(400,170),(456,143),(486,128),(531,107),(569,103),(604,124),(647,119),(669,143),(659,183),(703,193),(735,218),(713,256),(645,303),(637,346),(651,381),(679,414),(725,441),(758,476),(787,523),(813,587),(824,650),(833,704),(850,742),(819,780),(760,801),(693,838),(647,874),(617,904),(578,917),(551,893),(554,854),(540,827),(508,819),(538,790),(566,771),(610,756),(649,725),(677,700),(679,648),(691,599),(693,557),(659,515),(636,480),(606,451),(594,415),(563,392),(557,366),(536,354),(547,326),(552,304),(528,284),(498,282),(472,264),(450,244),(425,237),(403,212)])
warm=(rgb[:,:,0].astype(float)>rgb[:,:,1]*1.13)&(rgb[:,:,0].astype(float)>rgb[:,:,2]*1.25)
terrain_raw=(terrain_roi & warm & ~excluded).astype('uint8')
terrain_raw=cv2.morphologyEx(terrain_raw,cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))
contours,_=cv2.findContours(terrain_raw,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
terrain_mask=np.zeros((H,W),np.uint8)
for c in contours:
    if cv2.contourArea(c)>350:cv2.drawContours(terrain_mask,[c],-1,1,cv2.FILLED)
terrain_mask=cv2.dilate(terrain_mask,np.ones((5,5),np.uint8))>0
rail=[(488,156),(495,188),(512,210),(548,226),(578,235),(605,238),(603,270),(590,291),(578,309),(571,330),(573,350),(583,365),(594,376),(616,395),(632,415),(640,440),(655,460),(676,471),(698,474),(713,494),(731,517),(745,542),(751,563),(749,590),(747,615),(752,642),(753,668),(749,691),(736,715),(715,740),(687,761),(660,777),(643,793),(627,810),(611,832),(599,850),(589,872)]
railCorridor=Image.new('L',(W,H));ImageDraw.Draw(railCorridor).line(rail,fill=255,width=17)
railMask=(np.asarray(railCorridor)>0)&(rgb[:,:,0]>196)&(rgb[:,:,1]>170)&(rgb[:,:,2]>115)
save('railway-ink',railMask,'Original railway ink; train samples the traced source centerline','map',4)
terrain=save('vietnam-terrain',terrain_mask,'Complete original painted terrain and relief, no synthetic facets','map',2)

# Semantic scenery areas, not a tiled full-screen screenshot. Their union covers
# only non-UI source artwork. Every piece can be moved/replaced independently.
sea_poly=[(908,0),(1596,0),(1596,890),(1480,932),(1190,943),(1060,923),(1005,916),(974,938),(913,941),(863,962),(791,979),(721,954),(662,939),(605,951),(552,937),(500,902),(479,850),(475,783),(528,744),(588,719),(639,676),(660,608),(674,550),(635,495),(628,444),(586,379),(581,321),(618,277),(694,246),(756,201),(798,167),(831,113),(869,62)]
save('sea-and-wave-ink',shape(poly=sea_poly),'Original sea and wave strokes at source coordinates','scenery',0)
save('mountains-right',shape(poly=[(1200,0),(1596,0),(1596,984),(1016,984),(1080,919),(1140,888),(1290,832),(1400,700),(1540,380),(1542,80)]),'Right mountain, cloud and lotus painting','fixed',1)
save('clouds-bottom',shape(poly=[(318,894),(392,905),(464,922),(505,943),(564,947),(635,937),(725,949),(783,970),(875,942),(930,915),(994,916),(1050,910),(1120,945),(1210,984),(318,984)]),'Bottom cloud bank and its original contours','fixed',2)
save('mountains-left',shape(poly=[(0,165),(60,184),(119,227),(214,239),(306,262),(376,367),(403,465),(415,550),(439,657),(451,736),(489,823),(542,918),(600,984),(0,984)]),'Left mountains, forest, lotus and atmospheric cloud painting','fixed',1)
save('mountains-middle',shape(poly=[(284,185),(402,152),(485,237),(547,328),(579,378),(623,474),(659,557),(650,658),(604,745),(541,807),(455,748),(413,626),(365,486)]),'Middle mountain ranges and valleys','scenery',1)
save('paper-land-and-top-clouds',np.ones((H,W),bool),'Remaining mainland paper, northern mountains and top cloud ink','scenery',0)

# Store precise source hit silhouette separately (no pixels are painted by it).
hitmask=(terrain_mask & ~ui & ~labels).astype('uint8')
Image.fromarray(hitmask*255).save(OUT/'terrain-hit-mask.png')
manifest=dict(source=str(SRC.relative_to(ROOT)),sourceSha256=hashlib.sha256(SRC.read_bytes()).hexdigest(),viewport=[W,H],layers=layers,railCenterline=rail,excludedUI=label_boxes,limitations=['Source pixels behind extracted objects or UI are unavailable.','Raster map is original; province ownership is fitted from existing geographic data and must not be mistaken for source vector boundaries.'],referenceImageIsRuntimeLayer=False)
# The tiny glyph holes have no original background information. A separate,
# explicitly non-source repair layer fills ONLY those holes behind live text.
glyphholes=labels.copy()
for box in label_boxes[4:9]:glyphholes[shape(rect=box)]=False
repaired=cv2.inpaint(rgb,(glyphholes*255).astype('uint8'),3,cv2.INPAINT_TELEA)
repair=Image.fromarray(repaired).convert('RGBA');repair.putalpha(Image.fromarray((glyphholes*255).astype('uint8')))
repair.save(OUT/'text-occlusion-fill.png')
manifest['textOcclusionFill']={'file':'text-occlusion-fill.png','sourcePixels':False,'role':'Approximate missing background at removed glyphs only; never counted as recovered original pixels.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'layout.js').write_text('window.GoiVietSourceLayout='+json.dumps(manifest,ensure_ascii=False)+';\n',encoding='utf-8')
# QA composite of ART ONLY, never loaded by the website.
preview=Image.new('RGBA',(W,H),(232,218,187,255))
for l in layers:
    asset=Image.open(OUT/l['file']);preview.alpha_composite(asset,(l['x'],l['y']))
preview.convert('RGB').save(ROOT/'verification/map-source-layers-20261013/art-only-inspection.png')
print(f'{len(layers)} independent source layers; {int(occupied.sum())} non-UI pixels retained')

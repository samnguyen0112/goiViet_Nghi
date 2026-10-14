from pathlib import Path
import json
import numpy as np
import cv2
from PIL import Image,ImageDraw
from scipy.ndimage import distance_transform_edt
R=Path(__file__).resolve().parents[1];O=R/'assets/goi-viet/map-source-layers'
g=json.loads((R/'verification/map-source-layers-20261013/geometry.json').read_text(encoding='utf-8'))
m=json.loads((O/'manifest.json').read_text(encoding='utf-8'))
mask=np.asarray(Image.open(O/'terrain-hit-mask.png'))>0
anchors=np.array([[27.1,110],[175.6,238],[285.1,309],[344.5,376],[466.8,474],[680.5,642],[797.1,777],[874,810],[916,872],[952.2,908]])
rail=np.array([[p['wx'],p['wy']] for p in g['rail']]);rail=rail[np.argsort(rail[:,1])]
ref=np.array(m['railCenterline']);ref=ref[np.argsort(ref[:,1])]
segments=[]
for p in g['provinces']:
 for ring in p['rings']:
  for a,b in zip(ring,ring[1:]):segments.append([*a,*b])
segments=np.array(segments);rows=[]
last=(37.,478.,405.,730.)
for y in range(0,1001):
 py=float(np.interp(y,anchors[:,0],anchors[:,1]))
 active=segments[((segments[:,1]<=y)&(segments[:,3]>y))|((segments[:,3]<=y)&(segments[:,1]>y))]
 xs=active[:,0]+(y-active[:,1])*(active[:,2]-active[:,0])/(active[:,3]-active[:,1]) if len(active) else []
 srcxs=np.where(mask[min(984,max(0,round(py)))])[0]
 if len(xs)>1 and len(srcxs)>1:last=(float(min(xs)),float(max(xs)),float(min(srcxs)),float(max(srcxs)))
 lo,hi,tlo,thi=last
 rx=float(np.interp(y,rail[:,1],rail[:,0]));tx=float(np.interp(py,ref[:,1],ref[:,0]))
 rx=max(lo+1,min(hi-1,rx));tx=max(tlo+1,min(thi-1,tx))
 rows.append([py,lo,rx,hi,tlo,tx,thi])
def project(pt):
 x,y=pt;i=max(0,min(999,int(y)));f=max(0,min(1,y-i));a=np.array(rows[i])*(1-f)+np.array(rows[i+1])*f
 py,lo,rx,hi,tlo,tx,thi=a
 if x<lo:px=tlo+(x-lo)*.9
 elif x>hi:px=thi+(x-hi)*.9
 elif x<=rx:px=tlo+(x-lo)/(rx-lo)*(tx-tlo)
 else:px=tx+(x-rx)/(hi-rx)*(thi-tx)
 return [float(px),float(py)]
atlas=Image.new('L',(1597,985));draw=ImageDraw.Draw(atlas)
for idx,p in enumerate(g['provinces']):
 for ring in p['rings']:draw.polygon([tuple(project(pt)) for pt in ring],fill=idx+1)
a=np.array(atlas);a[~mask]=0
missing=mask&(a==0)
nearest=distance_transform_edt(a==0,return_distances=False,return_indices=True)
a[missing]=a[nearest[0][missing],nearest[1][missing]]
islands={'hoang-sa':[925,399],'truong-sa':[990,708],'phu-quoc':[457,818],'con-dao':[716,864]}
hitIds=[p['id'] for p in g['provinces']]
for iid in islands:
 layer=next(l for l in m['layers'] if l['id'] in ['islands-'+iid,'island-'+iid])
 art=np.asarray(Image.open(O/layer['file']).convert('RGBA')).astype(float)
 land=(art[:,:,0]>art[:,:,1]*.96)&(art[:,:,0]>art[:,:,2]*1.05)&(art[:,:,3]>0)
 x,y=layer['x'],layer['y'];h,w=land.shape
 a[y:y+h,x:x+w][land]=len(hitIds)+1;hitIds.append(iid)
Image.fromarray(a).save(O/'province-hit-atlas.png')
contoursById={}
for idx,p in enumerate(g['provinces']):
 cs,_=cv2.findContours((a==idx+1).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 contoursById[p['id']]=[cv2.approxPolyDP(c,1,True).reshape(-1,2).tolist() for c in cs if cv2.contourArea(c)>8]
adjust=[]
for island in g['islands']:
 if island['id'] in islands:
  base=project(island['pt']);target=islands[island['id']]
  adjust.append(dict(id=island['id'],world=island['pt'],point=target,delta=[target[0]-base[0],target[1]-base[1]]))
result=dict(rows=rows,provinceIds=[p['id'] for p in g['provinces']],hitIds=hitIds,provinceContours=contoursById,provinceCenters=[dict(id=p['id'],point=project(p['center'])) for p in g['provinces']],islands=adjust,baseZoom=.849,basePitch=.16)
(O/'geometry.js').write_text('window.GoiVietSourceGeometry='+json.dumps(result,separators=(',',':'))+';\n',encoding='utf-8')
print('Fitted source silhouette, province hit atlas, railway and island anchors')

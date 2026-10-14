"""Derive numeric palettes/outlines from existing semantic layers, never a backdrop crop."""
from pathlib import Path
import json
import re
import math
import numpy as np
import cv2
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets/goi-viet/map-art-v3'
layout=json.loads((ART/'layout.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n\r '))
colors={}
islands={}
geo=json.loads((ART/'geometry.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n\r '))
data=json.loads(re.search(r'^const DATA = (.+);$',(ROOT/'index.html').read_text(encoding='utf-8'),re.M).group(1))

def spline(points,steps=10):
    out=[]
    for i in range(len(points)-1):
        p0,p1,p2,p3=[points[max(0,min(len(points)-1,j))] for j in [i-1,i,i+1,i+2]]
        for k in range(steps):
            t=k/steps
            out.append([.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t*t*t) for j in range(2)])
    return out+[points[-1]]

places={p['id']:p for p in data['provinces34']}
spine=['hn','hy','nb','th','na','ht','qt','hue','dn','qng','gl','dl','kh','dna','hcm','vl','ct','cm']
warp={'scaleX':.95,'heightAnchors':[[27.1,110],[175.6,238],[285.1,309],[344.5,376],[466.8,474],[680.5,642],[797.1,777],[874,810],[916,872],[952.2,908]],'worldRail':sorted(spline([places[k]['center'] for k in spine]),key=lambda p:p[1]),'sourceRail':sorted(spline(layout['railCenterline']),key=lambda p:p[1]),'islands':[]}

def interpolate(rows,key,value,extrapolate=False):
    if not extrapolate:value=max(rows[0][key],min(rows[-1][key],value))
    i=1
    while i<len(rows)-1 and rows[i][key]<value:i+=1
    a,b=rows[i-1],rows[i];t=(value-a[key])/max(.001,b[key]-a[key])
    return [x+(y-x)*t for x,y in zip(a,b)]

def project(point):
    wx,wy=point
    py=interpolate(warp['heightAnchors'],0,wy,True)[1]
    rx=interpolate(warp['worldRail'],1,wy)[0];tx=interpolate(warp['sourceRail'],1,py)[0]
    x=tx+(wx-rx)*warp['scaleX'];yy=py
    for island in warp['islands']:
        distance=math.hypot(wx-island['world'][0],wy-island['world'][1]);weight=math.exp(-distance*distance/1600)
        x+=island['delta'][0]*weight;yy+=island['delta'][1]*weight
    return [x,yy]

for island in geo['islands']:
    point=project(island['world'])
    warp['islands'].append({'id':island['id'],'world':island['world'],'delta':[island['point'][0]-point[0],island['point'][1]-point[1]]})

def subdivide(a,b,depth=0):
    pa,pb=project(a),project(b)
    middle=[(a[0]+b[0])/2,(a[1]+b[1])/2];pm=project(middle)
    error=math.hypot(pm[0]-(pa[0]+pb[0])/2,pm[1]-(pa[1]+pb[1])/2)
    if error>.55 and depth<7:return subdivide(a,middle,depth+1)[:-1]+subdivide(middle,b,depth+1)
    return [pa,pb]

# Shared source arcs are projected once, keeping adjacent borders identical.
arc_ids={idx if idx>=0 else -idx-1 for p in data['provinces34'] for ring in p['rings'] for idx in ring}
arcs={}
for idx in arc_ids:
    native=data['arcs'][idx];points=[]
    for a,b in zip(native,native[1:]):points.extend(subdivide(a,b)[:-1])
    if native:points.append(project(native[-1]))
    arcs[idx]=[[round(x,2),round(y,2)] for x,y in points]
province_contours={}
centers=[]
for p in data['provinces34']:
    rings=[]
    for indices in p['rings']:
        ring=[]
        for idx in indices:
            arc=arcs[idx] if idx>=0 else list(reversed(arcs[-idx-1]))
            ring.extend(arc if not ring else arc[1:])
        if len(ring)>=3:rings.append(ring)
    province_contours[p['id']]=rings
    centers.append({'id':p['id'],'name':p['name'],'point':project(p['center']),'world':p['center']})
for layer in layout['layers']:
    if layer['id'].startswith('province-'):
        pixels=np.asarray(Image.open(ART/layer['file']).convert('RGBA'))
        rgb=pixels[:,:,:3].astype(float)
        warm=(pixels[:,:,3]>180)&(rgb[:,:,0]>rgb[:,:,1]*1.15)&(rgb[:,:,0]>rgb[:,:,2]*1.3)
        values=rgb[warm]
        colors[layer['id'][9:]]=np.median(values,axis=0).round().astype(int).tolist() if len(values) else [214,86,48]
    if layer['id'].startswith(('islands-','island-')):
        mask=np.asarray(Image.open(ART/layer['mask']).convert('L'))
        pixels=np.asarray(Image.open(ART/layer['file']).convert('RGBA'))
        hsv=cv2.cvtColor(pixels[:,:,:3],cv2.COLOR_RGB2HSV)
        rgb=pixels[:,:,:3].astype(float)
        land=(hsv[:,:,1]>70)&(hsv[:,:,2]>80)&(rgb[:,:,0]>rgb[:,:,1]*1.025)&(rgb[:,:,0]>rgb[:,:,2]*1.12)&(pixels[:,:,3]>64)
        mask=((mask>100)&land).astype('uint8')*255
        contours,_=cv2.findContours((mask>100).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        h,w=mask.shape
        rings=[]
        for contour in contours:
            if cv2.contourArea(contour)<3:continue
            contour=cv2.approxPolyDP(contour,.7,True)
            rings.append([[round(layer['x']+p[0][0]/w*layer['width'],2),round(layer['y']+p[0][1]/h*layer['height'],2)] for p in contour])
        islands[layer['id']]={'rings':rings,'bounds':[layer[k] for k in ['x','y','width','height']]}
payload={'provinceColors':colors,'islands':islands,'provinceContours':province_contours,'provinceCenters':centers,'warp':warp,'geometrySource':'DATA.provinces34 / DATA.arcs projected with smooth railway-centered calibration; shared borders preserved. Island artwork outlines from semantic masks.'}
(ROOT/'assets/goi-viet/map-vector-art.js').write_text('window.GoiVietVectorArt='+json.dumps(payload,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Palettes: {len(colors)}; island groups: {len(islands)}; shared vector arcs: {len(arcs)}; polygon points: {sum(len(r) for rings in province_contours.values() for r in rings)}')

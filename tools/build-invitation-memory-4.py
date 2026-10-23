"""Registered, non-destructive extraction of the approved invitation artwork.

No screenshot is used as a page background. The original pixels supply the two
cards and nine border pieces; an inpainted plate supplies only scenery revealed
behind removed UI. Lettering is traced into real SVG paths, not an embedded PNG.
"""
from pathlib import Path
import json, hashlib, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/goi-viet/invitation-memory-4'
SRC = OUT / 'sources'
original = Image.open(SRC / 'approved.png').convert('RGB')
W, H = original.size
restored = Image.open(SRC / 'restored-background.png').convert('RGB').resize((W, H), Image.Resampling.LANCZOS)
# Keep visible ORIGINAL paint. Inpaint is admitted only behind the UI and cards
# that have been removed, including their soft drop shadows.
occlusion=Image.new('L',(W,H)); od=ImageDraw.Draw(occlusion)
for box in [(155,110,560,150),(91,151,916,455),(157,451,889,492),(255,500,784,592),(345,591,710,625),(90,681,1688,822)]:
    od.rectangle(box,fill=255)
for poly in [[(928,57),(1340,125),(1264,669),(851,602)],[(1333,146),(1710,210),(1625,723),(1240,657)]]:
    od.polygon(poly,fill=255)
occlusion=occlusion.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(4))
plate=Image.composite(restored,original,occlusion)
layers = []

def save_layer(name, image, origin, rect=None):
    image.save(OUT / (name + '.webp'), 'WEBP', lossless=True, method=6)
    layers.append(dict(id=name, file=name+'.webp', width=image.width, height=image.height,
                       origin=origin, rect=rect))

def art_layer(name, points, bounds, feather=8):
    mask = Image.new('L', (W,H)); d = ImageDraw.Draw(mask)
    d.polygon(points, fill=255)
    if feather: mask = mask.filter(ImageFilter.GaussianBlur(feather))
    rgba = plate.copy().convert('RGBA'); rgba.putalpha(mask)
    x,y,w,h=bounds
    save_layer(name,rgba.crop((x,y,x+w,y+h)),'approved original paint; inpaint restricted to removed foreground; semantic alpha mask',bounds)

OUT.mkdir(exist_ok=True)
save_layer('paper', restored.crop((400,85,656,341)), 'quiet restored rice-paper material')
art_layer('mountains-right',[(750,0),(W,0),(W,652),(1540,600),(1350,460),(1160,380),(980,265),(850,200)], [650,0,W-650,665],20)
art_layer('river-bottom',[(380,740),(750,650),(980,615),(1340,573),(W,470),(W,H),(0,H),(0,685),(210,671)], [0,440,W,H-440],15)
art_layer('jasmine-left',[(0,222),(71,236),(127,330),(165,429),(223,505),(310,569),(315,655),(253,687),(0,733)], [0,195,355,555],9)

# Border is nine-sliced so long sides can stretch while corners keep their shape.
s=70
for name,box in {
    'frame-tl':(0,0,s,s),'frame-tr':(W-s,0,W,s),'frame-bl':(0,H-s,s,H),'frame-br':(W-s,H-s,W,H),
    'frame-top':(s,0,W-s,36),'frame-bottom':(s,H-36,W-s,H),
    'frame-left':(0,s,36,H-s),'frame-right':(W-36,s,W,H-s),
}.items(): save_layer(name,original.crop(box),'approved original: border slice',list(box))

def rectify(name, corners, width, height):
    # Inverse projective map, destination -> original; never re-draw the art.
    target=[(0,0),(width,0),(width,height),(0,height)]
    A=[]; B=[]
    for (x,y),(u,v) in zip(target,corners):
        A += [[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]
        B += [u,v]
    coef=np.linalg.solve(np.asarray(A,float),np.asarray(B,float))
    card=original.transform((width,height),Image.Transform.PERSPECTIVE,coef,Image.Resampling.BICUBIC).convert('RGBA')
    alpha=Image.new('L',(width,height)); d=ImageDraw.Draw(alpha)
    d.rounded_rectangle((0,0,width-1,height-1),radius=19,fill=255)
    alpha=alpha.filter(ImageFilter.GaussianBlur(.45));card.putalpha(alpha)
    save_layer(name,card,'approved original: inverse-projective isolation',corners)
    # Honest native sampling: a smaller asset, not an artificial 4K upsample.
    card.resize((width//2,height//2),Image.Resampling.LANCZOS).save(OUT/(name+'-small.webp'),'WEBP',quality=94,alpha_quality=100,method=6)

rectify('card-meal',[(934,64),(1331,130),(1255,659),(859,595)],400,544)
rectify('card-grandmother',[(1340,155),(1701,218),(1615,714),(1254,650)],368,504)

def simplify(points, epsilon=.5):
    if len(points)<=2:return points
    a=np.array(points[0],float); b=np.array(points[-1],float)
    line=b-a; den=float(np.dot(line,line))
    pts=np.asarray(points,float)
    t=np.clip(((pts-a)@line)/den,0,1) if den else np.zeros(len(points))
    dist=np.linalg.norm(pts-(a+t[:,None]*line),axis=1)
    i=int(np.argmax(dist))
    if dist[i]<=epsilon:return [points[0],points[-1]]
    return simplify(points[:i+1],epsilon)[:-1]+simplify(points[i:],epsilon)

def trace(mask):
    # Directed boundaries of binary ink. Opposite winding and evenodd preserve
    # the counters/holes in Vietnamese letters. Simplify at subpixel tolerance.
    h,w=mask.shape; edges={}
    def edge(a,b):edges.setdefault(a,[]).append(b)
    for y,x in np.argwhere(mask):
        if y==0 or not mask[y-1,x]:edge((int(x),int(y)),(int(x+1),int(y)))
        if x==w-1 or not mask[y,x+1]:edge((int(x+1),int(y)),(int(x+1),int(y+1)))
        if y==h-1 or not mask[y+1,x]:edge((int(x+1),int(y+1)),(int(x),int(y+1)))
        if x==0 or not mask[y,x-1]:edge((int(x),int(y+1)),(int(x),int(y)))
    paths=[]
    while edges:
        start=next(iter(edges));points=[start];p=start
        for _ in range(100000):
            q=edges[p].pop()
            if not edges[p]:del edges[p]
            points.append(q);p=q
            if p==start:break
            if p not in edges:break
        if len(points)<6:continue
        area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:])))/2
        if area<2:continue
        pts=simplify(points,.52)
        # A short quadratic at each vertex softens source-pixel staircase edges.
        if len(pts)<4:continue
        pts=pts[:-1]
        mids=[((a[0]+b[0])/2,(a[1]+b[1])/2) for a,b in zip(pts,pts[1:]+pts[:1])]
        num=lambda p:f'{p[0]:g} {p[1]:g}'
        d='M'+num(mids[-1])
        for p,m in zip(pts,mids):d+='Q'+num(p)+' '+num(m)
        paths.append(d+'Z')
    return ''.join(paths)

arr=np.array(original).astype(float)
parts=[]
for name,box,color,kind in [
    ('title-first',(96,155,908,304),'#073e35','green'),
    ('title-memory',(125,284,843,455),'#ae2d1b','red'),
]:
    x,y,r,b=box; rgb=arr[y:b,x:r];R,G,B=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    mask=(G>R*1.22)&(G<155)&(R<120)&(B<155) if kind=='green' else (R>G*1.42)&(R>B*1.35)&(G<135)
    d=trace(mask)
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {r-x} {b-y}" width="{r-x}" height="{b-y}"><path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>'
    (OUT/(name+'.svg')).write_text(svg,encoding='utf-8')
    parts.append(dict(id=name,file=name+'.svg',origin='approved ink contours: vector paths, no embedded raster',rect=[x,y,r-x,b-y]))

# The underline is a separate vector ornament, independently responsive.
(OUT/'memory-ribbon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 48"><defs><linearGradient id="g"><stop stop-color="#cf9b36"/><stop offset=".5" stop-color="#f5d789"/><stop offset="1" stop-color="#cb9435"/></linearGradient></defs><path d="M2 34C134-17 299 18 423 34S575 43 646 5C622 31 602 40 569 41" fill="none" stroke="url(#g)" stroke-width="2.5" stroke-linecap="round"/></svg>',encoding='utf-8')
manifest=dict(version=4,width=W,height=H,referenceSHA256=hashlib.sha256((SRC/'approved.png').read_bytes()).hexdigest(),
    method='Original pixels isolated by semantic masks and projective card rectification. Vector traced lettering. Restored occlusions used only in background fragments. No flattened UI image is shipped in HTML.',
    layers=layers+parts+[dict(id='memory-ribbon',file='memory-ribbon.svg',origin='separate vector ornament')])
(OUT/'layers.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'source':[W,H],'layers':len(manifest['layers']),'output':str(OUT)}))

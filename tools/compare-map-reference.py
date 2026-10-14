"""Whole-viewport comparison. Website screenshots are read-only inputs."""
from pathlib import Path
from PIL import Image, ImageChops
import numpy as np
import json, hashlib, difflib
root=Path(__file__).resolve().parents[1]
out=root/'verification/map-reference-20261013'
reference=Image.open(out/'reference.png').convert('RGB')
actual=Image.open(out/'qa-final/map-entry-1597.png').convert('RGB')
assert reference.size==actual.size==(1597,985)
Image.blend(reference,actual,.5).save(out/'overlay-50.png')
ImageChops.difference(reference,actual).save(out/'pixel-diff.png')
a=np.asarray(reference,dtype=np.int16);b=np.asarray(actual,dtype=np.int16)
regions={'whole':[0,0,1597,985],'logo':[43,17,384,227],'header':[465,24,1579,94],'map-terrain-and-rail':[400,105,850,922],'sea-and-islands':[850,100,1080,925],'crane':[173,487,392,670],'left-panel':[21,248,359,476],'station-panel':[1086,119,1579,893],'hanoi-illustration':[1108,395,1558,571],'footer':[0,892,1597,985]}
def metrics(x,y):
    d=np.abs(x-y)
    return dict(meanAbsoluteRGBError=float(d.mean()),rootMeanSquareRGBError=float(np.sqrt((d.astype(float)**2).mean())),differentPixels=int(np.any(d!=0,axis=2).sum()),totalPixels=int(d.shape[0]*d.shape[1]),exactPixelPercent=float(100*np.all(d==0,axis=2).mean()))
report={'viewport':[1597,985],'capture':'Real Chrome screenshot, fixed viewport, fonts ready, reduced motion during capture, steam cleared; no screenshot retouching.','comparison':'All RGB pixels; no alignment, excluded region, crop or tolerance. MAE/RMSE measured on 0–255 channels.','regions':{k:metrics(a[y1:y2,x1:x2],b[y1:y2,x1:x2]) for k,(x1,y1,x2,y2) in regions.items()},'pixelPerfect':bool(np.array_equal(a,b))}
baseline=out/'qa-baseline/map-entry-1597.png'
if baseline.exists():report['before']=metrics(a,np.asarray(Image.open(baseline).convert('RGB'),dtype=np.int16))
for file in ['reference.png','qa-final/map-entry-1597.png','overlay-50.png','pixel-diff.png']:report.setdefault('sha256',{})[file]=hashlib.sha256((out/file).read_bytes()).hexdigest()
(out/'visual-metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
before=(out/'backup/index.html').read_text(encoding='utf-8');after=(root/'index.html').read_text(encoding='utf-8')
diff='\n'.join(difflib.unified_diff(before.splitlines(),after.splitlines(),fromfile='backup/index.html',tofile='index.html',n=3))
(out/'source-changes.diff').write_text(diff,encoding='utf-8')
print(json.dumps(report['regions']['whole']))

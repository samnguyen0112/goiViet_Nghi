"""Lossless format conversion only; retain the PNG generation masters and alpha."""
from pathlib import Path
from PIL import Image
import numpy as np
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/goi-viet'
results=[]
for name in ['left','middle','right']:
    source=OUT/f'map-frame-{name}-v4.png'
    target=source.with_suffix('.webp')
    im=Image.open(source).convert('RGBA')
    im.save(target,'WEBP',lossless=True,exact=True,quality=100,method=6)
    a=np.asarray(im);b=np.asarray(Image.open(target).convert('RGBA'))
    assert np.array_equal(a[:,:,3],b[:,:,3])
    assert np.array_equal(a[a[:,:,3]>0],b[a[:,:,3]>0])
    results.append({'id':name,'runtime':target.relative_to(ROOT).as_posix(),'master':source.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,'pngBytes':source.stat().st_size,'webpBytes':target.stat().st_size,'alphaPreserved':True,'visiblePixelsIdentical':True,'transparentPixelFraction':round(float(np.mean(a[:,:,3]==0)),4)})
(ROOT/'verification/map-vector-upgrade-20261013/frame-assets.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
for r in results:print(f"{r['id']}: {r['pngBytes']} → {r['webpBytes']} bytes; visible pixels and alpha identical")

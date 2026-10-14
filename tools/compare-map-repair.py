from pathlib import Path
from PIL import Image,ImageChops
import numpy as np
import json,re,hashlib
R=Path(__file__).resolve().parents[1];O=R/'verification/map-repair-20261013'
ref=Image.open(O/'reference.png').convert('RGB')
actual=Image.open(O/'qa-final/map-entry-1597.png').convert('RGB')
assert ref.size==actual.size==(1597,985)
Image.blend(ref,actual,.5).save(O/'overlay-50.png')
ImageChops.difference(ref,actual).save(O/'pixel-diff.png')
a=np.asarray(ref,dtype=np.int16);b=np.asarray(actual,dtype=np.int16)
regions={'viewport':(0,0,1597,985),'logo':(43,17,384,227),'map':(400,105,850,922),'sea-islands':(850,100,1080,925),'crane':(165,466,417,688),'header':(465,24,1579,94),'left-panel':(20,248,360,478),'station-panel':(1085,118,1580,895),'hanoi-art':(1108,395,1558,571),'footer':(0,887,1597,985)}
metrics={}
for name,(x,y,r,z) in regions.items():
 d=np.abs(a[y:z,x:r]-b[y:z,x:r])
 metrics[name]={'MAE_RGB_0_to_255':float(d.mean()),'RMSE_RGB':float(np.sqrt((d.astype(float)**2).mean())),'differentPixels':int(np.any(d!=0,axis=2).sum()),'totalPixels':int(d.shape[0]*d.shape[1]),'exactPixelPercent':float(np.all(d==0,axis=2).mean()*100)}
preservation={}
for file,label in [(R/'verification/map-reference-20261013/backup/index.html','original'),(R/'index.html','current')]:
 text=file.read_text(encoding='utf-8');data=re.search(r'^const DATA = (.*);$',text,re.M).group(1)
 preservation[label+'DataSha256']=hashlib.sha256(data.encode()).hexdigest()
preservation['rawDataUnchanged']=preservation['originalDataSha256']==preservation['currentDataSha256']
report={'viewport':[1597,985],'capture':'Unretouched real Chrome screenshot; fixed camera, bundled fonts loaded, reduced motion for comparison.','comparison':'All RGB pixels, no excluded regions, no screenshot registration or retouching.','pixelPerfect':bool(np.array_equal(a,b)),'regions':metrics,'preservation':preservation,'limitations':['Original fonts and hidden illustration/background pixels are absent in the flattened reference.','Repaired occlusions and fitted province boundaries are recorded explicitly; they are not claimed to be recovered source layers.']}
(O/'visual-metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(metrics['viewport']));print('Raw DATA preserved:',preservation['rawDataUnchanged'])

"""Measure P1 using the masks in the supplied measure.py; audit raw neutral pixels."""
import sys, json, importlib.util
from pathlib import Path
import numpy as np
from PIL import Image
root = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('p1', root/'tools/grade-home-reference-p1.py')
p1 = importlib.util.module_from_spec(spec); spec.loader.exec_module(p1)
work = root/'verification/t2-p1-upgrade'
def frame(a):
    h,s,v=p1.rgb_to_hsv(a); g=(h>60)&(h<210)&(s>.15)
    return dict(hue=float(h[g].mean()),sat=float(s[g].mean()),val=float(v[g].mean()),
        deepTeal=100*float(((h>168)&(h<205)&(s>.45)&(v<.5)).mean()),
        below115=100*float(((h<115)&(h>60)&(s>.15)).sum()/g.sum()),
        in120_165=100*float(((h>=120)&(h<165)&g).sum()/g.sum()))
def read(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)/255
metrics=frame(read(work/'v9-2k-t12.png'))
reference=read(work/'P1-reference-t12.png')
mae=np.abs(read(work/'v9-2k-t12.png')-reference).mean(axis=(0,1))*255
assert 138<=metrics['hue']<=145
assert .35<=metrics['sat']<=.40
assert abs(metrics['val']-.556)<=.02
assert metrics['deepTeal']<=1
assert metrics['in120_165']>=68
assert metrics['below115']<=15.9
assert np.all(mae<2),mae
tiers={}
for tier,ids in {'far':['mountains-far-left','mountains-far-right'],'mid':['mountains-mid-left','mountains-mid-right'],'valley':['river-valley'],'near':['mountains-near-left','mountains-near-right']}.items():
    hs=[];ss=[]
    for id in ids:
        a=np.fromfile(work/'2k'/f'{id}.rgba',dtype=np.uint8).reshape(np.asarray(Image.open(work/'2k'/f'{id}.png')).shape)/255
        h,s,v=p1.rgb_to_hsv(a[...,:3]);m=(a[...,3]>.5)&(s>.15)&(h>60)&(h<210)
        hs.append(h[m]);ss.append(s[m])
    tiers[tier]={'hue':float(np.concatenate(hs).mean()),'sat':float(np.concatenate(ss).mean())}
assert tiers['far']['hue']>tiers['mid']['hue']>tiers['near']['hue']
decoded_tiers={}
for q in ['2k','4k']:
    decoded_tiers[q]={}
    for tier,ids in {'far':['mountains-far-left','mountains-far-right'],'mid':['mountains-mid-left','mountains-mid-right'],'valley':['river-valley'],'near':['mountains-near-left','mountains-near-right']}.items():
        hs=[];ss=[]
        for id in ids:
            a=np.asarray(Image.open(root/'assets/goi-viet/homepage-reference-v9'/f'{id}-{q}.webp').convert('RGBA')).astype(float)/255
            h,s,v=p1.rgb_to_hsv(a[...,:3]);m=(a[...,3]>.5)&(s>.15)&(h>60)&(h<210)
            hs.append(h[m]);ss.append(s[m])
        decoded_tiers[q][tier]={'hue':float(np.concatenate(hs).mean()),'sat':float(np.concatenate(ss).mean())}
    assert decoded_tiers[q]['far']['hue']>decoded_tiers[q]['mid']['hue']>decoded_tiers[q]['near']['hue']
metrics4k=frame(read(work/'v9-4k-t12.png'))
assert 138<=metrics4k['hue']<=145 and .35<=metrics4k['sat']<=.4
assert abs(metrics4k['val']-.556)<=.02 and metrics4k['deepTeal']<=1
assert metrics4k['in120_165']>=68 and metrics4k['below115']<=17
audit=[]
for q in ['2k','4k']:
    for job in json.loads((work/q/'jobs.json').read_text()):
        original=np.asarray(Image.open(job['input']).convert('RGBA'))
        graded=np.fromfile(job['output'],dtype=np.uint8).reshape(original.shape)
        h,s,v=p1.rgb_to_hsv(original[...,:3].astype(float)/255)
        tier=p1.tier_of(job['id']); gold=p1.ramp(s,.38,.6)*p1.ramp(h,33,40)*(1-p1.ramp(h,58,65))
        if tier=='cloud': neutral=gold==0
        else: neutral=(p1.green_weight(h,s)==0)&((gold==0) if p1.TIERS['P1'][tier].get('gold',0) else True)
        assert np.array_equal(original[...,3],graded[...,3])
        assert np.array_equal(original[...,:3][neutral],graded[...,:3][neutral]),job['id']
        audit.append({'quality':q,'id':job['id'],'rawNeutralPixelsExact':True})
result={'metrics':metrics,'metrics4k':metrics4k,'referenceMeanAbsoluteErrorPerChannel':mae.tolist(),'tiers':tiers,'decodedTiers':decoded_tiers,'rawAudit':audit}
(work/'color-report.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k!='rawAudit'}))

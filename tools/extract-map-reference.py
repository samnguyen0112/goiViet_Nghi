"""Source-pixel crops; no synthesis, color replacement, or reference screen overlay."""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from pathlib import Path
import json, hashlib

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'verification/map-reference-20261013/reference.png'
out = ROOT / 'assets/goi-viet/map-reference'
out.mkdir(exist_ok=True)
im = Image.open(source).convert('RGBA')
layers = []
def extract(name, box, polygon=None, holes=(), role='decoration', z=1):
    x,y,r,b=box
    crop=im.crop(box)
    mask=Image.new('L',crop.size,255 if polygon is None else 0)
    d=ImageDraw.Draw(mask)
    if polygon: d.polygon([(px-x,py-y) for px,py in polygon],fill=255)
    for h in holes: d.rectangle((h[0]-x,h[1]-y,h[2]-x,h[3]-y),fill=0)
    crop.putalpha(mask)
    crop.save(out/(name+'.png'));mask.save(out/(name+'.mask.png'))
    layers.append(dict(id=name,file=name+'.png',mask=name+'.mask.png',sourceRegion=[x,y,r-x,b-y],position=[x,y],size=list(crop.size),z=z,role=role,alpha='Explicit source polygon; unchanged RGB, no white removal',occlusion='Pixels behind original controls/labels are unavailable; excluded, never reconstructed.'))

extract('logo',(43,17,384,227),role='Logo and accompanying ribbon/paper decoration',z=31)
extract('crane',(173,487,392,670),[(174,648),(216,626),(235,609),(222,584),(231,567),(205,537),(197,514),(192,488),(225,502),(251,526),(273,546),(283,566),(310,574),(325,548),(343,533),(389,516),(351,539),(342,557),(331,585),(318,601),(337,620),(361,645),(379,666),(354,661),(324,647),(293,627),(267,622),(242,637),(216,650),(181,658)],role='Crane source silhouette')
extract('mountains-left',(0,477,439,985),[(0,477),(57,481),(94,513),(121,548),(151,580),(171,618),(175,671),(197,683),(230,672),(269,673),(299,704),(317,743),(345,791),(369,834),(412,867),(439,904),(422,925),(352,936),(354,985),(0,985)],holes=[(17,888,349,954)],role='Left mountain, forest and lotus scenery; compass and dock excluded')
left=Image.open(out/'mountains-left.png');mask=left.getchannel('A');ImageDraw.Draw(mask).ellipse((48,732-477,171,851-477),fill=0);left.putalpha(mask);left.save(out/'mountains-left.png');mask.save(out/'mountains-left.mask.png')
extract('mountains-middle',(359,477,549,732),[(360,478),(399,488),(430,499),(445,520),(464,526),(479,567),(516,583),(525,624),(549,666),(548,706),(522,732),(485,724),(460,685),(430,651),(398,635),(359,611)],holes=[(490,529,549,553),(500,655,549,680)],role='Unobstructed middle mountain scenery; country labels excluded')
extract('mountains-upper-left',(0,91,405,249),[(0,91),(42,104),(44,193),(68,219),(119,232),(196,231),(256,227),(315,224),(350,210),(379,173),(405,192),(388,229),(360,249),(0,249)],role='Visible upper left mountain and cloud detail')
extract('mountains-right',(1081,892,1597,985),role='Visible right mountain and lotus footer; upper mountain hidden behind panel')
extract('clouds-bottom',(357,921,1118,985),[(357,945),(416,922),(459,930),(480,948),(525,947),(562,957),(598,962),(631,951),(659,944),(691,949),(724,960),(779,971),(835,962),(878,947),(902,930),(937,927),(965,926),(985,929),(1006,921),(1035,921),(1064,931),(1093,949),(1118,977),(1118,985),(357,985)],role='Bottom cloud bank')
extract('sea-waves',(843,517,1073,629),role='Unobstructed source sea texture sample; repeated texture is approximate',z=0)
extract('terrain-texture',(508,173,569,218),role='Unobstructed northern terrain pigment sample; clipped to existing province geometry',z=2)
extract('landmark-hanoi',(598,167,636,227),[(598,220),(602,207),(602,188),(607,188),(607,176),(613,174),(614,167),(617,174),(624,175),(628,183),(629,201),(634,207),(636,223),(630,227),(598,227)],role='Tháp Rùa source pixels',z=3)
extract('landmark-hue',(692,400,780,452),[(692,448),(695,432),(697,412),(709,412),(711,405),(722,409),(732,403),(736,400),(742,406),(757,410),(768,405),(770,419),(778,425),(780,449)],role='Ngọ Môn source pixels',z=3)
extract('landmark-saigon',(706,738,766,789),[(706,783),(708,771),(720,768),(721,748),(728,746),(731,738),(737,746),(743,749),(745,768),(759,771),(766,785),(758,789)],role='Chợ Bến Thành source pixels',z=3)
extract('sailboat',(906,192,1017,312),[(907,283),(920,280),(916,266),(918,229),(928,217),(947,207),(963,195),(970,192),(973,208),(982,222),(987,248),(995,270),(1011,275),(1017,281),(1003,301),(982,307),(951,308),(927,301),(917,291)],role='Decorative sailboat',z=3)
extract('hanoi-lake',(1108,395,1558,571),holes=[(1118,403,1321,443),(1425,403,1548,443),(1117,507,1440,535),(1117,540,1517,558)],role='Hồ Gươm illustration; original labels removed with explicit missing-pixel alpha')
extract('cuisine',(1491,704,1540,744),role='Bowl detail from the source highlight chip')
extract('compass',(48,732,171,851),role='Compass ornament source; source letters remain ornament',z=4)
extract('hoang-sa',(859,359,995,437),role='Visible Hoàng Sa archipelago artwork',z=2)
extract('truong-sa',(916,632,1064,781),role='Visible Trường Sa archipelago artwork',z=2)
# Isolate the red calligraphy and folded paper from the pale source paper.
# RGB values are never whitened/repainted; the semantic mask removes backdrop only.
logo=Image.open(out/'logo.png').convert('RGBA')
mask=Image.new('L',logo.size,0)
pix=logo.load(); mp=mask.load()
for y in range(logo.height):
    for x in range(logo.width):
        r,g,b,a=pix[x,y]
        if r>g*1.28 and r>b*1.23 and g<190: mp[x,y]=255
ImageDraw.Draw(mask).polygon([(252,18),(300,29),(285,75),(260,61)],fill=255)
logo.putalpha(mask);logo.save(out/'logo.png');mask.save(out/'logo.mask.png')
layers[0]['alpha']='Red-pigment semantic mask plus folded-paper polygon; original RGB preserved; edge matting remains approximate'
# Source compass rim/needle, with live direction labels in the renderer.
extract('compass-rim',(48,732,171,851),role='Compass outer ring; inner dial and labels are live',z=4)
rim=Image.open(out/'compass-rim.png');mask=Image.new('L',rim.size,0);d=ImageDraw.Draw(mask)
d.ellipse((0,0,122,118),fill=255);d.ellipse((5,5,117,113),fill=0)
rim.putalpha(mask);rim.save(out/'compass-rim.png');mask.save(out/'compass-rim.mask.png')
extract('compass-needle',(98,765,122,831),[(109,765),(119,791),(111,829),(101,792)],role='Source compass needle',z=4)
for name in ['mountains-middle','mountains-upper-left']:
    art=Image.open(out/(name+'.png'));mask=art.getchannel('A')
    # Feather inward only: excluded source text cannot leak back into the artwork.
    inner=mask.filter(ImageFilter.MinFilter(17)).filter(ImageFilter.GaussianBlur(6))
    alpha=ImageChops.multiply(mask,inner);art.putalpha(alpha)
    art.save(out/(name+'.png'));alpha.save(out/(name+'.mask.png'))
    next(layer for layer in layers if layer['id']==name)['alpha']='Inward 8px erosion / 6px feather, multiplied by the exclusion mask; RGB unchanged'
(out/'manifest.json').write_text(json.dumps(dict(source=str(source.relative_to(ROOT)),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),viewport=[1597,985],method='Lossless PNG crops with explicit alpha masks. No generated images.',layers=layers,limitations=['Original province boundaries and obscured artwork cannot be recovered exactly from this flattened image.','Scenery masks are manual and need edge refinement.','Island crops contain surrounding source sea.','Hanoi label occlusions are transparent; no hidden illustration is invented.']),ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Extracted {len(layers)} source assets and masks')

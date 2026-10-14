"""Reproducible original SVG artwork. Reference JPGs are never copied into runtime assets."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import json

root = Path(__file__).resolve().parents[1]
out = root / 'assets/goi-viet'
out.mkdir(exist_ok=True)
font = TTFont(root / 'assets/fonts/heritage/PlayfairDisplay-700.woff')
glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
units = font['head'].unitsPerEm

def svg(w, h, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none">{body}</svg>'

def lettering(text, x, y, size):
    paths = []
    scale = size / units
    for ch in text:
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, y)))
        paths.append(f'<path d="{pen.getCommands()}"/>')
        x += font['hmtx'][name][0] * scale
    return ''.join(paths)

hat = '<g transform="translate(510 10) rotate(18)"><path d="M0 0 Q32 7 70 45 Q33 61 -8 39 Z" fill="#E4CDA0" stroke="#9D8058" stroke-width="1.5"/><path d="M0 0 10 47 M0 0 35 52 M0 0 60 48" stroke="#9D8058" stroke-width="1" opacity=".65"/><path d="M22 44 Q17 74 1 77" stroke="#9E2835" stroke-width="2"/></g>'
ribbon = '<path d="M18 127 Q-15 158 48 147 Q84 139 108 158 Q84 126 50 136 Q28 141 18 127 Z M524 145 Q570 163 610 139 Q577 183 532 164 Z"/>'
body = f'<g fill="#9E2835">{lettering("Gói Việt", 20, 140, 128)}{ribbon}</g>{hat}'
(out / 'logo-horizontal.svg').write_text(svg(640, 184, body), encoding='utf-8')
(out / 'logo-mono.svg').write_text(svg(640, 184, body.replace('#9E2835', '#234D40').replace('#E4CDA0', '#F7F0DE')), encoding='utf-8')
(out / 'logo-stack.svg').write_text(svg(360, 350, f'<g fill="#9E2835">{lettering("Gói",25,150,150)}{lettering("Việt",20,315,150)}</g>'), encoding='utf-8')
(out / 'logo-mark.svg').write_text(svg(160, 170, f'<g fill="#9E2835">{lettering("G",12,137,150)}</g><path d="M105 8 150 44 95 43 Z" fill="#C4A365"/>'), encoding='utf-8')

defs = '''<defs><linearGradient id="jade" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#CBD3AA"/><stop offset=".38" stop-color="#83B8A1"/><stop offset="1" stop-color="#407D70"/></linearGradient><linearGradient id="forest" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#87B39A"/><stop offset=".45" stop-color="#407D70"/><stop offset="1" stop-color="#234D40"/></linearGradient><pattern id="speckle" width="41" height="39" patternUnits="userSpaceOnUse"><circle cx="4" cy="6" r=".8" fill="#F7F0DE" opacity=".24"/><circle cx="25" cy="22" r=".6" fill="#F7F0DE" opacity=".2"/></pattern><g id="tree"><path d="M0 0V-20" stroke="#D7C69B" stroke-width="2"/><path d="M0-5C-13-5-12-18-6-20C-11-31 3-35 6-27C16-29 16-12 7-12C14-4 5 0 0-5Z" fill="#2E6A59" stroke="#C4D2AC" stroke-width=".7"/></g></defs>'''

def mountain(x, base, width, height, fill, idx):
    peak = x + width * .4
    path = f'M{x} {base} C{x+width*.14} {base-height*.4} {peak-width*.14} {base-height*1.08} {peak} {base-height} C{peak+width*.13} {base-height*1.05} {x+width*.63} {base-height*.25} {x+width} {base} Z'
    contour = f'M{x+width*.09} {base-15} C{x+width*.24} {base-height*.46} {peak-width*.12} {base-height*.98} {peak} {base-height+10} C{peak+width*.13} {base-height*.91} {x+width*.62} {base-height*.27} {x+width*.9} {base-12}'
    trees = ''.join(f'<use href="#tree" transform="translate({peak+(i-1)*18} {base-height+25+i*9}) scale(.65)"/>' for i in range(3))
    return f'<g><path d="{path}" fill="{fill}"/><path d="{path}" fill="url(#speckle)"/><path d="{contour}" stroke="#E5D6AD" stroke-opacity=".64" stroke-width="1.5"/><path d="{contour}" transform="translate(15 16)" stroke="#DFD4AD" stroke-opacity=".28" stroke-width="1" stroke-dasharray="2 9"/>{trees}</g>'

layers = {
    'mountains-far': [( -180,600,680,555),(1250,595,570,520),(40,780,680,455),(920,770,640,440)],
    'mountains-mid': [(-250,780,650,480),(1260,820,610,480),(-50,1030,790,490),(910,1030,730,430)],
    'mountains-near': [(-320,1010,750,500),(1320,1070,690,430),(-30,1240,840,450),(690,1240,850,390)]
}
for name, peaks in layers.items():
    fill = 'url(#jade)' if 'far' in name else 'url(#forest)'
    body = defs + ''.join(mountain(*peak, fill, i) for i, peak in enumerate(peaks))
    if 'near' in name:
        body += '<path d="M0 980 Q220 900 400 960 T900 970 T1600 920 V1100H0Z" fill="#83B8A1" stroke="#E5D6AD" stroke-width="2"/>'
        body += ''.join(f'<use href="#tree" transform="translate({x} {y}) scale({s})"/>' for x,y,s in [(100,940,1.8),(260,962,1),(1450,922,1.7),(1300,946,1.2)])
    (out / f'{name}.svg').write_text(svg(1600,1000,body), encoding='utf-8')
mobile = defs + ''.join(mountain(*p,'url(#jade)',i) for i,p in enumerate([(-220,470,350,320),(330,500,330,380),(-180,930,450,360),(160,950,480,330)]))
(out / 'mountains-mobile.svg').write_text(svg(390,844,mobile), encoding='utf-8')

cloud = '''<path d="M4 79C28 76 30 59 52 63C35 33 64 12 89 29C86-2 141-6 150 26C176 9 204 28 197 51C223 43 247 53 249 71C273 68 283 79 318 66C294 99 258 82 239 93C218 111 198 96 180 93C155 114 131 90 114 98C91 115 64 85 46 90C27 98 15 88 4 79Z" fill="#FFFCF4" stroke="#C8B891" stroke-width="1.5"/><path d="M72 63C43 54 65 30 78 46C90 65 72 72 64 64M147 57C123 52 131 26 148 32C166 40 159 60 147 57M202 76C184 61 197 45 211 57C219 69 209 78 202 76M99 74Q125 69 135 84M230 89Q248 73 272 81" stroke="#D1C29E" stroke-width="1.5" stroke-linecap="round"/>'''
(out / 'cloud-scroll.svg').write_text(svg(322,118,cloud), encoding='utf-8')
(out / 'cloud-long.svg').write_text(svg(480,118,f'<path d="M0 83Q110 93 160 79T480 81Q290 107 220 98T0 83" fill="#FFFCF4"/>{cloud}'), encoding='utf-8')
crane = '''<path d="M76 81Q112 95 137 72L155 62Q173 71 190 57Q196 44 204 46L230 38L211 51Q207 76 186 79L151 94Q115 106 81 92Z" fill="#FFFCF4" stroke="#C4B893" stroke-width="1"/><path d="M190 57Q196 45 203 47L214 43L207 52Z" fill="#293B32"/><path d="M197 46 205 45" stroke="#9E2835" stroke-width="3"/><path d="M91 91Q48 104 13 111M96 96Q55 113 23 119" stroke="#293B32" stroke-width="3"/><g class="gv-wing"><path d="M117 89C79 65 66 28 45 8C60 7 77 29 92 37C81 19 89 13 104 44C102 22 114 22 123 58C141 68 144 81 134 92Z" fill="#FFFCF4" stroke="#C4B893" stroke-width="1"/><path d="M45 8Q49 38 75 61L70 38Q89 67 96 69L89 40Q111 76 123 82" fill="#293B32"/><path d="M134 84Q168 66 187 8Q198 26 174 61Q201 35 210 27Q215 46 188 75Q211 60 220 60Q218 79 179 94Q151 105 134 94Z" fill="#FFFCF4" stroke="#C4B893" stroke-width="1"/><path d="M178 75 199 58M167 78 190 49M157 79 181 38" stroke="#D8CEB2" stroke-width="1.4"/></g>'''
(out / 'crane.svg').write_text(svg(240,130,crane), encoding='utf-8')
(out / 'paper.svg').write_text(svg(160,160,'<path d="M0 31H160M0 83H160M0 137H160" stroke="#B49355" stroke-opacity=".035"/><g fill="#B49355" opacity=".08"><circle cx="13" cy="23" r=".6"/><circle cx="57" cy="97" r=".7"/><circle cx="134" cy="41" r=".6"/><circle cx="93" cy="143" r=".6"/></g>'), encoding='utf-8')
(out / 'corner.svg').write_text(svg(80,80,'<path d="M4 74V22Q4 4 22 4H74M12 67V25Q12 12 25 12H67M23 25Q53 4 47 31Q31 52 23 25ZM25 23Q4 53 31 47Q52 31 25 23Z" stroke="#B49355" stroke-width="1.5"/>'), encoding='utf-8')
manifest = []
for f in sorted(out.glob('*.svg')):
    manifest.append({'file':f.name,'bytes':f.stat().st_size,'source':'Original vector drawn for this project; reference mood only','rights':'Project artwork; logo glyph outlines from Playfair Display 700 under SIL OFL (included in assets/fonts/heritage)','role':f.stem})
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(manifest)} SVG assets, {sum(x["bytes"] for x in manifest)} bytes')

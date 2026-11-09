"""Per-depth T2 grade of the extracted v8 layers (scratchpad only). Alpha is copied unchanged.
Usage: python -I grade_layers.py  -> graded/<variant>/<id>.png + graded/report.json"""
import json, sys, numpy as np
from pathlib import Path
from PIL import Image
sys.stdout.reconfigure(encoding='utf-8')
here = Path(__file__).parent

def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1); d = mx - mn; h = np.zeros_like(mx); m = d > 1e-6
    rm = m & (mx == r); gm = m & (mx == g) & ~rm; bm = m & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6; h[gm] = (b - r)[gm] / d[gm] + 2; h[bm] = (r - g)[bm] / d[bm] + 4
    return h * 60, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx

def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60; i = np.floor(h).astype(int) % 6; f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f)); out = np.zeros(h.shape + (3,))
    for k, (rr, gg, bb) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        sel = i == k; out[sel] = np.stack([rr[sel], gg[sel], bb[sel]], -1)
    return out

def ramp(x, a, b): return np.clip((x - a) / (b - a), 0, 1)

def green_weight(h, s):
    # Teal-to-green only; warm yellow-green highlights (< 95 deg) and cream paper stay as painted.
    band = ramp(h, 95, 115) * (1 - ramp(h, 205, 220))
    return band * ramp(s, .08, .2)

def grade(rgb, alpha, t, centre):
    h, s, v = rgb_to_hsv(rgb); w = green_weight(h, s)
    target = np.full(h.shape, float(t['hue']))
    if 'water_hue' in t:  # river-valley: light, low-saturation pixels are water
        water = ramp(v, .66, .76) * (1 - ramp(s, .45, .6))
        target = target + (t['water_hue'] - t['hue']) * water
    hn = target + (h - centre) * t.get('keep', .5)
    hn = np.maximum(hn, 115)
    h2 = h + (hn - h) * w
    s2 = s * (1 - t['desat'] * w)
    over = np.clip(s2 - t['smax'], 0, None); s2 = s2 - over * .7 * w
    v2 = v + w * (t.get('lift', 0) * (1 - v) + t.get('dark', 0) * np.clip(.5 - v, 0, None))
    gold = ramp(s, .38, .6) * ramp(h, 33, 40) * (1 - ramp(h, 58, 65))
    s2 = s2 * (1 - t.get('gold', 0) * gold)
    return np.clip(hsv_to_rgb(h2, np.clip(s2, 0, 1), np.clip(v2, 0, 1)), 0, 1)

TIERS = {
    'P1': {  # spec centre
        'far': dict(hue=160, desat=.45, smax=.34, lift=.10, gold=.3),
        'mid': dict(hue=150, desat=.38, smax=.45, lift=.04, gold=.3),
        'valley': dict(hue=150, water_hue=170, desat=.40, smax=.42, lift=.05, gold=.3),
        'near': dict(hue=138, desat=.30, smax=.58, dark=.18, gold=.3),
        'building': dict(hue=142, desat=.25, smax=.55, dark=.1),
    },
    'P2': {  # softer, closer to the original homepage mock-up
        'far': dict(hue=162, desat=.55, smax=.30, lift=.15, gold=.4),
        'mid': dict(hue=152, desat=.48, smax=.40, lift=.08, gold=.4),
        'valley': dict(hue=152, water_hue=172, desat=.50, smax=.38, lift=.08, gold=.4),
        'near': dict(hue=140, desat=.42, smax=.50, dark=.22, lift=.03, gold=.4),
        'building': dict(hue=144, desat=.35, smax=.5, dark=.12),
    },
}
CLOUD_GOLD = {'P1': .3, 'P2': .4}

def tier_of(i):
    if i.startswith('mountains-far'): return 'far'
    if i.startswith('mountains-mid'): return 'mid'
    if i == 'river-valley': return 'valley'
    if i.startswith(('mountains-near', 'tree-', 'leaf-')): return 'near'
    if i in ('hanoi', 'hue', 'saigon'): return 'building'
    if i.startswith('cloud-'): return 'cloud'
    return None  # sky, bridge, train, birds, petals, smoke: untouched


# P1 functions above are copied verbatim from the supplied grade_layers.py.
# CLI writes raw RGBA; packaging/compression belongs to the build tool.
def encode_rgb12(raw):
    """Lossy coding prepass, separate from P1 grading. Preserve the green hue floor.

    Conventional WebP 4:2:0 crossed the 115-degree boundary after decoding.
    Quantize RGB jointly, then use lossless WebP so there is no chroma bleed.
    Alpha is never quantized. The decoded-frame MAE and size are acceptance gates.
    """
    rgb = raw[..., :3].astype(float)
    out = np.clip(np.round(rgb / 12) * 12, 0, 255)
    h, s, _ = rgb_to_hsv(rgb / 255)
    hh, ss, _ = rgb_to_hsv(out / 255)
    bad = (h >= 115) & (h < 220) & (s > .08) & (hh < 115) & (ss > .08)
    best = np.full(h.shape, 1e9)
    result = out.copy()
    for delta in [(-12,0,0),(0,0,12),(0,12,0),(-12,12,0),(0,12,12),(-12,0,12)]:
        candidate = np.clip(out + np.array(delta), 0, 255)
        ch, _, _ = rgb_to_hsv(candidate / 255)
        cost = ((candidate-rgb)**2).sum(-1)
        take = bad & (ch >= 115) & (cost < best)
        result[take] = candidate[take]; best[take] = cost[take]
    assert np.all(best[bad] < 1e9)
    result = np.where(bad[...,None], result, out).astype(np.uint8)
    return np.dstack([result, raw[...,3]])

if __name__ == '__main__':
    jobs = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    for job in jobs:
        if '--encode-only' in sys.argv:
            shape = np.asarray(Image.open(job['input']).convert('RGBA')).shape
            result = np.fromfile(job['output'], dtype=np.uint8).reshape(shape)
            encoded = encode_rgb12(result)
            encoded.tofile(str(Path(job['output']).with_name(job['id']+'-encoded.rgba')))
            continue
        im = Image.open(job['input']).convert('RGBA')
        original = np.asarray(im)
        a = original.astype(np.float64) / 255
        rgb, alpha = a[..., :3], a[..., 3]
        h, s, v = rgb_to_hsv(rgb)
        tier = tier_of(job['id'])
        vis = (alpha > .5) & (green_weight(h, s) > .5) & (s > .2)
        centre = float(h[vis].mean()) if vis.any() else 170.0
        if tier == 'cloud':
            gold = ramp(s, .38, .6) * ramp(h, 33, 40) * (1 - ramp(h, 58, 65))
            out = hsv_to_rgb(h, s * (1 - CLOUD_GOLD['P1'] * gold), v)
        else:
            out = grade(rgb, alpha, TIERS['P1'][tier], centre)
        result = (np.dstack([out, alpha]) * 255 + .5).astype(np.uint8)
        assert np.array_equal(result[...,3], original[...,3])
        result.tofile(job['output'])
        del a, rgb, alpha, h, s, v, out, vis
        encoded = encode_rgb12(result)
        assert np.array_equal(encoded[...,3], original[...,3])
        encoded.tofile(str(Path(job['output']).with_name(job['id']+'-encoded.rgba')))
        print(job['id'], flush=True)

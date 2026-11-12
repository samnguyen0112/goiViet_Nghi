"""Curate Commons photographs once; the preview never calls this network tool.

Search: python tools/station-photo-source-5.py search <group> <query>
Fetch:  python tools/station-photo-source-5.py fetch <group> <id> <File:title>
Outputs retain the API evidence and downloaded source for visual/source review.
"""
from pathlib import Path
import hashlib
import html
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'verification' / 'station-photos-5'
ASSETS = ROOT / 'assets' / 'goi-viet' / 'station-photos-5'
AGENT = 'VietnamHeritageMap/1.0 (educational local photo curation; single downloads)'


def request(url):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': AGENT})
            with urllib.request.urlopen(req, timeout=50) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))


def api(**params):
    params.update(action='query', format='json', formatversion='2')
    return json.loads(request('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))


def plain(value):
    return html.unescape(re.sub('<[^>]+>', '', str(value))).strip()


def summary(page):
    info = page.get('imageinfo', [{}])[0]
    meta = info.get('extmetadata', {})
    return {
        'fileTitle': page['title'], 'sourcePage': info.get('descriptionurl'),
        'sourceUrl': info.get('url', '').split('?')[0],
        'width': info.get('width'), 'height': info.get('height'),
        **{key: plain(meta.get(field, {}).get('value', '')) for key, field in [
            ('description', 'ImageDescription'), ('author', 'Artist'),
            ('license', 'LicenseShortName'), ('licenseUrl', 'LicenseUrl'),
            ('attribution', 'Attribution'), ('date', 'DateTimeOriginal'),
            ('latitude', 'GPSLatitude'), ('longitude', 'GPSLongitude'),
            ('assessments', 'Assessments'), ('categories', 'Categories')
        ]}
    }


def search(group, query):
    directory = EVIDENCE / group
    directory.mkdir(parents=True, exist_ok=True)
    data = api(generator='search', gsrsearch=query + ' filetype:bitmap', gsrnamespace=6,
               gsrlimit=12, prop='imageinfo', iiprop='url|size|extmetadata')
    name = re.sub(r'[^a-zA-Z0-9]+', '-', query)[:90]
    (directory / ('search-' + name + '.json')).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    for page in sorted(data.get('query', {}).get('pages', []), key=lambda p: p.get('index', 0)):
        row = summary(page)
        print(json.dumps({k: v for k, v in row.items() if k not in ['categories', 'sourceUrl']}, ensure_ascii=False))


def fetch(group, station_id, title):
    directory = EVIDENCE / group
    directory.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)
    data = api(titles=title, prop='imageinfo', iiprop='url|size|extmetadata', iiurlwidth=1920)
    page = data['query']['pages'][0]
    if 'imageinfo' not in page:
        raise ValueError('No image information: ' + title)
    row = summary(page)
    if not row['license'] or not row['sourceUrl']:
        raise ValueError('Image license/source must be explicit: ' + title)
    info = page['imageinfo'][0]
    download_url = info.get('thumburl') or row['sourceUrl']
    raw = request(download_url)
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(raw))).convert('RGB')
    if image.width < 1200:
        raise ValueError('Source is too small: ' + str(image.size))
    suffix = Path(urllib.parse.unquote(urllib.parse.urlsplit(row['sourceUrl']).path)).suffix.lower()
    original = directory / (station_id + '-source' + suffix)
    original.write_bytes(raw)
    image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    output = ASSETS / (station_id + '.webp')
    image.save(output, 'WEBP', quality=88, method=6)
    row.update(id=station_id, src=output.relative_to(ROOT).as_posix(),
               downloadUrl=download_url, downloadWidth=info.get('thumbwidth', row['width']),
               downloadHeight=info.get('thumbheight', row['height']),
               outputWidth=image.width, outputHeight=image.height,
               bytes=output.stat().st_size, sha256=hashlib.sha256(output.read_bytes()).hexdigest(),
               downloadSha256=hashlib.sha256(raw).hexdigest(),
               downloadFile=original.relative_to(ROOT).as_posix(),
               changes='Resized to at most 1600 px; converted to WebP. Display uses a focal crop.')
    (directory / (station_id + '-api.json')).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    (directory / (station_id + '-record.json')).write_text(json.dumps(row, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(row, ensure_ascii=False))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if sys.argv[1] == 'search':
        search(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == 'fetch':
        fetch(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        raise SystemExit('Expected search or fetch')

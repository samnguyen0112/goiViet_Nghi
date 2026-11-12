"""Apply the reviewed local photo catalog to preview-5, without touching other pages."""
from pathlib import Path
import argparse
import hashlib
import json
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/goi-viet/station-photos-5'
PAGE = ROOT / 'map-surroundings-preview-5.html'


def read_literal(text, name):
    match = re.search(r'const ' + name + r'\s*=\s*', text)
    data, length = json.JSONDecoder().raw_decode(text[match.end():])
    return data, match.end(), match.end() + length


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assemble', action='store_true', help='assemble the three reviewed evidence fragments')
    args = parser.parse_args()
    text = PAGE.read_text(encoding='utf-8')
    decks, _, _ = read_literal(text, 'ALL_DECKS_MAP')
    if args.assemble:
        rows = []
        for group in ['north', 'central', 'south']:
            fragment = ROOT / 'verification/station-photos-5' / group / 'approved.json'
            data = json.loads(fragment.read_text(encoding='utf-8'))
            rows.extend(data if isinstance(data, list) else data.values())
    else:
        rows = json.loads((ASSETS / 'catalog.json').read_text(encoding='utf-8'))['photos']
    by_id = {row['id']: row for row in rows}
    assert len(rows) == len(by_id) == 36, 'Expected 36 unique reviewed photos'
    assert set(by_id) == set(decks), 'Catalog IDs must match all 34 provinces and both archipelagos'

    catalog = []
    for station_id in decks:
        row = by_id[station_id]
        if station_id == 'hoang-sa':
            catalog.append({'id': station_id, 'status': 'placeholder', 'src': None,
                            'titleVi': 'Đảo Phú Lâm & Cụm đảo Hoàng Sa',
                            'titleEn': 'Phú Lâm Island & the Hoàng Sa island cluster',
                            'bytes': 0, 'reviewed': True,
                            'verificationNote': 'Tạm dùng biểu tượng; chờ người dùng chọn ảnh đại diện mới.'})
            continue
        assert row.get('reviewed') is True, station_id + ': source and image must be visually reviewed'
        src = 'assets/goi-viet/station-photos-5/' + station_id + '.webp'
        output = ROOT / src
        with Image.open(output) as image:
            width, height = image.size
            assert image.format == 'WEBP' and width >= 1280, station_id + ': source cannot be enlarged'
            image.verify()
        assert row.get('titleVi') and row.get('titleEn') and row.get('author') and row.get('license'), station_id
        assert row.get('sourcePage', '').startswith('https://commons.wikimedia.org/wiki/File:'), station_id
        position = row.get('position', '50% 50%')
        assert re.fullmatch(r'(?:100|[0-9]{1,2})% (?:100|[0-9]{1,2})%', position), station_id
        entry = {k: row.get(k, '') for k in ['id', 'fileTitle', 'titleVi', 'titleEn', 'sourcePage', 'author',
                 'license', 'licenseUrl', 'attribution', 'date', 'latitude', 'longitude',
                 'verificationNote', 'framingNote', 'changes']}
        # Some Commons Artist templates contain a whole reuse message. Credit the
        # named photographer; the complete original template stays in API evidence.
        if 'This Photo was taken by Supanut Arunoprayote.' in entry['author']:
            entry['author'] = 'Supanut Arunoprayote'
        entry['author'] = re.sub(r'\s+', ' ', entry['author']).strip()
        entry.update(src=src, position=position, fit=row.get('fit', 'cover'), width=width, height=height,
                     nativeWidth=row.get('nativeWidth', row.get('width')),
                     nativeHeight=row.get('nativeHeight', row.get('height')),
                     bytes=output.stat().st_size, sha256=hashlib.sha256(output.read_bytes()).hexdigest(), reviewed=True)
        catalog.append(entry)

    def apply_photo(place, photo):
        if photo.get('status') == 'placeholder':
            place.update(photoUrl=None, photoTitle=photo['titleVi'], photoTitleVi=photo['titleVi'],
                         photoTitleEn=photo['titleEn'], photoCredit=None, photos=[],
                         photoWidth=0, photoHeight=0, photoPosition='50% 50%', photoFit='cover')
            return
        place.update(photoUrl=photo['src'], photoTitle=photo['titleVi'], photoTitleVi=photo['titleVi'],
                     photoTitleEn=photo['titleEn'], photoPosition=photo['position'],
                     photoFit=photo['fit'],
                     photoWidth=photo['width'], photoHeight=photo['height'],
                     photoCredit={'author': photo['author'], 'license': photo['license'],
                                  'licenseUrl': photo['licenseUrl'], 'sourceUrl': photo['sourcePage'],
                                  'changes': photo['changes']},
                     photos=[{'title': photo['titleVi'], 'titleEn': photo['titleEn'], 'url': photo['src']}])

    by_id = {row['id']: row for row in catalog}
    # Unused legacy galleries had incorrect captions and hotlinks. Keep their map,
    # landmark and cultural data, but do not expose an unverified photo collection.
    data, _, _ = read_literal(text, 'DATA')
    def clear_legacy(node):
        if isinstance(node, dict):
            if 'photos' in node:
                node['photos'] = []
            for value in node.values():
                clear_legacy(value)
        elif isinstance(node, list):
            for value in node:
                clear_legacy(value)
    clear_legacy(data)
    for place in data['provinces34'] + data['islands']:
        if place.get('id') in by_id:
            apply_photo(place, by_id[place['id']])
    for station_id, place in decks.items():
        apply_photo(place, by_id[station_id])
    for name, payload in [('DATA', data), ('ALL_DECKS_MAP', decks)]:
        _, start, end = read_literal(text, name)
        text = text[:start] + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + text[end:]
    assert not re.search(r'https?://(?:upload|thumb)\.wikimedia\.org', text), 'A remote image remains in preview-5'
    PAGE.write_text(text, encoding='utf-8')
    (ASSETS / 'catalog.json').write_text(json.dumps({'version': 1, 'photos': catalog}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    lines = ['# Ảnh địa danh preview-5', '',
             '35 ảnh thật được đóng gói cục bộ; ga Hoàng Sa tạm dùng biểu tượng chờ chọn ảnh mới. Liên kết nguồn dưới đây chỉ dùng để ghi công, không được dùng làm URL tải ảnh trong ứng dụng.', '',
             'Ảnh được thu nhỏ, chuyển sang WebP và cắt theo vị trí lấy nét khi hiển thị. Giấy phép của từng ảnh vẫn áp dụng cho ảnh tương ứng.', '']
    for photo in catalog:
        if photo.get('status') == 'placeholder':
            lines += ['## ' + decks[photo['id']]['name'], '', photo['verificationNote'], '']
            continue
        lines += ['## ' + decks[photo['id']]['name'], '', photo['titleVi'], '',
                  'Tệp: `' + photo['id'] + '.webp` · ' + str(photo['width']) + ' × ' + str(photo['height']) + '.', '',
                  'Tác giả: ' + photo['author'] + '. Giấy phép: [' + photo['license'] + '](' + (photo['licenseUrl'] or photo['sourcePage']) + ').', '',
                  '[Trang nguồn](' + photo['sourcePage'] + '). ' + photo['verificationNote'], '']
    (ASSETS / 'CREDITS.md').write_text('\n'.join(lines), encoding='utf-8')
    print('Applied 35 local photos and one island symbol; zero Wikimedia image URLs. Total WebP bytes:', sum(p['bytes'] for p in catalog))


if __name__ == '__main__':
    main()

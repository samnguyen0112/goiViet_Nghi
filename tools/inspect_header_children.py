from pathlib import Path
import re

txt = Path('index.html').read_text(encoding='utf-8')
m = re.search(r'<header[^>]*class="[^"]*top-header[^"]*"[^>]*>([\s\S]*?)</header>', txt)
if m:
    print("Top header innerHTML:")
    print(m.group(1)[:1200].encode('ascii', 'backslashreplace').decode('ascii'))

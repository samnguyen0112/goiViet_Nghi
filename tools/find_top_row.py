from pathlib import Path
import re

txt = Path('index.html').read_text(encoding='utf-8')
for m in re.finditer(r'class="place-hero-top-row"', txt):
    idx = m.start()
    line_no = txt[:idx].count('\n') + 1
    print('Line:', line_no)

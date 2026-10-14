from pathlib import Path
import re

txt = Path('index.html').read_text(encoding='utf-8')
for m in re.finditer(r'class="place-hero-title"', txt):
    idx = m.start()
    print("Found at", idx)
    print(txt[idx-100:idx+400].encode('ascii', 'backslashreplace').decode('ascii'))

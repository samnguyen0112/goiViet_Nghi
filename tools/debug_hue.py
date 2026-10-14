from pathlib import Path
import re

txt = Path('index.html').read_text(encoding='utf-8')
matches = list(re.finditer(r"mainCanvas\.addEventListener\(", txt))
print(f"Found {len(matches)} listeners on mainCanvas:")
for m in matches:
    idx = m.start()
    line_no = txt[:idx].count('\n') + 1
    print(f"Line {line_no}: {txt[idx:idx+100]}")

from pathlib import Path
import re

txt = Path('index.html').read_text(encoding='utf-8')

# Search for introScreen styles or mapScene styles or body styles
for sel in ['body', '#mapScene', '#introScreen', '.intro-', 'mainCanvas', '#mapBackdropCanvas']:
    matches = list(re.finditer(re.escape(sel) + r'\s*\{([^}]+)\}', txt))
    for m in matches[:3]:
        print(f"Selector {sel}: {m.group(0)[:200]}")

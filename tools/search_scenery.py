from pathlib import Path
import re

for ext in ['*.css', '*.html', '*.js']:
    for f in Path('.').glob(f'**/{ext}'):
        if 'node_modules' in str(f) or '.git' in str(f) or 'tools' in str(f): continue
        txt = f.read_text(encoding='utf-8', errors='ignore')
        # Check for curved background, wave, svg, mask, or canvas background
        for kw in ['sea-plane', 'mainland-paper-plane', 'sceneryPadding', 'extendScenery', 'paper.svg']:
            if kw in txt:
                print(f"{f}: has {kw}")

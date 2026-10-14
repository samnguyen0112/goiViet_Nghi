with open('index.html', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'[\'\"\(]((?:assets|image)/[^\'\"\)\;]+)', text)
for m in sorted(set(matches)):
    print(m)

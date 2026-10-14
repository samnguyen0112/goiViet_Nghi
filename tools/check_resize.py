with open('index.html', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if "resize" in l and "addEventListener" in l:
        print(f'{i+1}: {l.strip()[:100]}')

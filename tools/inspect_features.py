import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Canvas render loop: dirty flag or requestAnimationFrame loop?
render_func = re.search(r'function\s+(render|drawMap|loop|tick|animate)\s*\([^)]*\)\s*\{[\s\S]*?\}', text)
if render_func:
    print("=== Render function excerpt ===")
    print(render_func.group(0)[:600])

# 2. Touch handling
touch_handlers = re.findall(r'(\.addEventListener\(["\']touch[a-z]+["\'][\s\S]*?\n\s*\}\);)', text)
print(f"\n=== Touch handlers ({len(touch_handlers)}) ===")
for th in touch_handlers:
    print(th[:300])

# 3. Audio implementation
audio_snippet = re.search(r'function\s+toggleFolkSound[\s\S]*?\{[\s\S]*?\}', text)
if audio_snippet:
    print("\n=== Folk sound implementation ===")
    print(audio_snippet.group(0)[:500])

# 4. Search and filter logic
search_snippet = re.search(r'function\s+(handleSearch|filterPlaces|applyFilter|searchPlaces)[\s\S]*?\{[\s\S]*?\}', text)
if search_snippet:
    print("\n=== Search function ===")
    print(search_snippet.group(0)[:400])

# 5. External dependencies (scripts / links in head)
head_tags = re.findall(r'<link[^>]+>|<script[^>]+>', text[:text.find('</head>')])
print("\n=== Head external tags ===")
for tag in head_tags:
    print(" -", tag)

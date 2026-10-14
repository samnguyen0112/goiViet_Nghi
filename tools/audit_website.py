import sys, re
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print("File size:", len(text), "chars, lines:", len(text.splitlines()))

# HTML main elements
ids = re.findall(r'id=["\']([^"\']+)["\']', text)
print("\n=== IDs in HTML (first 40) ===")
print(', '.join(ids[:40]))

# Check modals
modals = [i for i in ids if 'modal' in i.lower() or 'dialog' in i.lower() or 'screen' in i.lower() or 'overlay' in i.lower()]
print("\n=== Modals/Screens/Overlays ===")
print(modals)

# Check data sets
places_match = re.search(r'const\s+(PLACES|PROVINCES|STATIONS|HERITAGE_DATA)\s*=\s*(\[[\s\S]*?\]);', text)
if places_match:
    print("\n=== Found Data constant:", places_match.group(1))

# Check functions
functions = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', text)
print(f"\n=== Total JS functions: {len(functions)} ===")
for fn in functions[:35]:
    print(" -", fn)

# Check event listeners
listeners = re.findall(r'addEventListener\(["\']([^"\']+)["\']', text)
print("\n=== Event listeners ===")
print(Counter(listeners))

# Check performance critical things: requestAnimationFrame, setInterval, resize, touch, etc.
raf = len(re.findall(r'requestAnimationFrame', text))
intervals = len(re.findall(r'setInterval', text))
timeouts = len(re.findall(r'setTimeout', text))
resize = len(re.findall(r'ResizeObserver', text))
canvas = len(re.findall(r'<canvas', text))
svg = len(re.findall(r'<svg', text))
audio = len(re.findall(r'AudioContext|new Audio', text))
local_storage = len(re.findall(r'localStorage', text))

print(f"\n=== Performance & Runtime metrics ===")
print(f"requestAnimationFrame: {raf}")
print(f"setInterval: {intervals}")
print(f"setTimeout: {timeouts}")
print(f"ResizeObserver: {resize}")
print(f"Canvas tags: {canvas}")
print(f"SVG tags: {svg}")
print(f"Audio references: {audio}")
print(f"localStorage references: {local_storage}")

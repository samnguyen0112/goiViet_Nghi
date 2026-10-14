import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

intro_start = text.find('id="introScreen"')
print('introScreen found at index:', intro_start)
print(text[intro_start-50:intro_start+3000])

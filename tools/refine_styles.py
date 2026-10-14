with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update crane delays so both cranes are in open sky at t=1s
content = content.replace(
'''  .gv-crane-soar-left {
    left: -260px;
    top: 8%;
    animation: gvCraneFlyLeftToRight 24s cubic-bezier(0.38, 0, 0.25, 1) infinite -4s,
               gvCraneWingFlap 2.2s ease-in-out infinite alternate;
  }
  .gv-crane-soar-right {
    right: -260px;
    top: 13%;
    animation: gvCraneFlyRightToLeft 28s cubic-bezier(0.38, 0, 0.25, 1) infinite -12s,
               gvCraneWingFlap 2.5s ease-in-out infinite alternate-reverse;
  }''',
'''  .gv-crane-soar-left {
    left: -260px;
    top: 8%;
    animation: gvCraneFlyLeftToRight 24s cubic-bezier(0.38, 0, 0.25, 1) infinite -8s,
               gvCraneWingFlap 2.2s ease-in-out infinite alternate;
  }
  .gv-crane-soar-right {
    right: -260px;
    top: 13%;
    animation: gvCraneFlyRightToLeft 28s cubic-bezier(0.38, 0, 0.25, 1) infinite -8s,
               gvCraneWingFlap 2.5s ease-in-out infinite alternate-reverse;
  }'''
)

# 2. Add high-specificity rule for #introScreen .intro-poetic-sub
content = content.replace(
'''    .intro-poetic-sub {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: clamp(13.5px, 1.1vw, 15px);
      line-height: 1.6;
      text-align: center;
      color: #5C2C22;
      max-width: 960px;
      margin: 0 auto 14px;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
      white-space: pre-line;
    }''',
'''    #introScreen .intro-poetic-sub {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: clamp(14px, 1.1vw, 15.5px) !important;
      line-height: 1.6 !important;
      text-align: center;
      color: #5C2C22;
      max-width: 960px !important;
      margin: 0 auto 14px;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
    }'''
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Applied crane delays and poetic-sub specificity!')

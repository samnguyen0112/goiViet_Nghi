with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_block = '''  @media (min-width: 601px) {
    #introScreen {
      padding: 20px 24px 28px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow-x: hidden;
      overflow-y: auto;
    }
    .intro-container {
      width: min(1040px, 94vw);
      max-width: 1040px;
      margin: auto;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      z-index: 10;
    }
    .intro-ornament-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-family: var(--font-accent);
      font-size: 13.5px;
      color: #7A3528;
      margin-bottom: 4px;
      letter-spacing: 0.04em;
    }
    .intro-ornament-line {
      width: 44px;
      height: 1.5px;
      background: #BC5A48;
      opacity: 0.6;
    }
    .intro-main-title {
      margin: 0 0 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .intro-main-title .gv-logo {
      width: clamp(260px, 26vw, 360px);
      height: auto;
      filter: drop-shadow(0 4px 18px rgba(186, 48, 33, 0.16));
      transition: transform 0.3s ease;
    }
    .intro-main-title .gv-logo:hover {
      transform: scale(1.02);
    }
    .intro-poetic-sub {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: clamp(14px, 1.2vw, 16px);
      line-height: 1.6;
      text-align: center;
      color: #5C2C22;
      max-width: 760px;
      margin: 0 auto 12px;
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
    }
    .gv-stations {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: clamp(10px, 1.4vw, 18px);
      margin: 0 auto 14px;
      padding: 0;
      list-style: none;
      z-index: 10;
    }
    .gv-stations li {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: clamp(13px, 1.05vw, 14.5px);
      font-weight: 600;
      letter-spacing: 0.02em;
      box-shadow: 0 4px 14px rgba(28, 48, 38, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.95);
      cursor: pointer;
      transition: transform 0.22s ease, box-shadow 0.22s ease;
      backdrop-filter: blur(6px);
    }
    .gv-stations li:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 20px rgba(28, 48, 38, 0.15);
    }
    .gv-stations li:nth-child(1) {
      background: rgba(255, 248, 244, 0.96);
      border: 1.5px solid #BC5A48;
      color: #8C2A1E;
    }
    .gv-stations li:nth-child(2) {
      background: rgba(255, 252, 244, 0.96);
      border: 1.5px solid #BFA052;
      color: #7A5714;
    }
    .gv-stations li:nth-child(3) {
      background: rgba(244, 252, 250, 0.96);
      border: 1.5px solid #3A7D6F;
      color: #1A5447;
    }
    .intro-train-panorama {
      height: clamp(38px, 6vh, 64px);
      width: 100%;
      pointer-events: none;
      margin: 0 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #introWelcomeStage {
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      z-index: 10;
    }
    #introWelcomeStage .intro-invitation-card {
      background: rgba(255, 253, 248, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1.8px solid #D4B996;
      border-radius: 26px;
      box-shadow: 0 16px 44px rgba(28, 48, 38, 0.13),
                  0 2px 6px rgba(196, 164, 124, 0.2),
                  inset 0 1px 2px rgba(255, 255, 255, 0.95);
      padding: clamp(18px, 2.4vh, 26px) clamp(22px, 3vw, 38px);
      text-align: center;
      position: relative;
    }
    #introWelcomeStage .intro-invitation-kicker {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(252, 238, 232, 0.92);
      border: 1px solid #E6B5A4;
      color: #8C251C;
      border-radius: 999px;
      padding: 5px 16px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin: 0 auto 8px;
      text-transform: uppercase;
    }
    #introWelcomeStage .intro-invitation-question {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: clamp(21px, 2.2vw, 29px);
      font-weight: 700;
      color: #1F3A2E;
      line-height: 1.3;
      margin: 0 auto 8px;
    }
    #introWelcomeStage .intro-invitation-desc {
      font-family: 'Be Vietnam Pro', sans-serif;
      font-size: clamp(13.5px, 1.1vw, 15px);
      line-height: 1.6;
      color: #4A5D53;
      max-width: 720px;
      margin: 0 auto 12px;
    }
    #introWelcomeStage .intro-invitation-pillars {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    #introWelcomeStage .intro-pillar-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: #2D4236;
    }
    #introWelcomeStage .intro-pillar-badge:nth-child(1) { background: #EAF0E4; border: 1px solid #CAD6BE; }
    #introWelcomeStage .intro-pillar-badge:nth-child(2) { background: #F3EEDB; border: 1px solid #D8CCA8; }
    #introWelcomeStage .intro-pillar-badge:nth-child(3) { background: #F7EDE7; border: 1px solid #E4CDC2; }
    #introWelcomeStage .intro-invitation-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
    }
    #introWelcomeStage .btn-invitation-continue {
      min-width: 240px;
      min-height: 52px;
      padding: 12px 32px;
      font-size: 16.5px;
      font-weight: 700;
      border-radius: 999px;
      background: linear-gradient(180deg, #BA3021 0%, #8C2216 100%);
      border: 1.8px solid #FFDF8E;
      color: #FFFDF8;
      box-shadow: 0 6px 20px rgba(140, 34, 22, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.35);
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease, filter 0.2s ease;
    }
    #introWelcomeStage .btn-invitation-continue:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 10px 26px rgba(186, 48, 33, 0.65);
      filter: brightness(1.08);
    }
    #introWelcomeStage .btn-invitation-continue:active {
      transform: translateY(1px) scale(0.99);
    }
    #introWelcomeStage .craft-btn {
      min-width: 156px;
      min-height: 52px;
      padding: 11px 24px;
      font-size: 15.5px;
      font-weight: 600;
      border-radius: 999px;
      background: #FFFDF8;
      border: 1.5px solid #C4A47C;
      color: #2C3E35;
      box-shadow: 0 4px 14px rgba(28, 48, 38, 0.08);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    #introWelcomeStage .craft-btn:hover {
      transform: translateY(-2px);
      border-color: #8C251C;
      box-shadow: 0 8px 18px rgba(28, 48, 38, 0.14);
    }
    #introScreen[data-intro-stage="guide"] {
      overflow-y: auto !important;
    }
    #introScreen[data-intro-stage="guide"] .intro-container {
      height: auto !important;
      min-height: 100vh;
      padding: 24px 20px 40px;
      justify-content: flex-start;
    }
    #introGuideStage {
      position: relative !important;
      top: auto !important;
      left: auto !important;
      transform: none !important;
      width: min(1040px, 95%) !important;
      margin: 16px auto !important;
      background: rgba(255, 253, 248, 0.98);
      border: 2px solid #C4A47C;
      border-radius: 28px;
      padding: 28px 36px;
      box-shadow: 0 24px 60px rgba(20, 42, 32, 0.28);
      z-index: 20;
    }
  }\n'''

new_lines = lines[:728] + [new_block] + lines[923:]
with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Successfully replaced desktop media query in index.html!')

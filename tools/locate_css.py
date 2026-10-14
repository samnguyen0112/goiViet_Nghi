import sys

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

button_targets = [
    ':root',
    '[data-theme="dark"]',
    '.btn-hero-start',
    '.btn-invitation-continue',
    '.bamboo-roll-btn',
    '.quick-deck-btn',
    '.btn-primary',
    '.dock-btn',
    '.story-topic-pill',
    '.fanned-card',
    '.station-board-ribbon',
    '.game-active-pawn-circle',
    '.postmark-seal',
    '.place-region-pill',
    '.cau-doi-banner'
]

for target in button_targets:
    for i, line in enumerate(lines):
        if target in line:
            print(f"{target:28} : line {i+1}")
            break

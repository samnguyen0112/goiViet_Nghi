/* Preview-5 book layouts (P5-01): the single description of every page layout, shared by the reader
   (book-reader-5.js) and the content checker (tools/check-books-5.cjs).
   Page = 3:4 portrait; a spread = two pages (3:2). Sizes inside a page scale with the page width, so the
   character limits below do not depend on the screen. Limits = characters including spaces, measured with
   the embedded Be Vietnam Pro / Playfair Display at 100 % text scale (verification/p5-books/limits.json);
   the reader may shrink text to 86 % before it reports an overflow. */
(function (root) {
  'use strict';
  const LAYOUTS = {
    cover: {
      label: 'Bìa trước',
      art: { fit: 'cover', ratio: 1.05, ratioLabel: '1:1' },
      fields: { title: 60, subtitle: 90 }
    },
    // body limits measured 09/11/2026 (limits.json): smaller of VI/EN at 100 % size, rounded down; heading, quote,
    // cover and back limits are design rules (one or two lines) rather than capacity.
    opener: {
      label: 'Mở một phần',
      art: { fit: 'cover', ratio: 0.8, ratioLabel: '4:5' },
      fields: { heading: 60, body: 700 }
    },
    'art-text': {
      label: 'Tranh và chữ',
      variants: {
        top: { art: { fit: 'cover', ratio: 1.5, ratioLabel: '3:2' }, fields: { heading: 70, body: 780 } },
        side: { art: { fit: 'cover', ratio: 0.8, ratioLabel: '4:5' }, fields: { heading: 60, body: 870 } }
      },
      defaultVariant: 'top'
    },
    'text-quote': {
      label: 'Chữ và câu trích',
      fields: { heading: 70, body: 1450, quote: 240 }
    },
    'full-art': {
      label: 'Tranh trọn trang',
      art: { fit: 'contain', ratio: null, ratioLabel: 'tự do' },
      fields: { caption: 190 }
    },
    notes: {
      label: 'Ghi chú văn hóa',
      fields: { heading: 70, body: 1200 }
    },
    back: {
      label: 'Bìa sau',
      fields: { text: 120 }
    }
  };
  // Layouts allowed inside sections (cover and back are book-level).
  const PAGE_LAYOUTS = ['opener', 'art-text', 'text-quote', 'full-art', 'notes'];

  function spec(layout, variant) {
    const base = LAYOUTS[layout];
    if (!base) return null;
    if (!base.variants) return base;
    const v = base.variants[variant || base.defaultVariant] ? (variant || base.defaultVariant) : null;
    return v ? Object.assign({ label: base.label, variant: v }, base.variants[v]) : null;
  }
  const api = { LAYOUTS, PAGE_LAYOUTS, spec, MIN_FIT: 0.86 };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GoiVietBookLayouts = Object.freeze(api);
})(typeof window !== 'undefined' ? window : globalThis);

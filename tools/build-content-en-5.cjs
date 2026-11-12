// P5-03 slice 3: build assets/goi-viet/map-surroundings-preview/content-en-5.js (English station and card texts of
// preview-5) from tools/content-en-5/tables.cjs and the Vietnamese data line of map-surroundings-preview-5.html.
//   node tools/build-content-en-5.cjs          build; exits 1 and lists every Vietnamese text without English
//   node tools/build-content-en-5.cjs --check  only check (nothing written); also fails when content-en-5.js on disk
//                                              is not what the tables and the data give now
//   node tools/build-content-en-5.cjs --accept hn-c1 [more ids | all]
//                                              after reading the English of those units again: record their present
//                                              Vietnamese as reviewed, then build
// The output maps each Vietnamese text to its English. At run time the page keeps its Vietnamese data and swaps the
// visible fields on a language change, so a Vietnamese edit without a new translation falls back to Vietnamese (and
// tools/check-i18n-5.cjs --walk reports it) instead of showing stale English.
// Translations written unit by unit (the cards in CARDS, the verse glosses, the place names) are paired by id, so they
// are tied to the Vietnamese they were written from, kept in tools/content-en-5/sources.json. When that Vietnamese
// changes, the build stops and names the unit: read its English again, correct it in tables.cjs, then --accept it.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
// CONTENT_EN_PAGE: another copy of the page (tests of the stale-translation lock).
const PAGE = process.env.CONTENT_EN_PAGE || path.join(ROOT, 'map-surroundings-preview-5.html');
const OUT = path.join(ROOT, 'assets/goi-viet/map-surroundings-preview/content-en-5.js');
const T = require('./content-en-5/tables.cjs');

const html = fs.readFileSync(PAGE, 'utf8');
const line = html.split(/\r?\n/).find(l => l.startsWith('const ALL_DECKS_MAP = '));
const decks = JSON.parse(line.slice('const ALL_DECKS_MAP = '.length).replace(/;\s*$/, ''));
const places = Object.values(decks).filter((p, i, a) => a.indexOf(p) === i);

// Vietnamese source of every unit translated by id (see the header): unit → the Vietnamese it has now.
const SOURCES = path.join(__dirname, 'content-en-5/sources.json');
const reviewed = fs.existsSync(SOURCES) ? JSON.parse(fs.readFileSync(SOURCES, 'utf8')) : {};
const current = {};
// Verses of the page: the five written by hand, and the function that writes the others.
const verseTable = html.match(/const FOLK_VERSES_BY_ID = (\{[\s\S]*?\n\});/);
const verseMaker = html.match(/function getFolkVerseForPlace\(place\) \{[\s\S]*?\n\}/);
if (!verseTable || !verseMaker) throw new Error('verses not found in the page');
const verses = new Function('return ' + verseTable[1])();
for (const id of Object.keys(T.VERSE_GLOSS.byId)) current['verse:' + id] = verses[id] ?? null;
current['verse:other stations'] = verseMaker[0].split('\n').filter(l => /return [`']/.test(l)).map(l => l.trim());

const EN = {};
const missing = [];
const put = (vi, en, where) => {
  if (typeof vi !== 'string' || !vi) return;
  if (en == null) { missing.push(`${where}: ${vi}`); return; }
  if (vi === en) return;
  if (EN[vi] !== undefined && EN[vi] !== en) throw new Error(`${where}: two English texts for "${vi}":\n  ${EN[vi]}\n  ${en}`);
  EN[vi] = en;
};
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripBrackets = s => s.replace(/\s*\([^()]*\)/g, '').replace(/\s+/g, ' ').trim();
const questionTemplates = Object.entries(T.QUESTIONS).map(([vi, en]) => [new RegExp('^' + escape(vi).replace(escape('{X}'), '(.+)') + '$'), en]);

for (const place of places) {
  const id = place.id;
  const [name, short] = T.NAMES[id] || [];
  if (!name) { missing.push(`${id}: place name`); continue; }
  put(place.name, name, `${id}.name`);
  put(place.short, short, `${id}.short`);
  current['name:' + id] = [place.name, place.short];
  // The forms of the place name used inside the Vietnamese sentences.
  const m = place.name.match(/^(Thành phố|Tỉnh|Quần đảo)\s+(.+)$/);
  const forms = [place.name, place.short, m && m[1].charAt(0).toLowerCase() + m[1].slice(1) + ' ' + m[2], m && m[2], m && 'vùng đất ' + m[2]].filter(Boolean);
  const isPlace = x => forms.includes(x);
  put(place.region, T.REGIONS[place.region], `${id}.region`);
  for (const k of ['tagline', 'summary']) put(place[k], T.TAGLINES[place[k]], `${id}.${k}`);
  put(place.photoTitle, T.HIGHLIGHTS[place.photoTitle] ?? EN[place.photoTitle] ?? (place.photoTitle === place.short ? short : undefined), `${id}.photoTitle`);
  for (const [k, v] of Object.entries(place.highlights || {})) put(v, T.HIGHLIGHTS[v], `${id}.highlights.${k}`);

  for (const card of place.cards) {
    const where = card.id;
    for (const a of card.activities || []) {
      const am = a.match(/^【([^】]+)】\s*(.+)$/);
      const kind = am && T.ACTIVITY_KINDS[am[1]], body = am && T.ACTIVITIES[am[2]];
      put(a, kind && body ? `【${kind}】 ${body}` : undefined, `${where}.activity`);
    }
    const own = T.CARDS[card.id];
    if (own) {
      current[card.id] = { question: card.question, options: card.options, correctIndex: card.correctIndex, explanation: card.explanation };
      put(card.question, own.question, `${where}.question`);
      if (own.options.length !== card.options.length) throw new Error(`${where}: ${card.options.length} options, ${own.options.length} in English`);
      card.options.forEach((o, i) => put(o, own.options[i], `${where}.options[${i}]`));
      put(card.explanation, own.explanation, `${where}.explanation`);
      continue;
    }
    // Template cards.
    const q = questionTemplates.find(([re]) => re.test(card.question));
    const qx = q && card.question.match(q[0])[1];
    put(card.question, q && isPlace(qx) ? q[1].replace('{X}', name) : undefined, `${where}.question`);
    const answer = card.options[card.correctIndex];
    card.options.forEach((o, i) => put(o, i === card.correctIndex ? T.ANSWERS[o] : T.DISTRACTORS[o], `${where}.options[${i}]`));
    const subject = s => {
      if (T.SUBJECTS[s]) return T.SUBJECTS[s];
      if (s === answer) return T.ANSWERS[answer];
      const note = s.startsWith(answer + ' (') && s.endsWith(')') ? s.slice(answer.length + 2, -1) : null;
      return note && T.NOTES[note] && T.ANSWERS[answer] ? `${T.ANSWERS[answer]} (${T.NOTES[note]})` : undefined;
    };
    let en;
    for (const [kind, { vi, en: tpl }] of Object.entries(T.EXPLANATIONS)) {
      const e = card.explanation.match(vi);
      if (!e) continue;
      let s, x, g;
      if (kind === 'heritage') [, s, g, x] = e; else if (kind === 'craft') [, x] = e; else [, s, x] = e;
      if (!isPlace(x)) break;
      const sEn = s === undefined ? '' : subject(s);
      if (s !== undefined && !sEn) { missing.push(`${where}.explanation subject: ${s}`); break; }
      // The sentence says "are" for the food and landmark subjects: each is a pair ("A và B").
      if ((kind === 'food' || kind === 'landmark') && !/ và /.test(s)) throw new Error(`${where}: "${s}" is not a pair`);
      // Answers and their subjects must match once the brackets are dropped.
      if (s !== undefined && T.SUBJECTS[s] && stripBrackets(s) === answer && stripBrackets(T.SUBJECTS[s]) !== T.ANSWERS[answer]) throw new Error(`${where}: subject and answer differ in English:\n  ${T.SUBJECTS[s]}\n  ${T.ANSWERS[answer]}`);
      en = tpl.replace('{S}', sEn).replace('{X}', name).replace('{G}', g ? g.split(', ').map(n => T.PEOPLES[n] || n).join(', ') : '');
      break;
    }
    put(card.explanation, en, `${where}.explanation`);
  }
}

// Every table entry should be used: an unused one is a typo or a text that changed.
const used = new Set(Object.values(EN));
const unusedFrom = (label, table, map = v => v) => Object.entries(table).filter(([, v]) => ![...used].some(u => u.includes(map(v)))).map(([k]) => `${label}: ${k}`);
const unused = [
  ...unusedFrom('highlight', T.HIGHLIGHTS), ...unusedFrom('tagline', T.TAGLINES), ...unusedFrom('answer', T.ANSWERS),
  ...unusedFrom('distractor', T.DISTRACTORS), ...unusedFrom('subject', T.SUBJECTS), ...unusedFrom('activity', T.ACTIVITIES)
];

if (missing.length) {
  console.log(`✗ ${missing.length} Vietnamese texts without English:\n  ` + missing.join('\n  '));
  process.exitCode = 1;
}
if (unused.length) console.log(`· ${unused.length} table entries not used:\n  ` + unused.join('\n  '));

// Units whose Vietnamese changed since their English was last read.
const acceptAt = process.argv.indexOf('--accept');
const accept = acceptAt > 0 ? process.argv.slice(acceptAt + 1).filter(a => !a.startsWith('--')) : [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let stale = Object.keys(current).filter(id => !same(reviewed[id], current[id]));
const unknown = accept.filter(id => id !== 'all' && !(id in current));
if (unknown.length) throw new Error('--accept: no such unit: ' + unknown.join(', '));
const accepted = stale.filter(id => accept.includes('all') || accept.includes(id));
if (accepted.length || Object.keys(reviewed).some(id => !(id in current))) {
  const next = {};
  for (const id of Object.keys(current)) next[id] = accepted.includes(id) ? current[id] : reviewed[id];
  for (const id of Object.keys(next)) if (next[id] === undefined) delete next[id];
  if (accepted.length) { fs.writeFileSync(SOURCES, JSON.stringify(next, null, 1) + '\n'); console.log(`· accepted as reviewed: ${accepted.join(', ')}`); }
  stale = stale.filter(id => !accepted.includes(id));
}
if (stale.length) {
  console.log(`✗ ${stale.length} translations to read again: the Vietnamese changed after the English was written`);
  const flat = v => (v && typeof v === 'object' && !Array.isArray(v) ? Object.entries(v) : [['', v]]);
  for (const id of stale) {
    console.log(`  ${id}` + (reviewed[id] === undefined ? '  (never reviewed)' : ''));
    const before = Object.fromEntries(flat(reviewed[id]));
    for (const [field, now] of flat(current[id])) if (reviewed[id] !== undefined && !same(before[field], now)) console.log(`     ${field || 'text'}\n       was: ${JSON.stringify(before[field])}\n       now: ${JSON.stringify(now)}`);
  }
  console.log('  Correct the English in tools/content-en-5/tables.cjs, then: node tools/build-content-en-5.cjs --accept ' + stale.join(' '));
  process.exitCode = 1;
}
const keys = Object.keys(EN).sort();
const bad = missing.length || stale.length;
console.log(`${bad ? '✗' : '✓'} ${keys.length} English texts for ${places.length} places and ${places.reduce((n, p) => n + p.cards.length, 0)} cards`);
if (bad) return;

const json = '{\n' + keys.map(k => `    ${JSON.stringify(k)}: ${JSON.stringify(EN[k])}`).join(',\n') + '\n  }';
const gloss = JSON.stringify(T.VERSE_GLOSS, null, 2).replace(/\n/g, '\n  ');
const geo = JSON.stringify(T.GEO, null, 2).replace(/\n/g, '\n  ');
const src = `/* Preview-5 English content (P5-03 slice 3): station and card texts, verse glosses, map names.
   GENERATED by tools/build-content-en-5.cjs from tools/content-en-5/tables.cjs: edit the tables, then rebuild.
   The page data keeps its Vietnamese. attach() remembers each original; on a language change the visible fields
   (place name, short name, region, tagline, summary, photo title, highlights; card question, options, explanation,
   activities) are written in that language. A text without English stays Vietnamese. Card topics and activity kinds
   are labels (uiLabel in the page). vi(obj, field) gives the Vietnamese original, for matching and for the verses.
   geo(name) gives a map name (country, sea, archipelago, island) in the current language. */
(() => {
  'use strict';
  const EN = ${json};
  const GLOSS = ${gloss};
  const GEO = ${geo};
  const PLACE = ['name', 'short', 'region', 'tagline', 'summary', 'photoTitle'];
  const CARD = ['question', 'explanation'];
  const LISTS = ['options', 'activities'];
  const originals = new WeakMap();
  let places = [];
  const lang = () => (window.GoiVietI18n ? window.GoiVietI18n.lang() : 'vi');
  const tr = (code, text) => (code === 'en' && typeof text === 'string' && Object.prototype.hasOwnProperty.call(EN, text) ? EN[text] : text);
  const remember = (obj, fields) => {
    if (!originals.has(obj)) {
      const copy = {};
      for (const f of fields) if (f in obj) copy[f] = Array.isArray(obj[f]) ? obj[f].slice() : obj[f];
      originals.set(obj, copy);
    }
    return originals.get(obj);
  };
  function apply(code = lang()) {
    for (const place of places) {
      const p = remember(place, PLACE);
      for (const f of PLACE) if (f in p) place[f] = tr(code, p[f]);
      if (place.highlights) {
        const h = remember(place.highlights, Object.keys(place.highlights));
        for (const k of Object.keys(h)) place.highlights[k] = tr(code, h[k]);
      }
      for (const card of place.cards || []) {
        const c = remember(card, [...CARD, ...LISTS]);
        for (const f of CARD) if (f in c) card[f] = tr(code, c[f]);
        for (const f of LISTS) if (Array.isArray(c[f])) c[f].forEach((text, i) => { card[f][i] = tr(code, text); });
      }
    }
  }
  function attach(list) {
    places = list.filter((place, i, all) => place && all.indexOf(place) === i);
    apply();
  }
  // The Vietnamese original of a field; 'highlights' gives the Vietnamese highlights object.
  function vi(obj, field) {
    if (!obj) return undefined;
    if (field === 'highlights') return obj.highlights && (originals.get(obj.highlights) || obj.highlights);
    const o = originals.get(obj);
    return o && field in o ? o[field] : obj[field];
  }
  // English meaning of the verse getFolkVerseForPlace gives (empty in Vietnamese).
  function gloss(place) {
    if (lang() !== 'en') return '';
    if (!place) return GLOSS.none;
    if (Object.prototype.hasOwnProperty.call(GLOSS.byId, place.id)) return GLOSS.byId[place.id];
    const h = place.highlights || {};
    return GLOSS.template.replace('{place}', place.short || place.name).replace('{landmark}', h.landmark || GLOSS.landmarkFallback).replace('{cuisine}', h.cuisine || GLOSS.cuisineFallback);
  }
  // A map name in English: the feature word moves after the name; names joined by " – ", " - ", " & " or " · " are
  // read one by one ("Phú Lâm – Đảo Đá" → "Phú Lâm – Đá Island").
  function geo(text) {
    if (lang() !== 'en' || typeof text !== 'string') return text;
    const has = (table, key) => Object.prototype.hasOwnProperty.call(table, key);
    if (has(GEO.exact, text)) return GEO.exact[text];
    const one = part => {
      if (has(GEO.exact, part)) return GEO.exact[part];
      for (const [word, english] of GEO.prefixes) if (part.startsWith(word + ' ')) return part.slice(word.length + 1) + ' ' + english;
      return part;
    };
    return text.split(/( [–&·-] )/).map((part, i) => (i % 2 ? part : one(part))).join('');
  }
  // Registered before the page's own listeners, so they render the swapped texts.
  document.addEventListener('goiviet:langchange', event => apply(event.detail && event.detail.lang));
  window.GoiVietContent = Object.freeze({ attach, apply, vi, gloss, geo, english: text => tr('en', text) });
})();
`;
if (process.argv.includes('--check')) {
  const onDisk = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (onDisk === src) console.log('✓ ' + path.relative(ROOT, OUT) + ' is up to date');
  else { console.log('✗ ' + path.relative(ROOT, OUT) + ' is not what the tables and the data give now: run node tools/build-content-en-5.cjs'); process.exitCode = 1; }
  return;
}
fs.writeFileSync(OUT, src);
console.log('wrote ' + path.relative(ROOT, OUT) + ` (${(Buffer.byteLength(src) / 1024).toFixed(0)} KB)`);

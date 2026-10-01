/**
 * Generic rule-based EN→target translator for Bio Vera mobile locale strings.
 */

export const PROTECTED = [
  'Bio Vera',
  'Vera',
  'QR',
  'GPS',
  'EUR',
  'Escrow',
  'BUYER-',
  'OK',
  'API',
  'SETVA',
  'PRSKANJE',
  'BERBA',
  'OBRADA',
  'DJUBRENJE',
  'biovera.app',
];

export function protect(text) {
  const tokens = [];
  let out = text;
  for (const term of PROTECTED) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    out = out.replace(re, (m) => {
      const id = `__P${tokens.length}__`;
      tokens.push({ id, value: m });
      return id;
    });
  }
  out = out.replace(/\{\{[^}]+\}\}/g, (m) => {
    const id = `__PH${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  out = out.replace(/<\/?\d+>/g, (m) => {
    const id = `__T${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  return { out, tokens };
}

export function restore(text, tokens) {
  let r = text;
  for (const { id, value } of tokens) r = r.split(id).join(value);
  return r;
}

export function applyGlossary(text, glossary) {
  let out = text;
  const entries = Object.entries(glossary).sort((a, b) => b[0].length - a[0].length);
  for (const [en, tgt] of entries) {
    const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    out = out.replace(re, (m) => {
      if (m === m.toUpperCase()) return tgt.toUpperCase();
      if (m[0] === m[0].toUpperCase()) return tgt.charAt(0).toUpperCase() + tgt.slice(1);
      return tgt;
    });
  }
  return out;
}

export function createTranslator({ phrases, glossary, rules }) {
  function translateSegment(text) {
    if (phrases[text]) return phrases[text];
    let out = text;
    for (const [re, repl] of rules) {
      if (re.test(out)) {
        out = out.replace(re, repl);
        break;
      }
    }
    return applyGlossary(out, glossary);
  }

  return function translate(text) {
    if (!text || typeof text !== 'string') return text;
    const { out: protectedText, tokens } = protect(text);
    if (phrases[protectedText]) return restore(phrases[protectedText], tokens);
    if (protectedText.includes('\n')) {
      const lines = protectedText.split('\n');
      return restore(lines.map((line) => translateSegment(line)).join('\n'), tokens);
    }
    return restore(translateSegment(protectedText), tokens);
  };
}

export function buildPhrasesFromGlossary(enGlossary, tgtGlossary) {
  function flatten(obj, prefix = '') {
    const out = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
      else out[key] = String(v);
    }
    return out;
  }
  const enFlat = flatten(enGlossary);
  const tgtFlat = flatten(tgtGlossary);
  const phrases = {};
  for (const [key, enVal] of Object.entries(enFlat)) {
    const tgtVal = tgtFlat[key];
    if (tgtVal && tgtVal !== enVal && enVal.length >= 3 && !/^[A-Z_]+$/.test(enVal)) {
      phrases[enVal] = tgtVal;
    }
  }
  return phrases;
}

export function buildGlossaryFromNouns(enGlossary, tgtGlossary) {
  const glossary = {};
  const enNouns = enGlossary?.nouns ?? {};
  const tgtNouns = tgtGlossary?.nouns ?? {};
  for (const [k, enVal] of Object.entries(enNouns)) {
    const tgtVal = tgtNouns[k];
    if (tgtVal && tgtVal !== enVal) glossary[enVal] = tgtVal;
  }
  // Common domain terms
  const pairs = [
    ['farm', tgtNouns.estate],
    ['farms', tgtNouns.estate ? tgtNouns.estate + 's' : null],
    ['farmer', tgtGlossary?.roles?.GROWER ?? tgtGlossary?.roles?.FARMER],
    ['farmers', tgtGlossary?.roles?.GROWER ?? tgtGlossary?.roles?.FARMER],
    ['grower', tgtGlossary?.roles?.GROWER],
    ['growers', tgtGlossary?.roles?.GROWER],
    ['estate', tgtNouns.estate],
    ['estates', tgtNouns.estate ? tgtNouns.estate + 's' : null],
    ['parcel', tgtNouns.parcel],
    ['parcels', tgtNouns.parcel ? tgtNouns.parcel + 's' : null],
    ['lot', tgtNouns.lot],
    ['lots', tgtNouns.lot ? tgtNouns.lot + 's' : null],
    ['batch', tgtNouns.batch],
    ['batches', tgtNouns.batch ? tgtNouns.batch + 's' : null],
    ['planting', tgtNouns.planting],
    ['plantings', tgtNouns.planting ? tgtNouns.planting + 's' : null],
    ['delivery', tgtNouns.delivery],
    ['deliveries', tgtNouns.delivery ? tgtNouns.delivery + 's' : null],
    ['mission', tgtNouns.mission],
    ['missions', tgtNouns.mission ? tgtNouns.mission + 's' : null],
    ['marketplace', tgtNouns.marketplace],
    ['catalogue', tgtNouns.catalogue],
    ['catalog', tgtNouns.catalogue],
    ['handover', tgtNouns.handover],
    ['receiving code', tgtNouns.receivingCode],
    ['field diary', tgtNouns.fieldDiary],
    ['harvest plan', tgtNouns.harvestPlan],
    ['harvest plans', tgtNouns.harvestPlan ? tgtNouns.harvestPlan + 's' : null],
  ];
  for (const [en, tgt] of pairs) {
    if (en && tgt) glossary[en] = tgt;
  }
  return glossary;
}

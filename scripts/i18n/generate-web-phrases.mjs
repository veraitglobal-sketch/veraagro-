#!/usr/bin/env node
/**
 * Generate web-{lang}-phrases.json from EN strings still identical in web/locales/{lang}.json.
 * Uses existing locale pairs, COMMON_PHRASES, rule engine, and word dictionaries.
 * Usage: node scripts/i18n/generate-web-phrases.mjs --lang es
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createTranslator,
  buildPhrasesFromGlossary,
  buildGlossaryFromNouns,
} from './rule-engine.mjs';
import { COMMON_PHRASES, COMMON_GLOSSARY, PATTERN_RULES } from './lang-phrases.mjs';
import { translateEnToEs } from './en-to-es-words.mjs';
import { translateEnToFr } from './en-to-fr-words.mjs';
import { translateEnToRo } from './en-to-ro-words.mjs';
import { translateEnToBg } from './en-to-bg-words.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const WEB = path.join(ROOT, 'web');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');
const LANGS = ['es', 'fr', 'ro', 'bg'];

const BUNDLE_PATTERNS = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
];

const WORD_TRANSLATORS = { es: translateEnToEs, fr: translateEnToFr, ro: translateEnToRo, bg: translateEnToBg };

function parseArgs() {
  const args = process.argv.slice(2);
  let langs = LANGS;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') langs = [args[++i]];
  }
  return langs;
}

function loadAllowlist() {
  const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
  allowlist.keys = [
    ...(allowlist.keys ?? []),
    'common.currency',
    'common.ok',
    'common.eur',
    'common.qr',
    'common.gps',
    'units.kg',
    'units.g',
  ];
  return allowlist;
}

function isAllowlisted(key, value, allowlist) {
  if (allowlist.keys?.includes(key)) return true;
  if ((value?.length ?? 0) < (allowlist.minLength ?? 3)) return true;
  for (const pattern of allowlist.patterns ?? []) {
    try {
      if (new RegExp(pattern, 'i').test(key) || new RegExp(pattern, 'i').test(value)) return true;
    } catch {
      if (value?.includes(pattern)) return true;
    }
  }
  return false;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        const ik = `${key}.${i}`;
        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
          out[ik] = String(item);
        } else {
          Object.assign(out, flatten(item, ik));
        }
      });
    } else if (v && typeof v === 'object') {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function collectExistingPhrases(lang) {
  const phrases = {};
  for (const pattern of BUNDLE_PATTERNS) {
    const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
    const tgtPath = path.join(WEB, pattern.replace('{lang}', lang));
    if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) continue;
    const enFlat = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
    const tgtFlat = flatten(JSON.parse(fs.readFileSync(tgtPath, 'utf8')));
    for (const [k, v] of Object.entries(enFlat)) {
      const t = tgtFlat[k];
      if (t && t !== v && v.length >= 3) phrases[v] = t;
    }
  }
  const enG = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/i18n/glossary/en.json'), 'utf8'));
  const tgtG = JSON.parse(fs.readFileSync(path.join(ROOT, `shared/i18n/glossary/${lang}.json`), 'utf8'));
  Object.assign(phrases, buildPhrasesFromGlossary(enG, tgtG));
  return phrases;
}

function collectPendingStrings(lang, allowlist) {
  const enFlat = flatten(JSON.parse(fs.readFileSync(path.join(WEB, 'locales/en.json'), 'utf8')));
  const tgtFlat = flatten(JSON.parse(fs.readFileSync(path.join(WEB, `locales/${lang}.json`), 'utf8')));
  const pending = new Set();
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in tgtFlat)) continue;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) pending.add(v);
  }
  return [...pending].sort();
}

function buildTranslator(lang) {
  const enGlossary = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/i18n/glossary/en.json'), 'utf8'));
  const tgtGlossary = JSON.parse(
    fs.readFileSync(path.join(ROOT, `shared/i18n/glossary/${lang}.json`), 'utf8'),
  );
  const phrases = {
    ...buildPhrasesFromGlossary(enGlossary, tgtGlossary),
    ...(COMMON_PHRASES[lang] ?? {}),
  };
  const glossary = {
    ...buildGlossaryFromNouns(enGlossary, tgtGlossary),
    ...(COMMON_GLOSSARY[lang] ?? {}),
  };
  const rules = (PATTERN_RULES[lang] ?? []).map(([re, repl]) => [new RegExp(re), repl]);
  return createTranslator({ phrases, glossary, rules });
}

function withoutIdentity(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (k !== v) out[k] = v;
  }
  return out;
}

function generateForLang(lang) {
  const outPath = path.join(__dirname, `web-${lang}-phrases.json`);
  const allowlist = loadAllowlist();
  const translateFn = buildTranslator(lang);
  const wordFn = WORD_TRANSLATORS[lang];
  const pending = collectPendingStrings(lang, allowlist);
  const seeds = withoutIdentity(collectExistingPhrases(lang));

  console.log(`\n=== Generate web-${lang}-phrases.json ===`);
  console.log(`Pending unique strings: ${pending.length}`);
  console.log(`Existing phrase seeds: ${Object.keys(seeds).length}`);

  const map = {
    ...seeds,
    ...withoutIdentity(COMMON_PHRASES[lang] ?? {}),
  };
  let ruleHits = 0;
  let wordHits = 0;
  let unresolved = [];

  for (const enValue of pending) {
    if (map[enValue] && map[enValue] !== enValue) continue;
    const ruleResult = translateFn(enValue);
    if (ruleResult !== enValue) {
      map[enValue] = ruleResult;
      ruleHits++;
      continue;
    }
    if (wordFn) {
      const wordResult = wordFn(enValue);
      if (wordResult !== enValue) {
        map[enValue] = wordResult;
        wordHits++;
        continue;
      }
    }
    unresolved.push(enValue);
  }

  console.log(`Rule/glossary: ${ruleHits}, word dict: ${wordHits}, unresolved: ${unresolved.length}`);
  if (unresolved.length) {
    console.log(`  First unresolved: ${unresolved.slice(0, 3).map((s) => s.slice(0, 50)).join(' | ')}`);
  }

  fs.writeFileSync(outPath, `${JSON.stringify(map, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(map).length} phrase mappings → ${outPath}`);
  return { map, unresolved };
}

const langs = parseArgs();
for (const lang of langs) {
  generateForLang(lang);
}

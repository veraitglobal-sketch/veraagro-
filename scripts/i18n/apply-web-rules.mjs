#!/usr/bin/env node
/**
 * Rule-based EN→target for all web locale bundles (no external API).
 * Usage: node scripts/i18n/apply-web-rules.mjs [--lang es] [--lang fr] ...
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const WEB = path.join(ROOT, 'web');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');
const DEFAULT_LANGS = ['es', 'fr', 'ro', 'bg'];

const BUNDLE_PATTERNS = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const langs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') langs.push(args[++i]);
  }
  return langs.length ? langs : DEFAULT_LANGS;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function loadAllowlist() {
  const allowlist = fs.existsSync(ALLOWLIST_PATH)
    ? loadJson(ALLOWLIST_PATH)
    : { keys: [], patterns: [], minLength: 3 };
  allowlist.keys = [
    ...(allowlist.keys ?? []),
    'common.currency',
    'common.ok',
    'common.eur',
    'common.qr',
    'common.gps',
    'navigation.appName',
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
      v.forEach((item, i) => Object.assign(out, flatten(item, `${key}.${i}`)));
    } else if (v && typeof v === 'object') {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

function buildTranslator(lang) {
  const enGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary/en.json'));
  const tgtGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary', `${lang}.json`));
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

function walkApply(enNode, tgtNode, keyPath, allowlist, translateFn) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walkApply(v, tgtNode?.[i], `${keyPath}.${i}`, allowlist, translateFn));
  }
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walkApply(v, out[k], keyPath ? `${keyPath}.${k}` : k, allowlist, translateFn);
    }
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (tgtStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return tgtStr;
  const translated = translateFn(enNode);
  return translated !== enNode ? translated : tgtStr;
}

function statsFor(enPath, tgtPath, allowlist) {
  const enFlat = flatten(loadJson(enPath));
  const tgtFlat = flatten(loadJson(tgtPath));
  let total = 0;
  let same = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in tgtFlat)) continue;
    total++;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) same++;
  }
  return { total, same, pct: total ? (same / total) * 100 : 0 };
}

const langs = parseArgs();
const allowlist = loadAllowlist();

for (const lang of langs) {
  console.log(`\n=== WEB ${lang.toUpperCase()} (rules) ===`);
  const translateFn = buildTranslator(lang);
  for (const pattern of BUNDLE_PATTERNS) {
    const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
    const tgtPath = path.join(WEB, pattern.replace('{lang}', lang));
    if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) continue;
    const en = loadJson(enPath);
    const tgt = loadJson(tgtPath);
    const merged = walkApply(en, tgt, '', allowlist, translateFn);
    saveJson(tgtPath, merged);
    const s = statsFor(enPath, tgtPath, allowlist);
    console.log(`  ${path.basename(tgtPath)}: ${s.same}/${s.total} identical (${s.pct.toFixed(1)}%)`);
  }
}

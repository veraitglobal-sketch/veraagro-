#!/usr/bin/env node
/**
 * Translate locale keys still identical to English (recursive JSON walk).
 * Preserves {{placeholders}}, <0> tags, and protected brand terms.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { translate } = require('@vitalets/google-translate-api');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

const LANG_MAP = { de: 'de', es: 'es', fr: 'fr', ro: 'ro', bg: 'bg' };
const BUNDLE_PATTERNS = {
  'web/locales': [
    'locales/{lang}.json',
    'locales/grower-journey.{lang}.json',
    'locales/suppliers-page.{lang}.json',
    'locales/buyer-retail.{lang}.json',
    'locales/passport-public.{lang}.json',
    'locales/biovera-fresh-page.{lang}.json',
    'locales/pitch-deck.{lang}.json',
  ],
  'mobile/locales': [
    'i18n/locales/{lang}.json',
    'i18n/locales/grower-journey.{lang}.json',
    'i18n/locales/grower-season.{lang}.json',
  ],
  'shared/glossary': ['shared/i18n/glossary/{lang}.json'],
};

const PROTECTED = [
  'Bio Vera',
  'Vera',
  'QR',
  'GPS',
  'EUR',
  'Escrow',
  'Expo Go',
  'EAS',
  'APK',
  'IPA',
  'PDF',
  'PNG',
  'JPEG',
  'WebP',
  'OK',
  'API',
  'Railway',
  'IndexedDB',
  'SQLite',
  'PostgreSQL',
  'Prisma',
  'NestJS',
  'Next.js',
  'React Native',
  'Hamburg',
  'Balkan',
  'SETVA',
  'PRSKANJE',
  'BERBA',
  'OBRADA',
  'DJUBRENJE',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { lang: null, bundle: null, dryRun: false, limit: Infinity };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') out.lang = args[++i];
    else if (args[i] === '--bundle') out.bundle = args[++i];
    else if (args[i] === '--dry-run') out.dryRun = true;
    else if (args[i] === '--limit') out.limit = Number(args[++i]);
  }
  if (!out.lang || !out.bundle) {
    console.error('Usage: translate-untranslated.mjs --lang de --bundle mobile/locales [--limit 100]');
    process.exit(1);
  }
  return out;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function loadAllowlist() {
  const p = path.join(ROOT, 'scripts/i18n-same-as-en.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : { keys: [], patterns: [], minLength: 3 };
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

function protectText(text) {
  const tokens = [];
  let protectedText = text;
  for (const term of PROTECTED) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    protectedText = protectedText.replace(re, (m) => {
      const id = `__PROT${tokens.length}__`;
      tokens.push({ id, value: m });
      return id;
    });
  }
  protectedText = protectedText.replace(/\{\{[^}]+\}\}/g, (m) => {
    const id = `__PH${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  protectedText = protectedText.replace(/<\/?\d+>/g, (m) => {
    const id = `__TAG${tokens.length}__`;
    tokens.push({ id, value: m });
    return id;
  });
  return { protectedText, tokens };
}

function restoreText(text, tokens) {
  let out = text;
  for (const { id, value } of tokens) out = out.split(id).join(value);
  return out;
}

async function translateValue(text, targetLang) {
  const { protectedText, tokens } = protectText(text);
  const res = await translate(protectedText, { from: 'en', to: LANG_MAP[targetLang] ?? targetLang });
  return restoreText(res.text, tokens);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function walk(enNode, tgtNode, keyPath, lang, allowlist, state) {
  if (state.count >= state.limit) return tgtNode;

  if (Array.isArray(enNode)) {
    const tgtArr = Array.isArray(tgtNode) ? tgtNode : [];
    const out = [];
    for (let i = 0; i < enNode.length; i++) {
      out[i] = await walk(enNode[i], tgtArr[i], `${keyPath}.${i}`, lang, allowlist, state);
    }
    return out;
  }

  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = await walk(v, out[k], keyPath ? `${keyPath}.${k}` : k, lang, allowlist, state);
    }
    return out;
  }

  if (typeof enNode !== 'string') return tgtNode;

  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (tgtStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return tgtStr;

  state.count += 1;
  const translated = await translateValue(enNode, lang);
  if (state.count % 20 === 0) console.log(`  … ${state.count} @ ${keyPath}`);
  await sleep(100);
  return translated;
}

async function processFile(baseDir, pattern, lang, allowlist, opts) {
  const enPath = path.join(baseDir, pattern.replace('{lang}', 'en'));
  const tgtPath = path.join(baseDir, pattern.replace('{lang}', lang));
  if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) {
    console.log(`skip missing ${tgtPath}`);
    return 0;
  }

  const enData = loadJson(enPath);
  const tgtData = loadJson(tgtPath);
  const state = { count: 0, limit: opts.limit - opts.total };
  const merged = await walk(enData, tgtData, '', lang, allowlist, state);

  if (!opts.dryRun && state.count > 0) saveJson(tgtPath, merged);
  console.log(`${opts.dryRun ? '[dry-run] ' : ''}${tgtPath}: ${state.count} strings`);
  opts.total += state.count;
  return state.count;
}

const opts = parseArgs();
opts.total = 0;
const allowlist = loadAllowlist();
const patterns = BUNDLE_PATTERNS[opts.bundle];
if (!patterns) {
  console.error('Unknown bundle:', opts.bundle);
  process.exit(1);
}

const baseDir =
  opts.bundle === 'shared/glossary'
    ? ROOT
    : path.join(ROOT, opts.bundle.startsWith('web') ? 'web' : 'mobile');

for (const pattern of patterns) {
  if (opts.total >= opts.limit) break;
  await processFile(baseDir, pattern, opts.lang, allowlist, opts);
}
console.log(`Done: ${opts.total} strings for ${opts.lang} / ${opts.bundle}`);

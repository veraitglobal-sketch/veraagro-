#!/usr/bin/env node
/**
 * Translate mobile/i18n/locales/{lang}.json keys still identical to en.json.
 * Uses Google Translate (gtx client) with retry/backoff and glossary post-processing.
 * Usage: node scripts/i18n/translate-mobile-locale.mjs --lang es
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

const LANG_MAP = { es: 'es', fr: 'fr', ro: 'ro', bg: 'bg' };

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
  'IndexedDB',
  'SQLite',
  'BUYER-',
  'SETVA',
  'PRSKANJE',
  'BERBA',
  'OBRADA',
  'DJUBRENJE',
  'Hamburg',
  'Balkan',
  'biovera.app',
];

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') lang = args[++i];
  }
  if (!lang || !LANG_MAP[lang]) {
    console.error('Usage: translate-mobile-locale.mjs --lang es|fr|ro|bg');
    process.exit(1);
  }
  return lang;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = String(v);
  }
  return out;
}

function loadAllowlist() {
  const allowlist = fs.existsSync(ALLOWLIST_PATH)
    ? loadJson(ALLOWLIST_PATH)
    : { keys: [], patterns: [], minLength: 3 };
  allowlist.keys = [
    ...(allowlist.keys ?? []),
    'common.currency',
    'common.ok',
    'alerts.ok',
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

function buildGlossaryOverrides(lang) {
  const enGlossary = path.join(ROOT, 'shared/i18n/glossary/en.json');
  const tgtGlossary = path.join(ROOT, 'shared/i18n/glossary', `${lang}.json`);
  if (!fs.existsSync(enGlossary) || !fs.existsSync(tgtGlossary)) return [];

  const enFlat = flatten(loadJson(enGlossary));
  const tgtFlat = flatten(loadJson(tgtGlossary));
  const pairs = [];

  for (const [key, enVal] of Object.entries(enFlat)) {
    const tgtVal = tgtFlat[key];
    if (!tgtVal || tgtVal === enVal || enVal.length < 3) continue;
    if (/^[A-Z_]+$/.test(enVal)) continue;
    pairs.push({ en: enVal, tgt: tgtVal });
  }

  const seen = new Set();
  pairs.sort((a, b) => b.en.length - a.en.length);
  const overrides = [];
  for (const { en: enVal, tgt: tgtVal } of pairs) {
    const norm = enVal.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    const escaped = enVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    overrides.push([new RegExp(`\\b${escaped}\\b`, 'gi'), tgtVal]);
  }
  return overrides;
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

function applyGlossary(text, overrides) {
  let out = text;
  for (const [pattern, replacement] of overrides) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gtxTranslate(text, targetLang, attempt = 0) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const parts = data?.[0];
    if (!parts?.length) throw new Error('Empty translation response');
    return parts.map((p) => p[0]).join('');
  } catch (err) {
    if (attempt < 6) {
      const delay = Math.min(20000, 1000 * 2 ** attempt);
      console.warn(`  retry ${attempt + 1} after ${delay}ms: ${err.message?.slice(0, 60)}`);
      await sleep(delay);
      return gtxTranslate(text, targetLang, attempt + 1);
    }
    throw err;
  }
}

async function translateWithRetry(text, targetLang, overrides) {
  const { protectedText, tokens } = protectText(text);
  const raw = await gtxTranslate(protectedText, LANG_MAP[targetLang]);
  const restored = restoreText(raw, tokens);
  return applyGlossary(restored, overrides);
}

function collectIdentical(enNode, tgtNode, keyPath, allowlist, out) {
  if (Array.isArray(enNode)) {
    for (let i = 0; i < enNode.length; i++) {
      collectIdentical(enNode[i], tgtNode?.[i], `${keyPath}.${i}`, allowlist, out);
    }
    return;
  }
  if (enNode && typeof enNode === 'object') {
    for (const [k, v] of Object.entries(enNode)) {
      collectIdentical(v, tgtNode?.[k], keyPath ? `${keyPath}.${k}` : k, allowlist, out);
    }
    return;
  }
  if (typeof enNode !== 'string') return;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (tgtStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return;
  out.push({ key: keyPath, value: enNode });
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function main() {
  const lang = parseArgs();
  const enPath = path.join(ROOT, 'mobile/i18n/locales/en.json');
  const tgtPath = path.join(ROOT, `mobile/i18n/locales/${lang}.json`);
  const allowlist = loadAllowlist();
  const overrides = buildGlossaryOverrides(lang);

  const en = loadJson(enPath);
  const tgt = loadJson(tgtPath);
  const pending = [];
  collectIdentical(en, tgt, '', allowlist, pending);

  // Dedupe by English value — many keys share the same string
  const valueToKeys = new Map();
  for (const item of pending) {
    if (!valueToKeys.has(item.value)) valueToKeys.set(item.value, []);
    valueToKeys.get(item.value).push(item.key);
  }
  const uniqueValues = [...valueToKeys.keys()];

  console.log(
    `[${lang}] Translating ${uniqueValues.length} unique strings (${pending.length} keys, ${overrides.length} glossary rules)…`,
  );
  let done = 0;
  const start = Date.now();
  const cache = new Map();

  for (const enValue of uniqueValues) {
    const translated = await translateWithRetry(enValue, lang, overrides);
    cache.set(enValue, translated);
    for (const key of valueToKeys.get(enValue)) {
      setByPath(tgt, key, translated);
    }
    done += 1;
    if (done % 25 === 0 || done === uniqueValues.length) {
      saveJson(tgtPath, tgt);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  [${lang}] ${done}/${uniqueValues.length} (${elapsed}s)`);
    }
    await sleep(120);
  }

  saveJson(tgtPath, tgt);

  const enFlat = flatten(en);
  const tgtFlat = flatten(tgt);
  let identical = 0;
  let compared = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in tgtFlat)) continue;
    compared += 1;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) identical++;
  }
  console.log(`\n[${lang}] Done: ${pending.length} keys via ${done} unique translations`);
  console.log(
    `[${lang}] Still identical to EN: ${identical}/${compared} (${((identical / compared) * 100).toFixed(2)}%)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

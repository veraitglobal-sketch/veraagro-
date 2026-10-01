#!/usr/bin/env node
/**
 * Clean EN→lang translation for mobile/i18n/locales/{lang}.json
 * Uses exact phrase matches + curl Google Translate (placeholder-safe).
 * Usage: node scripts/i18n/translate-mobile-clean.mjs --lang es
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { buildPhrasesFromGlossary, protect, restore } from './rule-engine.mjs';
import { COMMON_PHRASES } from './lang-phrases.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');
const LANGS = ['es', 'fr', 'ro', 'bg'];

function parseArgs() {
  const args = process.argv.slice(2);
  let langs = LANGS;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') langs = [args[++i]];
  }
  return langs;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function loadAllowlist() {
  const allowlist = loadJson(ALLOWLIST_PATH);
  allowlist.keys = [...(allowlist.keys ?? []), 'common.currency', 'common.ok', 'alerts.ok', 'navigation.appName'];
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function curlTranslate(text, targetLang, attempt = 0) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const { stdout } = await execFileAsync('curl', ['-s', '-A', 'Mozilla/5.0', url], { maxBuffer: 10 * 1024 * 1024 });
    if (stdout.startsWith('<')) throw new Error('blocked');
    const data = JSON.parse(stdout);
    return data[0].map((p) => p[0]).join('');
  } catch (err) {
    if (attempt < 5) {
      await sleep(2000 * 2 ** attempt);
      return curlTranslate(text, targetLang, attempt + 1);
    }
    throw err;
  }
}

function collectStrings(enNode, tgtNode, keyPath, allowlist, phrases, out) {
  if (Array.isArray(enNode)) {
    for (let i = 0; i < enNode.length; i++) {
      collectStrings(enNode[i], tgtNode?.[i], `${keyPath}.${i}`, allowlist, phrases, out);
    }
    return;
  }
  if (enNode && typeof enNode === 'object') {
    for (const [k, v] of Object.entries(enNode)) {
      collectStrings(v, tgtNode?.[k], keyPath ? `${keyPath}.${k}` : k, allowlist, phrases, out);
    }
    return;
  }
  if (typeof enNode !== 'string') return;
  if (isAllowlisted(keyPath, enNode, allowlist)) return;
  if (phrases[enNode]) return;
  if (!out.has(enNode)) out.set(enNode, []);
  out.get(enNode).push(keyPath);
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

function applyPhrases(enNode, tgtNode, keyPath, allowlist, phrases) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => applyPhrases(v, tgtNode?.[i], `${keyPath}.${i}`, allowlist, phrases));
  }
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = applyPhrases(v, out[k], keyPath ? `${keyPath}.${k}` : k, allowlist, phrases);
    }
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  if (isAllowlisted(keyPath, enNode, allowlist)) return enNode;
  return phrases[enNode] ?? enNode;
}

const MOBILE_EXTRA = [
  'i18n/locales/grower-journey.{lang}.json',
  'i18n/locales/grower-season.{lang}.json',
];

async function processFile(enPath, tgtPath, lang, allowlist, phrases) {
  if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) {
    console.log(`skip ${tgtPath}`);
    return;
  }
  const en = loadJson(enPath);
  let tgt = JSON.parse(JSON.stringify(en));
  tgt = applyPhrases(en, tgt, '', allowlist, phrases);

  const toTranslate = new Map();
  collectStrings(en, tgt, '', allowlist, phrases, toTranslate);
  const uniqueValues = [...toTranslate.keys()];
  console.log(`  ${path.basename(tgtPath)}: ${uniqueValues.length} curl strings`);

  let done = 0;
  for (const enValue of uniqueValues) {
    let translated;
    try {
      const { out: protectedText, tokens } = protect(enValue);
      const raw = await curlTranslate(protectedText, lang);
      translated = restore(raw, tokens);
    } catch {
      translated = enValue;
    }
    for (const key of toTranslate.get(enValue)) {
      setByPath(tgt, key, translated);
    }
    done += 1;
    if (done % 30 === 0 || done === uniqueValues.length) saveJson(tgtPath, tgt);
    await sleep(200);
  }
  saveJson(tgtPath, tgt);
}

async function processLang(lang) {
  const enPath = path.join(ROOT, 'mobile/i18n/locales/en.json');
  const tgtPath = path.join(ROOT, `mobile/i18n/locales/${lang}.json`);
  const allowlist = loadAllowlist();
  const enGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary/en.json'));
  const tgtGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary', `${lang}.json`));
  const phrases = { ...buildPhrasesFromGlossary(enGlossary, tgtGlossary), ...(COMMON_PHRASES[lang] ?? {}) };

  const en = loadJson(enPath);
  let tgt = JSON.parse(JSON.stringify(en));
  tgt = applyPhrases(en, tgt, '', allowlist, phrases);

  const toTranslate = new Map();
  collectStrings(en, tgt, '', allowlist, phrases, toTranslate);
  const uniqueValues = [...toTranslate.keys()];
  console.log(`[${lang}] ${Object.keys(phrases).length} phrases + ${uniqueValues.length} curl strings`);

  let done = 0;
  const start = Date.now();
  for (const enValue of uniqueValues) {
    let translated;
    try {
      const { out: protectedText, tokens } = protect(enValue);
      const raw = await curlTranslate(protectedText, lang);
      translated = restore(raw, tokens);
    } catch {
      translated = enValue;
    }
    for (const key of toTranslate.get(enValue)) {
      setByPath(tgt, key, translated);
    }
    done += 1;
    if (done % 50 === 0 || done === uniqueValues.length) {
      saveJson(tgtPath, tgt);
      console.log(`  [${lang}] ${done}/${uniqueValues.length} (${((Date.now() - start) / 1000).toFixed(0)}s)`);
    }
    await sleep(200);
  }
  saveJson(tgtPath, tgt);

  // stats
  function flatten(obj, prefix = '') {
    const out = {};
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
      else out[key] = String(v);
    }
    return out;
  }
  const enFlat = flatten(en);
  const tgtFlat = flatten(tgt);
  let identical = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) identical++;
  }
  console.log(`[${lang}] Done: ${Object.keys(enFlat).length - identical} translated, ${identical} identical (${((identical / Object.keys(enFlat).length) * 100).toFixed(2)}%)`);

  for (const pattern of MOBILE_EXTRA) {
    await processFile(
      path.join(ROOT, 'mobile', pattern.replace('{lang}', 'en')),
      path.join(ROOT, 'mobile', pattern.replace('{lang}', lang)),
      lang,
      allowlist,
      phrases,
    );
  }

  return { lang, translated: Object.keys(enFlat).length - identical, identical, total: Object.keys(enFlat).length };
}

const langs = parseArgs();
const results = [];
for (const lang of langs) {
  results.push(await processLang(lang));
}
console.log('\n=== Summary ===');
for (const r of results) {
  console.log(`${r.lang}: ${r.translated} keys translated, ${((r.identical / r.total) * 100).toFixed(2)}% still identical to EN`);
}

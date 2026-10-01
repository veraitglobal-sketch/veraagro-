#!/usr/bin/env node
/**
 * Translate mobile/i18n/locales/{lang}.json from English.
 * Pass 1: rule engine (glossary + phrases + patterns)
 * Pass 2: curl-based Google Translate for remaining identical strings
 * Usage: node scripts/i18n/apply-mobile-translations.mjs [--lang es|fr|ro|bg] [--rules-only]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  createTranslator,
  buildPhrasesFromGlossary,
  buildGlossaryFromNouns,
  protect,
  restore,
} from './rule-engine.mjs';
import { COMMON_PHRASES, COMMON_GLOSSARY, PATTERN_RULES } from './lang-phrases.mjs';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');
const LANGS = ['es', 'fr', 'ro', 'bg'];

function parseArgs() {
  const args = process.argv.slice(2);
  let lang = null;
  let rulesOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') lang = args[++i];
    else if (args[i] === '--rules-only') rulesOnly = true;
  }
  return { lang: lang ? [lang] : LANGS, rulesOnly };
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

function walkApply(enNode, tgtNode, keyPath, translate, allowlist) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walkApply(v, tgtNode?.[i], `${keyPath}.${i}`, translate, allowlist));
  }
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walkApply(v, out[k], keyPath ? `${keyPath}.${k}` : k, translate, allowlist);
    }
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (tgtStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return tgtStr;
  return translate(enNode);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function curlTranslate(text, targetLang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const { stdout } = await execFileAsync('curl', ['-s', '-A', 'Mozilla/5.0', url], {
    maxBuffer: 10 * 1024 * 1024,
  });
  if (stdout.startsWith('<')) throw new Error('Google blocked request');
  const data = JSON.parse(stdout);
  return data[0].map((p) => p[0]).join('');
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

function countIdentical(enFlat, tgtFlat, allowlist) {
  let identical = 0;
  let compared = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in tgtFlat)) continue;
    compared += 1;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) identical++;
  }
  return { identical, compared };
}

async function curlPass(lang, en, tgt, allowlist) {
  const enFlat = flatten(en);
  const tgtFlat = flatten(tgt);
  const valueToKeys = new Map();
  for (const [key, enVal] of Object.entries(enFlat)) {
    if (!(key in tgtFlat)) continue;
    if (tgtFlat[key] !== enVal || isAllowlisted(key, enVal, allowlist)) continue;
    if (!valueToKeys.has(enVal)) valueToKeys.set(enVal, []);
    valueToKeys.get(enVal).push(key);
  }
  const uniqueValues = [...valueToKeys.keys()];
  console.log(`[${lang}] Curl pass: ${uniqueValues.length} unique strings remaining…`);

  function setByPath(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  let done = 0;
  const start = Date.now();
  for (const enValue of uniqueValues) {
    let translated;
    try {
      const { out: protectedText, tokens } = protect(enValue);
      const raw = await curlTranslate(protectedText, lang);
      translated = restore(raw, tokens);
    } catch (err) {
      console.warn(`  skip: ${err.message?.slice(0, 40)} — ${enValue.slice(0, 50)}`);
      continue;
    }
    for (const key of valueToKeys.get(enValue)) {
      setByPath(tgt, key, translated);
    }
    done += 1;
    if (done % 50 === 0 || done === uniqueValues.length) {
      const tgtPath = path.join(ROOT, `mobile/i18n/locales/${lang}.json`);
      saveJson(tgtPath, tgt);
      console.log(`  [${lang}] curl ${done}/${uniqueValues.length} (${((Date.now() - start) / 1000).toFixed(0)}s)`);
    }
    await sleep(250);
  }
  return done;
}

async function processLang(lang, rulesOnly) {
  const enPath = path.join(ROOT, 'mobile/i18n/locales/en.json');
  const tgtPath = path.join(ROOT, `mobile/i18n/locales/${lang}.json`);
  const allowlist = loadAllowlist();
  const en = loadJson(enPath);
  const tgt = loadJson(tgtPath);
  const translate = buildTranslator(lang);

  const merged = walkApply(en, tgt, '', translate, allowlist);
  saveJson(tgtPath, merged);

  const enFlat = flatten(en);
  let stats = countIdentical(enFlat, flatten(merged), allowlist);
  console.log(
    `[${lang}] After rules: ${stats.identical}/${stats.compared} identical (${((stats.identical / stats.compared) * 100).toFixed(2)}%)`,
  );

  let curlCount = 0;
  if (!rulesOnly && stats.identical / stats.compared > 0.05) {
    curlCount = await curlPass(lang, en, merged, allowlist);
    saveJson(tgtPath, merged);
    stats = countIdentical(enFlat, flatten(merged), allowlist);
  }

  const keysTranslated = stats.compared - stats.identical;
  console.log(
    `[${lang}] Final: ${keysTranslated} keys translated, ${stats.identical}/${stats.compared} still identical (${((stats.identical / stats.compared) * 100).toFixed(2)}%)`,
  );
  return { lang, keysTranslated, identical: stats.identical, compared: stats.compared, curlCount };
}

const { lang: langs, rulesOnly } = parseArgs();

const results = [];
for (const lang of langs) {
  results.push(await processLang(lang, rulesOnly));
}

console.log('\n=== Summary ===');
for (const r of results) {
  console.log(
    `${r.lang}: ${r.compared - r.identical} keys translated, ${((r.identical / r.compared) * 100).toFixed(2)}% still identical to EN`,
  );
}

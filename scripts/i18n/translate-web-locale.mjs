#!/usr/bin/env node
/**
 * Translate web locale bundles for es|fr|ro|bg (keys still identical to EN).
 * Usage: node scripts/i18n/translate-web-locale.mjs --lang es
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function curlTranslate(text, targetLang, attempt = 0) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const { stdout } = await execFileAsync('curl', ['-s', '-A', 'Mozilla/5.0', url], {
      maxBuffer: 10 * 1024 * 1024,
    });
    if (stdout.startsWith('<')) throw new Error('blocked');
    const data = JSON.parse(stdout);
    return data[0].map((p) => p[0]).join('');
  } catch (err) {
    if (attempt < 6) {
      await sleep(2500 * 2 ** attempt);
      return curlTranslate(text, targetLang, attempt + 1);
    }
    throw err;
  }
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
  return translateFn(enNode);
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
  if (!out.has(enNode)) out.set(enNode, []);
  out.get(enNode).push(keyPath);
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isIndex = /^\d+$/.test(nextPart);
    if (/^\d+$/.test(part)) {
      const idx = Number(part);
      if (!Array.isArray(cur)) return;
      if (!cur[idx]) cur[idx] = isIndex ? [] : {};
      cur = cur[idx];
    } else {
      if (!cur[part] || typeof cur[part] !== 'object') cur[part] = isIndex ? [] : {};
      cur = cur[part];
    }
  }
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && Array.isArray(cur)) cur[Number(last)] = value;
  else cur[last] = value;
}

function buildTranslator(lang) {
  const enGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary/en.json'));
  const tgtGlossary = loadJson(path.join(ROOT, 'shared/i18n/glossary', `${lang}.json`));
  const phrases = {
    ...buildPhrasesFromGlossary(enGlossary, tgtGlossary),
    ...buildGlossaryFromNouns(enGlossary, tgtGlossary),
    ...(COMMON_PHRASES[lang] ?? {}),
  };
  const glossary = {
    ...buildGlossaryFromNouns(enGlossary, tgtGlossary),
    ...(COMMON_GLOSSARY[lang] ?? {}),
  };
  const rules = (PATTERN_RULES[lang] ?? []).map(([re, repl]) => [new RegExp(re), repl]);
  return createTranslator({ phrases, glossary, rules });
}

async function processBundle(pattern, lang, allowlist, translateFn) {
  const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
  const tgtPath = path.join(WEB, pattern.replace('{lang}', lang));
  if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) {
    console.log(`skip ${tgtPath}`);
    return null;
  }

  const en = loadJson(enPath);
  let tgt = loadJson(tgtPath);
  tgt = walkApply(en, tgt, '', allowlist, translateFn);

  const pending = new Map();
  collectIdentical(en, tgt, '', allowlist, pending);
  const unique = [...pending.keys()];
  console.log(`  ${path.basename(tgtPath)}: ${unique.length} strings via API`);

  let done = 0;
  for (const enValue of unique) {
    try {
      const { out: protectedText, tokens } = protect(enValue);
      const raw = await curlTranslate(protectedText, lang);
      const translated = restore(raw, tokens);
      for (const key of pending.get(enValue)) setByPath(tgt, key, translated);
    } catch {
      /* keep rule pass value */
    }
    done += 1;
    if (done % 50 === 0 || done === unique.length) {
      saveJson(tgtPath, tgt);
      console.log(`    ${done}/${unique.length}`);
    }
    await sleep(250);
  }
  saveJson(tgtPath, tgt);

  const enFlat = flatten(en);
  const tgtFlat = flatten(tgt);
  let identical = 0;
  let total = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (!(k in tgtFlat)) continue;
    total++;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) identical++;
  }
  console.log(`  → ${identical}/${total} identical (${((identical / total) * 100).toFixed(1)}%)`);
  return { file: path.basename(tgtPath), identical, total };
}

async function processLang(lang) {
  console.log(`\n=== WEB ${lang.toUpperCase()} ===`);
  const allowlist = loadAllowlist();
  const translateFn = buildTranslator(lang);
  const results = [];
  for (const pattern of BUNDLE_PATTERNS) {
    results.push(await processBundle(pattern, lang, allowlist, translateFn));
  }
  return results;
}

const langs = parseArgs();
for (const lang of langs) {
  await processLang(lang);
}

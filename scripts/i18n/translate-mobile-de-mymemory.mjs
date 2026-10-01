#!/usr/bin/env node
/**
 * Translate mobile de.json via MyMemory API with glossary post-processing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const EN_PATH = path.join(ROOT, 'mobile/i18n/locales/en.json');
const DE_PATH = path.join(ROOT, 'mobile/i18n/locales/de.json');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

const NS_ORDER = ['common', 'navigation', 'login', 'register', 'buyer', 'producer', 'logistics', 'supplier', 'errors'];

const PROTECTED = [
  'Bio Vera', 'Vera', 'QR', 'GPS', 'EUR', 'Escrow', 'BUYER-', 'OK', 'API', 'BIO-Ready', 'BIO-READY',
  'SETVA', 'PRSKANJE', 'BERBA', 'OBRADA', 'DJUBRENJE', 'biovera.app', 'Google', 'MateCat',
];

const GLOSSARY_FIXES = [
  [/\bBauernhof(e)?\b/gi, 'Betrieb'],
  [/\bFarm(en|er|ers)?\b/gi, (m) => /er/i.test(m) ? 'Erzeuger' : 'Betrieb'],
  [/\bGrundstück(e)?\b/gi, 'Parzelle'],
  [/\bFeld(er)?\b/gi, 'Parzelle'],
  [/\bPartie(n)?\b/gi, 'Los'],
  [/\bChargen?\b/gi, (m) => m[0] === m[0].toUpperCase() ? 'Charge' : 'Charge'],
  [/\bAnbauer\b/gi, 'Erzeuger'],
  [/\bMarktplatz\b/gi, 'Marktplatz'],
  [/\bÜbergabe\b/gi, 'Übergabe'],
  [/\bEmpfangscode\b/gi, 'Empfangscode'],
  [/\bErnteplan\b/gi, 'Ernteplan'],
  [/\bFeldtagebuch\b/gi, 'Feldtagebuch'],
  [/\bFrachtführer\b/gi, 'Spediteur'],
  [/\bSpediteur(e)?\b/gi, 'Spediteur'],
  [/\bKatalog\b/gi, 'Katalog'],
  [/\bSaatgutbeutel\b/gi, 'Saatgutsack'],
  [/\bSaatgutsack\b/gi, 'Saatgutsack'],
  [/\bFreigabeliste\b/gi, 'Freigabeliste'],
  [/\bTreuhand\b/gi, 'Treuhand'],
];

function loadAllowlist() {
  const allowlist = fs.existsSync(ALLOWLIST_PATH) ? JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8')) : { keys: [], patterns: [], minLength: 3 };
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

function protect(text) {
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

function restore(text, tokens) {
  let r = text;
  for (const { id, value } of tokens) r = r.split(id).join(value);
  return r;
}

function applyGlossary(text) {
  let out = text;
  for (const [re, repl] of GLOSSARY_FIXES) {
    out = typeof repl === 'function' ? out.replace(re, repl) : out.replace(re, repl);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateText(text, attempt = 0) {
  const { out: protectedText, tokens } = protect(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=en|de`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.quotaFinished) throw new Error('MyMemory quota finished');
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed');
    let translated = data.responseData.translatedText;
    // MyMemory sometimes returns ALL CAPS for short strings
    if (text !== text.toUpperCase() && translated === translated.toUpperCase() && text.length > 3) {
      translated = translated.charAt(0) + translated.slice(1).toLowerCase();
    }
    return applyGlossary(restore(translated, tokens));
  } catch (err) {
    if (attempt < 5) {
      const delay = 3000 * (attempt + 1);
      console.warn(`  retry ${attempt + 1}: ${err.message?.slice(0, 50)}`);
      await sleep(delay);
      return translateText(text, attempt + 1);
    }
    throw err;
  }
}

function collectIdentical(enNode, deNode, keyPath, allowlist, out) {
  if (Array.isArray(enNode)) {
    for (let i = 0; i < enNode.length; i++) {
      collectIdentical(enNode[i], deNode?.[i], `${keyPath}.${i}`, allowlist, out);
    }
    return;
  }
  if (enNode && typeof enNode === 'object') {
    for (const [k, v] of Object.entries(enNode)) {
      collectIdentical(v, deNode?.[k], keyPath ? `${keyPath}.${k}` : k, allowlist, out);
    }
    return;
  }
  if (typeof enNode !== 'string') return;
  const deStr = typeof deNode === 'string' ? deNode : enNode;
  if (deStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return;
  out.push({ key: keyPath, value: enNode, ns: keyPath.split('.')[0] });
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

function sortItems(items) {
  const idx = (ns) => {
    const i = NS_ORDER.indexOf(ns);
    return i >= 0 ? i : NS_ORDER.length + ns.charCodeAt(0);
  };
  return [...items].sort((a, b) => idx(a.ns) - idx(b.ns) || a.key.localeCompare(b.key));
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

async function main() {
  const allowlist = loadAllowlist();
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  let de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));
  const pending = [];
  collectIdentical(en, de, '', allowlist, pending);
  const sorted = sortItems(pending);

  console.log(`Translating ${sorted.length} strings via MyMemory…`);
  let done = 0;

  for (const item of sorted) {
    try {
      const translated = await translateText(item.value);
      setByPath(de, item.key, translated);
      done++;
      if (done % 25 === 0 || done === sorted.length) {
        fs.writeFileSync(DE_PATH, `${JSON.stringify(de, null, 2)}\n`);
        console.log(`  ${done}/${sorted.length} — ${item.ns}: ${item.key.slice(0, 60)}`);
      }
      await sleep(350);
    } catch (err) {
      console.error(`FAILED ${item.key}: ${err.message}`);
      fs.writeFileSync(DE_PATH, `${JSON.stringify(de, null, 2)}\n`);
      break;
    }
  }

  fs.writeFileSync(DE_PATH, `${JSON.stringify(de, null, 2)}\n`);
  const enFlat = flatten(en);
  const deFlat = flatten(de);
  let identical = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (deFlat[k] === v && typeof v === 'string' && !isAllowlisted(k, v, allowlist)) identical++;
  }
  console.log(`\nTranslated this run: ${done}`);
  console.log(`Still identical: ${identical}/${Object.keys(enFlat).length} (${((identical / Object.keys(enFlat).length) * 100).toFixed(1)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

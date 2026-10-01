#!/usr/bin/env node
/**
 * Translate web/locales/*.de.json keys still identical to English.
 * Pass 1: rule-based (en-to-de-rules.mjs)
 * Pass 2: Google Translate with glossary post-processing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { translateEnToDe } from './en-to-de-rules.mjs';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const WEB = path.join(ROOT, 'web');
const GLOSSARY_PATH = path.join(ROOT, 'shared/i18n/glossary/de.json');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

const BUNDLE_PATTERNS = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
  'locales/pitch-deck.{lang}.json',
];

const PROTECTED = [
  'Bio Vera', 'Vera', 'QR', 'GPS', 'EUR', 'Escrow', 'Expo Go', 'EAS', 'APK', 'IPA',
  'PDF', 'PNG', 'JPEG', 'WebP', 'OK', 'API', 'IndexedDB', 'SQLite', 'PostgreSQL',
  'Prisma', 'NestJS', 'Next.js', 'React Native', 'Hamburg', 'Balkan', 'BioVera',
  'SETVA', 'PRSKANJE', 'BERBA', 'OBRADA', 'DJUBRENJE', 'biovera.app', 'BioVera.app',
];

const GLOSSARY_OVERRIDES = [
  [/\bfarm(s|er|er's|ers)?\b/gi, (m) => (m.toLowerCase().includes('farmer') ? 'Erzeuger' : 'Betrieb')],
  [/\bestate(s)?\b/gi, 'Betrieb'],
  [/\bparcels?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Parzelle' : 'Parzelle')],
  [/\blots?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Los' : 'Los')],
  [/\bbatches?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Charge' : 'Charge')],
  [/\bgrower(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Erzeuger' : 'Erzeuger')],
  [/\bmarketplace\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Marktplatz' : 'Marktplatz')],
  [/\bfield diary\b/gi, 'Feldtagebuch'],
  [/\bharvest plan(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Ernteplan' : 'Ernteplan')],
  [/\bhandover\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Übergabe' : 'Übergabe')],
  [/\breceiving code\b/gi, 'Empfangscode'],
  [/\bplanting(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Anbau' : 'Anbau')],
  [/\bdelivery\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Lieferung' : 'Lieferung')],
  [/\bmission(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Mission' : 'Mission')],
  [/\bpartner store(s)?\b/gi, 'Partnergeschäft'],
  [/\bcatalog(ue)?\b/gi, 'Katalog'],
  [/\bseed bag(s)?\b/gi, 'Saatgutsack'],
  [/\bbarcode(s)?\b/gi, 'Barcode'],
  [/\bwhitelisted\b/gi, 'freigegeben'],
  [/\bwhitelist\b/gi, 'Freigabeliste'],
  [/\bsupplier(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Lieferant' : 'Lieferant')],
  [/\bbuyer(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Käufer' : 'Käufer')],
  [/\bcarrier(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Spediteur' : 'Spediteur')],
  [/\bcompliance\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Konformität' : 'Konformität')],
  [/\bpacking\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Verpackung' : 'Verpackung')],
  [/\btransport\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Transport' : 'Transport')],
  [/\bshipment(s)?\b/gi, (m) => (m[0] === m[0].toUpperCase() ? 'Sendung' : 'Sendung')],
];

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
    'common.currency', 'common.ok', 'common.eur', 'common.qr', 'common.gps',
    'navigation.appName', 'units.kg', 'units.g',
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
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = String(v);
  }
  return out;
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

function applyGlossary(text) {
  let out = text;
  for (const [pattern, replacement] of GLOSSARY_OVERRIDES) {
    if (typeof replacement === 'function') out = out.replace(pattern, replacement);
    else out = out.replace(pattern, replacement);
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateWithRetry(text, attempt = 0) {
  const { protectedText, tokens } = protectText(text);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(protectedText)}&langpair=en|de`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.quotaFinished) throw new Error('MyMemory quota finished');
    if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'Translation failed');
    let translated = data.responseData.translatedText;
    if (text !== text.toUpperCase() && translated === translated.toUpperCase() && text.length > 3) {
      translated = translated.charAt(0) + translated.slice(1).toLowerCase();
    }
    return applyGlossary(restoreText(translated, tokens));
  } catch (err) {
    if (attempt < 6) {
      const delay = 2500 * (attempt + 1);
      console.warn(`  retry ${attempt + 1} after ${delay}ms: ${err.message?.slice(0, 60)}`);
      await sleep(delay);
      return translateWithRetry(text, attempt + 1);
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
  out.push({ key: keyPath, value: enNode });
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

function applyRulesWalk(enNode, deNode, keyPath, allowlist) {
  if (Array.isArray(enNode)) {
    const out = Array.isArray(deNode) ? [...deNode] : [];
    for (let i = 0; i < enNode.length; i++) {
      out[i] = applyRulesWalk(enNode[i], out[i], `${keyPath}.${i}`, allowlist);
    }
    return out;
  }
  if (enNode && typeof enNode === 'object') {
    const out = deNode && typeof deNode === 'object' && !Array.isArray(deNode) ? { ...deNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = applyRulesWalk(v, out[k], keyPath ? `${keyPath}.${k}` : k, allowlist);
    }
    return out;
  }
  if (typeof enNode !== 'string') return deNode;
  const deStr = typeof deNode === 'string' ? deNode : enNode;
  if (deStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return deStr;
  const translated = translateEnToDe(enNode);
  return translated !== enNode ? translated : deStr;
}

function statsForFile(enPath, dePath, allowlist) {
  if (!fs.existsSync(enPath) || !fs.existsSync(dePath)) return null;
  const enFlat = flatten(loadJson(enPath));
  const deFlat = flatten(loadJson(dePath));
  let total = 0;
  let same = 0;
  let sameAllowlisted = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (deFlat[k] === undefined) continue;
    total++;
    if (deFlat[k] === v) {
      if (isAllowlisted(k, v, allowlist)) sameAllowlisted++;
      else same++;
    }
  }
  return { total, same, sameAllowlisted, pct: total ? (same / total) * 100 : 0 };
}

async function processBundle(pattern, allowlist) {
  const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
  const dePath = path.join(WEB, pattern.replace('{lang}', 'de'));
  if (!fs.existsSync(enPath) || !fs.existsSync(dePath)) {
    console.log(`skip missing: ${dePath}`);
    return { file: dePath, skipped: true };
  }

  const en = loadJson(enPath);
  let de = loadJson(dePath);

  // Pass 1: rule-based
  de = applyRulesWalk(en, de, '', allowlist);
  saveJson(dePath, de);

  const before = statsForFile(enPath, dePath, allowlist);
  console.log(`\n${path.basename(dePath)} — after rules: ${before.same}/${before.total} identical (${before.pct.toFixed(1)}%)`);

  // Pass 2: machine translate remaining
  const pending = [];
  collectIdentical(en, de, '', allowlist, pending);
  console.log(`  machine translating ${pending.length} strings…`);

  let done = 0;
  for (const item of pending) {
    const translated = await translateWithRetry(item.value);
    setByPath(de, item.key, translated);
    done += 1;
    if (done % 25 === 0 || done === pending.length) {
      saveJson(dePath, de);
      console.log(`  ${done}/${pending.length} — ${item.key.slice(0, 60)}`);
    }
    await sleep(400);
  }

  saveJson(dePath, de);
  const after = statsForFile(enPath, dePath, allowlist);
  console.log(`  done: translated ${done}, now ${after.same}/${after.total} identical (${after.pct.toFixed(1)}%)`);
  return { file: dePath, before, after, translated: done };
}

async function main() {
  const allowlist = loadAllowlist();
  console.log('Bio Vera web DE translation — all bundles\n');

  const results = [];
  for (const pattern of BUNDLE_PATTERNS) {
    results.push(await processBundle(pattern, allowlist));
  }

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    if (r.skipped) {
      console.log(`${path.basename(r.file)}: SKIPPED (missing)`);
      continue;
    }
    console.log(
      `${path.basename(r.file)}: ${r.after.same}/${r.after.total} identical (${r.after.pct.toFixed(1)}%) — translated ${r.translated}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

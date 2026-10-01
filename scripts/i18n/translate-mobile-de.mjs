#!/usr/bin/env node
/**
 * Translate mobile/i18n/locales/de.json keys still identical to en.json.
 * Uses Google Translate with retry/backoff and glossary term post-processing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { translate } = require('@vitalets/google-translate-api');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const EN_PATH = path.join(ROOT, 'mobile/i18n/locales/en.json');
const DE_PATH = path.join(ROOT, 'mobile/i18n/locales/de.json');
const GLOSSARY_PATH = path.join(ROOT, 'shared/i18n/glossary/de.json');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

const NS_ORDER = [
  'common',
  'navigation',
  'login',
  'register',
  'buyer',
  'producer',
  'logistics',
  'supplier',
  'errors',
];

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
];

// English → German glossary overrides (applied after machine translation)
const GLOSSARY_OVERRIDES = [
  [/\bfarm(s|er|er's|ers)?\b/gi, (m) => m.toLowerCase().includes('farmer') ? 'Erzeuger' : 'Betrieb'],
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
  // Mobile-specific allowlist entries
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
    if (typeof replacement === 'function') {
      out = out.replace(pattern, replacement);
    } else {
      out = out.replace(pattern, replacement);
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateWithRetry(text, attempt = 0) {
  const { protectedText, tokens } = protectText(text);
  try {
    const res = await translate(protectedText, { from: 'en', to: 'de' });
    const restored = restoreText(res.text, tokens);
    return applyGlossary(restored);
  } catch (err) {
    if (attempt < 8) {
      const delay = Math.min(30000, 2000 * 2 ** attempt);
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
  const ns = keyPath.split('.')[0];
  out.push({ key: keyPath, value: enNode, ns });
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

function sortNamespaces(items) {
  const orderIndex = (ns) => {
    const i = NS_ORDER.indexOf(ns);
    return i >= 0 ? i : NS_ORDER.length + ns.charCodeAt(0);
  };
  return [...items].sort((a, b) => {
    const d = orderIndex(a.ns) - orderIndex(b.ns);
    return d !== 0 ? d : a.key.localeCompare(b.key);
  });
}

async function main() {
  const allowlist = loadAllowlist();
  const en = loadJson(EN_PATH);
  const de = loadJson(DE_PATH);
  const pending = [];
  collectIdentical(en, de, '', allowlist, pending);
  const sorted = sortNamespaces(pending);

  console.log(`Translating ${sorted.length} strings…`);
  let done = 0;
  const start = Date.now();

  for (const item of sorted) {
    const translated = await translateWithRetry(item.value);
    setByPath(de, item.key, translated);
    done += 1;
    if (done % 10 === 0 || done === sorted.length) {
      saveJson(DE_PATH, de);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.log(`  ${done}/${sorted.length} (${elapsed}s) — ${item.ns}: ${item.key}`);
    }
    await sleep(1500);
  }

  saveJson(DE_PATH, de);

  // Stats
  function flatten(obj, prefix = '') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
      else out[key] = v;
    }
    return out;
  }
  const enFlat = flatten(en);
  const deFlat = flatten(de);
  let identical = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (deFlat[k] === v && typeof v === 'string' && !isAllowlisted(k, v, allowlist)) identical++;
  }
  const total = Object.keys(enFlat).length;
  console.log(`\nDone: ${done} translated`);
  console.log(`Still identical to EN: ${identical}/${total} (${((identical / total) * 100).toFixed(1)}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

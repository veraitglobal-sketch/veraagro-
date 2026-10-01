#!/usr/bin/env node
/**
 * Apply web-{lang}-phrases.json (EN string -> target string) to web locale bundles.
 * Usage: node scripts/i18n/apply-web-phrases.mjs --lang es
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function walk(enNode, tgtNode, keyPath, allowlist, phrases) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walk(v, tgtNode?.[i], `${keyPath}.${i}`, allowlist, phrases));
  }
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walk(v, out[k], keyPath ? `${keyPath}.${k}` : k, allowlist, phrases);
    }
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (tgtStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return tgtStr;
  if (phrases[enNode] && phrases[enNode] !== enNode) return phrases[enNode];
  return tgtStr;
}

function stats(enPath, tgtPath, allowlist) {
  const enFlat = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
  const tgtFlat = flatten(JSON.parse(fs.readFileSync(tgtPath, 'utf8')));
  let total = 0;
  let same = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (tgtFlat[k] === undefined) continue;
    total++;
    if (tgtFlat[k] === v && !isAllowlisted(k, v, allowlist)) same++;
  }
  return { total, same, pct: total ? (same / total) * 100 : 0 };
}

const langs = parseArgs();
const allowlist = loadAllowlist();

for (const lang of langs) {
  const phrasesPath = path.join(__dirname, `web-${lang}-phrases.json`);
  if (!fs.existsSync(phrasesPath)) {
    console.error(`Missing ${phrasesPath} — run generate-web-phrases.mjs --lang ${lang} first`);
    continue;
  }
  const phrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf8'));
  console.log(`\n=== Applying ${Object.keys(phrases).length} phrases → ${lang.toUpperCase()} ===`);

  for (const pattern of BUNDLE_PATTERNS) {
    const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
    const tgtPath = path.join(WEB, pattern.replace('{lang}', lang));
    if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) continue;
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const tgt = JSON.parse(fs.readFileSync(tgtPath, 'utf8'));
    const merged = walk(en, tgt, '', allowlist, phrases);
    fs.writeFileSync(tgtPath, `${JSON.stringify(merged, null, 2)}\n`);
    const s = stats(enPath, tgtPath, allowlist);
    console.log(`${path.basename(tgtPath)}: ${s.same}/${s.total} identical (${s.pct.toFixed(1)}%)`);
  }
}

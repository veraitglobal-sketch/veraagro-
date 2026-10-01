#!/usr/bin/env node
/**
 * Apply web-de-phrases.json (EN string -> DE string) to web locale bundles.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateEnToDe } from './en-to-de-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const WEB = path.join(ROOT, 'web');
const PHRASES_PATH = path.join(__dirname, 'web-de-phrases.json');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

const BUNDLE_PATTERNS = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
];

const PHRASES = fs.existsSync(PHRASES_PATH)
  ? JSON.parse(fs.readFileSync(PHRASES_PATH, 'utf8'))
  : {};

function loadAllowlist() {
  const allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf8'));
  allowlist.keys = [...(allowlist.keys ?? []), 'common.currency', 'common.ok', 'units.kg', 'units.g'];
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

function walk(enNode, deNode, keyPath, allowlist) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walk(v, deNode?.[i], `${keyPath}.${i}`, allowlist));
  }
  if (enNode && typeof enNode === 'object') {
    const out = deNode && typeof deNode === 'object' && !Array.isArray(deNode) ? { ...deNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walk(v, out[k], keyPath ? `${keyPath}.${k}` : k, allowlist);
    }
    return out;
  }
  if (typeof enNode !== 'string') return deNode;
  const deStr = typeof deNode === 'string' ? deNode : enNode;
  if (deStr !== enNode || isAllowlisted(keyPath, enNode, allowlist)) return deStr;
  if (PHRASES[enNode] && PHRASES[enNode] !== enNode) return PHRASES[enNode];
  const translated = translateEnToDe(enNode);
  return translated !== enNode ? translated : deStr;
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else if (typeof v === 'string') out[key] = v;
  }
  return out;
}

function stats(enPath, dePath, allowlist) {
  const enFlat = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
  const deFlat = flatten(JSON.parse(fs.readFileSync(dePath, 'utf8')));
  let total = 0;
  let same = 0;
  for (const [k, v] of Object.entries(enFlat)) {
    if (deFlat[k] === undefined) continue;
    total++;
    if (deFlat[k] === v && !isAllowlisted(k, v, allowlist)) same++;
  }
  return { total, same, pct: total ? (same / total) * 100 : 0 };
}

const allowlist = loadAllowlist();

for (const pattern of BUNDLE_PATTERNS) {
  const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
  const dePath = path.join(WEB, pattern.replace('{lang}', 'de'));
  if (!fs.existsSync(enPath) || !fs.existsSync(dePath)) continue;
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
  const merged = walk(en, de, '', allowlist);
  fs.writeFileSync(dePath, `${JSON.stringify(merged, null, 2)}\n`);
  const s = stats(enPath, dePath, allowlist);
  console.log(`${path.basename(dePath)}: ${s.same}/${s.total} identical (${s.pct.toFixed(1)}%)`);
}

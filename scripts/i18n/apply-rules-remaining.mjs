#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateEnToDe } from './en-to-de-rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const EN_PATH = path.join(ROOT, 'mobile/i18n/locales/en.json');
const DE_PATH = path.join(ROOT, 'mobile/i18n/locales/de.json');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

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
  return translateEnToDe(enNode);
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

const allowlist = loadAllowlist();
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));
const merged = walk(en, de, '', allowlist);
fs.writeFileSync(DE_PATH, `${JSON.stringify(merged, null, 2)}\n`);

const enFlat = flatten(en);
const deFlat = flatten(merged);
let identical = 0;
for (const [k, v] of Object.entries(enFlat)) {
  if (deFlat[k] === v && typeof v === 'string' && !isAllowlisted(k, v, allowlist)) identical++;
}
console.log(`Still identical (non-allowlisted): ${identical}/${Object.keys(enFlat).length} (${((identical / Object.keys(enFlat).length) * 100).toFixed(1)}%)`);

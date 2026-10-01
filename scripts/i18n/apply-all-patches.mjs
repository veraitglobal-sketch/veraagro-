#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const DE_PATH = path.join(ROOT, 'mobile/i18n/locales/de.json');
const EN_PATH = path.join(ROOT, 'mobile/i18n/locales/en.json');
const PATCH_DIR = path.join(__dirname, 'patches');
const ALLOWLIST_PATH = path.join(ROOT, 'scripts/i18n-same-as-en.json');

function deepMerge(base, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

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

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

let de = JSON.parse(fs.readFileSync(DE_PATH, 'utf8'));
const files = fs.readdirSync(PATCH_DIR).filter((f) => f.startsWith('mobile-de-') && f.endsWith('.json')).sort();
for (const file of files) {
  const patch = JSON.parse(fs.readFileSync(path.join(PATCH_DIR, file), 'utf8'));
  de = deepMerge(de, patch);
  console.log('Applied', file);
}
fs.writeFileSync(DE_PATH, `${JSON.stringify(de, null, 2)}\n`);

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const allowlist = loadAllowlist();
const enFlat = flatten(en);
const deFlat = flatten(de);
let identical = 0;
let translated = 0;
for (const [k, v] of Object.entries(enFlat)) {
  if (typeof v !== 'string') continue;
  if (deFlat[k] === v) {
    if (!isAllowlisted(k, v, allowlist)) identical++;
  } else if (deFlat[k] !== v) translated++;
}
console.log(`Translated (differ from EN): ${translated}`);
console.log(`Still identical (non-allowlisted): ${identical}/${Object.keys(enFlat).length} (${((identical / Object.keys(enFlat).length) * 100).toFixed(1)}%)`);

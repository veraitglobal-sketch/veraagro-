#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
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

const dePath = path.join(ROOT, 'mobile/i18n/locales/de.json');
const enPath = path.join(ROOT, 'mobile/i18n/locales/en.json');
const flatPath = process.argv[2];
if (!flatPath) {
  console.error('Usage: apply-flat-translations.mjs <flat.json>');
  process.exit(1);
}

const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const flat = JSON.parse(fs.readFileSync(flatPath, 'utf8'));
let applied = 0;
for (const [key, value] of Object.entries(flat)) {
  setByPath(de, key, value);
  applied++;
}
fs.writeFileSync(dePath, `${JSON.stringify(de, null, 2)}\n`);
const enFlat = flatten(en);
const deFlat = flatten(de);
let identical = 0;
for (const [k, v] of Object.entries(enFlat)) {
  if (deFlat[k] === v && typeof v === 'string') identical++;
}
console.log(`Applied ${applied} translations`);
console.log(`Still identical to EN: ${identical}/${Object.keys(enFlat).length} (${((identical / Object.keys(enFlat).length) * 100).toFixed(1)}%)`);

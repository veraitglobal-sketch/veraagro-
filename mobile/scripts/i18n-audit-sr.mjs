#!/usr/bin/env node
/** Report keys in en.json missing from sr.json (mobile). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, p));
    } else {
      out[p] = v;
    }
  }
  return out;
}

const en = flatten(JSON.parse(fs.readFileSync(path.join(root, 'i18n/locales/en.json'), 'utf8')));
const sr = flatten(JSON.parse(fs.readFileSync(path.join(root, 'i18n/locales/sr.json'), 'utf8')));
const missing = Object.keys(en).filter((k) => !(k in sr));

console.log(`en: ${Object.keys(en).length} keys, sr: ${Object.keys(sr).length} keys`);
console.log(`missing in sr.json: ${missing.length}`);
for (const k of missing) {
  console.log(`  ${k} = ${JSON.stringify(en[k])}`);
}
process.exit(missing.length ? 1 : 0);

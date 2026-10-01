#!/usr/bin/env node
/**
 * i18n parity guard — fails on missing keys, placeholder mismatch, or excessive EN copy in non-EN locales.
 * Usage: node scripts/i18n-check.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'];
const ENGLISH_COPY_THRESHOLD = 0.85; // max fraction of keys identical to EN in non-EN (excluding glossary)

const WEB_BUNDLES = ['locales/{lang}.json'];
const MOBILE_BUNDLES = ['i18n/locales/{lang}.json'];
const GLOSSARY = 'shared/i18n/glossary/{lang}.json';

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function placeholders(s) {
  return (s.match(/\{\{[^}]+\}\}/g) || []).sort().join('|');
}

function checkBundle(baseDir, pattern, errors, stats) {
  const enPath = path.join(baseDir, pattern.replace('{lang}', 'en'));
  if (!fs.existsSync(enPath)) return;
  const enFlat = flatten(loadJson(enPath));
  for (const lang of LOCALES) {
    if (lang === 'en') continue;
    const tgtPath = path.join(baseDir, pattern.replace('{lang}', lang));
    if (!fs.existsSync(tgtPath)) {
      errors.push(`MISSING FILE ${tgtPath}`);
      continue;
    }
    const tgtFlat = flatten(loadJson(tgtPath));
    let identical = 0;
    let compared = 0;
    for (const key of Object.keys(enFlat)) {
      if (!(key in tgtFlat)) {
        errors.push(`MISSING KEY [${lang}] ${pattern} → ${key}`);
        continue;
      }
      compared += 1;
      const enPh = placeholders(enFlat[key]);
      const tgtPh = placeholders(tgtFlat[key]);
      if (enPh !== tgtPh) {
        errors.push(`PLACEHOLDER MISMATCH [${lang}] ${key}: en=${enPh || '(none)'} vs ${lang}=${tgtPh || '(none)'}`);
      }
      if (tgtFlat[key] === enFlat[key] && enFlat[key].length > 2) identical += 1;
    }
    if (compared > 0) {
      stats.push({ bundle: `${baseDir}/${pattern}`, lang, identicalRatio: identical / compared });
    }
  }
}

const errors = [];
const stats = [];

for (const pat of WEB_BUNDLES) checkBundle(path.join(ROOT, 'web'), pat, errors, stats);
for (const pat of MOBILE_BUNDLES) checkBundle(path.join(ROOT, 'mobile'), pat, errors, stats);
checkBundle(ROOT, GLOSSARY, errors, stats);

const COPY_CHECK_LANGS = new Set(['sr']);
for (const row of stats) {
  if (!COPY_CHECK_LANGS.has(row.lang)) continue;
  const max = row.bundle.includes('glossary') ? 0.05 : ENGLISH_COPY_THRESHOLD;
  if (row.identicalRatio > max) {
    errors.push(
      `ENGLISH COPY [${row.lang}] ${row.bundle}: ${(row.identicalRatio * 100).toFixed(1)}% identical to EN (max ${max * 100}%)`,
    );
  }
}

if (errors.length) {
  console.error(`i18n-check FAILED (${errors.length} issue(s)):\n`);
  for (const e of errors.slice(0, 50)) console.error(' -', e);
  if (errors.length > 50) console.error(` … and ${errors.length - 50} more`);
  process.exit(1);
}

console.log('i18n-check OK — all keys present, placeholders match, copy thresholds within limits.');
for (const row of stats.filter((r) => r.lang !== 'en')) {
  console.log(`  ${row.lang} ${row.bundle}: ${(row.identicalRatio * 100).toFixed(1)}% identical to EN`);
}

#!/usr/bin/env node
/**
 * i18n parity guard — fails on missing keys, placeholder mismatch, excessive EN copy,
 * or Serbian text in the English base locale.
 * Usage: node scripts/i18n-check.cjs
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const LOCALES = ['en', 'sr', 'de', 'es', 'fr', 'ro', 'bg'];
const ENGLISH_COPY_THRESHOLD = 0.05;
const GLOSSARY_COPY_THRESHOLD = 0.05;
const SR_CHARS = /[čćšžđČĆŠŽĐ]/;

const WEB_BUNDLES = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
  'locales/pitch-deck.{lang}.json',
];
const MOBILE_BUNDLES = [
  'i18n/locales/{lang}.json',
  'i18n/locales/grower-journey.{lang}.json',
  'i18n/locales/grower-season.{lang}.json',
];
const GLOSSARY = 'shared/i18n/glossary/{lang}.json';

const allowlistPath = path.join(__dirname, 'i18n-same-as-en.json');
const allowlist = fs.existsSync(allowlistPath)
  ? JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
  : { keys: [], patterns: [], minLength: 3 };

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
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

function placeholders(s) {
  return (s.match(/\{\{[^}]+\}\}/g) || []).sort().join('|');
}

function isAllowlisted(key, enValue) {
  if (allowlist.keys?.includes(key)) return true;
  if ((enValue?.length ?? 0) < (allowlist.minLength ?? 3)) return true;
  for (const pattern of allowlist.patterns ?? []) {
    try {
      if (new RegExp(pattern, 'i').test(key) || new RegExp(pattern, 'i').test(enValue)) return true;
    } catch {
      if (enValue?.includes(pattern)) return true;
    }
  }
  return false;
}

function checkEnglishBaseSerbian(errors) {
  const enBundles = [
    ...WEB_BUNDLES.map((p) => ({ base: path.join(ROOT, 'web'), pattern: p })),
    ...MOBILE_BUNDLES.map((p) => ({ base: path.join(ROOT, 'mobile'), pattern: p })),
    { base: ROOT, pattern: GLOSSARY },
  ];
  for (const { base, pattern } of enBundles) {
    const enPath = path.join(base, pattern.replace('{lang}', 'en'));
    if (!fs.existsSync(enPath)) continue;
    const enFlat = flatten(loadJson(enPath));
    for (const [key, value] of Object.entries(enFlat)) {
      if (key.startsWith('languagePage.locales.sr')) continue;
      if (SR_CHARS.test(value)) {
        errors.push(`SERBIAN IN EN [en] ${pattern} → ${key}`);
      }
    }
  }
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
      if (
        tgtFlat[key] === enFlat[key] &&
        enFlat[key].length >= (allowlist.minLength ?? 3) &&
        !isAllowlisted(key, enFlat[key])
      ) {
        identical += 1;
      }
    }
    if (compared > 0) {
      stats.push({
        bundle: `${baseDir}/${pattern}`,
        lang,
        identical,
        compared,
        identicalRatio: identical / compared,
      });
    }
  }
}

const errors = [];
const stats = [];

checkEnglishBaseSerbian(errors);

for (const pat of WEB_BUNDLES) checkBundle(path.join(ROOT, 'web'), pat, errors, stats);
for (const pat of MOBILE_BUNDLES) checkBundle(path.join(ROOT, 'mobile'), pat, errors, stats);
checkBundle(ROOT, GLOSSARY, errors, stats);

for (const row of stats) {
  const max = row.bundle.includes('glossary') ? GLOSSARY_COPY_THRESHOLD : ENGLISH_COPY_THRESHOLD;
  if (row.identicalRatio > max) {
    errors.push(
      `ENGLISH COPY [${row.lang}] ${row.bundle}: ${(row.identicalRatio * 100).toFixed(1)}% identical to EN (${row.identical}/${row.compared}, max ${max * 100}%)`,
    );
  }
}

if (errors.length) {
  console.error(`i18n-check FAILED (${errors.length} issue(s)):\n`);
  for (const e of errors.slice(0, 80)) console.error(' -', e);
  if (errors.length > 80) console.error(` … and ${errors.length - 80} more`);
  process.exit(1);
}

console.log('i18n-check OK — all keys present, placeholders match, copy thresholds within limits.');
for (const row of stats.filter((r) => r.lang !== 'en')) {
  console.log(
    `  ${row.lang} ${row.bundle}: ${(row.identicalRatio * 100).toFixed(1)}% identical to EN (${row.identical}/${row.compared})`,
  );
}

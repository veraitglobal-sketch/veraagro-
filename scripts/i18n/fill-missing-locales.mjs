#!/usr/bin/env node
/**
 * Deep-fill missing i18n keys from English base into target locale files.
 * Usage: node scripts/i18n/fill-missing-locales.mjs [--web] [--mobile] [--glossary]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

const TARGETS = ['sr', 'de', 'es', 'fr', 'ro', 'bg'];
const WEB_BUNDLES = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
];
const MOBILE_BUNDLES = [
  'i18n/locales/{lang}.json',
  'i18n/locales/grower-journey.{lang}.json',
  'i18n/locales/grower-season.{lang}.json',
];

function deepFill(base, target) {
  if (base === null || typeof base !== 'object' || Array.isArray(base)) {
    return target === undefined ? base : target;
  }
  const out = { ...(target && typeof target === 'object' && !Array.isArray(target) ? target : {}) };
  for (const key of Object.keys(base)) {
    if (!(key in out)) {
      out[key] = base[key];
    } else if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
      out[key] = deepFill(base[key], out[key]);
    }
  }
  return out;
}

function fillBundle(baseDir, pattern, lang) {
  const enPath = path.join(baseDir, pattern.replace('{lang}', 'en'));
  const tgtPath = path.join(baseDir, pattern.replace('{lang}', lang));
  if (!fs.existsSync(enPath)) return { skipped: true };
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const existing = fs.existsSync(tgtPath) ? JSON.parse(fs.readFileSync(tgtPath, 'utf8')) : {};
  const merged = deepFill(en, existing);
  fs.mkdirSync(path.dirname(tgtPath), { recursive: true });
  fs.writeFileSync(tgtPath, `${JSON.stringify(merged, null, 2)}\n`);
  return { filled: true, path: tgtPath };
}

const args = new Set(process.argv.slice(2));
const doWeb = args.size === 0 || args.has('--web');
const doMobile = args.size === 0 || args.has('--mobile');

let count = 0;
if (doWeb) {
  for (const lang of TARGETS) {
    for (const pat of WEB_BUNDLES) {
      const r = fillBundle(path.join(ROOT, 'web'), pat, lang);
      if (r.filled) count += 1;
    }
  }
}
if (doMobile) {
  for (const lang of TARGETS.filter((l) => l !== 'sr')) {
    for (const pat of MOBILE_BUNDLES) {
      const r = fillBundle(path.join(ROOT, 'mobile'), pat, lang);
      if (r.filled) count += 1;
    }
  }
}
console.log(`fill-missing-locales: updated ${count} bundle(s)`);

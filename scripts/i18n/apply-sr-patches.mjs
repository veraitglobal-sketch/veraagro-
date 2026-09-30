#!/usr/bin/env node
/**
 * Deep-merge scripts/i18n/*-sr-patch.json into locale sr.json files.
 * Removes sr-only keys not present in en.json (except plural _few variants handled below).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
  return target;
}

function pruneExtra(en, sr) {
  for (const key of Object.keys(sr)) {
    if (!(key in en)) {
      delete sr[key];
      continue;
    }
    const ev = en[key];
    const sv = sr[key];
    if (ev && typeof ev === 'object' && !Array.isArray(ev) && sv && typeof sv === 'object' && !Array.isArray(sv)) {
      pruneExtra(ev, sv);
    }
  }
}

function apply(webPatchPath, mobilePatchPath) {
  const webEn = JSON.parse(fs.readFileSync(path.join(root, 'web/locales/en.json'), 'utf8'));
  const webSr = JSON.parse(fs.readFileSync(path.join(root, 'web/locales/sr.json'), 'utf8'));
  const webPatch = JSON.parse(fs.readFileSync(webPatchPath, 'utf8'));
  deepMerge(webSr, webPatch);
  pruneExtra(webEn, webSr);
  fs.writeFileSync(path.join(root, 'web/locales/sr.json'), `${JSON.stringify(webSr, null, 2)}\n`);

  const mobEn = JSON.parse(fs.readFileSync(path.join(root, 'mobile/i18n/locales/en.json'), 'utf8'));
  const mobSr = JSON.parse(fs.readFileSync(path.join(root, 'mobile/i18n/locales/sr.json'), 'utf8'));
  const mobPatch = JSON.parse(fs.readFileSync(mobilePatchPath, 'utf8'));
  deepMerge(mobSr, mobPatch);
  pruneExtra(mobEn, mobSr);
  fs.writeFileSync(path.join(root, 'mobile/i18n/locales/sr.json'), `${JSON.stringify(mobSr, null, 2)}\n`);
}

apply(path.join(__dirname, 'web-sr-patch.json'), path.join(__dirname, 'mobile-sr-patch.json'));
console.log('Applied SR patches to web/locales/sr.json and mobile/i18n/locales/sr.json');

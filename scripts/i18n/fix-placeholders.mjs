#!/usr/bin/env node
/** Restore EN placeholder names in translated locale strings. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['es', 'fr', 'ro', 'bg'];

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

function extractTokens(s, re) {
  return (s.match(re) || []).slice();
}

function restoreTokens(enStr, tgtStr) {
  const phRe = /\{\{[^}]+\}\}/g;
  const tagRe = /<\/?\d+>/g;
  let out = tgtStr;

  for (const re of [phRe, tagRe]) {
    const enTokens = extractTokens(enStr, re);
    const tgtTokens = extractTokens(out, re);
    if (enTokens.length !== tgtTokens.length) continue;
    for (let i = 0; i < enTokens.length; i++) {
      if (enTokens[i] !== tgtTokens[i]) {
        out = out.replace(tgtTokens[i], enTokens[i]);
      }
    }
  }
  return out;
}

function walk(enNode, tgtNode) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walk(v, tgtNode?.[i]));
  }
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walk(v, out[k]);
    }
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  return restoreTokens(enNode, tgtStr);
}

const BUNDLE_PATTERNS = [
  'i18n/locales/{lang}.json',
  'i18n/locales/grower-journey.{lang}.json',
  'i18n/locales/grower-season.{lang}.json',
];

let total = 0;
for (const lang of LANGS) {
  for (const pattern of BUNDLE_PATTERNS) {
    const enPath = path.join(ROOT, 'mobile', pattern.replace('{lang}', 'en'));
    const tgtPath = path.join(ROOT, 'mobile', pattern.replace('{lang}', lang));
    if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) continue;
    const en = loadJson(enPath);
    const tgt = loadJson(tgtPath);
    const fixed = walk(en, tgt);
    saveJson(tgtPath, fixed);
    total += 1;
    console.log(`Fixed placeholders in ${path.basename(tgtPath)}`);
  }
}
console.log(`done: ${total} files`);

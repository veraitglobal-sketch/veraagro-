#!/usr/bin/env node
/** Restore {{placeholder}} and <0> tags in web locale files to match EN exactly. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(__dirname, '../../web');
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['de', 'es', 'fr', 'ro', 'bg'];

const BUNDLE_PATTERNS = [
  'locales/{lang}.json',
  'locales/grower-journey.{lang}.json',
  'locales/suppliers-page.{lang}.json',
  'locales/buyer-retail.{lang}.json',
  'locales/passport-public.{lang}.json',
  'locales/biovera-fresh-page.{lang}.json',
];

function placeholders(s) {
  return (String(s).match(/\{\{[^}]+\}\}/g) || []).sort().join('|');
}

function tags(s) {
  return (String(s).match(/<\/?\d+>/g) || []).sort().join('|');
}

function restoreTokens(enStr, tgtStr) {
  let out = tgtStr;
  for (const re of [/\{\{[^}]+\}\}/g, /<\/?\d+>/g]) {
    const enTokens = enStr.match(re) || [];
    const tgtTokens = out.match(re) || [];
    if (enTokens.length !== tgtTokens.length) continue;
    for (let i = 0; i < enTokens.length; i++) {
      if (enTokens[i] !== tgtTokens[i]) out = out.replace(tgtTokens[i], enTokens[i]);
    }
  }
  return out;
}

function walk(enNode, tgtNode) {
  if (Array.isArray(enNode)) return enNode.map((v, i) => walk(v, tgtNode?.[i]));
  if (enNode && typeof enNode === 'object') {
    const out = tgtNode && typeof tgtNode === 'object' && !Array.isArray(tgtNode) ? { ...tgtNode } : {};
    for (const [k, v] of Object.entries(enNode)) out[k] = walk(v, out[k]);
    return out;
  }
  if (typeof enNode !== 'string') return tgtNode;
  const tgtStr = typeof tgtNode === 'string' ? tgtNode : enNode;
  if (placeholders(enNode) === placeholders(tgtStr) && tags(enNode) === tags(tgtStr)) return tgtStr;
  return restoreTokens(enNode, tgtStr);
}

let total = 0;
for (const lang of LANGS) {
  for (const pattern of BUNDLE_PATTERNS) {
    const enPath = path.join(WEB, pattern.replace('{lang}', 'en'));
    const tgtPath = path.join(WEB, pattern.replace('{lang}', lang));
    if (!fs.existsSync(enPath) || !fs.existsSync(tgtPath)) continue;
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const tgt = JSON.parse(fs.readFileSync(tgtPath, 'utf8'));
    const merged = walk(en, tgt);
    fs.writeFileSync(tgtPath, `${JSON.stringify(merged, null, 2)}\n`);
    total += 1;
    console.log(`fixed ${path.basename(tgtPath)}`);
  }
}
console.log(`done: ${total} files`);

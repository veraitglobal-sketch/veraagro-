#!/usr/bin/env node
/**
 * Restore {{placeholder}} tokens in DE locale files to match EN keys exactly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(__dirname, '../../web');

const BUNDLE_PATTERNS = [
  'locales/de.json',
  'locales/grower-journey.de.json',
  'locales/suppliers-page.de.json',
  'locales/buyer-retail.de.json',
  'locales/passport-public.de.json',
  'locales/biovera-fresh-page.de.json',
];

function placeholders(s) {
  return (String(s).match(/\{\{[^}]+\}\}/g) || []).sort().join('|');
}

function walk(enNode, deNode) {
  if (Array.isArray(enNode)) {
    return enNode.map((v, i) => walk(v, deNode?.[i]));
  }
  if (enNode && typeof enNode === 'object') {
    const out = deNode && typeof deNode === 'object' && !Array.isArray(deNode) ? { ...deNode } : {};
    for (const [k, v] of Object.entries(enNode)) {
      out[k] = walk(v, out[k]);
    }
    return out;
  }
  if (typeof enNode !== 'string') return deNode;
  const deStr = typeof deNode === 'string' ? deNode : enNode;
  const enPh = placeholders(enNode);
  const dePh = placeholders(deStr);
  if (!enPh || enPh === dePh) return deStr;

  const enTokens = enNode.match(/\{\{[^}]+\}\}/g) || [];
  const deTokens = deStr.match(/\{\{[^}]+\}\}/g) || [];
  if (enTokens.length !== deTokens.length) return deStr;

  let fixed = deStr;
  for (let i = 0; i < enTokens.length; i++) {
    fixed = fixed.replace(deTokens[i], enTokens[i]);
  }
  return fixed;
}

let fixedCount = 0;
for (const pattern of BUNDLE_PATTERNS) {
  const enPath = path.join(WEB, pattern.replace('.de.json', '.en.json').replace('/de.json', '/en.json'));
  const dePath = path.join(WEB, pattern);
  if (!fs.existsSync(enPath) || !fs.existsSync(dePath)) continue;
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const de = JSON.parse(fs.readFileSync(dePath, 'utf8'));
  const merged = walk(en, de);

  function countFixes(e, d, p = '') {
    if (Array.isArray(e)) return e.forEach((v, i) => countFixes(v, d?.[i], `${p}.${i}`));
    if (e && typeof e === 'object') {
      for (const [k, v] of Object.entries(e)) countFixes(v, d?.[k], p ? `${p}.${k}` : k);
      return;
    }
    if (typeof e === 'string' && typeof d === 'string' && d !== e) {
      const enPh = placeholders(e);
      const dePh = placeholders(d);
      if (enPh && enPh !== dePh) {
        const enTokens = e.match(/\{\{[^}]+\}\}/g) || [];
        const deTokens = d.match(/\{\{[^}]+\}\}/g) || [];
        if (enTokens.length === deTokens.length) fixedCount++;
      }
    }
  }
  countFixes(en, de);
  fs.writeFileSync(dePath, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`fixed ${path.basename(dePath)}`);
}
console.log(`placeholder fixes: ${fixedCount}`);

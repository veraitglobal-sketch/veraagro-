#!/usr/bin/env node
/**
 * Lightweight guard: flags likely hardcoded UI strings in TSX (not in t()).
 * Allow-list brand names and short technical tokens.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  path.join(ROOT, 'web/app/buyer-portal'),
  path.join(ROOT, 'mobile/features/buyer'),
];
const ALLOW = new Set(['Bio Vera', 'BioVera', 'EUR', 'kg', 'GPS', 'QR', 'OK', 'ID']);

const JSX_TEXT = />\s*([A-Za-z][A-Za-z\s,'—–-]{3,})\s*</g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

const violations = [];
for (const base of TARGETS) {
  for (const file of walk(base)) {
    const src = fs.readFileSync(file, 'utf8');
    if (src.includes('eslint-disable') && src.includes('hardcoded-ui')) continue;
    let m;
    while ((m = JSX_TEXT.exec(src))) {
      const text = m[1].trim();
      if (ALLOW.has(text)) continue;
      if (/^[\d\s./:]+$/.test(text)) continue;
      if (text.includes('{') || text.includes('t(')) continue;
      violations.push(`${path.relative(ROOT, file)}: "${text}"`);
    }
  }
}

if (violations.length) {
  console.warn(`check-hardcoded-ui-strings: ${violations.length} possible hardcoded string(s) (warn only):`);
  for (const v of violations.slice(0, 20)) console.warn(' -', v);
  if (violations.length > 20) console.warn(` … and ${violations.length - 20} more`);
}
console.log('check-hardcoded-ui-strings OK (advisory)');

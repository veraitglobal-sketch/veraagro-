#!/usr/bin/env node
/**
 * Translates Bio Vera locale JSON files from English sources → German (de JSON files).
 * Uses npm `translate` (default Google engine, no API key; requires outbound network).
 *
 * Preserves i18next `{{interpolation}}` tokens.
 *
 *   cd web && node scripts/translate-en-to-de.mjs
 *
 * Env:
 *   TRANSLATE_DELAY_MS   default 120
 *   TRANSLATE_RETRIES    default 3
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import translate from 'translate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

translate.from = 'en';
translate.to = 'de';
translate.engine = 'google';

const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS ?? 120);
const MAX_RETRIES = Number(process.env.TRANSLATE_RETRIES ?? 3);

/** Replace {{name}} placeholders with deterministic tokens translators usually keep */
function maskInterpolation(s, store) {
  let idx = 0;
  return s.replace(/\{\{[^}]+\}\}/g, (m) => {
    const token = `__BRVPH${idx++}__`;
    store[token] = m;
    return token;
  });
}

function restoreInterpolation(s, store) {
  let out = s;
  const keys = Object.keys(store).sort((a, b) => b.length - a.length);
  for (const k of keys) out = out.split(k).join(store[k]);
  return out;
}

const stringCache = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateLeaf(rawOriginal) {
  if (typeof rawOriginal !== 'string') return rawOriginal;

  const raw = rawOriginal;
  const trimmed = raw.trim();
  if (!trimmed) return rawOriginal;

  if (stringCache.has(rawOriginal)) return stringCache.get(rawOriginal);

  const store = {};
  const masked = maskInterpolation(raw, store);

  let translated = masked;
  let ok = false;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await sleep(DELAY_MS);
      translated = await translate(masked, { from: 'en', to: 'de' });
      ok = true;
      break;
    } catch (e) {
      const backoff = DELAY_MS * (attempt + 1) * 4;
      console.warn('[translate]', String(e?.message || e), `- waiting ${backoff}ms`);
      await sleep(backoff);
    }
  }

  if (!ok) {
    console.warn('[translate] giving up snippet:', masked.slice(0, 140));
    stringCache.set(rawOriginal, rawOriginal);
    return rawOriginal;
  }

  let restored = restoreInterpolation(translated, store);

  /** If interpolations disappeared, revert to english for safety */
  if (/\{\{/.test(rawOriginal) && !restored.includes('{{')) {
    restored = rawOriginal;
  }

  stringCache.set(rawOriginal, restored);
  return restored;
}

async function walk(node) {
  if (typeof node === 'string') return translateLeaf(node);
  if (Array.isArray(node)) return Promise.all(node.map((x) => walk(x)));
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node)) {
      out[k] = await walk(node[k]);
    }
    return out;
  }
  return node;
}

async function runOne(relSrc, relOut, label) {
  const srcPath = path.join(ROOT, relSrc);
  const raw = await fs.readFile(srcPath, 'utf8');
  const data = JSON.parse(raw);
  console.log(`\n── ${label}`);
  console.log(`   ${relSrc} → ${relOut}`);
  const translated = await walk(data);
  const outPath = path.join(ROOT, relOut);
  await fs.writeFile(outPath, `${JSON.stringify(translated, null, 2)}\n`, 'utf8');
  console.log(`   OK (${relOut})`);
}

async function main() {
  console.log(`EN→DE translate | delay ${DELAY_MS}ms | retries ${MAX_RETRIES}`);
  const jobs = [
    ['locales/en.json', 'locales/de.json', 'main'],
    ['locales/grower-journey.en.json', 'locales/grower-journey.de.json', 'grower journey'],
    ['locales/suppliers-page.en.json', 'locales/suppliers-page.de.json', 'suppliers'],
    ['locales/buyer-retail.en.json', 'locales/buyer-retail.de.json', 'buyer retail'],
    ['locales/passport-public.en.json', 'locales/passport-public.de.json', 'passport'],
  ];
  for (const [src, dst, lbl] of jobs) {
    await runOne(src, dst, lbl);
  }
  console.log('\nDone. Machine translation — expect manual polish for legal/UX strings.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Translates Bio Vera locale bundles: English sources → target locale JSON (de | ro | …).
 *
 *   cd web && TRANSLATE_TO=ro node scripts/translate-en-locale.mjs
 *   cd web && TRANSLATE_TO=de node scripts/translate-en-locale.mjs
 *
 * After MT, reapplies invariant UI strings (locale short codes EN/SR/DE/RO, Apple, Bio Vera, nav.dashboard→Dashboard).
 *
 * Requires network (npm package `translate`, Google engine default).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import translate from 'translate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

/** BCP-ish target tag for npm `translate`: de, ro, … */
const TARGET = (process.env.TRANSLATE_TO || 'de').toLowerCase();
if (!TARGET) {
  console.error('Set TRANSLATE_TO (e.g. ro or de)');
  process.exit(1);
}

translate.from = 'en';
translate.to = TARGET;
translate.engine = 'google';

const DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS ?? 120);
const MAX_RETRIES = Number(process.env.TRANSLATE_RETRIES ?? 3);

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

/** Stop Google from mangling abbreviations seen on DE migration */
function applyInvariantPatches(data) {
  if (!data || typeof data !== 'object') return data;
  if (data.locale && typeof data.locale === 'object') {
    data.locale.enShort = 'EN';
    data.locale.srShort = 'SR';
    data.locale.deShort = 'DE';
    data.locale.roShort = 'RO';
  }
  if (data.brand && typeof data.brand === 'object') {
    data.brand.name = 'Bio Vera';
  }
  if (data.footer && typeof data.footer === 'object') {
    data.footer.appApple = 'Apple';
  }
  if (data.nav && typeof data.nav === 'object' && data.nav.dashboard !== undefined) {
    data.nav.dashboard = 'Dashboard';
  }
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
      translated = await translate(masked, { from: 'en', to: TARGET });
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
  let translated = await walk(data);
  applyInvariantPatches(translated);
  const outPath = path.join(ROOT, relOut);
  await fs.writeFile(outPath, `${JSON.stringify(translated, null, 2)}\n`, 'utf8');
  console.log(`   OK (${relOut})`);
}

async function main() {
  console.log(`EN→${TARGET} translate | delay ${DELAY_MS}ms | retries ${MAX_RETRIES}`);
  const ext = `.${TARGET}.json`;
  /** Main bundle */
  const mainOut =
    TARGET === 'de'
      ? 'locales/de.json'
      : TARGET === 'ro'
        ? 'locales/ro.json'
        : `locales/${TARGET}.json`;
  const jobs = [
    ['locales/en.json', mainOut, 'main'],
    [`locales/grower-journey.en.json`, `locales/grower-journey${ext}`, 'grower journey'],
    [`locales/suppliers-page.en.json`, `locales/suppliers-page${ext}`, 'suppliers'],
    [`locales/buyer-retail.en.json`, `locales/buyer-retail${ext}`, 'buyer retail'],
    [`locales/passport-public.en.json`, `locales/passport-public${ext}`, 'passport'],
  ];
  for (const [src, dst, lbl] of jobs) {
    await runOne(src, dst, lbl);
  }
  console.log(`\nDone (EN→${TARGET}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

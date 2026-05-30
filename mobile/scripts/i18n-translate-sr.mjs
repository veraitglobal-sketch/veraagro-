#!/usr/bin/env node
/**
 * Generates or extends `i18n/locales/sr.json` from `en.json` using OpenAI.
 * Preserves {{placeholders}} and _plural keys.
 *
 * Usage (from mobile/):
 *   OPENAI_API_KEY=sk-... node scripts/i18n-translate-sr.mjs
 *
 * Optional: CHUNK=40 (default) strings per API call, MODEL=gpt-4o-mini
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const enPath = path.join(root, 'i18n/locales/en.json');
const outPath = path.join(root, 'i18n/locales/sr.json');

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, p));
    } else {
      out[p] = v;
    }
  }
  return out;
}

function unflatten(flat) {
  const rootObj = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let cur = rootObj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        cur[part] = value;
      } else {
        cur[part] = cur[part] ?? {};
        cur = cur[part];
      }
    }
  }
  return rootObj;
}

async function translateBatch(strings, targetLang = 'Serbian (Latin script, natural for mobile apps)') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Set OPENAI_API_KEY to translate.');
    process.exit(1);
  }
  const model = process.env.MODEL || 'gpt-4o-mini';
  const input = JSON.stringify(strings, null, 0);
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You translate mobile app UI strings to ${targetLang}. Return ONLY valid JSON object with the same keys as input. Keep {{name}} and {{count}} placeholders exactly. Keep _plural suffix keys as-is in key names. Do not add explanations.`,
        },
        { role: 'user', content: input },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI ${res.status}: ${t}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty OpenAI response');
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

async function main() {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const flat = flatten(en);
  const keys = Object.keys(flat).filter((k) => typeof flat[k] === 'string');
  const chunk = Math.max(5, parseInt(process.env.CHUNK || '40', 10));
  const merged = {};

  for (let i = 0; i < keys.length; i += chunk) {
    const slice = keys.slice(i, i + chunk);
    const batch = Object.fromEntries(slice.map((k) => [k, flat[k]]));
    process.stderr.write(`Translating ${i + 1}-${Math.min(i + chunk, keys.length)} / ${keys.length}…\n`);
    const translated = await translateBatch(batch);
    for (const k of slice) {
      if (translated[k] != null && typeof translated[k] === 'string') {
        merged[k] = translated[k];
      } else {
        merged[k] = flat[k];
      }
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const nested = unflatten(merged);
  fs.writeFileSync(outPath, JSON.stringify(nested, null, 2) + '\n', 'utf8');
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

#!/usr/bin/env node
/** Re-translate strings that still contain English fragments. */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { protect, restore } from './rule-engine.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['es', 'fr', 'ro', 'bg'];

const EN_FRAG = /\b(the|is|are|was|were|and|or|for|with|from|this|that|your|you|has|have|will|can|not|been|when|where|which|their|they|would|should|could|please|check|enter|select|open|view|add|remove|save|loading|failed|success|pending|complete|available|currently|needed|blocked|preserve|history|follow|status|reviews|assigns|collect|goods|operations|documentation|unlocks|once|clear|directions|entrance|place|driver|request|share|details|only|finish|first|allow|tap|retry|waiting|three|steps|goods|reserved|valid|manual|general|total|error|material|partner|code|wallet|start|online|offline|live|details|mission|transport|notifications|messages|finances|instructions|points|fruits|grains|fridge|audit|guide|insight)\b/gi;

function flatten(obj, p = '') {
  const o = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(o, flatten(v, key));
    else o[key] = String(v);
  }
  return o;
}

function isHybrid(enVal, tgtVal) {
  if (tgtVal === enVal || tgtVal.length < 8) return false;
  const matches = tgtVal.match(EN_FRAG) || [];
  return matches.length >= 2;
}

function setByPath(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

async function curlTranslate(text, lang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  const { stdout } = await execFileAsync('curl', ['-s', '-A', 'Mozilla/5.0', url], { maxBuffer: 10 * 1024 * 1024 });
  if (stdout.startsWith('<')) throw new Error('blocked');
  return JSON.parse(stdout)[0].map((p) => p[0]).join('');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

for (const lang of LANGS) {
  const enPath = path.join(ROOT, 'mobile/i18n/locales/en.json');
  const tgtPath = path.join(ROOT, `mobile/i18n/locales/${lang}.json`);
  const en = flatten(JSON.parse(fs.readFileSync(enPath, 'utf8')));
  const tgt = JSON.parse(fs.readFileSync(tgtPath, 'utf8'));
  const tgtFlat = flatten(tgt);

  const valueToKeys = new Map();
  for (const [key, enVal] of Object.entries(en)) {
    const tv = tgtFlat[key];
    if (!tv || !isHybrid(enVal, tv)) continue;
    if (!valueToKeys.has(enVal)) valueToKeys.set(enVal, []);
    valueToKeys.get(enVal).push(key);
  }

  const unique = [...valueToKeys.keys()];
  console.log(`[${lang}] fixing ${unique.length} hybrid strings…`);
  let done = 0;
  for (const enVal of unique) {
    try {
      const { out, tokens } = protect(enVal);
      const raw = await curlTranslate(out, lang);
      const translated = restore(raw, tokens);
      for (const key of valueToKeys.get(enVal)) setByPath(tgt, key, translated);
    } catch {
      /* keep existing */
    }
    done += 1;
    if (done % 30 === 0) {
      fs.writeFileSync(tgtPath, `${JSON.stringify(tgt, null, 2)}\n`);
      console.log(`  ${done}/${unique.length}`);
    }
    await sleep(150);
  }
  fs.writeFileSync(tgtPath, `${JSON.stringify(tgt, null, 2)}\n`);
  console.log(`[${lang}] done`);
}

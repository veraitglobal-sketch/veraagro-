#!/usr/bin/env node
/**
 * Deep-merge a flat or nested patch JSON into a locale file.
 * Usage: node scripts/i18n/apply-locale-patch.mjs <target.json> <patch.json>
 */
import fs from 'node:fs';
import path from 'node:path';

const [targetPath, patchPath] = process.argv.slice(2);
if (!targetPath || !patchPath) {
  console.error('Usage: apply-locale-patch.mjs <target.json> <patch.json>');
  process.exit(1);
}

function deepMerge(base, patch) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return patch;
  }
  const out = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const merged = deepMerge(target, patch);
fs.writeFileSync(targetPath, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Merged ${patchPath} → ${targetPath}`);

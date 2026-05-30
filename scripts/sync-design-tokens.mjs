#!/usr/bin/env node
/**
 * Sync web CSS variables from shared/design/tokens.ts (single source of truth).
 *
 * Usage:
 *   node scripts/sync-design-tokens.mjs          # write web/app/globals.css
 *   node scripts/sync-design-tokens.mjs --check  # exit 1 if drift detected
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TOKENS_TS = path.join(ROOT, 'shared/design/tokens.ts');
const GLOBALS_CSS = path.join(ROOT, 'web/app/globals.css');

const CHECK_ONLY = process.argv.includes('--check');

/** Map CSS custom property → vera.color key in tokens.ts */
const CSS_TOKEN_MAP = {
  '--foreground': 'foreground',
  '--color-vera': 'primary',
  '--color-vera-hover': 'primaryHover',
  '--premium-page': 'canvas',
  '--premium-surface': 'surface',
  '--premium-border': 'border',
  '--premium-muted': 'muted',
};

function readTokenValues(tsSource) {
  const colorBlock = tsSource.match(/color:\s*\{([\s\S]*?)\n\s*\},/);
  if (!colorBlock) throw new Error('Could not parse color block in tokens.ts');

  const block = colorBlock[1];
  const values = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(\w+):\s*'([^']+)'/);
    if (m) values[m[1]] = m[2];
  }
  return values;
}

function patchGlobalsCss(css, tokenValues) {
  let out = css;
  for (const [cssVar, tokenKey] of Object.entries(CSS_TOKEN_MAP)) {
    const value = tokenValues[tokenKey];
    if (!value) {
      throw new Error(`Missing token key "${tokenKey}" for ${cssVar}`);
    }
    const re = new RegExp(`(${cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*)[^;\\n]+`);
    if (!re.test(out)) {
      throw new Error(`CSS variable ${cssVar} not found in globals.css`);
    }
    out = out.replace(re, `$1${value}`);
  }
  return out;
}

function main() {
  const tsSource = fs.readFileSync(TOKENS_TS, 'utf8');
  const cssSource = fs.readFileSync(GLOBALS_CSS, 'utf8');
  const tokenValues = readTokenValues(tsSource);
  const nextCss = patchGlobalsCss(cssSource, tokenValues);

  if (CHECK_ONLY) {
    if (nextCss !== cssSource) {
      console.error('Design token drift: web/app/globals.css is out of sync with shared/design/tokens.ts');
      console.error('Run: node scripts/sync-design-tokens.mjs');
      process.exit(1);
    }
    console.log('Design tokens in sync.');
    return;
  }

  if (nextCss === cssSource) {
    console.log('globals.css already matches shared/design/tokens.ts');
    return;
  }

  fs.writeFileSync(GLOBALS_CSS, nextCss, 'utf8');
  console.log('Updated web/app/globals.css from shared/design/tokens.ts');
}

main();

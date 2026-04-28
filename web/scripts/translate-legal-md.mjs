#!/usr/bin/env node
/**
 * One-off helper: translates English legal Markdown to Serbian (chunks).
 * Run from web/: node scripts/translate-legal-md.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import translate from 'translate';

translate.engine = 'google';

const CHUNK = 4500;

function splitChunks(text) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + CHUNK, text.length);
    if (end < text.length) {
      const nl = text.lastIndexOf('\n\n', end);
      if (nl > i + 500) end = nl;
    }
    chunks.push(text.slice(i, end).trim());
    i = end;
  }
  return chunks.filter(Boolean);
}

async function translateFile(rel) {
  const root = path.join(process.cwd());
  const input = await fs.readFile(path.join(root, 'content/legal', `${rel}.en.md`), 'utf8');
  const parts = splitChunks(input);
  const outParts = [];
  let n = 0;
  for (const part of parts) {
    process.stderr.write(`${rel}: chunk ${++n}/${parts.length}… `);
    const tr = await translate(part, 'sr');
    outParts.push(tr);
    process.stderr.write('ok\n');
    await new Promise((r) => setTimeout(r, 400));
  }
  await fs.writeFile(path.join(root, 'content/legal', `${rel}.sr.md`), outParts.join('\n\n'));
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['privacy', 'cookies', 'terms'];
for (const f of files) {
  await translateFile(f);
  console.error(`Saved ${f}.sr.md`);
}

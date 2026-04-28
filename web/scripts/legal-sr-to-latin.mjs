#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { cyrilicToLatin } = require('serbian-script-converter');

const ROOT = path.join(process.cwd(), 'content', 'legal');

function convertLine(line) {
  return cyrilicToLatin(line);
}

async function run(name) {
  const p = path.join(ROOT, `${name}.sr.md`);
  const raw = await fs.readFile(p, 'utf8');
  const lines = raw.split('\n');
  const out = lines.map((line) => (line.trim() === '' ? line : convertLine(line)));
  await fs.writeFile(p, out.join('\n'));
  console.error(`Latinized ${name}.sr.md`);
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : ['privacy', 'cookies', 'terms'];
for (const f of files) {
  await run(f);
}

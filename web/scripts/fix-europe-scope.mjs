#!/usr/bin/env node
/** Replace worldwide/global grower scope with Europe-wide wording across web marketing files. */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const REPLACEMENTS = [
  // English
  [/programme open to producers worldwide/gi, 'programme open to producers throughout Europe'],
  [/open to producers worldwide/gi, 'open to producers throughout Europe'],
  [/Grower programme open to producers worldwide/gi, 'Grower programme open to producers throughout Europe'],
  [/contract growers worldwide/gi, 'contract growers throughout Europe'],
  [/growers worldwide/gi, 'growers throughout Europe'],
  [/producers worldwide/gi, 'producers throughout Europe'],
  [/Growers worldwide/gi, 'Growers throughout Europe'],
  [/Producers worldwide/gi, 'Producers throughout Europe'],
  [/suppliers worldwide/gi, 'suppliers across Europe'],
  [/partners worldwide/gi, 'partners throughout Europe'],
  [/contracted growers worldwide/gi, 'contracted growers throughout Europe'],
  [/Worldwide programme eligibility/gi, 'Europe-wide programme eligibility'],
  [/Growers are worldwide/gi, 'Growers are Europe-wide'],
  [/Remote \(EU \/ Worldwide\)/g, 'Remote (EU / Europe-wide)'],
  [/Willingness to travel to farms and partners worldwide/g, 'Willingness to travel to farms and partners throughout Europe'],
  [/transforming agriculture worldwide/gi, 'transforming agriculture across Europe'],
  [/transforming agriculture in the world/gi, 'transforming agriculture across Europe'],
  [/transforming agriculture in the world/gi, 'transforming agriculture across Europe'],
  [/throughout the world/gi, 'throughout Europe'],
  // Serbian
  [/širom sveta/gi, 'širom Evrope'],
  [/Širom sveta/g, 'Širom Evrope'],
  // German
  [/Produzenten weltweit offen/gi, 'Produzenten in ganz Europa offen'],
  [/Erzeuger weltweit/gi, 'Erzeuger in ganz Europa'],
  [/weltweit/gi, 'in ganz Europa'],
  [/Weltweit/g, 'Europa-weit'],
  [/Remote \(EU \/ Weltweit\)/g, 'Remote (EU / Europa-weit)'],
  [/Partnern weltweit/gi, 'Partnern in ganz Europa'],
  // French
  [/producteurs du monde entier/gi, 'producteurs à travers l\'Europe'],
  [/dans le monde entier/gi, 'à travers l\'Europe'],
  [/dans le monde/gi, 'en Europe'],
  [/monde entier/gi, 'Europe'],
  // Spanish
  [/en todo el mundo/gi, 'en toda Europa'],
  [/todo el mundo/gi, 'toda Europa'],
  // Bulgarian
  [/по света/gi, 'в цяла Европа'],
  [/По света/g, 'В цяла Европа'],
  // Romanian
  [/în întreaga lume/gi, 'în toată Europa'],
  [/din întreaga lume/gi, 'din toată Europa'],
  [/În toată lumea/gi, 'în toată Europa'],
  [/buyers worldwide/gi, 'buyers across Europe'],
  [/kupce širom sveta/gi, 'kupce širom Evrope'],
];

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'fixtures/golden']);
const EXT = new Set(['.json', '.txt', '.md', '.ts', '.tsx']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(extname(name))) out.push(p);
  }
  return out;
}

let filesChanged = 0;
let totalReplacements = 0;

for (const file of walk(root)) {
  if (file.includes('/content/investor-de/')) continue;
  if (file.includes('/content/legal/terms')) continue;
  let text = readFileSync(file, 'utf8');
  let changed = false;
  for (const [re, rep] of REPLACEMENTS) {
    const next = text.replace(re, rep);
    if (next !== text) {
      const count = (text.match(re) || []).length;
      totalReplacements += count;
      text = next;
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, text, 'utf8');
    filesChanged += 1;
    console.log('updated', file.replace(root + '/', ''));
  }
}

console.log(`\nDone: ${filesChanged} files, ~${totalReplacements} replacements.`);

#!/usr/bin/env node
/**
 * Mobile UX audit — counts App Store risk patterns in mobile/.
 * Run: node mobile/scripts/mobile-ux-audit.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.expo' || name === 'ios' || name === 'android') continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const files = walk(ROOT);

const findings = {
  buttonsNoA11y: [],
  listsNoEmpty: [],
  hardcodedLocale: [],
  formsNoKav: [],
  asyncNoTryCatch: [],
  magicNumbers: [],
  alertHardcodedEn: [],
  consoleLog: [],
  todoPlaceholder: [],
};

const HARDCODED_LOCALE = /['"]en-US['"]|['"]en-GB['"]|toLocaleString\(\)|toLocaleDateString\(\)|toLocaleTimeString\(\)/;
const CONSOLE_LOG = /\bconsole\.log\s*\(/;
const TODO_PH = /\b(TODO|FIXME|PLACEHOLDER)\b/i;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  if (CONSOLE_LOG.test(src) && !rel.includes('mobile-ux-audit')) {
    findings.consoleLog.push(rel);
  }
  if (TODO_PH.test(src) && !rel.includes('placeholder')) {
    // skip i18n placeholder keys in JSON
    if (!/locales\//.test(rel)) findings.todoPlaceholder.push(rel);
  }
  if (HARDCODED_LOCALE.test(src)) {
    findings.hardcodedLocale.push(rel);
  }

  // Alert with literal English title (not t('...'))
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const alertMatch = line.match(/Alert\.alert\s*\(\s*['"]([^'"]+)['"]/);
    if (alertMatch && !/^(error|info|ok|warning)$/i.test(alertMatch[1]) && alertMatch[1].length > 2) {
      if (!line.includes("t('") && !line.includes('t("')) {
        findings.alertHardcodedEn.push(`${rel}:${i + 1}`);
      }
    }
  }

  // TouchableOpacity / Pressable without accessibilityLabel (heuristic: icon-only row)
  if (/TouchableOpacity|Pressable/.test(src)) {
    const blocks = src.split(/<(TouchableOpacity|Pressable)[^>]*>/g);
    // simpler: lines with TouchableOpacity that lack accessibilityLabel in next 5 lines
    for (let i = 0; i < lines.length; i++) {
      if (!/<TouchableOpacity|<Pressable/.test(lines[i])) continue;
      const window = lines.slice(i, i + 8).join('\n');
      if (window.includes('accessibilityLabel')) continue;
      if (window.includes('<Text') || window.includes('title=')) continue;
      if (/ArrowLeft|X\s*size|Trash2|Chevron|Plus\s*size|Camera|Scan/.test(window)) {
        findings.buttonsNoA11y.push(`${rel}:${i + 1}`);
      }
    }
  }

  // FlatList without ListEmptyComponent
  if (/FlatList|SectionList/.test(src) && !/ListEmptyComponent/.test(src)) {
    findings.listsNoEmpty.push(rel);
  }

  // Form screens: ScrollView + TextInput but no KeyboardAvoidingView / FormKeyboardWrap
  if (/TextInput/.test(src) && /ScrollView/.test(src)) {
    if (!/KeyboardAvoidingView|FormKeyboardWrap/.test(src)) {
      findings.formsNoKav.push(rel);
    }
  }

  // async function or => async without try in same function block (rough)
  const asyncFns = [...src.matchAll(/(?:async\s+\w+\s*\(|=>\s*async\s*\()/g)];
  for (const m of asyncFns) {
    const start = m.index ?? 0;
    const chunk = src.slice(start, start + 600);
    if (!/try\s*\{/.test(chunk) && /await\s/.test(chunk)) {
      findings.asyncNoTryCatch.push(`${rel}@${start}`);
    }
  }
}

function report(title, arr) {
  console.log(`\n${arr.length}x  ${title}`);
  for (const x of arr.slice(0, 60)) console.log(`  - ${x}`);
  if (arr.length > 60) console.log(`  … +${arr.length - 60} more`);
}

console.log('BioVera mobile UX audit');
report('Buttoni bez accessibilityLabel (heuristic)', findings.buttonsNoA11y);
report('Liste bez empty state (FlatList)', findings.listsNoEmpty);
report("Date/locale hardcoded ili bare toLocale*", findings.hardcodedLocale);
report('Forme bez KeyboardAvoidingView', findings.formsNoKav);
report('Async bez try/catch (heuristic)', findings.asyncNoTryCatch);
report('Alert.alert hardcoded engleski', findings.alertHardcodedEn);
report('console.log', findings.consoleLog);
report('TODO/PLACEHOLDER', findings.todoPlaceholder);

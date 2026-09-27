import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const generated = /(^|\/)(node_modules|\.next|coverage|test-results|__pycache__)(\/|$)|(^|\/)\.DS_Store$|\.tsbuildinfo$|\.pyc$/;
const problems = tracked.filter((file) => generated.test(file)).map((file) => `Generated file tracked by Git: ${file}`);

// Check the maintained entry points. Historical notes are not an executable spec.
for (const file of ['README.md', 'docs/README.md', 'docs/development/GETTING_STARTED.md', 'docs/archive/legacy-root/INDEX.md']) {
  const absolute = resolve(root, file);
  const source = readFileSync(absolute, 'utf8');
  for (const [, destination] of source.matchAll(/\]\(([^\s)]+)\)/g)) {
    if (/^(?:[a-z]+:|#)/i.test(destination)) continue;
    const target = decodeURIComponent(destination.split('#')[0]);
    if (!existsSync(resolve(dirname(absolute), target))) problems.push(`Broken link in ${file}: ${destination}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Repository hygiene OK: no tracked dependency/cache files; documentation entry links resolve.');
}

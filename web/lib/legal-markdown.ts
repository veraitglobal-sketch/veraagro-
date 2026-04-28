import fs from 'node:fs/promises';
import path from 'node:path';

export type LegalSlug = 'privacy' | 'cookies' | 'terms';

export async function loadLegalMarkdown(slug: LegalSlug, locale: string): Promise<string> {
  const lang = locale === 'sr' || locale.startsWith('sr') ? 'sr' : 'en';
  const filePath = path.join(process.cwd(), 'content', 'legal', `${slug}.${lang}.md`);
  return fs.readFile(filePath, 'utf8');
}

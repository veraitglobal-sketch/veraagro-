import fs from 'node:fs/promises';
import path from 'node:path';

export type LegalSlug = 'privacy' | 'cookies' | 'terms';

const legalDir = () => path.join(process.cwd(), 'content', 'legal');

async function readMarkdownFile(fileName: string): Promise<string | null> {
  const filePath = path.join(legalDir(), fileName);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** Loads localized legal Markdown; Serbian and German fall back to English if a *.de.md file is absent. */
export async function loadLegalMarkdown(slug: LegalSlug, locale: string): Promise<string> {
  const lc = locale.toLowerCase();
  const isSr = lc === 'sr' || lc.startsWith('sr');
  const isDe = lc === 'de' || lc.startsWith('de');
  const isRo = lc === 'ro' || lc.startsWith('ro-');
  const isBg = lc === 'bg' || lc.startsWith('bg-');

  if (isSr) {
    const srMd = await readMarkdownFile(`${slug}.sr.md`);
    if (srMd !== null) return srMd;
  } else if (isDe) {
    const deMd = await readMarkdownFile(`${slug}.de.md`);
    if (deMd !== null) return deMd;
  } else if (isRo) {
    const roMd = await readMarkdownFile(`${slug}.ro.md`);
    if (roMd !== null) return roMd;
  } else if (isBg) {
    const bgMd = await readMarkdownFile(`${slug}.bg.md`);
    if (bgMd !== null) return bgMd;
  }

  const enMd = await readMarkdownFile(`${slug}.en.md`);
  if (enMd !== null) return enMd;

  throw new Error(`Missing legal markdown for ${slug}`);
}

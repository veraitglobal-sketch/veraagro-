import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import type { SiteLocale } from '@/i18n/config';
import { MARKETING_LOCALES } from '@/lib/marketing-locales';
import { isSiteLocale } from '@/lib/i18n-routing';

export const revalidate = 86400;

function llmsBody(locale: SiteLocale): string {
  const file = join(process.cwd(), 'public', 'llms', `llms.${locale}.txt`);
  return readFileSync(file, 'utf8');
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ locale: string }> },
) {
  const { locale: loc } = await ctx.params;
  if (!isSiteLocale(loc) || !MARKETING_LOCALES.includes(loc)) {
    notFound();
  }
  const body = llmsBody(loc);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

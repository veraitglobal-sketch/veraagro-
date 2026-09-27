import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import Protocol360PublicPage from '@/components/marketing/Protocol360PublicPage';
import { JsonLd } from '@/components/JsonLd';
import { buildWebPageJsonLd } from '@/lib/schema/marketing-jsonld';
import { getLocaleBundle } from '@/lib/locale-bundles';

export default async function Protocol360Page({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const p = getLocaleBundle(locale).protocol360Page as { threeTierSystem?: string };

  return (
    <>
      <JsonLd
        data={buildWebPageJsonLd(
          locale,
          'protocol-360',
          'Protocol 360 — Quality & Traceability',
          p.threeTierSystem ??
            'Three-tier quality control from field audit through packaging to cold-chain transport.',
        )}
      />
      <Protocol360PublicPage locale={locale} />
    </>
  );
}

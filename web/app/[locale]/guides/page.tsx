import Link from 'next/link';
import type { Metadata } from 'next';
import type { SiteLocale } from '@/i18n/config';
import { isSiteLocale } from '@/lib/i18n-routing';
import { generateLocaleMetadata } from '@/lib/seo-metadata';
import { getGuide, publishedGuideSlugs } from '@/lib/guides/registry';
import { MarketingBreadcrumbJsonLd } from '@/components/marketing/MarketingBreadcrumbJsonLd';
import Footer from '@/components/Footer';

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  return generateLocaleMetadata({
    locale,
    title: 'Guides',
    description:
      'Institutional guides on traceability, GlobalG.A.P., cold-chain custody, and how Bio Vera operates as a vertically integrated agrifood programme — not a marketplace.',
    segment: 'guides',
  });
}

export default async function GuidesIndexPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : 'en';
  const prefix = `/${locale}`;
  const slugs = publishedGuideSlugs(locale);

  return (
    <>
      <MarketingBreadcrumbJsonLd locale={locale} items={[{ name: 'Guides', segment: 'guides' }]} />
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
          <h1 className="text-4xl font-light text-gray-900 mb-4">Guides</h1>
          <p className="text-lg text-gray-600 font-light leading-relaxed mb-10">
            Traceability, quality assurance, settlement, and programme operations — written for buyers,
            growers, and logistics partners who need citeable institutional prose, not marketing slogans.
          </p>
          <ul className="space-y-4">
            {slugs.map((slug) => {
              const guide = getGuide(locale, slug);
              if (!guide) return null;
              return (
                <li key={slug}>
                  <Link
                    href={`${prefix}/guides/${slug}`}
                    className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-[#2D5A27]/40 transition-colors"
                  >
                    <span className="text-xs uppercase tracking-wide text-gray-500">{guide.eyebrow}</span>
                    <span className="mt-1 block text-lg font-medium text-gray-900">{guide.title}</span>
                    <span className="mt-2 block text-sm text-gray-600 font-light leading-relaxed">
                      {guide.metaDescription}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </main>
        <Footer />
      </div>
    </>
  );
}

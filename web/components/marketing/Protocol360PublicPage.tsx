import Link from 'next/link';
import type { SiteLocale } from '@/i18n/config';
import { ENTITY_ONE_LINER_EN, ENTITY_ONE_LINER_SR } from '@/lib/entity-copy';
import { getLocaleBundle } from '@/lib/locale-bundles';
import Footer from '@/components/Footer';

type LevelKey = 'level1' | 'level2' | 'level3';

const LEVEL_KEYS: LevelKey[] = ['level1', 'level2', 'level3'];

type Protocol360Bundle = {
  threeTierSystem: string;
  standardsBeyond: string;
  levels: Record<
    LevelKey,
    {
      name: string;
      location: string;
      checks: Record<string, string>;
    }
  >;
};

export default function Protocol360PublicPage({ locale }: Readonly<{ locale: SiteLocale }>) {
  const b = getLocaleBundle(locale).protocol360Page as Protocol360Bundle;
  const entity = locale === 'sr' ? ENTITY_ONE_LINER_SR : ENTITY_ONE_LINER_EN;
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <h1 className="text-4xl font-light text-gray-900 mb-6">Protocol 360</h1>
        <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">{entity}</p>
        <p className="text-base text-gray-600 font-light leading-relaxed mb-10">
          {b.threeTierSystem}. {b.standardsBeyond}. Protocol 360 is Bio Vera&apos;s operating quality
          discipline — field evidence, packing verification, and cold-chain custody recorded on the
          same batch dossier buyers and auditors can replay. We are not a marketplace that merely
          connects strangers; we run the programme and stand behind the QA narrative before release.
        </p>

        <div className="space-y-10">
          {LEVEL_KEYS.map((key, index) => {
            const level = b.levels[key];
            if (!level) return null;
            const checks = Object.values(level.checks).join('; ');
            return (
              <article key={key} className="border-b border-gray-200 pb-10 last:border-b-0">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  {locale === 'sr' ? 'Nivo' : 'Tier'} {index + 1} · {level.location}
                </p>
                <h2 className="text-xl font-medium text-gray-900 mb-3">{level.name}</h2>
                <p className="text-base text-gray-600 font-light leading-relaxed">{checks}.</p>
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-sm text-gray-500 font-light leading-relaxed">
          {locale === 'sr'
            ? 'Za status konkretne šarže u operativnom sistemu, koristite batch pregled u aplikaciji ili javni pasoš serije.'
            : 'For live batch status inside the operating programme, use the in-app batch view or the public batch passport when published for that load.'}
        </p>

        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link href={`${prefix}/for-growers`} className="text-[#2D5A27] hover:text-[#23471f]">
            {locale === 'sr' ? 'Program za proizvođače' : 'Grower programme'}
          </Link>
          <Link href={`${prefix}/faq`} className="text-[#2D5A27] hover:text-[#23471f]">
            FAQ
          </Link>
          <Link href={`${prefix}/contact`} className="text-[#2D5A27] hover:text-[#23471f]">
            {locale === 'sr' ? 'Kontakt' : 'Contact'}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

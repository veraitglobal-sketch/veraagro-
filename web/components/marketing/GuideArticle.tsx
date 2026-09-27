import Link from 'next/link';
import type { GuideRelatedLink, GuideSection } from '@/lib/guides/types';
import type { SiteLocale } from '@/i18n/config';
import MarketingHero from '@/components/marketing/MarketingHero';
import Footer from '@/components/Footer';

type GuideArticleProps = {
  locale: SiteLocale;
  eyebrow?: string;
  title: string;
  lead: string;
  sections: GuideSection[];
  relatedLinks: GuideRelatedLink[];
};

export default function GuideArticle({
  locale,
  eyebrow,
  title,
  lead,
  sections,
  relatedLinks,
}: GuideArticleProps) {
  const prefix = `/${locale}`;

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <MarketingHero
            eyebrow={eyebrow}
            title={title}
            lead={lead}
            sectionClassName="!pt-4 pb-10 !px-0 text-left"
            leadClassName="text-base sm:text-lg text-gray-600 font-light leading-relaxed max-w-none"
          />

          <article className="prose prose-gray max-w-none">
            {sections.map((section, idx) => (
              <section key={idx} className="mb-10">
                {section.heading ? (
                  <h2 className="text-xl font-light text-gray-900 mb-4">{section.heading}</h2>
                ) : null}
                {section.paragraphs.map((p, pIdx) => (
                  <p
                    key={pIdx}
                    className="text-base text-gray-600 font-light leading-relaxed mb-4 last:mb-0"
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </article>

          {relatedLinks.length > 0 ? (
            <aside className="mt-14 pt-10 border-t border-gray-200">
              <h2 className="text-sm font-medium uppercase tracking-wider text-gray-500 mb-4">
                Related
              </h2>
              <ul className="space-y-2">
                {relatedLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      href={`${prefix}/${link.path.replace(/^\//, '')}`}
                      className="text-[#2D5A27] hover:text-[#23471f] text-sm font-medium transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}

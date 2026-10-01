import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import bg from '@/locales/bg.json';
import fr from '@/locales/fr.json';
import es from '@/locales/es.json';
import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { LegalMarkdownBody } from '@/components/legal/LegalMarkdownBody';
import { loadLegalMarkdown } from '@/lib/legal-markdown';

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const markdown = await loadLegalMarkdown('impressum', locale);
  const meta =
    locale === 'sr' || locale.startsWith('sr')
      ? sr.legalDocsMeta
      : locale === 'de' || locale.startsWith('de')
        ? de.legalDocsMeta
        : locale === 'ro'
          ? ro.legalDocsMeta
          : locale === 'bg'
            ? bg.legalDocsMeta
            : locale === 'fr'
              ? fr.legalDocsMeta
              : locale === 'es'
                ? es.legalDocsMeta
                : en.legalDocsMeta;

  return (
    <LegalDocShell locale={locale}>
      <h1 className="mb-4 text-4xl font-light text-gray-900">{meta.impressumTitle}</h1>
      <p className="mb-12 text-sm text-gray-500">{meta.impressumUpdated}</p>
      <LegalMarkdownBody markdown={markdown} />
    </LegalDocShell>
  );
}

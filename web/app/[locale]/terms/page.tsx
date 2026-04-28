import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import { LegalDocShell } from '@/components/legal/LegalDocShell';
import { LegalMarkdownBody } from '@/components/legal/LegalMarkdownBody';
import { loadLegalMarkdown } from '@/lib/legal-markdown';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const markdown = await loadLegalMarkdown('terms', locale);
  const meta =
    locale === 'sr' || locale.startsWith('sr')
      ? sr.legalDocsMeta
      : locale === 'de' || locale.startsWith('de')
        ? de.legalDocsMeta
        : en.legalDocsMeta;

  return (
    <LegalDocShell locale={locale}>
      <h1 className="mb-4 text-4xl font-light text-gray-900">{meta.termsTitle}</h1>
      <p className="mb-12 text-sm text-gray-500">{meta.termsUpdated}</p>
      <LegalMarkdownBody markdown={markdown} />
    </LegalDocShell>
  );
}

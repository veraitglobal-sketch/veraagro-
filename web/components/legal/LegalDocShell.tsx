import Footer from '@/components/Footer';

type Props = {
  locale: string;
  children: React.ReactNode;
};

/** Server shell for legal pages ([locale]/privacy, cookies, terms). */
export function LegalDocShell({ locale: _locale, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <main className="px-6 pb-24 pt-12 lg:px-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import en from '@/locales/en.json';
import sr from '@/locales/sr.json';
import de from '@/locales/de.json';
import ro from '@/locales/ro.json';
import bg from '@/locales/bg.json';

type Props = {
  locale: string;
  children: React.ReactNode;
};

/** Server shell for legal pages ([locale]/privacy, cookies, terms). */
export function LegalDocShell({ locale, children }: Props) {
  const isSr = locale === 'sr' || locale.startsWith('sr');
  const isDe = locale === 'de' || locale.startsWith('de');
  const isRo = locale === 'ro';
  const isBg = locale === 'bg';
  const strings = isSr ? sr : isDe ? de : isRo ? ro : isBg ? bg : en;
  const base = isSr ? `/sr` : isDe ? `/de` : isRo ? `/ro` : isBg ? `/bg` : `/en`;

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href={`${base}`} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image
              src="/logo1.png"
              alt={strings.footer.logoAlt}
              width={56}
              height={20}
              className="h-4 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-8">
            <Link href={`${base}`} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
              {strings.nav?.home ?? 'Home'}
            </Link>
          </nav>
        </div>
      </header>

      <main className="px-6 pb-24 pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      <Footer />
    </div>
  );
}

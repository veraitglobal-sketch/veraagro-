import { notFound } from "next/navigation";
import { LocaleSync } from "@/components/LocaleSync";
import type { SiteLocale } from "@/i18n/config";
import { isSiteLocale } from "@/lib/i18n-routing";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isSiteLocale(locale)) {
    notFound();
  }

  return (
    <>
      <LocaleSync locale={locale as SiteLocale} />
      {children}
    </>
  );
}

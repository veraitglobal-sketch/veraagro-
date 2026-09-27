import type { Metadata } from "next";
import type { SiteLocale } from "@/i18n/config";
import { isSiteLocale } from "@/lib/i18n-routing";
import { marketingPageMetadata } from "@/lib/marketing-page-meta";

export async function generateMetadata({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>): Promise<Metadata> {
  const { locale: loc } = await params;
  const locale: SiteLocale = isSiteLocale(loc) ? loc : "en";
  return marketingPageMetadata(locale, "help-center");
}

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

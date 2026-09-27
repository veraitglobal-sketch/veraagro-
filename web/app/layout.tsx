import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/components/I18nProvider";
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import VeraAIChatbotWrapper from "@/components/VeraAIChatbotWrapper";
import { defaultMetadata } from "./metadata";
import { JsonLd } from "@/components/JsonLd";
import { buildBioVeraOrganizationGraph, getSiteUrl } from "@/lib/schema/biovera-jsonld";

function htmlLangFromHeader(locale: string | null): string {
  switch (locale) {
    case "sr":
      return "sr-Latn";
    case "de":
      return "de";
    case "ro":
      return "ro";
    case "bg":
      return "bg";
    case "fr":
      return "fr";
    case "es":
      return "es";
    default:
      return "en";
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2D5A27",
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

const organizationGraph = buildBioVeraOrganizationGraph(getSiteUrl());

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const htmlLang = htmlLangFromHeader(headerStore.get("x-biovera-locale"));

  return (
    <html lang={htmlLang}>
      <head>
        <JsonLd data={organizationGraph} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <I18nProvider>
            <Navigation />
            {children}
            <CookieConsent />
            <VeraAIChatbotWrapper />
            <SpeedInsights />
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

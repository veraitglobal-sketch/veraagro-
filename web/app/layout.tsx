import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/components/I18nProvider";
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import VeraAIChatbotWrapper from "@/components/VeraAIChatbotWrapper";
import { defaultMetadata } from "./metadata";
import en from "@/locales/en.json";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://biovera.app";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: en.brand.name,
              url: siteUrl,
              logo: `${siteUrl}/logo1.png`,
              description: en.metadata.ldJsonDescription,
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: en.metadata.ldJsonContactType,
                email: "contact@biovera.app",
                telephone: "+4915563740470",
              },
            }),
          }}
        />
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

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import { defaultMetadata } from "./metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultMetadata;

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
              "name": "Bio Vera",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://biovera.app",
              "logo": `${process.env.NEXT_PUBLIC_SITE_URL || "https://biovera.app"}/logo1.png`,
              "description": "Vertically Integrated Agrotech Platform. From seed to EU market. Immutable digital proof. Bio-Ready certification with complete traceability and automated compliance.",
              "sameAs": [],
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Service",
                "email": "contact@biovera.app",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navigation />
          {children}
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}

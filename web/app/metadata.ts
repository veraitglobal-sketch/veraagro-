import type { Metadata } from "next";
import en from "@/locales/en.json";

const m = en.metadata;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://biovera.app";
const siteImage = `${siteUrl}/logo1.png`;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: m.siteName,
    template: `%s | ${m.siteName}`,
  },
  description: m.siteDescription,
  keywords: m.keywords,
  authors: [{ name: en.brand.name }],
  creator: en.brand.name,
  publisher: en.brand.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: m.siteName,
    title: m.siteName,
    description: m.siteDescription,
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: m.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: m.siteName,
    description: m.siteDescription,
    images: [siteImage],
    creator: "@biovera",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {},
};

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = "",
  image?: string,
): Metadata {
  return {
    title,
    description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description,
      url: `${siteUrl}${path}`,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : defaultMetadata.openGraph?.images,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description,
      images: image ? [image] : defaultMetadata.twitter?.images,
    },
  };
}

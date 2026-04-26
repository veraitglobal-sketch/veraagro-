import { Metadata } from 'next';

const siteName = 'Bio Vera';
const siteDescription =
  'Organized agricultural network with guaranteed offtake, integrated packaging and logistics, official transport documents, automated invoicing, and full traceability from field to payment.';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://biovera.app';
const siteImage = `${siteUrl}/logo1.png`;

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'Bio Vera',
    'Agricultural supply chain',
    'Offtake',
    'Traceability',
    'Bio Certification',
    'EU Market',
    'Farm to Table',
    'Digital Passport',
    'Supply Chain',
    'Organic Farming',
    'Sustainable Agriculture',
    'Food Transparency',
  ],
  authors: [{ name: 'Bio Vera' }],
  creator: 'Bio Vera',
  publisher: 'Bio Vera',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [siteImage],
    creator: '@biovera',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
};

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = '',
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

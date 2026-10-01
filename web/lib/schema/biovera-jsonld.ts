import { ENTITY_ONE_LINER_EN } from '@/lib/entity-copy';
import { getSiteUrl } from '@/lib/site-url';

export { getSiteUrl };

/** Organization + WebSite @graph — included on every public page via root layout. */
export function buildBioVeraOrganizationGraph(siteUrl: string = getSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'Corporation'],
        '@id': `${siteUrl}/#organization`,
        name: 'Bio Vera',
        alternateName: ['BioVera', 'Bio Vera Hamburg', 'Bio Vera Agrifood'],
        url: siteUrl,
        logo: `${siteUrl}/biovera-logo.png`,
        description: ENTITY_ONE_LINER_EN,
        legalName: 'Jovica Mihajlovic – Bio Vera',
        vatID: 'DE456074487',
        foundingDate: '2025',
        founder: {
          '@type': 'Person',
          name: 'Jovica Mihajlovic',
          jobTitle: 'CEO & Founder',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Rehrstieg 16d',
          addressLocality: 'Hamburg',
          postalCode: '21147',
          addressCountry: 'DE',
        },
        telephone: '+4915563740470',
        email: 'info@biovera.app',
        // Growers, buyers, suppliers and logistics partners from all of Europe — not a single-country export corridor.
        areaServed: { '@type': 'Continent', name: 'Europe' },
        knowsLanguage: ['en', 'de', 'sr', 'es', 'fr', 'ro', 'bg'],
        knowsAbout: [
          'Agrifood Supply Chain',
          'Vertical Integration',
          'EU Digital Product Passport',
          'Food Traceability',
          'Precision Agriculture',
          'Cold Chain Management',
          'Blockchain Anchoring',
          'Anti-Fraud Technology',
          'AI Analytics',
          'Organic Certification',
          'GlobalG.A.P.',
          'Quality Assurance',
          'Contract Farming',
          'Fresh Produce Distribution',
          'AgriTech',
        ],
        makesOffer: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Fresh Fruits',
              description:
                '13 fruit varieties with EU Digital Product Passport and full batch traceability.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Fresh Vegetables',
              description: '18 vegetable varieties with full traceability and EU compliance.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Product',
              name: 'Cereals',
              description: '3 cereal lines with batch tracking from field to delivery.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Grower Programme',
              description:
                'Contract farming with defined standards, inputs, fair compensation and Bio-Ready certification.',
            },
          },
        ],
        parentOrganization: {
          '@type': 'Organization',
          name: 'Vera Group',
          url: 'https://www.verait.de',
          member: [
            { '@type': 'Organization', name: 'Vera IT', url: 'https://www.verait.de' },
            { '@type': 'Organization', name: 'Bio Vera', url: siteUrl },
            { '@type': 'Organization', name: 'Fade', url: 'https://getfadeapp.com' },
            { '@type': 'Organization', name: 'ReinAllround', url: 'https://www.reinallround.de' },
          ],
        },
        hasCredential: [
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'EU Digital Product Passport Compliance',
          },
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'GlobalG.A.P. IFA v6 Group Certification',
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Bio Vera',
        publisher: { '@id': `${siteUrl}/#organization` },
      },
    ],
  };
}

export type FaqSchemaItem = { question: string; answer: string };

/** FAQPage schema — questions must match visible FAQ copy; @id is locale-specific. */
export function buildFaqPageSchema(
  items: FaqSchemaItem[],
  siteUrl: string = getSiteUrl(),
  locale = 'en',
) {
  const faqPath = locale === 'en' ? '/en/faq' : `/${locale}/faq`;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteUrl}${faqPath}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

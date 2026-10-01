import { DEFAULT_CALENDLY_URL, type CalendlyUrls } from '@biovera/shared/book-call';

/** NEXT_PUBLIC_* must be referenced literally so Next.js inlines them at build time. */
export const WEB_CALENDLY_URLS: CalendlyUrls = {
  // Set NEXT_PUBLIC_CALENDLY_URL to "off" to hide every "Book a free call" entry point.
  default: process.env.NEXT_PUBLIC_CALENDLY_URL === 'off' ? null : process.env.NEXT_PUBLIC_CALENDLY_URL || DEFAULT_CALENDLY_URL,
  buyer: process.env.NEXT_PUBLIC_CALENDLY_URL_BUYER,
  producer: process.env.NEXT_PUBLIC_CALENDLY_URL_PRODUCER,
  supplier: process.env.NEXT_PUBLIC_CALENDLY_URL_SUPPLIER,
  logistics: process.env.NEXT_PUBLIC_CALENDLY_URL_LOGISTICS,
};

export const BOOK_CALL_ENABLED = Boolean(WEB_CALENDLY_URLS.default?.trim());

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/** Confidential partner documents — never index; titles stay neutral for tab history. */
export const metadata: Metadata = {
  title: 'Partner plans',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function GrowerConfidentialLayout({ children }: { children: ReactNode }) {
  return children;
}

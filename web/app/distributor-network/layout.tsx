import type { Metadata } from 'next';

/** Placeholder hub data (not real locations) — never index this page. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DistributorNetworkLayout({ children }: { children: React.ReactNode }) {
  return children;
}

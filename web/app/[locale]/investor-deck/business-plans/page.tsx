import type { Metadata } from 'next';
import InvestorBusinessPlansClient from './InvestorBusinessPlansClient';

export const metadata: Metadata = {
  title: 'Bio Vera',
  robots: { index: false, follow: false },
};

export default function InvestorBusinessPlansPage() {
  return <InvestorBusinessPlansClient />;
}

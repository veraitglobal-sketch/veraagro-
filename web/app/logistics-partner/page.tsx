import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/metadata';
import en from '@/locales/en.json';
import LogisticsPartnerPageClient from '@/components/marketing/LogisticsPartnerPageClient';

type LogisticsPartnerBundle = {
  logisticsPartnerPage: {
    metaTitle?: string;
    metaDescription?: string;
    title: string;
    heroLead: string;
  };
};

const lp = (en as LogisticsPartnerBundle).logisticsPartnerPage;

export const metadata: Metadata = generatePageMetadata(
  lp.metaTitle ?? `${lp.title} | Bio Vera`,
  lp.metaDescription ?? lp.heroLead,
  '/logistics-partner',
);

export default function LogisticsPartnerPage() {
  return <LogisticsPartnerPageClient />;
}

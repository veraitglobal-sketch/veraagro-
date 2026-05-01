'use client';

import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { ShieldCheck, MapPin, ImageIcon, FlaskConical, Clock } from 'lucide-react';

const REQUIREMENT_ROWS: { translationKey: 'gps' | 'images' | 'lab' | 'duration'; icon: typeof MapPin }[] = [
  { translationKey: 'gps', icon: MapPin },
  { translationKey: 'images', icon: ImageIcon },
  { translationKey: 'lab', icon: FlaskConical },
  { translationKey: 'duration', icon: Clock },
];

export default function BuyerPortalVeraStandardPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.veraStandard')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-shrink-0 rounded-xl border border-green-200/60 bg-green-50/80 p-3 text-green-800">
                <ShieldCheck className="w-8 h-8" strokeWidth={1.25} aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">{t('buyerPortalVeraStandard.title')}</h1>
                <p className="text-sm text-gray-600 mt-3 font-light max-w-2xl">
                  {t('buyerPortalVeraStandard.description')}
                </p>
              </div>
            </div>
          </div>

          <section
            aria-labelledby="vera-standard-reqs"
            className="rounded-xl border border-green-200/50 bg-white/60 p-6 shadow-sm"
          >
            <h2 id="vera-standard-reqs" className="text-lg font-medium text-gray-900 mb-4">
              {t('buyerPortalVeraStandard.requirements.title')}
            </h2>
            <ul className="divide-y divide-green-100/80 border border-green-100/80 rounded-lg overflow-hidden">
              {REQUIREMENT_ROWS.map(({ translationKey, icon: Icon }) => (
                <li
                  key={translationKey}
                  className="flex gap-4 items-start px-4 py-4 bg-white/90 first:rounded-t-[inherit] last:rounded-b-[inherit]"
                >
                  <Icon className="w-5 h-5 text-green-700/90 flex-shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden />
                  <span className="text-sm text-gray-700 font-light">
                    {t(`buyerPortalVeraStandard.requirements.${translationKey}`)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

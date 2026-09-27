'use client';

import Link from 'next/link';
import { MapPin, GraduationCap } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

export default function CareersRecruitmentHero() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const regions = [
    { key: 'salesSouthCentral' as const, label: t('careersPage.featuredAd.regionSouthCentral') },
    { key: 'salesVojvodina' as const, label: t('careersPage.featuredAd.regionVojvodina') },
  ];

  return (
    <div className="rounded-xl border border-[#2D5A27]/30 bg-gradient-to-br from-[#2D5A27]/8 via-white to-white p-6 sm:p-8 md:p-10 shadow-sm text-left max-w-3xl mx-auto">
      <div className="mb-6">
        <BrandLogo alt={t('footer.logoAlt')} priority />
      </div>
      <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#2D5A27] mb-3">
        {t('careersPage.featuredAd.eyebrow')}
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-3 leading-tight">
        {t('careersPage.featuredAd.title')}
      </h1>
      <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed mb-6">
        {t('careersPage.featuredAd.lead')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {regions.map((region) => (
          <Link
            key={region.key}
            href={`${loc('/careers/apply')}?job=${region.key}`}
            className="flex-1 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 hover:border-[#2D5A27]/50 hover:bg-[#2D5A27]/5 transition-colors min-h-[48px]"
          >
            <MapPin className="w-4 h-4 text-[#2D5A27] flex-shrink-0" aria-hidden />
            <span className="font-medium">{region.label}</span>
          </Link>
        ))}
      </div>

      <p className="inline-flex items-start gap-2 text-sm text-gray-600 font-light mb-6">
        <GraduationCap className="w-4 h-4 text-[#2D5A27] mt-0.5 flex-shrink-0" aria-hidden />
        <span>{t('careersPage.featuredAd.degreeNote')}</span>
      </p>

      <Link
        href={`${loc('/careers/apply')}?job=salesSouthCentral`}
        className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] transition-colors rounded-lg"
      >
        {t('careersPage.applyNow')}
      </Link>
    </div>
  );
}

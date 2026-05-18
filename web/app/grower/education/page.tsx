'use client';

import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import Link from 'next/link';
import { Video, Scale, HeartHandshake, BookMarked, Smartphone } from 'lucide-react';
import { useGrowerHref } from '@/hooks/useGrowerHref';

type SectionDef = {
  icon: typeof Video;
  titleKey: string;
  introKey: string;
  bulletKeys: string[];
};

export default function GrowerEducationPage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();
  const growerHref = useGrowerHref();

  const sections: SectionDef[] = [
    {
      icon: Video,
      titleKey: 'grower.education.videoSectionTitle',
      introKey: 'grower.education.videoSectionIntro',
      bulletKeys: [
        'grower.education.videoBullet1',
        'grower.education.videoBullet2',
        'grower.education.videoBullet3',
      ],
    },
    {
      icon: Scale,
      titleKey: 'grower.education.liabilitySectionTitle',
      introKey: 'grower.education.liabilitySectionIntro',
      bulletKeys: [
        'grower.education.liabilityBullet1',
        'grower.education.liabilityBullet2',
        'grower.education.liabilityBullet3',
      ],
    },
    {
      icon: HeartHandshake,
      titleKey: 'grower.education.ethicsSectionTitle',
      introKey: 'grower.education.ethicsSectionIntro',
      bulletKeys: ['grower.education.ethicsBullet1', 'grower.education.ethicsBullet2'],
    },
    {
      icon: BookMarked,
      titleKey: 'grower.education.moreSectionTitle',
      introKey: 'grower.education.moreSectionIntro',
      bulletKeys: ['grower.education.moreBullet1', 'grower.education.moreBullet2'],
    },
  ];

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.education')} navItems={navItems}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.education.pageTitle')}
            description={t('grower.education.pageDescription')}
          />

          <Link
            href={growerHref('/grower/app-guide')}
            className="mb-6 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#2D5A27]/30 transition-colors"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2D5A27]/10">
              <Smartphone className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900">{t('grower.appGuide.openFromEducation')}</p>
              <p className="text-sm text-gray-600 font-light mt-0.5">{t('grower.appGuide.pageDescription')}</p>
            </div>
          </Link>

          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-base text-amber-950 leading-relaxed">
            {t('grower.education.comingSoon')}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sections.map(({ icon: Icon, titleKey, introKey, bulletKeys }) => (
              <section
                key={titleKey}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-[#2D5A27]/10">
                    <Icon className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 leading-snug">{t(titleKey)}</h2>
                    <p className="mt-1 text-base text-gray-700 font-light leading-relaxed">{t(introKey)}</p>
                  </div>
                </div>
                <ul className="list-disc space-y-2 pl-5 text-base text-gray-800 leading-relaxed">
                  {bulletKeys.map((k) => (
                    <li key={k}>{t(k)}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-8 max-w-3xl text-sm text-gray-600 leading-relaxed">{t('grower.education.footerNote')}</p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

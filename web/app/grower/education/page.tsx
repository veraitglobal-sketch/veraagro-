'use client';

import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import Link from 'next/link';
import { Video, Scale, HeartHandshake, BookMarked, Smartphone, ChevronDown } from 'lucide-react';
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
            description={t('grower.education.pageLeadOneLine')}
          />

          <Link
            href={growerHref('/grower/app-guide')}
            prefetch
            className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#2D5A27]/30 transition-colors min-h-[48px]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2D5A27]/10">
              <Smartphone className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900">{t('grower.appGuide.openFromEducation')}</p>
              <p className="text-sm text-gray-600 font-light mt-0.5 line-clamp-1">{t('grower.appGuide.pageDescription')}</p>
            </div>
          </Link>

          <p className="mb-5 text-sm text-gray-600 leading-relaxed">{t('grower.education.comingSoonShort')}</p>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            {t('grower.education.topicsTitle')}
          </p>

          <div className="space-y-3 max-w-3xl">
            {sections.map(({ icon: Icon, titleKey, introKey, bulletKeys }) => (
              <details
                key={titleKey}
                className="group rounded-xl border border-gray-200 bg-white shadow-sm open:shadow-md transition-shadow"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5 min-h-[48px] [&::-webkit-details-marker]:hidden">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-[#2D5A27]/10">
                    <Icon className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold text-gray-900 leading-snug">{t(titleKey)}</h2>
                    <p className="mt-0.5 text-sm text-gray-600 font-light line-clamp-1">{t(introKey)}</p>
                  </div>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </summary>
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">{t(introKey)}</p>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-800 leading-relaxed">
                    {bulletKeys.map((k) => (
                      <li key={k}>{t(k)}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>

          <p className="mt-6 max-w-3xl text-xs text-gray-500 leading-relaxed">{t('grower.education.footerNoteShort')}</p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

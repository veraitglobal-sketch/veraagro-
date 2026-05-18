'use client';

import { useTranslation } from 'react-i18next';
import { Smartphone } from 'lucide-react';
import { GrowerAppGuideStepCard } from '@/components/grower/GrowerAppGuideStepCard';
import { GROWER_APP_GUIDE_STEPS } from '@/lib/grower-app-guide';

type Props = {
  toolbar?: React.ReactNode;
  footerExtra?: React.ReactNode;
};

/** Shared step-by-step guide body (screenshots + bullets). */
export function GrowerAppGuideContent({ toolbar, footerExtra }: Props) {
  const { t } = useTranslation();

  return (
    <>
      {toolbar ? <div className="mb-6 print:hidden">{toolbar}</div> : null}

      <div className="mb-6 rounded-xl border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 flex gap-3 print:hidden">
        <Smartphone className="h-5 w-5 text-[#2D5A27] shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-gray-700 leading-relaxed">{t('grower.appGuide.hintLive')}</p>
      </div>

      <nav className="mb-8 print:hidden" aria-label={t('grower.appGuide.tocTitle')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          {t('grower.appGuide.tocTitle')}
        </p>
        <ol className="flex flex-wrap gap-2">
          {GROWER_APP_GUIDE_STEPS.map((step, i) => (
            <li key={step.id}>
              <a
                href={`#guide-${step.id}`}
                className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 hover:border-[#2D5A27]/40"
              >
                {i + 1}. {t(step.titleKey)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-8 max-w-7xl">
        {GROWER_APP_GUIDE_STEPS.map((step, index) => (
          <GrowerAppGuideStepCard key={step.id} step={step} index={index} />
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-500 print:mt-4">{t('grower.appGuide.footer')}</p>
      {footerExtra}
    </>
  );
}

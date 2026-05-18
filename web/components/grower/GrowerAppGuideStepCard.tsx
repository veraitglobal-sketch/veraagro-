'use client';

import { useTranslation } from 'react-i18next';
import type { GrowerAppGuideStep } from '@/lib/grower-app-guide';
import { growerAppGuideImageSrc } from '@/lib/grower-app-guide';
import { GrowerAppGuideScreenshot } from '@/components/grower/GrowerAppGuideScreenshot';

type Props = {
  step: GrowerAppGuideStep;
  index: number;
};

export function GrowerAppGuideStepCard({ step, index }: Props) {
  const { t } = useTranslation();
  const src = growerAppGuideImageSrc(step.imageFile);

  return (
    <section
      id={`guide-${step.id}`}
      className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm print:break-inside-avoid"
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D5A27] text-sm font-semibold text-white tabular-nums"
          aria-hidden
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{t(step.titleKey)}</h2>
          <p className="mt-1.5 text-sm text-gray-600 font-light leading-relaxed">{t(step.leadKey)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col xl:flex-row xl:gap-12 xl:items-start">
        <div className="mx-auto xl:mx-0 shrink-0 w-full max-w-[420px]">
          <div className="rounded-[1.75rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden shadow-lg">
            <GrowerAppGuideScreenshot
              src={src}
              alt={t(step.titleKey)}
              imageFile={step.imageFile}
              priority={index === 0}
            />
          </div>
          <p className="mt-2 text-center text-xs text-gray-500 print:hidden">
            {t('grower.appGuide.tapToEnlarge')}
          </p>
        </div>

        {step.bulletKeys && step.bulletKeys.length > 0 ? (
          <ul className="mt-4 xl:mt-0 flex-1 space-y-2.5 text-sm text-gray-700 leading-relaxed list-none max-w-xl">
            {step.bulletKeys.map((key) => (
              <li key={key} className="flex gap-2.5">
                <span className="text-[#2D5A27] font-bold shrink-0" aria-hidden>
                  ·
                </span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

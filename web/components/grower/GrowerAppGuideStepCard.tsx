'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageOff } from 'lucide-react';
import type { GrowerAppGuideStep } from '@/lib/grower-app-guide';
import { growerAppGuideImageSrc } from '@/lib/grower-app-guide';

type Props = {
  step: GrowerAppGuideStep;
  index: number;
};

export function GrowerAppGuideStepCard({ step, index }: Props) {
  const { t } = useTranslation();
  const src = growerAppGuideImageSrc(step.imageFile);
  const [imgOk, setImgOk] = useState(true);

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

      <div className="mt-5 flex flex-col lg:flex-row lg:gap-8 lg:items-start">
        <div className="mx-auto lg:mx-0 shrink-0 w-full max-w-[280px]">
          <div className="rounded-[1.75rem] border-[6px] border-gray-900 bg-gray-900 overflow-hidden shadow-lg">
            {imgOk ? (
              <Image
                src={src}
                alt={t(step.titleKey)}
                width={390}
                height={844}
                className="w-full h-auto block"
                onError={() => setImgOk(false)}
                unoptimized
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 bg-gray-100 aspect-[390/844] px-4 text-center">
                <ImageOff className="h-8 w-8 text-gray-400" aria-hidden />
                <p className="text-xs text-gray-500 font-mono break-all">{step.imageFile}</p>
                <p className="text-xs text-gray-500">{t('grower.appGuide.imagePending')}</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-400 font-mono print:hidden">
            {step.imageFile}
          </p>
        </div>

        {step.bulletKeys && step.bulletKeys.length > 0 ? (
          <ul className="mt-4 lg:mt-0 flex-1 space-y-2.5 text-sm text-gray-700 leading-relaxed list-none">
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

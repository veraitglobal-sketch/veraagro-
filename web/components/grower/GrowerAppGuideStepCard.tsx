'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GrowerAppGuideDetailBlock, GrowerAppGuideStep } from '@/lib/grower-app-guide';
import { growerAppGuideImageSrc } from '@/lib/grower-app-guide';
import { GrowerAppGuideScreenshot } from '@/components/grower/GrowerAppGuideScreenshot';

type Props = {
  step: GrowerAppGuideStep;
  index: number;
  pdfExport?: boolean;
};

function parseDetailBlocks(raw: unknown): GrowerAppGuideDetailBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is GrowerAppGuideDetailBlock =>
      typeof row === 'object' &&
      row !== null &&
      'heading' in row &&
      'body' in row &&
      typeof (row as GrowerAppGuideDetailBlock).heading === 'string' &&
      typeof (row as GrowerAppGuideDetailBlock).body === 'string',
  );
}

export function GrowerAppGuideStepCard({ step, index, pdfExport = false }: Props) {
  const { t } = useTranslation();
  const src = growerAppGuideImageSrc(step.imageFile);

  const detailBlocks = useMemo(
    () => parseDetailBlocks(t(step.detailBlocksKey, { returnObjects: true })),
    [t, step.detailBlocksKey],
  );

  return (
    <section
      id={`guide-${step.id}`}
      className="scroll-mt-24 rounded-xl border border-gray-200 bg-white shadow-sm print:break-inside-avoid"
    >
      <div className="border-b border-gray-100 bg-[#fafbf9] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D5A27] text-sm font-semibold text-white tabular-nums"
            aria-hidden
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t(step.titleKey)}</h2>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{t(step.leadKey)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] print:grid-cols-1">
        {/* Left: native screenshot inside shared device frame */}
        <div className="border-b xl:border-b-0 xl:border-r border-gray-100 bg-[#f3f6f3] px-4 py-8 sm:px-6 lg:px-8 xl:sticky xl:top-24 xl:self-start print:static print:border-b print:border-r-0 print:bg-white">
          <div className="mx-auto w-full max-w-[380px]">
            <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 xl:text-left print:hidden">
              {t('grower.appGuide.screenColumnLabel')}
            </p>
            <GrowerAppGuideScreenshot
              src={src}
              alt={t(step.titleKey)}
              imageFile={step.imageFile}
              priority={index === 0}
              pdfExport={pdfExport}
            />
            <p className="mt-4 text-center text-xs text-gray-500 xl:text-left print:hidden">
              {t('grower.appGuide.tapToEnlarge')}
            </p>
          </div>
        </div>

        {/* Right: detailed explanation */}
        <div className="p-5 sm:p-6 lg:p-8">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-wider text-[#2D5A27]">
            {t('grower.appGuide.detailColumnLabel')}
          </p>

          <div className="space-y-6">
            {detailBlocks.map((block) => (
              <article key={block.heading} className="rounded-lg border border-gray-100 bg-white p-4 sm:p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{block.heading}</h3>
                <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-line">{block.body}</p>
              </article>
            ))}
          </div>

          {step.bulletKeys && step.bulletKeys.length > 0 ? (
            <div className="mt-8 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-[#2D5A27] mb-3">{t('grower.appGuide.checklistTitle')}</h3>
              <ul className="space-y-2.5 text-[15px] text-gray-800 leading-relaxed list-none">
                {step.bulletKeys.map((key) => (
                  <li key={key} className="flex gap-2.5">
                    <span className="text-[#2D5A27] font-bold shrink-0 mt-0.5" aria-hidden>
                      ✓
                    </span>
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ListOrdered } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type JourneyCta = {
  title: string;
  line: string;
  linkLabel: string;
  webHref: string;
};

type JourneyStep = {
  title: string;
  paragraphs: string[];
  footnote?: string | null;
  links: Array<{ label: string; href: string }>;
};

type JourneyData = {
  chainShort: Array<{ kicker: string; text: string }>;
  intro: {
    sidebarBlurb: string;
    myFieldsCta: JourneyCta;
  };
  fullChainTitle: string;
  fieldsMapKicker: string;
  navJumpLabel: string;
  stepNumber: string;
  stepSrOnly: string;
  steps: JourneyStep[];
  seasonMetaChip: string;
};

function stepBodyFromJourney(s: JourneyStep): ReactNode {
  return (
    <>
      {s.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {s.links && s.links.length > 0 ? (
        <p className="mt-2 flex flex-wrap gap-3">
          {s.links.map((l) => (
            <Link key={l.href + l.label} href={l.href} className="text-[#2D5A27] font-medium hover:underline">
              {l.label}
            </Link>
          ))}
        </p>
      ) : null}
      {s.footnote ? <p className="mt-2 text-sm text-gray-600">{s.footnote}</p> : null}
    </>
  );
}

type Props = {
  className?: string;
};

export default function GrowerSeasonJourney({ className = '' }: Props) {
  const { t } = useTranslation();
  const j = t('grower.journey', { returnObjects: true }) as unknown as JourneyData;
  if (!j?.steps?.length) {
    return (
      <p className="text-sm text-amber-800">
        {t('common.loading')}
      </p>
    );
  }

  const cta = j.intro?.myFieldsCta;

  return (
    <div className={className}>
      <div className="mb-5 rounded-xl border border-[#2D5A27]/25 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-gray-900">{j.fullChainTitle}</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-700 leading-relaxed">
          {j.chainShort.map((item) => (
            <li key={item.kicker}>
              <strong className="text-gray-900">{item.kicker}:</strong> {item.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">{cta?.title}</p>
          <p className="mt-1 text-sm text-gray-600">
            {cta && (
              <>
                <Link href={cta.webHref} className="text-[#2D5A27] font-medium hover:underline">
                  {cta.linkLabel}
                </Link>{' '}
                {cta.line}
              </>
            )}
          </p>
        </div>
        <div className="lg:col-span-7 flex items-start gap-2 rounded-xl border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-sm text-gray-800">
          <ListOrdered className="h-5 w-5 shrink-0 text-[#2D5A27] mt-0.5" aria-hidden />
          <p>{j.intro?.sidebarBlurb}</p>
        </div>
      </div>

      <nav
        className="mb-5 flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50/90 p-2"
        aria-label={j.navJumpLabel}
      >
        {j.steps.map((_, i) => (
          <a
            key={i}
            href={`#step-${i + 1}`}
            className="inline-flex min-h-[2rem] items-center justify-center rounded-md border border-transparent px-2.5 py-1 text-xs font-medium text-[#23471f] transition hover:border-[#2D5A27]/30 hover:bg-white"
          >
            {t('grower.journey.stepNumber', { n: i + 1 })}
          </a>
        ))}
      </nav>

      <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
        {j.steps.map((s, i) => (
          <li
            key={i}
            id={`step-${i + 1}`}
            className="scroll-mt-28 flex min-h-full flex-col rounded-xl border border-gray-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm transition hover:border-[#2D5A27]/25 hover:shadow-md"
          >
            <div className="mb-3 flex items-start gap-3 border-b border-gray-100 pb-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D5A27] text-sm font-bold text-white shadow-sm"
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="pt-0.5 text-sm font-semibold leading-snug text-gray-900 sm:text-base">
                <span className="sr-only">{t('grower.journey.stepSrOnly', { n: i + 1 })}</span>
                {s.title}
              </h3>
            </div>
            <div className="flex-1 text-sm text-gray-700 font-light leading-relaxed [&_p]:m-0 [&_p+p]:mt-2">
              {stepBodyFromJourney(s)}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function GrowerSeasonMetaChip() {
  const { t } = useTranslation();
  const j = t('grower.journey', { returnObjects: true }) as unknown as JourneyData;
  return <>{j?.seasonMetaChip ?? '12 cards · 11 nav links'}</>;
}

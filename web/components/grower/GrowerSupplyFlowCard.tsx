'use client';

import Link from 'next/link';
import { Trans, useTranslation } from 'react-i18next';

const suppliersHref = '/grower/where-to-buy' as const;
const materialsHref = '/grower/materials' as const;
const batchesHref = '/grower/batches' as const;
const complianceHref = '/grower/compliance-photos' as const;
const missionsHref = '/grower/missions/create' as const;

type Props = {
  context: 'suppliers' | 'materials';
  className?: string;
  variant?: 'default' | 'collapsible' | 'compact';
};

function SupplyFlowOrderedSteps({ context }: { context: 'suppliers' | 'materials' }) {
  const { t } = useTranslation();
  return (
    <ol className="space-y-3 text-sm text-gray-800 list-none">
      <li
        className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
          context === 'suppliers'
            ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/30 ring-offset-1 rounded-r-md bg-[#2D5A27]/5'
            : 'border-gray-200'
        }`}
      >
        <span className="text-xs font-semibold text-[#2D5A27]">{t('growerPages.sf1t')}</span>
        <p className="text-gray-700 mt-1 font-light leading-relaxed">
          <Trans
            i18nKey="growerPages.sf1"
            components={[
              <Link key="0" href={suppliersHref} className="text-[#2D5A27] font-medium underline" />,
              <strong key="1" className="font-semibold text-gray-900" />,
              <strong key="2" className="font-semibold text-gray-900" />,
              <strong key="3" className="font-semibold text-gray-900" />,
            ]}
          />
        </p>
      </li>
      <li
        className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
          context === 'suppliers' ? 'border-[#2D5A27] bg-[#2D5A27]/5' : 'border-gray-200'
        }`}
      >
        <span className="text-xs font-semibold text-[#2D5A27]">{t('growerPages.sf2t')}</span>
        <p className="text-gray-700 mt-1 font-light leading-relaxed">
          <Trans
            i18nKey="growerPages.sf2"
            components={[
              <strong key="0" className="font-semibold text-gray-900" />,
              <em key="1" />,
            ]}
          />
        </p>
      </li>
      <li
        className={`pl-0 border-l-4 pl-4 py-2 -ml-px ${
          context === 'materials'
            ? 'border-[#2D5A27] ring-2 ring-[#2D5A27]/30 ring-offset-1 rounded-r-md bg-[#2D5A27]/5'
            : 'border-gray-200'
        }`}
      >
        <span className="text-xs font-semibold text-[#2D5A27]">{t('growerPages.sf3t')}</span>
        <p className="text-gray-700 mt-1 font-light leading-relaxed">
          <Trans
            i18nKey="growerPages.sf3"
            components={[
              <Link key="0" href={materialsHref} className="text-[#2D5A27] font-medium underline" />,
              <strong key="1" className="font-semibold text-gray-900" />,
              <strong key="2" className="font-semibold text-gray-900" />,
              <strong key="3" className="font-semibold text-gray-900" />,
              <strong key="4" className="font-semibold text-gray-900" />,
              <strong key="5" className="font-semibold text-gray-900" />,
              <Link key="6" href={complianceHref} className="text-[#2D5A27] font-medium underline" />,
            ]}
          />
        </p>
      </li>
      <li className="pl-0 border-l-4 border-gray-200 pl-4 py-2 -ml-px">
        <span className="text-xs font-semibold text-gray-800">{t('growerPages.sf4t')}</span>
        <p className="text-gray-700 mt-1 font-light leading-relaxed">
          <Trans
            i18nKey="growerPages.sf4"
            components={[
              <Link key="0" href={batchesHref} className="text-[#2D5A27] font-medium underline" />,
            ]}
          />
        </p>
      </li>
      <li className="pl-0 border-l-4 border-gray-200 pl-4 py-2 -ml-px">
        <span className="text-xs font-semibold text-gray-800">{t('growerPages.sf5t')}</span>
        <p className="text-gray-700 mt-1 font-light leading-relaxed">
          <Trans
            i18nKey="growerPages.sf5"
            components={[
              <Link key="0" href={missionsHref} className="text-[#2D5A27] font-medium underline" />,
            ]}
          />
        </p>
      </li>
    </ol>
  );
}

export default function GrowerSupplyFlowCard({ context, className = '', variant = 'default' }: Props) {
  const { t } = useTranslation();

  if (variant === 'compact') {
    return (
      <section
        id="supply-flow"
        className={`rounded-lg border border-gray-200 bg-white p-0 shadow-sm ${className}`.trim()}
      >
        <details className="group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg [&::-webkit-details-marker]:hidden">
            {t('growerPages.sfCompactHeadline')} — <span className="text-[#2D5A27]">{t('growerPages.sfCompactOpen')}</span>
          </summary>
          <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3 text-sm text-gray-600">
            <p className="pt-2 font-light">
              <span className="font-medium text-gray-800">{t('growerPages.sfCompactThisPage')}</span> ={' '}
              {t('growerPages.sfCompactEquals')}{' '}
              <Link href={materialsHref} className="text-[#2D5A27] font-medium underline">
                {t('grower.nav.materials')}
              </Link>{' '}
              = {t('growerPages.sfCompactAnd')}
            </p>
            <SupplyFlowOrderedSteps context={context} />
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-2">
              {t('growerPages.sfCompactHelp')}{' '}
              <Link href="#my-orders" className="text-[#2D5A27] underline">
                {t('growerPages.sfCompactOrdersLink')}
              </Link>
              , {t('growerPages.sfCompactHelpMid')}{' '}
              <Link href={materialsHref} className="text-[#2D5A27] underline">
                {t('grower.nav.materials')}
              </Link>
              .
            </p>
          </div>
        </details>
      </section>
    );
  }

  if (variant === 'collapsible') {
    return (
      <section
        id="supply-flow"
        className={`rounded-lg border border-[#2D5A27]/20 bg-gradient-to-b from-white to-gray-50/80 p-4 sm:p-5 shadow-sm space-y-3 ${className}`.trim()}
      >
        <h2 className="text-base font-semibold text-gray-900">{t('growerPages.sfCollapsibleTitle')}</h2>
        <p className="text-sm text-gray-600 font-light leading-relaxed">{t('growerPages.sfCollapsibleIntro')}</p>
        <details className="group rounded-md border border-gray-200 bg-white/80">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-[#23471f] hover:bg-gray-50/80 rounded-t-md">
            <span className="underline decoration-[#2D5A27]/30 underline-offset-2">{t('growerPages.sfCollapsibleShow')}</span>
            <span className="text-gray-500 font-normal">{t('growerPages.sfCollapsibleHint')}</span>
          </summary>
          <div className="px-3 pb-3 pt-0 border-t border-gray-100 space-y-3">
            <SupplyFlowOrderedSteps context={context} />
            <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-3">
              {t('growerPages.sfCollapsibleTabTip')}
            </p>
          </div>
        </details>
      </section>
    );
  }

  return (
    <section
      id="supply-flow"
      className={`rounded-lg border border-[#2D5A27]/20 bg-gradient-to-b from-white to-gray-50/80 p-5 sm:p-6 shadow-sm space-y-4 ${className}`.trim()}
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">{t('growerPages.sfDefaultTitle')}</h2>
        <p className="text-sm text-gray-600 mt-1 font-light">{t('growerPages.sfDefaultIntro')}</p>
      </div>

      <SupplyFlowOrderedSteps context={context} />

      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-200 pt-3">{t('growerPages.sfDefaultTip')}</p>
    </section>
  );
}

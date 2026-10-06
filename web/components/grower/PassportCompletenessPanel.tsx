'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { PassportCompletenessItem } from '@biovera/shared/passport/completeness';
import { passportCompletenessMissing } from '@biovera/shared/passport/completeness';

const LEVEL_STYLE: Record<string, string> = {
  required: 'border-amber-300 bg-amber-50 text-amber-950',
  recommended: 'border-gray-200 bg-gray-50 text-gray-800',
};

export default function PassportCompletenessPanel({
  items,
  localizeHref = (path: string) => path,
}: {
  items: PassportCompletenessItem[];
  localizeHref?: (path: string) => string;
}) {
  const { t } = useTranslation();
  const missing = passportCompletenessMissing(items);
  if (missing.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {t('passportCompleteness.allRequiredOk', 'Required passport data is recorded for this lot.')}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-medium text-gray-900 mb-1">
        {t('passportCompleteness.title', 'What is missing for the passport')}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        {t('passportCompleteness.lead', 'Fix gaps before publishing — optional items improve completeness but do not block work.')}
      </p>
      <ul className="space-y-2">
        {missing.map((item) => (
          <li
            key={item.id}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${LEVEL_STYLE[item.level] ?? LEVEL_STYLE.recommended}`}
          >
            <span>
              {t(item.labelKey, item.id)}
              <span className="ml-2 text-xs uppercase tracking-wide opacity-70">
                {item.level === 'required'
                  ? t('passportCompleteness.levelRequired', 'Required')
                  : t('passportCompleteness.levelRecommended', 'Recommended')}
              </span>
            </span>
            {item.actionHref ? (
              <Link
                href={localizeHref(item.actionHref)}
                className="min-h-[44px] inline-flex items-center rounded-lg border border-[#2D5A27] px-3 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
              >
                {t('passportCompleteness.fixLink', 'Add data')}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

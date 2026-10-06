'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import type { ProductionEvent } from '@biovera/shared/passport/production-history';
import { intlLocaleFor } from '@biovera/shared/i18n/format';
import { historyFactLabel } from '@biovera/shared/passport/history-labels';

export default function ProductionHistory({ events = [], gaps = [] }: { events?: ProductionEvent[]; gaps?: string[] }) {
  const { t, i18n } = useTranslation();
  const [all, setAll] = useState(false);
  const label = (key: string) => t(`glossary.productionHistory.${key}`);
  const date = (value: string | null) => value ? new Date(value).toLocaleString(intlLocaleFor(i18n.language)) : label('unknown');
  return <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
    <h2 className="font-medium text-lg">{label('title')}</h2>
    <p className="text-sm text-gray-500 mt-2 mb-4">{label('lead')}</p>
    {gaps.length ? <p className="text-sm text-amber-800 mb-4">{label('missing')}: {gaps.map(label).join(' · ')}</p> : null}
    {!events.length ? <p className="text-gray-500">{label('unknown')}</p> : null}
    <ol className="border-l border-green-200 ml-2 pl-5 space-y-5">
      {(all ? events : events.slice(0, 12)).map(e => <li key={e.id}>
        <p className="font-medium">{label(e.kind)}</p>
        <p className="text-xs text-gray-500">{date(e.date)}{e.endDate ? ` – ${date(e.endDate)}` : ''}</p>
        <p className="text-xs text-gray-500">{label('source')}: {label(e.source)}</p>
        {e.recordedAt ? <p className="text-xs text-gray-500">{label('recordedAt')}: {date(e.recordedAt)}</p> : null}
        <dl className="mt-1 text-sm space-y-1">{e.facts.map((f, i) => <div key={i}>
          <dt className="inline text-gray-500">{label(f.label)}: </dt>
          <dd className="inline whitespace-pre-wrap">{historyFactLabel(t, f)}</dd>
        </div>)}</dl>
        {e.photos?.map((photo, i) => <Image key={i} src={photo} alt="" width={160} height={110} unoptimized className="mt-2 rounded object-cover" />)}
      </li>)}
    </ol>
    {events.length > 12 ? <button className="mt-4 min-h-[44px] text-green-800 underline" onClick={() => setAll(!all)}>{label(all ? 'less' : 'all')} ({events.length})</button> : null}
  </section>;
}

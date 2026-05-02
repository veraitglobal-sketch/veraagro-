'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { FieldEntry } from '@/lib/offline/indexeddb';
import { getUnsyncedEntries } from '@/lib/offline/indexeddb';
import { syncAllEntries, onOnlineStatusChange } from '@/lib/offline/sync';

const MAX_VISIBLE = 5;

/** Grower dashboard: same „outbox“ idea as producer field-entry / mobile home sync strip. */
export default function GrowerOfflineOutboxBanner() {
  const { t, i18n } = useTranslation();
  const [pending, setPending] = useState(0);
  const [pendingList, setPendingList] = useState<FieldEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const activityLabel = (type: FieldEntry['type']) => {
    if (type === 'SETVA') return t('growerPages.fieldEntrySowing');
    if (type === 'PRSKANJE') return t('growerPages.fieldEntrySpraying');
    return t('growerPages.fieldEntryHarvest');
  };

  const refresh = useCallback(async () => {
    try {
      const u = await getUnsyncedEntries();
      setPending(u.length);
      setPendingList(u);
    } catch {
      setPending(0);
      setPendingList([]);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, 45_000);
    const unsub = onOnlineStatusChange(() => {
      void refresh();
    });
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, [refresh]);

  useEffect(() => {
    if (!syncNotice) return;
    const id = window.setTimeout(() => setSyncNotice(null), 12_000);
    return () => window.clearTimeout(id);
  }, [syncNotice]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncAllEntries();
      void refresh();
      if (result.synced > 0 && result.failed === 0) {
        setSyncNotice(t('grower.dashboard.outboxSyncDone', { synced: result.synced }));
      } else if (result.failed > 0) {
        setSyncNotice(t('grower.dashboard.outboxSyncPartial', { synced: result.synced, failed: result.failed }));
      }
    } finally {
      setSyncing(false);
      void refresh();
    }
  };

  if (!syncing && pending === 0 && !syncNotice) {
    return null;
  }

  /** Locale-free app path — do not use `withLocalePrefix` (would yield `/sr/producer/...` and break). */
  const workspaceHref = '/producer/field-entry';

  return (
    <div className="space-y-3">
      {syncNotice ? (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-base text-green-900 md:px-5"
        >
          {syncNotice}
        </div>
      ) : null}

      {(pending > 0 || syncing) && (
        <div
          role="region"
          aria-label={t('grower.dashboard.outboxAria')}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:px-5 md:py-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-medium text-amber-900">{t('grower.dashboard.outboxTitle')}</p>
              <p className="mt-1 text-base text-amber-800/90">
                {t('grower.dashboard.outboxBody', { count: pending })}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={syncing || pending === 0}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-base font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {syncing ? t('grower.dashboard.outboxSending') : t('grower.dashboard.outboxSyncNow')}
              </button>
              <Link
                href={workspaceHref}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-[#2D5A27] px-5 py-3 text-base font-medium text-[#2D5A27] hover:bg-[#2D5A27]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
              >
                {t('grower.dashboard.outboxOpenWorkspace')}
              </Link>
            </div>
          </div>

          {pendingList.length > 0 ? (
            <details className="mt-3 border-t border-amber-200/90 pt-3">
              <summary className="cursor-pointer list-none text-base font-medium text-amber-900 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="underline underline-offset-2">{t('grower.dashboard.outboxShowQueue')}</span>
              </summary>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-900/95">
                {pendingList.slice(0, MAX_VISIBLE).map((entry) => {
                  const raw = entry.data?.date || entry.createdAt;
                  const dateStr = new Date(raw).toLocaleDateString(i18n.language, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <li key={entry.id}>
                      {t('grower.dashboard.outboxEntryLine', {
                        activity: activityLabel(entry.type),
                        date: dateStr,
                      })}
                    </li>
                  );
                })}
              </ul>
              {pendingList.length > MAX_VISIBLE ? (
                <p className="mt-2 text-sm font-medium text-amber-800">
                  {t('grower.dashboard.outboxMoreCount', { count: pendingList.length - MAX_VISIBLE })}
                </p>
              ) : null}
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}

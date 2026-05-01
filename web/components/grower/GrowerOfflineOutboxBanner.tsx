'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { getUnsyncedEntries } from '@/lib/offline/indexeddb';
import { syncAllEntries, onOnlineStatusChange } from '@/lib/offline/sync';

/** Grower dashboard: same „outbox“ idea as producer field-entry / mobile home sync strip. */
export default function GrowerOfflineOutboxBanner() {
  const { t } = useTranslation();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const u = await getUnsyncedEntries();
      setPending(u.length);
    } catch {
      setPending(0);
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncAllEntries();
    } finally {
      setSyncing(false);
      void refresh();
    }
  };

  if (pending === 0 && !syncing) {
    return null;
  }

  /** Locale-free app path — do not use `withLocalePrefix` (would yield `/sr/producer/...` and break). */
  const workspaceHref = '/producer/field-entry';

  return (
    <div
      role="region"
      aria-label={t('grower.dashboard.outboxAria')}
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:px-5 md:py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">{t('grower.dashboard.outboxTitle')}</p>
          <p className="text-sm text-amber-800/90 mt-1">
            {t('grower.dashboard.outboxBody', { count: pending })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing || pending === 0}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {syncing ? t('grower.dashboard.outboxSending') : t('grower.dashboard.outboxSyncNow')}
          </button>
          <Link
            href={workspaceHref}
            className="px-4 py-2 rounded-lg border border-[#2D5A27] text-[#2D5A27] text-sm font-medium hover:bg-[#2D5A27]/10"
          >
            {t('grower.dashboard.outboxOpenWorkspace')}
          </Link>
        </div>
      </div>
    </div>
  );
}

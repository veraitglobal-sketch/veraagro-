'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { growerSupplierB2bAPI } from '@/lib/api';
import { ArrowLeft, MessageCircle, Loader2, ChevronRight } from 'lucide-react';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

type ThreadRow = Awaited<ReturnType<typeof growerSupplierB2bAPI.getMyThreads>>[number];

function threadLabel(row: ThreadRow, t: (k: string) => string) {
  const b = row.supplier?.material_supplier_profile?.businessName;
  if (b) return b;
  const n = [row.supplier?.firstName, row.supplier?.lastName].filter(Boolean).join(' ').trim();
  return n || row.supplier?.partnerCode || t('growerPages.partner');
}

export default function GrowerSupplierMessagesInboxPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const th = await growerSupplierB2bAPI.getMyThreads();
      setThreads(th);
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('growerPages.messagesInboxTitle')} navItems={growerNavItems}>
        <div className="w-full max-w-2xl space-y-5">
          <Link
            href="/grower/where-to-buy"
            className="inline-flex items-center gap-2 text-sm text-[#2D5A27] font-medium hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('growerPages.inboxBack')}
          </Link>

          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-[#2D5A27]" />
              {t('growerPages.messagesInboxTitle')}
            </h1>
            <p className="text-sm text-gray-600 mt-1.5 font-light leading-relaxed">
              {t('growerPages.messagesInboxLead')}
            </p>
          </div>

          {loading && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('growerPages.b2bLoading')}
            </p>
          )}
          {err && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{err}</div>}

          {!loading && !err && threads.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center text-sm text-gray-600">
              {t('growerPages.inboxEmpty')}
            </div>
          )}

          {!loading && !err && threads.length > 0 && (
            <ul className="space-y-2" role="list">
              {threads.map((th) => (
                <li key={th.id}>
                  <Link
                    href={`/grower/where-to-buy/thread/${encodeURIComponent(th.id)}`}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#2D5A27]/40 hover:shadow"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#23471f] bg-[#2D5A27]/10"
                      aria-hidden
                    >
                      {threadLabel(th, t).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="font-medium text-gray-900 truncate group-hover:text-[#23471f]">{threadLabel(th, t)}</p>
                      {th.supplier?.material_supplier_profile?.city && (
                        <p className="text-xs text-gray-500 truncate font-light">
                          {[th.supplier.material_supplier_profile.city, th.supplier.material_supplier_profile.country]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <time dateTime={th.lastMessageAt}>
                        {new Date(th.lastMessageAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </time>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#2D5A27]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

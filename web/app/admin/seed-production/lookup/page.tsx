'use client';

import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumButtonLink, PremiumCard, PremiumPageTitle } from '@/components/ui/Premium';
import { seedProductionAPI, type SeedBag } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateTimeEn } from '@/lib/en-locale-dates';
import { Loader2, Search } from 'lucide-react';

function bagStatusClass(status: string): string {
  if (status === 'AVAILABLE' || status === 'ASSIGNED') return 'bg-green-100 text-green-800';
  if (status === 'PLANTED' || status === 'USED') return 'bg-blue-100 text-blue-800';
  if (status === 'RECALLED' || status === 'VOIDED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

export default function SeedBagLookupPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const searchParams = useSearchParams();
  const [serial, setSerial] = useState('');
  const [bag, setBag] = useState<SeedBag | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useCallback(async (value?: string) => {
    const q = (value ?? serial).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setBag(null);
    try {
      const data = await seedProductionAPI.getBag(q);
      setBag(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      }
    } finally {
      setLoading(false);
    }
  }, [serial, t]);

  useEffect(() => {
    const q = searchParams.get('serial');
    if (q) {
      setSerial(q);
      lookup(q);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      lookup();
    }
  };

  const custody = bag?.custody ?? [];
  const run = bag?.productionRun;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('seedProduction.lookup.title')} navItems={adminNavItems}>
        <div className="space-y-6">
          <PremiumPageTitle
            title={t('seedProduction.lookup.title')}
            description={t('seedProduction.lookup.subtitle')}
          />

          <nav className="flex flex-wrap gap-2 text-sm">
            <PremiumButtonLink href="/admin/seed-production" variant="secondary">{t('seedProduction.nav.dashboard')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/approved-products" variant="secondary">{t('seedProduction.nav.approvedProducts')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/producers" variant="secondary">{t('seedProduction.nav.producers')}</PremiumButtonLink>
            <PremiumButtonLink href="/admin/seed-production/lookup" variant="primary">{t('seedProduction.nav.lookup')}</PremiumButtonLink>
          </nav>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('seedProduction.lookup.placeholder')}
              className="min-h-[48px] flex-1 rounded-lg border border-gray-300 px-4 py-2 font-mono text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
              autoFocus
            />
            <button
              type="button"
              onClick={() => lookup()}
              disabled={loading || !serial.trim()}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-2 text-white hover:bg-[#23471f] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t('seedProduction.lookup.search')}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}
          {notFound && (
            <p className="text-sm text-gray-600">{t('seedProduction.lookup.notFound')}</p>
          )}

          {bag && (
            <div className="space-y-4">
              <PremiumCard>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-sm text-gray-600">{bag.serialNumber}</p>
                    <h2 className="mt-1 text-xl font-medium text-gray-900">
                      {bag.approvedProduct?.name ?? run?.approvedProduct?.name ?? '—'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {t('seedProduction.lookup.productInfo')}: {run?.lotNumber ?? '—'} · {run?.seedCropYear ?? '—'}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${bagStatusClass(bag.status)}`}>
                    {t(`seedProduction.bagStatus.${bag.status}`, bag.status)}
                  </span>
                </div>
                {run?.id && (
                  <Link
                    href={`/admin/seed-production/runs/${run.id}`}
                    className="mt-4 inline-block text-sm font-medium text-[#2D5A27] hover:underline"
                  >
                    {t('seedProduction.lookup.openRun')}
                  </Link>
                )}
              </PremiumCard>

              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <h3 className="border-b border-gray-200 px-5 py-4 text-lg font-medium text-gray-900 sm:px-6">
                  {t('seedProduction.lookup.timeline')}
                </h3>
                {custody.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-gray-600 sm:px-6">—</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.lookup.event')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.lookup.when')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.lookup.note')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {custody.map((ev) => (
                          <tr key={ev.id}>
                            <td className="px-4 py-3">
                              {t(`seedProduction.custodyEvent.${ev.event}`, ev.event)}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{formatDateTimeEn(ev.createdAt)}</td>
                            <td className="px-4 py-3 text-gray-600">{ev.note ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

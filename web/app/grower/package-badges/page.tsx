'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { batchesAPI, packageBadgesAPI, type PackageBadgeType } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { WEB_API_BASE } from '@/lib/api-base';

function parseChildSerials(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

function publicBadgeUrl(serial: string): string {
  return `${WEB_API_BASE.replace(/\/$/, '')}/public/badges/${encodeURIComponent(serial)}`;
}

export default function GrowerPackageBadgesPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const [batches, setBatches] = useState<{ id: string; batchId: string; productName?: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [parentSerial, setParentSerial] = useState('');
  const [badgeType, setBadgeType] = useState<Extract<PackageBadgeType, 'PALLET_MASTER' | 'ROLL_LINE'>>(
    'PALLET_MASTER',
  );
  const [childrenRaw, setChildrenRaw] = useState('');
  const [batchInternalId, setBatchInternalId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSerial, setSuccessSerial] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [printOrders, setPrintOrders] = useState<{ id: string; status: string; parentCount: number; childrenPerParent: number }[]>(
    [],
  );
  const [printOrdersLoading, setPrintOrdersLoading] = useState(true);
  const [selectedPrintOrderId, setSelectedPrintOrderId] = useState('');

  useEffect(() => {
    let c = false;
    setBatchesLoading(true);
    batchesAPI
      .getAll()
      .then((data: unknown) => {
        if (c) return;
        const arr = Array.isArray(data) ? data : [];
        setBatches(
          arr.map((b: { id: string; batchId: string; productName?: string }) => ({
            id: b.id,
            batchId: b.batchId,
            productName: b.productName,
          })),
        );
      })
      .catch(() => {
        if (!c) setBatches([]);
      })
      .finally(() => {
        if (!c) setBatchesLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let c = false;
    setPrintOrdersLoading(true);
    packageBadgesAPI
      .listMyPrintOrders()
      .then((data: unknown) => {
        if (c) return;
        const arr = Array.isArray(data) ? data : [];
        setPrintOrders(
          arr
            .filter(
              (o: { status?: string }) => o?.status && o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
            )
            .map((o: { id: string; status: string; parentCount: number; childrenPerParent: number }) => ({
              id: o.id,
              status: o.status,
              parentCount: o.parentCount,
              childrenPerParent: o.childrenPerParent,
            })),
        );
      })
      .catch(() => {
        if (!c) setPrintOrders([]);
      })
      .finally(() => {
        if (!c) setPrintOrdersLoading(false);
      });
    return () => {
      c = true;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessSerial(null);
    const p = parentSerial.trim();
    if (!p) {
      setError('Parent serial is required');
      return;
    }
    setSubmitting(true);
    try {
      const childSerials = parseChildSerials(childrenRaw);
      await packageBadgesAPI.register({
        parentSerial: p,
        type: badgeType,
        childSerials,
        ...(batchInternalId ? { batchId: batchInternalId } : {}),
        ...(selectedPrintOrderId ? { printOrderId: selectedPrintOrderId } : {}),
      });
      setSuccessSerial(p);
      setSelectedPrintOrderId('');
      const next = await packageBadgesAPI.listMyPrintOrders().catch(() => []);
      const arr = Array.isArray(next) ? next : [];
      setPrintOrders(
        arr
          .filter(
            (o: { status?: string }) => o?.status && o.status !== 'COMPLETED' && o.status !== 'CANCELLED',
          )
          .map((o: { id: string; status: string; parentCount: number; childrenPerParent: number }) => ({
            id: o.id,
            status: o.status,
            parentCount: o.parentCount,
            childrenPerParent: o.childrenPerParent,
          })),
      );
    } catch (err: unknown) {
      const raw =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: unknown } } }).response?.data?.message
          : null;
      const msg = Array.isArray(raw) ? raw.join(' ') : raw;
      setError(typeof msg === 'string' && msg.trim() ? msg : t('grower.packageBadges.errGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const url = successSerial ? publicBadgeUrl(successSerial) : '';

  return (
    <AuthGuard
      requiredRoles={['GROWER', 'FARMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN']}
      redirectTo="/login/producer"
    >
      <SidebarLayout title={t('grower.packageBadges.pageTitle')} navItems={growerNavItems}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={t('grower.packageBadges.pageTitle')}
            description={t('grower.packageBadges.pageDescription')}
            right={
              <Link
                href="/grower/package-badges/scan"
                className="text-base font-medium text-[#2D5A27] hover:text-[#23471f] whitespace-nowrap"
              >
                {t('grower.packageBadges.headerScan')}
              </Link>
            }
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-800">{error}</div>
          )}

          {successSerial && (
            <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 p-4 space-y-2">
              <p className="font-medium text-[#23471f]">{t('grower.packageBadges.successTitle')}</p>
              <p className="text-base text-gray-700">{t('grower.packageBadges.successHint')}</p>
              <code className="block break-all text-xs bg-white/80 border border-gray-200 rounded p-2">{url}</code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="text-base font-medium text-[#2D5A27] underline"
              >
                {copied ? t('grower.packageBadges.copied') : t('grower.packageBadges.copyUrl')}
              </button>
            </div>
          )}

          <form onSubmit={onSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5 max-w-xl">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{t('grower.packageBadges.parentLabel')}</label>
              <p className="text-xs text-gray-500 mb-2">{t('grower.packageBadges.parentHint')}</p>
              <input
                value={parentSerial}
                onChange={(e) => setParentSerial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder={t('grower.packageBadges.parentSerialPlaceholder')}
                autoComplete="off"
              />
            </div>

            <div>
              <span className="block text-base font-medium text-gray-700 mb-2">{t('grower.packageBadges.typeLabel')}</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['PALLET_MASTER', t('grower.packageBadges.typePallet')],
                    ['ROLL_LINE', t('grower.packageBadges.typeRoll')],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setBadgeType(v)}
                    className={`px-3 py-2 rounded-lg text-base border ${
                      badgeType === v
                        ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#23471f]'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{t('grower.packageBadges.childrenLabel')}</label>
              <p className="text-xs text-gray-500 mb-2">{t('grower.packageBadges.childrenHint')}</p>
              <textarea
                value={childrenRaw}
                onChange={(e) => setChildrenRaw(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-base focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder={t('grower.packageBadges.childrenPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">{t('grower.packageBadges.linkPrintOrder')}</label>
              <p className="text-xs text-gray-500 mb-2">{t('grower.packageBadges.linkPrintOrderHint')}</p>
              <select
                value={selectedPrintOrderId}
                onChange={(e) => setSelectedPrintOrderId(e.target.value)}
                disabled={printOrdersLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              >
                <option value="">
                  {printOrdersLoading
                    ? t('grower.packageBadges.linkPrintOrderLoading')
                    : t('grower.packageBadges.linkPrintOrderNone')}
                </option>
                {printOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.status} · {o.parentCount}×{o.childrenPerParent} · {o.id.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">{t('grower.packageBadges.batchLabel')}</label>
              <select
                value={batchInternalId}
                onChange={(e) => setBatchInternalId(e.target.value)}
                disabled={batchesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
              >
                <option value="">{batchesLoading ? t('grower.packageBadges.loadingBatches') : t('grower.packageBadges.batchNone')}</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchId}
                    {b.productName ? ` — ${b.productName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-[#2D5A27] text-white font-medium hover:bg-[#23471f] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('grower.packageBadges.submitting')}
                </>
              ) : (
                t('grower.packageBadges.submit')
              )}
            </button>
          </form>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

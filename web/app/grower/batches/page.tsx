'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { productNameLabel } from '@biovera/shared/i18n/labels';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { batchesAPI, standardEngineAPI } from '@/lib/api';
import PassportCompletenessPanel from '@/components/grower/PassportCompletenessPanel';
import type { PassportCompletenessItem } from '@biovera/shared/passport/completeness';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useAuth } from '@/lib/auth';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import {
  getBatchStatusLabel,
  lotStatusBucket,
  lotStatusPillClass,
  type LotFilter,
} from '@/lib/batch-status-i18n';
import { groupLotsByEstate } from '@/lib/lot-display';
import { LotIdsBlock } from '@/components/grower/LotIdsBlock';
import {
  Package,
  Plus,
  Search,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  QrCode,
  ChevronRight,
} from 'lucide-react';


function formatCurrentLocation(loc: unknown): string {
  if (loc == null) return '—';
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'object' && loc !== null && 'hubName' in loc) {
    const o = loc as { hubName?: string; city?: string };
    return [o.hubName, o.city].filter(Boolean).join(', ') || '—';
  }
  return '—';
}

interface Batch {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  harvestDate: string;
  createdAt: string;
  estates?: {
    name: string;
    location?: string;
  };
  parcels?: {
    name?: string;
    cropType?: string | null;
  };
  hubs?: {
    name: string;
    city?: string;
  };
}

export default function GrowerBatchesPage() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const navItems = useGrowerNavItems();
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [lotFilter, setLotFilter] = useState<LotFilter>('all');
  
  // Selected batch for details
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [batchDetailsError, setBatchDetailsError] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Standard Engine - Loading Approval
  const [loadingApproval, setLoadingApproval] = useState<any>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showTraceabilityJson, setShowTraceabilityJson] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [passportCompleteness, setPassportCompleteness] = useState<PassportCompletenessItem[] | null>(null);
  const [passportCompletenessError, setPassportCompletenessError] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getAll();
      const rows = Array.isArray(data) ? data : [];
      setBatches(rows);
    } catch (err: unknown) {
      console.error('Error loading batches:', err);
      setError(growerApiErrorOrT(err, t, 'growerPages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const lotCounts = useMemo(() => {
    const c = { all: batches.length, here: 0, moving: 0, done: 0 };
    for (const b of batches) {
      const bucket = lotStatusBucket(b.status);
      if (bucket !== 'all') c[bucket] += 1;
    }
    return c;
  }, [batches]);

  const filteredBatches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return batches.filter((batch) => {
      if (lotFilter !== 'all' && lotStatusBucket(batch.status) !== lotFilter) return false;
      if (!q) return true;
      const bid = String(batch.batchId ?? '').toLowerCase();
      const sid = String(batch.id ?? '').toLowerCase();
      const pname = `${batch.productName ?? ''} ${productNameLabel(t, batch.productName)}`.toLowerCase();
      const ename = String(batch.estates?.name ?? '').toLowerCase();
      return bid.includes(q) || sid.includes(q) || pname.includes(q) || ename.includes(q);
    });
  }, [batches, searchTerm, lotFilter, t]);

  const groupedLots = useMemo(() => groupLotsByEstate(filteredBatches), [filteredBatches]);

  const lotFilterChips: { id: LotFilter; label: string; count: number }[] = [
    { id: 'all', label: t('growerPages.allStatuses'), count: lotCounts.all },
    { id: 'here', label: t('growerPages.filterHere'), count: lotCounts.here },
    { id: 'moving', label: t('growerPages.filterMoving'), count: lotCounts.moving },
    { id: 'done', label: t('growerPages.filterDone'), count: lotCounts.done },
  ];

  const handleViewDetails = async (batch: Batch) => {
    setSelectedBatch(batch);
    setBatchDetailsError(null);
    setPassportCompleteness(null);
    setPassportCompletenessError(null);
    setLoadingDetails(true);
    const traceRef = String(batch.batchId ?? batch.id ?? '').trim();
    if (!traceRef) {
      setBatchDetails(null);
      setBatchDetailsError(t('growerPages.batchDetailsLoadFailed'));
      setLoadingDetails(false);
      return;
    }
    try {
      const [details, completeness] = await Promise.all([
        batchesAPI.getOne(traceRef),
        batchesAPI.getPassportCompleteness(traceRef).catch(() => null),
      ]);
      setBatchDetails(details);
      if (Array.isArray(completeness)) setPassportCompleteness(completeness as PassportCompletenessItem[]);
      else setPassportCompletenessError(t('growerPages.passportCompletenessLoadFailed', 'Could not load passport checklist.'));
    } catch (err: unknown) {
      console.error('Error loading batch details:', err);
      setBatchDetails(null);
      setBatchDetailsError(growerApiErrorOrT(err, t, 'growerPages.batchDetailsLoadFailed'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCheckLoadingApproval = async (batch: Batch) => {
    setCheckingApproval(true);
    setApprovalNotice(null);
    try {
      const result = await standardEngineAPI.checkLoadingApproval(batch.id);
      setLoadingApproval(result);
    } catch (err: unknown) {
      console.error('Error checking loading approval:', err);
      setApprovalNotice({
        type: 'error',
        message: growerApiErrorOrT(err, t, 'grower.batchesApproval.checkFailed'),
      });
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleApproveForLoading = async (batch: Batch) => {
    if (!window.confirm(t('grower.batchesApproval.confirmApprove'))) {
      return;
    }

    setApproving(true);
    setApprovalNotice(null);
    try {
      await standardEngineAPI.approveForLoading(batch.id);
      setApprovalNotice({ type: 'success', message: t('grower.batchesApproval.approvedOk') });
      setLoadingApproval(null);
      void loadBatches();
    } catch (err: unknown) {
      console.error('Error approving for loading:', err);
      setApprovalNotice({
        type: 'error',
        message: growerApiErrorOrT(err, t, 'grower.batchesApproval.approveFailed'),
      });
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status: string) =>
    `inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${lotStatusPillClass(status)}`;

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'HARVESTED':
        return <CheckCircle className="w-4 h-4" />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4" />;
      case 'AT_HUB':
        return <MapPin className="w-4 h-4" />;
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      case 'SOLD':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title={t('grower.nav.myBatches')} navItems={navItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto"></div>
              <p className="mt-4 text-base text-gray-600">{t('growerPages.loadingBatches')}</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('grower.nav.myBatches')} navItems={navItems}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.nav.myBatches')}
            description={t('growerPages.batchesLeadOneLine')}
            right={
              <Link
                href={loc('/grower/fields')}
                className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('growerPages.addLotCta')}
              </Link>
            }
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
              <p className="font-medium">
                {t('growerPages.error')}: {error}
              </p>
            </div>
          )}

          {approvalNotice && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-base ${
                approvalNotice.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
              role="status"
            >
              <p className="font-medium">{approvalNotice.message}</p>
              <button
                type="button"
                onClick={() => setApprovalNotice(null)}
                className="mt-2 text-sm underline opacity-90 hover:opacity-100"
              >
                {t('common.close')}
              </button>
            </div>
          )}

          <div className="mb-5 max-w-3xl space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('growerPages.searchBatchesPlaceholder')}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {lotFilterChips.map((chip) => {
                const sel = lotFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setLotFilter(chip.id)}
                    className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      sel
                        ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#2D5A27]'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {chip.label}
                    {chip.count > 0 ? ` (${chip.count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredBatches.length > 0 ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('growerPages.listCountLabel', { count: filteredBatches.length })}
            </p>
          ) : null}

          <div className="max-w-3xl space-y-6">
            {filteredBatches.length > 0 ? (
              groupedLots.map((section) => (
                <section key={section.title}>
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('growerPages.lotsGroupedByEstate', { estate: section.title })}
                  </h2>
                  <ul className="space-y-2">
                    {section.items.map((batch) => {
                      const bucket = lotStatusBucket(batch.status);
                      const accent =
                        bucket === 'done'
                          ? 'border-gray-300'
                          : bucket === 'moving'
                            ? 'border-blue-500'
                            : 'border-[#2D5A27]';
                      const metaParts = [
                        productNameLabel(t, batch.productName),
                        batch.quantity != null ? `${batch.quantity} ${batch.unit}` : null,
                        batch.harvestDate
                          ? new Date(batch.harvestDate).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                            })
                          : null,
                        batch.parcels?.cropType || batch.parcels?.name || null,
                      ].filter(Boolean);

                      return (
                        <li key={batch.id}>
                          <button
                            type="button"
                            onClick={() => handleViewDetails(batch)}
                            className={`flex w-full min-h-[72px] items-start gap-3 rounded-xl border border-gray-200 border-l-4 bg-white p-4 text-left shadow-sm transition-colors hover:border-[#2D5A27]/30 ${accent}`}
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2D5A27]/10">
                              <Package className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <LotIdsBlock lot={batch} compact />
                                <span className={getStatusColor(batch.status)}>
                                  {getBatchStatusLabel(t, batch.status)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm text-gray-600">{metaParts.join(' · ')}</p>
                            </div>
                            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" strokeWidth={1.25} aria-hidden />
                <p className="mx-auto max-w-md text-base font-light text-gray-600">
                  {batches.length === 0 ? t('growerPages.noBatches') : t('growerPages.noBatchesFilter')}
                </p>
              </div>
            )}
          </div>

          {/* Batch Details Modal */}
          {selectedBatch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <LotIdsBlock lot={selectedBatch} />
                      <p className="text-base text-gray-600 mt-2">{productNameLabel(t, selectedBatch.productName)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatch(null);
                        setBatchDetails(null);
                        setBatchDetailsError(null);
                      }}
                      className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 text-xl leading-none"
                      aria-label={t('common.close')}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
                    </div>
                  ) : batchDetailsError ? (
                    <div
                      className="rounded-lg border border-red-200 bg-red-50 p-4 text-base text-red-900"
                      role="alert"
                    >
                      {batchDetailsError}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {passportCompleteness ? (
                        <PassportCompletenessPanel items={passportCompleteness} localizeHref={loc} />
                      ) : passportCompletenessError ? (
                        <p className="text-sm text-gray-500">{passportCompletenessError}</p>
                      ) : null}
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-base font-medium text-gray-700">{t('growerPages.status')}</label>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                                selectedBatch.status
                              )}`}
                            >
                              {getStatusIcon(selectedBatch.status)}
                              {getBatchStatusLabel(t, selectedBatch.status)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-base font-medium text-gray-700">{t('growerPages.batchDetailQuantity')}</label>
                          <p className="mt-1 text-base text-gray-900">
                            {selectedBatch.quantity} {selectedBatch.unit}
                          </p>
                        </div>
                        <div>
                          <label className="text-base font-medium text-gray-700">{t('growerPages.batchDetailHarvestDate')}</label>
                          <p className="mt-1 text-base text-gray-900">
                            {new Date(selectedBatch.harvestDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-base font-medium text-gray-700">{t('growerPages.batchDetailEstate')}</label>
                          <p className="mt-1 text-base text-gray-900">
                            {selectedBatch.estates?.name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Traceability — human-readable; raw JSON available for support */}
                      {batchDetails && (
                        <div className="border-t border-gray-200 pt-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {t('growerPages.traceabilityTitle')}
                          </h3>
                          <p className="text-base text-gray-600 font-light mb-4 leading-relaxed">
                            {t('growerPages.traceabilityIntro')}
                          </p>
                          {batchDetails.traceability ? (
                            <div className="space-y-4 text-base">
                              {batchDetails.traceability.origin?.estate && (
                                <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
                                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                    {t('growerPages.traceabilityOrigin')}
                                  </p>
                                  <p className="text-gray-900">
                                    Estate: {batchDetails.traceability.origin.estate.name}
                                    {batchDetails.traceability.origin.estate.owner?.name && (
                                      <span className="text-gray-600">
                                        {' '}
                                        · Owner: {batchDetails.traceability.origin.estate.owner.name}
                                      </span>
                                    )}
                                  </p>
                                  {batchDetails.traceability.origin.parcel && (
                                    <p className="text-gray-600 mt-1">
                                      Parcel: {batchDetails.traceability.origin.parcel.cropType || '—'}
                                    </p>
                                  )}
                                </div>
                              )}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-100 p-4">
                                  <p className="text-sm font-semibold text-gray-600 mb-1">{t('growerPages.traceabilityHarvestedBy')}</p>
                                  <p className="text-gray-900">
                                    {batchDetails.traceability.harvestedBy?.name || '—'}
                                  </p>
                                </div>
                                <div className="rounded-lg border border-gray-100 p-4">
                                  <p className="text-sm font-semibold text-gray-600 mb-1">{t('growerPages.traceabilityTransportedBy')}</p>
                                  <p className="text-base text-gray-900">
                                    {batchDetails.traceability.transportedBy?.name || (
                                      <span className="text-amber-800">{t('growerPages.traceabilityNotAssignedYet')}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-lg border border-gray-100 p-4">
                                <p className="text-sm font-semibold text-gray-600 mb-1">{t('growerPages.traceabilityCurrentLocation')}</p>
                                <p className="text-base text-gray-900">
                                  {formatCurrentLocation(batchDetails.traceability.currentLocation)}
                                </p>
                              </div>
                              {Array.isArray(batchDetails.traceability.locationHistory) &&
                                batchDetails.traceability.locationHistory.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">{t('growerPages.traceabilityLocationHistory')}</p>
                                    <ul className="space-y-2">
                                      {batchDetails.traceability.locationHistory.map(
                                        (entry: Record<string, unknown>, idx: number) => (
                                          <li
                                            key={idx}
                                            className="rounded border border-gray-100 bg-white px-3 py-3 text-base text-gray-700"
                                          >
                                            {String(entry.status ?? '—')}
                                            {entry.driverId != null && ` · driver set`}
                                            {entry.hubId != null && ` · hub`}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {Array.isArray(batchDetails.traceability.orders) &&
                                batchDetails.traceability.orders.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold text-gray-600 mb-2">{t('growerPages.traceabilityLinkedOrders')}</p>
                                    <ul className="list-disc pl-5 text-gray-700">
                                      {batchDetails.traceability.orders.map(
                                        (o: { orderNumber?: string; orderId?: string }) => (
                                          <li key={o.orderId || o.orderNumber}>
                                            {o.orderNumber || o.orderId}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {['PACKED', 'QUALITY_VERIFIED'].includes(
                                (selectedBatch.status || '').toUpperCase(),
                              ) && (
                                <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <p className="text-base text-gray-800 leading-relaxed">
                                    {t('growerPages.traceabilityPickupHint')}
                                  </p>
                                  <Link
                                    href={loc('/grower/missions/create')}
                                    className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white hover:bg-[#23471f] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                                  >
                                    {t('growerPages.requestTransport')}
                                  </Link>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowTraceabilityJson((v) => !v)}
                                className="text-sm text-gray-600 hover:text-gray-900 underline min-h-[44px] px-1"
                              >
                                {showTraceabilityJson ? t('growerPages.traceabilityHideRawJson') : t('growerPages.traceabilityShowRawJson')}
                              </button>
                              {showTraceabilityJson && (
                                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-100 rounded-lg p-4 overflow-x-auto">
                                  {JSON.stringify(batchDetails, null, 2)}
                                </pre>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <pre className="text-base text-gray-700 whitespace-pre-wrap">
                                {JSON.stringify(batchDetails, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Standard Engine - Loading Approval */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {t('growerPages.standardComplianceTitle')}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleCheckLoadingApproval(selectedBatch!)}
                            disabled={checkingApproval}
                            className="inline-flex items-center min-h-[48px] px-4 py-3 border-2 border-[#2D5A27] text-[#2D5A27] bg-white text-base font-medium rounded-lg hover:bg-[#f7faf6] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                          >
                            <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                            {checkingApproval ? t('growerPages.standardChecking') : t('growerPages.standardCheckRequirements')}
                          </button>
                        </div>
                        {loadingApproval && (
                          <div className="space-y-3 mb-4">
                            {Object.entries(loadingApproval.checklist || {}).map(([key, item]: [string, any]) => (
                              <div
                                key={key}
                                className={`p-3 rounded-lg border ${
                                  item.passed
                                    ? 'bg-[#f7faf6] border-[#2D5A27]/20'
                                    : 'bg-red-50 border-red-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {item.passed ? (
                                      <CheckCircle className="w-5 h-5 text-[#2D5A27]" />
                                    ) : (
                                      <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <span className="font-medium text-base text-gray-900">{item.requirement}</span>
                                  </div>
                                </div>
                                <p className="text-base text-gray-600 mt-1 ml-7 leading-relaxed">{item.message}</p>
                              </div>
                            ))}
                            {loadingApproval.canApprove ? (
                              <button
                                type="button"
                                onClick={() => handleApproveForLoading(selectedBatch!)}
                                disabled={approving}
                                className="w-full inline-flex items-center justify-center min-h-[52px] px-4 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                              >
                                <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
                                {approving ? t('growerPages.standardApproving') : t('growerPages.standardApproveForLoading')}
                              </button>
                            ) : (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-base text-yellow-900 leading-relaxed">
                                  {t('growerPages.standardCompleteAllFirst')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('growerPages.batchActionsTitle')}</h3>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" className="inline-flex items-center min-h-[48px] px-4 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2">
                            <QrCode className="w-5 h-5 mr-2 shrink-0" />
                            {t('growerPages.batchActionViewQr')}
                          </button>
                          <button type="button" className="inline-flex items-center min-h-[48px] px-4 py-3 bg-white border border-gray-300 text-gray-800 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2">
                            <Truck className="w-5 h-5 mr-2 shrink-0" />
                            {t('growerPages.batchActionMoveToHub')}
                          </button>
                          <button type="button" className="inline-flex items-center min-h-[48px] px-4 py-3 bg-white border border-red-300 text-red-800 text-base font-medium rounded-lg hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2">
                            <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                            {t('growerPages.batchActionReportIssue')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

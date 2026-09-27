'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { deliveriesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { Truck, MapPin, Calendar, Package, Clock, CheckCircle, XCircle, Eye, QrCode, Search, RefreshCw, FileDown, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import BuyerReceivingStep from '@/components/buyer/BuyerReceivingStep';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';

const REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Start of buyer 24h issue window — after takeover confirmation (portal or QR), not dock receipt. */
function buyerIssueWindowStart(
  delivery: {
    buyerPickupConfirmedAt?: string | null;
    confirmedAt?: string | null;
  } | null,
): Date | null {
  const raw = delivery?.buyerPickupConfirmedAt ?? delivery?.confirmedAt ?? null;
  if (!raw) return null;
  const d = new Date(raw as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

function canBuyerReportDeliveryIssue(delivery: {
  status?: string;
  buyerPickupConfirmedAt?: string | null;
  confirmedAt?: string | null;
} | null): boolean {
  if (!delivery || delivery.status === 'CANCELLED') return false;
  const at = buyerIssueWindowStart(delivery);
  if (!at) return false;
  return Date.now() - at.getTime() <= REPORT_WINDOW_MS;
}

function needsBuyerPickupConfirmation(delivery: {
  status?: string;
  buyerPickupConfirmedAt?: string | null;
  digital_handovers?: { status?: string } | null;
}): boolean {
  return (
    delivery.status === 'DELIVERED' &&
    delivery.digital_handovers?.status === 'COMPLETED' &&
    !delivery.buyerPickupConfirmedAt
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

export default function DeliveriesPage() {
  const { t } = useTranslation();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [issueTarget, setIssueTarget] = useState<any | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePhotos, setIssuePhotos] = useState<{ preview: string; dataUrl: string }[]>([]);
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueLocalError, setIssueLocalError] = useState<string | null>(null);
  const [pickupSubmittingId, setPickupSubmittingId] = useState<string | null>(null);
  const errorRef = useRef<string | null>(null);
  errorRef.current = error;

  const openIssueModal = useCallback((delivery: any) => {
    setIssueTarget(delivery);
    setIssueDescription('');
    setIssuePhotos([]);
    setIssueLocalError(null);
  }, []);

  const closeIssueModal = useCallback(() => {
    if (issueSubmitting) return;
    setIssueTarget(null);
    setIssueDescription('');
    setIssuePhotos([]);
    setIssueLocalError(null);
  }, [issueSubmitting]);

  const onIssueFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: { preview: string; dataUrl: string }[] = [...issuePhotos];
    const maxFiles = 6;
    const maxBytes = 1_700_000;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const list = Array.from(files);
    for (const f of list) {
      if (next.length >= maxFiles) break;
      if (!allowed.includes(f.type)) {
        setIssueLocalError(t('buyerPortalDeliveries.reportIssueBadFileType'));
        continue;
      }
      if (f.size > maxBytes) {
        setIssueLocalError(t('buyerPortalDeliveries.reportIssueFileTooLarge'));
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(f);
        next.push({ preview: URL.createObjectURL(f), dataUrl });
      } catch {
        setIssueLocalError(t('common.apiErrorGeneric'));
      }
    }
    setIssuePhotos(next);
  };

  const removeIssuePhoto = (idx: number) => {
    setIssuePhotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return copy;
    });
  };

  const submitIssue = async () => {
    if (!issueTarget?.id) return;
    const desc = issueDescription.trim();
    if (issuePhotos.length === 0) {
      setIssueLocalError(t('buyerPortalDeliveries.reportIssuePhotosRequired'));
      return;
    }
    if (desc.length < 20) {
      setIssueLocalError(t('buyerPortalDeliveries.reportIssueDescMin'));
      return;
    }
    setIssueSubmitting(true);
    setIssueLocalError(null);
    try {
      await deliveriesAPI.reportBuyerIssue({
        deliveryId: issueTarget.id,
        description: desc,
        photosBase64: issuePhotos.map((p) => p.dataUrl),
      });
      alert(t('buyerPortalDeliveries.reportIssueSuccess'));
      closeIssueModal();
      await loadDeliveries();
    } catch (err: unknown) {
      setIssueLocalError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setIssueSubmitting(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(() => {
      if (!errorRef.current) loadDeliveries();
    }, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveriesAPI.getBuyerDeliveries(statusFilter !== 'all' ? statusFilter : undefined);
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const e = err as {
        code?: string;
        message?: string;
        isAxiosError?: boolean;
        response?: unknown;
      };
      const isNetworkError =
        e?.code === 'ERR_NETWORK' ||
        e?.message === 'Network Error' ||
        (Boolean(e?.isAxiosError) && !e?.response);
      const message = isNetworkError
        ? t('buyerPortalDeliveries.networkErrorDeliveries')
        : apiErrorOrT(err, t, 'common.apiErrorGeneric');
      setError(message);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Package className="w-4 h-4 text-emerald-700/70" strokeWidth={1} />;
      case 'CONFIRMED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600/60" strokeWidth={1} />;
      case 'IN_TRANSIT':
        return <Truck className="w-4 h-4 text-yellow-600/60" strokeWidth={1} />;
      case 'PICKED_UP':
        return <Package className="w-4 h-4 text-blue-600/60" strokeWidth={1} />;
      case 'ASSIGNED':
        return <Clock className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-600/60" strokeWidth={1} />;
      default:
        return <Clock className="w-4 h-4 text-gray-600/60" strokeWidth={1} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'border-emerald-200/70 text-emerald-800/80';
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'border-green-200/50 text-green-600/80';
      case 'IN_TRANSIT':
        return 'border-yellow-200/50 text-yellow-600/80';
      case 'PICKED_UP':
        return 'border-blue-200/50 text-blue-600/80';
      case 'ASSIGNED':
        return 'border-gray-200/50 text-gray-600/80';
      case 'CANCELLED':
        return 'border-red-200/50 text-red-600/80';
      default:
        return 'border-gray-200/50 text-gray-600/80';
    }
  };

  const getStatusLabel = (status: string) =>
    t(`buyerPortalDeliveries.deliveryStatus_${status}`, {
      defaultValue: status?.replace(/_/g, ' ') || 'UNKNOWN',
    });

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.deliveryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.estates?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleConfirmDelivery = async (qrCode: string) => {
    try {
      await deliveriesAPI.confirmDelivery(qrCode);
      alert(t('buyerPortalDeliveries.qrConfirmAlertSuccess'));
      loadDeliveries();
    } catch (err: unknown) {
      console.error('Error confirming delivery:', err);
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const handleConfirmPickup = async (deliveryId: string) => {
    setPickupSubmittingId(deliveryId);
    try {
      await deliveriesAPI.confirmBuyerPickup({ deliveryId });
      alert(t('buyerPortalDeliveries.confirmPickupSuccess'));
      setSelectedDelivery(null);
      await loadDeliveries();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setPickupSubmittingId(null);
    }
  };

  const handleDownloadWaybill = async (waybillId: string, waybillNumber: string) => {
    try {
      const blob = await deliveriesAPI.downloadWaybillPdf(waybillId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybill-${waybillNumber || waybillId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.deliveries')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="border-b border-green-200/50 pb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{t('buyerPortalDeliveries.pageHeading')}</h1>
              <p className="text-sm text-gray-600 mt-2 font-light">{t('buyerPortalDeliveries.pageSubtitle')}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="border-b border-green-200/50 pb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" strokeWidth={1} />
                <input
                  type="text"
                  placeholder={t('buyerPortalDeliveries.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 text-sm font-light focus:outline-none focus:border-green-600/50"
                >
                  <option value="all">{t('buyerPortalDeliveries.filterLabelAll')}</option>
                  <option value="ASSIGNED">{t('buyerPortalDeliveries.filter_ASSIGNED')}</option>
                  <option value="PICKED_UP">{t('buyerPortalDeliveries.filter_PICKED_UP')}</option>
                  <option value="IN_TRANSIT">{t('buyerPortalDeliveries.filter_IN_TRANSIT')}</option>
                  <option value="DELIVERED">{t('buyerPortalDeliveries.filter_DELIVERED')}</option>
                  <option value="CONFIRMED">{t('buyerPortalDeliveries.filter_CONFIRMED')}</option>
                  <option value="COMPLETED">{t('buyerPortalDeliveries.filter_COMPLETED')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="font-light">{error}</p>
              <button
                type="button"
                onClick={() => loadDeliveries()}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-sm font-light rounded border border-red-200 transition-colors shrink-0"
              >
                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                {t('buyerPortalDeliveries.retryButton')}
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-light">{t('buyerPortalDeliveries.loadingMessage')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="border-b border-green-200/50 pb-6 hover:border-green-300/50 transition-colors"
                >
                  {delivery.returnCase ? <div className="mb-4 rounded border p-3">
                    <p>{t('returnFlow.title')}: {t(`returnFlow.states.${delivery.returnCase.status}`)}</p>
                    {delivery.returnCase.status === 'RECEIVED' && delivery.returnCase.stockStatus ? <p>{t('returnDisposition.title')}: {t(`returnDisposition.states.${delivery.returnCase.stockStatus}`)}</p> : null}
                    {delivery.returnCase.refund ? <p>{t(`returnFlow.refundStates.${delivery.returnCase.refund.status}`)} · {(delivery.returnCase.refund.amountCents / 100).toFixed(2)} {delivery.returnCase.refund.currency}</p> : null}
                  </div> : null}
                  {[...(delivery.buyer_delivery_issues || []), ...(delivery.digital_handovers?.disputes || [])].map((review: { id: string; description?: string; reason?: string; status: string; outcome?: string; resolution?: string; resolvedAt?: string }) => <div key={review.id} className="mb-4 rounded border border-amber-200 p-3 space-y-2">
                    <p>{review.description || review.reason}</p>
                    <p>{t(`deliveryReview.states.${review.status}`, { defaultValue: review.status })}</p>
                    {review.outcome ? <p>{t(`deliveryReview.outcomes.${review.outcome}`)}</p> : null}
                    {review.resolution ? <p className="whitespace-pre-wrap">{review.resolution}</p> : null}
                    {review.resolvedAt ? <p>{new Date(review.resolvedAt).toLocaleString()}</p> : null}
                  </div>)}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Truck className="w-5 h-5 text-green-600/60" strokeWidth={1} />
                        <h3 className="text-lg font-light text-gray-900">
                          {delivery.deliveryNumber ||
                            t('buyerPortalDeliveries.deliveryFallbackTitle', { slice: delivery.id.slice(0, 8) })}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 font-light">
                        {t('buyerPortalDeliveries.labelOrder')}{' '}
                        {delivery.orders?.orderNumber || t('common.emDash')}
                      </p>
                      <p className="text-sm text-gray-500 font-light">
                        {t('buyerPortalDeliveries.labelProduct')}{' '}
                        {delivery.orders?.productName || t('common.emDash')}
                      </p>
                      <p className="text-sm text-gray-500 font-light">
                        {t('buyerPortalDeliveries.labelSupplier')}{' '}
                        {delivery.orders?.estates?.name || t('common.emDash')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className={`px-3 py-1 text-xs font-light border flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          {getStatusLabel(delivery.status)}
                        </span>
                        {delivery.waybills?.id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadWaybill(delivery.waybills.id, delivery.waybills.waybillNumber)
                            }
                            className="px-3 py-1 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors flex items-center gap-1"
                          >
                            <FileDown className="w-4 h-4" strokeWidth={1} />
                            {t('buyerPortalDeliveries.timelineWaybillPdf')}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDelivery(delivery)}
                          className="px-3 py-1 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" strokeWidth={1} />
                          {t('buyerPortalDeliveries.detailButton')}
                        </button>
                        {canBuyerReportDeliveryIssue(delivery) && (
                          <button
                            type="button"
                            onClick={() => openIssueModal(delivery)}
                            className="px-3 py-1 border border-amber-800/35 bg-amber-50/90 text-sm font-light text-amber-950 hover:bg-amber-100/90 transition-colors flex items-center gap-1"
                          >
                            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                            {t('buyerPortalDeliveries.reportIssueShort')}
                          </button>
                        )}
                      </div>
                      {buyerIssueWindowStart(delivery) && canBuyerReportDeliveryIssue(delivery) && (
                        <p className="text-xs text-amber-900/85 font-light text-right max-w-md">
                          {t('buyerPortalDeliveries.reportIssueDeadline', {
                            time: new Date(
                              buyerIssueWindowStart(delivery)!.getTime() + REPORT_WINDOW_MS,
                            ).toLocaleString(),
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.pickupFrom')}:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {delivery.pickupAddress || delivery.orders?.estates?.name || t('common.emDash')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" strokeWidth={1} />
                      <div>
                        <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.deliveryTo')}:</span>
                        <span className="ml-2 font-light text-gray-900">
                          {typeof delivery.deliveryAddress === 'string'
                            ? delivery.deliveryAddress
                            : delivery.deliveryAddress?.address || t('common.emDash')}
                        </span>
                      </div>
                    </div>
                    {delivery.users && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-400" strokeWidth={1} />
                        <div>
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.deliveryDriver')}:</span>
                          <span className="ml-2 font-light text-gray-900">
                            {delivery.users.firstName} {delivery.users.lastName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-200/50 font-light">
                    {delivery.assignedAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" strokeWidth={1} />
                        <span>
                          {t('buyerPortalDeliveries.assignedShort')}{' '}
                          {new Date(delivery.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {delivery.pickedUpAt && (
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" strokeWidth={1} />
                        <span>
                          {t('buyerPortalDeliveries.pickedUpShort')}{' '}
                          {new Date(delivery.pickedUpAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {delivery.deliveredAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" strokeWidth={1} />
                        <span>
                          {t('buyerPortalDeliveries.dockReceiptShort')}{' '}
                          {new Date(delivery.deliveredAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* QR Code for confirmation (curb / direct scan — also sets takeover time) */}
                  <BuyerReceivingStep delivery={delivery} />

                  {delivery.status === 'IN_TRANSIT' && delivery.deliveryQRCode && !delivery.missionId && !delivery.digital_handovers && (
                    <div className="mt-4 pt-4 border-t border-green-200/50">
                      <p className="text-sm text-gray-600 mb-2 font-light">{t('buyerPortalDeliveries.qrConfirmLead')}</p>
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-3 border border-green-200/50">
                          <QrCode className="w-16 h-16 text-green-600/60" strokeWidth={1} />
                        </div>
                        <button
                          onClick={() => handleConfirmDelivery(delivery.deliveryQRCode)}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors"
                        >
                          {t('buyerPortalDeliveries.qrConfirmButton')}
                        </button>
                      </div>
                    </div>
                  )}

                  {needsBuyerPickupConfirmation(delivery) && (
                    <div className="mt-4 pt-4 border-t border-emerald-200/50 rounded-lg bg-emerald-50/40 p-4 space-y-3">
                      <p className="text-sm text-gray-800 font-light">{t('buyerPortalDeliveries.confirmPickupHint')}</p>
                      <button
                        type="button"
                        disabled={pickupSubmittingId === delivery.id}
                        onClick={() => void handleConfirmPickup(delivery.id)}
                        className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                      >
                        {pickupSubmittingId === delivery.id
                          ? t('buyerPortalDeliveries.confirmPickupDoing')
                          : t('buyerPortalDeliveries.confirmPickupCta')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && filteredDeliveries.length === 0 && (
            <div className="text-center py-12 border-b border-green-200/50">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">{t('buyerPortalDeliveries.emptyTitle')}</p>
              <p className="text-sm text-gray-400 mt-2 font-light">
                {searchTerm ? t('buyerPortalDeliveries.emptyHintSearch') : t('buyerPortalDeliveries.emptyHintNone')}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/buyer-portal/orders"
                  className="inline-flex min-h-[44px] items-center rounded-md bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f]"
                >
                  {t('buyerPortalDeliveries.emptyCtaOrders')}
                </Link>
                <Link
                  href="/buyer-portal/trade-panel"
                  className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  {t('buyerPortalDeliveries.emptyCtaTrade')}
                </Link>
              </div>
            </div>
          )}

          {/* Delivery Details Modal */}
          {selectedDelivery && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6 border-b border-gray-200/50 pb-4">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 mb-2">
                        {t('buyerPortalDeliveries.modalDetailTitle', {
                          number:
                            selectedDelivery.deliveryNumber ||
                            `#${String(selectedDelivery.id).slice(0, 8)}`,
                        })}
                      </h2>
                      <p className="text-sm text-gray-600 font-light">
                        {t('buyerPortalDeliveries.labelOrder')}{' '}
                        {selectedDelivery.orders?.orderNumber || t('common.emDash')}
                      </p>
                      {selectedDelivery.waybills?.id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadWaybill(
                              selectedDelivery.waybills.id,
                              selectedDelivery.waybills.waybillNumber,
                            )
                          }
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-sm font-light hover:border-green-200/50 transition-colors"
                        >
                          <FileDown className="w-4 h-4" strokeWidth={1} />
                          {t('buyerPortalDeliveries.timelineWaybillPdf')}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDelivery(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {/* Delivery Status Timeline */}
                  <div className="mb-6 border-b border-gray-200/50 pb-6">
                    <h3 className="text-sm font-light text-gray-500 mb-4">
                      {t('buyerPortalDeliveries.timelineTitle')}
                    </h3>
                    <div className="space-y-3">
                      {selectedDelivery.assignedAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">
                              {t('buyerPortalDeliveries.timelineAssigned')}
                            </p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.assignedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.pickedUpAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">
                              {t('buyerPortalDeliveries.timelinePickedUp')}
                            </p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.pickedUpAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.inTransitAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-yellow-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">
                              {t('buyerPortalDeliveries.timelineInTransit')}
                            </p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.inTransitAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedDelivery.deliveredAt && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-600/60 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">{t('buyerPortalDeliveries.timelineDockReceipt')}</p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(selectedDelivery.deliveredAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {buyerIssueWindowStart(selectedDelivery) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-emerald-700 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-light text-gray-900">
                              {t('buyerPortalDeliveries.timelineTakeoverConfirmed')}
                            </p>
                            <p className="text-xs text-gray-500 font-light">
                              {new Date(buyerIssueWindowStart(selectedDelivery)!).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-b border-gray-200/50 pb-6">
                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">{t('buyerPortalDeliveries.sectionPickupTitle')}</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelLocation')}</span>
                          <span className="ml-2 font-light text-gray-900">
                            {selectedDelivery.pickupAddress ||
                              selectedDelivery.orders?.estates?.name ||
                              t('common.emDash')}
                          </span>
                        </div>
                        {selectedDelivery.orders?.estates?.users && (
                          <div>
                            <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelSupplier')}</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedDelivery.orders.estates.users.firstName}{' '}
                              {selectedDelivery.orders.estates.users.lastName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-light text-gray-500 mb-4">
                        {t('buyerPortalDeliveries.sectionDeliveryTitle')}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelAddress')}</span>
                          <span className="ml-2 font-light text-gray-900">
                            {typeof selectedDelivery.deliveryAddress === 'string'
                              ? selectedDelivery.deliveryAddress
                              : selectedDelivery.deliveryAddress?.address || t('common.emDash')}
                          </span>
                        </div>
                        {selectedDelivery.users && (
                          <div>
                            <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.deliveryDriver')}:</span>
                            <span className="ml-2 font-light text-gray-900">
                              {selectedDelivery.users.firstName} {selectedDelivery.users.lastName}
                            </span>
                            {selectedDelivery.users.phone && (
                              <span className="ml-2 text-xs text-gray-500 font-light">
                                ({selectedDelivery.users.phone})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  {selectedDelivery.orders && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">
                        {t('buyerPortalDeliveries.sectionOrderTitle')}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelProduct')}</span>
                          <span className="font-light text-gray-900">
                            {selectedDelivery.orders.productName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelQuantity')}</span>
                          <span className="font-light text-gray-900">
                            {selectedDelivery.orders.quantity} {selectedDelivery.orders.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-light">{t('buyerPortalDeliveries.labelTotalAmount')}</span>
                          <span className="font-light text-green-600/80">
                            €{selectedDelivery.orders.totalAmount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {needsBuyerPickupConfirmation(selectedDelivery) && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        {t('buyerPortalDeliveries.confirmPickupCta')}
                      </h3>
                      <p className="text-xs text-gray-600 font-light mb-3">{t('buyerPortalDeliveries.confirmPickupHint')}</p>
                      <button
                        type="button"
                        disabled={pickupSubmittingId === selectedDelivery.id}
                        onClick={() => void handleConfirmPickup(selectedDelivery.id)}
                        className="inline-flex min-h-[48px] items-center rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                      >
                        {pickupSubmittingId === selectedDelivery.id
                          ? t('buyerPortalDeliveries.confirmPickupDoing')
                          : t('buyerPortalDeliveries.confirmPickupCta')}
                      </button>
                    </div>
                  )}

                  {canBuyerReportDeliveryIssue(selectedDelivery) && (
                    <div className="mb-6 border-b border-gray-200 pb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t('buyerPortalDeliveries.reportIssue')}
                      </h3>
                      <p className="text-xs text-gray-600 font-light mb-3">
                        {t('buyerPortalDeliveries.reportIssueIntro')}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const d = selectedDelivery;
                          setSelectedDelivery(null);
                          openIssueModal(d);
                        }}
                        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-amber-800/40 bg-amber-50 px-4 text-sm font-medium text-amber-950 hover:bg-amber-100"
                      >
                        <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
                        {t('buyerPortalDeliveries.reportIssueShort')}
                      </button>
                    </div>
                  )}

                  {/* QR Code for confirmation */}
                  <div className="mb-6">
                    <BuyerReceivingStep delivery={selectedDelivery} />
                  </div>

                  {selectedDelivery.status === 'IN_TRANSIT' && selectedDelivery.deliveryQRCode && !selectedDelivery.missionId && !selectedDelivery.digital_handovers && (
                    <div className="mb-6 border-b border-gray-200/50 pb-6">
                      <h3 className="text-sm font-light text-gray-500 mb-4">
                        {t('buyerPortalDeliveries.modalConfirmQrTitle')}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 font-light">{t('buyerPortalDeliveries.modalConfirmQrLead')}</p>
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-4 border border-green-200/50">
                          <QrCode className="w-24 h-24 text-green-600/60" strokeWidth={1} />
                        </div>
                        <button
                          onClick={() => handleConfirmDelivery(selectedDelivery.deliveryQRCode)}
                          className="px-6 py-3 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors"
                        >
                          {t('buyerPortalDeliveries.qrConfirmButton')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {issueTarget && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="buyer-issue-title"
            >
              <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                <button
                  type="button"
                  onClick={() => closeIssueModal()}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                  aria-label={t('buyerPortalDeliveries.reportIssueCancel')}
                >
                  <XCircle className="h-6 w-6" strokeWidth={1} />
                </button>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-2 pr-10">
                    <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <div>
                      <h2 id="buyer-issue-title" className="text-lg font-medium text-gray-900">
                        {t('buyerPortalDeliveries.reportIssueTitle')}
                      </h2>
                      <p className="text-sm text-gray-600 font-light mt-1">
                        {issueTarget.deliveryNumber || issueTarget.id?.slice?.(0, 8)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 font-light">{t('buyerPortalDeliveries.reportIssueIntro')}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{t('buyerPortalDeliveries.reportIssueLegal')}</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">
                      {t('buyerPortalDeliveries.reportIssuePhotosLabel')}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{t('buyerPortalDeliveries.reportIssuePhotosHint')}</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2D5A27] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                      onChange={(e) => onIssueFiles(e.target.files)}
                      disabled={issueSubmitting}
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {issuePhotos.map((p, i) => (
                        <div key={i} className="relative">
                          <img
                            src={p.preview}
                            alt=""
                            className="h-20 w-20 rounded border border-gray-200 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeIssuePhoto(i)}
                            disabled={issueSubmitting}
                            className="absolute -right-2 -top-2 rounded-full bg-gray-900 text-white p-0.5 text-xs"
                            aria-label={t('buyerPortalDeliveries.reportIssuePhotoRemoveAria')}
                          >
                            <XCircle className="h-4 w-4" strokeWidth={1} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="issue-desc" className="block text-sm font-medium text-gray-800 mb-1">
                      {t('buyerPortalDeliveries.reportIssueDescriptionLabel')}
                    </label>
                    <textarea
                      id="issue-desc"
                      rows={5}
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder={t('buyerPortalDeliveries.reportIssueDescriptionPlaceholder')}
                      disabled={issueSubmitting}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>

                  {issueLocalError && (
                    <p className="text-sm text-red-700">{issueLocalError}</p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => submitIssue()}
                      disabled={issueSubmitting}
                      className="inline-flex min-h-[48px] flex-1 min-w-[140px] items-center justify-center rounded-lg bg-[#2D5A27] hover:bg-[#23471f] px-4 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {issueSubmitting ? t('buyerPortalDeliveries.reportIssueSending') : t('buyerPortalDeliveries.reportIssueSubmit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeIssueModal()}
                      disabled={issueSubmitting}
                      className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      {t('buyerPortalDeliveries.reportIssueCancel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

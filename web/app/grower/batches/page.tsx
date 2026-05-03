'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { batchesAPI, standardEngineAPI } from '@/lib/api';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useAuth } from '@/lib/auth';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import {
  Package,
  Search,
  Filter,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Truck,
  QrCode,
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
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  
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

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [batches, searchTerm, statusFilter, productFilter]);

  const loadBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getAll();
      const rows = Array.isArray(data) ? data : [];
      setBatches(rows);
      setFilteredBatches(rows);
    } catch (err: unknown) {
      console.error('Error loading batches:', err);
      setError(growerApiErrorOrT(err, t, 'growerPages.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const safe = Array.isArray(batches) ? batches : [];
    let filtered = [...safe];
    const q = searchTerm.trim().toLowerCase();

    // Search filter
    if (q) {
      filtered = filtered.filter((batch) => {
        const bid = String(batch.batchId ?? '').toLowerCase();
        const pname = String(batch.productName ?? '').toLowerCase();
        const ename = String(batch.estates?.name ?? '').toLowerCase();
        return bid.includes(q) || pname.includes(q) || ename.includes(q);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((batch) => String(batch.status ?? '') === statusFilter);
    }

    // Product filter
    if (productFilter !== 'all') {
      filtered = filtered.filter((batch) => String(batch.productName ?? '') === productFilter);
    }

    setFilteredBatches(filtered);
  };

  const handleViewDetails = async (batch: Batch) => {
    setSelectedBatch(batch);
    setBatchDetailsError(null);
    setLoadingDetails(true);
    const traceRef = String(batch.batchId ?? batch.id ?? '').trim();
    if (!traceRef) {
      setBatchDetails(null);
      setBatchDetailsError(t('growerPages.batchDetailsLoadFailed'));
      setLoadingDetails(false);
      return;
    }
    try {
      const details = await batchesAPI.getOne(traceRef);
      setBatchDetails(details);
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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'HARVESTED':
        return 'bg-[#e8f0e6] text-[#1a3d17] border-[#2D5A27]/25';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AT_HUB':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'SOLD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  const uniqueProducts = Array.from(
    new Set(batches.map((b) => b.productName).filter((x): x is string => typeof x === 'string' && x.length > 0)),
  ).sort();
  const uniqueStatuses = Array.from(
    new Set(batches.map((b) => b.status).filter((x): x is string => typeof x === 'string' && x.length > 0)),
  ).sort();

  const formatStatusLabel = (status: string | null | undefined) => String(status ?? '').replace(/_/g, ' ');

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
            description={t('growerPages.batchesDescription')}
            right={
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex min-h-[48px] items-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
              >
                <Filter className="mr-2 h-4 w-4" />
                {t('growerPages.filters')}
              </button>
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

          {/* Filters */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">{t('growerPages.search')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('growerPages.searchBatchesPlaceholder')}
                      className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">{t('growerPages.status')}</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
                  >
                    <option value="all">{t('growerPages.allStatuses')}</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Filter */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">{t('growerPages.product')}</label>
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
                  >
                    <option value="all">{t('growerPages.allProducts')}</option>
                    {uniqueProducts.map((product) => (
                      <option key={product} value={product}>
                        {product}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter !== 'all' || productFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setProductFilter('all');
                  }}
                  className="mt-4 inline-flex min-h-[44px] items-center text-base text-[#2D5A27] hover:text-[#23471f] font-medium"
                >
                  {t('growerPages.clearFilters')}
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900">{batches.length}</div>
              <div className="text-base text-gray-600 mt-1">{t('growerPages.totalBatches')}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-[#2D5A27]">
                {batches.filter((b) => b.status === 'HARVESTED').length}
              </div>
              <div className="text-base text-gray-600 mt-1">{t('growerPages.harvested')}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-blue-600">
                {batches.filter((b) => b.status === 'IN_TRANSIT').length}
              </div>
              <div className="text-base text-gray-600 mt-1">{t('growerPages.inTransit')}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-purple-600">
                {batches.filter((b) => b.status === 'SOLD').length}
              </div>
              <div className="text-base text-gray-600 mt-1">{t('growerPages.sold')}</div>
            </div>
          </div>

          {/* Batches List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredBatches.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {batch.batchId}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(
                              batch.status
                            )}`}
                          >
                            {getStatusIcon(batch.status)}
                            {formatStatusLabel(batch.status)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-base text-gray-600">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{batch.productName}</span>
                            <span className="text-gray-500">
                              • {batch.quantity} {batch.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-base text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>
                              {t('growerPages.harvestedOn')}{' '}
                              {new Date(batch.harvestDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-base text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {batch.estates?.name || t('growerPages.na')}
                              {(batch.parcels?.cropType || batch.parcels?.name)
                                ? ` • ${batch.parcels?.cropType || batch.parcels?.name}`
                                : ''}
                            </span>
                          </div>
                        </div>

                        {batch.hubs && (
                          <div className="mt-2 text-base text-gray-600">
                            <span className="font-medium">{t('growerPages.currentLocation')}</span>{' '}
                            {batch.hubs.name}
                            {batch.hubs.city && `, ${batch.hubs.city}`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(batch)}
                          className="inline-flex items-center min-h-[48px] px-4 py-3 bg-[#2D5A27] text-white text-base font-medium rounded-lg hover:bg-[#23471f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('growerPages.viewDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-base text-gray-600 font-light max-w-md mx-auto">
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
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {t('growerPages.batchDetailsHeading', { batchId: selectedBatch.batchId })}
                      </h2>
                      <p className="text-base text-gray-600 mt-1">{selectedBatch.productName}</p>
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
                              {formatStatusLabel(selectedBatch.status)}
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

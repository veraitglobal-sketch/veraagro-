'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { MapPin, Check, X, Clock, User } from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateEn } from '@/lib/en-locale-dates';

interface PendingEstate {
  id: string;
  name: string;
  calculatedArea: number;
  status: string;
  createdAt: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    partnerCode: string;
  };
  parcels: Array<{
    id: string;
    cropType: string;
    calculatedArea: number;
  }>;
  _count: {
    parcels: number;
  };
}

export default function EstatesApprovalPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [estates, setEstates] = useState<PendingEstate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingEstates();
  }, []);

  const loadPendingEstates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await estatesAPI.getPendingEstates();
      setEstates(data);
    } catch (err: unknown) {
      console.error('Error loading pending estates:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (estateId: string) => {
    if (!confirm('Are you sure you want to approve this estate?')) return;

    try {
      setProcessing(estateId);
      await estatesAPI.approveEstate(estateId);
      await loadPendingEstates();
      alert('Estate approved successfully!');
    } catch (err: unknown) {
      console.error('Error approving estate:', err);
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (estateId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessing(estateId);
      await estatesAPI.rejectEstate(estateId, reason);
      await loadPendingEstates();
      alert('Estate rejected.');
    } catch (err: unknown) {
      console.error('Error rejecting estate:', err);
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setProcessing(null);
    }
  };

  const formatArea = (area: number) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    }
    return `${area.toFixed(2)} m²`;
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.estates')} navItems={adminNavItems}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Estate Approval</h1>
              <p className="text-sm text-gray-600 mt-1">Review and approve pending estates</p>
            </div>
            <button
              onClick={loadPendingEstates}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading pending estates...</p>
              </div>
            </div>
          ) : estates.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending estates to review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {estates.map((estate) => (
                <div
                  key={estate.id}
                  className="bg-white rounded-lg shadow border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-gray-900">{estate.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Owner</p>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-medium text-gray-900">
                              {estate.users.firstName} {estate.users.lastName}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {estate.users.email} • {estate.users.partnerCode}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Area</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatArea(estate.calculatedArea)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Parcels</p>
                          <p className="text-sm font-medium text-gray-900">
                            {estate._count.parcels} parcel{estate._count.parcels !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Created</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateEn(estate.createdAt)}
                          </p>
                        </div>
                      </div>

                      {estate.parcels.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Parcels:</p>
                          <div className="flex flex-wrap gap-2">
                            {estate.parcels.map((parcel) => (
                              <span
                                key={parcel.id}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {parcel.cropType || 'No crop'} ({formatArea(parcel.calculatedArea)})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(estate.id)}
                        disabled={processing === estate.id}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processing === estate.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(estate.id)}
                        disabled={processing === estate.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

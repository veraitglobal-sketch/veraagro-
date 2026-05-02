'use client';

/**
 * Admin HACCP Monitoring – real-time table
 * Farmer | Batch | Load temp | Compliance photos | HACCP Status
 */

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { haccpAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { Shield, RefreshCw, CheckCircle, Clock, XCircle, Thermometer } from 'lucide-react';
import Link from 'next/link';

interface HaccpRow {
  batchId: string;
  farmerName: string;
  farmerId: string;
  productName: string;
  harvestDate: string;
  loadTemperature?: number;
  loadTemperatureOk: boolean;
  compliancePhotosCount: number;
  requiredPhotosCount: number;
  haccpStatus: 'VERIFIED' | 'PENDING' | 'FAIL';
  lastUpdated: string;
}

export default function HaccpMonitoringPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [rows, setRows] = useState<HaccpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await haccpAPI.getOverview();
      setRows(data ?? []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatDate = (iso: string) => {
    if (!iso) return '–';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '–';
    try {
      return new Date(iso).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const StatusBadge = ({ status }: { status: HaccpRow['haccpStatus'] }) => {
    if (status === 'VERIFIED')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3.5 h-3.5" />
          Verified
        </span>
      );
    if (status === 'FAIL')
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3.5 h-3.5" />
          Fail
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <Clock className="w-3.5 h-3.5" />
        Pending
      </span>
    );
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.haccp')} navItems={adminNavItems}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-light text-gray-900">HACCP Monitoring</h1>
              <p className="text-sm text-gray-500 mt-1">
                Real-time compliance: load temperature, hygiene photos
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2D5A27] bg-[#2D5A27]/10 rounded-lg hover:bg-[#2D5A27]/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <RefreshCw className="w-10 h-10 text-gray-300 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading HACCP data…</p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No batches for HACCP monitoring yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Farmer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Load temp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Photos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        HACCP status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Track
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((r) => (
                      <tr key={r.batchId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/farm/${r.farmerId}`}
                            className="text-sm font-medium text-[#2D5A27] hover:underline"
                          >
                            {r.farmerName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {r.batchId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {r.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {r.loadTemperature != null ? (
                            <span
                              className={`inline-flex items-center gap-1 text-sm ${
                                r.loadTemperatureOk ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              <Thermometer className="w-4 h-4" />
                              {r.loadTemperature}°C
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {r.compliancePhotosCount}/{r.requiredPhotosCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={r.haccpStatus} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatTime(r.lastUpdated)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link
                            href={`/track/${r.batchId}`}
                            className="text-sm font-medium text-[#2D5A27] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

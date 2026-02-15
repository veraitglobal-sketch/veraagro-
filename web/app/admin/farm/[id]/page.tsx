'use client';

/**
 * Farm Detail View – single farmer overview (not just a table)
 * Pulls: field photos, lab results, Sedex status, estates, parcels, batches, treatment logs
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { getFarmDetail, FarmDetailData } from '@/lib/farm-detail-api';
import { getAdminNavItems } from '@/lib/admin-nav';
import {
  User,
  MapPin,
  Image as ImageIcon,
  FlaskConical,
  Shield,
  Package,
  FileText,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const farmerId = params?.id as string;
  const adminNavItems = getAdminNavItems();
  const [data, setData] = useState<FarmDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) return;
    loadData();
  }, [farmerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFarmDetail(farmerId);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to load farm detail');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title="Farm Detail" navItems={adminNavItems}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-500">Loading...</div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error || !data) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title="Farm Detail" navItems={adminNavItems}>
          <div className="p-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <div className="text-red-600">{error || 'Farmer not found'}</div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  const { farmer, estates, fieldPhotos, compliancePhotos, labResults, sedexStatus } = data;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Farm Detail" navItems={adminNavItems}>
        <div className="p-6 max-w-5xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to users
          </button>

          {/* Farmer header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-[#2D5A27]/10 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-[#2D5A27]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-gray-900">
                  {farmer.firstName} {farmer.lastName}
                </h1>
                {farmer.partnerCode && (
                  <p className="text-sm text-gray-500 mt-1">Partner code: {farmer.partnerCode}</p>
                )}
                {farmer.email && (
                  <p className="text-sm text-gray-500">{farmer.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Field photos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Field photos</h2>
              </div>
              {fieldPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {fieldPhotos.slice(0, 9).map((p) => (
                    <a
                      key={p.id}
                      href={p.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg bg-gray-100 overflow-hidden hover:opacity-90"
                    >
                      <img
                        src={p.imageUrl}
                        alt="Field"
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No field photos yet</p>
              )}
            </div>

            {/* Lab results */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Lab results</h2>
              </div>
              {labResults && labResults.length > 0 ? (
                <div className="space-y-2">
                  {labResults.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      {r.labResultUrl ? (
                        <a
                          href={r.labResultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2D5A27] hover:underline flex items-center gap-1"
                        >
                          {r.labTestDate
                            ? new Date(r.labTestDate).toLocaleDateString()
                            : 'Lab result'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-gray-500">
                          {r.labTestDate
                            ? new Date(r.labTestDate).toLocaleDateString()
                            : 'Lab result'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No lab results yet</p>
              )}
            </div>

            {/* Sedex status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Sedex / audit status</h2>
              </div>
              {sedexStatus ? (
                <div className="space-y-1">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      sedexStatus.status === 'PASS'
                        ? 'bg-green-100 text-green-800'
                        : sedexStatus.status === 'FAIL'
                        ? 'bg-red-100 text-red-800'
                        : sedexStatus.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {sedexStatus.status}
                  </span>
                  {sedexStatus.lastChecked && (
                    <p className="text-sm text-gray-500">
                      Last checked: {new Date(sedexStatus.lastChecked).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No Sedex / audit data yet</p>
              )}
            </div>

            {/* Compliance photos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Compliance photos</h2>
              </div>
              {compliancePhotos && compliancePhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {compliancePhotos.slice(0, 6).map((p) => (
                    <a
                      key={p.id}
                      href={p.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg bg-gray-100 overflow-hidden hover:opacity-90"
                    >
                      <img
                        src={p.photoUrl}
                        alt={p.photoType || 'Compliance'}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No compliance photos yet</p>
              )}
            </div>
          </div>

          {/* Estates & parcels */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#2D5A27]" />
              <h2 className="font-semibold text-gray-900">Estates & parcels</h2>
            </div>
            {estates && estates.length > 0 ? (
              <div className="space-y-4">
                {estates.map((e: any) => (
                  <div key={e.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="font-medium text-gray-900">{e.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {e.calculatedArea != null ? `${e.calculatedArea} m²` : ''}
                      {e.status && ` • ${e.status}`}
                    </div>
                    {e.parcels && e.parcels.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {e.parcels.map((p: any) => (
                          <span
                            key={p.id}
                            className="px-2 py-1 rounded bg-gray-100 text-sm text-gray-700"
                          >
                            {p.cropType || 'Parcel'} ({p.calculatedArea ?? '?'} m²)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No estates yet</p>
            )}
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

'use client';

/**
 * Farm Detail View – single farmer overview (not just a table)
 * Pulls: field photos, lab results, Sedex status, estates, parcels, batches, treatment logs
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { getFarmDetailSplit, FarmDetailData } from '@/lib/farm-detail-api';
import { getAdminNavItems } from '@/lib/admin-nav';
import {
  User,
  MapPin,
  Image as ImageIcon,
  FlaskConical,
  Shield,
  Package,
  ChevronLeft,
  ExternalLink,
  BarChart3,
  Fingerprint,
  HeartHandshake,
  ClipboardList,
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
      const result = await getFarmDetailSplit(farmerId);
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

  const {
    farmer,
    estates,
    fieldPhotos,
    compliancePhotos,
    labResults,
    sedexStatus,
    counts,
    trust,
    kycDocuments,
    materialBalance,
    complianceLogs,
    batches,
  } = data;

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

          {counts && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 mb-6">
              {(
                [
                  ['Estates', counts.estates],
                  ['Parcels', counts.parcels],
                  ['Batches', counts.batches],
                  ['Treatments', counts.treatmentLogs],
                  ['Compliance', counts.complianceLogs],
                  ['Growth', counts.growthLogs],
                  ['Missions', counts.missions],
                ] as const
              ).map(([label, n]) => (
                <div
                  key={label}
                  className="bg-white rounded-lg border border-gray-200 p-3 text-center"
                >
                  <div className="text-2xl font-semibold text-[#2D5A27] tabular-nums">{n}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {(materialBalance != null || trust != null) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {materialBalance && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-[#2D5A27]" />
                    <h2 className="font-semibold text-gray-900">Material balance (Bio Vera stock)</h2>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    <li>Crates: {materialBalance.crateBalance}</li>
                    <li>Label rolls: {materialBalance.labelRollBalance}</li>
                    <li>Film (m): {materialBalance.filmMeterBalance}</li>
                    <li className="text-xs text-gray-500 pt-1">
                      Updated: {new Date(materialBalance.lastUpdated).toLocaleString()}
                    </li>
                  </ul>
                </div>
              )}
              {trust && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <HeartHandshake className="w-5 h-5 text-[#2D5A27]" />
                    <h2 className="font-semibold text-gray-900">Trust & ratings</h2>
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1.5">
                    <li>Current score: {trust.currentScore}</li>
                    <li>Farmer score: {trust.farmerScore ?? '—'}</li>
                    <li>
                      Avg rating: {trust.averageRating} ({trust.totalRatings} total)
                    </li>
                    <li className="text-xs text-gray-500">
                      Last updated: {new Date(trust.lastUpdated).toLocaleString()}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {kycDocuments && kycDocuments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Fingerprint className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">KYC documents</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Created</th>
                      <th className="py-2">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kycDocuments.map((d) => (
                      <tr key={d.id} className="border-b border-gray-50">
                        <td className="py-2 pr-4 text-gray-900">{d.docType}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={
                              d.status === 'APPROVED' || d.status === 'VERIFIED'
                                ? 'text-green-700'
                                : d.status === 'REJECTED'
                                ? 'text-red-600'
                                : 'text-amber-700'
                            }
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-gray-600">
                          {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-2 text-gray-600">
                          {d.verifiedAt ? new Date(d.verifiedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {complianceLogs && complianceLogs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Field diary & scan compliance (recent)</h2>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto text-sm">
                <table className="min-w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Compliant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceLogs.slice(0, 30).map((c) => (
                      <tr key={c.id} className="border-b border-gray-50">
                        <td className="py-1.5 pr-3 text-gray-600 whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
                        </td>
                        <td className="py-1.5 pr-3 text-gray-900">{c.entryType}</td>
                        <td className="py-1.5 pr-3">{c.complianceStatus}</td>
                        <td className="py-1.5">{c.isCompliant ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batches && batches.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#2D5A27]" />
                <h2 className="font-semibold text-gray-900">Recent batches</h2>
              </div>
              <div className="overflow-x-auto text-sm">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="py-2 pr-3">Batch ID</th>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2 pr-3">Quantity</th>
                      <th className="py-2 pr-3">Harvest</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.slice(0, 25).map((b) => (
                      <tr key={b.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-mono text-gray-900">{b.batchId}</td>
                        <td className="py-2 pr-3 text-gray-800">{b.productName}</td>
                        <td className="py-2 pr-3 text-gray-700">
                          {b.quantity}
                          {b.unit != null && b.unit !== '' ? ` ${b.unit}` : ''}
                        </td>
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">
                          {b.harvestDate
                            ? new Date(b.harvestDate).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-2 text-gray-800">{b.status ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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

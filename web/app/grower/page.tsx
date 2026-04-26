'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, missionsAPI, financialDashboardAPI, farmerProfileAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const navItems = [
  { href: '/grower', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/grower/portal', label: 'Mission Tracker', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
  { href: '/grower/batches', label: 'My Batches', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/grower/fields', label: 'My Fields', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: '/grower/materials', label: 'Materials', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/grower/quality-entry', label: 'Quality Entry', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/grower/compliance-photos', label: 'Compliance Photos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: '/grower/profile', label: 'My Profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
];

export default function GrowerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [estates, setEstates] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [farmerProfileUrl, setFarmerProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadData();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/login/producer');
    }
  }, [isAuthenticated, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [estatesData, missionsData, financialDataResult, profileData] = await Promise.all([
        estatesAPI.getAll(),
        missionsAPI.getMyMissions().catch(() => []),
        financialDashboardAPI.getDashboard().catch(() => null),
        farmerProfileAPI.getMyProfile().catch(() => null),
      ]);
      setEstates(estatesData || []);
      setMissions(missionsData || []);
      setFinancialData(financialDataResult);
      if (profileData?.farmerQrCode) {
        setFarmerProfileUrl(profileData.farmerProfileUrl || `/farmer/${profileData.farmerQrCode}`);
        farmerProfileAPI.getMyQrCodeImage().then(setQrImageUrl).catch(() => setQrImageUrl(null));
      } else {
        setFarmerProfileUrl(null);
        setQrImageUrl(null);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CERTIFIED':
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'PENDING':
      case 'PENDING_VERIFICATION':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (authLoading || loading) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title="Dashboard" navItems={navItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-light">Loading dashboard...</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title="Dashboard" navItems={navItems}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-light">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  const totalParcels = estates.reduce((sum, e) => sum + (e.parcels?.length || 0), 0);
  const certifiedEstates = estates.filter((e: any) => e.status === 'CERTIFIED').length;
  const activeMissions = missions.filter((m: any) => ['PENDING', 'IN_TRANSIT', 'IN_PROGRESS'].includes(m.status)).length;

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title="Dashboard" navItems={navItems}>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 font-light mt-1">Overview of your farms and operations</p>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Estates</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{estates.length}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Parcels</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{totalParcels}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Certified Estates</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{certifiedEstates}</p>
            </div>
          </div>

          {/* Your QR Code – visible in dashboard */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {qrImageUrl ? (
                  <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={qrImageUrl} alt="Your Bio Vera QR code" className="w-24 h-24" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </div>
                )}
                <div>
                  <h3 className="text-base font-medium text-gray-900">Your QR Code</h3>
                  <p className="text-sm text-gray-600 font-light mt-0.5">
                    Customers scan this to open your public farmer profile.
                  </p>
                  <Link
                    href="/grower/profile"
                    className="inline-block mt-2 text-sm font-medium text-[#2D5A27] hover:underline"
                  >
                    View profile & download QR →
                  </Link>
                </div>
              </div>
              {farmerProfileUrl && (
                <a
                  href={farmerProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-[#2D5A27]"
                >
                  Open public profile
                </a>
              )}
            </div>
          </div>

          {/* Estates Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-gray-900">My Estates</h2>
                <Link
                  href="/producer/estates/new"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  + Add Estate
                </Link>
              </div>
            </div>
            <div className="p-6">
              {estates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estates.map((estate: any) => (
                    <Link
                      key={estate.id}
                      href={`/producer/estates/${estate.id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-2">{estate.name}</h3>
                      <p className="text-sm text-gray-600 font-light mb-3">
                        {estate.parcels?.length || 0} parcel{estate.parcels?.length !== 1 ? 's' : ''}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-medium border ${getStatusColor(estate.status || 'PENDING_SETUP')}`}>
                        {estate.status || 'PENDING_SETUP'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-light mb-4">No estates yet.</p>
                  <Link
                    href="/producer/estates/new"
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Create your first estate →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Financial Dashboard Section */}
          {financialData && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-light text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-600 font-light mt-1">
                  Your earnings, savings, and commissions
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Profit</p>
                    <p className="text-2xl font-light text-green-700">
                      €{financialData.summary?.totalProfit?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Seed Margin</p>
                    <p className="text-2xl font-light text-blue-700">
                      €{financialData.summary?.seedMargin?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Certification Savings</p>
                    <p className="text-2xl font-light text-purple-700">
                      €{financialData.summary?.groupCertificationSavings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">Packaging Commissions</p>
                    <p className="text-2xl font-light text-yellow-700">
                      €{financialData.summary?.packagingCommissions?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Transport Margin</p>
                    <p className="text-xl font-light text-gray-900">
                      €{financialData.summary?.transportMargin?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Insurance Commissions</p>
                    <p className="text-xl font-light text-gray-900">
                      €{financialData.summary?.insuranceCommissions?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Missions Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-gray-900">Recent Missions</h2>
                <Link
                  href="/grower/portal"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {missions.length > 0 ? (
                <div className="space-y-4">
                  {missions.slice(0, 5).map((mission: any) => (
                    <div
                      key={mission.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-medium text-gray-900">
                          Mission #{mission.missionNumber || mission.id}
                        </h3>
                        <span className={`px-3 py-1 rounded text-xs font-medium border ${getStatusColor(mission.status || 'PENDING')}`}>
                          {mission.status || 'PENDING'}
                        </span>
                      </div>
                      {mission.batches && (
                        <p className="text-sm text-gray-600 font-light">
                          Batch: {mission.batches.batchId || 'N/A'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 font-light">No missions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

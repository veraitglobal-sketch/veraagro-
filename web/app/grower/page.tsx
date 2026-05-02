'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { estatesAPI, growthLogsAPI, missionsAPI, financialDashboardAPI, farmerProfileAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import GrowerOfflineOutboxBanner from '@/components/grower/GrowerOfflineOutboxBanner';
import GrowerDashboardHomeWorkflow from '@/components/grower/GrowerDashboardHomeWorkflow';

export default function GrowerDashboardPage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();
  const loc = useLocalizedHref();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [estates, setEstates] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [farmerProfileUrl, setFarmerProfileUrl] = useState<string | null>(null);
  const [journalEntryCount, setJournalEntryCount] = useState<number | null>(null);

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
      let journalTotal = 0;
      const estatesList = Array.isArray(estatesData) ? estatesData : [];
      if (estatesList.length > 0) {
        try {
          const lists = await Promise.all(
            estatesList.map((e: { id: string }) =>
              growthLogsAPI.listByEstate(e.id).catch(() => []),
            ),
          );
          journalTotal = lists.reduce(
            (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
            0,
          );
        } catch {
          journalTotal = 0;
        }
      }
      setJournalEntryCount(journalTotal);
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
      setError(err.message || t('grower.dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    switch (s) {
      case 'CERTIFIED':
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      // Mission pipeline (Prisma MissionStatus) — not order `DELIVERED`
      case 'ASSIGNED':
      case 'ACCEPTED':
      case 'IN_PROGRESS':
      case 'READY_FOR_LOADING':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-gray-200 text-gray-800 border-gray-200';
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
        <SidebarLayout title={t('grower.nav.dashboard')} navItems={navItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-light">{t('grower.dashboard.loading')}</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
        <SidebarLayout title={t('grower.nav.dashboard')} navItems={navItems}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-light">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              {t('grower.dashboard.retry')}
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
      <SidebarLayout title={t('grower.nav.dashboard')} navItems={navItems}>
        <GrowerPageShell className="space-y-8">
          <GrowerPageHeader
            title={t('grower.nav.dashboard')}
            description={t('grower.dashboard.description')}
            right={
              <button
                type="button"
                onClick={loadData}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              >
                {t('grower.dashboard.refresh')}
              </button>
            }
          />

          <GrowerOfflineOutboxBanner />

          <GrowerDashboardHomeWorkflow />

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-700">{t('grower.dashboard.totalEstates')}</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{estates.length}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-700">{t('grower.dashboard.totalParcels')}</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{totalParcels}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-700">{t('grower.dashboard.certifiedEstates')}</h3>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-light text-gray-900">{certifiedEstates}</p>
              </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">{t('grower.dashboard.fieldDiaryCardTitle')}</h2>
                <p className="text-base text-gray-700 font-light mt-1">
                  {journalEntryCount === null ? '—' : t('grower.dashboard.fieldDiaryCardCount', { count: journalEntryCount })}
                </p>
                <p className="text-base text-gray-600 font-light mt-2 max-w-xl leading-relaxed">{t('grower.dashboard.fieldDiaryCardHint')}</p>
              </div>
              <Link
                href={loc('/grower/field-diary')}
                className="shrink-0 inline-flex items-center justify-center min-h-[48px] px-5 py-3 rounded-lg bg-[#2D5A27] text-white text-base font-medium hover:bg-[#254a21] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2"
              >
                {t('grower.dashboard.fieldDiaryCardCta')}
              </Link>
            </div>
          </div>

          <div className="bg-[#2D5A27]/5 border border-[#2D5A27]/20 rounded-lg p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-1">{t('grower.dashboard.stepsBlockTitle')}</h2>
            <p className="text-base text-gray-600 font-light mb-3 leading-relaxed">{t('grower.dashboard.stepsBlockDescription')}</p>
            <Link
              href={loc('/grower/season')}
              className="inline-flex min-h-[44px] items-center text-base font-medium text-[#2D5A27] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 rounded"
            >
              {t('grower.dashboard.stepsOpen')}
            </Link>
          </div>

          {/* Your QR Code – visible in dashboard */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {qrImageUrl ? (
                  <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <img src={qrImageUrl} alt={t('grower.dashboard.qrAlt')} className="w-24 h-24" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                  </div>
                )}
                <div>
                  <h3 className="text-base font-medium text-gray-900">{t('grower.dashboard.qrTitle')}</h3>
                  <p className="text-base text-gray-600 font-light mt-0.5 leading-relaxed">{t('grower.dashboard.qrDescription')}</p>
                  <Link
                    href={loc('/grower/profile')}
                    className="inline-flex min-h-[44px] items-center mt-2 text-base font-medium text-[#2D5A27] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 rounded"
                  >
                    {t('grower.dashboard.qrViewProfile')}
                  </Link>
                </div>
              </div>
              {farmerProfileUrl && (
                <a
                  href={farmerProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-gray-600 hover:text-[#2D5A27] underline-offset-2 hover:underline"
                >
                  {t('grower.dashboard.openPublicProfile')}
                </a>
              )}
            </div>
          </div>

          {/* Estates Section */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-gray-900">{t('grower.dashboard.myEstates')}</h2>
                <Link
                  href={loc('/grower/fields')}
                  className="inline-flex min-h-[48px] items-center justify-center px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                >
                  {t('grower.dashboard.addEstate')}
                </Link>
              </div>
            </div>
            <div className="p-6">
              {estates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estates.map((estate: any) => (
                    <Link
                      key={estate.id}
                      href={`${loc('/grower/fields')}?estate=${encodeURIComponent(estate.id)}`}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <h3 className="text-base font-medium text-gray-900 mb-2">{estate.name}</h3>
                      <p className="text-base text-gray-600 font-light mb-3">
                        {t('grower.dashboard.parcelCount', { count: estate.parcels?.length || 0 })}
                      </p>
                      <span className={`inline-block px-3 py-1.5 rounded text-sm font-medium border ${getStatusColor(estate.status || 'PENDING_SETUP')}`}>
                        {estate.status || 'PENDING_SETUP'}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-base text-gray-600 font-light mb-4">{t('grower.dashboard.noEstates')}</p>
                  <Link
                    href={loc('/grower/fields')}
                    className="inline-flex min-h-[48px] items-center justify-center text-green-600 hover:text-green-700 font-medium text-base px-4"
                  >
                    {t('grower.dashboard.createFirstEstate')}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Financial Dashboard Section */}
          {financialData && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-light text-gray-900">{t('grower.dashboard.financialOverview')}</h2>
                <p className="text-base text-gray-600 font-light mt-1">{t('grower.dashboard.financialOverviewSub')}</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-1">{t('grower.dashboard.totalProfit')}</p>
                    <p className="text-2xl font-light text-green-700">
                      €{financialData.summary?.totalProfit?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-1">{t('grower.dashboard.seedMargin')}</p>
                    <p className="text-2xl font-light text-blue-700">
                      €{financialData.summary?.seedMargin?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-1">
                      {t('grower.dashboard.certificationSavings')}
                    </p>
                    <p className="text-2xl font-light text-purple-700">
                      €{financialData.summary?.groupCertificationSavings?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-1">
                      {t('grower.dashboard.packagingCommissions')}
                    </p>
                    <p className="text-2xl font-light text-yellow-700">
                      €{financialData.summary?.packagingCommissions?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-2">{t('grower.dashboard.transportMargin')}</p>
                    <p className="text-xl font-light text-gray-900">
                      €{financialData.summary?.transportMargin?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-base font-medium text-gray-600 mb-2">
                      {t('grower.dashboard.insuranceCommissions')}
                    </p>
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
                <h2 className="text-xl font-light text-gray-900">{t('grower.dashboard.recentMissions')}</h2>
                <Link
                  href={loc('/grower/portal')}
                  className="inline-flex min-h-[44px] items-center text-base text-green-600 hover:text-green-700 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:ring-offset-2 rounded px-1"
                >
                  {t('grower.dashboard.viewAll')}
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
                          {t('grower.dashboard.missionLabel', { id: mission.missionNumber || mission.id })}
                        </h3>
                        <span className={`px-3 py-1.5 rounded text-sm font-medium border ${getStatusColor(mission.status || 'PENDING')}`}>
                          {t(`adminPages.missions.statuses.${mission.status as string}`, {
                            defaultValue: (mission.status || 'PENDING').replace(/_/g, ' '),
                          })}
                        </span>
                      </div>
                      {mission.batches && (
                        <p className="text-base text-gray-600 font-light">
                          {t('grower.dashboard.batch')}: {mission.batches.batchId || t('grower.dashboard.notAvailable')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-base text-gray-600 font-light">{t('grower.dashboard.noMissions')}</p>
                </div>
              )}
            </div>
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

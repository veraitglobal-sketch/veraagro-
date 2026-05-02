'use client';

import { useState, useEffect, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { missionsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import Link from 'next/link';
import { Activity, Truck } from 'lucide-react';

import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

const MISSION_FILTER_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'READY_FOR_LOADING',
  'PICKED_UP',
  'IN_TRANSIT',
  'COMPLETED',
  'CANCELLED',
] as const;

type Lp = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  partnerCode?: string;
  vehicles: { id: string; licensePlate: string; vehicleNumber: string }[];
};

export default function MissionsManagementPage() {
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  const adminNavItems = useAdminNavItems();
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [partners, setPartners] = useState<Lp[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [assignMission, setAssignMission] = useState<any | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, [statusFilter]);

  const loadMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      const data = await missionsAPI.getAllAdmin(filters);
      setMissions(data);
    } catch (err: unknown) {
      console.error('Error loading missions:', err);
      setError(apiErrorOrT(err, t, 'adminPages.missions.errLoadMissions'));
    } finally {
      setLoading(false);
    }
  };

  const openAssign = async (mission: any) => {
    setAssignMission(mission);
    setSelectedPartnerId('');
    setSelectedVehicleId('');
    setAssignError(null);
    if (partners.length === 0) {
      setPartnersLoading(true);
      try {
        const list = (await missionsAPI.getLogisticsPartnersAdmin()) as Lp[];
        setPartners(Array.isArray(list) ? list : []);
      } catch (e: unknown) {
        setAssignError(apiErrorOrT(e, t, 'adminPages.missions.errLoadPartners'));
        setPartners([]);
      } finally {
        setPartnersLoading(false);
      }
    }
  };

  const selectedPartner = useMemo(
    () => partners.find((p) => p.id === selectedPartnerId),
    [partners, selectedPartnerId],
  );

  const submitAssign = async () => {
    if (!assignMission || !selectedPartnerId) return;
    setAssignSubmitting(true);
    setAssignError(null);
    try {
      await missionsAPI.assignMissionAdmin(assignMission.id, {
        logisticsPartnerId: selectedPartnerId,
        ...(selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
      });
      setAssignMission(null);
      await loadMissions();
    } catch (e: unknown) {
      setAssignError(apiErrorOrT(e, t, 'adminPages.missions.errAssign'));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const displayed = useMemo(() => {
    if (!unassignedOnly) return missions;
    return missions.filter(
      (m) => m.status === 'PENDING' && (m.logisticsPartnerId == null || m.logisticsPartnerId === ''),
    );
  }, [missions, unassignedOnly]);

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.missions')} navItems={adminNavItems}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-light text-gray-900">{t('adminPages.missions.headerTitle')}</h1>
              <p className="text-sm text-gray-600 mt-1">{t('adminPages.missions.headerSubtitle')}</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {t('adminPages.missions.multiStopHint')}
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t('adminPages.missions.filterAllStatuses')}</option>
              {MISSION_FILTER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {t(`adminPages.missions.statuses.${st}`)}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              {t('adminPages.missions.unassignedOnly')}
            </label>
            <a
              href="/admin/command-control"
              className="text-sm text-green-800 underline ml-auto"
            >
              {t('adminPages.missions.commandControlLink')}
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('adminPages.missions.loading')}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colMission')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colLinks')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colGrower')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colDestination')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colBuyerOrder')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colDriver')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colProduct')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colStatus')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colCreated')}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('adminPages.missions.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayed.map((mission) => {
                    const canAssign =
                      mission.status === 'PENDING' &&
                      (mission.logisticsPartnerId == null || mission.logisticsPartnerId === '');
                    return (
                      <tr key={mission.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {mission.missionNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 align-top max-w-[9rem]">
                          <div className="flex flex-col gap-1.5">
                            {mission.users_missions_growerIdTousers?.id && (
                              <Link
                                href={`/admin/farm/${mission.users_missions_growerIdTousers.id}`}
                                className="text-[#2D5A27] font-medium hover:underline"
                              >
                                {t('adminPages.missions.linkFarmerAdmin')}
                              </Link>
                            )}
                            <a
                              href={`/grower/portal?missionId=${encodeURIComponent(mission.id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2D5A27] font-medium hover:underline"
                              title={t('adminPages.missions.linkGrowerPortalTitle')}
                            >
                              {t('adminPages.missions.linkGrowerPortal')}
                            </a>
                            {mission.batches?.batchId ? (
                              <span className="font-mono text-[11px] text-gray-500 break-all" title={t('adminPages.missions.batchPublicIdTitle')}>
                                {mission.batches.batchId}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.users_missions_growerIdTousers?.firstName}{' '}
                          {mission.users_missions_growerIdTousers?.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                          <div className="font-medium text-gray-800">
                            {mission.destinationCity || t('common.emDash')}
                          </div>
                          {mission.destinationAddress && (
                            <div className="text-xs text-gray-500 line-clamp-2">{mission.destinationAddress}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {mission.orders?.orderNumber ? (
                            <span className="font-mono text-xs">{mission.orders.orderNumber}</span>
                          ) : (
                            <span className="text-gray-400">{t('common.emDash')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.users_missions_logisticsPartnerIdTousers?.firstName}{' '}
                          {mission.users_missions_logisticsPartnerIdTousers?.lastName || (
                            <span className="text-amber-700">{t('adminPages.missions.unassigned')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.batches?.productName || mission.orders?.productName || t('common.emDash')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              mission.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : mission.status === 'IN_TRANSIT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : mission.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : mission.status === 'READY_FOR_LOADING'
                                      ? 'bg-cyan-100 text-cyan-900'
                                      : mission.status === 'CANCELLED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t(`adminPages.missions.statuses.${mission.status as string}`, {
                              defaultValue: mission.status.replace(/_/g, ' '),
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(mission.createdAt).toLocaleString(dateLocale)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => openAssign(mission)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md px-3 py-1.5"
                            >
                              <Truck className="w-4 h-4" />
                              {t('adminPages.missions.assignDriver')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayed.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">{t('adminPages.missions.emptyState')}</p>
                </div>
              )}
            </div>
          )}

          {assignMission && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('adminPages.missions.assignModalTitle')}</h2>
                <p className="text-sm text-gray-600">
                  {t('adminPages.missions.assignModalMission', {
                    missionNumber: assignMission.missionNumber,
                    product: assignMission.batches?.productName || t('adminPages.missions.loadFallback'),
                  })}
                </p>
                {partnersLoading ? (
                  <p className="text-sm text-gray-500">{t('adminPages.missions.loadingPartners')}</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.missions.labelLogisticsPartner')}</label>
                      <select
                        value={selectedPartnerId}
                        onChange={(e) => {
                          setSelectedPartnerId(e.target.value);
                          setSelectedVehicleId('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">{t('adminPages.missions.selectPartner')}</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                            {p.partnerCode ? ` (${p.partnerCode})` : ''}
                            {p.vehicles?.length
                              ? ` — ${t('adminPages.missions.partnerVehicles', { count: p.vehicles.length })}`
                              : ` — ${t('adminPages.missions.partnerNoColdVehicle')}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPartner && selectedPartner.vehicles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.missions.labelVehicleOptional')}</label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">{t('adminPages.missions.vehicleAuto')}</option>
                          {selectedPartner.vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.vehicleNumber || v.licensePlate || v.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                {assignError && <p className="text-sm text-red-600">{assignError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignMission(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('adminPages.missions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPartnerId || assignSubmitting || partnersLoading}
                    onClick={submitAssign}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {assignSubmitting ? t('adminPages.missions.assigning') : t('adminPages.missions.assign')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

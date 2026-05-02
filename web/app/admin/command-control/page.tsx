'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { motion } from 'framer-motion';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { commandControlAPI, missionsAPI } from '@/lib/api';

type LogisticsPartnerRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  partnerCode?: string;
  vehicles: { id: string; licensePlate: string; vehicleNumber: string }[];
};

type LiveMission = {
  id: string;
  missionNumber: string;
  status: string;
  pickupAddress: string;
  driverName: string;
};

type ViolationRow = {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  summary: string;
  timestamp: string;
};

export default function CommandControlPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [systemStatus, setSystemStatus] = useState({ paused: false });
  const [activeMissions, setActiveMissions] = useState<LiveMission[]>([]);
  const [violations, setViolations] = useState<ViolationRow[]>([]);
  const [trustSummary, setTrustSummary] = useState({ blocked: 0, atRisk: 0, healthy: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reassignMission, setReassignMission] = useState<LiveMission | null>(null);
  const [partners, setPartners] = useState<LogisticsPartnerRow[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSubmitting, setReassignSubmitting] = useState(false);
  const [actionBanner, setActionBanner] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    null,
  );

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const d = await commandControlAPI.getDashboard();
      setSystemStatus({ paused: Boolean(d?.paused) });
      setActiveMissions(Array.isArray(d?.missions) ? d.missions : []);
      setViolations(Array.isArray(d?.violations) ? d.violations : []);
      if (d?.trustSummary) {
        setTrustSummary({
          blocked: d.trustSummary.blocked ?? 0,
          atRisk: d.trustSummary.atRisk ?? 0,
          healthy: d.trustSummary.healthy ?? 0,
        });
      }
    } catch (e: unknown) {
      console.error('Command control dashboard', e);
      setError(e instanceof Error ? e.message : t('adminPages.commandControl.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handlePauseSystem = async () => {
    try {
      const reason = window.prompt(t('adminPages.commandControl.pauseReasonPrompt'));
      if (!reason) return;
      await commandControlAPI.pause(reason);
      setSystemStatus({ paused: true });
      await loadDashboard();
      setActionBanner({ kind: 'success', message: t('adminPages.commandControl.pauseSuccess') });
    } catch (error) {
      console.error('Error pausing system:', error);
      setActionBanner({ kind: 'error', message: t('adminPages.commandControl.pauseFail') });
    }
  };

  const handleResumeSystem = async () => {
    try {
      await commandControlAPI.resume();
      setSystemStatus({ paused: false });
      await loadDashboard();
      setActionBanner({ kind: 'success', message: t('adminPages.commandControl.resumeSuccess') });
    } catch (error) {
      console.error('Error resuming system:', error);
      setActionBanner({ kind: 'error', message: t('adminPages.commandControl.resumeFail') });
    }
  };

  const openReassignModal = async (mission: LiveMission) => {
    setReassignMission(mission);
    setPartnerQuery('');
    setSelectedPartnerId('');
    setReassignReason('');
    setReassignError(null);
    setPartnersLoading(true);
    try {
      const list = (await missionsAPI.getLogisticsPartnersAdmin()) as LogisticsPartnerRow[];
      setPartners(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      setReassignError(
        e instanceof Error ? e.message : t('adminPages.missions.errLoadPartners'),
      );
      setPartners([]);
    } finally {
      setPartnersLoading(false);
    }
  };

  const filteredPartners = useMemo(() => {
    const q = partnerQuery.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      const hay = [
        p.firstName,
        p.lastName,
        p.email,
        p.phone,
        p.partnerCode,
        p.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [partners, partnerQuery]);

  const submitReassign = async () => {
    if (!reassignMission || !selectedPartnerId || !reassignReason.trim()) return;
    setReassignSubmitting(true);
    setReassignError(null);
    try {
      await commandControlAPI.reassign(reassignMission.id, selectedPartnerId, reassignReason.trim());
      setReassignMission(null);
      setActionBanner({ kind: 'success', message: t('adminPages.commandControl.successReassign') });
      await loadDashboard();
    } catch (e: unknown) {
      console.error('Error reassigning mission:', e);
      const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      const msg = Array.isArray(raw) ? raw.join(', ') : raw ? String(raw) : '';
      setReassignError(
        msg || (e instanceof Error ? e.message : t('adminPages.commandControl.errReassign')),
      );
    } finally {
      setReassignSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
        <SidebarLayout title={t('adminPages.titles.commandControl')} navItems={adminNavItems}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
              <p className="mt-4 text-gray-600">{t('adminPages.commandControl.loading')}</p>
            </div>
          </div>
        </SidebarLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.commandControl')} navItems={adminNavItems}>
        <div className="space-y-6">
          {actionBanner && (
            <div
              className={`p-4 rounded-lg text-sm ${
                actionBanner.kind === 'success'
                  ? 'bg-[#2D5A27]/10 border border-[#2D5A27]/30 text-gray-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              {actionBanner.message}
            </div>
          )}
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* System Status & Kill-Switch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg shadow-sm border p-4 sm:p-5 ${
              systemStatus.paused ? 'bg-red-50 border-red-200' : 'bg-[#2D5A27]/10 border-[#2D5A27]/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-0.5">
                  {t('adminPages.commandControl.systemStatus')}
                </h2>
                <p
                  className={`text-sm font-medium ${
                    systemStatus.paused ? 'text-red-700' : 'text-[#2D5A27]'
                  }`}
                >
                  {systemStatus.paused
                    ? t('adminPages.commandControl.statusPaused')
                    : t('adminPages.commandControl.statusOperational')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {systemStatus.paused ? (
                  <button
                    type="button"
                    onClick={handleResumeSystem}
                    className="px-4 py-2 text-sm bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    {t('adminPages.commandControl.resume')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePauseSystem}
                    className="px-4 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('adminPages.commandControl.pause')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-base font-semibold text-gray-900">{t('adminPages.commandControl.liveMissions')}</h2>
              <div className="flex items-center gap-2 shrink-0">
                {activeMissions.length > 0 && (
                  <span className="text-xs tabular-nums text-gray-500">
                    {t('adminPages.commandControl.openCount', { count: activeMissions.length })}
                  </span>
                )}
                <Link
                  href="/admin/missions"
                  className="text-xs font-medium text-[#2D5A27] hover:underline"
                >
                  {t('adminPages.commandControl.allMissions')}
                </Link>
              </div>
            </div>
            {activeMissions.length === 0 ? (
              <p className="text-sm text-gray-500">{t('adminPages.commandControl.noMissions')}</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-md divide-y divide-gray-100">
                {activeMissions.slice(0, 12).map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-start sm:items-center justify-between gap-2 px-2 py-2 sm:py-1.5 hover:bg-gray-50/80"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-gray-900 tabular-nums">
                          {mission.missionNumber}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {mission.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate" title={`${mission.driverName} · ${mission.pickupAddress}`}>
                        {mission.driverName} · {mission.pickupAddress}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openReassignModal(mission)}
                      className="shrink-0 px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      {t('adminPages.commandControl.reassign')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {reassignMission && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
              role="dialog"
              aria-modal="true"
              aria-labelledby="command-control-reassign-title"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 id="command-control-reassign-title" className="text-lg font-semibold text-gray-900">
                  {t('adminPages.commandControl.reassignModalTitle')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('adminPages.commandControl.reassignModalMission', {
                    missionNumber: reassignMission.missionNumber,
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  <Link href="/admin/users" className="font-medium text-[#2D5A27] hover:underline">
                    {t('adminPages.commandControl.usersDirectoryLink')}
                  </Link>
                  {' — '}
                  {t('adminPages.commandControl.usersDirectoryHint')}
                </p>
                {partnersLoading ? (
                  <p className="text-sm text-gray-500">{t('adminPages.missions.loadingPartners')}</p>
                ) : (
                  <>
                    <div>
                      <label htmlFor="cc-partner-search" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminPages.commandControl.partnerSearch')}
                      </label>
                      <input
                        id="cc-partner-search"
                        type="search"
                        value={partnerQuery}
                        onChange={(e) => setPartnerQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label htmlFor="cc-partner-select" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminPages.commandControl.labelNewPartner')}
                      </label>
                      <select
                        id="cc-partner-select"
                        value={selectedPartnerId}
                        onChange={(e) => setSelectedPartnerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">{t('adminPages.missions.selectPartner')}</option>
                        {filteredPartners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                            {p.partnerCode ? ` (${p.partnerCode})` : ''}
                            {p.email ? ` · ${p.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="cc-reassign-reason" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('adminPages.commandControl.labelReason')}
                      </label>
                      <textarea
                        id="cc-reassign-reason"
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={t('adminPages.commandControl.reasonPlaceholder')}
                      />
                    </div>
                  </>
                )}
                {reassignError && <p className="text-sm text-red-600">{reassignError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReassignMission(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    {t('adminPages.missions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={
                      !selectedPartnerId ||
                      !reassignReason.trim() ||
                      reassignSubmitting ||
                      partnersLoading
                    }
                    onClick={submitReassign}
                    className="px-4 py-2 bg-[#2D5A27] text-white rounded-lg hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {reassignSubmitting
                      ? t('adminPages.commandControl.reassigning')
                      : t('adminPages.commandControl.confirmReassign')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t('adminPages.commandControl.nonCompliantAudit')}</h2>
            {violations.length === 0 ? (
              <p className="text-sm text-gray-500">{t('adminPages.commandControl.noViolations')}</p>
            ) : (
              <div className="space-y-3">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="p-3 border-l-4 border-red-500 bg-red-50 rounded-md"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {String(violation.type).replace(/_/g, ' ')}
                      </p>
                      <span className="text-xs text-gray-500 shrink-0">
                        {new Date(violation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {violation.entityType} · {violation.entityId}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{violation.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-3 sm:px-4 sm:py-3"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              {t('adminPages.commandControl.trustScoreHeading')}
            </h2>
            <div className="flex flex-wrap items-stretch divide-x divide-gray-200 rounded-md bg-gray-50 border border-gray-100">
              <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
                <p className="text-lg sm:text-xl font-bold tabular-nums text-red-600 leading-none">{trustSummary.blocked}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">&lt;70</p>
              </div>
              <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
                <p className="text-lg sm:text-xl font-bold tabular-nums text-yellow-600 leading-none">{trustSummary.atRisk}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">70–79</p>
              </div>
              <div className="flex-1 min-w-[4.5rem] px-2 py-2 text-center">
                <p className="text-lg sm:text-xl font-bold tabular-nums text-[#2D5A27] leading-none">{trustSummary.healthy}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">≥80</p>
              </div>
            </div>
          </motion.div>
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

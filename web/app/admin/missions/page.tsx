'use client';

import { useState, useEffect, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { missionsAPI } from '@/lib/api';
import { Activity, Truck } from 'lucide-react';

import { useAdminNavItems } from '@/lib/admin-nav';

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
    } catch (err: any) {
      console.error('Error loading missions:', err);
      setError(err.message || 'Failed to load missions');
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
      } catch (e: any) {
        setAssignError(e?.message || 'Could not load logistics partners');
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
    } catch (e: any) {
      setAssignError(
        e?.response?.data?.message || e?.message || 'Assign failed',
      );
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
      <SidebarLayout title="Missions Management" navItems={adminNavItems}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Missions &amp; transport dispatch</h1>
              <p className="text-sm text-gray-600 mt-1">
                Flow: <strong>Harvest plan</strong> (grower) → you confirm in Harvest plans, grower ships when ready →{' '}
                <strong>Request transport</strong> creates a mission. Here: <strong>PENDING</strong> = no driver yet — you
                can <strong>Assign</strong> a specific partner and vehicle, or leave the mission open for logistics to{' '}
                <em>claim</em> in their app (first-come, then accept).
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Multi-stop / one truck:</strong> the system still stores <strong>one batch per mission</strong>. To
            group two grower lots, keep both requests on the <strong>same destination city and address</strong> and
            reference the same order in notes — then assign the <strong>same</strong> driver to both rows here, or use
            Command Control to reassign.
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4 flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={unassignedOnly}
                onChange={(e) => setUnassignedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Only PENDING, no driver yet
            </label>
            <a
              href="/admin/command-control"
              className="text-sm text-green-800 underline ml-auto"
            >
              Command Control (reassign)
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading missions...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grower</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.users_missions_growerIdTousers?.firstName}{' '}
                          {mission.users_missions_growerIdTousers?.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                          <div className="font-medium text-gray-800">
                            {mission.destinationCity || '—'}
                          </div>
                          {mission.destinationAddress && (
                            <div className="text-xs text-gray-500 line-clamp-2">{mission.destinationAddress}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {mission.orders?.orderNumber ? (
                            <span className="font-mono text-xs">{mission.orders.orderNumber}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.users_missions_logisticsPartnerIdTousers?.firstName}{' '}
                          {mission.users_missions_logisticsPartnerIdTousers?.lastName || (
                            <span className="text-amber-700">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {mission.batches?.productName || mission.orders?.productName || '—'}
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
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {mission.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(mission.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => openAssign(mission)}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md px-3 py-1.5"
                            >
                              <Truck className="w-4 h-4" />
                              Assign driver
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
                  <p className="text-gray-500">No missions in this view</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Assign driver</h2>
                <p className="text-sm text-gray-600">
                  Mission <strong>{assignMission.missionNumber}</strong> — {assignMission.batches?.productName || 'Load'}
                </p>
                {partnersLoading ? (
                  <p className="text-sm text-gray-500">Loading partners…</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logistics partner *</label>
                      <select
                        value={selectedPartnerId}
                        onChange={(e) => {
                          setSelectedPartnerId(e.target.value);
                          setSelectedVehicleId('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select…</option>
                        {partners.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                            {p.partnerCode ? ` (${p.partnerCode})` : ''}
                            {p.vehicles?.length ? ` — ${p.vehicles.length} vehicle(s)` : ' — no temperature-controlled vehicle available'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPartner && selectedPartner.vehicles.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (optional)</label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">Auto (first available cold truck)</option>
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
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedPartnerId || assignSubmitting || partnersLoading}
                    onClick={submitAssign}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {assignSubmitting ? 'Assigning…' : 'Assign'}
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

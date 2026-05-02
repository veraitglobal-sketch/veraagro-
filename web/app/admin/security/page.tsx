'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { securityAlertsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';

interface SecurityAlert {
  id: string;
  type: string;
  severity: string;
  status: string;
  message: string;
  barcode?: string;
  createdAt: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    partnerCode: string;
  };
  estates: {
    id: string;
    name: string;
  };
}

export default function SecurityAlertsPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadAlerts();
  }, [typeFilter, severityFilter, statusFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (typeFilter) filters.type = typeFilter;
      if (severityFilter) filters.severity = severityFilter;
      if (statusFilter) filters.status = statusFilter;
      
      const data = await securityAlertsAPI.getAll(filters);
      setAlerts(data);
    } catch (err: unknown) {
      console.error('Error loading alerts:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string, status: string) => {
    try {
      await securityAlertsAPI.updateStatus(alertId, {
        status,
        resolution: resolutionNotes,
      });
      setShowResolveModal(false);
      setSelectedAlert(null);
      setResolutionNotes('');
      loadAlerts();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN', 'COORDINATOR']}>
      <SidebarLayout title={t('adminPages.titles.security')} navItems={adminNavItems}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Security Alerts</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and resolve security violations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                <option value="UNAUTHORIZED_CHEMICAL">Unauthorized Chemical</option>
                <option value="INACTIVE_CHEMICAL">Inactive Chemical</option>
                <option value="GPS_VIOLATION">GPS Violation</option>
                <option value="LATE_ENTRY">Late Entry</option>
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>
          </div>

          {/* Alerts List */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading alerts...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg shadow border-2 p-6 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">{alert.type.replace(/_/g, ' ')}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          alert.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          alert.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{alert.message}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">User:</span>
                          <span className="ml-2 font-medium">
                            {alert.users.firstName} {alert.users.lastName} ({alert.users.partnerCode})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Estate:</span>
                          <span className="ml-2 font-medium">{alert.estates.name}</span>
                        </div>
                        {alert.barcode && (
                          <div>
                            <span className="text-gray-500">Barcode:</span>
                            <span className="ml-2 font-medium">{alert.barcode}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Created:</span>
                          <span className="ml-2 font-medium">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {alert.status === 'PENDING' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowResolveModal(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id, 'DISMISSED')}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No security alerts found</p>
                </div>
              )}
            </div>
          )}

          {/* Resolve Modal */}
          {showResolveModal && selectedAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              >
                <h2 className="text-xl font-semibold mb-4">Resolve Alert</h2>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Resolution Notes:</p>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={4}
                    placeholder="Enter resolution notes..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowResolveModal(false);
                      setSelectedAlert(null);
                      setResolutionNotes('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolve(selectedAlert.id, 'RESOLVED')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Resolve
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

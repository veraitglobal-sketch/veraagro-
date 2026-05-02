'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { WEB_API_BASE } from '@/lib/api-base';

interface VeraInsight {
  id: string;
  cropName: string;
  veraScore: number;
  historicalDeficit?: number;
  whyText: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  priceTrend: 'UP' | 'DOWN' | 'STABLE';
  seedId?: string;
  seed?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminVeraInsightsPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const [insights, setInsights] = useState<VeraInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    veraScore: 50,
    historicalDeficit: '',
    whyText: '',
    riskLevel: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    priceTrend: 'STABLE' as 'UP' | 'DOWN' | 'STABLE',
    seedId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/vera-insights/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/vera-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          historicalDeficit: formData.historicalDeficit ? parseFloat(formData.historicalDeficit) : undefined,
          seedId: formData.seedId || undefined,
        }),
      });

      if (!response.ok) throw new Error(t('adminPages.veraInsights.errCreate'));
      
      await fetchInsights();
      setShowAddForm(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('adminPages.veraInsights.errCreate'));
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const insight = insights.find(i => i.id === id);
      if (!insight) return;

      const response = await fetch(`${WEB_API_BASE}/vera-insights/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cropName: formData.cropName,
          veraScore: formData.veraScore,
          historicalDeficit: formData.historicalDeficit ? parseFloat(formData.historicalDeficit) : undefined,
          whyText: formData.whyText,
          riskLevel: formData.riskLevel,
          priceTrend: formData.priceTrend,
          seedId: formData.seedId || undefined,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) throw new Error(t('adminPages.veraInsights.errUpdate'));
      
      await fetchInsights();
      setEditingId(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || t('adminPages.veraInsights.errUpdate'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminPages.veraInsights.confirmDelete'))) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/vera-insights/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(t('adminPages.veraInsights.errDelete'));
      
      await fetchInsights();
    } catch (err: any) {
      alert(err.message || t('adminPages.veraInsights.errDelete'));
    }
  };

  const startEdit = (insight: VeraInsight) => {
    setEditingId(insight.id);
    setFormData({
      cropName: insight.cropName,
      veraScore: insight.veraScore,
      historicalDeficit: insight.historicalDeficit?.toString() || '',
      whyText: insight.whyText,
      riskLevel: insight.riskLevel,
      priceTrend: insight.priceTrend,
      seedId: insight.seedId || '',
      isActive: insight.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      cropName: '',
      veraScore: 50,
      historicalDeficit: '',
      whyText: '',
      riskLevel: 'MEDIUM',
      priceTrend: 'STABLE',
      seedId: '',
      isActive: true,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'text-green-600 bg-green-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'HIGH': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
        <SidebarLayout title={t('adminPages.titles.veraInsights')} navItems={adminNavItems}>
        <div className="flex flex-col items-center justify-center gap-3 h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" aria-hidden />
          <p className="text-sm text-gray-600">{t('adminPages.veraInsights.loading')}</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
        <SidebarLayout title={t('adminPages.titles.veraInsights')} navItems={adminNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-light text-gray-900">{t('adminPages.veraInsights.headerTitle')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('adminPages.veraInsights.headerSubtitle')}</p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
              resetForm();
            }}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('adminPages.veraInsights.addInsight')}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">{t('adminPages.veraInsights.addFormTitle')}</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.cropName')}</label>
                  <input
                    type="text"
                    value={formData.cropName}
                    onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder={t('adminPages.veraInsights.cropPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.veraScore')}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.veraScore}
                    onChange={(e) => setFormData({ ...formData, veraScore: parseInt(e.target.value) })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.historicalDeficit')}</label>
                  <input
                    type="number"
                    value={formData.historicalDeficit}
                    onChange={(e) => setFormData({ ...formData, historicalDeficit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder={t('adminPages.veraInsights.historicalDeficitPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.riskLevel')}</label>
                  <select
                    value={formData.riskLevel}
                    onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="LOW">{t('adminPages.veraInsights.risk.LOW')}</option>
                    <option value="MEDIUM">{t('adminPages.veraInsights.risk.MEDIUM')}</option>
                    <option value="HIGH">{t('adminPages.veraInsights.risk.HIGH')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.priceTrend')}</label>
                  <select
                    value={formData.priceTrend}
                    onChange={(e) => setFormData({ ...formData, priceTrend: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  >
                    <option value="UP">{t('adminPages.veraInsights.trend.UP')}</option>
                    <option value="DOWN">{t('adminPages.veraInsights.trend.DOWN')}</option>
                    <option value="STABLE">{t('adminPages.veraInsights.trend.STABLE')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.seedIdOptional')}</label>
                  <input
                    type="text"
                    value={formData.seedId}
                    onChange={(e) => setFormData({ ...formData, seedId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder={t('adminPages.veraInsights.seedIdPlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('adminPages.veraInsights.whyText')}</label>
                <textarea
                  value={formData.whyText}
                  onChange={(e) => setFormData({ ...formData, whyText: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder={t('adminPages.veraInsights.whyTextPlaceholder')}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">{t('adminPages.veraInsights.activeLabel')}</label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t('adminPages.veraInsights.save')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('adminPages.veraInsights.cancel')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Insights List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colCrop')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colScore')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colDeficit')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colRisk')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colTrend')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colStatus')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('adminPages.veraInsights.colActions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.map((insight) => (
                  <tr key={insight.id} className="hover:bg-gray-50">
                    {editingId === insight.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={formData.cropName}
                            onChange={(e) => setFormData({ ...formData, cropName: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={formData.veraScore}
                            onChange={(e) => setFormData({ ...formData, veraScore: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={formData.historicalDeficit}
                            onChange={(e) => setFormData({ ...formData, historicalDeficit: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.riskLevel}
                            onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="LOW">{t('adminPages.veraInsights.risk.LOW')}</option>
                            <option value="MEDIUM">{t('adminPages.veraInsights.risk.MEDIUM')}</option>
                            <option value="HIGH">{t('adminPages.veraInsights.risk.HIGH')}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.priceTrend}
                            onChange={(e) => setFormData({ ...formData, priceTrend: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="UP">{t('adminPages.veraInsights.trend.UP')}</option>
                            <option value="DOWN">{t('adminPages.veraInsights.trend.DOWN')}</option>
                            <option value="STABLE">{t('adminPages.veraInsights.trend.STABLE')}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(insight.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{insight.cropName}</div>
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{insight.whyText}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getScoreColor(insight.veraScore)}`}>
                            {insight.veraScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {insight.historicalDeficit !== null && insight.historicalDeficit !== undefined
                            ? `${insight.historicalDeficit > 0 ? '+' : ''}${insight.historicalDeficit}%`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getRiskColor(insight.riskLevel)}`}>
                            {t(`adminPages.veraInsights.risk.${insight.riskLevel}`)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {insight.priceTrend === 'UP' && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {insight.priceTrend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-600" />}
                          {insight.priceTrend === 'STABLE' && <Minus className="w-4 h-4 text-gray-600" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            insight.isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                          }`}>
                            {insight.isActive ? t('adminPages.veraInsights.statusActive') : t('adminPages.veraInsights.statusInactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(insight)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(insight.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {insights.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>{t('adminPages.veraInsights.emptyState')}</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { marketPricesAPI, buyerTradePanelAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { motion } from 'framer-motion';
import { DollarSign, Plus, Edit2, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';

interface MarketPrice {
  id: string;
  cropType: string;
  buyPrice: number;
  sellPrice: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  setByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export default function MarketPricesPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const { user } = useAuth();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<MarketPrice | null>(null);
  const [selectedCropType, setSelectedCropType] = useState<string | null>(null);
  const [priceHistory, setPriceHistory] = useState<MarketPrice[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [priceEscalations, setPriceEscalations] = useState<any>(null);
  const [showSurgeModal, setShowSurgeModal] = useState(false);
  const [selectedProductForSurge, setSelectedProductForSurge] = useState('');
  const [surgePercent, setSurgePercent] = useState(5);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedProductForThreshold, setSelectedProductForThreshold] = useState('');
  const [thresholdValue, setThresholdValue] = useState(100);

  const [formData, setFormData] = useState({
    cropType: '',
    buyPrice: '',
    sellPrice: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
  });

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') || false;

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketPricesAPI.getAllActive();
      setPrices(data);
    } catch (err: unknown) {
      console.error('Error loading prices:', err);
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const loadPriceHistory = async (cropType: string) => {
    try {
      const history = await marketPricesAPI.getHistory(cropType);
      setPriceHistory(history);
      setSelectedCropType(cropType);
      setShowHistoryModal(true);
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await marketPricesAPI.create({
        cropType: formData.cropType,
        buyPrice: parseFloat(formData.buyPrice),
        sellPrice: parseFloat(formData.sellPrice),
        effectiveFrom: formData.effectiveFrom || undefined,
        effectiveTo: formData.effectiveTo || undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadPrices();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrice) return;
    
    try {
      await marketPricesAPI.update(editingPrice.id, {
        buyPrice: formData.buyPrice ? parseFloat(formData.buyPrice) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        effectiveTo: formData.effectiveTo || undefined,
      });
      setEditingPrice(null);
      resetForm();
      loadPrices();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this price?')) return;
    
    try {
      await marketPricesAPI.update(id, { isActive: false });
      loadPrices();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const resetForm = () => {
    setFormData({
      cropType: '',
      buyPrice: '',
      sellPrice: '',
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
    });
  };

  const handleApplySurgePricing = async () => {
    if (!selectedProductForSurge?.trim()) {
      alert('Select a product (crop) first');
      return;
    }
    try {
      const result = await buyerTradePanelAPI.applySurgePricing(
        selectedProductForSurge.trim(),
        surgePercent,
      );
      const newP = result?.newPrice;
      alert(
        typeof newP === 'number'
          ? `Surge applied. New sell price: €${newP.toFixed(2)} (was €${result?.oldPrice?.toFixed?.(2) ?? '—'})`
          : 'Surge pricing applied.',
      );
      setShowSurgeModal(false);
      loadPrices();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const handleSetCriticalThreshold = async () => {
    try {
      await buyerTradePanelAPI.setCriticalThreshold(selectedProductForThreshold, thresholdValue);
      alert('Critical threshold set successfully');
      setShowThresholdModal(false);
      loadPrices();
    } catch (err: unknown) {
      alert(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    }
  };

  const openEditModal = (price: MarketPrice) => {
    setEditingPrice(price);
    setFormData({
      cropType: price.cropType,
      buyPrice: price.buyPrice.toString(),
      sellPrice: price.sellPrice.toString(),
      effectiveFrom: price.effectiveFrom ? new Date(price.effectiveFrom).toISOString().split('T')[0] : '',
      effectiveTo: price.effectiveTo ? new Date(price.effectiveTo).toISOString().split('T')[0] : '',
    });
  };

  const calculateMargin = (buyPrice: number, sellPrice: number) => {
    return ((sellPrice - buyPrice) / buyPrice) * 100;
  };

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={t('adminPages.titles.marketPrices')} navItems={adminNavItems}>
        <div className="space-y-6">
          {/* Price Escalation Alerts */}
          {priceEscalations?.hasEscalation && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">High Demand Detected!</h3>
                  {priceEscalations.escalations.map((escalation: any, index: number) => (
                    <div key={index} className="mb-3 last:mb-0">
                      <p className="text-sm text-red-800 mb-1">
                        <strong>{escalation.productName}</strong>: {escalation.orderCount} large orders in last hour
                      </p>
                      <p className="text-sm text-red-700 mb-2">{escalation.message}</p>
                      <button
                        onClick={() => {
                          setSelectedProductForSurge(escalation.productName);
                          setSurgePercent(escalation.suggestedIncrease);
                          setShowSurgeModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Apply Surge Pricing (+{escalation.suggestedIncrease}%)
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Market Prices</h1>
              <p className="text-sm text-gray-600 mt-1">Manage market prices for all crop types</p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Set New Price
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading prices...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crop Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buy Price (€)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Price (€)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective From</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Critical Threshold</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prices.map((price) => {
                    const margin = calculateMargin(price.buyPrice, price.sellPrice);
                    return (
                      <tr key={price.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{price.cropType}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{price.buyPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{price.sellPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            margin > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {margin > 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(price.effectiveFrom).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {price.effectiveTo ? new Date(price.effectiveTo).toLocaleDateString() : 'No expiry'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            price.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {price.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(price as any).criticalThreshold ? (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {(price as any).criticalThreshold}kg
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => loadPriceHistory(price.cropType)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View History"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedProductForThreshold(price.cropType);
                                    setThresholdValue((price as any).criticalThreshold || 100);
                                    setShowThresholdModal(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Set Critical Threshold"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(price)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {price.isActive && (
                                  <button
                                    onClick={() => handleDeactivate(price.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Deactivate"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {prices.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No market prices found</p>
                </div>
              )}
            </div>
          )}

          {/* Create Price Modal */}
          {showCreateModal && isSuperAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              >
                <h2 className="text-xl font-semibold mb-4">Set New Market Price</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                    <input
                      type="text"
                      value={formData.cropType}
                      onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="e.g., Raspberries, Apples"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price (€) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.buyPrice}
                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (€) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sellPrice}
                        onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                      <input
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective To (optional)</label>
                      <input
                        type="date"
                        value={formData.effectiveTo}
                        onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Create Price
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Edit Price Modal */}
          {editingPrice && isSuperAdmin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
              >
                <h2 className="text-xl font-semibold mb-4">Edit Market Price</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
                    <input
                      type="text"
                      value={formData.cropType}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.buyPrice}
                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.sellPrice}
                        onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective To (optional)</label>
                    <input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPrice(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Update Price
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Price History Modal */}
          {showHistoryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Price History: {selectedCropType}</h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buy Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceHistory.map((price) => (
                        <tr key={price.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">€{price.buyPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">€{price.sellPrice.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(price.effectiveFrom).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {price.effectiveTo ? new Date(price.effectiveTo).toLocaleDateString() : 'No expiry'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              price.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {price.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          )}

          {/* Surge Pricing Modal */}
          {showSurgeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-600" />
                  Apply Surge Pricing
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product
                    </label>
                    <input
                      type="text"
                      value={selectedProductForSurge}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Increase (%)
                    </label>
                    <input
                      type="number"
                      value={surgePercent}
                      onChange={(e) => setSurgePercent(parseFloat(e.target.value))}
                      min="1"
                      max="50"
                      step="0.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      This will increase the sell price by <strong>{surgePercent}%</strong> for all new orders.
                      Existing orders are not affected.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleApplySurgePricing}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
                  >
                    Apply Surge Pricing
                  </button>
                  <button
                    onClick={() => setShowSurgeModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Critical Threshold Modal */}
          {showThresholdModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    Set Critical Threshold
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product
                      </label>
                      <input
                        type="text"
                        value={selectedProductForThreshold}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Critical Threshold (kg)
                      </label>
                      <input
                        type="number"
                        value={thresholdValue}
                        onChange={(e) => setThresholdValue(parseFloat(e.target.value))}
                        min="1"
                        step="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Enter threshold in kg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        When stock falls below this amount, price will automatically increase by 5%
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSetCriticalThreshold}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Set Threshold
                    </button>
                    <button
                      onClick={() => setShowThresholdModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
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

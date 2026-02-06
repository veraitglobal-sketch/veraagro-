'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { getAdminNavItems } from '@/lib/admin-nav';

interface BioVeraStandard {
  id: string;
  requiredTemperatureMin: number;
  requiredTemperatureMax: number;
  requiredPackagingType: string;
  requiredFilmType: string;
  requiresCompliancePhotos: boolean;
  qualityPremiumAmount: number;
  crateCostPerUnit: number;
  labelCostPerUnit: number;
  filmCostPerMeter: number;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminStandardsPage() {
  const adminNavItems = getAdminNavItems();
  const { user } = useAuth();
  const [standard, setStandard] = useState<BioVeraStandard | null>(null);
  const [formData, setFormData] = useState({
    requiredTemperatureMin: '',
    requiredTemperatureMax: '',
    requiredPackagingType: '',
    requiredFilmType: '',
    requiresCompliancePhotos: true,
    qualityPremiumAmount: '',
    crateCostPerUnit: '',
    labelCostPerUnit: '',
    filmCostPerMeter: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStandard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/material-control/standard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setStandard(data);
        setFormData({
          requiredTemperatureMin: data.requiredTemperatureMin.toString(),
          requiredTemperatureMax: data.requiredTemperatureMax.toString(),
          requiredPackagingType: data.requiredPackagingType,
          requiredFilmType: data.requiredFilmType,
          requiresCompliancePhotos: data.requiresCompliancePhotos,
          qualityPremiumAmount: data.qualityPremiumAmount.toString(),
          crateCostPerUnit: data.crateCostPerUnit.toString(),
          labelCostPerUnit: data.labelCostPerUnit.toString(),
          filmCostPerMeter: data.filmCostPerMeter.toString(),
        });
      } catch (err) {
        console.error('Error fetching standard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandard();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/material-control/standard`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            requiredTemperatureMin: parseFloat(formData.requiredTemperatureMin),
            requiredTemperatureMax: parseFloat(formData.requiredTemperatureMax),
            requiredPackagingType: formData.requiredPackagingType,
            requiredFilmType: formData.requiredFilmType,
            requiresCompliancePhotos: formData.requiresCompliancePhotos,
            qualityPremiumAmount: parseFloat(formData.qualityPremiumAmount),
            crateCostPerUnit: parseFloat(formData.crateCostPerUnit),
            labelCostPerUnit: parseFloat(formData.labelCostPerUnit),
            filmCostPerMeter: parseFloat(formData.filmCostPerMeter),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update standard');
      }

      const data = await response.json();
      setStandard(data);
      setSuccess('Bio Vera Standard updated successfully! All farmers will see the new requirements immediately.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Bio Vera Standards" navItems={adminNavItems}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Bio Vera Standards" navItems={adminNavItems}>
      <div className="space-y-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <p className="text-sm text-green-800">{success}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Bio Vera Standard</h2>
          <p className="text-sm text-gray-600 mb-6">
            Changes to the standard will instantly update requirements for all farmers in the app.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Temperature Requirements */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Temperature Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.requiredTemperatureMin}
                    onChange={(e) => setFormData({ ...formData, requiredTemperatureMin: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.requiredTemperatureMax}
                    onChange={(e) => setFormData({ ...formData, requiredTemperatureMax: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Packaging Requirements */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Packaging Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Packaging Type
                  </label>
                  <select
                    value={formData.requiredPackagingType}
                    onChange={(e) => setFormData({ ...formData, requiredPackagingType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="BIO_VERA_CRATE">Bio Vera Crate</option>
                    <option value="BIO_VERA_PUNNET">Bio Vera Punnet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Film Type
                  </label>
                  <select
                    value={formData.requiredFilmType}
                    onChange={(e) => setFormData({ ...formData, requiredFilmType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="BIO_VERA_FILM">Bio Vera Film</option>
                    <option value="BIO_VERA_PREMIUM_FILM">Bio Vera Premium Film</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compliance Requirements */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Compliance Requirements</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresCompliancePhotos"
                  checked={formData.requiresCompliancePhotos}
                  onChange={(e) => setFormData({ ...formData, requiresCompliancePhotos: e.target.checked })}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresCompliancePhotos" className="ml-2 text-sm font-medium text-gray-700">
                  Require Compliance Photos
                </label>
              </div>
            </div>

            {/* Financial Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Financial Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Premium (€ per kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.qualityPremiumAmount}
                    onChange={(e) => setFormData({ ...formData, qualityPremiumAmount: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crate Cost (€ per unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.crateCostPerUnit}
                    onChange={(e) => setFormData({ ...formData, crateCostPerUnit: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Label Cost (€ per unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.labelCostPerUnit}
                    onChange={(e) => setFormData({ ...formData, labelCostPerUnit: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Film Cost (€ per meter)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.filmCostPerMeter}
                    onChange={(e) => setFormData({ ...formData, filmCostPerMeter: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Updating Standard...' : 'Update Bio Vera Standard'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}

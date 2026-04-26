'use client';

import { useState, useEffect } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { growerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';

const navItems = growerNavItems;

interface MaterialBalance {
  crateBalance: number;
  labelRollBalance: number;
  filmMeterBalance: number;
  totalPurchased: any;
}

interface MaterialType {
  id: string;
  name: string;
  type: string;
  unit: string;
  unitPrice: number;
  description: string | null;
}

export default function GrowerMaterialsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<MaterialBalance | null>(null);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setTypesError(null);
      try {
        const token = localStorage.getItem('token');
        const auth = { Authorization: `Bearer ${token}` };
        const [balanceRes, typesRes] = await Promise.all([
          fetch(`${WEB_API_BASE}/material-control/balance`, { headers: auth }),
          fetch(`${WEB_API_BASE}/material-control/material-types`, { headers: auth }),
        ]);

        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          setBalance(balanceData);
        } else {
          setError('Could not load your material balance. Check that you are logged in.');
        }

        if (typesRes.ok) {
          const types = await typesRes.json();
          if (Array.isArray(types)) {
            setMaterialTypes(
              types.map((t: { id: string; name: string; type: string; unit: string; unitPrice: number; description?: string | null }) => ({
                id: t.id,
                name: t.name,
                type: t.type,
                unit: t.unit,
                unitPrice: Number(t.unitPrice) || 0,
                description: t.description ?? null,
              })),
            );
            if (types.length === 0) {
              setTypesError(
                'No products in the catalog. Refresh the page; if the list stays empty, ask a Bio Vera admin to enable material types.',
              );
            } else {
              setTypesError(null);
            }
          } else {
            setMaterialTypes([]);
            setTypesError('Invalid response from the server for material types.');
          }
        } else {
          setTypesError('Could not load the list of materials (network or API).');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load material data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePurchase = async () => {
    if (!selectedMaterial || !quantity || parseInt(quantity) <= 0) {
      setError('Please select a material and enter a valid quantity');
      return;
    }

    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/material-control/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialTypeId: selectedMaterial,
          quantity: parseInt(quantity),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to purchase materials');
      }

      const data = await response.json();
      setBalance(data.balance);
      setSuccess(data.message);
      setSelectedMaterial('');
      setQuantity('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Materials" navItems={navItems}>
        <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading materials…</div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Materials" navItems={navItems}>
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="mb-2">
          <h1 className="text-3xl font-light text-gray-900">Materials</h1>
          <p className="text-sm text-gray-600 mt-1">
            Order official Bio Vera packaging here (crates, label rolls, film). Purchases add to the balances above the form.
          </p>
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}
        {typesError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <p className="text-sm text-amber-950">{typesError}</p>
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

        {/* Material Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Material Balance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-600 mb-1">Crates</p>
              <p className="text-2xl font-bold text-green-600">{balance?.crateBalance || 0}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Label Rolls</p>
              <p className="text-2xl font-bold text-blue-600">{balance?.labelRollBalance || 0}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Film (meters)</p>
              <p className="text-2xl font-bold text-purple-600">{balance?.filmMeterBalance || 0}</p>
            </div>
          </div>
        </motion.div>

        {/* Purchase Materials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Purchase official materials</h2>
          <p className="text-sm text-gray-500 mb-4">
            Open the list and pick <strong>crate</strong> (increments &quot;Crates&quot;), <strong>label roll</strong>, or{' '}
            <strong>film</strong> (meters) — matching the three balance cards.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product to order
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">-- Select Material --</option>
                {materialTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - €{type.unitPrice.toFixed(2)} per {type.unit}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
            </div>
            {selectedMaterial && quantity && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total Cost: €
                  {(
                    parseFloat(quantity) *
                    (materialTypes.find((t) => t.id === selectedMaterial)?.unitPrice || 0)
                  ).toFixed(2)}
                </p>
              </div>
            )}
            <button
              onClick={handlePurchase}
              disabled={purchasing || !selectedMaterial || !quantity}
              className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {purchasing ? 'Processing...' : 'Purchase Materials'}
            </button>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg"
        >
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Important</p>
              <p className="text-sm text-blue-700 mt-1">
                You can only ship batches using official Bio Vera materials. Make sure you have enough materials before reporting a harvest.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}

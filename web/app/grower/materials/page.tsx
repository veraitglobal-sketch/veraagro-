'use client';

import { useState, useEffect, useMemo } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { growerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';
import GrowerSupplyFlowCard from '@/components/grower/GrowerSupplyFlowCard';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

const navItems = growerNavItems;

function messageFromApiPayload(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const m = (data as { message?: unknown }).message;
  if (Array.isArray(m)) return m.filter(Boolean).join(' ');
  if (typeof m === 'string') return m;
  return '';
}

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

interface LabelRollRow {
  serialNumber: string;
  status: string;
  soldAt: string | null;
  productName: string;
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
  const [labelRolls, setLabelRolls] = useState<LabelRollRow[]>([]);
  const [serialsError, setSerialsError] = useState<string | null>(null);
  const [labelRollFilter, setLabelRollFilter] = useState('');

  const loadLabelRolls = async () => {
    try {
      setSerialsError(null);
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${WEB_API_BASE}/material-control/my-label-rolls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLabelRolls(Array.isArray(data) ? data : []);
      } else {
        setLabelRolls([]);
        const err = await res.json().catch(() => ({}));
        setSerialsError(messageFromApiPayload(err) || 'Could not load label roll numbers');
      }
    } catch {
      setLabelRolls([]);
    }
  };

  const labelRollStats = useMemo(() => {
    let sold = 0;
    let used = 0;
    for (const r of labelRolls) {
      const s = (r.status || '').toUpperCase();
      if (s === 'USED') used += 1;
      else if (s === 'SOLD') sold += 1;
    }
    return { total: labelRolls.length, sold, used, other: labelRolls.length - sold - used };
  }, [labelRolls]);

  const filteredLabelRolls = useMemo(() => {
    const q = labelRollFilter.trim().toLowerCase();
    if (!q) return labelRolls;
    return labelRolls.filter((r) => r.serialNumber.toLowerCase().includes(q));
  }, [labelRolls, labelRollFilter]);

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
          const errJson = await balanceRes.json().catch(() => ({}));
          setError(
            messageFromApiPayload(errJson) ||
              'Could not load your material balance. Check that you are logged in.',
          );
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
                'No products in the catalog. Contact your approved supplier in Suppliers & orders, or use Help / contact — an admin may need to enable material types.',
              );
            } else {
              setTypesError(null);
            }
          } else {
            setMaterialTypes([]);
            setTypesError('Invalid response from the server for material types.');
          }
        } else {
          const errJson = await typesRes.json().catch(() => ({}));
          setTypesError(
            messageFromApiPayload(errJson) ||
              'Could not load the list of materials. Try again, or go to Suppliers & orders and message your material partner if the list stays empty.',
          );
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load material data');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    void loadLabelRolls();
  }, []);

  const handlePurchase = async () => {
    const n = parseInt(quantity, 10);
    if (!selectedMaterial || !quantity || Number.isNaN(n) || n <= 0) {
      setError('Please select a material and enter a valid quantity');
      return;
    }
    if (n > 200) {
      setError('Maximum 200 units per order. Lower the quantity and try again.');
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
          quantity: n,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = messageFromApiPayload(errorData) || 'Failed to purchase materials';
        throw new Error(
          `${msg} If this keeps happening, open "Suppliers & orders" to contact your material partner, or use Help / contact.`,
        );
      }

      const data = (await response.json()) as {
        balance: MaterialBalance;
        message: string;
        newSerials?: string[];
      };
      setBalance(data.balance);
      const extra =
        Array.isArray(data.newSerials) && data.newSerials.length > 0
          ? ` Serial numbers: ${data.newSerials.join(', ')}.`
          : '';
      setSuccess(`${data.message}${extra}`);
      setSelectedMaterial('');
      setQuantity('');
      void loadLabelRolls();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title="Materials" navItems={navItems}>
        <GrowerPageShell>
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">Loading materials…</div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title="Materials" navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title="Materials"
          description="Order official Bio Vera packaging (crates, label rolls, film). Purchases update balances and create label roll IDs for compliance."
        />

        <GrowerSupplyFlowCard context="materials" variant="collapsible" />

        <p className="text-sm text-gray-600 flex flex-wrap items-center gap-x-1 gap-y-1">
          <span className="text-gray-500">Shortcuts</span>
          <span className="text-gray-300 hidden sm:inline">·</span>
          <a href="#supply-flow" className="text-[#2D5A27] font-medium underline">
            Supply path
          </a>
          <span className="text-gray-300">·</span>
          <a href="#label-roll-ids" className="text-[#2D5A27] font-medium underline">
            Your label rolls
          </a>
          <span className="text-gray-300">·</span>
          <Link href="/grower/where-to-buy" className="text-[#2D5A27] font-medium underline">
            Suppliers
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium underline">
            Compliance
          </Link>
          <span className="text-gray-300">·</span>
          <Link href="/contact" className="text-[#2D5A27] font-medium underline">
            Help
          </Link>
        </p>

        {balance &&
          balance.crateBalance === 0 &&
          balance.labelRollBalance === 0 &&
          balance.filmMeterBalance === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">Your material balances are 0</p>
              <p className="mt-1">
                Order using the form below, or if you usually buy through a local distributor, open{' '}
                <Link href="/grower/where-to-buy" className="font-semibold text-[#23471f] underline">
                  Suppliers &amp; orders
                </Link>{' '}
                to message them, then ensure your balance here is updated (via purchase or support).
              </p>
            </div>
          )}

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

        <div
          id="label-roll-ids"
          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Your label roll IDs (Sticker Roll ID)</h2>
          <p className="text-sm text-gray-500 mb-4">
            These codes are created when you buy <strong>label rolls</strong> below. Use the same value in{' '}
            <Link href="/grower/compliance-photos" className="text-[#2D5A27] font-medium hover:underline">
              Compliance photos
            </Link>
            .
          </p>
          {serialsError && <p className="text-sm text-amber-800 mb-2">{serialsError}</p>}
          {labelRolls.length === 0 && !serialsError ? (
            <p className="text-sm text-gray-500">
              No label rolls in your account yet — purchase at least one in the form below, then the IDs appear here.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{labelRollStats.total}</span> serial
                {labelRollStats.total === 1 ? '' : 's'} on file
                {labelRollStats.total > 0 ? (
                  <>
                    {' '}
                    — <span className="text-green-800">{labelRollStats.sold} available (SOLD)</span>
                    {labelRollStats.used > 0 ? (
                      <>
                        , <span className="text-gray-600">{labelRollStats.used} used in compliance (USED)</span>
                      </>
                    ) : null}
                    {labelRollStats.other > 0 ? <>, {labelRollStats.other} other</> : null}
                  </>
                ) : null}
                .
              </p>
              {labelRollStats.total > 0 && (
                <div>
                  <label htmlFor="label-roll-search" className="sr-only">
                    Find a serial
                  </label>
                  <input
                    id="label-roll-search"
                    type="search"
                    value={labelRollFilter}
                    onChange={(e) => setLabelRollFilter(e.target.value)}
                    placeholder="Type to find a serial…"
                    className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#2D5A27] focus:outline-none focus:ring-1 focus:ring-[#2D5A27]"
                  />
                  {labelRollFilter.trim() && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      {filteredLabelRolls.length} match{filteredLabelRolls.length === 1 ? '' : 'es'}
                    </p>
                  )}
                </div>
              )}
              <div
                className="max-h-72 sm:max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/50 scroll-pt-1"
                role="region"
                aria-label="Label roll serial list"
              >
                <ul className="divide-y divide-gray-100">
                  {filteredLabelRolls.map((r) => (
                    <li
                      key={r.serialNumber}
                      className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 sm:py-2.5 text-sm"
                    >
                      <code className="font-mono text-xs sm:text-sm text-gray-900 break-all">{r.serialNumber}</code>
                      <span className="text-xs text-gray-500 shrink-0">
                        {r.status}
                        {r.soldAt ? ` · ${new Date(r.soldAt).toLocaleString()}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {filteredLabelRolls.length === 0 && labelRollFilter.trim() && (
                  <p className="p-3 text-sm text-gray-500">No serials match that text.</p>
                )}
              </div>
            </div>
          )}
        </div>

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
                max="200"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1–200 per order"
              />
              <p className="text-xs text-gray-500 mt-1">Max 200 units per order (e.g. 100 label rolls = 100 serial numbers in the system).</p>
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
      </GrowerPageShell>
    </SidebarLayout>
  );
}

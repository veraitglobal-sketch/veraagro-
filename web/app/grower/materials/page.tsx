'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';
import GrowerSupplyFlowCard from '@/components/grower/GrowerSupplyFlowCard';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

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
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const navItems = useGrowerNavItems();
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

  const formatDateTime = useCallback(
    (iso: string | null | undefined) => {
      if (iso == null) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      const tag = i18n.language?.startsWith('sr') ? 'sr-Latn' : 'en-GB';
      return d.toLocaleString(tag, { dateStyle: 'short', timeStyle: 'short' });
    },
    [i18n.language],
  );

  const rollStatusLabel = useCallback(
    (raw: string) => {
      const u = (raw || '').toUpperCase();
      const key = `growerPages.materialsRollStatus_${u}` as const;
      const tr = t(key);
      if (tr !== key) return tr;
      return raw;
    },
    [t],
  );

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
        setSerialsError(messageFromApiPayload(err) || t('growerPages.materialsSerialsLoadFailed'));
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
          setError(messageFromApiPayload(errJson) || t('growerPages.materialsErrBalance'));
        }

        if (typesRes.ok) {
          const types = await typesRes.json();
          if (Array.isArray(types)) {
            setMaterialTypes(
              types.map((row: { id: string; name: string; type: string; unit: string; unitPrice: number; description?: string | null }) => ({
                id: row.id,
                name: row.name,
                type: row.type,
                unit: row.unit,
                unitPrice: Number(row.unitPrice) || 0,
                description: row.description ?? null,
              })),
            );
            if (types.length === 0) {
              setTypesError(t('growerPages.materialsErrCatalogEmpty'));
            } else {
              setTypesError(null);
            }
          } else {
            setMaterialTypes([]);
            setTypesError(t('growerPages.materialsErrTypesInvalid'));
          }
        } else {
          const errJson = await typesRes.json().catch(() => ({}));
          setTypesError(messageFromApiPayload(errJson) || t('growerPages.materialsErrTypesLoad'));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('growerPages.materialsErrFetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    void loadLabelRolls();
  }, [t]);

  const handlePurchase = async () => {
    const n = parseInt(quantity, 10);
    if (!selectedMaterial || !quantity || Number.isNaN(n) || n <= 0) {
      setError(t('growerPages.materialsErrSelectQty'));
      return;
    }
    if (n > 200) {
      setError(t('growerPages.materialsErrMaxQty'));
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
        const msg = messageFromApiPayload(errorData) || t('growerPages.materialsErrPurchaseFailed');
        throw new Error(`${msg} ${t('growerPages.materialsErrPurchaseHint')}`);
      }

      const data = (await response.json()) as {
        balance: MaterialBalance;
        message: string;
        newSerials?: string[];
      };
      setBalance(data.balance);
      const extra =
        Array.isArray(data.newSerials) && data.newSerials.length > 0
          ? t('growerPages.materialsSuccessSerials', { list: data.newSerials.join(', ') })
          : '';
      setSuccess(`${data.message}${extra}`);
      setSelectedMaterial('');
      setQuantity('');
      void loadLabelRolls();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('growerPages.materialsErrFetchFailed'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title={t('grower.nav.materials')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
            {t('growerPages.materialsLoading')}
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={t('grower.nav.materials')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader title={t('grower.nav.materials')} description={t('growerPages.materialsPageDescription')} />

        {balance &&
          balance.crateBalance === 0 &&
          balance.labelRollBalance === 0 &&
          balance.filmMeterBalance === 0 && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">{t('growerPages.materialsBalanceZeroTitle')}</p>
              <p className="mt-1 font-light leading-relaxed">
                <Trans
                  i18nKey="growerPages.materialsBalanceZeroBody"
                  components={[
                    <Link key="0" href={loc('/grower/where-to-buy')} className="font-semibold text-[#23471f] underline" />,
                  ]}
                />
              </p>
            </div>
          )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {typesError && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-950">{typesError}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-2xl font-medium text-gray-900">{balance?.crateBalance ?? 0}</div>
            <div className="mt-1 text-sm text-gray-600">{t('growerPages.materialsStatCrate')}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-2xl font-medium text-green-600">{balance?.labelRollBalance ?? 0}</div>
            <div className="mt-1 text-sm text-gray-600">{t('growerPages.materialsStatRolls')}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-2xl font-medium text-blue-600">{balance?.filmMeterBalance ?? 0}</div>
            <div className="mt-1 text-sm text-gray-600">{t('growerPages.materialsStatFilm')}</div>
          </div>
        </div>

        <p className="text-sm text-gray-600 flex flex-wrap items-center gap-x-1 gap-y-1">
          <span className="text-gray-500">{t('growerPages.materialsShortcuts')}</span>
          <span className="text-gray-300 hidden sm:inline">·</span>
          <a href="#label-roll-ids" className="font-medium text-[#2D5A27] underline">
            {t('growerPages.materialsShortcutLabelRolls')}
          </a>
          <span className="text-gray-300">·</span>
          <a href="#supply-flow" className="font-medium text-[#2D5A27] underline">
            {t('growerPages.materialsShortcutSupplyPath')}
          </a>
          <span className="text-gray-300">·</span>
          <Link href={loc('/grower/where-to-buy')} className="font-medium text-[#2D5A27] underline">
            {t('growerPages.materialsShortcutSuppliers')}
          </Link>
          <span className="text-gray-300">·</span>
          <Link href={loc('/grower/compliance-photos')} className="font-medium text-[#2D5A27] underline">
            {t('growerPages.materialsShortcutCompliance')}
          </Link>
          <span className="text-gray-300">·</span>
          <Link href={loc('/contact')} className="font-medium text-[#2D5A27] underline">
            {t('growerPages.materialsShortcutHelp')}
          </Link>
        </p>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('growerPages.materialsPurchaseTitle')}</h2>
          <p className="mb-4 text-sm text-gray-500 font-light leading-relaxed">
            <Trans
              i18nKey="growerPages.materialsPurchaseIntro"
              components={[
                <strong key="0" className="font-semibold text-gray-900" />,
                <strong key="1" className="font-semibold text-gray-900" />,
                <strong key="2" className="font-semibold text-gray-900" />,
              ]}
            />
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t('growerPages.materialsProductLabel')}</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
              >
                <option value="">{t('growerPages.materialsSelectPlaceholder')}</option>
                {materialTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {t('growerPages.materialsOptionLine', {
                      name: type.name,
                      price: type.unitPrice.toFixed(2),
                      unit: type.unit,
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t('growerPages.materialsQuantityLabel')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="200"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-green-500"
                placeholder={t('growerPages.materialsQuantityPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-500">{t('growerPages.materialsQuantityHint')}</p>
            </div>
            {selectedMaterial && quantity && (
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  {t('growerPages.materialsTotalCost', {
                    amount: (
                      parseFloat(quantity) *
                      (materialTypes.find((mt) => mt.id === selectedMaterial)?.unitPrice || 0)
                    ).toFixed(2),
                  })}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchasing || !selectedMaterial || !quantity}
              className="w-full rounded-lg bg-[#2D5A27] px-6 py-3 font-medium text-white transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {purchasing ? t('growerPages.materialsPurchasing') : t('growerPages.materialsPurchaseCta')}
            </button>
          </div>
        </div>

        <div id="label-roll-ids" className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('growerPages.materialsLabelRollTitle')}</h2>
          <p className="mb-4 text-sm text-gray-500 font-light leading-relaxed">
            <Trans
              i18nKey="growerPages.materialsLabelRollIntro"
              components={[
                <strong key="0" className="font-semibold text-gray-900" />,
                <Link key="1" href={loc('/grower/compliance-photos')} className="font-medium text-[#2D5A27] hover:underline" />,
              ]}
            />
          </p>
          {serialsError && <p className="mb-2 text-sm text-amber-800">{serialsError}</p>}
          {labelRolls.length === 0 && !serialsError ? (
            <p className="text-sm text-gray-500">{t('growerPages.materialsLabelRollEmpty')}</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {t('growerPages.materialsSerialOnFile', { count: labelRollStats.total })}
                </span>
                {labelRollStats.total > 0 ? (
                  <>
                    {' — '}
                    <span className="text-green-800">{t('growerPages.materialsSerialSold', { count: labelRollStats.sold })}</span>
                    {labelRollStats.used > 0 ? (
                      <>
                        {', '}
                        <span className="text-gray-600">{t('growerPages.materialsSerialUsed', { count: labelRollStats.used })}</span>
                      </>
                    ) : null}
                    {labelRollStats.other > 0 ? (
                      <>
                        {', '}
                        {t('growerPages.materialsSerialOther', { count: labelRollStats.other })}
                      </>
                    ) : null}
                  </>
                ) : null}
                .
              </p>
              {labelRollStats.total > 0 && (
                <div>
                  <label htmlFor="label-roll-search" className="sr-only">
                    {t('growerPages.materialsFindSerialLabel')}
                  </label>
                  <input
                    id="label-roll-search"
                    type="search"
                    value={labelRollFilter}
                    onChange={(e) => setLabelRollFilter(e.target.value)}
                    placeholder={t('growerPages.materialsSerialSearchPh')}
                    className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#2D5A27] focus:outline-none focus:ring-1 focus:ring-[#2D5A27]"
                  />
                  {labelRollFilter.trim() && (
                    <p className="mt-1.5 text-xs text-gray-500">
                      {t('growerPages.materialsSerialMatch', { count: filteredLabelRolls.length })}
                    </p>
                  )}
                </div>
              )}
              <div
                className="max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/50 sm:max-h-80"
                role="region"
                aria-label={t('growerPages.materialsSerialListAria')}
              >
                <ul className="divide-y divide-gray-100">
                  {filteredLabelRolls.map((r) => (
                    <li
                      key={r.serialNumber}
                      className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-2 text-sm sm:py-2.5"
                    >
                      <code className="break-all font-mono text-xs text-gray-900 sm:text-sm">{r.serialNumber}</code>
                      <span className="shrink-0 text-xs text-gray-500">
                        {rollStatusLabel(r.status)}
                        {r.soldAt ? ` · ${formatDateTime(r.soldAt)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                {filteredLabelRolls.length === 0 && labelRollFilter.trim() && (
                  <p className="p-3 text-sm text-gray-500">{t('growerPages.materialsSerialNoMatch')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <GrowerSupplyFlowCard context="materials" variant="collapsible" />
        </div>

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
          <div className="flex items-start">
            <svg
              className="mr-3 mt-0.5 h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">{t('growerPages.materialsImportantTitle')}</p>
              <p className="mt-1 text-sm text-blue-700 font-light leading-relaxed">{t('growerPages.materialsImportantBody')}</p>
            </div>
          </div>
        </div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}

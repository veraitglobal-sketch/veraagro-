'use client';

import { useState, useEffect, useMemo, useCallback, type FormEvent, type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';
import GrowerSupplyFlowCard from '@/components/grower/GrowerSupplyFlowCard';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import {
  AlertTriangle,
  Box,
  ClipboardList,
  ExternalLink,
  Film,
  Info,
  Layers,
  Loader2,
  Package,
  Search,
  ShieldCheck,
  ShoppingCart,
  Tag,
} from 'lucide-react';

const inputClass =
  'w-full min-h-[48px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25';

const btnPrimary =
  'inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#23471f] focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const sectionCard = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6';

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-5">
      {eyebrow ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#2D5A27]">{eyebrow}</p>
      ) : null}
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle ? <div className="mt-2 text-base font-light leading-relaxed text-gray-600">{subtitle}</div> : null}
    </div>
  );
}

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

  const [wlType, setWlType] = useState<'SEED' | 'FERTILIZER' | 'PESTICIDE' | 'OTHER'>('SEED');
  const [wlName, setWlName] = useState('');
  const [wlBarcode, setWlBarcode] = useState('');
  const [wlManufacturer, setWlManufacturer] = useState('');
  const [wlSaving, setWlSaving] = useState(false);
  const [wlErr, setWlErr] = useState<string | null>(null);
  const [wlOk, setWlOk] = useState<string | null>(null);

  const wlNamePlaceholder = useMemo(() => {
    const k = `growerPages.materialsWhitelistNamePh_${wlType}` as const;
    const tr = t(k);
    if (tr !== k) return tr;
    return t('growerPages.materialsWhitelistNamePh');
  }, [wlType, t]);

  const formatDateTime = useCallback(
    (iso: string | null | undefined) => {
      if (iso == null) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      const tag = dateIntlLocaleFromLanguageTag(i18n.language);
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

  const submitWhitelistMaterial = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = wlName.trim();
    const barcode = wlBarcode.trim();
    if (!name || barcode.length < 3) {
      setWlErr(t('growerPages.materialsWhitelistErrRequired'));
      setWlOk(null);
      return;
    }
    setWlSaving(true);
    setWlErr(null);
    setWlOk(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setWlErr(t('growerPages.materialsWhitelistErrAuth'));
        return;
      }
      const res = await fetch(`${WEB_API_BASE}/compliance/white-list/grower`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName: name,
          barcode,
          materialType: wlType,
          manufacturer: wlManufacturer.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setWlErr(messageFromApiPayload(data) || t('growerPages.materialsWhitelistErrSave'));
        return;
      }
      setWlOk(t('growerPages.materialsWhitelistSuccess'));
      setWlName('');
      setWlBarcode('');
      setWlManufacturer('');
      setWlType('SEED');
    } catch {
      setWlErr(t('growerPages.materialsWhitelistErrSave'));
    } finally {
      setWlSaving(false);
    }
  };

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
      } catch (err: unknown) {
        console.error('Error fetching data:', err);
        setError(growerApiErrorOrT(err, t, 'growerPages.materialsErrFetchFailed'));
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
      setError(
        err instanceof Error ? err.message : growerApiErrorOrT(err, t, 'growerPages.materialsErrFetchFailed'),
      );
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout title={t('grower.nav.materials')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-base text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" aria-hidden />
            <span>{t('growerPages.materialsLoading')}</span>
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  const shortcutClass =
    'inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:border-[#2D5A27]/40 hover:bg-[#f7faf6] focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:ring-offset-2';

  return (
    <SidebarLayout title={t('grower.nav.materials')} navItems={navItems}>
      <GrowerPageShell className="space-y-8">
        <GrowerPageHeader title={t('grower.nav.materials')} description={t('growerPages.materialsPageDescription')} />

        {balance &&
          balance.crateBalance === 0 &&
          balance.labelRollBalance === 0 &&
          balance.filmMeterBalance === 0 && (
            <div className={`${sectionCard} border-amber-200 bg-amber-50/90`}>
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" aria-hidden />
                <div>
                  <p className="text-base font-semibold text-amber-950">{t('growerPages.materialsBalanceZeroTitle')}</p>
                  <p className="mt-2 font-light leading-relaxed text-amber-950/90">
                    <Trans
                      i18nKey="growerPages.materialsBalanceZeroBody"
                      components={[
                        <Link
                          key="0"
                          href={loc('/grower/where-to-buy')}
                          className="font-semibold text-[#23471f] underline decoration-[#23471f]/40 underline-offset-2 hover:decoration-[#23471f]"
                        />,
                      ]}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}

        <div className="space-y-4">
          {error && (
            <div className={`${sectionCard} border-red-200 bg-red-50/80`}>
              <p className="text-base text-red-900">{error}</p>
            </div>
          )}
          {typesError && (
            <div className={`${sectionCard} border-amber-200 bg-amber-50/70`}>
              <p className="text-base text-amber-950">{typesError}</p>
            </div>
          )}
          {success && (
            <div className={`${sectionCard} border-[#2D5A27]/25 bg-[#f7faf6]`}>
              <p className="text-base font-medium text-[#1a3d17]">{success}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              value: balance?.crateBalance ?? 0,
              label: t('growerPages.materialsStatCrate'),
              icon: Box,
              accent: 'text-gray-900',
            },
            {
              value: balance?.labelRollBalance ?? 0,
              label: t('growerPages.materialsStatRolls'),
              icon: Tag,
              accent: 'text-[#2D5A27]',
            },
            {
              value: balance?.filmMeterBalance ?? 0,
              label: t('growerPages.materialsStatFilm'),
              icon: Film,
              accent: 'text-emerald-800',
            },
          ].map(({ value, label, icon: Icon, accent }) => (
            <div key={label} className={`${sectionCard} flex flex-col justify-between gap-3`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-3xl font-semibold tabular-nums ${accent}`}>{value}</p>
                  <p className="mt-1 text-base text-gray-600">{label}</p>
                </div>
                <span className="rounded-lg bg-gray-100 p-2.5 text-gray-600" aria-hidden>
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={sectionCard}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('growerPages.materialsShortcuts')}</p>
          <nav className="flex flex-wrap gap-2 sm:gap-3" aria-label={t('growerPages.materialsShortcuts')}>
            <a href="#label-roll-ids" className={`${shortcutClass}`}>
              <Layers className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t('growerPages.materialsShortcutLabelRolls')}
            </a>
            <a href="#supply-flow" className={`${shortcutClass}`}>
              <Package className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t('growerPages.materialsShortcutSupplyPath')}
            </a>
            <Link href={loc('/grower/where-to-buy')} className={`${shortcutClass}`}>
              <ShoppingCart className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t('growerPages.materialsShortcutSuppliers')}
            </Link>
            <Link href={loc('/grower/compliance-photos')} className={`${shortcutClass}`}>
              <ClipboardList className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t('growerPages.materialsShortcutCompliance')}
            </Link>
            <Link href={loc('/contact')} className={`${shortcutClass}`}>
              <ExternalLink className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden />
              {t('growerPages.materialsShortcutHelp')}
            </Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
          <div className={`${sectionCard} order-2 border-[#2D5A27]/15 lg:order-1`}>
            <SectionTitle title={t('growerPages.materialsWhitelistTitle')} subtitle={t('growerPages.materialsWhitelistIntro')} />
            <p className="mb-4 text-base font-medium text-gray-800">{t('growerPages.materialsWhitelistPickType')}</p>
            <form onSubmit={submitWhitelistMaterial} className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {(['SEED', 'FERTILIZER', 'PESTICIDE', 'OTHER'] as const).map((id) => {
                  const on = wlType === id;
                  const lblKey = `growerPages.materialsWhitelistType_${id}` as const;
                  const lbl = t(lblKey);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setWlType(id);
                        setWlErr(null);
                        setWlOk(null);
                      }}
                      className={`min-h-[44px] rounded-lg px-4 py-2 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5A27] focus:ring-offset-2 ${
                        on
                          ? 'bg-[#2D5A27] text-white shadow-sm'
                          : 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {lbl !== lblKey ? lbl : id}
                    </button>
                  );
                })}
              </div>
              {wlErr && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base text-red-900">{wlErr}</p>
              )}
              {wlOk && (
                <p className="rounded-xl border border-[#2D5A27]/20 bg-[#f7faf6] px-4 py-3 text-base font-medium text-[#1a3d17]">
                  {wlOk}
                </p>
              )}
              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-base font-medium text-gray-700" htmlFor="wl-name">
                    {t('growerPages.materialsWhitelistName')}
                  </label>
                  <input
                    id="wl-name"
                    type="text"
                    required
                    value={wlName}
                    onChange={(e) => setWlName(e.target.value)}
                    placeholder={wlNamePlaceholder}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-medium text-gray-700" htmlFor="wl-barcode">
                    {t('growerPages.materialsWhitelistBarcode')}
                  </label>
                  <input
                    id="wl-barcode"
                    type="text"
                    required
                    minLength={3}
                    value={wlBarcode}
                    onChange={(e) => setWlBarcode(e.target.value)}
                    placeholder={t('growerPages.materialsWhitelistBarcodePh')}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-base font-medium text-gray-700" htmlFor="wl-mfg">
                    {t('growerPages.materialsWhitelistManufacturer')}
                  </label>
                  <input
                    id="wl-mfg"
                    type="text"
                    value={wlManufacturer}
                    onChange={(e) => setWlManufacturer(e.target.value)}
                    placeholder={t('growerPages.materialsWhitelistManufacturerPh')}
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
                <button type="submit" disabled={wlSaving} className={btnPrimary}>
                  {wlSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 shrink-0 animate-spin" aria-hidden />
                      {t('growerPages.materialsWhitelistSaving')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5 shrink-0 opacity-95" aria-hidden />
                      {t('growerPages.materialsWhitelistSave')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className={`${sectionCard} order-1 lg:order-2`}>
            <SectionTitle
              title={t('growerPages.materialsPurchaseTitle')}
              subtitle={
                <Trans
                  i18nKey="growerPages.materialsPurchaseIntro"
                  components={[
                    <strong key="0" className="font-semibold text-gray-900" />,
                    <strong key="1" className="font-semibold text-gray-900" />,
                    <strong key="2" className="font-semibold text-gray-900" />,
                  ]}
                />
              }
            />
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-base font-medium text-gray-700" htmlFor="mat-product">
                  {t('growerPages.materialsProductLabel')}
                </label>
                <select
                  id="mat-product"
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className={`${inputClass}`}
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
                <label className="mb-2 block text-base font-medium text-gray-700" htmlFor="mat-qty">
                  {t('growerPages.materialsQuantityLabel')}
                </label>
                <input
                  id="mat-qty"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max="200"
                  className={inputClass}
                  placeholder={t('growerPages.materialsQuantityPlaceholder')}
                />
                <p className="mt-2 text-sm text-gray-500">{t('growerPages.materialsQuantityHint')}</p>
              </div>
              {selectedMaterial && quantity ? (
                <div className="rounded-xl border border-gray-100 bg-[#f7faf6] p-4">
                  <p className="text-base text-gray-800">
                    {t('growerPages.materialsTotalCost', {
                      amount: (
                        parseFloat(quantity) *
                        (materialTypes.find((mt) => mt.id === selectedMaterial)?.unitPrice || 0)
                      ).toFixed(2),
                    })}
                  </p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing || !selectedMaterial || !quantity}
                className={`${btnPrimary}`}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 shrink-0 animate-spin" aria-hidden />
                    {t('growerPages.materialsPurchasing')}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5 shrink-0 opacity-95" aria-hidden />
                    {t('growerPages.materialsPurchaseCta')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div id="label-roll-ids" className={sectionCard}>
          <SectionTitle
            title={t('growerPages.materialsLabelRollTitle')}
            subtitle={
              <Trans
                i18nKey="growerPages.materialsLabelRollIntro"
                components={[
                  <strong key="0" className="font-semibold text-gray-900" />,
                  <Link
                    key="1"
                    href={loc('/grower/compliance-photos')}
                    className="font-semibold text-[#2D5A27] underline decoration-[#2D5A27]/35 underline-offset-2 hover:text-[#23471f]"
                  />,
                ]}
              />
            }
          />
          {serialsError ? (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-950">{serialsError}</p>
          ) : null}
          {labelRolls.length === 0 && !serialsError ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <Tag className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden />
              <p className="text-base text-gray-600">{t('growerPages.materialsLabelRollEmpty')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-gray-700">
                <span className="font-semibold text-gray-900">
                  {t('growerPages.materialsSerialOnFile', { count: labelRollStats.total })}
                </span>
                {labelRollStats.total > 0 ? (
                  <>
                    {' — '}
                    <span className="text-[#1a3d17]">{t('growerPages.materialsSerialSold', { count: labelRollStats.sold })}</span>
                    {labelRollStats.used > 0 ? (
                      <>
                        {', '}
                        <span className="text-gray-700">{t('growerPages.materialsSerialUsed', { count: labelRollStats.used })}</span>
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
                <div className="relative max-w-xl">
                  <label htmlFor="label-roll-search" className="sr-only">
                    {t('growerPages.materialsFindSerialLabel')}
                  </label>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden />
                  <input
                    id="label-roll-search"
                    type="search"
                    value={labelRollFilter}
                    onChange={(e) => setLabelRollFilter(e.target.value)}
                    placeholder={t('growerPages.materialsSerialSearchPh')}
                    className={`${inputClass} pl-11`}
                  />
                  {labelRollFilter.trim() ? (
                    <p className="mt-2 text-sm text-gray-500">
                      {t('growerPages.materialsSerialMatch', { count: filteredLabelRolls.length })}
                    </p>
                  ) : null}
                </div>
              )}
              <div
                className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 shadow-inner"
                role="region"
                aria-label={t('growerPages.materialsSerialListAria')}
              >
                <div className="max-h-80 overflow-y-auto">
                  <ul className="divide-y divide-gray-100">
                    {filteredLabelRolls.map((r) => (
                      <li
                        key={r.serialNumber}
                        className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 transition-colors hover:bg-[#fafbf9] sm:flex-nowrap sm:py-3.5"
                      >
                        <code className="break-all font-mono text-xs text-gray-900 sm:text-sm">{r.serialNumber}</code>
                        <span className="shrink-0 text-sm text-gray-600">
                          {rollStatusLabel(r.status)}
                          {r.soldAt ? ` · ${formatDateTime(r.soldAt)}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {filteredLabelRolls.length === 0 && labelRollFilter.trim() ? (
                    <p className="p-6 text-center text-base text-gray-600">{t('growerPages.materialsSerialNoMatch')}</p>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        <div id="supply-flow" className="scroll-mt-6">
          <GrowerSupplyFlowCard context="materials" variant="collapsible" />
        </div>

        <div className={`${sectionCard} border-[#2D5A27]/25 bg-[#f7faf6]`}>
          <div className="flex gap-4">
            <Info className="mt-1 h-6 w-6 shrink-0 text-[#2D5A27]" aria-hidden />
            <div>
              <p className="text-base font-semibold text-[#143214]">{t('growerPages.materialsImportantTitle')}</p>
              <p className="mt-2 text-base font-light leading-relaxed text-[#1a3820]">{t('growerPages.materialsImportantBody')}</p>
            </div>
          </div>
        </div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}

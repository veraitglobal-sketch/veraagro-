'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { ordersAPI } from '@/lib/api';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { formatAppOrderDate } from '@biovera/shared/i18n/buyer-order-format';
import { orderStatusLabel } from '@biovera/shared/i18n/labels';
import {
  canRecordPacking,
  expectedPackedKg,
  packedWeightRange,
  validatePacking,
} from '@biovera/shared/validation/order-packing';
import { growerApiErrorOrT } from '@/lib/grower-api-error';

type CompatibleBatch = {
  id: string;
  batchId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  selected?: boolean;
};

type GrowerOrderRow = {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  packLine?: string;
  packLabel?: string | null;
  packSizeKg?: number | null;
  quantity: number;
  unit: string;
  deliveryCity?: string;
  deliveryNotes?: string | null;
  nextAction?: string;
  packedPackCount?: number | null;
  packedKg?: number | null;
  packedAt?: string | null;
  packedBatchId?: string | null;
  packed_batch?: { id: string; batchId: string } | null;
  packCount?: number | null;
  createdAt: string;
  missions?: Array<{ id: string; status: string; missionNumber: string }>;
};

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none transition-colors font-light bg-white';

function PackingForm({
  order,
  lang,
  onSaved,
  onCancel,
}: {
  order: GrowerOrderRow;
  lang: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [packs, setPacks] = useState<string>(String(order.packedPackCount ?? order.packCount ?? 1));
  const [batchId, setBatchId] = useState<string>(order.packedBatchId ?? '');
  const [lots, setLots] = useState<CompatibleBatch[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const packsNum = Number(packs);
  const expected = expectedPackedKg(order, packsNum);
  const [kg, setKg] = useState<string>(order.packedKg != null ? String(order.packedKg) : '');
  const [kgTouched, setKgTouched] = useState(order.packedKg != null);
  const [declaredHours, setDeclaredHours] = useState('');
  const [packagingType, setPackagingType] = useState(order.packLabel ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLotsLoading(true);
      try {
        const data = await ordersAPI.getCompatibleBatches(order.id);
        if (cancelled) return;
        const rows = Array.isArray(data) ? (data as CompatibleBatch[]) : [];
        setLots(rows);
        const pre = order.packedBatchId ?? rows.find((b) => b.selected)?.id ?? rows[0]?.id ?? '';
        setBatchId(pre);
      } catch {
        if (!cancelled) setLots([]);
      } finally {
        if (!cancelled) setLotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order.id, order.packedBatchId]);

  // Until the grower types a weight, it follows packs × pack size.
  const shownKg = kgTouched ? kg : expected != null ? String(expected) : kg;
  const kgNum = shownKg.trim() === '' ? null : Number(shownKg.replace(',', '.'));
  const range = packedWeightRange(order, packsNum);
  const problem = validatePacking(order, packsNum, kgNum);
  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 3 });

  const problemText =
    problem === 'notPaid'
      ? t('growerPages.packingErrNotPaid')
      : problem === 'packsMin'
        ? t('growerPages.packingErrPacksMin')
        : problem === 'packsMax'
          ? t('growerPages.packingErrPacksMax', { max: order.packCount })
          : problem === 'weightRange' && range
            ? t('growerPages.packingErrWeight', { min: nf.format(range.min), max: nf.format(range.max) })
            : null;

  const lotMissing = !batchId.trim();

  const save = async () => {
    if (problem || lotMissing) return;
    setSaving(true);
    setErr(null);
    try {
      await ordersAPI.recordPacking(order.id, {
        packedPackCount: packsNum,
        batchId: batchId.trim(),
        ...(kgNum != null ? { packedKg: kgNum } : {}),
        ...(declaredHours.trim()
          ? { declaredShelfLifeHours: Math.floor(Number(declaredHours.replace(',', '.'))) }
          : {}),
        ...(packagingType.trim() ? { packagingType: packagingType.trim() } : {}),
      });
      onSaved();
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.packingSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
      <label className="block text-sm font-medium text-gray-900">
        {t('growerPages.packingSelectLot')}
        <select
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          disabled={lotsLoading || lots.length === 0}
          className={`${inputClass} mt-1`}
          required
        >
          <option value="">{t('growerPages.packingSelectLotPlaceholder')}</option>
          {lots.map((b) => (
            <option key={b.id} value={b.id}>
              {b.batchId} — {b.productName} ({nf.format(b.quantity)} {b.unit})
            </option>
          ))}
        </select>
        {lotsLoading ? (
          <span className="mt-1 block text-xs font-light text-gray-500">{t('growerPages.packingLoadingLots')}</span>
        ) : lots.length === 0 ? (
          <span className="mt-1 block text-xs text-amber-800">
            {t('growerPages.packingNoLots')}{' '}
            <Link href="/grower/quality-entry" className="font-medium text-[#2D5A27] underline">
              {t('growerPages.packingNoLotsLink')}
            </Link>
          </span>
        ) : null}
        {lotMissing && !lotsLoading && lots.length > 0 && (
          <span className="mt-1 block text-xs text-red-700">{t('growerPages.packingSelectLotRequired')}</span>
        )}
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-medium text-gray-900">
          {t('growerPages.packingPacks')}
          <input
            type="number"
            min={1}
            max={order.packCount ?? undefined}
            step={1}
            inputMode="numeric"
            value={packs}
            onChange={(e) => setPacks(e.target.value)}
            className={`${inputClass} mt-1`}
          />
          {order.packCount != null && (
            <span className="mt-1 block text-xs font-light text-gray-500">
              {t('growerPages.packingOrderedPacks', { count: order.packCount })}
            </span>
          )}
        </label>
        <div className="block text-sm font-medium text-gray-900">
          {t('growerPages.packingPackSize')}
          <p className="mt-1 px-4 py-2 rounded-lg border border-gray-200 bg-white font-light text-gray-700">
            {order.packLabel || (order.packSizeKg != null ? `${nf.format(order.packSizeKg)} kg` : '—')}
          </p>
        </div>
        <label className="block text-sm font-medium text-gray-900">
          {t('growerPages.packingNetKg')}
          <input
            type="text"
            inputMode="decimal"
            value={shownKg}
            onChange={(e) => {
              setKgTouched(true);
              setKg(e.target.value);
            }}
            className={`${inputClass} mt-1`}
          />
          {range && (
            <span className="mt-1 block text-xs font-light text-gray-500">
              {t('growerPages.packingWeightHint', { min: nf.format(range.min), max: nf.format(range.max) })}
            </span>
          )}
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-900">
          {t('growerPages.packingDeclaredShelfLife', 'Declared shelf life (hours, optional)')}
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={declaredHours}
            onChange={(e) => setDeclaredHours(e.target.value)}
            placeholder={t('growerPages.packingDeclaredShelfLifeHint', 'Only if printed on the label')}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm font-medium text-gray-900">
          {t('growerPages.packingPackagingType', 'Packaging type')}
          <input
            type="text"
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value)}
            placeholder={t('growerPages.packingPackagingTypeHint', 'e.g. crate 5 kg')}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>
      {(problemText || err) && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{err || problemText}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || !!problem || lotMissing || lots.length === 0}
          className="inline-flex min-h-[44px] items-center rounded-lg bg-[#2D5A27] px-4 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
        >
          {saving ? t('growerPages.packingSaving') : t('growerPages.packingSave')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}

export default function GrowerOrdersPage() {
  const { t, i18n } = useTranslation();
  const nav = useGrowerNavItems();
  const lang = i18n.language?.split('-')[0] || 'en';
  const [orders, setOrders] = useState<GrowerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await ordersAPI.getForGrower('prepare');
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setErr(growerApiErrorOrT(e, t, 'growerPages.loadFailed'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const nf = new Intl.NumberFormat(lang, { maximumFractionDigits: 3 });

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']}>
      <SidebarLayout title={t('growerPages.ordersToPrepareTitle')} navItems={nav}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('growerPages.ordersToPrepareTitle')}
            description={t('growerPages.ordersToPrepareLead')}
          />
          {err && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">{err}</div>}
          {loading ? (
            <p className="text-gray-600">{t('common.loading')}</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">{t('growerPages.ordersToPrepareEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => {
                const packed = o.packedAt != null && (o.packedPackCount ?? 0) > 0;
                const mission = o.missions?.[0];
                return (
                  <li key={o.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{o.orderNumber}</p>
                        <p className="text-sm text-gray-700">{o.productName}</p>
                        {o.packLine && <p className="text-sm text-[#2D5A27] mt-1">{o.packLine}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          {nf.format(o.quantity)} {o.unit}
                          {o.deliveryCity ? ` · ${o.deliveryCity}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">{formatAppOrderDate(o.createdAt, lang)}</p>
                        <p className={`text-sm mt-2 ${packed ? 'text-[#2D5A27]' : 'text-amber-700'}`}>
                          {packed
                            ? t('growerPages.packingDone', {
                                packed: o.packedPackCount,
                                total: o.packCount ?? o.packedPackCount,
                                kg: o.packedKg != null ? nf.format(o.packedKg) : '—',
                                date: formatAppOrderDate(o.packedAt as string, lang, {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }),
                              })
                            : t('growerPages.packingNotYet')}
                        </p>
                        {mission && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t('growerPages.packingMission', { mission: mission.missionNumber })}
                          </p>
                        )}
                      </div>
                      <span className="text-xs rounded-full border border-gray-200 px-2 py-1 text-gray-700">
                        {orderStatusLabel(t, o.status, 'buyer')}
                      </span>
                    </div>
                    {editingId === o.id ? (
                      <PackingForm
                        order={o}
                        lang={lang}
                        onCancel={() => setEditingId(null)}
                        onSaved={() => {
                          setEditingId(null);
                          void load();
                        }}
                      />
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {canRecordPacking(o) && o.nextAction !== 'AWAITING_PICKUP' && (
                          <button
                            type="button"
                            onClick={() => setEditingId(o.id)}
                            className={
                              o.nextAction === 'PREPARE_AND_PACK'
                                ? 'inline-flex min-h-[44px] items-center rounded-lg bg-[#2D5A27] px-4 text-sm font-medium text-white hover:bg-[#23471f]'
                                : 'inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'
                            }
                          >
                            {packed ? t('growerPages.packingEdit') : t('growerPages.packingRecord')}
                          </button>
                        )}
                        {o.nextAction === 'PREPARE_AND_PACK' && (
                          <Link
                            href="/grower/quality-entry"
                            className="inline-flex min-h-[44px] items-center rounded-lg border border-[#2D5A27] px-4 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
                          >
                            {t('growerPages.packingQualityLink')}
                          </Link>
                        )}
                        {o.nextAction === 'SELECT_LOT' && (
                          <div className="space-y-2">
                            <p className="text-sm text-amber-800">{t('growerPages.selectLotMessage')}</p>
                            <Link
                              href="/grower/quality-entry"
                              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#2D5A27] px-4 text-sm font-medium text-[#2D5A27] hover:bg-[#2D5A27]/5"
                            >
                              {t('growerPages.selectLotLink')}
                            </Link>
                          </div>
                        )}
                        {o.nextAction === 'REQUEST_PICKUP' && (
                          <Link
                            href={`/grower/missions/create?orderId=${encodeURIComponent(o.id)}&batchId=${encodeURIComponent(o.packedBatchId ?? o.packed_batch?.id ?? '')}`}
                            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#2D5A27] px-4 text-sm font-medium text-white hover:bg-[#23471f]"
                          >
                            {t('growerPages.requestPickup')}
                          </Link>
                        )}
                        {o.nextAction === 'AWAITING_PICKUP' && (
                          <p className="text-sm text-gray-600">{t('growerPages.packingAwaitingPickup')}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

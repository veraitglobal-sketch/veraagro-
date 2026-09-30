'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { b2bSupplierPortalAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useTranslation } from 'react-i18next';
import { Loader2, Package } from 'lucide-react';

function parseSerials(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SupplierSeedStockPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [stock, setStock] = useState<Awaited<ReturnType<typeof b2bSupplierPortalAPI.getMySeedBags>> | null>(null);
  const [receiveInput, setReceiveInput] = useState('');
  const [receiveResults, setReceiveResults] = useState<Array<{ serial: string; ok: boolean; reason?: string }> | null>(null);
  const [sellForm, setSellForm] = useState({ growerPartnerCode: '', serials: '', directOrderId: '' });
  const [sellResults, setSellResults] = useState<Array<{ serial: string; ok: boolean; reason?: string }> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setStock(await b2bSupplierPortalAPI.getMySeedBags('IN_SUPPLIER_STOCK'));
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const doReceive = async () => {
    const serials = parseSerials(receiveInput);
    if (serials.length === 0) return;
    setBusy('receive');
    setErr(null);
    setReceiveResults(null);
    try {
      const res = await b2bSupplierPortalAPI.receiveSeedBags(serials);
      setReceiveResults(res.results);
      setReceiveInput('');
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const doSell = async () => {
    const serials = parseSerials(sellForm.serials);
    if (serials.length === 0 || !sellForm.growerPartnerCode.trim()) return;
    setBusy('sell');
    setErr(null);
    setSellResults(null);
    try {
      const res = await b2bSupplierPortalAPI.sellSeedBags({
        growerPartnerCode: sellForm.growerPartnerCode.trim().toUpperCase(),
        serials,
        directOrderId: sellForm.directOrderId.trim() || undefined,
      });
      setSellResults(res.results);
      setSellForm((f) => ({ ...f, serials: '' }));
      await load();
    } catch (e: unknown) {
      setErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setBusy(null);
    }
  };

  const inStock = stock?.grouped.filter((g) => g.count > 0) ?? [];

  return (
    <AuthGuard requiredRoles={['MATERIAL_SUPPLIER']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-light text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-[#2D5A27]" />
            {t('supplier.seedStock.title', { defaultValue: 'Bio Vera seed stock' })}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {t('supplier.seedStock.subtitle', { defaultValue: 'Receive shipped bags, view stock by lot, and sell to growers by partner code.' })}
          </p>
        </div>

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('common.loading', { defaultValue: 'Loading…' })}
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{t('supplier.seedStock.receive', { defaultValue: 'Receive bags' })}</h2>
              <p className="text-sm text-gray-600">
                {t('supplier.seedStock.receiveHint', { defaultValue: 'Scan or paste serial numbers (USB scanner friendly — one per line or comma-separated).' })}
              </p>
              <textarea
                rows={5}
                value={receiveInput}
                onChange={(e) => setReceiveInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                placeholder="BV-26-LOT-000001-XXXX"
              />
              {receiveResults && (
                <ul className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 text-sm divide-y">
                  {receiveResults.map((r) => (
                    <li key={r.serial} className={`px-3 py-2 ${r.ok ? 'text-green-800' : 'text-red-700'}`}>
                      <span className="font-mono text-xs">{r.serial}</span>
                      {r.ok ? ' ✓' : ` — ${r.reason ?? 'failed'}`}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => void doReceive()}
                disabled={busy === 'receive' || parseSerials(receiveInput).length === 0}
                className="min-h-[48px] rounded-lg bg-[#2D5A27] px-5 text-white hover:bg-[#23471f] disabled:opacity-50"
              >
                {busy === 'receive' ? t('common.saving', { defaultValue: 'Saving…' }) : t('supplier.seedStock.receiveSubmit', { defaultValue: 'Confirm receive' })}
              </button>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{t('supplier.seedStock.stock', { defaultValue: 'Stock by product & lot' })}</h2>
              {inStock.length === 0 ? (
                <p className="text-sm text-gray-500">{t('supplier.seedStock.empty', { defaultValue: 'No Bio Vera seed bags in stock yet.' })}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {inStock.map((g) => (
                    <li key={`${g.approvedProductId}-${g.lotNumber}`} className="py-3 flex justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">{g.productName}</p>
                        <p className="text-sm text-gray-600">
                          Lot {g.lotNumber}
                          {g.seedCropYear ? ` · ${g.seedCropYear}` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-[#2D5A27] tabular-nums">
                        {g.count} {t('supplier.seedStock.bags', { defaultValue: 'bags' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-medium text-gray-900">{t('supplier.seedStock.sell', { defaultValue: 'Sell to grower' })}</h2>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('supplier.seedStock.growerCode', { defaultValue: 'Grower partner code' })}</span>
                <input
                  value={sellForm.growerPartnerCode}
                  onChange={(e) => setSellForm((f) => ({ ...f, growerPartnerCode: e.target.value.toUpperCase() }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono uppercase focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('supplier.seedStock.serials', { defaultValue: 'Bag serials' })}</span>
                <textarea
                  rows={4}
                  value={sellForm.serials}
                  onChange={(e) => setSellForm((f) => ({ ...f, serials: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t('supplier.seedStock.directOrder', { defaultValue: 'Direct order ID (optional)' })}</span>
                <input
                  value={sellForm.directOrderId}
                  onChange={(e) => setSellForm((f) => ({ ...f, directOrderId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                />
              </label>
              {sellResults && (
                <ul className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 text-sm divide-y">
                  {sellResults.map((r) => (
                    <li key={r.serial} className={`px-3 py-2 ${r.ok ? 'text-green-800' : 'text-red-700'}`}>
                      <span className="font-mono text-xs">{r.serial}</span>
                      {r.ok ? ' ✓' : ` — ${r.reason ?? 'failed'}`}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => void doSell()}
                disabled={busy === 'sell' || !sellForm.growerPartnerCode.trim() || parseSerials(sellForm.serials).length === 0}
                className="min-h-[48px] rounded-lg bg-[#2D5A27] px-5 text-white hover:bg-[#23471f] disabled:opacity-50"
              >
                {busy === 'sell' ? t('common.saving', { defaultValue: 'Saving…' }) : t('supplier.seedStock.sellSubmit', { defaultValue: 'Sell bags' })}
              </button>
            </section>
          </>
        )}
      </div>
    </AuthGuard>
  );
}

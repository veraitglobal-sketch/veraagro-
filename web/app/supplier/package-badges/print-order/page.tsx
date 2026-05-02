'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { packageBadgesAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2 } from 'lucide-react';

type Plan = {
  orderRef?: string;
  parents?: string[];
  children?: Record<string, string[]>;
  serialPrefix?: string;
  generatedAt?: string;
};

type PrintOrderRow = {
  id: string;
  status: string;
  parentCount: number;
  childrenPerParent: number;
  serialPrefix: string;
  createdAt: string;
  sentAt?: string | null;
  planJson?: Plan;
};

/**
 * Material supplier: plan factory serials, save print orders, mark sent, and record when a grower returns labels to stock.
 */
export default function SupplierPackageBadgesPrintOrderPage() {
  const { t } = useTranslation();
  const [parentCount, setParentCount] = useState(1);
  const [childrenPerParent, setChildrenPerParent] = useState(0);
  const [serialPrefix, setSerialPrefix] = useState('PLT');
  const [notesToPrinter, setNotesToPrinter] = useState('');
  const [printerSupplierId, setPrinterSupplierId] = useState('');
  const [preview, setPreview] = useState<Plan | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<PrintOrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [returnRoot, setReturnRoot] = useState('');
  const [fromGrowerId, setFromGrowerId] = useState('');
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnOk, setReturnOk] = useState<string | null>(null);

  const loadOrders = () => {
    setLoadingOrders(true);
    packageBadgesAPI
      .listMyPrintOrders()
      .then((data: unknown) => setOrders(Array.isArray(data) ? (data as PrintOrderRow[]) : []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onPreview = async () => {
    setError(null);
    setLoadingPreview(true);
    try {
      const data = await packageBadgesAPI.previewPrintOrder({
        parentCount,
        childrenPerParent,
        serialPrefix: serialPrefix || undefined,
      });
      setPreview(data as Plan);
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'grower.packageBadges.errPreviewFailed'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const onSave = async () => {
    setError(null);
    setLoadingSave(true);
    try {
      await packageBadgesAPI.createPrintOrder({
        parentCount,
        childrenPerParent,
        serialPrefix: serialPrefix || undefined,
        notesToPrinter: notesToPrinter || undefined,
        printerSupplierId: printerSupplierId.trim() || undefined,
      });
      setReturnOk(null);
      loadOrders();
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'grower.packageBadges.errCouldNotSave'));
    } finally {
      setLoadingSave(false);
    }
  };

  const onReceiveFromGrower = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReturnOk(null);
    if (!returnRoot.trim() || !fromGrowerId.trim()) {
      setError(t('supplier.badges.receiveFromGrowerErrFields'));
      return;
    }
    setReturnLoading(true);
    try {
      const r = await packageBadgesAPI.supplierReceiveFromGrower({
        rootSerial: returnRoot.trim(),
        fromGrowerUserId: fromGrowerId.trim(),
      });
      setReturnOk(
        t('grower.packageBadges.returnSuccess', {
          count: (r as { returnedIds?: string[] }).returnedIds?.length ?? 0,
        }),
      );
      setReturnRoot('');
      setFromGrowerId('');
    } catch (e: unknown) {
      setError(apiErrorOrT(e, t, 'grower.packageBadges.errReturnFailed'));
    } finally {
      setReturnLoading(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['MATERIAL_SUPPLIER', 'ADMIN', 'SUPER_ADMIN']}
      redirectTo="/login?returnTo=%2Fsupplier%2Fpackage-badges%2Fprint-order"
    >
      <GrowerPageShell className="space-y-6 max-w-3xl">
        <GrowerPageHeader
          title={t('supplier.badges.printOrderPageTitle')}
          description={t('grower.packageBadges.printOrderDescription')}
          right={
            <Link
              href="/supplier/package-badges"
              className="text-sm font-medium text-[#2D5A27] hover:underline"
            >
              ← {t('supplier.badges.printOrderBack')}
            </Link>
          }
        />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        {returnOk && (
          <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 p-3 text-sm text-[#23471f]">{returnOk}</div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('grower.packageBadges.printOrderParentCount')}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={parentCount}
                onChange={(e) => setParentCount(parseInt(e.target.value, 10) || 1)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                {t('grower.packageBadges.printOrderChildren')}
              </label>
              <input
                type="number"
                min={0}
                max={2000}
                value={childrenPerParent}
                onChange={(e) => setChildrenPerParent(parseInt(e.target.value, 10) || 0)}
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('grower.packageBadges.printOrderPrefix')}
            </label>
            <input
              value={serialPrefix}
              onChange={(e) => setSerialPrefix(e.target.value.toUpperCase())}
              className="mt-1 w-full max-w-xs rounded border border-gray-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('grower.packageBadges.printOrderPrinterSupplierLabel')}
            </label>
            <input
              value={printerSupplierId}
              onChange={(e) => setPrinterSupplierId(e.target.value)}
              placeholder={t('grower.packageBadges.printOrderPrinterSupplierPlaceholder')}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('grower.packageBadges.printOrderNotes')}
            </label>
            <textarea
              value={notesToPrinter}
              onChange={(e) => setNotesToPrinter(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onPreview()}
              disabled={loadingPreview}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('grower.packageBadges.printOrderPreview')}
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={loadingSave}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
            >
              {loadingSave ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('grower.packageBadges.printOrderSave')}
            </button>
          </div>
          {preview && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('grower.packageBadges.printOrderJson')}</p>
              <pre className="text-xs overflow-auto max-h-64 rounded border border-gray-200 bg-gray-50 p-3">
                {JSON.stringify(preview, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('grower.packageBadges.printOrderList')}</h2>
          {loadingOrders ? (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">{t('grower.packageBadges.printOrderNoOrdersYet')}</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="border border-gray-100 rounded-md p-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-mono text-xs text-gray-500">{o.id.slice(0, 8)}…</span>
                    <span className="text-gray-600">{o.status}</span>
                  </div>
                  <p className="text-gray-700 mt-1">
                    {t('grower.packageBadges.printOrderRowSummary', {
                      parentCount: o.parentCount,
                      childrenPerParent: o.childrenPerParent,
                      serialPrefix: o.serialPrefix,
                    })}
                  </p>
                  {o.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await packageBadgesAPI.markPrintOrderSent(o.id);
                          loadOrders();
                        } catch (e: unknown) {
                          setError(apiErrorOrT(e, t, 'grower.packageBadges.errUpdateFailed'));
                        }
                      }}
                      className="mt-2 text-sm text-[#2D5A27] font-medium hover:underline"
                    >
                      {t('grower.packageBadges.printOrderMarkSent')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={onReceiveFromGrower} className="rounded-lg border border-amber-200 bg-amber-50/50 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('supplier.badges.receiveFromGrowerTitle')}</h2>
          <p className="text-sm text-gray-600">{t('supplier.badges.receiveFromGrowerHint')}</p>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t('grower.packageBadges.returnRootSerial')}
            </label>
            <input
              value={returnRoot}
              onChange={(e) => setReturnRoot(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">{t('supplier.badges.receiveGrowerUserIdLabel')}</label>
            <input
              value={fromGrowerId}
              onChange={(e) => setFromGrowerId(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <button
            type="submit"
            disabled={returnLoading}
            className="rounded-lg bg-amber-900/90 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {returnLoading ? '…' : t('supplier.badges.receiveFromGrowerSubmit')}
          </button>
        </form>
      </GrowerPageShell>
    </AuthGuard>
  );
}

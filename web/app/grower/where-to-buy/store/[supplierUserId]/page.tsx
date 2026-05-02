'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { growerSupplierB2bAPI } from '@/lib/api';
import { growerApiErrorOrT } from '@/lib/grower-api-error';
import { ArrowLeft, Store, Package, Send, Loader2 } from 'lucide-react';

type StoreData = Awaited<ReturnType<typeof growerSupplierB2bAPI.getPublicStore>>;

export default function GrowerPartnerStorePage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const params = useParams();
  const router = useRouter();
  const supplierUserId = typeof params?.supplierUserId === 'string' ? params.supplierUserId : '';

  const [data, setData] = useState<StoreData | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supplierUserId) return;
    setLoadErr(null);
    setLoading(true);
    try {
      const s = await growerSupplierB2bAPI.getPublicStore(supplierUserId);
      setData(s);
      const init: Record<string, string> = {};
      s.catalog?.forEach((c) => {
        init[c.id] = '';
      });
      setQuantities(init);
    } catch (e: unknown) {
      setData(null);
      setLoadErr(growerApiErrorOrT(e, t, 'grower.partnerStoreOrder.loadFailedDefault'));
    } finally {
      setLoading(false);
    }
  }, [supplierUserId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setSubmitErr(null);
    const items: { label: string; quantity: number; unit?: string }[] = [];
    for (const line of data.catalog) {
      const raw = (quantities[line.id] || '').trim().replace(',', '.');
      if (!raw) continue;
      const q = parseFloat(raw);
      if (Number.isNaN(q) || q <= 0) {
        setSubmitErr(t('grower.partnerStoreOrder.invalidQty', { name: line.name }));
        return;
      }
      items.push({
        label: line.sku ? `${line.name} (${line.sku})` : line.name,
        quantity: q,
        unit: line.unit || undefined,
      });
    }
    if (items.length === 0) {
      if (data.catalog.length === 0 && note.trim()) {
        items.push({
          label: t('grower.partnerStoreOrder.inquiryLineLabel', { snippet: note.trim().slice(0, 500) }),
          quantity: 1,
          unit: 'inquiry',
        });
      } else {
        setSubmitErr(t('grower.partnerStoreOrder.needQtyOrNote'));
        return;
      }
    }

    setSubmitting(true);
    try {
      const thread = await growerSupplierB2bAPI.getOrCreateThread(supplierUserId);
      const order = (await growerSupplierB2bAPI.createDirectOrder({
        supplierUserId,
        items,
        note: note.trim() || undefined,
        threadId: thread.id,
      })) as { id?: string };
      setSuccessId(order?.id || 'ok');
    } catch (err: unknown) {
      setSubmitErr(growerApiErrorOrT(err, t, 'grower.partnerStoreOrder.orderFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('growerPages.partnerStore')} navItems={growerNavItems}>
        <div className="max-w-3xl">
          <Link
            href="/grower/where-to-buy"
            className="inline-flex items-center gap-2 text-base text-[#2D5A27] hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('grower.partnerStoreOrder.backToLocations')}
          </Link>

          {loading && (
            <p className="text-base text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('grower.partnerStoreOrder.loading')}
            </p>
          )}

          {loadErr && !loading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-950">
              {loadErr}
            </div>
          )}

          {data && !successId && (
            <>
              {data.mapOnPublicDirectory === false && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-base text-sky-950 mb-4">
                  {t('grower.partnerStoreOrder.notOnMap')}
                </div>
              )}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#2D5A27]/10 p-2.5 text-[#2D5A27]">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-medium text-gray-900">{data.businessName}</h1>
                    <p className="text-base text-gray-600 font-light mt-1">
                      {[data.address, [data.postalCode, data.city].filter(Boolean).join(' '), data.country]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {data.description && (
                      <p className="text-base text-gray-500 font-light mt-2 leading-relaxed">{data.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {data.partnerCode && (
                        <span>
                          {t('grower.partnerStoreOrder.partnerCode')} {data.partnerCode}
                        </span>
                      )}
                      {data.contactPhone && (
                        <span>
                          {t('grower.partnerStoreOrder.phone')} {data.contactPhone}
                        </span>
                      )}
                      {data.contactEmail && (
                        <span>
                          {t('grower.partnerStoreOrder.email')} {data.contactEmail}
                        </span>
                      )}
                    </div>
                    {data.website && (
                      <a
                        href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-[#2D5A27] hover:underline mt-2 inline-block"
                      >
                        {t('grower.partnerStoreOrder.website')}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <h2 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-[#2D5A27]" />
                    {t('grower.partnerStoreOrder.catalogTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 font-light mb-4">{t('grower.partnerStoreOrder.catalogHint')}</p>
                  {data.catalog.length === 0 ? (
                    <p className="text-base text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                      {t('grower.partnerStoreOrder.emptyCatalog')}
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.catalog.map((line) => (
                        <li
                          key={line.id}
                          className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-lg border border-gray-100 bg-white p-3"
                        >
                          <div className="flex gap-3 min-w-0 flex-1">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50">
                              {line.imageUrl ? (
                                <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-300">
                                  <Package className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-base">{line.name}</p>
                              {line.description && (
                                <p className="text-xs text-gray-500 font-light line-clamp-2 mt-0.5">{line.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {t('grower.partnerStoreOrder.unit')} {line.unit}
                                {line.listPrice != null &&
                                  ` · ${t('grower.partnerStoreOrder.listPrice', { price: line.listPrice.toFixed(2) })}`}
                                {line.sku && ` · ${t('grower.partnerStoreOrder.sku', { sku: line.sku })}`}
                              </p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 shrink-0 w-full sm:w-36">
                            <span className="text-xs text-gray-500">{t('grower.partnerStoreOrder.qty')}</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-base"
                              placeholder={t('grower.partnerStoreOrder.qtyPlaceholder')}
                              value={quantities[line.id] ?? ''}
                              onChange={(e) => setQuantities((q) => ({ ...q, [line.id]: e.target.value }))}
                            />
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="text-base font-medium text-gray-800">{t('grower.partnerStoreOrder.noteLabel')}</label>
                  <textarea
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-light"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t('grower.partnerStoreOrder.notePlaceholder')}
                  />
                </div>

                {submitErr && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-base text-red-800">
                    {submitErr}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-2.5 text-base font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t('grower.partnerStoreOrder.submit')}
                  </button>
                </div>
              </form>
            </>
          )}

          {successId && (
            <div className="rounded-xl border border-[#2D5A27]/30 bg-[#2D5A27]/5 p-6 text-center">
              <p className="text-gray-800 font-medium">{t('grower.partnerStoreOrder.successTitle')}</p>
              <p className="text-base text-gray-600 font-light mt-2">{t('grower.partnerStoreOrder.successBody')}</p>
              {successId !== 'ok' && (
                <p className="text-xs text-gray-500 font-mono mt-2">
                  {t('grower.partnerStoreOrder.successRef', { id: successId })}
                </p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/grower/where-to-buy')}
                  className="text-base text-[#2D5A27] hover:underline"
                >
                  {t('grower.partnerStoreOrder.backToLocations')}
                </button>
                {data && (
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessId(null);
                      setNote('');
                      if (data.catalog.length) {
                        const z: Record<string, string> = {};
                        data.catalog.forEach((c) => {
                          z[c.id] = '';
                        });
                        setQuantities(z);
                      }
                    }}
                    className="text-base text-gray-600 hover:underline"
                  >
                    {t('grower.partnerStoreOrder.placeAnother')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { growerNavItems } from '@/lib/grower-nav';
import { growerSupplierB2bAPI } from '@/lib/api';
import { ArrowLeft, Store, Package, Send, Loader2 } from 'lucide-react';

type StoreData = Awaited<ReturnType<typeof growerSupplierB2bAPI.getPublicStore>>;

export default function GrowerPartnerStorePage() {
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
    } catch (e) {
      setData(null);
      setLoadErr(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Store not found or not approved for the directory.',
      );
    } finally {
      setLoading(false);
    }
  }, [supplierUserId]);

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
        setSubmitErr(`Invalid quantity for “${line.name}”. Use a positive number.`);
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
        items.push({ label: `Request: ${note.trim().slice(0, 500)}`, quantity: 1, unit: 'inquiry' });
      } else {
        setSubmitErr('Enter a quantity for at least one product line, or add a note if the catalog is empty.');
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
    } catch (err) {
      const m = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setSubmitErr(Array.isArray(m) ? m.join(' ') : m || (err instanceof Error ? err.message : 'Order failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title="Partner store" navItems={growerNavItems}>
        <div className="max-w-3xl">
          <Link
            href="/grower/where-to-buy"
            className="inline-flex items-center gap-2 text-sm text-[#2D5A27] hover:underline mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to locations
          </Link>

          {loading && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading store…
            </p>
          )}

          {loadErr && !loading && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {loadErr}
            </div>
          )}

          {data && !successId && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm mb-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#2D5A27]/10 p-2.5 text-[#2D5A27]">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-medium text-gray-900">{data.businessName}</h1>
                    <p className="text-sm text-gray-600 font-light mt-1">
                      {[data.address, [data.postalCode, data.city].filter(Boolean).join(' '), data.country]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {data.description && (
                      <p className="text-sm text-gray-500 font-light mt-2 leading-relaxed">{data.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {data.partnerCode && <span>Partner code: {data.partnerCode}</span>}
                      {data.contactPhone && <span>Phone: {data.contactPhone}</span>}
                      {data.contactEmail && <span>Email: {data.contactEmail}</span>}
                    </div>
                    {data.website && (
                      <a
                        href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#2D5A27] hover:underline mt-2 inline-block"
                      >
                        Store website
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-[#2D5A27]" />
                    Product list & quantities
                  </h2>
                  <p className="text-xs text-gray-500 font-light mb-4">
                    Enter how much you need for each line (same units as in the store catalog). Your order is sent to
                    this partner; they confirm or adjust in the supplier portal.
                  </p>
                  {data.catalog.length === 0 ? (
                    <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-6 text-center">
                      This store has not published catalog lines yet. Use the note below to describe what you need, or
                      contact them by phone/email.
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
                              <p className="font-medium text-gray-900 text-sm">{line.name}</p>
                              {line.description && (
                                <p className="text-xs text-gray-500 font-light line-clamp-2 mt-0.5">{line.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Unit: {line.unit}
                                {line.listPrice != null && ` · list €${line.listPrice.toFixed(2)}`}
                                {line.sku && ` · SKU ${line.sku}`}
                              </p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 shrink-0 w-full sm:w-36">
                            <span className="text-xs text-gray-500">Qty</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                              placeholder="0"
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
                  <label className="text-sm font-medium text-gray-800">Note to the store (optional)</label>
                  <textarea
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-light"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. needed for field prep by date …"
                  />
                </div>

                {submitErr && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {submitErr}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send order to store
                  </button>
                </div>
              </form>
            </>
          )}

          {successId && (
            <div className="rounded-xl border border-[#2D5A27]/30 bg-[#2D5A27]/5 p-6 text-center">
              <p className="text-gray-800 font-medium">Order sent</p>
              <p className="text-sm text-gray-600 font-light mt-2">
                The partner will see it under Supplier → Orders. You can continue the conversation in your messages
                (mobile app) or check back for their confirmation.
              </p>
              {successId !== 'ok' && (
                <p className="text-xs text-gray-500 font-mono mt-2">Ref: {successId}</p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/grower/where-to-buy')}
                  className="text-sm text-[#2D5A27] hover:underline"
                >
                  Back to locations
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
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Place another order
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

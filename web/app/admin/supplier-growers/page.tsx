'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { b2bSuppliersAdminAPI } from '@/lib/api';
import { getAdminNavItems } from '@/lib/admin-nav';
import { formatDateTimeEn } from '@/lib/en-locale-dates';
import { MessageCircle, Package, Store, User, ChevronDown, ChevronRight, ExternalLink, RefreshCw } from 'lucide-react';

type Overview = Awaited<ReturnType<typeof b2bSuppliersAdminAPI.getNetworkOverview>>;

export default function AdminSupplierGrowersPage() {
  const adminNavItems = getAdminNavItems();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSupplierId, setOpenSupplierId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setApproveError(null);
    setLoading(true);
    try {
      setData(await b2bSuppliersAdminAPI.getNetworkOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title="Suppliers & growers (B2B)" navItems={adminNavItems}>
        <div className="space-y-6 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-light text-gray-900">Partner stores &amp; grower activity</h1>
              <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                Message threads and direct orders in one place: who talks to whom and who ordered from which store.
                Open a grower in farm detail; create stores in{' '}
                <Link href="/admin/supplier-stores" className="text-[#2D5A27] font-medium hover:underline">
                  Supplier stores
                </Link>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
          )}

          {loading && !data ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading…</div>
          ) : data ? (
            <>
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Partner stores</h2>
                <div className="space-y-2">
                  {data.suppliers.length === 0 && (
                    <p className="text-sm text-gray-500">No B2B suppliers yet. Add one under Supplier stores.</p>
                  )}
                  {data.suppliers.map((s) => {
                    const isOpen = openSupplierId === s.userId;
                    return (
                      <div
                        key={s.userId}
                        className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenSupplierId(isOpen ? null : s.userId)}
                          className="w-full text-left px-4 py-3 flex flex-wrap items-center gap-3 hover:bg-gray-50/80"
                        >
                          <span className="text-gray-400">{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>
                          <Store className="h-4 w-4 text-[#2D5A27] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{s.businessName}</p>
                            <p className="text-xs text-gray-500">
                              {s.city}, {s.country} · <code className="text-gray-600">{s.user.partnerCode}</code>
                              {!s.mapApproved && <span className="ml-2 text-amber-700">(map not approved)</span>}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {s.stats.linkedFarmerCount} grower(s)
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {s.stats.threadCount} threads
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {s.stats.orderCount} orders
                            </span>
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-100">
                            <div className="px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-50/80 border-b border-gray-100">
                              {!s.mapApproved ? (
                                <>
                                  <p className="text-xs text-amber-900 max-w-prose">
                                    Not on the grower map: pins only show after you approve the store location.
                                  </p>
                                  <button
                                    type="button"
                                    disabled={approvingId === s.userId}
                                    onClick={async () => {
                                      setApprovingId(s.userId);
                                      setApproveError(null);
                                      try {
                                        await b2bSuppliersAdminAPI.approveSupplierMap(s.userId);
                                        await load();
                                      } catch (e) {
                                        setApproveError(e instanceof Error ? e.message : 'Approval failed');
                                      } finally {
                                        setApprovingId(null);
                                      }
                                    }}
                                    className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md bg-[#2D5A27] text-white hover:bg-[#234a20] disabled:opacity-50"
                                  >
                                    {approvingId === s.userId ? 'Saving…' : 'Approve for public map'}
                                  </button>
                                </>
                              ) : (
                                <p className="text-xs text-green-800">Shown on the grower &quot;Where to buy&quot; map.</p>
                              )}
                            </div>
                            {approveError && (
                              <p className="px-4 py-1 text-xs text-red-600 bg-red-50">{approveError}</p>
                            )}
                            <div className="px-4 py-3 bg-gray-50/50">
                              {s.linkedFarmers.length === 0 ? (
                                <p className="text-sm text-gray-500">No linked growers yet (no threads or orders).</p>
                              ) : (
                                <ul className="space-y-2">
                                  {s.linkedFarmers.map((f) => (
                                    <li
                                      key={f.id}
                                      className="flex flex-wrap items-center justify-between gap-2 text-sm border border-gray-100 rounded-md bg-white px-3 py-2"
                                    >
                                      <div>
                                        <span className="font-medium text-gray-900">
                                          {f.firstName} {f.lastName}
                                        </span>{' '}
                                        <code className="text-gray-500 text-xs">{f.partnerCode}</code>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {f.hasMessageThread && (
                                          <span className="text-[10px] uppercase bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">Messages</span>
                                        )}
                                        {f.hasOrder && (
                                          <span className="text-[10px] uppercase bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">Order</span>
                                        )}
                                        <Link
                                          href={`/admin/farm/${f.id}`}
                                          className="inline-flex items-center gap-0.5 text-xs text-[#2D5A27] font-medium hover:underline"
                                        >
                                          Farm detail <ExternalLink className="h-3 w-3" />
                                        </Link>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent B2B orders</h2>
                <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                  {data.recentOrders.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No orders yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Store</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Grower</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.recentOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-gray-50/80">
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                                {formatDateTimeEn(o.createdAt)}
                              </td>
                              <td className="px-3 py-2">
                                {o.supplier.businessName || o.supplier.partnerCode}
                                <br />
                                <code className="text-xs text-gray-400">{o.supplier.partnerCode}</code>
                              </td>
                              <td className="px-3 py-2">
                                {o.farmer.firstName} {o.farmer.lastName}
                                <br />
                                <code className="text-xs text-gray-400">{o.farmer.partnerCode}</code>
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

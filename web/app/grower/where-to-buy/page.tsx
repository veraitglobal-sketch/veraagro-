'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/AuthGuard';
import SidebarLayout from '@/components/SidebarLayout';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { getPublicApiBase } from '@/lib/public-api';
import { usersAPI } from '@/lib/api';
import Link from 'next/link';
import { List, MapPinned, MessageCircle, Store, Globe, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import PartnerB2BPanel from '@/components/grower/PartnerB2BPanel';
import GrowerSupplyFlowCard from '@/components/grower/GrowerSupplyFlowCard';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

const PAGE_SIZE = 8;

type MapItem = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  latitude: number;
  longitude: number;
  kind: 'retail' | 'supplier';
  description?: string;
  supplierUserId?: string;
};

function countriesLikelyMatch(profileCountry: string, itemCountry: string | undefined) {
  if (!itemCountry?.trim()) return false;
  const p = profileCountry.trim().toLowerCase();
  const i = itemCountry.trim().toLowerCase();
  if (p === i) return true;
  if (p.includes(i) || i.includes(p)) return true;
  const serbia = ['serbia', 'srbija', 'rs'];
  const germany = ['germany', 'deutschland', 'germ', 'german', 'de'];
  const inSet = (s: string, set: string[]) => set.some((x) => s.includes(x));
  if (inSet(p, serbia) && inSet(i, serbia)) return true;
  if (inSet(p, germany) && inSet(i, germany)) return true;
  return false;
}

function sortItemsByProfileCountry(items: MapItem[], productionCountry: string | null) {
  if (!productionCountry?.trim()) {
    return [...items].sort(
      (a, b) => (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name),
    );
  }
  const pc = productionCountry.trim();
  return [...items].sort((a, b) => {
    const ma = countriesLikelyMatch(pc, a.country) ? 0 : 1;
    const mb = countriesLikelyMatch(pc, b.country) ? 0 : 1;
    if (ma !== mb) return ma - mb;
    return (a.country || '').localeCompare(b.country || '') || a.name.localeCompare(b.name);
  });
}

function formatAddressLine(loc: MapItem) {
  const parts = [loc.address, [loc.city, loc.country].filter(Boolean).join(', ')].filter(Boolean);
  return parts.join(' · ');
}

function normalizeCountry(c: string | undefined) {
  return (c || '').trim() || '—';
}

export default function GrowerWhereToBuyPage() {
  const { t } = useTranslation();
  const growerNavItems = useGrowerNavItems();
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [productionCountry, setProductionCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [mobilePanel, setMobilePanel] = useState<'directory' | 'orders'>('directory');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const base = getPublicApiBase();
    try {
      const [me, rRetail, rSup] = await Promise.all([
        usersAPI.getMe().catch(() => null),
        fetch(`${base}/distributors/public/map`),
        fetch(`${base}/b2b-suppliers/public/map`),
      ]);
      if (me && typeof me === 'object' && 'productionCountry' in me) {
        const c = (me as { productionCountry?: string | null }).productionCountry;
        setProductionCountry(typeof c === 'string' && c.trim() ? c.trim() : null);
      } else {
        setProductionCountry(null);
      }
      if (!rRetail.ok || !rSup.ok) {
        setErr(t('growerPages.directoryLoadError'));
        setItems([]);
        return;
      }
      const retail = (await rRetail.json()) as Array<{
        id: string;
        name: string;
        city?: string;
        address?: string;
        latitude: number;
        longitude: number;
        country?: string;
      }>;
      const suppliers = (await rSup.json()) as Array<{
        id: string;
        name: string;
        city?: string;
        country?: string;
        address?: string;
        latitude: number;
        longitude: number;
        description?: string;
      }>;

      const retailM: MapItem[] = (retail || [])
        .filter((x) => x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0)
        .map((x) => ({
          id: `retail-${x.id}`,
          name: x.name,
          city: x.city,
          country: x.country,
          address: x.address,
          latitude: x.latitude,
          longitude: x.longitude,
          kind: 'retail' as const,
        }));
      const supM: MapItem[] = (suppliers || [])
        .filter((x) => x.latitude && x.longitude && x.latitude !== 0 && x.longitude !== 0)
        .map((x) => ({
          id: `supplier-${x.id}`,
          supplierUserId: x.id,
          name: x.name,
          city: x.city,
          country: x.country,
          address: x.address,
          latitude: x.latitude,
          longitude: x.longitude,
          kind: 'supplier' as const,
          description: x.description,
        }));
      setItems([...retailM, ...supM]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('growerPages.loadFailed'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(normalizeCountry(i.country)));
    return ['ALL', ...Array.from(set).filter((c) => c !== '—').sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filteredByCountry = useMemo(() => {
    if (selectedCountry === 'ALL') return items;
    return items.filter((i) => normalizeCountry(i.country) === selectedCountry);
  }, [items, selectedCountry]);

  const sortedForList = useMemo(
    () => sortItemsByProfileCountry(filteredByCountry, productionCountry),
    [filteredByCountry, productionCountry],
  );

  const totalPages = Math.max(1, Math.ceil(sortedForList.length / PAGE_SIZE));
  const pageClamped = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const p = Math.min(page, totalPages);
    const start = (p - 1) * PAGE_SIZE;
    return sortedForList.slice(start, start + PAGE_SIZE);
  }, [sortedForList, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [selectedCountry]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo="/login/producer">
      <SidebarLayout title={t('grower.nav.suppliersAndOrders')} navItems={growerNavItems}>
        <GrowerPageShell className="space-y-5">
          <GrowerPageHeader
            title={t('grower.nav.suppliersAndOrders')}
            description={t('growerPages.whereToBuyDescription')}
            right={
              !loading && productionCountry ? (
                <p className="max-w-sm shrink-0 text-xs text-gray-500 sm:text-right">
                  {t('growerPages.profileCountry')}{' '}
                  <span className="font-medium text-gray-700">{productionCountry}</span>
                  {items.some((i) => countriesLikelyMatch(productionCountry, i.country)) ? (
                    <span>{t('growerPages.profileSimilarRegions')}</span>
                  ) : (
                    <span>{t('growerPages.profileNoRows')}</span>
                  )}
                </p>
              ) : undefined
            }
          />

          {err && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">{err}</div>
          )}

          <div
            className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm lg:hidden"
            role="tablist"
            aria-label={t('grower.nav.suppliersAndOrders')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'directory'}
              onClick={() => setMobilePanel('directory')}
              className={`flex-1 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                mobilePanel === 'directory' ? 'bg-[#2D5A27] text-white shadow' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('growerPages.directoryTab')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePanel === 'orders'}
              onClick={() => {
                setMobilePanel('orders');
                if (typeof document !== 'undefined') {
                  const el = document.getElementById('my-orders');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`flex-1 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                mobilePanel === 'orders' ? 'bg-[#2D5A27] text-white shadow' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('growerPages.b2bOrdersTitle')}
            </button>
          </div>

          <p className="text-xs text-gray-500 -mt-1 lg:hidden">{t('growerPages.mobileTabHint')}</p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 items-start">
            <div
              className={`${
                mobilePanel === 'directory' ? 'block' : 'hidden'
              } lg:col-span-7 lg:block min-h-0 min-w-0 flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6`}
            >
              {loading ? (
                <p className="text-base text-gray-500">{t('growerPages.loadingDirectory')}</p>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-8 text-base text-gray-600 text-center">
                  <Store className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-800">{t('growerPages.emptyDirectoryTitle')}</p>
                  <p className="mt-3 font-light max-w-md mx-auto">{t('growerPages.emptyDirectoryBody')}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-4 text-base text-[#2D5A27] font-medium hover:underline"
                  >
                    {t('growerPages.retry')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <h2 className="text-lg font-semibold text-gray-900">{t('growerPages.directoryTitle')}</h2>
                    <p className="text-base text-gray-600 mt-1 font-light leading-relaxed">
                      {t('growerPages.directoryLead')}
                    </p>
                    <p className="text-xs text-amber-900/80 mt-3 rounded-lg bg-amber-50 border border-amber-100/80 px-3 py-2">
                      {t('growerPages.directoryDisclaimer')}
                    </p>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                      <Globe className="h-3.5 w-3.5" />
                      {t('growerPages.filterByCountry')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {countryOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setPage(1);
                          }}
                          className={`rounded-full px-3 py-1.5 text-base font-medium transition-colors ${
                            selectedCountry === c
                              ? 'bg-[#2D5A27] text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {c === 'ALL' ? t('growerPages.allCountries') : c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-1">
                      <List className="h-4 w-4 text-[#2D5A27]" />
                      {t('growerPages.locationsTitle')}
                    </h3>
                    <p className="text-xs text-gray-500 font-light mb-4">{t('growerPages.locationsHint')}</p>
                    {sortedForList.length === 0 && items.length > 0 ? (
                      <p className="text-base text-gray-500 font-light py-6 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                        {t('growerPages.noLocationsForCountry')}
                      </p>
                    ) : (
                    <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {pageItems.map((loc) => {
                        const inRegion = productionCountry && countriesLikelyMatch(productionCountry, loc.country);
                        return (
                          <li
                            key={loc.id}
                            className={`px-4 py-3.5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
                              inRegion ? 'bg-[#2D5A27]/5' : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-base flex flex-wrap items-center gap-2">
                                {loc.name}
                                {inRegion && (
                                  <span className="text-[10px] font-medium uppercase tracking-wide text-[#2D5A27] bg-[#2D5A27]/10 px-1.5 py-0.5 rounded">
                                    {t('growerPages.yourRegion')}
                                  </span>
                                )}
                              </p>
                              <p className="text-base text-gray-600 font-light mt-0.5 flex items-start gap-1.5">
                                <MapPinned className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                                <span>{formatAddressLine(loc)}</span>
                              </p>
                              {loc.description && loc.kind === 'supplier' && (
                                <p className="text-xs text-gray-500 font-light mt-1 line-clamp-2">{loc.description}</p>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                              <span
                                className={`text-xs font-medium px-2.5 py-0.5 rounded-md w-fit ${
                                  loc.kind === 'supplier'
                                    ? 'bg-orange-50 text-orange-900 border border-orange-200/80'
                                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                                }`}
                              >
                                {loc.kind === 'supplier' ? t('growerPages.partnerStore') : t('growerPages.retailPickup')}
                              </span>
                              {loc.kind === 'supplier' && loc.supplierUserId && (
                                <Link
                                  href={`/grower/where-to-buy/store/${encodeURIComponent(loc.supplierUserId)}`}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2D5A27] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#23471f] w-full sm:w-auto"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  {t('growerPages.catalogOrder')}
                                </Link>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    )}
                  </div>
                </>
              )}

              {!loading && items.length > 0 && totalPages > 1 && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-base text-gray-600">
                  <p className="text-xs text-gray-500">
                    {t('growerPages.paginationSummary', {
                      from: (pageClamped - 1) * PAGE_SIZE + 1,
                      to: Math.min(pageClamped * PAGE_SIZE, sortedForList.length),
                      total: sortedForList.length,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pageClamped <= 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-base disabled:opacity-40 hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('growerPages.pagePrev')}
                    </button>
                    <span className="text-xs text-gray-500 tabular-nums">
                      {t('growerPages.pageOf', { page: pageClamped, totalPages })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={pageClamped >= totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-base disabled:opacity-40 hover:bg-gray-50"
                    >
                      {t('growerPages.pageNext')}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {!loading && items.length > 0 && (
                <p className="mt-3 text-xs text-gray-400">
                  {t('growerPages.countLine', {
                    retail: items.filter((i) => i.kind === 'retail').length,
                    partners: items.filter((i) => i.kind === 'supplier').length,
                  })}
                  {selectedCountry !== 'ALL' &&
                    t('growerPages.countFiltered', { n: sortedForList.length })}
                </p>
              )}
            </div>

            <div
              className={`${
                mobilePanel === 'orders' ? 'block' : 'hidden'
              } lg:col-span-5 lg:block min-w-0 space-y-4`}
            >
              <Link
                href="/grower/where-to-buy/messages"
                className="flex items-center justify-between gap-3 rounded-xl border border-[#2D5A27]/20 bg-[#2D5A27]/5 px-4 py-3 text-left hover:border-[#2D5A27]/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[#2D5A27]" />
                    {t('growerPages.messagesCtaTitle')}
                  </p>
                  <p className="text-xs text-gray-600 font-light mt-0.5">{t('growerPages.messagesCtaBody')}</p>
                </div>
                <span className="text-base font-medium text-[#2D5A27] shrink-0">{t('growerPages.openInbox')}</span>
              </Link>
              <div id="my-orders">
                <PartnerB2BPanel />
              </div>
            </div>
          </div>

          <GrowerSupplyFlowCard context="suppliers" variant="compact" />
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { catalogAPI, ordersAPI, buyersAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { formatDateEn } from '@/lib/en-locale-dates';
import { Search, Store, X, Minus, Plus, MapPin, Package } from 'lucide-react';
import { productEmoji } from '@/lib/product-emoji';
import { isBuyerDeliveryAddressComplete } from '@biovera/shared/validation/buyer-address';

type PackOption = {
  id: string;
  label: string;
  packSizeKg: number;
  pricePerPack: number;
  pricePerKg: number;
  maxPacks: number;
};

type CatalogProduct = {
  id: string;
  name: string;
  productName: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  availableKg: number;
  availableUntil: string | null;
  estate?: { id: string; name: string; city?: string | null } | null;
  packOptions: PackOption[];
};

function categoryLabel(t: (k: string) => string, category: string | null): string {
  if (!category) return '';
  const key = `buyerPortalMarketplace.category.${category}`;
  const translated = t(key);
  return translated !== key ? translated : category;
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const buyerPortalNavItems = useBuyerPortalNavItems();
  const submitLock = useRef(false);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [packCount, setPackCount] = useState(1);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogAPI.listPublicProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.productName.toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.estate?.name ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, categoryFilter]);

  const selectedPack = selectedProduct?.packOptions.find((o) => o.id === selectedPackId) ?? null;
  const lineTotal = selectedPack ? selectedPack.pricePerPack * packCount : 0;

  const openProduct = async (product: CatalogProduct) => {
    setSelectedProduct(product);
    setSelectedPackId(product.packOptions[0]?.id ?? null);
    setPackCount(1);
    setCheckoutError(null);
    setDeliveryNotes('');
    try {
      const profile = await buyersAPI.getCompanyProfile().catch(() => null);
      const loc = profile?.deliveryLocations?.[0] as
        | { address?: string; city?: string; postalCode?: string; country?: string }
        | undefined;
      if (loc) {
        setStreet(loc.address ?? '');
        setCity(loc.city ?? '');
        setPostalCode(loc.postalCode ?? '');
        setCountry(loc.country ?? '');
      } else {
        setStreet('');
        setCity('');
        setPostalCode('');
        setCountry('');
      }
    } catch {
      /* keep empty */
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSelectedPackId(null);
    setPackCount(1);
    setCheckoutError(null);
  };

  const submitOrder = async () => {
    if (submitLock.current || !selectedProduct || !selectedPack) return;
    if (!isBuyerDeliveryAddressComplete({ street, city, postalCode, country })) {
      setCheckoutError(t('buyerPortalMarketplace.checkout.fillRequired'));
      return;
    }
    submitLock.current = true;
    setSubmitting(true);
    setCheckoutError(null);
    try {
      const clientRequestId = crypto.randomUUID();
      await ordersAPI.create({
        clientRequestId,
        productId: selectedProduct.id,
        ...(selectedProduct.estate?.id ? { estateId: selectedProduct.estate.id } : {}),
        productName: selectedProduct.name,
        quantity: selectedPack.packSizeKg * packCount,
        unit: 'kg',
        unitPrice: selectedPack.pricePerKg,
        packOptionId: selectedPack.id,
        packCount,
        deliveryAddress: {
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
        deliveryNotes: deliveryNotes.trim() || undefined,
      });
      closeModal();
      router.push('/buyer-portal/orders');
    } catch (err: unknown) {
      setCheckoutError(apiErrorOrT(err, t, 'buyerPortalMarketplace.checkout.failed'));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard requiredRoles={['BUYER']}>
      <SidebarLayout title={t('buyerPortalPages.marketplace')} navItems={buyerPortalNavItems}>
        <div className="space-y-8">
          <div className="border-b border-[#2D5A27]/30 pb-6">
            <h2 className="text-xl font-light text-gray-900">{t('buyerPortalMarketplace.title')}</h2>
            <p className="text-sm text-gray-600 mt-1 font-light">{t('buyerPortalMarketplace.subtitle')}</p>
          </div>

          <div className="border-b border-[#2D5A27]/30 pb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" strokeWidth={1} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('buyerPortalMarketplace.searchPlaceholder')}
                className="w-full px-4 py-2 pl-10 border border-gray-300 text-sm font-light focus:outline-none focus:border-[#2D5A27]/50 rounded-lg"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`rounded-full border px-3 py-1.5 text-sm font-light transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#2D5A27]/40'
                }`}
              >
                {t('buyerPortalMarketplace.allCategories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-light transition-colors ${
                    categoryFilter === cat
                      ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#2D5A27]/40'
                  }`}
                >
                  {categoryLabel(t, cat)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27] mx-auto" />
                <p className="mt-4 text-gray-600 font-light">{t('buyerPortalMarketplace.loading')}</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 border-b border-[#2D5A27]/30">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1} />
              <p className="text-gray-500 font-light">{t('buyerPortalMarketplace.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => void openProduct(product)}
                  className="text-left border border-gray-200 rounded-xl bg-white shadow-sm hover:border-[#2D5A27]/40 hover:shadow-md transition-all p-5"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#2D5A27]/10 flex items-center justify-center text-3xl flex-shrink-0">
                        {productEmoji(product)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-light text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500 font-light truncate">
                        {product.estate?.name ?? t('buyerPortalMarketplace.farmFallback')}
                        {product.estate?.city ? ` · ${product.estate.city}` : ''}
                      </p>
                      {product.category && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {categoryLabel(t, product.category)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm font-light">
                    <p className="text-[#2D5A27]">
                      {t('buyerPortalMarketplace.availableKg', {
                        kg: product.availableKg.toLocaleString(undefined, { maximumFractionDigits: 1 }),
                      })}
                    </p>
                    {product.availableUntil && (
                      <p className="text-gray-500">
                        {t('buyerPortalMarketplace.availableUntil', {
                          date: formatDateEn(product.availableUntil),
                        })}
                      </p>
                    )}
                    {product.packOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {product.packOptions.slice(0, 4).map((opt) => (
                          <span
                            key={opt.id}
                            className="inline-block rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {t('buyerPortalMarketplace.packChip', {
                              label: opt.label,
                              price: opt.pricePerPack.toFixed(2),
                            })}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-gray-200 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-lg">
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4 border-b border-gray-200/50 pb-4">
                    <div className="flex items-start gap-3">
                      {selectedProduct.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedProduct.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#2D5A27]/10 flex items-center justify-center text-2xl">
                          {productEmoji(selectedProduct)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-light text-gray-900">{selectedProduct.name}</h2>
                        <p className="text-sm text-gray-500 font-light">{selectedProduct.estate?.name}</p>
                        <p className="text-sm text-[#2D5A27] mt-1">
                          {t('buyerPortalMarketplace.availableKg', {
                            kg: selectedProduct.availableKg.toLocaleString(undefined, { maximumFractionDigits: 1 }),
                          })}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" strokeWidth={1} />
                    </button>
                  </div>

                  {selectedProduct.description && (
                    <p className="text-sm text-gray-600 font-light">{selectedProduct.description}</p>
                  )}

                  <div>
                    <h3 className="text-sm font-light text-gray-500 mb-3">{t('buyerPortalMarketplace.selectPack')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.packOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedPackId(opt.id);
                            setPackCount(1);
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm font-light transition-colors ${
                            selectedPackId === opt.id
                              ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#2D5A27]'
                              : 'border-gray-300 hover:border-[#2D5A27]/40'
                          }`}
                        >
                          <span className="block font-medium">{opt.label}</span>
                          <span className="text-xs text-gray-600">
                            €{opt.pricePerPack.toFixed(2)} · €{opt.pricePerKg.toFixed(2)}/kg
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPack && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-600 font-light">{t('buyerPortalMarketplace.packCount')}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={packCount <= 1}
                          aria-label={t('buyerPortalMarketplace.decreasePacks')}
                          onClick={() => setPackCount((c) => Math.max(1, c - 1))}
                          className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#2D5A27]/40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={selectedPack.maxPacks}
                          value={packCount}
                          aria-label={t('buyerPortalMarketplace.packCountInput')}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isFinite(n)) return;
                            setPackCount(Math.min(selectedPack.maxPacks, Math.max(1, Math.floor(n))));
                          }}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-lg font-light tabular-nums focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                        />
                        <button
                          type="button"
                          disabled={packCount >= selectedPack.maxPacks}
                          aria-label={t('buyerPortalMarketplace.increasePacks')}
                          onClick={() => setPackCount((c) => Math.min(selectedPack.maxPacks, c + 1))}
                          className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:border-[#2D5A27]/40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 font-light">
                        {t('buyerPortalMarketplace.maxPacks', { count: selectedPack.maxPacks })}
                      </p>
                    </div>
                  )}

                  {selectedPack && (
                    <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4">
                      <div className="flex justify-between text-sm font-light">
                        <span className="text-gray-600">{t('buyerPortalMarketplace.lineTotal')}</span>
                        <span className="text-[#2D5A27] font-medium">€{lineTotal.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {packCount} × {selectedPack.label} ({(selectedPack.packSizeKg * packCount).toFixed(1)} kg)
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200/50 pt-4 space-y-3">
                    <h3 className="text-sm font-light text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('buyerPortalMarketplace.deliveryAddress')}
                    </h3>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder={t('buyerPortalMarketplace.streetPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('buyerPortalMarketplace.cityPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                      />
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('buyerPortalMarketplace.postalPlaceholder')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                      />
                    </div>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder={t('buyerPortalMarketplace.countryPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                    />
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={2}
                      placeholder={t('buyerPortalMarketplace.notesPlaceholder')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-light focus:outline-none focus:border-[#2D5A27]/50"
                    />
                  </div>

                  {checkoutError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      {checkoutError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => void submitOrder()}
                      disabled={submitting || !selectedPack}
                      className="flex-1 min-h-[48px] rounded-lg bg-[#2D5A27] text-white text-sm font-medium hover:bg-[#23471f] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      {submitting ? t('buyerPortalMarketplace.checkout.submitting') : t('buyerPortalMarketplace.checkout.confirm')}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 min-h-[48px] border border-gray-300 rounded-lg text-sm font-light hover:border-[#2D5A27]/30"
                    >
                      {t('buyerPortalMarketplace.checkout.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}

'use client';

import { useAuth } from '@/lib/auth';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { inventoryAPI, ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Apple, Carrot, Wheat, ChevronRight, Plus, Minus, X } from 'lucide-react';
import { formatFarmerIdentity } from '@/lib/farmer-utils';
import { useTranslation } from 'react-i18next';

const CATEGORY_IDS = ['fruits', 'vegetables', 'grains'] as const;

type CartLine = { product: any; quantity: number; checkoutKey?: string };

function formatEur(amount: number): string {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'EUR' });
}

function getOrderErrorMessage(e: unknown): string {
  const err = e as { response?: { data?: { message?: string | string[] } }; message?: string };
  const m = err?.response?.data?.message;
  if (Array.isArray(m)) return m.join(' ');
  if (typeof m === 'string') return m;
  return err?.message || '';
}

export default function ShopPage() {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const cartRef = useRef<CartLine[]>([]);
  const cartOwner = useRef<string | null>(null);
  const submitLock = useRef(false);
  const [cartError, setCartError] = useState('');
  useEffect(() => {
    cartOwner.current = null; cartRef.current = []; setCart([]); setCartError('');
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(`buyer-cart-v1:${user.id}`);
      const saved: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(saved) || saved.some(line => !line?.product?.id || !Number.isFinite(line.quantity) || line.quantity <= 0)) throw new Error('Invalid cart');
      cartRef.current = saved; cartOwner.current = user.id; setCart(saved);
    } catch { setCartError(t('checkoutRecovery.storageError')); }
  }, [user?.id, t]);
  const updateCart = useCallback((apply: (lines: CartLine[]) => CartLine[]) => {
    if (!user?.id || cartOwner.current !== user.id) throw new Error(t('checkoutRecovery.storageError'));
    const next = apply(cartRef.current);
    // Persist before sending or acknowledging an order, so a reload keeps its request key.
    localStorage.setItem(`buyer-cart-v1:${user.id}`, JSON.stringify(next));
    cartRef.current = next; setCart(next); setCartError('');
  }, [user?.id, t]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');
  const [notes, setNotes] = useState('');

  const categories = useMemo(
    () =>
      CATEGORY_IDS.map((id) => ({
        id,
        name: t(`buyerRetail.shop.categories.${id}`),
        icon: id === 'fruits' ? Apple : id === 'vegetables' ? Carrot : Wheat,
        color: 'text-[#2D5A27]',
      })),
    [t],
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + (line.product.price || 0) * line.quantity, 0),
    [cart],
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login/buyer');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadProducts();
    }
  }, [isAuthenticated]);

  const loadProducts = async () => {
    try {
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    try { updateCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    }); } catch { setCartError(t('checkoutRecovery.storageError')); }
  };

  const updateLineQuantity = (productId: string, quantity: number) => {
    try { updateCart(prev => quantity <= 0 ? prev.filter(l => l.product.id !== productId)
      : prev.map(l => l.product.id === productId ? { ...l, quantity } : l)); }
    catch { setCartError(t('checkoutRecovery.storageError')); }
  };

  const submitCheckout = useCallback(async () => {
    if (submitLock.current) return;
    if (cart.length === 0) {
      alert(t('buyerRetail.shop.checkout.cartEmpty'));
      return;
    }
    if (!street.trim() || !city.trim() || !postalCode.trim()) {
      alert(t('buyerRetail.shop.checkout.fillRequired'));
      return;
    }

    const deliveryAddress = {
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
    };

    const deliveryNotes = notes.trim() || undefined;

    let recovered = false;
    let createdCount = 0;
    submitLock.current = true;
    try {
      setSubmitting(true);
      updateCart(lines => lines.map(line => ({ ...line, checkoutKey: line.checkoutKey || crypto.randomUUID() })));
      const attempt = [...cartRef.current];
      for (const line of attempt) {
        const { product } = line;
        const productName = product.productName || product.name || t('buyerRetail.shop.productFallback');
        const order = await ordersAPI.create({
          clientRequestId: line.checkoutKey!,
          productId: product.id,
          ...(product.estate?.id ? { estateId: product.estate.id } : {}),
          productName,
          quantity: line.quantity,
          unit: typeof product.unit === 'string' && product.unit.trim() ? product.unit : 'kg',
          unitPrice: product.price ?? 0,
          deliveryAddress,
          deliveryNotes,
        });
        if (!order?.id || !Number.isFinite(order.quantity) || order.quantity <= 0) throw new Error(t('checkoutRecovery.missingOrder'));
        createdCount++;
        recovered = recovered || !!order.checkoutReplay;
        updateCart(lines => lines.map(current => current.checkoutKey === line.checkoutKey
          ? { ...current, quantity: Math.max(0, current.quantity - order.quantity), checkoutKey: undefined } : current).filter(current => current.quantity > 0));
      }
      const count = createdCount;
      setCheckoutOpen(false);
      setStreet('');
      setCity('');
      setPostalCode('');
      setNotes('');
      alert(
        recovered ? t('checkoutRecovery.recovered') : count > 1 ? t('buyerRetail.shop.checkout.ordersCreated', { count }) : t('buyerRetail.shop.orderCreated'),
      );
      router.push('/buyer-portal/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      const detail = getOrderErrorMessage(error);
      alert([recovered ? t('checkoutRecovery.recovered') : '', createdCount ? t('checkoutRecovery.partial', { count: createdCount }) : t('buyerRetail.shop.orderFailed'), detail].filter(Boolean).join(' '));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }, [cart, city, country, notes, postalCode, router, street, t, updateCart]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayName = user?.firstName || t('buyerRetail.shop.guestName');

  return (
    <div className="min-h-screen bg-gray-50 pb-44">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-[#2D5A27]">
              🌱 Bio Vera
            </Link>
            <nav className="flex gap-4 items-center">
              <Link href="/buyer-portal/vera-standard" className="text-sm px-3 py-2 text-gray-600 hover:text-[#2D5A27]">
                {t('buyerRetail.shop.navStandard')}
              </Link>
              <Link href="/buyer-portal/orders" className="px-4 py-2 text-gray-700 hover:text-[#2D5A27]">
                {t('buyerRetail.shop.navOrders')}
              </Link>
              <span className="text-gray-700">{t('buyerRetail.shop.cartLabel', { count: cart.length })}</span>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('buyerRetail.shop.welcome', { name: displayName })}</h1>

        <div className="mb-8 border-t border-b border-gray-200 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={`/buyer-portal/trade-panel?category=${category.id}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:border-[#2D5A27] transition-all group"
                >
                  <Icon className={`w-5 h-5 ${category.color} group-hover:scale-110 transition-transform`} strokeWidth={1.5} />
                  <span className={`text-sm font-light ${category.color} group-hover:text-[#2D5A27] transition-colors`}>{category.name}</span>
                  <ChevronRight className={`w-4 h-4 ${category.color} opacity-0 group-hover:opacity-100 transition-opacity`} strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-[#2D5A27]/10 flex items-center justify-center">
                  <span className="text-6xl">🌾</span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.productName || product.name || t('buyerRetail.shop.productFallback')}</h3>

                  {product.estate?.owner && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-[10px] font-light tracking-[0.15em] text-gray-400 uppercase mb-1.5">{t('buyerRetail.shop.producerBadge')}</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400" strokeWidth={1} />
                        <span className="text-xs font-light text-gray-700">
                          {formatFarmerIdentity(
                            product.estate.owner.firstName,
                            undefined,
                            product.estate.location,
                            product.estate.location,
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] font-light tracking-[0.2em] text-gray-500 uppercase mt-1">
                        {product.estate.location || t('buyerRetail.shop.unknownRegion')}
                      </p>
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-2">{product.description || t('buyerRetail.shop.organicFallback')}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#2D5A27] font-bold">
                      {product.price != null ? formatEur(Number(product.price)) : t('buyerRetail.shop.priceOnRequest')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.quantity || 0}{' '}
                      {typeof product.unit === 'string' && product.unit.trim() ? product.unit : t('buyerRetail.shop.unitKg')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="w-full bg-[#2D5A27] text-white py-2 rounded-lg hover:bg-[#23471f] transition-colors"
                  >
                    {t('buyerRetail.shop.addToCart')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 z-40 m-0 md:m-4 bg-white rounded-t-xl md:rounded-lg shadow-xl border border-gray-100 max-w-full md:max-w-md">
          <div className="p-4 md:p-6 max-h-[50vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-3">{t('buyerRetail.shop.cartTitle', { count: cart.length })}</h3>
            <ul className="space-y-3 mb-4">
              {cart.map((line) => {
                const name = line.product.productName || line.product.name || t('buyerRetail.shop.productFallback');
                const unit = typeof line.product.unit === 'string' && line.product.unit.trim() ? line.product.unit : t('buyerRetail.shop.unitKg');
                const lineTotal = (line.product.price || 0) * line.quantity;
                return (
                  <li key={line.product.id} className="flex flex-col gap-2 border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="font-medium text-gray-900">{name}</span>
                      <span className="text-gray-600 whitespace-nowrap">{formatEur(lineTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {line.product.price != null
                          ? `${formatEur(Number(line.product.price))} / ${unit}`
                          : t('buyerRetail.shop.priceOnRequest')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={t('buyerRetail.shop.qtyDecrease')}
                          onClick={() => updateLineQuantity(line.product.id, line.quantity - 1)}
                          className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={t('buyerRetail.shop.qtyIncrease')}
                          onClick={() => updateLineQuantity(line.product.id, line.quantity + 1)}
                          className="p-1 rounded border border-gray-200 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between items-center text-sm text-gray-700 mb-3 pt-2 border-t border-gray-100">
              <span>{t('buyerRetail.shop.checkout.total')}</span>
              <span className="font-semibold">{formatEur(cartTotal)}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3 font-light">{t('buyerRetail.shop.checkout.multiOrderHint')}</p>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-[#2D5A27] text-white py-3 rounded-lg hover:bg-[#23471f] font-semibold"
            >
              {t('buyerRetail.shop.checkout.proceedToPayment')}
            </button>
          </div>
        </div>
      )}

      {cartError && <p role="alert" className="p-4 text-red-700">{cartError}</p>}
      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-title"
          onClick={() => !submitting && setCheckoutOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start gap-4 mb-6">
              <h2 id="checkout-title" className="text-xl font-light text-gray-900 tracking-wide">
                {t('buyerRetail.shop.checkout.payment')}
              </h2>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                onClick={() => !submitting && setCheckoutOpen(false)}
                aria-label={t('buyerRetail.shop.checkout.close')}
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 uppercase mb-4">
              {t('buyerRetail.shop.checkout.deliveryAddress')}
            </p>

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-light">{t('buyerRetail.shop.checkout.street')}</span>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="mt-1 w-full border-b border-gray-200 py-2 px-1 text-sm font-light focus:border-[#2D5A27] outline-none"
                  autoComplete="street-address"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-light">{t('buyerRetail.shop.checkout.city')}</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full border-b border-gray-200 py-2 px-1 text-sm font-light focus:border-[#2D5A27] outline-none"
                  autoComplete="address-level2"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-light">{t('buyerRetail.shop.checkout.postalCode')}</span>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="mt-1 w-full border-b border-gray-200 py-2 px-1 text-sm font-light focus:border-[#2D5A27] outline-none"
                  autoComplete="postal-code"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-light">{t('buyerRetail.shop.checkout.country')}</span>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 w-full border-b border-gray-200 py-2 px-1 text-sm font-light focus:border-[#2D5A27] outline-none"
                  autoComplete="country-name"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-light">{t('buyerRetail.shop.checkout.notes')}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-md py-2 px-2 text-sm font-light focus:border-[#2D5A27] outline-none resize-y min-h-[4rem]"
                />
              </label>
            </div>

            <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 mb-6">
              <p className="text-[11px] font-medium tracking-[0.2em] text-gray-500 uppercase mb-3">{t('buyerRetail.shop.checkout.orderSummary')}</p>
              <ul className="space-y-2 text-sm">
                {cart.map((line) => (
                  <li key={line.product.id} className="flex justify-between gap-2 font-light">
                    <span className="text-gray-800">
                      {(line.product.productName || line.product.name || t('buyerRetail.shop.productFallback')) + ` × ${line.quantity}`}
                    </span>
                    <span>{formatEur((line.product.price || 0) * line.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 text-sm">
                <span>{t('buyerRetail.shop.checkout.total')}</span>
                <span className="font-medium">{formatEur(cartTotal)}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitCheckout()}
              className="w-full bg-[#2D5A27] text-white py-3 rounded-lg hover:bg-[#23471f] font-light tracking-wide disabled:opacity-60"
            >
              {submitting ? t('buyerRetail.shop.checkout.creating') : t('buyerRetail.shop.checkout.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

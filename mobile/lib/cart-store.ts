import type { Product } from './api/types';

export type CartLineKind = 'purchase' | 'reservation';
export interface CartItem {
  product: Product;
  quantity: number;
  lineKind: CartLineKind;
  checkoutKey?: string;
  packOptionId?: string;
  packLabel?: string;
  packSizeKg?: number;
  pricePerPack?: number;
}

interface CartStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
}

const STORAGE_KEY = 'shopping_cart';
type Update = (items: CartItem[]) => CartItem[];

function readItems(raw: string | null): CartItem[] {
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) =>
    item?.product && typeof item.product.id === 'string' &&
    typeof item.product.productName === 'string' &&
    Number.isFinite(item.quantity) && item.quantity > 0 &&
    (item.product.price == null || (Number.isFinite(item.product.price) && item.product.price >= 0)) &&
    (item.lineKind == null || item.lineKind === 'purchase' || item.lineKind === 'reservation')
  ).map((item) => ({ ...item, lineKind: item.lineKind ?? 'purchase' }));
}

/** One in-memory cart; disk writes are ordered and never overwrite newer UI state. */
export function createCartStore(storage: CartStorage, onError: (error: unknown) => void = console.error) {
  let snapshot = { items: [] as CartItem[], loading: true };
  let initialization: Promise<void> | undefined;
  let writes = Promise.resolve();
  let persistenceError: unknown;
  const pending: Update[] = [];
  const listeners = new Set<() => void>();
  const publish = (items: CartItem[]) => {
    snapshot = { items, loading: false };
    listeners.forEach((listener) => listener());
  };
  const persist = () => {
    const value = JSON.stringify(snapshot.items);
    writes = writes.then(() => storage.setItem(STORAGE_KEY, value)).then(() => { persistenceError = undefined; }).catch(error => { persistenceError = error; onError(error); });
  };
  const initialize = () => {
    if (!initialization) {
      initialization = (async () => {
        let items: CartItem[] = [];
        try {
          items = readItems(await storage.getItem(STORAGE_KEY));
        } catch (error) {
          onError(error);
        }
        const changed = pending.length > 0;
        for (const apply of pending.splice(0)) items = apply(items);
        publish(items);
        if (changed) persist();
      })();
    }
    return initialization;
  };
  const update = (apply: Update) => {
    if (snapshot.loading) {
      pending.push(apply);
      void initialize();
      return;
    }
    publish(apply(snapshot.items));
    persist();
  };
  const matches = (item: CartItem, id: string, kind: CartLineKind, packOptionId?: string) =>
    item.product.id === id && item.lineKind === kind && (item.packOptionId ?? '') === (packOptionId ?? '');

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    initialize,
    // Storage is owned by this store. A refresh must not reload an older pending write.
    reloadCart: async () => { await initialize(); await writes; },
    refreshProducts: async (products: Product[]) => {
      await initialize();
      const catalogue = new Map(products.map(product => [product.id, product]));
      // Retain retry keys: if the order already exists, the API recovers its original payload.
      const refreshed = snapshot.items.map(item => {
        const product = catalogue.get(item.product.id);
        return product ? { ...item, product } : item;
      });
      const pricesChanged = refreshed.some((item, index) => item.product.price !== snapshot.items[index].product.price);
      update(() => refreshed);
      return pricesChanged;
    },
    addToCart: (product: Product, quantity: number, options?: {
      lineKind?: CartLineKind;
      packOptionId?: string;
      packLabel?: string;
      packSizeKg?: number;
      pricePerPack?: number;
    }) => {
      if (!Number.isFinite(quantity) || quantity <= 0) return;
      const kind = options?.lineKind ?? 'purchase';
      const packOptionId = options?.packOptionId;
      update((items) => items.some((item) => matches(item, product.id, kind, packOptionId))
        ? items.map((item) => matches(item, product.id, kind, packOptionId)
          ? { ...item, product, quantity: item.quantity + quantity } : item)
        : [...items, {
          product,
          quantity,
          lineKind: kind,
          packOptionId,
          packLabel: options?.packLabel,
          packSizeKg: options?.packSizeKg,
          pricePerPack: options?.pricePerPack,
        }]);
    },
    removeFromCart: (id: string, kind: CartLineKind, packOptionId?: string) => {
      update((items) => items.filter((item) => !matches(item, id, kind, packOptionId)));
    },
    updateQuantity: (id: string, quantity: number, kind: CartLineKind, packOptionId?: string) => {
      if (!Number.isFinite(quantity)) return;
      update((items) => quantity <= 0
        ? items.filter((item) => !matches(item, id, kind, packOptionId))
        : items.map((item) => matches(item, id, kind, packOptionId) ? { ...item, quantity } : item));
    },
    changeQuantity: (id: string, delta: number, kind: CartLineKind, packOptionId?: string) => {
      if (!Number.isFinite(delta)) return;
      update((items) => items.map((item) => matches(item, id, kind, packOptionId)
        ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
    },
    prepareCheckout: async (line: CartItem, newKey: () => string): Promise<CartItem & { checkoutKey: string }> => {
      await initialize();
      const current = snapshot.items.find(item => matches(item, line.product.id, line.lineKind, line.packOptionId));
      if (!current) throw new Error('Cart changed. Refresh before checkout.');
      const checkoutKey = current.checkoutKey || newKey();
      update(items => items.map(item => matches(item, line.product.id, line.lineKind, line.packOptionId) ? { ...item, checkoutKey } : item));
      await writes;
      if (persistenceError) throw persistenceError; // Never POST a key that was not saved to disk.
      return { ...line, checkoutKey };
    },
    completeCheckout: async (line: CartItem) => {
      // A second screen/retry cannot consume the same cart attempt twice.
      update(items => items.map(item => matches(item, line.product.id, line.lineKind, line.packOptionId) && !!line.checkoutKey && item.checkoutKey === line.checkoutKey
        ? { ...item, quantity: Math.max(0, item.quantity - line.quantity), checkoutKey: undefined } : item).filter(item => item.quantity > 0));
      await writes;
      if (persistenceError) throw persistenceError;
    },
    consumeItem: (line: CartItem) => {
      update((items) => items.map((item) => matches(item, line.product.id, line.lineKind, line.packOptionId)
        ? { ...item, quantity: item.quantity - line.quantity } : item).filter((item) => item.quantity > 0));
    },
    clearCart: () => update(() => []),
  };
}

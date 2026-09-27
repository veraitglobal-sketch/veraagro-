import { createContext, useContext, useState, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCartStore } from '../lib/cart-store';

export type { CartItem, CartLineKind } from '../lib/cart-store';

const CartContext = createContext<ReturnType<typeof createCartStore> | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createCartStore(AsyncStorage));
  useEffect(() => { void store.initialize(); }, [store]);
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

export function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error('useCart must be used within CartProvider');
  const { items, loading } = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return {
    ...store,
    items,
    loading,
    getTotalPrice: () => items.reduce((total, item) => total + (item.product.price ?? 0) * item.quantity, 0),
    getTotalItems: () => items.reduce((total, item) => total + item.quantity, 0),
  };
}

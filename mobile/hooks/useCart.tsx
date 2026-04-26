import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'shopping_cart';

export type CartLineKind = 'purchase' | 'reservation';

export interface CartItem {
  product: Product;
  quantity: number;
  lineKind: CartLineKind;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number, options?: { lineKind?: CartLineKind }) => void;
  removeFromCart: (productId: string, lineKind: CartLineKind) => void;
  updateQuantity: (productId: string, quantity: number, lineKind: CartLineKind) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (data) {
        const parsed: CartItem[] = JSON.parse(data);
        setItems(
          parsed.map((it) => ({
            ...it,
            lineKind: it.lineKind || 'purchase',
          }))
        );
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product: Product, quantity: number, options?: { lineKind?: CartLineKind }) => {
    const lineKind: CartLineKind = options?.lineKind ?? 'purchase';
    const existingItem = items.find(
      (item) => item.product.id === product.id && item.lineKind === lineKind
    );

    if (existingItem) {
      const updatedItems = items.map((item) =>
        item.product.id === product.id && item.lineKind === lineKind
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      saveCart(updatedItems);
    } else {
      saveCart([...items, { product, quantity, lineKind }]);
    }
  };

  const removeFromCart = (productId: string, lineKind: CartLineKind) => {
    const updatedItems = items.filter(
      (item) => !(item.product.id === productId && item.lineKind === lineKind)
    );
    saveCart(updatedItems);
  };

  const updateQuantity = (productId: string, quantity: number, lineKind: CartLineKind) => {
    if (quantity <= 0) {
      removeFromCart(productId, lineKind);
      return;
    }

    const updatedItems = items.map((item) =>
      item.product.id === productId && item.lineKind === lineKind
        ? { ...item, quantity }
        : item
    );
    saveCart(updatedItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = item.product.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

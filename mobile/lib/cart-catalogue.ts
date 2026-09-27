import type { Product } from './api/types';
import type { CartItem } from './cart-store';

export type CartCatalogueIssue = 'unavailable' | 'priceMissing' | 'quantity';

export function cartCatalogueIssue(line: CartItem, items: CartItem[], products: Product[]): CartCatalogueIssue | null {
  if (line.checkoutKey) return null; // A prior request may already have consumed stock.
  const product = products.find(product => product.id === line.product.id);
  if (!product) return 'unavailable';
  if (!Number.isFinite(product.price) || (product.price ?? 0) <= 0) return 'priceMissing';
  const requested = items.filter(item => item.product.id === product.id && !item.checkoutKey)
    .reduce((sum, item) => sum + item.quantity, 0);
  const available = Number(product.quantity);
  if (!Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(available) || requested > available) return 'quantity';
  return null;
}

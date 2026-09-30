import type { Product } from './api/types';
import type { CatalogProduct } from './api/catalog';
import type { CartItem } from './cart-store';

export type CartCatalogueIssue = 'unavailable' | 'priceMissing' | 'quantity';

export type CartCatalogContext = {
  hubProducts: Product[];
  catalogProducts: CatalogProduct[];
};

function isCatalogLine(line: CartItem): boolean {
  return !!line.packOptionId || !!line.product.catalogProduct || !!line.pricePerPack;
}

export function cartLineTotalEur(line: CartItem): number | null {
  if (isCatalogLine(line) && line.pricePerPack != null) {
    return line.pricePerPack * line.quantity;
  }
  if (line.product.price != null && line.product.price > 0) {
    return line.product.price * line.quantity;
  }
  return null;
}

/** Catalogue: "4 × 5 kg (20 kg) — €84.00"; hub: "Apple × 4 kg — €19.20" */
export function formatCartLineLabel(line: CartItem, locale: string): string {
  const total = cartLineTotalEur(line);
  const price =
    total != null
      ? total.toLocaleString(locale, { style: 'currency', currency: 'EUR' })
      : null;
  if (isCatalogLine(line) && line.packLabel) {
    const packKg = line.packSizeKg ?? null;
    const totalKg = packKg != null ? line.quantity * packKg : null;
    const qtyPart =
      totalKg != null
        ? `${line.quantity} × ${line.packLabel} (${totalKg} kg)`
        : `${line.quantity} × ${line.packLabel}`;
    return price ? `${qtyPart} — ${price}` : qtyPart;
  }
  const qtyPart = `${line.product.productName} × ${line.quantity} ${line.product.unit ?? 'kg'}`;
  return price ? `${qtyPart} — ${price}` : qtyPart;
}

function normalizeCatalogContext(ctxOrHub: CartCatalogContext | Product[]): CartCatalogContext {
  return Array.isArray(ctxOrHub) ? { hubProducts: ctxOrHub, catalogProducts: [] } : ctxOrHub;
}

export function cartCatalogueIssue(
  line: CartItem,
  items: CartItem[],
  ctxOrHub: CartCatalogContext | Product[],
): CartCatalogueIssue | null {
  const ctx = normalizeCatalogContext(ctxOrHub);
  if (line.checkoutKey) return null;

  if (isCatalogLine(line)) {
    const catalog = ctx.catalogProducts.find((p) => p.id === line.product.id);
    if (!catalog) return 'unavailable';
    const pack = catalog.packOptions.find((o) => o.id === line.packOptionId);
    if (!pack || !pack.maxPacks) return 'unavailable';
    if (!Number.isFinite(pack.pricePerPack) || pack.pricePerPack <= 0) return 'priceMissing';
    const requested = items
      .filter((item) => item.product.id === catalog.id && item.packOptionId === pack.id && !item.checkoutKey)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (!Number.isFinite(line.quantity) || line.quantity <= 0 || requested > pack.maxPacks) return 'quantity';
    return null;
  }

  const product = ctx.hubProducts.find((p) => p.id === line.product.id);
  if (!product) return 'unavailable';
  if (!Number.isFinite(product.price) || (product.price ?? 0) <= 0) return 'priceMissing';
  const requested = items
    .filter((item) => item.product.id === product.id && !item.checkoutKey && !isCatalogLine(item))
    .reduce((sum, item) => sum + item.quantity, 0);
  const available = Number(product.quantity);
  if (!Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(available) || requested > available) {
    return 'quantity';
  }
  return null;
}

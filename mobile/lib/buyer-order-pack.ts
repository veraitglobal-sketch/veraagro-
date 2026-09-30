/** Catalogue order line: "4 × 5 kg · €21.00" */
export function formatCatalogOrderLine(
  order: {
    packCount?: number | null;
    packLabel?: string | null;
    unitPrice?: number | null;
    packSizeKg?: number | null;
    totalAmount?: number | null;
    quantity?: number;
    unit?: string;
    productName?: string;
  },
  locale: string,
): string {
  if (order.packCount && order.packLabel) {
    const packPrice =
      order.totalAmount != null && order.packCount > 0
        ? order.totalAmount / order.packCount
        : order.unitPrice != null && order.packSizeKg != null
          ? order.unitPrice * order.packSizeKg
          : null;
    const packPart = `${order.packCount} × ${order.packLabel}`;
    if (packPrice != null) {
      return `${packPart} · ${packPrice.toLocaleString(locale, { style: 'currency', currency: 'EUR' })}`;
    }
    return packPart;
  }
  const qty = order.quantity ?? 0;
  const unit = order.unit ?? 'kg';
  if (order.unitPrice != null) {
    return `${qty} ${unit} × ${Number(order.unitPrice).toLocaleString(locale, { style: 'currency', currency: 'EUR' })}`;
  }
  return `${order.productName ?? ''} · ${qty} ${unit}`.trim();
}

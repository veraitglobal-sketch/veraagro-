import {
  formatCatalogOrderListLine as sharedListLine,
  formatCatalogOrderDetailPricing,
  formatPackLine,
  type CatalogOrderLineInput,
} from '../../shared/i18n/buyer-order-format';

export { formatCatalogOrderDetailPricing, formatPackLine, type CatalogOrderLineInput };

/** List/detail line: "2 × 10 kg (20 kg) · €70.00" */
export function formatCatalogOrderListLine(order: CatalogOrderLineInput, lang: string): string {
  return sharedListLine(order, lang);
}

/** @deprecated alias — pass language code (en, sr), not full BCP 47 */
export function formatCatalogOrderLine(order: CatalogOrderLineInput, locale: string): string {
  const lang = locale.toLowerCase().startsWith('sr') ? 'sr' : locale.split('-')[0] || 'en';
  return sharedListLine(order, lang);
}

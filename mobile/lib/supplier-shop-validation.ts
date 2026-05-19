import type { TFunction } from 'i18next';

export const SUPPLIER_CATALOG_UNITS = ['bag', 'kg', 'l', 'pcs', 'box', 'roll', 'unit'] as const;

export type SupplierCatalogFormState = {
  name: string;
  description: string;
  unit: string;
  listPrice: string;
  sku: string;
};

export type SupplierCatalogFormErrors = Partial<Record<keyof SupplierCatalogFormState, string>>;

function parseOptionalPrice(raw: string): { ok: true; value?: number } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };
  const normalized = trimmed.replace(',', '.');
  const n = Number(normalized);
  if (Number.isNaN(n) || n < 0) return { ok: false };
  return { ok: true, value: n };
}

export function validateSupplierCatalogForm(
  form: SupplierCatalogFormState,
  t: TFunction,
): { valid: boolean; errors: SupplierCatalogFormErrors; listPrice?: number } {
  const errors: SupplierCatalogFormErrors = {};
  const name = form.name.trim();
  if (!name) {
    errors.name = t('supplier.shop.validation.nameRequired');
  } else if (name.length > 200) {
    errors.name = t('supplier.shop.validation.nameTooLong');
  }

  const description = form.description.trim();
  if (description.length > 2000) {
    errors.description = t('supplier.shop.validation.descriptionTooLong');
  }

  const unit = form.unit.trim() || 'unit';
  if (unit.length > 32) {
    errors.unit = t('supplier.shop.validation.unitTooLong');
  }

  const priceResult = parseOptionalPrice(form.listPrice);
  if (!priceResult.ok) {
    errors.listPrice = t('supplier.shop.validation.priceInvalid');
  }

  const sku = form.sku.trim();
  if (sku.length > 64) {
    errors.sku = t('supplier.shop.validation.skuTooLong');
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    listPrice: priceResult.ok ? priceResult.value : undefined,
  };
}

export const emptyCatalogForm = (): SupplierCatalogFormState => ({
  name: '',
  description: '',
  unit: 'bag',
  listPrice: '',
  sku: '',
});

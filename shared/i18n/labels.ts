/** Minimal i18n translate fn — compatible with i18next TranslateFn without a hard dependency. */
export type TranslateFn = (key: string, options?: { defaultValue?: string }) => string;

export type StatusAudience = 'buyer' | 'admin' | 'logistics';

function glossaryKey(...parts: string[]): string {
  return ['glossary', ...parts].join('.');
}

function labelOrFallback(
  t: TranslateFn,
  key: string,
  fallback: string,
): string {
  const value = t(key);
  return value === key ? fallback : value;
}

export function orderStatusLabel(
  t: TranslateFn,
  status: string | null | undefined,
  audience: StatusAudience = 'buyer',
): string {
  const code = status?.trim() || 'PENDING';
  const key = glossaryKey('orderStatus', audience, code);
  const buyerKey = glossaryKey('orderStatus', 'buyer', code);
  return labelOrFallback(t, key, labelOrFallback(t, buyerKey, code.replace(/_/g, ' ')));
}

export function orderStatusDescription(
  t: TranslateFn,
  status: string | null | undefined,
): string {
  const code = status?.trim() || 'UNKNOWN';
  const key = glossaryKey('orderStatus', 'buyerDescription', code);
  return labelOrFallback(t, key, '');
}

export function deliveryStatusLabel(
  t: TranslateFn,
  status: string | null | undefined,
  audience: StatusAudience = 'buyer',
): string {
  const code = status?.trim() || 'PENDING';
  const key = glossaryKey('deliveryStatus', audience, code);
  const buyerKey = glossaryKey('deliveryStatus', 'buyer', code);
  return labelOrFallback(t, key, labelOrFallback(t, buyerKey, code.replace(/_/g, ' ')));
}

export function missionStatusLabel(
  t: TranslateFn,
  status: string | null | undefined,
  audience: 'admin' | 'logistics' = 'admin',
): string {
  const code = status?.trim() || 'PENDING';
  const key = glossaryKey('missionStatus', audience, code);
  const altKey = glossaryKey('missionStatus', audience === 'admin' ? 'logistics' : 'admin', code);
  return labelOrFallback(t, key, labelOrFallback(t, altKey, code.replace(/_/g, ' ')));
}

export function seedBagStatusLabel(t: TranslateFn, status: string | null | undefined): string {
  const code = status?.trim() || 'AVAILABLE';
  const key = glossaryKey('seedBagStatus', code);
  return labelOrFallback(t, key, code.replace(/_/g, ' '));
}

export function seedRunStatusLabel(t: TranslateFn, status: string | null | undefined): string {
  const code = status?.trim() || 'PLANNED';
  const key = glossaryKey('seedRunStatus', code);
  return labelOrFallback(t, key, code.replace(/_/g, ' '));
}

export function handoverStatusLabel(t: TranslateFn, status: string | null | undefined): string {
  const code = status?.trim() || 'PENDING';
  const key = glossaryKey('handoverStatus', code);
  return labelOrFallback(t, key, code.replace(/_/g, ' '));
}

export function roleLabel(t: TranslateFn, role: string | null | undefined): string {
  const code = role?.trim() || '';
  if (!code) return '';
  const key = glossaryKey('roles', code);
  return labelOrFallback(t, key, code.replace(/_/g, ' '));
}

export function unitLabel(t: TranslateFn, unit: string | null | undefined): string {
  const code = unit?.trim()?.toLowerCase() || 'kg';
  const key = glossaryKey('units', code);
  return labelOrFallback(t, key, code);
}

export function nounLabel(t: TranslateFn, noun: string): string {
  const key = glossaryKey('nouns', noun);
  return labelOrFallback(t, key, noun);
}

/** Effective buyer order status (REJECTED when cancelled with reason). */
export function getEffectiveBuyerOrderStatus(order: {
  status?: string | null;
  rejectionReason?: string | null;
} | null | undefined): string {
  if (!order?.status) return 'PENDING';
  if (order.status === 'CANCELLED' && order.rejectionReason?.trim()) return 'REJECTED';
  return order.status;
}

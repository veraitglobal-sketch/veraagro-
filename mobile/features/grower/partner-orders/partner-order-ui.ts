import { enterpriseColors } from '../../../lib/enterprise-ui';
import type { PartnerOrder } from './types';

export function orderStatusTone(status: string): { bg: string; text: string } {
  const s = status.toUpperCase();
  if (s === 'CONFIRMED' || s === 'FULFILLED') {
    return { bg: enterpriseColors.primaryTint, text: enterpriseColors.primary };
  }
  if (s === 'CANCELLED' || s === 'REJECTED') {
    return { bg: enterpriseColors.gray100, text: enterpriseColors.gray600 };
  }
  return { bg: 'rgba(217, 119, 6, 0.1)', text: '#92400E' };
}

export function orderPartnerLabel(o: PartnerOrder, partnerFallback: string): string {
  if (!o.supplier) return partnerFallback;
  const n = [o.supplier.firstName, o.supplier.lastName].filter(Boolean).join(' ').trim();
  if (n) return n;
  return o.supplier.partnerCode || partnerFallback;
}

export function threadTitle(
  row: {
    supplier?: {
      firstName: string | null;
      lastName: string | null;
      partnerCode: string | null;
      material_supplier_profile?: { businessName: string } | null;
    };
  },
  partnerFallback: string,
): string {
  const b = row.supplier?.material_supplier_profile?.businessName;
  if (b) return b;
  const n = [row.supplier?.firstName, row.supplier?.lastName].filter(Boolean).join(' ').trim();
  return n || row.supplier?.partnerCode || partnerFallback;
}

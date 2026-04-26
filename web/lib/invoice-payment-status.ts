/**
 * Prisma: `orders.payments` is a single object (1:1), not an array.
 * PaymentStatus: PENDING | IN_ESCROW | RELEASED | REFUNDED (no "PAID" string in DB)
 */

export type BuyerInvoiceDisplayStatus = 'PAID' | 'PENDING' | 'REFUNDED';

export function getOrderPayment(
  order: { payments?: unknown } | null | undefined,
): {
  status?: string;
  paymentMethod?: string;
  releasedAt?: string | null;
} | null {
  if (!order?.payments) return null;
  const p = order.payments as
    | { status?: string; paymentMethod?: string; releasedAt?: string | null }
    | Array<{
        status?: string;
        paymentMethod?: string;
        releasedAt?: string | null;
      }>;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

/** Shown in buyer "Invoices" list — "paid" when money is in escrow or released. */
export function getBuyerInvoiceDisplayStatus(
  order: { payments?: unknown } | null | undefined,
): BuyerInvoiceDisplayStatus {
  const pay = getOrderPayment(order);
  const s = pay?.status;
  if (s === 'IN_ESCROW' || s === 'RELEASED') return 'PAID';
  if (s === 'REFUNDED') return 'REFUNDED';
  return 'PENDING';
}

/**
 * Buyer-friendly labels for `OrderStatus` (see Prisma enum).
 * Shown in buyer portal so customers know where the order is.
 */

const BUYER: Record<string, { label: string; description: string }> = {
  PENDING: {
    label: 'Placed',
    description: 'We have received your order. Vera will confirm before payment.',
  },
  APPROVED: {
    label: 'Accepted',
    description:
      'BioVera has accepted your order. Use the bank transfer instructions below, then we will mark payment when it arrives (or use in-app pay when available).',
  },
  PAID: {
    label: 'Paid',
    description: 'Payment has been received. The supplier will confirm the order shortly.',
  },
  CONFIRMED: {
    label: 'Preparing',
    description: 'Your order is confirmed and is being prepared for shipment.',
  },
  PICKED_UP: {
    label: 'Picked up',
    description: 'The goods have been collected from the supplier.',
  },
  IN_TRANSIT: {
    label: 'In transit',
    description: 'Your order is on the way to the delivery address.',
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'The order has been delivered. Thank you for your purchase.',
  },
  COMPLETED: {
    label: 'Completed',
    description: 'This order is complete and closed.',
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'This order was cancelled.',
  },
  REFUNDED: {
    label: 'Refunded',
    description: 'This order was refunded.',
  },
};

export function getBuyerOrderStatusLabel(status: string | undefined | null): string {
  if (!status) return 'Unknown';
  return BUYER[status]?.label ?? status.replace(/_/g, ' ');
}

export function getBuyerOrderStatusDescription(
  status: string | undefined | null,
): string {
  if (!status) return '';
  return (
    BUYER[status]?.description ?? 'Status is being updated. Check back for details.'
  );
}

/** Styling: border and text (Tailwind classes) */
export function getBuyerStatusBadgeClass(status: string | undefined | null): string {
  const s = status || 'PENDING';
  switch (s) {
    case 'COMPLETED':
    case 'DELIVERED':
      return 'border-[#2D5A27]/30 text-[#2D5A27]/80 bg-[#2D5A27]/5';
    case 'IN_TRANSIT':
    case 'PICKED_UP':
      return 'border-amber-200/80 text-amber-800 bg-amber-50/80';
    case 'PAID':
    case 'CONFIRMED':
    case 'APPROVED':
      return 'border-sky-200/80 text-sky-800 bg-sky-50/80';
    case 'PENDING':
      return 'border-gray-200/50 text-gray-600/80 bg-gray-50/80';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'border-red-200/50 text-red-700 bg-red-50/60';
    default:
      return 'border-gray-200/50 text-gray-600/80 bg-gray-50/80';
  }
}

export const ALL_ORDER_STATUS_FILTERS = [
  { value: 'PENDING', label: 'Placed' },
  { value: 'APPROVED', label: 'Accepted' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CONFIRMED', label: 'Preparing' },
  { value: 'PICKED_UP', label: 'Picked up' },
  { value: 'IN_TRANSIT', label: 'In transit' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
] as const;

export type OrderQueue = 'stock' | 'approval' | 'payment' | 'dispatch' | 'progress' | 'settlement' | 'closed';
export type OperationsOrder = {
  id: string; orderNumber: string; status: string; createdAt: string; productName: string;
  payments?: { status?: string } | null; deliveries?: { status?: string } | null;
  stockReservation?: { status: string; quantity: number; unit: string } | null;
  users?: { firstName?: string; lastName?: string; partnerCode?: string };
  fulfilling_estate?: { name?: string } | null;
};
export function orderQueue(order: OperationsOrder): OrderQueue {
  if (!['CANCELLED', 'REFUNDED'].includes(order.status) && order.payments?.status === 'IN_ESCROW' &&
    ['CONFIRMED', 'COMPLETED', 'DELIVERED'].includes(order.deliveries?.status || '')) return 'settlement';
  if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status)) return 'closed';
  if (['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(order.status) && !['RESERVED', 'ISSUED'].includes(order.stockReservation?.status || '')) return 'stock';
  if (order.status === 'PENDING') return 'approval';
  if (order.status === 'APPROVED') return 'payment';
  if (['PAID', 'CONFIRMED'].includes(order.status) && !order.deliveries) return 'dispatch';
  return 'progress';
}
export function canCancelUnpaid(order: OperationsOrder) {
  return ['PENDING', 'APPROVED'].includes(order.status) && !order.payments && !order.deliveries;
}
export function matchesOrderSearch(order: OperationsOrder, search: string) {
  return [order.orderNumber, order.productName, order.users?.firstName, order.users?.lastName,
    order.users?.partnerCode, order.fulfilling_estate?.name].filter(Boolean).join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
}
/** Never add kilograms and crates into one misleading stock total. */
export function heldOrderStock(orders: OperationsOrder[], unpaidOnly: boolean) {
  const units = new Map<string, number>();
  for (const order of orders) {
    const hold = order.stockReservation;
    if (orderQueue(order) === 'closed' || hold?.status !== 'RESERVED' || unpaidOnly && !canCancelUnpaid(order)) continue;
    units.set(hold.unit, (units.get(hold.unit) || 0) + hold.quantity);
  }
  return [...units].sort(([a], [b]) => a.localeCompare(b));
}

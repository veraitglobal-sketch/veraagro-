import type { Order } from './api/types';
import { buyerDeliveryActions } from './buyer-delivery-state';

export function buyerOrderPermissions(order: Order) {
  const unpaid = !order.payments && !order.deliveries;
  return {
    canPay: unpaid && order.status === 'APPROVED' && order.stockReservation?.status === 'RESERVED',
    canCancel: unpaid && ['PENDING', 'APPROVED'].includes(order.status),
  };
}

export function buyerOrderNextStep(order: Order, now = Date.now()) {
  const base = { destination: 'order' as 'order' | 'delivery', id: order.id, needsAction: false, deadline: null as number | null };
  if (['CANCELLED', 'REFUNDED'].includes(order.status)) return { ...base, kind: 'closed' };
  const delivery = order.deliveries;
  if (delivery) {
    const actions = buyerDeliveryActions({ ...delivery, orderId: order.id }, now);
    const target = { ...base, destination: 'delivery' as const, id: delivery.id };
    if (actions.canReport) return { ...target, kind: 'report', deadline: actions.deadline };
    if (actions.confirmed || order.status === 'COMPLETED') return { ...target, kind: 'evidence' };
    // This opens review, never confirms receipt without loading the full handover state.
    if (delivery.status === 'DELIVERED') return { ...target, kind: 'receipt', needsAction: true };
    return { ...target, kind: 'track' };
  }
  if (['PENDING', 'APPROVED', 'PAID', 'CONFIRMED'].includes(order.status)) {
    if (order.payments?.status === 'PENDING') return { ...base, kind: 'paymentPending' };
    if (order.payments || ['PAID', 'CONFIRMED'].includes(order.status)) return { ...base, kind: 'preparing' };
  }
  if (buyerOrderPermissions(order).canPay) return { ...base, kind: 'payment', needsAction: true };
  if (['PENDING', 'APPROVED'].includes(order.status)) return { ...base, kind: order.stockReservation?.status === 'RESERVED' ? 'approval' : 'allocation' };
  return { ...base, kind: 'details' };
}

export function activeBuyerDelivery(orders: Order[]): Order | null {
  return orders.filter(order => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status) && order.deliveries &&
    ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(order.deliveries.status))
    .sort((a, b) => Number(b.deliveries?.status === 'DELIVERED') - Number(a.deliveries?.status === 'DELIVERED') || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] || null;
}

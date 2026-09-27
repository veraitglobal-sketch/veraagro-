import type { BuyerDelivery } from './api/deliveries';

export function buyerDeliveryActions(delivery: BuyerDelivery, now = Date.now()) {
  const receipt = delivery.buyerPickupConfirmedAt || delivery.confirmedAt;
  const receivedAt = receipt ? Date.parse(receipt) : NaN;
  const deadline = receivedAt + 24 * 60 * 60 * 1000;
  const handover = delivery.digital_handovers;
  return {
    canCompleteHandover: delivery.status === 'IN_TRANSIT' && !!handover && ['INITIATED', 'IN_PROGRESS'].includes(handover.status),
    canConfirm: !delivery.returnCase && delivery.status === 'DELIVERED' && handover?.status === 'COMPLETED' && !receipt,
    canReport: Number.isFinite(deadline) && now >= receivedAt && now <= deadline,
    deadline: Number.isFinite(deadline) ? deadline : null,
    confirmed: Boolean(receipt),
  };
}

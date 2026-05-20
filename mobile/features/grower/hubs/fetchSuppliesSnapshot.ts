import { b2bSuppliersAPI, materialsAPI } from '../../../lib/api';
import { offlineStorage } from '../../../lib/offline-storage';
import { formatOrderLines, orderStatusSortKey, type PartnerOrder } from '../partner-orders/types';

export type SuppliesSnapshot = {
  materialsCount: number;
  productsCount: number;
  partnerOrdersOpen: number;
  partnerOrdersAwaitingReceive: number;
  partnerOrdersPending: number;
  partnerOrdersTotal: number;
  recentOrders: PartnerOrder[];
};

function pickRecentOrders(orders: PartnerOrder[], limit = 1): PartnerOrder[] {
  return [...orders]
    .sort((a, b) => {
      const dr = orderStatusSortKey(a.status) - orderStatusSortKey(b.status);
      if (dr !== 0) return dr;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, limit);
}

function countPartnerOrders(orders: PartnerOrder[]) {
  let awaitingReceive = 0;
  let pending = 0;
  for (const o of orders) {
    const s = String(o.status || '').toUpperCase();
    if (s === 'CANCELLED' || s === 'REJECTED') continue;
    if (o.farmerReceivedAt) continue;
    if (s === 'CONFIRMED' || s === 'FULFILLED') awaitingReceive += 1;
    else if (s === 'PENDING') pending += 1;
  }
  return {
    awaitingReceive,
    pending,
    open: awaitingReceive + pending,
  };
}

export async function fetchSuppliesSnapshot(): Promise<SuppliesSnapshot> {
  const [materialsResult, productsResult, ordersResult] = await Promise.allSettled([
    materialsAPI.getWhitelist(),
    offlineStorage.getPendingProducts(),
    b2bSuppliersAPI.getMyDirectOrders(),
  ]);

  let materialsCount = 0;
  if (materialsResult.status === 'fulfilled') {
    materialsCount = Array.isArray(materialsResult.value) ? materialsResult.value.length : 0;
    if (materialsCount > 0) {
      const barcodes = materialsResult.value.map((m) => m.barcode);
      await offlineStorage.saveWhitelist(barcodes);
    }
  } else {
    const cached = await offlineStorage.getWhitelist();
    materialsCount = cached.length;
  }

  const productsCount =
    productsResult.status === 'fulfilled' && Array.isArray(productsResult.value)
      ? productsResult.value.length
      : 0;

  const orders =
    ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)
      ? (ordersResult.value as PartnerOrder[])
      : [];
  const partner = countPartnerOrders(orders);

  return {
    materialsCount,
    productsCount,
    partnerOrdersOpen: partner.open,
    partnerOrdersAwaitingReceive: partner.awaitingReceive,
    partnerOrdersPending: partner.pending,
    partnerOrdersTotal: orders.length,
    recentOrders: pickRecentOrders(orders),
  };
}

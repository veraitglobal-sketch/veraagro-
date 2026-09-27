import { isAxiosError } from 'axios';
import api from './api/client';
import { offlineStorage, productOwnerId, type PendingProduct } from './offline-storage';
import { isDeviceOnline } from './network-utils';

/** The server uses the same clientReference as the device; a server acknowledgement wins. */
export function mergeGrowerProducts(local: PendingProduct[], server: PendingProduct[]) {
  const rows = new Map(local.map(row => [row.id, row]));
  for (const row of server) rows.set(row.id, { ...row, status: 'synced' });
  return [...rows.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export async function loadGrowerProducts(): Promise<{ products: PendingProduct[]; serverUnavailable: boolean }> {
  const owner = await productOwnerId();
  if (!owner) return { products: [], serverUnavailable: true };
  const local = await offlineStorage.getPendingProducts(owner);
  const online = await isDeviceOnline();
  if (await productOwnerId() !== owner) return { products: [], serverUnavailable: true };
  if (!online) return { products: mergeGrowerProducts(local, []), serverUnavailable: true };
  try {
    const { data } = await api.get<PendingProduct[]>('/grower-portal/products');
    if (await productOwnerId() !== owner) return { products: [], serverUnavailable: true };
    if (!Array.isArray(data)) throw new Error('Invalid product list');
    return { products: mergeGrowerProducts(local, data), serverUnavailable: false };
  } catch (error) {
    if (await productOwnerId() !== owner) return { products: [], serverUnavailable: true };
    // 404 = this server has no product list endpoint yet; device rows are the whole list, no retry banner.
    const missing = isAxiosError(error) && error.response?.status === 404;
    return { products: mergeGrowerProducts(local, []), serverUnavailable: !missing };
  }
}

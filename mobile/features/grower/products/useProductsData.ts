import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadGrowerProducts } from '../../../lib/grower-products';
import { offlineStorage, PendingProduct } from '../../../lib/offline-storage';
import { isDeviceOnline } from '../../../lib/network-utils';
import { syncService } from '../../../lib/sync-service';

export function useProductsData() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const request = useRef(0);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const generation = ++request.current;
    const silent = opts?.silent === true;
    if (silent) setListRefreshing(true);
    else setLoading(true);
    try {
      if (await isDeviceOnline()) {
        await syncService.syncPendingProducts();
      }
      const result = await loadGrowerProducts();
      if (generation !== request.current) return;
      setProducts(result.products);
      setLoadError(result.serverUnavailable);
    } catch (error) {
      console.error('Error loading products:', error);
      if (generation === request.current) setLoadError(true);
    } finally {
      if (generation === request.current) { setListRefreshing(false); setLoading(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { request.current++; };
  }, [load]));

  const addProduct = useCallback(
    async (entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>) => {
      const id = await offlineStorage.savePendingProduct(entry);
      if (await isDeviceOnline()) {
        await syncService.syncPendingProducts();
      }
      await load({ silent: true });
      return id;
    },
    [load],
  );

  return { products, loadError, loading, listRefreshing, load, addProduct };
}

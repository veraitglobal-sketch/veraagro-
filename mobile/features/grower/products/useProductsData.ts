import { useState, useCallback, useEffect } from 'react';
import { offlineStorage, PendingProduct } from '../../../lib/offline-storage';

export function useProductsData() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setListRefreshing(true);
    else setLoading(true);
    try {
      const list = await offlineStorage.getPendingProducts();
      setProducts(list);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      if (silent) setListRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addProduct = useCallback(
    async (entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>) => {
      const id = await offlineStorage.savePendingProduct(entry);
      await load({ silent: true });
      return id;
    },
    [load]
  );

  return { products, loading, listRefreshing, load, addProduct };
}

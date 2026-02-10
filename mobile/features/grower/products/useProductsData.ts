import { useState, useCallback } from 'react';
import { offlineStorage, PendingProduct } from '../../../lib/offline-storage';

export function useProductsData() {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await offlineStorage.getPendingProducts();
      setProducts(list);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = useCallback(
    async (entry: Omit<PendingProduct, 'id' | 'timestamp' | 'status'>) => {
      const id = await offlineStorage.savePendingProduct(entry);
      await load();
      return id;
    },
    [load]
  );

  return { products, loading, load, addProduct };
}

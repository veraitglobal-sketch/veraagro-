import { useState, useCallback, useEffect } from 'react';
import { offlineStorage, PendingCost, PendingProduct } from '../../../lib/offline-storage';

export function useCostCalculatorData() {
  const [costs, setCosts] = useState<PendingCost[]>([]);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setListRefreshing(true);
    else setLoading(true);
    try {
      const [costList, productList] = await Promise.all([
        offlineStorage.getPendingCosts(),
        offlineStorage.getPendingProducts(),
      ]);
      setCosts(costList);
      setProducts(productList);
    } catch (error) {
      console.error('Error loading cost calculator data:', error);
      setCosts([]);
      setProducts([]);
    } finally {
      if (silent) setListRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addCost = useCallback(
    async (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => {
      await offlineStorage.savePendingCost(entry);
      await load({ silent: true });
    },
    [load]
  );

  const transferProductAsCost = useCallback(
    async (product: PendingProduct, amount: number) => {
      await offlineStorage.savePendingCost({
        type: 'product',
        productId: product.id,
        label: product.name,
        amount,
        currency: 'EUR',
      });
      await load({ silent: true });
    },
    [load]
  );

  return { costs, products, loading, listRefreshing, load, addCost, transferProductAsCost };
}

import { useState, useCallback } from 'react';
import { offlineStorage, PendingCost, PendingProduct } from '../../../lib/offline-storage';

export function useCostCalculatorData() {
  const [costs, setCosts] = useState<PendingCost[]>([]);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  const addCost = useCallback(
    async (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => {
      await offlineStorage.savePendingCost(entry);
      await load();
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
      await load();
    },
    [load]
  );

  return { costs, products, loading, load, addCost, transferProductAsCost };
}

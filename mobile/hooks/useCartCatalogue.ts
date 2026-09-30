import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { inventoryAPI, catalogAPI } from '../lib/api';
import { useCart } from './useCart';
import { cartCatalogueIssue, type CartCatalogContext } from '../lib/cart-catalogue';

/** Refresh catalogue metadata without changing quantities or retry identities. */
export function useCartCatalogue() {
  const { items, refreshProducts } = useCart();
  const [ctx, setCtx] = useState<CartCatalogContext>({ hubProducts: [], catalogProducts: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [pricesChanged, setPricesChanged] = useState(false);
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setFailed(false);
    try {
      const [hub, catalog] = await Promise.all([
        inventoryAPI.getAvailableProducts(),
        catalogAPI.listProducts().catch(() => []),
      ]);
      if (request !== generation.current) return;
      const changed = await refreshProducts(hub);
      if (request !== generation.current) return;
      setCtx({ hubProducts: hub, catalogProducts: catalog });
      setPricesChanged(changed);
    } catch {
      if (request === generation.current) setFailed(true);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [refreshProducts]);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );

  const issueFor = (line: (typeof items)[number]) => cartCatalogueIssue(line, items, ctx);
  const onlyRetries = items.length > 0 && items.every((item) => !!item.checkoutKey);
  const blocked = loading || (!onlyRetries && (failed || items.some((item) => !!issueFor(item))));

  return { loading, failed, pricesChanged, reload, issueFor, blocked, ctx };
}

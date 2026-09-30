import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { inventoryAPI, batchesAPI, notificationsAPI, ordersAPI, type Order, type BatchAvailability } from '../../../lib/api';
import { activeBuyerDelivery } from '../../../lib/buyer-order-next-step';
import { enhanceProduct, type EnhancedProduct, type FilterStatus } from './types';

export function useBuyerDashboardData() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedEstateId, setSelectedEstateId] = useState<string | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [batchAvailabilities, setBatchAvailabilities] = useState<Record<string, BatchAvailability>>({});
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const estates = useMemo(() => {
    const result = new Map<string, { id: string; name: string; count: number }>();
    for (const product of products) {
      const estate = product.estate;
      if (!estate?.id || estate.id === 'unknown') continue;
      const entry = result.get(estate.id);
      if (entry) entry.count++;
      else result.set(estate.id, { id: estate.id, name: estate.name, count: 1 });
    }
    return [...result.values()];
  }, [products]);
  useEffect(() => {
    if (selectedEstateId && !estates.some((estate) => estate.id === selectedEstateId)) setSelectedEstateId(null);
  }, [estates, selectedEstateId]);

  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const deliveryGeneration = useRef(0);
  const activeDelivery = useMemo(() => activeBuyerDelivery(deliveryOrders), [deliveryOrders]);
  const loadDeliveries = useCallback(async () => {
    const generation = ++deliveryGeneration.current;
    try {
      const orders = await ordersAPI.getAll();
      if (generation === deliveryGeneration.current) setDeliveryOrders(orders);
    } catch {
      if (generation === deliveryGeneration.current) setDeliveryOrders([]);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    void loadDeliveries();
    return () => { deliveryGeneration.current++; };
  }, [loadDeliveries]));

  const productGeneration = useRef(0);
  const loadProducts = useCallback(async () => {
    const generation = ++productGeneration.current;
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      if (generation === productGeneration.current) setProducts(data.map((p) => enhanceProduct(p, t)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (generation === productGeneration.current) setError(message || t('buyer.dashboard.loadFailed'));
      console.error('Error loading products:', err);
    } finally {
      if (generation === productGeneration.current) setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => {
    void loadProducts();
    return () => { productGeneration.current++; };
  }, [loadProducts]));

  const availabilityGeneration = useRef(0);
  const loadBatchAvailabilities = useCallback(async (source: EnhancedProduct[]) => {
    const generation = ++availabilityGeneration.current;
    setBatchAvailabilities({});
    const availabilities: Record<string, BatchAvailability> = {};
    const ids = [...new Set(source.map((product) => product.batchId).filter((id): id is string => Boolean(id)))];
    for (let offset = 0; offset < ids.length; offset += 4) {
      if (generation !== availabilityGeneration.current) return;
      await Promise.all(ids.slice(offset, offset + 4).map(async (id) => {
        try {
          availabilities[id] = await batchesAPI.getAvailability(id);
        } catch {
          // Missing availability must not be presented as confirmed stock.
        }
      }));
    }
    if (generation === availabilityGeneration.current) setBatchAvailabilities(availabilities);
  }, []);

  useEffect(() => {
    void loadBatchAvailabilities(products);
    return () => { availabilityGeneration.current++; };
  }, [products, loadBatchAvailabilities]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const data = await notificationsAPI.getAll();
          const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : 0;
          if (!cancelled) setUnreadNotifications(unread);
        } catch {
          if (!cancelled) setUnreadNotifications(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadProducts(), loadDeliveries()]);
    try {
      const notifData = await notificationsAPI.getAll();
      setUnreadNotifications(Array.isArray(notifData) ? notifData.filter((n) => !n.read).length : 0);
    } catch {
      setUnreadNotifications(0);
    }
    setRefreshing(false);
  }, [loadProducts, loadDeliveries]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) =>
      (activeFilter === 'all' || p.status === activeFilter) && (!selectedEstateId || p.estate?.id === selectedEstateId));
    return filtered.sort((a, b) => {
      const parsedA = Date.parse(a.harvestDate || '');
      const parsedB = Date.parse(b.harvestDate || '');
      const dateA = Number.isFinite(parsedA) ? parsedA : Infinity;
      const dateB = Number.isFinite(parsedB) ? parsedB : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      return a.productName.localeCompare(b.productName);
    });
  }, [products, activeFilter, selectedEstateId]);

  const handleQRPress = useCallback(async () => {
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }
    setShowQRScanner(true);
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    setShowQRScanner(false);
    setScannedBatchId(data.trim());
    setShowPassportModal(true);
  }, []);

  return {
    products,
    loading,
    error,
    refreshing,
    activeFilter,
    setActiveFilter,
    showQRScanner,
    setShowQRScanner,
    scannedBatchId,
    setScannedBatchId,
    showPassportModal,
    setShowPassportModal,
    cameraPermission,
    batchAvailabilities,
    showReservationModal,
    setShowReservationModal,
    selectedProduct,
    setSelectedProduct,
    unreadNotifications,
    estates,
    selectedEstateId,
    setSelectedEstateId,
    activeDelivery,
    filteredProducts,
    loadProducts,
    loadBatchAvailabilities,
    onRefresh,
    handleQRPress,
    handleBarcodeScanned,
  };
}

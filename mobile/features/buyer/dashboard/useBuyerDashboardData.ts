import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { inventoryAPI, batchesAPI, notificationsAPI, type BatchAvailability } from '../../../lib/api';
import { enhanceProduct, type EnhancedProduct, type FieldStory, type FilterStatus } from './types';

export function useBuyerDashboardData() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedBatchId, setScannedBatchId] = useState<string | null>(null);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [batchAvailabilities, setBatchAvailabilities] = useState<Record<string, BatchAvailability>>({});
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EnhancedProduct | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fieldStories = useMemo<FieldStory[]>(
    () =>
      (['1', '2', '3', '4'] as const).map((id) => ({
        id,
        farmerName: t(`buyer.dashboard.demoStoryNames.${id}`),
        subtitle: t(`buyer.dashboard.demoStorySubtitles.${id}`),
      })),
    [t],
  );

  const activeDelivery = useMemo(
    () => ({
      orderNumber: '#2104',
      location: t('buyer.dashboard.demoDeliveryLocation'),
    }),
    [t],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryAPI.getAvailableProducts();
      setProducts(data.map((p) => enhanceProduct(p, t)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message || t('buyer.dashboard.loadFailed'));
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const loadBatchAvailabilities = useCallback(async (source: EnhancedProduct[]) => {
    const availabilities: Record<string, BatchAvailability> = {};
    for (const product of source) {
      if (!product.batchId) continue;
      try {
        availabilities[product.batchId] = await batchesAPI.getAvailability(product.batchId);
      } catch {
        // availability optional for dashboard cards
      }
    }
    setBatchAvailabilities(availabilities);
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      void loadBatchAvailabilities(products);
    }
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
    await loadProducts();
    try {
      const notifData = await notificationsAPI.getAll();
      setUnreadNotifications(Array.isArray(notifData) ? notifData.filter((n) => !n.read).length : 0);
    } catch {
      setUnreadNotifications(0);
    }
    setRefreshing(false);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const filtered = activeFilter === 'all' ? products : products.filter((p) => p.status === activeFilter);
    return filtered.sort((a, b) => {
      const dateA = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : Infinity;
      const dateB = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : Infinity;
      if (dateA !== dateB) return dateA - dateB;
      return (b.farmerTrustScore || 0) - (a.farmerTrustScore || 0);
    });
  }, [products, activeFilter]);

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
    fieldStories,
    activeDelivery,
    filteredProducts,
    loadProducts,
    loadBatchAvailabilities,
    onRefresh,
    handleQRPress,
    handleBarcodeScanned,
  };
}

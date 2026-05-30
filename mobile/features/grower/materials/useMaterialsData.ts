import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { materialsAPI, Material } from '../../../lib/api';
import { offlineStorage } from '../../../lib/offline-storage';
import { theme } from '../../../lib/theme';

export type MaterialFilterType = 'all' | 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER';

export function useMaterialsData() {
  const { t } = useTranslation();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<MaterialFilterType>('all');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const data = await materialsAPI.getWhitelist();
      setMaterials(data);

      if (data.length > 0) {
        const barcodes = data.map(m => m.barcode);
        await offlineStorage.saveWhitelist(barcodes);
        setLastSync(new Date());
      }
    } catch (error) {
      const cachedBarcodes = await offlineStorage.getWhitelist();
      if (cachedBarcodes.length > 0) {
        const cachedMaterials: Material[] = cachedBarcodes.map(barcode => ({
          id: barcode,
          barcode,
          name: barcode,
          type: 'OTHER',
        }));
        setMaterials(cachedMaterials);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const filteredMaterials = useMemo(() => {
    let filtered = materials;

    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        m =>
          m.barcode.toLowerCase().includes(query) ||
          (m.name?.toLowerCase().includes(query) ?? false) ||
          (m.productName?.toLowerCase().includes(query) ?? false) ||
          (m.manufacturer?.toLowerCase().includes(query) ?? false)
      );
    }

    return filtered;
  }, [materials, searchQuery, filterType]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  }, [loadMaterials]);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'FERTILIZER': return theme.colors.accent;
      case 'PESTICIDE': return theme.colors.warning;
      case 'SEED': return theme.colors.primary;
      default: return theme.colors.text.secondary;
    }
  }, []);

  const getTypeLabel = useCallback(
    (type: string) => {
      switch (type) {
        case 'FERTILIZER':
          return t('producer.materials.fertilizer');
        case 'PESTICIDE':
          return t('producer.materials.pesticide');
        case 'SEED':
          return t('producer.materials.seed');
        case 'OTHER':
          return t('producer.materials.other');
        default:
          return type;
      }
    },
    [t],
  );

  return {
    materials,
    filteredMaterials,
    loading,
    refreshing,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    lastSync,
    loadMaterials,
    onRefresh,
    getTypeColor,
    getTypeLabel,
  };
}

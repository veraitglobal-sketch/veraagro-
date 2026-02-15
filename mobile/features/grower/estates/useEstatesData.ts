import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { estatesAPI, Estate } from '../../../lib/api';
import { theme } from '../../../lib/theme';

export function useEstatesData() {
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEstates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstates();
  }, [loadEstates]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEstates();
    setRefreshing(false);
  }, [loadEstates]);

  const handleDelete = useCallback((estate: Estate) => {
    Alert.alert(
      'Delete Estate',
      `Are you sure you want to delete "${estate.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await estatesAPI.delete(estate.id);
              await loadEstates();
            } catch (error: any) {
              const msg =
                error?.response?.data?.message ||
                (error?.response?.status === 403 ? 'You do not have permission to delete this estate, or it has parcels that must be deleted first.' : 'Unable to delete estate');
              Alert.alert('Error', msg);
              console.error('Error deleting estate:', error);
            }
          },
        },
      ]
    );
  }, [loadEstates]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'CERTIFIED': return theme.colors.primary;
      case 'ACTIVE': return theme.colors.accent;
      case 'PENDING_SETUP': return theme.colors.warning;
      default: return theme.colors.text.secondary;
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'CERTIFIED': return 'Certified';
      case 'ACTIVE': return 'Active';
      case 'PENDING_SETUP': return 'Pending Setup';
      default: return status;
    }
  }, []);

  return {
    estates,
    loading,
    refreshing,
    loadEstates,
    onRefresh,
    handleDelete,
    getStatusColor,
    getStatusLabel,
  };
}

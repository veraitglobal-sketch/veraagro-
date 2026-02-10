import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  growthLogsAPI,
  GrowthLog,
  estatesAPI,
  Estate,
} from '../../../lib/api';

export function useGrowthJournalData() {
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const estatesData = await estatesAPI.getAll();
      setEstates(Array.isArray(estatesData) ? estatesData : []);
      if (Array.isArray(estatesData) && estatesData.length > 0 && filterEstate === 'all') {
        setFilterEstate(estatesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    if (filterEstate === 'all') {
      setLogs([]);
      return;
    }
    try {
      if (filterParcel !== 'all' && filterParcel) {
        const data = await growthLogsAPI.getAllByParcel(filterParcel);
        setLogs(Array.isArray(data) ? data : []);
      } else {
        const data = await growthLogsAPI.getAllByEstate(filterEstate);
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading growth logs:', error);
      setLogs([]);
    }
  }, [filterEstate, filterParcel]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (filterEstate !== 'all' && filterEstate) {
      loadLogs();
    } else {
      setLogs([]);
    }
  }, [filterEstate, filterParcel, loadLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadLogs()]);
    setRefreshing(false);
  }, [loadData, loadLogs]);

  const handleAddPhoto = useCallback(async () => {
    if (estates.length === 0) return;

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') return;

    let location: { lat: number; lng: number } | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && location) {
        // TODO: Upload to backend with GPS metadata
        console.log('Photo taken:', result.assets[0].uri, location);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  }, [estates.length]);

  const selectedEstate = estates.find((e) => e.id === filterEstate);
  const parcels = selectedEstate?.parcels || [];
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    estates,
    logs: sortedLogs,
    loading,
    refreshing,
    filterEstate,
    filterParcel,
    setFilterEstate,
    setFilterParcel,
    parcels,
    onRefresh,
    handleAddPhoto,
  };
}

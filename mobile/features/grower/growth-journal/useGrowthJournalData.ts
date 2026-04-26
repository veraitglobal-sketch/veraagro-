import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  growthLogsAPI,
  GrowthLog,
  estatesAPI,
  Estate,
} from '../../../lib/api';
import { getOrCreateDeviceId } from '../../../lib/device-id';
import { sha256HexFromImageUri } from '../../../lib/image-hash';

export function useGrowthJournalData() {
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const estatesData = await estatesAPI.getAll();
      setEstates(Array.isArray(estatesData) ? estatesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (estates.length > 0 && filterEstate === 'all') {
      setFilterEstate(estates[0].id);
    }
  }, [estates, filterEstate]);

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
    if (filterEstate === 'all' || !filterEstate) {
      Alert.alert('Estate', 'Select an estate first (use the filters below).');
      return;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions', 'Camera and location access are required.');
      return;
    }

    let location: { lat: number; lng: number } | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    } catch {
      Alert.alert('Location', 'Could not read GPS. Try again outdoors.');
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
    } catch (error) {
      console.error('Camera error:', error);
      return;
    }

    if (result.canceled || !result.assets[0] || !location) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const imageHash = await sha256HexFromImageUri(asset.uri);
      const deviceId = await getOrCreateDeviceId();
      const deviceTimestamp = new Date().toISOString();
      const parcelId =
        filterParcel !== 'all' && filterParcel ? filterParcel : undefined;
      // Placeholder until a dedicated public image CDN URL exists for this capture
      const imageUrl = `https://app.biovera.app/growth-log#${imageHash}`;

      await growthLogsAPI.create({
        estateId: filterEstate,
        parcelId,
        imageUrl,
        imageHash,
        gpsLatitude: location.lat,
        gpsLongitude: location.lng,
        deviceId,
        deviceTimestamp,
        notes: 'Growth journal (mobile)',
      });
      await loadLogs();
      Alert.alert('Saved', 'Growth log entry was submitted.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save growth log';
      Alert.alert('Error', String(msg));
      console.error('Growth log submit:', e);
    } finally {
      setUploading(false);
    }
  }, [estates.length, filterEstate, filterParcel, loadLogs]);

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
    uploading,
    filterEstate,
    filterParcel,
    setFilterEstate,
    setFilterParcel,
    parcels,
    onRefresh,
    handleAddPhoto,
  };
}

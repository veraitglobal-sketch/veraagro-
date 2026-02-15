import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { compliancePhotosAPI, CompliancePhoto, estatesAPI, Estate } from '../../../lib/api';
import { verifyGPS } from '../../../lib/integrity-guard';

export function useCompliancePhotosData() {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<CompliancePhoto[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [uploading, setUploading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [photosData, estatesData] = await Promise.all([
        compliancePhotosAPI.getAll().catch(() => []),
        estatesAPI.getAll().catch(() => []),
      ]);
      setPhotos(Array.isArray(photosData) ? photosData : []);
      setEstates(Array.isArray(estatesData) ? estatesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const uploadPhoto = useCallback(async (
    photoUri: string,
    location: { lat: number; lng: number },
    estateId: string
  ) => {
    try {
      setUploading(true);
      await compliancePhotosAPI.upload({
        estateId,
        photoUri,
        gpsLocation: location,
        type: 'COMPLIANCE',
      });
      await loadData();
      Alert.alert(t('alerts.success'), t('producer.compliance.photoSaved'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('producer.compliance.photoSaveFailed');
      Alert.alert(t('error'), message);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [loadData, t]);

  const handleUpload = useCallback(async () => {
    if (estates.length === 0) {
      Alert.alert(t('error'), t('producer.compliance.createEstateFirst'));
      return;
    }

    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert(t('producer.compliance.permissionsTitle'), t('producer.compliance.cameraLocationRequired'));
      return;
    }

    let location: { lat: number; lng: number } | null = null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      location = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
    } catch {
      Alert.alert(t('error'), t('producer.compliance.getLocationFailed'));
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
        const selectedEstate = estates.find(e => e.id === filterEstate);
        if (selectedEstate?.polygonCoordinates) {
          const polygon = selectedEstate.polygonCoordinates as Array<{ lat: number; lng: number }>;
          const isValid = verifyGPS(location, { polygonCoordinates: polygon });
          if (!isValid) {
            Alert.alert(
              t('alerts.warning'),
              t('producer.compliance.notOnParcel'),
              [
                { text: t('producer.compliance.cancel'), style: 'cancel' },
                { text: t('producer.compliance.continue'), onPress: () => uploadPhoto(result.assets[0].uri, location!, selectedEstate.id) },
              ]
            );
            return;
          }
        }

        const estateId = filterEstate !== 'all' ? filterEstate : estates[0].id;
        await uploadPhoto(result.assets[0].uri, location, estateId);
      }
    } catch (error) {
      Alert.alert(t('error'), t('producer.compliance.openCameraFailed'));
      console.error('Camera error:', error);
    }
  }, [estates, filterEstate, uploadPhoto, t]);

  const filteredPhotos = useMemo(
    () => (filterEstate === 'all' ? photos : photos.filter(p => p.estateId === filterEstate)),
    [photos, filterEstate]
  );

  return {
    photos,
    estates,
    loading,
    refreshing,
    filterEstate,
    setFilterEstate,
    uploading,
    loadData,
    onRefresh,
    handleUpload,
    filteredPhotos,
  };
}

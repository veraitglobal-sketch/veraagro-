import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPS } from '../../../lib/integrity-guard';
import { colors } from '../../../lib/colors';
import { estatesAPI, Estate } from '../../../lib/api';

export const CROP_TYPES = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

export function useHarvestData() {
  const { t } = useTranslation();
  const [cropType, setCropType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
      if (data?.length > 0) setCurrentEstate(data[0]);
    } catch (error) {
      console.error('Error loading estates:', error);
    }
  }, []);

  useEffect(() => {
    loadEstates();
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') Alert.alert(t('producer.estates.permissionsTitle'), t('producer.estates.locationPermissionRequired'));
    });
  }, [loadEstates, t]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(userLocation);
      if (currentEstate?.polygonCoordinates) {
        const isValid = verifyGPS(userLocation, {
          polygonCoordinates: currentEstate.polygonCoordinates as Array<{ lat: number; lng: number }>,
        });
        setGpsWarning(!isValid);
      }
    } catch (error) {
      Alert.alert(t('error'), t('producer.harvest.locationFailed'));
    } finally {
      setLoading(false);
    }
  }, [currentEstate]);

  const saveHarvest = useCallback(async () => {
    try {
      setLoading(true);
      const harvestData = {
        cropType: cropType.trim(),
        estimatedQuantity: parseFloat(estimatedQuantity),
        unit,
        harvestDate,
        location: location!,
        timestamp: new Date().toISOString(),
      };
      const existing = await offlineStorage.getPendingEntries();
      const harvestEntry = {
        id: `harvest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        activityType: 'Harvest' as const,
        materialID: undefined,
        photoUri: '',
        location: location!,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        harvestData,
      };
      existing.push(harvestEntry as any);
      await AsyncStorage.setItem('pending_field_entries', JSON.stringify(existing));
      Alert.alert(t('alerts.success'), t('producer.harvest.saved'));
      setCropType('');
      setEstimatedQuantity('');
      setUnit('kg');
      setHarvestDate(new Date().toISOString().split('T')[0]);
      setLocation(null);
      setGpsWarning(false);
    } catch (error) {
      Alert.alert(t('error'), t('producer.harvest.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [cropType, estimatedQuantity, unit, harvestDate, location, t]);

  const handleSubmit = useCallback(async () => {
    if (!cropType.trim()) {
      Alert.alert(t('error'), t('producer.harvest.enterCropType'));
      return;
    }
    if (!estimatedQuantity || parseFloat(estimatedQuantity) <= 0) {
      Alert.alert(t('error'), t('producer.harvest.enterQuantity'));
      return;
    }
    if (!location) {
      Alert.alert(t('error'), t('producer.harvest.locationRequired'));
      return;
    }
    if (gpsWarning) {
      Alert.alert(t('alerts.warning'), t('producer.harvest.notOnParcel'), [
        { text: t('producer.harvest.cancel'), style: 'cancel' },
        { text: t('producer.harvest.continue'), onPress: saveHarvest },
      ]);
      return;
    }
    await saveHarvest();
  }, [cropType, estimatedQuantity, location, gpsWarning, saveHarvest]);

  return {
    cropType,
    setCropType,
    estimatedQuantity,
    setEstimatedQuantity,
    unit,
    setUnit,
    harvestDate,
    setHarvestDate,
    location,
    gpsWarning,
    loading,
    getCurrentLocation,
    handleSubmit,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPS } from '../../../lib/integrity-guard';
import { colors } from '../../../lib/colors';
import { estatesAPI, Estate } from '../../../lib/api';

export const CROP_TYPES = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

export function useHarvestData() {
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
      if (status !== 'granted') Alert.alert('Dozvole', 'Potrebna je dozvola za lokaciju');
    });
  }, [loadEstates]);

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
      Alert.alert('Greška', 'Ne mogu da dobijem lokaciju');
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
        activityType: 'Žetva' as const,
        materialID: undefined,
        photoUri: '',
        location: location!,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        harvestData,
      };
      existing.push(harvestEntry as any);
      await AsyncStorage.setItem('pending_field_entries', JSON.stringify(existing));
      Alert.alert('Uspešno', 'Prijava berbe je sačuvana. Biće poslata kada budeš online.');
      setCropType('');
      setEstimatedQuantity('');
      setUnit('kg');
      setHarvestDate(new Date().toISOString().split('T')[0]);
      setLocation(null);
      setGpsWarning(false);
    } catch (error) {
      Alert.alert('Greška', 'Ne mogu da sačuvam prijavu berbe');
    } finally {
      setLoading(false);
    }
  }, [cropType, estimatedQuantity, unit, harvestDate, location]);

  const handleSubmit = useCallback(async () => {
    if (!cropType.trim()) {
      Alert.alert('Greška', 'Unesi tip useva');
      return;
    }
    if (!estimatedQuantity || parseFloat(estimatedQuantity) <= 0) {
      Alert.alert('Greška', 'Unesi validnu količinu');
      return;
    }
    if (!location) {
      Alert.alert('Greška', 'Lokacija je obavezna');
      return;
    }
    if (gpsWarning) {
      Alert.alert('Upozorenje', 'Niste na svojoj parceli! Da li želite da nastavite?', [
        { text: 'Otkaži', style: 'cancel' },
        { text: 'Nastavi', onPress: saveHarvest },
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

import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPS, materialValidator } from '../../../lib/integrity-guard';
import { estatesAPI, Estate } from '../../../lib/api';

export type ActivityType = 'PLANTING' | 'FERTILIZING' | 'SPRAYING' | 'HARVEST';

const ACTIVITY_TYPE_MAP: Record<ActivityType, string> = {
  PLANTING: 'Planting',
  FERTILIZING: 'Fertilizing',
  SPRAYING: 'Spraying',
  HARVEST: 'Harvest',
};

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'PLANTING', label: 'Planting' },
  { value: 'FERTILIZING', label: 'Fertilizing' },
  { value: 'SPRAYING', label: 'Spraying' },
  { value: 'HARVEST', label: 'Harvest' },
];

export function useFieldLogData() {
  const router = useRouter();
  const [activityType, setActivityType] = useState<ActivityType | ''>('');
  const [materialID, setMaterialID] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [materialValid, setMaterialValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      setEstates(Array.isArray(data) ? data : []);
      if (data.length > 0) setCurrentEstate(data[0]);
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    const [cameraStatus, locationStatus] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      Location.requestForegroundPermissionsAsync(),
    ]);
    if (cameraStatus.status !== 'granted' || locationStatus.status !== 'granted') {
      Alert.alert('Permissions', 'Camera and location permissions are required');
    }
  }, []);

  useEffect(() => {
    loadEstates();
    requestPermissions();
  }, [loadEstates, requestPermissions]);

  useFocusEffect(
    useCallback(() => {
      const check = async () => {
        try {
          const barcode = await AsyncStorage.getItem('last_scanned_barcode');
          if (barcode) {
            setMaterialID(barcode);
            await AsyncStorage.removeItem('last_scanned_barcode');
          }
        } catch {}
      };
      check();
    }, [])
  );

  const validateMaterial = useCallback(async () => {
    if (!materialID.trim()) {
      setMaterialValid(null);
      return;
    }
    try {
      let type: 'SEED' | 'FERTILIZER' | 'PESTICIDE' | undefined;
      const upper = materialID.trim().toUpperCase();
      if (activityType === 'PLANTING' || upper.startsWith('SEED')) type = 'SEED';
      else if (activityType === 'FERTILIZING') type = 'FERTILIZER';
      else if (activityType === 'SPRAYING') type = 'PESTICIDE';
      const result = await materialValidator(materialID, type);
      setMaterialValid(result.valid);
    } catch {
      setMaterialValid(false);
    }
  }, [materialID, activityType]);

  useEffect(() => {
    if (!materialID || materialID.trim().length < 3) {
      setMaterialValid(null);
      return;
    }
    const t = setTimeout(() => validateMaterial(), 500);
    return () => clearTimeout(t);
  }, [materialID, activityType, validateMaterial]);

  useEffect(() => {
    const check = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const gpsAlways = await AsyncStorage.getItem('settings_gps_always');
        if (gpsAlways === 'true' && !location) getCurrentLocation();
      } catch {}
    };
    check();
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission Required', 'Please enable location in settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]);
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(userLocation);
      if (currentEstate?.polygonCoordinates) {
        const isValid = verifyGPS(userLocation, {
          polygonCoordinates: currentEstate.polygonCoordinates as Array<{ lat: number; lng: number }>,
        });
        setGpsWarning(!isValid);
      }
    } catch (error: any) {
      Alert.alert('Location Error', error.message || 'Unable to get location.');
    } finally {
      setLoading(false);
    }
  }, [currentEstate]);

  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
    } catch {
      Alert.alert('Error', 'Unable to open camera');
    }
  }, []);

  const saveEntry = useCallback(async () => {
    try {
      setLoading(true);
      await offlineStorage.savePendingEntry({
        activityType: ACTIVITY_TYPE_MAP[activityType as ActivityType] as 'Planting' | 'Fertilizing' | 'Spraying' | 'Harvest',
        materialID: materialID || undefined,
        photoUri: photoUri!,
        location: location!,
      });
      Alert.alert('Success', 'Entry saved. Will be sent when online.');
      setActivityType('');
      setMaterialID('');
      setPhotoUri(null);
      setLocation(null);
      setGpsWarning(false);
      setMaterialValid(null);
    } catch (error) {
      Alert.alert('Error', 'Unable to save entry');
    } finally {
      setLoading(false);
    }
  }, [activityType, materialID, photoUri, location]);

  const handleSubmit = useCallback(async () => {
    if (!activityType) {
      Alert.alert('Error', 'Select activity type');
      return;
    }
    if (!photoUri) {
      Alert.alert('Error', 'Photo is required');
      return;
    }
    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }
    if (materialID && materialValid === false) {
      Alert.alert('Error', 'Material is not valid. Please check the barcode or seed code.');
      return;
    }
    if (gpsWarning) {
      Alert.alert('Warning', 'You are not on your parcel! Do you want to continue?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: saveEntry },
      ]);
      return;
    }
    await saveEntry();
  }, [activityType, photoUri, location, materialID, materialValid, gpsWarning, saveEntry]);

  return {
    router,
    activityType,
    setActivityType,
    materialID,
    setMaterialID,
    photoUri,
    location,
    gpsWarning,
    materialValid,
    loading,
    getCurrentLocation,
    takePhoto,
    handleSubmit,
  };
}

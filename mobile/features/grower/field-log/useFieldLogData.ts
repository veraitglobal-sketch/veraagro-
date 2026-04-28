import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPS, materialValidator } from '../../../lib/integrity-guard';
import { estatesAPI, Estate } from '../../../lib/api';
import type { PendingFieldEntry } from '../../../lib/offline-storage';

export type ActivityType = 'PLANTING' | 'FERTILIZING' | 'SPRAYING' | 'HARVEST';

/** Barcode validation path — user taps first so we don't infer wrong from vague typing. */
export type MaterialKindForLog = 'SEED' | 'FERTILIZER' | 'PESTICIDE';

/** Maps UI activity to offline storage (English; sync maps to backend enums). */
const ACTIVITY_TO_PENDING: Record<ActivityType, PendingFieldEntry['activityType']> = {
  PLANTING: 'Planting',
  FERTILIZING: 'Fertilizing',
  SPRAYING: 'Spraying',
  HARVEST: 'Harvest',
};

export const ACTIVITY_TYPES: { value: ActivityType }[] = [
  { value: 'PLANTING' },
  { value: 'FERTILIZING' },
  { value: 'SPRAYING' },
  { value: 'HARVEST' },
];

export function useFieldLogData() {
  const { t } = useTranslation();
  const router = useRouter();
  const [activityType, setActivityType] = useState<ActivityType | ''>('');
  const [materialID, setMaterialID] = useState('');
  const [materialKind, setMaterialKind] = useState<MaterialKindForLog>('SEED');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [materialValid, setMaterialValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      if (list.length > 0) setCurrentEstate(list[0]);
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
      Alert.alert(t('producer.fieldLogAlerts.permTitle'), t('producer.fieldLogAlerts.permBody'));
    }
  }, [t]);

  useEffect(() => {
    loadEstates();
    requestPermissions();
  }, [loadEstates, requestPermissions]);

  useEffect(() => {
    if (activityType === 'HARVEST') {
      setMaterialID('');
      setMaterialValid(null);
      return;
    }
    if (activityType === 'PLANTING') setMaterialKind('SEED');
    else if (activityType === 'FERTILIZING') setMaterialKind('FERTILIZER');
    else if (activityType === 'SPRAYING') setMaterialKind('PESTICIDE');
  }, [activityType]);

  const validateMaterial = useCallback(async () => {
    if (!materialID.trim()) {
      setMaterialValid(null);
      return;
    }
    if (activityType === 'HARVEST') {
      setMaterialValid(null);
      return;
    }
    try {
      const result = await materialValidator(materialID, materialKind);
      setMaterialValid(result.valid);
    } catch {
      setMaterialValid(false);
    }
  }, [materialID, activityType, materialKind]);

  useEffect(() => {
    if (!materialID || materialID.trim().length < 3) {
      setMaterialValid(null);
      return;
    }
    const t = setTimeout(() => validateMaterial(), 500);
    return () => clearTimeout(t);
  }, [materialID, activityType, validateMaterial]);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('producer.fieldLogAlerts.locSettingsTitle'), t('producer.fieldLogAlerts.locSettingsBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => Linking.openSettings() },
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
      Alert.alert(
        t('producer.fieldLogAlerts.locationError'),
        error.message || t('producer.fieldLogAlerts.locationErrorFallback'),
      );
    } finally {
      setLoading(false);
    }
  }, [currentEstate, t]);

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
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') return;
          const gpsAlways = await AsyncStorage.getItem('settings_gps_always');
          if (gpsAlways === 'true' && !locationRef.current) {
            await getCurrentLocation();
          }
        } catch {}
      };
      void check();
    }, [getCurrentLocation]),
  );

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
      Alert.alert(t('error'), t('producer.fieldLogAlerts.cameraError'));
    }
  }, [t]);

  const saveEntry = useCallback(async () => {
    try {
      setLoading(true);
      await offlineStorage.savePendingEntry({
        activityType: ACTIVITY_TO_PENDING[activityType as ActivityType],
        estateId: currentEstate?.id,
        materialID: materialID || undefined,
        photoUri: photoUri!,
        location: location!,
      });
      Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveOk'));
      setActivityType('');
      setMaterialID('');
      setMaterialKind('SEED');
      setPhotoUri(null);
      setLocation(null);
      setGpsWarning(false);
      setMaterialValid(null);
    } catch (error) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [activityType, materialID, photoUri, location, currentEstate?.id, t]);

  const handleSubmit = useCallback(async () => {
    if (!activityType) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.selectActivity'));
      return;
    }
    if (!photoUri) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.photoRequired'));
      return;
    }
    if (!location) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.locationRequired'));
      return;
    }
    if (activityType !== 'HARVEST' && materialID.trim() && materialValid === false) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.materialInvalid'));
      return;
    }
    if (gpsWarning) {
      Alert.alert(t('producer.fieldLogAlerts.gpsOffParcelTitle'), t('producer.fieldLogAlerts.gpsOffParcelBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.continue'), onPress: saveEntry },
      ]);
      return;
    }
    await saveEntry();
  }, [activityType, photoUri, location, materialID, materialValid, gpsWarning, saveEntry, t]);

  return {
    router,
    activityType,
    setActivityType,
    materialID,
    setMaterialID,
    materialKind,
    setMaterialKind,
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

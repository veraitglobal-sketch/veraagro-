import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPSAgainstEstateOrParcels, materialValidator } from '../../../lib/integrity-guard';
import { estatesAPI, Estate, parcelsAPI, Parcel, harvestAnnouncementsAPI } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import { isDeviceOnline } from '../../../lib/network-utils';
import { syncService } from '../../../lib/sync-service';
import type { PendingFieldEntry, FieldLogMaterialKind } from '../../../lib/offline-storage';

/** Match server default (see `planting-progress.util` / PLANTING_PROGRESS_NOTES_MIN_LEN). */
export const PLANTING_NOTES_MIN = 15;

function growthStagePersistedFromForm(preset: string, custom: string): string | undefined {
  if (preset === '__custom__') return custom.trim() || undefined;
  return preset.trim() || undefined;
}

export type ActivityType = 'PLANTING' | 'FERTILIZING' | 'SPRAYING' | 'HARVEST';

/** Barcode validation path — user taps first so we don't infer wrong from vague typing. */
export type MaterialKindForLog = FieldLogMaterialKind;

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
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsWarning, setGpsWarning] = useState(false);
  const [materialValid, setMaterialValid] = useState<boolean | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [referenceRefreshing, setReferenceRefreshing] = useState(false);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [currentEstate, setCurrentEstate] = useState<Estate | null>(null);
  const [parcelsForGps, setParcelsForGps] = useState<Parcel[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [selectedHarvestPlanId, setSelectedHarvestPlanId] = useState('');
  const [parcelPlans, setParcelPlans] = useState<
    { id: string; label: string; announcementType: string }[]
  >([]);
  const [growthStagePreset, setGrowthStagePreset] = useState('');
  const [growthStageCustom, setGrowthStageCustom] = useState('');
  const [journalNotes, setJournalNotes] = useState('');

  const locationRef = useRef<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const currentEstateRef = useRef<Estate | null>(null);
  useEffect(() => {
    currentEstateRef.current = currentEstate;
  }, [currentEstate]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      setCurrentEstate((prev) => {
        if (list.length === 0) return null;
        if (prev) {
          const n = list.find((e) => e.id === prev.id);
          if (n) return n;
        }
        return list[0];
      });
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
      setCurrentEstate(null);
    }
  }, []);

  useEffect(() => {
    const id = currentEstate?.id;
    if (!id) {
      setParcelsForGps([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const list = await parcelsAPI.getByEstate(id);
        if (!cancelled) setParcelsForGps(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setParcelsForGps([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentEstate?.id]);

  const approvedParcels = useMemo(
    () => parcelsForGps.filter((p) => p.approvedAt),
    [parcelsForGps],
  );

  const loadParcelPlans = useCallback(async () => {
    if (!selectedParcelId) {
      setParcelPlans([]);
      setSelectedHarvestPlanId('');
      return;
    }
    setPlansLoading(true);
    try {
      const raw = await harvestAnnouncementsAPI.getMy();
      const arr = Array.isArray(raw) ? raw : [];
      const forParcel = arr.filter(
        (a: { parcelId: string; status: string }) =>
          a.parcelId === selectedParcelId && a.status !== 'CANCELLED',
      );
      const options = forParcel.map(
        (a: { id: string; announcementType: string; cropType: string; estimatedDate: string }) => {
          const kind =
            a.announcementType === 'PLANTING'
              ? t('producer.growthJournal.planKindPlanting')
              : t('producer.growthJournal.planKindHarvest');
          const dateStr = a.estimatedDate ? String(a.estimatedDate).slice(0, 10) : '—';
          return {
            id: a.id,
            announcementType: a.announcementType,
            label: `${kind} · ${a.cropType} · ${dateStr}`,
          };
        },
      );
      setParcelPlans(options);
      setSelectedHarvestPlanId((prev) => {
        if (options.length === 0) return '';
        return options.some((o) => o.id === prev) ? prev : options[0].id;
      });
    } catch {
      setParcelPlans([]);
      setSelectedHarvestPlanId('');
    } finally {
      setPlansLoading(false);
    }
  }, [selectedParcelId, t]);

  useEffect(() => {
    void loadParcelPlans();
  }, [loadParcelPlans]);

  const selectedHarvestPlan = useMemo(
    () => parcelPlans.find((p) => p.id === selectedHarvestPlanId),
    [parcelPlans, selectedHarvestPlanId],
  );

  useEffect(() => {
    setSelectedParcelId('');
  }, [currentEstate?.id]);

  useEffect(() => {
    setGrowthStagePreset('');
    setGrowthStageCustom('');
    setJournalNotes('');
  }, [selectedParcelId]);

  /** Držati upozorenje u skladu sa poslednjom lokacijom i poligonima (ne samo preko ref‑a bez zavisnosti). */
  useEffect(() => {
    if (!location) {
      setGpsWarning(false);
      return;
    }
    const isValid = verifyGPSAgainstEstateOrParcels(location, currentEstate?.polygonCoordinates, [
      ...parcelsForGps.map((p) => p.polygonCoordinates),
    ]);
    setGpsWarning(!isValid);
  }, [
    location,
    currentEstate?.polygonCoordinates,
    parcelsForGps,
    currentEstate?.id,
  ]);

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

  const refreshReferenceData = useCallback(async () => {
    setReferenceRefreshing(true);
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      const prevId = currentEstateRef.current?.id;
      const next =
        list.length === 0 ? null : prevId ? (list.find((e) => e.id === prevId) ?? list[0]) : list[0];
      setCurrentEstate(next);
      if (next?.id) {
        try {
          const pl = await parcelsAPI.getByEstate(next.id);
          setParcelsForGps(Array.isArray(pl) ? pl : []);
        } catch {
          setParcelsForGps([]);
        }
      } else {
        setParcelsForGps([]);
      }
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
      setParcelsForGps([]);
    } finally {
      setReferenceRefreshing(false);
    }
  }, []);

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
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('producer.fieldLogAlerts.locSettingsTitle'), t('producer.fieldLogAlerts.locSettingsBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => Linking.openSettings() },
        ]);
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const acc =
        loc.coords.accuracy != null && Number.isFinite(loc.coords.accuracy) ? loc.coords.accuracy : undefined;
      const userLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: acc };
      setLocation(userLocation);
    } catch (error: unknown) {
      Alert.alert(
        t('producer.fieldLogAlerts.locationError'),
        apiErrorMessage(error, t('producer.fieldLogAlerts.locationErrorFallback')),
      );
    } finally {
      setGpsLoading(false);
    }
  }, [t]);

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

  const selectEstateById = useCallback(
    (estateId: string) => {
      const next = estates.find((e) => e.id === estateId);
      if (next) setCurrentEstate(next);
    },
    [estates],
  );

  const pickPhotoFromLibrary = useCallback(async () => {
    try {
      const library = await ImagePicker.getMediaLibraryPermissionsAsync();
      let status = library.status;
      if (status !== 'granted') {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') {
        Alert.alert(t('producer.fieldLogAlerts.galleryPermTitle'), t('producer.fieldLogAlerts.galleryPermBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.72,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e: unknown) {
      console.warn('launchImageLibrary field log:', e);
      Alert.alert(t('error'), t('producer.fieldLogAlerts.galleryError'));
    }
  }, [t]);

  const takePhoto = useCallback(async () => {
    try {
      let status = (await ImagePicker.getCameraPermissionsAsync()).status;
      if (status !== 'granted') {
        ({ status } = await ImagePicker.requestCameraPermissionsAsync());
      }
      if (status !== 'granted') {
        Alert.alert(t('producer.fieldLogAlerts.camPermTitle'), t('producer.fieldLogAlerts.camPermBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('producer.fieldLogAlerts.openSettings'),
            onPress: () => void Linking.openSettings(),
          },
          {
            text: t('producer.fieldLogAlerts.pickFromGallery'),
            onPress: () => void pickPhotoFromLibrary(),
          },
        ]);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.72,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        return;
      }
    } catch (e: unknown) {
      console.warn('launchCameraAsync field log:', e);
      Alert.alert(t('producer.fieldLogAlerts.camFailedTitle'), t('producer.fieldLogAlerts.camFailedBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.fieldLogAlerts.pickFromGallery'),
          onPress: () => void pickPhotoFromLibrary(),
        },
      ]);
    }
  }, [pickPhotoFromLibrary, t]);

  const saveEntry = useCallback(async () => {
    try {
      setSaveBusy(true);
      const plan = selectedHarvestPlan;
      const growthStageSaved =
        plan?.announcementType === 'PLANTING'
          ? growthStagePersistedFromForm(growthStagePreset, growthStageCustom)
          : undefined;

      const entryId = await offlineStorage.savePendingEntry({
        activityType: ACTIVITY_TO_PENDING[activityType as ActivityType],
        estateId: currentEstate?.id,
        parcelId: selectedParcelId,
        harvestAnnouncementId: selectedHarvestPlanId,
        planAnnouncementType: plan?.announcementType,
        journalNotes: journalNotes.trim() || undefined,
        growthStage: growthStageSaved,
        materialKind: activityType !== 'HARVEST' ? materialKind : undefined,
        materialID: materialID || undefined,
        photoUri: photoUri!,
        location: location!,
      });

      const online = await isDeviceOnline();
      if (!online) {
        Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveQueuedWhenOnline'));
      } else {
        try {
          await syncService.syncPendingEntries();
        } catch {
          /* errors recorded per entry inside sync */
        }
        const list = await offlineStorage.getPendingEntries();
        const mine = list.find((e) => e.id === entryId);
        if (!mine) {
          Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveSentNow'));
        } else if (mine.status === 'error' && mine.error) {
          Alert.alert(t('producer.fieldLogAlerts.saveSyncFailedTitle'), mine.error);
        } else if (mine.status === 'pending') {
          Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveWillRetry'));
        } else {
          Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveOk'));
        }
      }

      setActivityType('');
      setMaterialID('');
      setMaterialKind('SEED');
      setPhotoUri(null);
      setLocation(null);
      setGpsWarning(false);
      setMaterialValid(null);
      setGrowthStagePreset('');
      setGrowthStageCustom('');
      setJournalNotes('');
    } catch (error) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.saveFailed'));
    } finally {
      setSaveBusy(false);
    }
  }, [
    activityType,
    materialID,
    materialKind,
    photoUri,
    location,
    currentEstate?.id,
    selectedParcelId,
    selectedHarvestPlanId,
    selectedHarvestPlan,
    growthStagePreset,
    growthStageCustom,
    journalNotes,
    t,
  ]);

  const handleSubmit = useCallback(async () => {
    if (!currentEstate?.id) {
      Alert.alert(t('producer.growthJournalAlerts.estateTitle'), t('producer.growthJournalAlerts.estateBody'));
      return;
    }
    if (!selectedParcelId) {
      Alert.alert(t('producer.growthJournalAlerts.parcelTitle'), t('producer.growthJournalAlerts.parcelBody'));
      return;
    }
    if (plansLoading) {
      return;
    }
    if (!selectedHarvestPlanId) {
      Alert.alert(t('producer.growthJournalAlerts.planTitle'), t('producer.growthJournalAlerts.planBody'));
      return;
    }
    const plan = parcelPlans.find((p) => p.id === selectedHarvestPlanId);
    if (plan?.announcementType === 'PLANTING') {
      const jn = journalNotes.trim();
      if (jn.length < PLANTING_NOTES_MIN) {
        Alert.alert(
          t('producer.growthJournalAlerts.validationTitle'),
          t('producer.growthJournalAlerts.plantingNotesTooShort', { min: PLANTING_NOTES_MIN }),
        );
        return;
      }
      const st = growthStagePersistedFromForm(growthStagePreset, growthStageCustom);
      if (!st) {
        Alert.alert(
          t('producer.growthJournalAlerts.validationTitle'),
          t('producer.growthJournalAlerts.plantingStageRequired'),
        );
        return;
      }
    }
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
  }, [
    currentEstate?.id,
    selectedParcelId,
    selectedHarvestPlanId,
    plansLoading,
    parcelPlans,
    journalNotes,
    growthStagePreset,
    growthStageCustom,
    activityType,
    photoUri,
    location,
    materialID,
    materialValid,
    gpsWarning,
    saveEntry,
    t,
  ]);

  return {
    router,
    estates,
    currentEstate,
    selectEstateById,
    approvedParcels,
    selectedParcelId,
    setSelectedParcelId,
    parcelPlans,
    selectedHarvestPlanId,
    setSelectedHarvestPlanId,
    selectedHarvestPlan,
    plansLoading,
    growthStagePreset,
    setGrowthStagePreset,
    growthStageCustom,
    setGrowthStageCustom,
    journalNotes,
    setJournalNotes,
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
    gpsLoading,
    saveBusy,
    getCurrentLocation,
    takePhoto,
    pickPhotoFromLibrary,
    handleSubmit,
    referenceRefreshing,
    refreshReferenceData,
  };
}

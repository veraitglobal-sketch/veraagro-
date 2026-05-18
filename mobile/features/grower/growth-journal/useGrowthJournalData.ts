import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  growthLogsAPI,
  GrowthLog,
  estatesAPI,
  Estate,
  harvestAnnouncementsAPI,
  parcelsAPI,
  Parcel,
} from '../../../lib/api';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import { getOrCreateDeviceId } from '../../../lib/device-id';
import { sha256HexFromImageUri } from '../../../lib/image-hash';
import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from '../../../lib/image-data-url';
import { apiErrorMessage } from '../../../lib/api-error';

const MAX_GROWTH_PHOTO_BYTES = 8 * 1024 * 1024;
/** Match server default PLANTING_PROGRESS_NOTES_MIN_LEN */
const PLANTING_NOTES_MIN = 15;

const MODAL_TO_CAMERA_DELAY_MS = 480;

type PendingGrowthSubmission = {
  filterEstate: string;
  filterParcel: string;
  activePlanId: string;
  payload: { notes: string; growthStage: string | undefined };
};

export function useGrowthJournalData() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [estates, setEstates] = useState<Estate[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filterEstate, setFilterEstate] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');
  const [parcelPlans, setParcelPlans] = useState<{ id: string; label: string; announcementType: string }[]>([]);
  const [activePlanId, setActivePlanId] = useState('');
  const [plansLoading, setPlansLoading] = useState(false);

  const pendingSubmissionRef = useRef<PendingGrowthSubmission | null>(null);
  const deferredCameraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (deferredCameraTimerRef.current) clearTimeout(deferredCameraTimerRef.current);
    },
    [],
  );

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
    setLogsLoading(true);
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
    } finally {
      setLogsLoading(false);
    }
  }, [filterEstate, filterParcel]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (filterEstate !== 'all' && filterEstate) {
      void loadLogs();
    } else {
      setLogs([]);
    }
  }, [filterEstate, filterParcel, loadLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadLogs()]);
    setRefreshing(false);
  }, [loadData, loadLogs]);

  const selectedEstate = useMemo(() => estates.find((e) => e.id === filterEstate), [estates, filterEstate]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(false);

  /** Same pattern as field log: `/parcels/estate/:id` so the list works even without nested parcels on `GET /estates`. */
  useEffect(() => {
    if (filterEstate === 'all' || !filterEstate) {
      setParcels([]);
      setParcelsLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setParcelsLoading(true);
      try {
        const fetched = await parcelsAPI.getByEstate(filterEstate);
        const fromApi = Array.isArray(fetched) ? fetched.filter((p) => p.approvedAt) : [];
        const fromNest = (selectedEstate?.parcels || []).filter((p) => p.approvedAt);
        const merged = new Map<string, Parcel>();
        for (const p of [...fromApi, ...fromNest]) merged.set(p.id, p);
        if (!cancelled) setParcels([...merged.values()]);
      } catch {
        const fromNest = (selectedEstate?.parcels || []).filter((p) => p.approvedAt);
        if (!cancelled) setParcels(fromNest);
      } finally {
        if (!cancelled) setParcelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterEstate, selectedEstate]);

  const loadPlans = useCallback(async () => {
    if (filterParcel === 'all' || !filterParcel) {
      setParcelPlans([]);
      setActivePlanId('');
      return;
    }
    setPlansLoading(true);
    try {
      const raw = await harvestAnnouncementsAPI.getMy();
      const arr = Array.isArray(raw) ? raw : [];
      const forParcel = arr.filter(
        (
          a: {
            parcelId?: string | null;
            status: string;
            parcel?: { id?: string | null } | null;
          },
        ) =>
          normalizeHarvestParcelId(a.parcelId, a.parcel ?? null) === filterParcel &&
          a.status !== 'CANCELLED',
      );
      const options = forParcel.map((a: { id: string; announcementType: string; cropType: string; estimatedDate: string }) => {
        const kind = a.announcementType === 'PLANTING' ? t('producer.growthJournal.planKindPlanting') : t('producer.growthJournal.planKindHarvest');
        const dateStr = a.estimatedDate ? String(a.estimatedDate).slice(0, 10) : '—';
        return {
          id: a.id,
          announcementType: a.announcementType,
          label: `${kind} · ${a.cropType} · ${dateStr}`,
        };
      });
      setParcelPlans(options);
      setActivePlanId((prev) => {
        if (options.length === 0) return '';
        return options.some((o) => o.id === prev) ? prev : options[0].id;
      });
    } catch {
      setParcelPlans([]);
      setActivePlanId('');
    } finally {
      setPlansLoading(false);
    }
  }, [filterParcel, t]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const pickGrowthPhotoFromLibrary = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    try {
      const library = await ImagePicker.getMediaLibraryPermissionsAsync();
      let st = library.status;
      if (st !== 'granted') {
        const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
        st = req.status;
      }
      if (st !== 'granted') {
        Alert.alert(t('producer.fieldLogAlerts.galleryPermTitle'), t('producer.fieldLogAlerts.galleryPermBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.72,
      });
      if (result.canceled || !result.assets[0]?.uri) return null;
      return result.assets[0];
    } catch (e: unknown) {
      console.warn('growth journal gallery:', e);
      Alert.alert(t('error'), t('producer.fieldLogAlerts.galleryError'));
      return null;
    }
  }, [t]);

  const resolveGrowthJournalPhotoAsset = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    let camSt = (await ImagePicker.getCameraPermissionsAsync()).status;
    if (camSt !== 'granted') {
      ({ status: camSt } = await ImagePicker.requestCameraPermissionsAsync());
    }

    if (camSt === 'granted') {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.72,
        });
        if (!result.canceled && result.assets[0]?.uri) {
          return result.assets[0];
        }
      } catch (e: unknown) {
        console.warn('Growth journal camera:', e);
      }
    }

    return await new Promise<ImagePicker.ImagePickerAsset | null>((resolve) => {
      Alert.alert(t('producer.growthJournalAlerts.needPhotoTitle'), t('producer.growthJournalAlerts.needPhotoBody'), [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
        {
          text: t('producer.fieldLogAlerts.openSettings'),
          onPress: () => {
            void Linking.openSettings();
            resolve(null);
          },
        },
        {
          text: t('producer.fieldLogAlerts.pickFromGallery'),
          onPress: () => {
            void pickGrowthPhotoFromLibrary().then((asset) => resolve(asset));
          },
        },
      ]);
    });
  }, [pickGrowthPhotoFromLibrary, t]);

  const completeGrowthLogAfterModalClose = useCallback(async () => {
    const pending = pendingSubmissionRef.current;
    pendingSubmissionRef.current = null;
    if (!pending) return;

    setUploading(true);
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert(t('producer.growthJournalAlerts.permTitle'), t('producer.growthJournalAlerts.permBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('producer.fieldLogAlerts.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
        return;
      }

      let location: { lat: number; lng: number };
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      } catch {
        Alert.alert(t('producer.growthJournalAlerts.gpsErrorTitle'), t('producer.growthJournalAlerts.gpsErrorBody'));
        return;
      }

      const asset = await resolveGrowthJournalPhotoAsset();
      if (!asset) return;

      const imageDataUrl = await imageUriToJpegDataUrl(asset.uri);
      try {
        assertDataUrlWithinSize(imageDataUrl, MAX_GROWTH_PHOTO_BYTES);
      } catch {
        Alert.alert(t('error'), t('producer.growthJournalAlerts.photoLarge'));
        return;
      }

      const imageHash = await sha256HexFromImageUri(asset.uri);
      const deviceId = await getOrCreateDeviceId();
      const deviceTimestamp = new Date().toISOString();
      await growthLogsAPI.create({
        estateId: pending.filterEstate,
        parcelId: pending.filterParcel,
        harvestAnnouncementId: pending.activePlanId,
        imageUrl: imageDataUrl,
        imageHash,
        gpsLatitude: location.lat,
        gpsLongitude: location.lng,
        deviceId,
        deviceTimestamp,
        notes: pending.payload.notes.trim() || undefined,
        growthStage: pending.payload.growthStage,
      });
      await loadLogs();
      Alert.alert(t('producer.growthJournalAlerts.savedTitle'), t('producer.growthJournalAlerts.savedBody'));
    } catch (e: unknown) {
      const msg = apiErrorMessage(e, t('producer.growthJournalAlerts.saveFailed'));
      Alert.alert(t('error'), msg);
      console.error('Growth log submit:', e);
    } finally {
      setUploading(false);
    }
  }, [resolveGrowthJournalPhotoAsset, loadLogs, t]);

  const submitAddLog = useCallback(
    async (payload: { notes: string; growthStage: string | undefined }) => {
      if (uploading) return;
      if (estates.length === 0) {
        Alert.alert(t('producer.growthJournalAlerts.estateTitle'), t('producer.growthJournalAlerts.estateBody'));
        return;
      }
      if (filterEstate === 'all' || !filterEstate) {
        Alert.alert(t('producer.growthJournalAlerts.estateTitle'), t('producer.growthJournalAlerts.estateBody'));
        return;
      }
      if (filterParcel === 'all' || !filterParcel) {
        Alert.alert(t('producer.growthJournalAlerts.parcelTitle'), t('producer.growthJournalAlerts.parcelBody'));
        return;
      }
      if (!activePlanId) {
        Alert.alert(t('producer.growthJournalAlerts.planTitle'), t('producer.growthJournalAlerts.planBody'));
        return;
      }

      const selectedPlan = parcelPlans.find((p) => p.id === activePlanId);
      if (selectedPlan?.announcementType === 'PLANTING') {
        if (payload.notes.trim().length < PLANTING_NOTES_MIN) {
          Alert.alert(
            t('producer.growthJournalAlerts.validationTitle'),
            t('producer.growthJournalAlerts.plantingNotesTooShort', { min: PLANTING_NOTES_MIN }),
          );
          return;
        }
        if (!payload.growthStage?.trim()) {
          Alert.alert(
            t('producer.growthJournalAlerts.validationTitle'),
            t('producer.growthJournalAlerts.plantingStageRequired'),
          );
          return;
        }
      }

      pendingSubmissionRef.current = {
        filterEstate,
        filterParcel,
        activePlanId,
        payload,
      };
      setAddModalVisible(false);
      if (deferredCameraTimerRef.current) clearTimeout(deferredCameraTimerRef.current);
      deferredCameraTimerRef.current = setTimeout(() => {
        deferredCameraTimerRef.current = null;
        void completeGrowthLogAfterModalClose();
      }, MODAL_TO_CAMERA_DELAY_MS);
    },
    [
      uploading,
      estates.length,
      filterEstate,
      filterParcel,
      activePlanId,
      parcelPlans,
      t,
      completeGrowthLogAfterModalClose,
    ],
  );

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const canAddLog =
    filterEstate !== 'all' &&
    filterParcel !== 'all' &&
    Boolean(activePlanId) &&
    !plansLoading &&
    !parcelsLoading;

  return {
    estates,
    logs: sortedLogs,
    loading,
    logsLoading,
    refreshing,
    uploading,
    addModalVisible,
    setAddModalVisible,
    filterEstate,
    filterParcel,
    setFilterEstate,
    setFilterParcel,
    parcels,
    parcelsLoading,
    parcelPlans,
    activePlanId,
    setActivePlanId,
    plansLoading,
    canAddLog,
    onRefresh,
    submitAddLog,
    selectedEstate,
  };
}

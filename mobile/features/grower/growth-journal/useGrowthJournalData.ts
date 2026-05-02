import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import {
  growthLogsAPI,
  GrowthLog,
  estatesAPI,
  Estate,
  harvestAnnouncementsAPI,
} from '../../../lib/api';
import { getOrCreateDeviceId } from '../../../lib/device-id';
import { sha256HexFromImageUri } from '../../../lib/image-hash';
import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from '../../../lib/image-data-url';
import { apiErrorMessage } from '../../../lib/api-error';

const MAX_GROWTH_PHOTO_BYTES = 8 * 1024 * 1024;
/** Match server default PLANTING_PROGRESS_NOTES_MIN_LEN */
const PLANTING_NOTES_MIN = 15;

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
  const parcels = useMemo(
    () => (selectedEstate?.parcels || []).filter((p) => p.approvedAt),
    [selectedEstate],
  );

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
        (a: { parcelId: string; status: string }) =>
          a.parcelId === filterParcel && a.status !== 'CANCELLED',
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

  const submitAddLog = useCallback(
    async (payload: { notes: string; growthStage: string | undefined }) => {
      if (estates.length === 0) return;
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

      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

      if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
        Alert.alert(t('producer.growthJournalAlerts.permTitle'), t('producer.growthJournalAlerts.permBody'));
        return;
      }

      let location: { lat: number; lng: number } | null = null;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      } catch {
        Alert.alert(t('producer.growthJournalAlerts.gpsErrorTitle'), t('producer.growthJournalAlerts.gpsErrorBody'));
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
          estateId: filterEstate,
          parcelId: filterParcel,
          harvestAnnouncementId: activePlanId,
          imageUrl: imageDataUrl,
          imageHash,
          gpsLatitude: location.lat,
          gpsLongitude: location.lng,
          deviceId,
          deviceTimestamp,
          notes: payload.notes.trim() || undefined,
          growthStage: payload.growthStage,
        });
        setAddModalVisible(false);
        await loadLogs();
        Alert.alert(t('producer.growthJournalAlerts.savedTitle'), t('producer.growthJournalAlerts.savedBody'));
      } catch (e: unknown) {
        const msg = apiErrorMessage(e, t('producer.growthJournalAlerts.saveFailed'));
        Alert.alert(t('error'), msg);
        console.error('Growth log submit:', e);
      } finally {
        setUploading(false);
      }
    },
    [estates.length, filterEstate, filterParcel, activePlanId, parcelPlans, loadLogs, t],
  );

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const canAddLog =
    filterEstate !== 'all' &&
    filterParcel !== 'all' &&
    Boolean(activePlanId) &&
    !plansLoading;

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

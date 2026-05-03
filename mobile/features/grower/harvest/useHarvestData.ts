import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  estatesAPI,
  harvestAnnouncementsAPI,
  parcelsAPI,
  type CreateHarvestPlanBody,
} from '../../../lib/api';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { apiErrorMessage, isLikelyNetworkError, axiosResponseStatus } from '../../../lib/api-error';
import { parcelEligibleForHarvestPlan } from '../../../lib/parcel-eligible-for-harvest-plan';

export type HarvestPlanMode = 'PLANTING' | 'HARVEST';

export const CROP_TYPES = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

type ParcelOption = { id: string; label: string };

export type PlantingPickRow = {
  id: string;
  parcelId: string;
  cropType: string;
  estimatedDate: string;
};

async function fetchPlantingRows(): Promise<PlantingPickRow[]> {
  const pending = await offlineStorage.getPendingHarvestPlans();
  const local: PlantingPickRow[] = pending
    .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'PLANTING')
    .map((h) => ({
      id: `local:${h.id}`,
      parcelId: h.payload.parcelId,
      cropType: h.payload.cropType,
      estimatedDate: h.payload.estimatedDate,
    }));
  let server: PlantingPickRow[] = [];
  try {
    const list = (await harvestAnnouncementsAPI.getMy()) as Array<{
      id: string;
      parcelId: string;
      announcementType?: string;
      cropType: string;
      estimatedDate: string;
    }>;
    if (Array.isArray(list)) {
      server = list
        .filter((r) => String(r.announcementType ?? '').toUpperCase() === 'PLANTING')
        .map((r) => ({
          id: r.id,
          parcelId: r.parcelId,
          cropType: r.cropType,
          estimatedDate: r.estimatedDate,
        }));
    }
  } catch {
    // offline: locals only
  }
  return [...local, ...server];
}

export function useHarvestData() {
  const { t } = useTranslation();
  const [approvedParcels, setApprovedParcels] = useState<ParcelOption[]>([]);
  const [plantingAnnouncements, setPlantingAnnouncements] = useState<PlantingPickRow[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);
  const [parcelsRefreshing, setParcelsRefreshing] = useState(false);
  const [parcelId, setParcelId] = useState('');
  const [selectedPlantingId, setSelectedPlantingId] = useState<string | null>(null);

  const [cropType, setCropType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plannedLoadDate, setPlannedLoadDate] = useState('');
  const [loadQuantity, setLoadQuantity] = useState('');
  const [marketChannel, setMarketChannel] = useState<'INDUSTRIAL' | 'RETAIL' | 'MIXED' | ''>('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [sortingSpec, setSortingSpec] = useState('');
  const [growerNotes, setGrowerNotes] = useState('');

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [planMode, setPlanMode] = useState<HarvestPlanMode>('HARVEST');

  const plantingsForParcel = useMemo(
    () => plantingAnnouncements.filter((a) => a.parcelId === parcelId),
    [plantingAnnouncements, parcelId],
  );

  const loadApprovedParcels = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setParcelsRefreshing(true);
    else setParcelsLoading(true);
    try {
      let estates: Awaited<ReturnType<typeof estatesAPI.getAll>> = [];
      try {
        const raw = await estatesAPI.getAll();
        estates = Array.isArray(raw) ? raw : [];
        await growerOfflineCache.saveEstates(estates);
      } catch {
        estates = (await growerOfflineCache.loadEstates()) ?? [];
      }
      const out: ParcelOption[] = [];
      for (const e of estates) {
        let ps: Awaited<ReturnType<typeof parcelsAPI.getByEstate>> = [];
        try {
          ps = await parcelsAPI.getByEstate(e.id);
          await growerOfflineCache.saveParcels(e.id, ps);
        } catch {
          ps = (await growerOfflineCache.loadParcels(e.id)) ?? [];
        }
        for (const p of ps || []) {
          if (parcelEligibleForHarvestPlan(p)) {
            out.push({ id: p.id, label: `${e.name} — ${p.cropType || 'Parcel'}` });
          }
        }
      }

      let plantRows: PlantingPickRow[] = [];
      try {
        plantRows = await fetchPlantingRows();
      } catch {
        plantRows = [];
      }

      setApprovedParcels(out);
      setPlantingAnnouncements(plantRows);
      setParcelId((prev) => {
        if (out.some((p) => p.id === prev)) return prev;
        if (out.length === 1) return out[0].id;
        return '';
      });
    } catch (e) {
      console.error(e);
      setApprovedParcels([]);
      setPlantingAnnouncements([]);
    } finally {
      if (silent) setParcelsRefreshing(false);
      else setParcelsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApprovedParcels();
  }, [loadApprovedParcels]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') Alert.alert(t('producer.estates.permissionsTitle'), t('producer.estates.locationPermissionRequired'));
    });
  }, [t]);

  useEffect(() => {
    if (planMode !== 'HARVEST') {
      setSelectedPlantingId(null);
      return;
    }
    if (!parcelId) {
      setSelectedPlantingId(null);
      return;
    }
    const list = plantingsForParcel;
    if (list.length === 1) {
      setSelectedPlantingId(list[0].id);
      return;
    }
    setSelectedPlantingId((prev) => (prev && list.some((p) => p.id === prev) ? prev : null));
  }, [planMode, parcelId, plantingsForParcel]);

  useEffect(() => {
    if (planMode !== 'HARVEST' || !selectedPlantingId) return;
    const row = plantingAnnouncements.find((p) => p.id === selectedPlantingId);
    if (row?.cropType) setCropType(row.cropType);
    if (row?.estimatedDate) {
      const d = new Date(row.estimatedDate);
      if (!Number.isNaN(d.getTime())) setHarvestDate(d.toISOString().slice(0, 10));
    }
  }, [planMode, selectedPlantingId, plantingAnnouncements]);

  const refreshParcels = useCallback(() => {
    void loadApprovedParcels({ silent: true });
  }, [loadApprovedParcels]);

  /** GPS optional for harvest *plan*. */
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (_error) {
      Alert.alert(t('error'), t('producer.harvest.locationFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSubmit = useCallback(async () => {
    if (!parcelId) {
      Alert.alert(t('error'), t('producer.harvest.selectParcel'));
      return;
    }

    if (planMode === 'HARVEST') {
      if (plantingsForParcel.length === 0) {
        Alert.alert(t('error'), t('producer.harvest.noPlantingsForParcel'));
        return;
      }
      if (!selectedPlantingId || !plantingsForParcel.some((p) => p.id === selectedPlantingId)) {
        Alert.alert(t('error'), t('producer.harvest.selectPlanting'));
        return;
      }
    }

    if (!cropType.trim()) {
      Alert.alert(t('error'), t('producer.harvest.enterCropType'));
      return;
    }
    if (!estimatedQuantity || parseFloat(estimatedQuantity) <= 0) {
      Alert.alert(t('error'), t('producer.harvest.enterQuantity'));
      return;
    }

    const buildNotes = () => {
      const parts: string[] = [];
      if (growerNotes.trim()) parts.push(growerNotes.trim());
      if (location) parts.push(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      return parts.length ? parts.join(' | ') : undefined;
    };

    const estQty = parseFloat(estimatedQuantity);
    const loadKg = loadQuantity.trim() ? parseFloat(loadQuantity) : estQty;

    const estimatedDateIso = `${harvestDate}T12:00:00.000Z`;

    let plannedLoadingStart: string | undefined;
    let plannedLoadingEnd: string | undefined;
    if (plannedLoadDate.trim()) {
      plannedLoadingStart = `${plannedLoadDate}T05:00:00.000Z`;
      plannedLoadingEnd = `${plannedLoadDate}T19:00:00.000Z`;
    }

    const resetAfterSuccess = () => {
      setSelectedPlantingId(null);
      setCropType('');
      setEstimatedQuantity('');
      setLoadQuantity('');
      setPlannedLoadDate('');
      setMarketChannel('');
      setQualityGrade('');
      setSortingSpec('');
      setGrowerNotes('');
      setLocation(null);
    };

    const run = async () => {
      const payload: CreateHarvestPlanBody = {
        parcelId,
        announcementType: planMode,
        cropType: cropType.trim(),
        estimatedDate: estimatedDateIso,
        estimatedQuantity: estQty,
        plannedLoadingStart,
        plannedLoadingEnd,
        loadQuantityKg: !Number.isNaN(loadKg) && loadKg > 0 ? loadKg : estQty,
        marketChannel: marketChannel || undefined,
        qualityGrade: qualityGrade.trim() || undefined,
        sortingSpec: sortingSpec.trim() || undefined,
        notes: buildNotes(),
      };
      try {
        setLoading(true);
        if (!(await isDeviceOnline())) {
          await offlineStorage.savePendingHarvestPlan({ payload });
          void syncService.getSyncStatus();
          Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
          resetAfterSuccess();
          return;
        }
        await harvestAnnouncementsAPI.create(payload);
        Alert.alert(t('alerts.success'), t('producer.harvest.planSent'));
        resetAfterSuccess();
        void loadApprovedParcels({ silent: true });
      } catch (e: unknown) {
        if (isLikelyNetworkError(e)) {
          try {
            await offlineStorage.savePendingHarvestPlan({ payload });
            void syncService.getSyncStatus();
            Alert.alert(t('alerts.success'), t('producer.harvest.queuedOffline'));
            resetAfterSuccess();
            return;
          } catch {
            // fall through
          }
        }
        const raw = apiErrorMessage(e, t('producer.harvest.saveFailed'));
        const st = axiosResponseStatus(e);
        const looksInternal =
          st === 500 ||
          st === 502 ||
          st === 503 ||
          /internal\s*server\s*error/i.test(raw);
        const msg = looksInternal ? t('producer.harvest.serverError') : raw;
        Alert.alert(t('error'), msg);
      } finally {
        setLoading(false);
      }
    };

    await run();
  }, [
    parcelId,
    planMode,
    plantingsForParcel,
    selectedPlantingId,
    cropType,
    estimatedQuantity,
    harvestDate,
    plannedLoadDate,
    loadQuantity,
    marketChannel,
    qualityGrade,
    sortingSpec,
    growerNotes,
    location,
    t,
    loadApprovedParcels,
  ]);

  const harvestDetailsReady =
    planMode === 'PLANTING'
      ? !!(parcelId && cropType.trim())
      : !!(parcelId && selectedPlantingId && plantingsForParcel.some((p) => p.id === selectedPlantingId));

  const canSubmit =
    !parcelsLoading && parcelId && harvestDetailsReady && cropType.trim().length > 0 && estimatedQuantity && !loading;

  return {
    planMode,
    setPlanMode,
    approvedParcels,
    parcelsLoading,
    parcelsRefreshing,
    refreshParcels,
    parcelId,
    setParcelId,
    plantingsForParcel,
    selectedPlantingId,
    setSelectedPlantingId,
    harvestDetailsReady,
    cropType,
    setCropType,
    estimatedQuantity,
    setEstimatedQuantity,
    unit,
    setUnit,
    harvestDate,
    setHarvestDate,
    plannedLoadDate,
    setPlannedLoadDate,
    loadQuantity,
    setLoadQuantity,
    marketChannel,
    setMarketChannel,
    qualityGrade,
    setQualityGrade,
    sortingSpec,
    setSortingSpec,
    growerNotes,
    setGrowerNotes,
    location,
    loading,
    getCurrentLocation,
    handleSubmit,
    canSubmit,
  };
}

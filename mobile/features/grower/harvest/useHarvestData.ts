import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

/** Parcels owned by grower’s estates; harvesting needs admin-ready plot, planting does not (backend-aligned). */
export type HarvestParcelOption = { id: string; label: string; harvestPlanEligible: boolean };

export type PlantingPickRow = {
  id: string;
  parcelId: string;
  cropType: string;
  estimatedDate: string;
};

/** Parcel id from scalar or nested relation (matches PlantingsScreen `resolvedParcelFor`). */
export function normalizeHarvestParcelId(value: unknown, nested?: { id?: unknown } | null): string {
  const raw = value != null && String(value).trim() !== '' ? String(value).trim() : '';
  if (raw) return raw;
  const nid = nested?.id;
  return nid != null && String(nid).trim() !== '' ? String(nid).trim() : '';
}

async function fetchPlantingRows(): Promise<PlantingPickRow[]> {
  const pending = await offlineStorage.getPendingHarvestPlans();
  const local: PlantingPickRow[] = pending
    .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'PLANTING')
    .map((h) => {
      const parcelId = normalizeHarvestParcelId(h.payload.parcelId, null);
      return {
        id: `local:${h.id}`,
        parcelId,
        cropType: h.payload.cropType,
        estimatedDate: h.payload.estimatedDate,
      };
    })
    .filter((r) => r.parcelId.length > 0);
  let server: PlantingPickRow[] = [];
  try {
    const list = (await harvestAnnouncementsAPI.getMy()) as Array<{
      id: string;
      parcelId?: string;
      announcementType?: string;
      cropType: string;
      estimatedDate: string;
      parcel?: { id?: string } | null;
    }>;
    if (Array.isArray(list)) {
      server = list
        .filter((r) => String(r.announcementType ?? '').toUpperCase() === 'PLANTING')
        .map((r) => ({
          id: r.id,
          parcelId: normalizeHarvestParcelId(r.parcelId, r.parcel),
          cropType: r.cropType,
          estimatedDate: r.estimatedDate,
        }))
        .filter((r) => r.parcelId.length > 0);
    }
  } catch {
    // offline: locals only
  }
  return [...local, ...server];
}

export type HarvestPrefillIntent = { parcelId: string; plantingId?: string | null } | null;

export function useHarvestData(
  prefillIntent: HarvestPrefillIntent = null,
  onPrefillConsumed?: () => void,
) {
  const { t } = useTranslation();
  const [approvedParcels, setApprovedParcels] = useState<HarvestParcelOption[]>([]);
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

  const plantingsForParcel = useMemo(() => {
    const sel = normalizeHarvestParcelId(parcelId, null);
    if (!sel) return [];
    return plantingAnnouncements.filter((a) => normalizeHarvestParcelId(a.parcelId, null) === sel);
  }, [plantingAnnouncements, parcelId]);

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
      const out: HarvestParcelOption[] = [];
      for (const e of estates) {
        let ps: Awaited<ReturnType<typeof parcelsAPI.getByEstate>> = [];
        try {
          ps = await parcelsAPI.getByEstate(e.id);
          await growerOfflineCache.saveParcels(e.id, ps);
        } catch {
          ps = (await growerOfflineCache.loadParcels(e.id)) ?? [];
        }
        for (const p of ps || []) {
          out.push({
            id: p.id,
            label: `${e.name} — ${p.cropType || 'Parcel'}`,
            harvestPlanEligible: parcelEligibleForHarvestPlan(p),
          });
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

  const prefillAppliedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!prefillIntent?.parcelId?.trim() || parcelsLoading) return;
    const key = `${prefillIntent.parcelId.trim()}|${prefillIntent.plantingId ?? ''}`;
    if (prefillAppliedKeyRef.current === key) return;
    const wantParcel = normalizeHarvestParcelId(prefillIntent.parcelId, null);
    if (!wantParcel || !approvedParcels.some((p) => normalizeHarvestParcelId(p.id, null) === wantParcel)) {
      return;
    }
    setParcelId(wantParcel);
    setPlanMode('HARVEST');
    const forParcel = plantingAnnouncements.filter((a) => normalizeHarvestParcelId(a.parcelId, null) === wantParcel);
    const wantPlanting = prefillIntent.plantingId?.trim();

    if (wantPlanting) {
      if (forParcel.some((p) => p.id === wantPlanting)) {
        setSelectedPlantingId(wantPlanting);
      } else if (forParcel.length === 0) {
        return;
      }
      // Plantings loaded but id mismatch — parcel left selected for manual pick.
    } else if (forParcel.length === 1) {
      setSelectedPlantingId(forParcel[0].id);
    }

    prefillAppliedKeyRef.current = key;
    onPrefillConsumed?.();
  }, [
    prefillIntent,
    parcelsLoading,
    approvedParcels,
    plantingAnnouncements,
    onPrefillConsumed,
  ]);

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

    const parcelChoice = approvedParcels.find((p) => p.id === parcelId);

    if (planMode === 'HARVEST') {
      if (!parcelChoice?.harvestPlanEligible) {
        Alert.alert(t('error'), t('producer.harvest.harvestNeedsApprovedParcel'));
        return;
      }
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

    const datePart = harvestDate.trim();
    if (!datePart) {
      Alert.alert(t('error'), t('producer.harvest.dateRequired'));
      return;
    }
    const estimatedDateIso = `${datePart}T12:00:00.000Z`;
    const dateProbe = new Date(estimatedDateIso);
    if (Number.isNaN(dateProbe.getTime())) {
      Alert.alert(t('error'), t('producer.harvest.dateInvalid'));
      return;
    }

    if (planMode === 'HARVEST') {
      const estQtyRaw = estimatedQuantity.trim();
      const estQty = parseFloat(estQtyRaw);
      if (!estQtyRaw || Number.isNaN(estQty) || estQty <= 0) {
        Alert.alert(t('error'), t('producer.harvest.enterQuantity'));
        return;
      }
    }

    const buildNotes = () => {
      const parts: string[] = [];
      if (growerNotes.trim()) parts.push(growerNotes.trim());
      if (location) parts.push(`GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      return parts.length ? parts.join(' | ') : undefined;
    };

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
      const basePayload: CreateHarvestPlanBody = {
        parcelId,
        announcementType: planMode,
        cropType: cropType.trim(),
        estimatedDate: estimatedDateIso,
        notes: buildNotes(),
      };

      let payload: CreateHarvestPlanBody = basePayload;

      if (planMode === 'HARVEST') {
        const estQty = parseFloat(estimatedQuantity.trim());
        const loadKg = loadQuantity.trim() ? parseFloat(loadQuantity) : estQty;
        payload = {
          ...basePayload,
          estimatedQuantity: estQty,
          plannedLoadingStart,
          plannedLoadingEnd,
          loadQuantityKg: !Number.isNaN(loadKg) && loadKg > 0 ? loadKg : estQty,
          marketChannel: marketChannel || undefined,
          qualityGrade: qualityGrade.trim() || undefined,
          sortingSpec: sortingSpec.trim() || undefined,
        };
      } else {
        const qtyStr = estimatedQuantity.trim();
        if (qtyStr) {
          const q = parseFloat(qtyStr);
          if (!Number.isNaN(q) && q > 0) {
            const loadKg = loadQuantity.trim() ? parseFloat(loadQuantity) : q;
            payload = {
              ...basePayload,
              estimatedQuantity: q,
              loadQuantityKg: !Number.isNaN(loadKg) && loadKg > 0 ? loadKg : undefined,
            };
          }
        }
      }
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
    approvedParcels,
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

  const selectedParcelHarvestEligible = useMemo(() => {
    const row = approvedParcels.find((p) => p.id === parcelId);
    return Boolean(row?.harvestPlanEligible);
  }, [approvedParcels, parcelId]);

  const qtyOkHarvest =
    Boolean(estimatedQuantity?.trim()) && parseFloat(String(estimatedQuantity).trim()) > 0;

  const harvestDateOk = Boolean(harvestDate?.trim());

  const canSubmit =
    !parcelsLoading &&
    !loading &&
    harvestDateOk &&
    Boolean(parcelId) &&
    harvestDetailsReady &&
    cropType.trim().length > 0 &&
    (planMode === 'PLANTING' ||
      (selectedParcelHarvestEligible && qtyOkHarvest));

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
    selectedParcelHarvestEligible,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import {
  estatesAPI,
  harvestAnnouncementsAPI,
  parcelsAPI,
  type CreateHarvestPlanBody,
} from '../../../lib/api';

export type HarvestPlanMode = 'PLANTING' | 'HARVEST';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { isDeviceOnline } from '../../../lib/network-utils';
import { offlineStorage } from '../../../lib/offline-storage';
import { syncService } from '../../../lib/sync-service';
import { apiErrorMessage, isLikelyNetworkError } from '../../../lib/api-error';

export const CROP_TYPES = ['Raspberry', 'Pepper', 'Tomato', 'Cucumber', 'Lettuce', 'Other'];

type ParcelOption = { id: string; label: string };

export function useHarvestData() {
  const { t } = useTranslation();
  const [approvedParcels, setApprovedParcels] = useState<ParcelOption[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(true);
  const [parcelId, setParcelId] = useState('');

  const [cropType, setCropType] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [harvestDate, setHarvestDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plannedLoadDate, setPlannedLoadDate] = useState(''); // YYYY-MM-DD, optional
  const [loadQuantity, setLoadQuantity] = useState('');
  const [marketChannel, setMarketChannel] = useState<'INDUSTRIAL' | 'RETAIL' | 'MIXED' | ''>('');
  const [qualityGrade, setQualityGrade] = useState('');
  const [sortingSpec, setSortingSpec] = useState('');
  const [growerNotes, setGrowerNotes] = useState('');

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [planMode, setPlanMode] = useState<HarvestPlanMode>('HARVEST');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setParcelsLoading(true);
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
            if (p.approvedAt) {
              out.push({ id: p.id, label: `${e.name} — ${p.cropType || 'Parcel'}` });
            }
          }
        }
        if (cancelled) return;
        setApprovedParcels(out);
        if (out.length === 1) setParcelId(out[0].id);
      } catch (e) {
        console.error(e);
        setApprovedParcels([]);
      } finally {
        if (!cancelled) setParcelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') Alert.alert(t('producer.estates.permissionsTitle'), t('producer.estates.locationPermissionRequired'));
    });
  }, [t]);

  /** GPS is optional for a harvest *plan* — only for notes/traceability, not to prove you are on the plot. */
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch (error) {
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
        Alert.alert(t('error'), apiErrorMessage(e, t('producer.harvest.saveFailed')));
      } finally {
        setLoading(false);
      }
    };

    await run();
  }, [
    parcelId,
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
    planMode,
  ]);

  return {
    planMode,
    setPlanMode,
    approvedParcels,
    parcelsLoading,
    parcelId,
    setParcelId,
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
  };
}

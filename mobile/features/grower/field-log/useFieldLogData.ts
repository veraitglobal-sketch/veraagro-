import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pickFromCamera, pickFromGallery } from '../../../lib/camera-picker';
import { getCurrentGrowerPosition, isForegroundLocationGranted } from '../../../lib/grower-permissions';
import { offlineStorage } from '../../../lib/offline-storage';
import { verifyGPSAgainstEstateOrParcels, materialValidator } from '../../../lib/integrity-guard';
import { estatesAPI, Estate, parcelsAPI, Parcel, harvestAnnouncementsAPI, fieldEntriesAPI } from '../../../lib/api';
import {
  fieldEntryToHistoryItem,
  mergeFieldLogHistory,
  pendingPlantingToHistoryItem,
} from '../../../lib/field-log-history';
import { apiErrorMessage } from '../../../lib/api-error';
import { isDeviceOnline } from '../../../lib/network-utils';
import { syncService } from '../../../lib/sync-service';
import type { PendingFieldEntry, FieldLogMaterialKind, FieldLogHistoryItem } from '../../../lib/offline-storage';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

/** Match server default (see `planting-progress.util` / PLANTING_PROGRESS_NOTES_MIN_LEN). */
export const PLANTING_NOTES_MIN = 15;

function growthStagePersistedFromForm(preset: string, custom: string): string | undefined {
  if (preset === '__custom__') return custom.trim() || undefined;
  return preset.trim() || undefined;
}

export type ActivityType =
  | 'PLANTING'
  | 'FERTILIZING'
  | 'SPRAYING'
  | 'HARVEST'
  | 'TRANSPORT_COORD'
  | 'PACKAGING';

/** Barcode validation path — user taps first so we don't infer wrong from vague typing. */
export type MaterialKindForLog = FieldLogMaterialKind;

/** Maps UI activity to offline storage (English; sync maps to backend enums). */
const ACTIVITY_TO_PENDING: Record<ActivityType, PendingFieldEntry['activityType']> = {
  PLANTING: 'Planting',
  FERTILIZING: 'Fertilizing',
  SPRAYING: 'Spraying',
  HARVEST: 'Harvest',
  TRANSPORT_COORD: 'TransportCoordination',
  PACKAGING: 'Packaging',
};

export const ACTIVITY_TYPES: { value: ActivityType }[] = [
  { value: 'PLANTING' },
  { value: 'FERTILIZING' },
  { value: 'SPRAYING' },
  { value: 'HARVEST' },
  { value: 'TRANSPORT_COORD' },
  { value: 'PACKAGING' },
];

const FIELD_HISTORY_ACTIVITY_KEY: Record<string, string> = {
  Planting: 'planting',
  Fertilizing: 'fertilizing',
  Spraying: 'spraying',
  Harvest: 'harvest',
  TransportCoordination: 'transportCoord',
  Packaging: 'packaging',
};

function activityRequiresParcelGps(a: ActivityType | ''): boolean {
  return a === 'PLANTING' || a === 'FERTILIZING' || a === 'SPRAYING';
}

export function historyActivityLabelKey(activity: string): string {
  return FIELD_HISTORY_ACTIVITY_KEY[activity] ?? 'spraying';
}

export function useFieldLogData() {
  const { t } = useTranslation();
  const router = useRouter();
  const route = useLocalSearchParams<{ parcelId?: string; plantingId?: string }>();
  const requestedParcel = typeof route.parcelId === 'string' ? route.parcelId : '';
  const requestedPlan = typeof route.plantingId === 'string' ? route.plantingId : '';
  const plansRequest = useRef(0);
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
  const [selectedParcelId, setSelectedParcelId] = useState(requestedParcel);
  const [selectedHarvestPlanId, setSelectedHarvestPlanId] = useState(requestedPlan);
  const [parcelPlans, setParcelPlans] = useState<
    { id: string; label: string; announcementType: string; cropType: string }[]
  >([]);
  const [growthStagePreset, setGrowthStagePreset] = useState('');
  const [growthStageCustom, setGrowthStageCustom] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('');

  const [localHistory, setLocalHistory] = useState<FieldLogHistoryItem[]>([]);
  const [pendingFieldCount, setPendingFieldCount] = useState(0);
  const [legacyFieldCount, setLegacyFieldCount] = useState(0);
  const [queueSyncBusy, setQueueSyncBusy] = useState(false);

  const locationRef = useRef<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const selectedParcelIdRef = useRef(requestedParcel);
  useEffect(() => {
    if (!requestedParcel) return;
    setSelectedParcelId(requestedParcel);
    setSelectedHarvestPlanId(requestedPlan);
  }, [requestedParcel, requestedPlan]);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  useEffect(() => {
    selectedParcelIdRef.current = selectedParcelId;
  }, [selectedParcelId]);

  const [parcelsByEstate, setParcelsByEstate] = useState<Record<string, Parcel[]>>({});

  const loadEstates = useCallback(async () => {
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      const entries = await Promise.all(
        list.map(async (e) => {
          try {
            const pl = await parcelsAPI.getByEstate(e.id);
            return [e.id, Array.isArray(pl) ? pl : []] as const;
          } catch {
            return [e.id, []] as const;
          }
        }),
      );
      const map = Object.fromEntries(entries) as Record<string, Parcel[]>;
      setParcelsByEstate(map);
      const preserved = selectedParcelIdRef.current;
      if (!preserved) {
        setCurrentEstate(null);
        setParcelsForGps([]);
        return;
      }
      let found: Estate | null = null;
      let foundParcels: Parcel[] = [];
      for (const e of list) {
        const plist = map[e.id] ?? [];
        if (plist.some((p) => p.id === preserved)) {
          found = e;
          foundParcels = plist;
          break;
        }
      }
      if (found) {
        setCurrentEstate(found);
        setParcelsForGps(foundParcels);
      } else {
        setSelectedParcelId('');
        setCurrentEstate(null);
        setParcelsForGps([]);
      }
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
      setParcelsByEstate({});
      setCurrentEstate(null);
      setParcelsForGps([]);
    }
  }, []);

  const approvedParcelOptions = useMemo(() => {
    const out: { parcel: Parcel; estate: Estate }[] = [];
    for (const e of estates) {
      for (const p of parcelsByEstate[e.id] ?? []) {
        if (p.approvedAt) out.push({ parcel: p, estate: e });
      }
    }
    out.sort((a, b) => {
      const farm = a.estate.name.localeCompare(b.estate.name, undefined, { sensitivity: 'base' });
      if (farm !== 0) return farm;
      const c1 = a.parcel.cropType ?? '';
      const c2 = b.parcel.cropType ?? '';
      return c1.localeCompare(c2, undefined, { sensitivity: 'base' });
    });
    return out;
  }, [estates, parcelsByEstate]);

  /** One farm / one parcel — pick automatically so the farmer taps less. */
  useEffect(() => {
    if (selectedParcelId || approvedParcelOptions.length !== 1) return;
    setSelectedParcelId(approvedParcelOptions[0].parcel.id);
  }, [approvedParcelOptions, selectedParcelId]);

  useEffect(() => {
    if (!selectedParcelId) {
      setCurrentEstate(null);
      setParcelsForGps([]);
      return;
    }
    const opt = approvedParcelOptions.find((o) => o.parcel.id === selectedParcelId);
    if (opt) {
      setCurrentEstate(opt.estate);
      setParcelsForGps(parcelsByEstate[opt.estate.id] ?? []);
    } else {
      setCurrentEstate(null);
      setParcelsForGps([]);
    }
  }, [selectedParcelId, approvedParcelOptions, parcelsByEstate]);

  const loadParcelPlans = useCallback(async () => {
    const generation = ++plansRequest.current;
    if (!selectedParcelId) {
      setParcelPlans([]);
      setSelectedHarvestPlanId('');
      setPlansLoading(false);
      return;
    }
    setParcelPlans([]);
    setPlansLoading(true);
    try {
      const raw = await harvestAnnouncementsAPI.getMy();
      const arr = Array.isArray(raw) ? raw : [];
      const forParcel = arr.filter((a: { parcelId: unknown; status: string; parcel?: { id?: string } | null }) => {
        const aid = normalizeHarvestParcelId(a.parcelId, a.parcel ?? null);
        return aid === selectedParcelId && a.status !== 'CANCELLED';
      });
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
            cropType: a.cropType ?? '',
            label: `${kind} · ${a.cropType} · ${dateStr}`,
          };
        },
      );
      if (generation !== plansRequest.current) return;
      setParcelPlans(options);
      setSelectedHarvestPlanId((prev) => {
        if (options.length === 0) return '';
        return options.some((o) => o.id === prev) ? prev : requestedPlan ? '' : options[0].id;
      });
    } catch {
      if (generation !== plansRequest.current) return;
      setParcelPlans([]);
      setSelectedHarvestPlanId('');
    } finally {
      if (generation === plansRequest.current) setPlansLoading(false);
    }
  }, [selectedParcelId, requestedPlan, t]);

  useEffect(() => {
    void loadParcelPlans();
    return () => { plansRequest.current++; };
  }, [loadParcelPlans]);

  const selectedHarvestPlan = useMemo(
    () => parcelPlans.find((p) => p.id === selectedHarvestPlanId),
    [parcelPlans, selectedHarvestPlanId],
  );

  useEffect(() => {
    setGrowthStagePreset('');
    setGrowthStageCustom('');
    setJournalNotes('');
    setMaterialQuantity('');
  }, [selectedParcelId]);

  /** Strict only for planting / fertilizer / spray — transport, packaging, harvest may be recorded off-parcel. */
  useEffect(() => {
    if (!location) {
      setGpsWarning(false);
      return;
    }
    if (!activityRequiresParcelGps(activityType)) {
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
    activityType,
  ]);

  useEffect(() => {
    void loadEstates();
  }, [loadEstates]);

  const refreshReferenceData = useCallback(async () => {
    setReferenceRefreshing(true);
    try {
      const data = await estatesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setEstates(list);
      const entries = await Promise.all(
        list.map(async (e) => {
          try {
            const pl = await parcelsAPI.getByEstate(e.id);
            return [e.id, Array.isArray(pl) ? pl : []] as const;
          } catch {
            return [e.id, []] as const;
          }
        }),
      );
      const map = Object.fromEntries(entries) as Record<string, Parcel[]>;
      setParcelsByEstate(map);
      const preserved = selectedParcelIdRef.current;
      if (preserved) {
        let foundEstate: Estate | null = null;
        let foundParcels: Parcel[] = [];
        for (const e of list) {
          const plist = map[e.id] ?? [];
          if (plist.some((p) => p.id === preserved)) {
            foundEstate = e;
            foundParcels = plist;
            break;
          }
        }
        if (foundEstate) {
          setCurrentEstate(foundEstate);
          setParcelsForGps(foundParcels);
        } else {
          setSelectedParcelId('');
          setCurrentEstate(null);
          setParcelsForGps([]);
        }
      } else {
        setCurrentEstate(null);
        setParcelsForGps([]);
      }
    } catch (error) {
      console.error('Error loading estates:', error);
      setEstates([]);
      setParcelsByEstate({});
      setParcelsForGps([]);
    } finally {
      setReferenceRefreshing(false);
      try {
        setLocalHistory(await offlineStorage.getFieldLogHistory());
      } catch {
        setLocalHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (
      activityType === 'HARVEST' ||
      activityType === 'TRANSPORT_COORD' ||
      activityType === 'PACKAGING'
    ) {
      setMaterialID('');
      setMaterialValid(null);
      return;
    }
    if (activityType === 'PLANTING') setMaterialKind('SEED');
    else if (activityType === 'FERTILIZING') setMaterialKind('FERTILIZER');
    else if (activityType === 'SPRAYING') setMaterialKind('PESTICIDE');
  }, [activityType]);

  /** Planting logs need a growth stage — default so the farmer does not hunt for it. */
  useEffect(() => {
    if (activityType === 'PLANTING' && !growthStagePreset && !growthStageCustom.trim()) {
      setGrowthStagePreset('Setva');
    }
  }, [activityType, growthStagePreset, growthStageCustom]);

  const validateMaterial = useCallback(async () => {
    if (!materialID.trim()) {
      setMaterialValid(null);
      return;
    }
    if (
      activityType === 'HARVEST' ||
      activityType === 'TRANSPORT_COORD' ||
      activityType === 'PACKAGING'
    ) {
      setMaterialValid(null);
      return;
    }
    try {
      const result = await materialValidator(materialID, materialKind, {
        farmId: currentEstate?.id,
      });
      setMaterialValid(result.valid);
    } catch {
      setMaterialValid(false);
    }
  }, [materialID, activityType, materialKind, currentEstate?.id]);

  useEffect(() => {
    if (!materialID || materialID.trim().length < 3) {
      setMaterialValid(null);
      return;
    }
    const t = setTimeout(() => validateMaterial(), 500);
    return () => clearTimeout(t);
  }, [materialID, activityType, validateMaterial]);

  const getCurrentLocation = useCallback(async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentGrowerPosition(t);
      if (pos) setLocation(pos);
    } finally {
      setGpsLoading(false);
    }
  }, [t]);

  const refreshPendingFieldCount = useCallback(async () => {
    try {
      const entries = await offlineStorage.getPendingEntries();
      const n = entries.filter(
        (e) => e.status === 'pending' || e.status === 'error' || e.status === 'syncing',
      ).length;
      setPendingFieldCount(n);
      setLegacyFieldCount(await offlineStorage.countLegacyFieldLogEntries());
    } catch {
      setPendingFieldCount(0);
      setLegacyFieldCount(0);
    }
  }, []);

  const reloadLocalHistory = useCallback(async () => {
    try {
      const local = await offlineStorage.getFieldLogHistory();
      const pendingPlanting = await offlineStorage.getPendingPlantingEntries();
      const farmName = currentEstate?.name;
      const pendingItems = pendingPlanting
        .filter((r) => r.status !== 'synced')
        .map((r) => pendingPlantingToHistoryItem(r, farmName));
      let apiItems: ReturnType<typeof fieldEntryToHistoryItem>[] = [];
      if (currentEstate?.id && (await isDeviceOnline())) {
        const rows = await fieldEntriesAPI.getAll(currentEstate.id);
        apiItems = rows.map((e) => fieldEntryToHistoryItem(e as Parameters<typeof fieldEntryToHistoryItem>[0], farmName));
      }
      setLocalHistory(mergeFieldLogHistory(local, apiItems, pendingItems));
    } catch {
      setLocalHistory([]);
    }
    await refreshPendingFieldCount();
  }, [refreshPendingFieldCount, currentEstate?.id, currentEstate?.name]);

  useFocusEffect(
    useCallback(() => {
      const check = async () => {
      await reloadLocalHistory();
        try {
          const barcode = await AsyncStorage.getItem('last_scanned_barcode');
          if (barcode) {
            setMaterialID(barcode);
            await AsyncStorage.removeItem('last_scanned_barcode');
          }
        } catch {}
        try {
          if (!(await isForegroundLocationGranted())) return;
          const gpsAlways = await AsyncStorage.getItem('settings_gps_always');
          if (gpsAlways === 'true' && !locationRef.current) {
            await getCurrentLocation();
          }
        } catch {}
      };
      void check();
    }, [getCurrentLocation, refreshPendingFieldCount]),
  );

  const pickPhotoFromLibrary = useCallback(async () => {
    const asset = await pickFromGallery({ t, quality: 0.72 });
    if (asset?.uri) setPhotoUri(asset.uri);
  }, [t]);

  const takePhoto = useCallback(async () => {
    const asset = await pickFromCamera({ t, quality: 0.72 });
    if (asset?.uri) setPhotoUri(asset.uri);
  }, [t]);

  const saveEntry = useCallback(async () => {
    try {
      setSaveBusy(true);
      const plan = selectedHarvestPlan;
      const growthStageSaved =
        plan?.announcementType === 'PLANTING'
          ? growthStagePersistedFromForm(growthStagePreset, growthStageCustom)
          : undefined;

      const usesMaterialBarcode =
        activityType === 'PLANTING' ||
        activityType === 'FERTILIZING' ||
        activityType === 'SPRAYING';

      const entryId = await offlineStorage.savePendingEntry({
        activityType: ACTIVITY_TO_PENDING[activityType as ActivityType],
        estateId: currentEstate?.id,
        parcelId: selectedParcelId,
        harvestAnnouncementId: selectedHarvestPlanId,
        planAnnouncementType: plan?.announcementType,
        journalNotes: journalNotes.trim() || undefined,
        growthStage: growthStageSaved,
        materialKind: usesMaterialBarcode ? materialKind : undefined,
        materialID: materialID || undefined,
        materialQuantity: materialQuantity.trim() || undefined,
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
      setMaterialQuantity('');
      await reloadLocalHistory();
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
    materialQuantity,
    t,
    reloadLocalHistory,
  ]);

  const syncQueueNow = useCallback(async () => {
    if (queueSyncBusy) return;
    const online = await isDeviceOnline();
    if (!online) {
      Alert.alert(t('error'), t('producer.fieldLogAlerts.saveQueuedWhenOnline'));
      return;
    }
    setQueueSyncBusy(true);
    try {
      const result = await syncService.syncPendingEntries();
      await reloadLocalHistory();
      if (result.failed > 0) {
        const status = await syncService.getSyncStatus();
        Alert.alert(
          t('producer.fieldLogAlerts.saveSyncFailedTitle'),
          status.firstQueueError ?? t('producer.sync.itemsNotSentHint'),
        );
      } else if (result.success > 0) {
        Alert.alert(t('alerts.success'), t('producer.fieldLogAlerts.saveSentNow'));
      }
    } finally {
      setQueueSyncBusy(false);
    }
  }, [queueSyncBusy, t, reloadLocalHistory]);

  const discardQueueItem = useCallback(
    (id: string) => {
      Alert.alert(
        t('producer.fieldLogForm.discardQueueTitle'),
        t('producer.fieldLogForm.discardQueueBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('producer.fieldLogForm.discardQueueConfirm'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await offlineStorage.discardFieldLogQueueItem(id);
                await reloadLocalHistory();
              })();
            },
          },
        ],
      );
    },
    [t, reloadLocalHistory],
  );

  const purgeLegacyOnly = useCallback(() => {
    if (legacyFieldCount === 0) return;
    Alert.alert(
      t('producer.fieldLogForm.discardAllTitle'),
      t('producer.sync.legacyBanner', { count: legacyFieldCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.sync.purgeLegacyOnly'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const n = await syncService.purgeLegacyFieldLogOnly();
              await reloadLocalHistory();
              Alert.alert(
                t('alerts.success'),
                t('producer.sync.clearLocalQueueDone', { count: n }),
              );
            })();
          },
        },
      ],
    );
  }, [legacyFieldCount, t, reloadLocalHistory]);

  const discardAllUnsentLocal = useCallback(() => {
    if (pendingFieldCount === 0) return;
    Alert.alert(
      t('producer.fieldLogForm.discardAllTitle'),
      t('producer.fieldLogForm.discardAllBody', { count: pendingFieldCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('producer.fieldLogForm.discardAllConfirm'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const { queueRemoved, historyRemoved } = await offlineStorage.purgeUnsentFieldLogLocal();
              await reloadLocalHistory();
              Alert.alert(
                t('alerts.success'),
                t('producer.sync.clearLocalQueueDone', {
                  count: queueRemoved + historyRemoved,
                }),
              );
            })();
          },
        },
      ],
    );
  }, [pendingFieldCount, t, reloadLocalHistory]);

  const handleSubmit = useCallback(async () => {
    if (saveBusy) return;

    const missing: string[] = [];
    if (plansLoading) {
      missing.push(t('producer.fieldLogForm.submitMissingLoadingPlans'));
    }
    if (!selectedParcelId || !currentEstate?.id) {
      missing.push(
        !currentEstate?.id
          ? t('producer.fieldLogAlerts.parcelContextMissing')
          : t('producer.fieldLogForm.submitMissingParcel'),
      );
    }
    if (!selectedHarvestPlanId) {
      missing.push(t('producer.fieldLogForm.submitMissingPlan'));
    }
    const plan = parcelPlans.find((p) => p.id === selectedHarvestPlanId);
    if (plan?.announcementType === 'PLANTING' && activityType === 'PLANTING') {
      if (journalNotes.trim().length < PLANTING_NOTES_MIN) {
        missing.push(
          t('producer.fieldLogForm.submitMissingPlantingNotes', { min: PLANTING_NOTES_MIN }),
        );
      }
      if (!growthStagePersistedFromForm(growthStagePreset, growthStageCustom)) {
        missing.push(t('producer.fieldLogForm.submitMissingGrowthStage'));
      }
    }
    if (!activityType) {
      missing.push(t('producer.fieldLogForm.submitMissingActivity'));
    }
    if (!photoUri) {
      missing.push(t('producer.fieldLogForm.submitMissingPhoto'));
    }
    if (!location) {
      missing.push(t('producer.fieldLogForm.submitMissingGps'));
    }
    const materialBarcodeActivities: ActivityType[] = ['PLANTING', 'FERTILIZING', 'SPRAYING'];
    if (materialBarcodeActivities.includes(activityType as ActivityType)) {
      if (!materialID.trim()) {
        missing.push(t('producer.fieldLogForm.submitMissingMaterialRequired'));
      } else if (materialValid !== true) {
        missing.push(t('producer.fieldLogForm.submitMissingMaterial'));
      }
    }
    if (missing.length > 0) {
      Alert.alert(
        t('producer.fieldLogForm.submitBlockedTitle'),
        `${missing.join('\n')}\n\n${t('producer.fieldLogForm.submitTapHint')}`,
      );
      return;
    }

    await saveEntry();
  }, [
    saveBusy,
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
    saveEntry,
    t,
  ]);

  return {
    router,
    estates,
    currentEstate,
    approvedParcelOptions,
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
    materialQuantity,
    setMaterialQuantity,
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
    localHistory,
    reloadLocalHistory,
    pendingFieldCount,
    legacyFieldCount,
    queueSyncBusy,
    syncQueueNow,
    discardQueueItem,
    discardAllUnsentLocal,
    purgeLegacyOnly,
  };
}

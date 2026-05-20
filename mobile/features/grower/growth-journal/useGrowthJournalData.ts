import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import type * as ImagePicker from 'expo-image-picker';
import { getCurrentGrowerPosition } from '../../../lib/grower-permissions';
import { pickFromCamera, pickFromGallery, scheduleAfterModalDismiss } from '../../../lib/camera-picker';
import { growthLogsAPI, GrowthLog, harvestAnnouncementsAPI } from '../../../lib/api';
import { loadGrowerParcelRows, type GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import { getOrCreateDeviceId } from '../../../lib/device-id';
import { sha256HexFromImageUri } from '../../../lib/image-hash';
import { imageUriToJpegDataUrl, assertDataUrlWithinSize } from '../../../lib/image-data-url';
import { apiErrorMessage } from '../../../lib/api-error';

const MAX_GROWTH_PHOTO_BYTES = 8 * 1024 * 1024;
const PLANTING_NOTES_MIN = 15;

export type ParcelOption = GrowerParcelRow;

type PendingGrowthSubmission = {
  estateId: string;
  parcelId: string;
  activePlanId: string;
  payload: { notes: string; growthStage: string | undefined };
};

export function useGrowthJournalData() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<GrowthLog[]>([]);
  const [parcels, setParcels] = useState<ParcelOption[]>([]);
  const [harvestPlans, setHarvestPlans] = useState<
    {
      id: string;
      announcementType: string;
      cropType: string;
      estimatedDate: string;
      parcelId?: string | null;
      status: string;
      parcel?: { id?: string | null } | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedParcelId, setSelectedParcelId] = useState('');

  const pendingSubmissionRef = useRef<PendingGrowthSubmission | null>(null);
  const deferredCameraCancelRef = useRef<(() => void) | null>(null);
  const logsRequestRef = useRef(0);
  const initialBootDoneRef = useRef(false);

  useEffect(() => {
    return () => {
      deferredCameraCancelRef.current?.();
    };
  }, []);

  const parcelById = useMemo(() => new Map(parcels.map((p) => [p.id, p])), [parcels]);

  const selectedParcel = parcelById.get(selectedParcelId);

  const estateIdForSelection = selectedParcel?.estateId ?? '';

  const parcelPlans = useMemo(() => {
    if (!selectedParcelId) return [];
    return harvestPlans
      .filter(
        (a) =>
          normalizeHarvestParcelId(a.parcelId, a.parcel ?? null) === selectedParcelId &&
          a.status !== 'CANCELLED',
      )
      .map((a) => {
        const dateStr = a.estimatedDate ? String(a.estimatedDate).slice(0, 10) : '—';
        return {
          id: a.id,
          announcementType: a.announcementType,
          label: `${a.cropType} · ${dateStr}`,
        };
      });
  }, [harvestPlans, selectedParcelId]);

  const [activePlanId, setActivePlanId] = useState('');

  const loadLogsForParcel = useCallback(async (parcelId: string, opts?: { blockUi?: boolean }) => {
    const reqId = ++logsRequestRef.current;
    const blockUi = opts?.blockUi === true;
    if (blockUi) setLogsLoading(true);

    try {
      const data = await growthLogsAPI.getAllByParcel(parcelId);
      if (reqId !== logsRequestRef.current) return;
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading growth logs:', error);
      if (reqId !== logsRequestRef.current) return;
      setLogs([]);
    } finally {
      if (reqId === logsRequestRef.current) setLogsLoading(false);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const [flat, plansRaw] = await Promise.all([
        loadGrowerParcelRows({ approvedOnly: true, t }),
        harvestAnnouncementsAPI.getMy(),
      ]);
      setHarvestPlans(Array.isArray(plansRaw) ? plansRaw : []);
      setParcels(flat);

      if (flat.length > 0) {
        setSelectedParcelId((prev) => {
          const next = prev && flat.some((p) => p.id === prev) ? prev : flat[0].id;
          if (next !== prev) {
            void loadLogsForParcel(next, { blockUi: true });
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Error loading growth journal:', error);
      setParcels([]);
      setHarvestPlans([]);
    } finally {
      setLoading(false);
      initialBootDoneRef.current = true;
    }
  }, [loadLogsForParcel, t]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const selectParcel = useCallback(
    (parcelId: string) => {
      if (parcelId === selectedParcelId) return;
      setSelectedParcelId(parcelId);
      setActivePlanId('');
      void loadLogsForParcel(parcelId, { blockUi: false });
    },
    [selectedParcelId, loadLogsForParcel],
  );

  useEffect(() => {
    if (!selectedParcelId) {
      setActivePlanId('');
      return;
    }
    setActivePlanId((prev) => {
      if (parcelPlans.length === 0) return '';
      return parcelPlans.some((o) => o.id === prev) ? prev : parcelPlans[0].id;
    });
  }, [selectedParcelId, parcelPlans]);

  const resolveGrowthJournalPhotoAsset = useCallback(async (): Promise<ImagePicker.ImagePickerAsset | null> => {
    const asset = await pickFromCamera({
      t,
      quality: 0.72,
      defer: true,
      rationaleTitleKey: 'producer.growthJournal.cameraRationaleTitle',
      rationaleBodyKey: 'producer.growthJournal.cameraRationaleBody',
    });
    if (asset) return asset;

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
            void pickFromGallery({ t, quality: 0.72, defer: true }).then((picked) => resolve(picked));
          },
        },
      ]);
    });
  }, [t]);

  const completeGrowthLogAfterModalClose = useCallback(async () => {
    const pending = pendingSubmissionRef.current;
    pendingSubmissionRef.current = null;
    if (!pending) return;

    setUploading(true);
    try {
      const pos = await getCurrentGrowerPosition(t);
      if (!pos) return;
      const location = { lat: pos.lat, lng: pos.lng };

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
        estateId: pending.estateId,
        parcelId: pending.parcelId,
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
      await loadLogsForParcel(pending.parcelId, { blockUi: false });
      Alert.alert(t('producer.growthJournalAlerts.savedTitle'), t('producer.growthJournalAlerts.savedBody'));
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.growthJournalAlerts.saveFailed')));
      console.error('Growth log submit:', e);
    } finally {
      setUploading(false);
    }
  }, [resolveGrowthJournalPhotoAsset, loadLogsForParcel, t]);

  const submitAddLog = useCallback(
    async (payload: { notes: string; growthStage: string | undefined }) => {
      if (uploading) return;
      if (!selectedParcelId || !estateIdForSelection) {
        Alert.alert(t('producer.growthJournal.hintPickParcelTitle'), t('producer.growthJournal.hintPickParcel'));
        return;
      }
      if (!activePlanId) {
        Alert.alert(t('producer.growthJournal.hintPickPlanTitle'), t('producer.growthJournal.noPlantingOnParcel'));
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
        estateId: estateIdForSelection,
        parcelId: selectedParcelId,
        activePlanId,
        payload,
      };
      setAddModalVisible(false);
      deferredCameraCancelRef.current?.();
      deferredCameraCancelRef.current = scheduleAfterModalDismiss(() => {
        deferredCameraCancelRef.current = null;
        void completeGrowthLogAfterModalClose();
      });
    },
    [
      uploading,
      selectedParcelId,
      estateIdForSelection,
      activePlanId,
      parcelPlans,
      t,
      completeGrowthLogAfterModalClose,
    ],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const keepParcel = selectedParcelId;
    await bootstrap();
    if (keepParcel && parcelById.has(keepParcel)) {
      setSelectedParcelId(keepParcel);
      await loadLogsForParcel(keepParcel, { blockUi: false });
    }
    setRefreshing(false);
  }, [bootstrap, selectedParcelId, parcelById, loadLogsForParcel]);

  const requestOpenAddModal = useCallback(() => {
    if (uploading || loading) return;
    if (!selectedParcelId) {
      Alert.alert(t('producer.growthJournal.hintPickParcelTitle'), t('producer.growthJournal.hintPickParcel'));
      return;
    }
    if (!activePlanId) {
      Alert.alert(t('producer.growthJournal.hintPickPlanTitle'), t('producer.growthJournal.noPlantingOnParcel'));
      return;
    }
    setAddModalVisible(true);
  }, [uploading, loading, selectedParcelId, activePlanId, t]);

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [logs],
  );

  const canAddLog = Boolean(selectedParcelId && activePlanId && !loading);

  return {
    logs: sortedLogs,
    loading,
    logsLoading,
    refreshing,
    uploading,
    addModalVisible,
    setAddModalVisible,
    parcels,
    selectedParcelId,
    selectParcel,
    parcelPlans,
    activePlanId,
    setActivePlanId,
    canAddLog,
    requestOpenAddModal,
    onRefresh,
    submitAddLog,
    selectedParcel,
  };
}

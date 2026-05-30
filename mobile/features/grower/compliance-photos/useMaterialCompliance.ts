import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { pickFromCamera } from '../../../lib/camera-picker';
import {
  batchesAPI,
  materialControlAPI,
  type ComplianceBatchStatus,
  type LabelRollRow,
} from '../../../lib/api';
import { assertDataUrlWithinSize, imageUriToJpegDataUrl } from '../../../lib/image-data-url';
import { apiErrorMessage } from '../../../lib/api-error';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import type { BatchItem, ParcelFilterOption } from '../quality-entry/useQualityEntryData';

const PARCEL_NONE_KEY = '__none__';
const PARCEL_ALL_KEY = 'all';

export const COMPLIANCE_PHOTO_TYPES = ['PUNNETS', 'LABELING', 'PALLETIZATION'] as const;
export type CompliancePhotoType = (typeof COMPLIANCE_PHOTO_TYPES)[number];

export type BatchRow = BatchItem & {
  batchId: string;
  productName: string;
  quantity: number;
  unit?: string;
};

function mapBatchFromApi(b: Record<string, unknown>): BatchRow {
  const parcels = b.parcels as { cropType?: string | null; publicCode?: string | null } | null | undefined;
  const estates = b.estates as { name?: string } | null | undefined;
  const parcelId = (b.parcelId as string | null | undefined) ?? undefined;
  return {
    id: String(b.id),
    batchId: String(b.batchId ?? b.id),
    productName: String(b.productName ?? ''),
    quantity: typeof b.quantity === 'number' ? b.quantity : 0,
    unit: b.unit as string | undefined,
    parcelId,
    parcels: parcels
      ? { cropType: parcels.cropType ?? undefined, publicCode: parcels.publicCode ?? undefined }
      : undefined,
    estates: estates?.name ? { name: estates.name } : undefined,
  };
}

export function useMaterialCompliance() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [parcelFilterId, setParcelFilterId] = useState<string>(PARCEL_ALL_KEY);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [labelRolls, setLabelRolls] = useState<LabelRollRow[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [stickerRollId, setStickerRollId] = useState('');
  const [complianceStatus, setComplianceStatus] = useState<ComplianceBatchStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [photos, setPhotos] = useState<Partial<Record<CompliancePhotoType, string>>>({});
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [picking, setPicking] = useState<CompliancePhotoType | null>(null);
  /** Narrows the sticker roll list (can be 1000+ SOLD rows). */
  const [labelRollFilter, setLabelRollFilter] = useState('');

  const parcelFilterOptions = useMemo((): ParcelFilterOption[] => {
    const opts: ParcelFilterOption[] = [{ id: PARCEL_ALL_KEY, label: t('common.all') }];
    const seen = new Set<string>();
    seen.add(PARCEL_ALL_KEY);
    for (const b of batches) {
      const key = b.parcelId || PARCEL_NONE_KEY;
      if (seen.has(key)) continue;
      seen.add(key);
      const crop = b.parcels?.cropType?.trim();
      const code = b.parcels?.publicCode?.trim();
      const est = b.estates?.name?.trim();
      let label: string;
      if (key === PARCEL_NONE_KEY) {
        label = t('producer.qualityEntry.parcelNotLinked');
      } else {
        const parts = [est, crop || code].filter(Boolean);
        label = parts.length > 0 ? parts.join(' · ') : key.slice(0, 8) + '…';
      }
      opts.push({ id: key, label });
    }
    return opts;
  }, [batches, t]);

  const filteredBatches = useMemo(() => {
    if (parcelFilterId === PARCEL_ALL_KEY) return batches;
    if (parcelFilterId === PARCEL_NONE_KEY) return batches.filter((b) => !b.parcelId);
    return batches.filter((b) => b.parcelId === parcelFilterId);
  }, [batches, parcelFilterId]);

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      let raw: BatchRow[] = [];
      try {
        const data = await batchesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        raw = list
          .filter((b: { id?: string }) => b?.id)
          .map((b: Record<string, unknown>) => mapBatchFromApi(b));
        await growerOfflineCache.saveBatches(list as unknown[]);
      } catch {
        const cached = await growerOfflineCache.loadBatches<Record<string, unknown>>();
        raw = (cached ?? [])
          .filter((b: { id?: string }) => b?.id)
          .map((b) => mapBatchFromApi(b));
      }
      setBatches(raw);
    } catch {
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  const loadLabelRolls = useCallback(async () => {
    try {
      const data = await materialControlAPI.getMyLabelRolls();
      setLabelRolls(Array.isArray(data) ? data : []);
    } catch {
      setLabelRolls([]);
    }
  }, []);

  useEffect(() => {
    void loadBatches();
    void loadLabelRolls();
  }, [loadBatches, loadLabelRolls]);

  useEffect(() => {
    setSelectedBatchId((prev) => {
      if (prev && filteredBatches.some((b) => b.id === prev)) return prev;
      return filteredBatches[0]?.id ?? '';
    });
  }, [filteredBatches]);

  const fetchStatus = useCallback(async (batchId: string) => {
    if (!batchId) {
      setComplianceStatus(null);
      return;
    }
    setStatusLoading(true);
    setStatusError(false);
    try {
      const s = await materialControlAPI.getComplianceStatus(batchId);
      setComplianceStatus(s);
    } catch {
      setComplianceStatus(null);
      setStatusError(true);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedBatchId) {
      setComplianceStatus(null);
      return;
    }
    void fetchStatus(selectedBatchId);
  }, [selectedBatchId, fetchStatus]);

  useEffect(() => {
    if (showReplaceForm) return;
    if (complianceStatus?.stickerRollId) {
      setStickerRollId(complianceStatus.stickerRollId);
    }
  }, [complianceStatus?.stickerRollId, showReplaceForm, selectedBatchId]);

  const pickableRolls = useMemo(() => {
    return labelRolls.filter(
      (r) =>
        r.status === 'SOLD' || (r.status === 'USED' && r.serialNumber === complianceStatus?.stickerRollId),
    );
  }, [labelRolls, complianceStatus?.stickerRollId]);

  /** Without a query, only show the newest N so we never mount 1000+ chips. */
  const ROLL_LIST_RECENT_CAP = 36;
  const ROLL_LIST_MATCH_CAP = 100;

  const { stickerRollListForUi, stickerRollListMeta } = useMemo(() => {
    const q = labelRollFilter.trim().toLowerCase();
    if (q) {
      const matched = pickableRolls.filter((r) => r.serialNumber.toLowerCase().includes(q));
      return {
        stickerRollListForUi: matched.slice(0, ROLL_LIST_MATCH_CAP),
        stickerRollListMeta: {
          mode: 'search' as const,
          matchCount: matched.length,
          capped: matched.length > ROLL_LIST_MATCH_CAP,
        },
      };
    }
    if (pickableRolls.length <= ROLL_LIST_RECENT_CAP) {
      return {
        stickerRollListForUi: pickableRolls,
        stickerRollListMeta: { mode: 'all' as const, matchCount: pickableRolls.length, capped: false },
      };
    }
    return {
      stickerRollListForUi: pickableRolls.slice(0, ROLL_LIST_RECENT_CAP),
      stickerRollListMeta: {
        mode: 'recent' as const,
        matchCount: pickableRolls.length,
        capped: true,
      },
    };
  }, [pickableRolls, labelRollFilter]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const parcelIdForLot = selectedBatch?.parcelId?.trim() || undefined;

  const onBatchChange = useCallback((id: string) => {
    setSelectedBatchId(id);
    setShowReplaceForm(false);
    setPhotos({});
    setStickerRollId('');
    setLabelRollFilter('');
  }, []);

  const takePhoto = useCallback(
    async (type: CompliancePhotoType) => {
      if (picking) return;
      setPicking(type);
      try {
        const picked = await pickFromCamera({ t, allowsEditing: true, quality: 0.85 });
        if (!picked?.uri) return;
        const dataUrl = await imageUriToJpegDataUrl(picked.uri);
        try {
          assertDataUrlWithinSize(dataUrl);
        } catch {
          Alert.alert(t('error'), t('producer.compliance.batchForm.errors.photoTooLarge'));
          return;
        }
        setPhotos((prev) => ({ ...prev, [type]: dataUrl }));
      } catch (e) {
        console.error(e);
        Alert.alert(t('error'), t('producer.compliance.openCameraFailed'));
      } finally {
        setPicking(null);
      }
    },
    [picking, t],
  );

  const onVerifySticker = useCallback(async () => {
    if (!selectedBatchId || !stickerRollId.trim()) {
      Alert.alert(t('error'), t('producer.compliance.batchForm.errors.selectBatchAndSticker'));
      return;
    }
    setVerifying(true);
    try {
      await materialControlAPI.verifySticker({
        batchId: selectedBatchId,
        stickerRollId: stickerRollId.trim(),
        parcelId: parcelIdForLot,
      });
      Alert.alert(t('alerts.success'), t('producer.compliance.batchForm.stickerVerified'));
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.compliance.batchForm.errors.verifyFailed')));
    } finally {
      setVerifying(false);
    }
  }, [selectedBatchId, stickerRollId, parcelIdForLot, t]);

  const onSave = useCallback(async () => {
    if (!selectedBatchId) {
      Alert.alert(t('error'), t('producer.compliance.batchForm.errors.selectBatchAndSticker'));
      return;
    }
    if (!stickerRollId.trim()) {
      Alert.alert(t('error'), t('producer.compliance.batchForm.errors.missingSticker'));
      return;
    }
    const ordered = COMPLIANCE_PHOTO_TYPES.map((k) => photos[k]);
    if (ordered.some((p) => !p)) {
      const missing = COMPLIANCE_PHOTO_TYPES.filter((k) => !photos[k]);
      const names = missing.map((k) => t(`producer.compliance.batchForm.photoTypes.${k}.label`)).join(', ');
      Alert.alert(t('error'), t('producer.compliance.batchForm.errors.missingPhotos', { labels: names }));
      return;
    }
    for (const p of ordered) {
      if (p) {
        try {
          assertDataUrlWithinSize(p);
        } catch {
          Alert.alert(t('error'), t('producer.compliance.batchForm.errors.photoTooLarge'));
          return;
        }
      }
    }
    setSaving(true);
    try {
      await materialControlAPI.uploadCompliancePhotos({
        batchId: selectedBatchId,
        stickerRollId: stickerRollId.trim(),
        photos: ordered as string[],
        parcelId: parcelIdForLot,
      });
      Alert.alert(t('alerts.success'), t('producer.compliance.batchForm.saveSuccess'));
      setPhotos({});
      setShowReplaceForm(false);
      await fetchStatus(selectedBatchId);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.compliance.batchForm.errors.saveFailed')));
    } finally {
      setSaving(false);
    }
  }, [selectedBatchId, stickerRollId, photos, parcelIdForLot, t, fetchStatus]);

  const showForm =
    Boolean(selectedBatchId) &&
    (complianceStatus == null || !complianceStatus.complete || showReplaceForm) &&
    !statusLoading;

  const refreshAll = useCallback(async () => {
    await loadBatches();
    await loadLabelRolls();
    if (selectedBatchId) await fetchStatus(selectedBatchId);
  }, [loadBatches, loadLabelRolls, selectedBatchId, fetchStatus]);

  return {
    totalBatchCount: batches.length,
    filteredBatches,
    parcelFilterOptions,
    parcelFilterId,
    setParcelFilterId,
    batchesLoading,
    pickableRolls,
    labelRollFilter,
    setLabelRollFilter,
    stickerRollListForUi,
    stickerRollListMeta,
    selectedBatchId,
    setSelectedBatchId: onBatchChange,
    stickerRollId,
    setStickerRollId,
    complianceStatus,
    statusLoading,
    statusError,
    photos,
    setPhotos,
    showReplaceForm,
    setShowReplaceForm,
    saving,
    verifying,
    picking,
    takePhoto,
    onVerifySticker,
    onSave,
    refetchBatches: loadBatches,
    refetchStatus: () => (selectedBatchId ? fetchStatus(selectedBatchId) : undefined),
    refreshAll,
    selectedBatch,
    showForm,
  };
}

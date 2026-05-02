import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import {
  batchesAPI,
  materialControlAPI,
  type ComplianceBatchStatus,
  type LabelRollRow,
} from '../../../lib/api';
import { assertDataUrlWithinSize, imageUriToJpegDataUrl } from '../../../lib/image-data-url';
import { apiErrorMessage } from '../../../lib/api-error';

export const COMPLIANCE_PHOTO_TYPES = ['PUNNETS', 'LABELING', 'PALLETIZATION'] as const;
export type CompliancePhotoType = (typeof COMPLIANCE_PHOTO_TYPES)[number];

export type BatchRow = { id: string; batchId: string; productName: string; quantity: number; unit?: string };

export function useMaterialCompliance() {
  const { t } = useTranslation();
  const [batches, setBatches] = useState<BatchRow[]>([]);
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

  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const data = await batchesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setBatches(
        list
          .filter((b: { id?: string }) => b?.id)
          .map((b: any) => ({
            id: b.id,
            batchId: b.batchId ?? b.id,
            productName: b.productName ?? '',
            quantity: b.quantity,
            unit: b.unit,
          })),
      );
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
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('producer.compliance.permissionsTitle'), t('producer.compliance.cameraPermissionRequired'));
        return;
      }
      setPicking(type);
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) return;
        const dataUrl = await imageUriToJpegDataUrl(result.assets[0].uri);
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
      });
      Alert.alert(t('alerts.success'), t('producer.compliance.batchForm.stickerVerified'));
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('producer.compliance.batchForm.errors.verifyFailed')));
    } finally {
      setVerifying(false);
    }
  }, [selectedBatchId, stickerRollId, t]);

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
  }, [selectedBatchId, stickerRollId, photos, t, fetchStatus]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
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
    batches,
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

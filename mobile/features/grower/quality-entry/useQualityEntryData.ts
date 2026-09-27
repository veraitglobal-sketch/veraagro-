import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkflowBatchSelection } from '../../../hooks/useWorkflowBatchSelection';
import { batchWorkflowHref } from '../../../lib/batch-workflow';
import { qualityEntryAPI, QualityEntry, batchesAPI } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';

/** Batches where a new quality entry is not applicable (web may still list them). */
const TERMINAL_BATCH_STATUSES = new Set(['DELIVERED', 'EXPIRED', 'RETURNED']);

const PARCEL_NONE_KEY = '__none__';
const PARCEL_ALL_KEY = 'all';

function batchesEligibleForQualityList(raw: BatchItem[]): BatchItem[] {
  return raw.filter((b) => {
    if (!b?.id) return false;
    if (!b.status) return true;
    return !TERMINAL_BATCH_STATUSES.has(b.status);
  });
}

function mapBatchFromApi(b: Record<string, unknown>): BatchItem {
  const parcels = b.parcels as { cropType?: string | null; publicCode?: string | null } | null | undefined;
  const estates = b.estates as { name?: string } | null | undefined;
  const parcelId = (b.parcelId as string | null | undefined) ?? undefined;
  return {
    id: String(b.id),
    batchId: b.batchId as string | undefined,
    status: b.status as string | undefined,
    productName: b.productName as string | undefined,
    quantity: typeof b.quantity === 'number' ? b.quantity : undefined,
    unit: b.unit as string | undefined,
    parcelId,
    parcels: parcels
      ? { cropType: parcels.cropType ?? undefined, publicCode: parcels.publicCode ?? undefined }
      : undefined,
    estates: estates?.name ? { name: estates.name } : undefined,
  };
}

export interface BatchItem {
  id: string;
  batchId?: string;
  status?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  parcelId?: string;
  parcels?: { cropType?: string | null; publicCode?: string | null };
  estates?: { name?: string };
}

export interface ParcelFilterOption {
  id: typeof PARCEL_ALL_KEY | typeof PARCEL_NONE_KEY | string;
  label: string;
}

export function useQualityEntryData() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  /** `all` = every plot; parcel UUID; `__none__` = lots without parcel on file */
  const [parcelFilterId, setParcelFilterId] = useState<string>(PARCEL_ALL_KEY);
  const [qualityResult, setQualityResult] = useState<{ batchId: string; entry: QualityEntry | null } | null>(null);
  const qualityRequest = useRef(0);
  const [qualityScore, setQualityScore] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [qualityError, setQualityError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const parcelFilterOptions = useMemo((): ParcelFilterOption[] => {
    const opts: ParcelFilterOption[] = [{ id: PARCEL_ALL_KEY, label: t('producer.qualityEntry.allParcels') }];
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
    try {
      setLoading(true);
      let raw: BatchItem[] = [];
      try {
        const data = await batchesAPI.getAll();
        const arr = Array.isArray(data) ? data : [];
        raw = arr.map((x) => mapBatchFromApi(x as Record<string, unknown>));
        await growerOfflineCache.saveBatches(arr);
      } catch (error) {
        console.error('Error loading batches:', error);
        const cached = await growerOfflineCache.loadBatches<Record<string, unknown>>();
        raw = (cached ?? []).map((x) => mapBatchFromApi(x));
      }
      const list = batchesEligibleForQualityList(raw);
      setBatches(list);
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const { selectedBatchId, setSelectedBatchId, missingRequestedBatch } = useWorkflowBatchSelection(filteredBatches);
  const activeBatch = useRef(selectedBatchId);
  activeBatch.current = selectedBatchId;

  const qualityEntry = qualityResult?.batchId === selectedBatchId ? qualityResult.entry : null;
  const qualityLoaded = qualityResult?.batchId === selectedBatchId;

  const loadQualityEntry = useCallback(async () => {
    if (activeBatch.current !== selectedBatchId) return;
    const request = ++qualityRequest.current;
    setQualityError(false);
    setQualityResult(null);
    setQualityScore('');
    setNotes('');
    if (!selectedBatchId) return;
    try {
      const entry = await qualityEntryAPI.getByBatch(selectedBatchId);
      if (request !== qualityRequest.current || activeBatch.current !== selectedBatchId) return;
      setQualityResult({ batchId: selectedBatchId, entry });
      if (entry) {
        setQualityScore(entry.qualityScore?.toString() || '');
        setNotes(entry.notes || '');
      } else {
        setQualityScore('');
        setNotes('');
      }
    } catch (error) {
      if (request === qualityRequest.current && activeBatch.current === selectedBatchId) setQualityError(true);
      console.error('Error loading quality entry:', error);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (selectedBatchId) {
      loadQualityEntry();
    } else {
      setQualityResult(null);
    }
    return () => { qualityRequest.current++; };
  }, [selectedBatchId, loadQualityEntry]);

  /** Only draft (or no row yet) can be edited; sent / finished rows are read-only. */
  const canEditQuality = useMemo(
    () => qualityLoaded && (!qualityEntry || qualityEntry.status === 'DRAFT'),
    [qualityEntry, qualityLoaded],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBatches(), selectedBatchId ? loadQualityEntry() : Promise.resolve()]);
    setRefreshing(false);
  }, [loadBatches, loadQualityEntry, selectedBatchId]);

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  const handleSave = useCallback(async () => {
    if (!selectedBatchId) {
      Alert.alert(t('error'), t('producer.qualityEntry.selectBatch'));
      return;
    }
    if (!canEditQuality || savingRef.current) {
      return;
    }
    const scored = qualityScore.trim();
    const parsedScore =
      scored === '' ? Number.NaN : Number.parseFloat(scored.replace(',', '.'));
    if (scored !== '' && (Number.isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100)) {
      Alert.alert(t('error'), t('producer.qualityEntry.qualityScoreRange'));
      return;
    }
    const hasScore = scored !== '' && !Number.isNaN(parsedScore);
    const hasNotes = notes.trim().length > 0;
    if (!hasScore && !hasNotes) {
      Alert.alert(t('error'), t('producer.qualityEntry.needScoreOrNotes'));
      return;
    }
    try {
      savingRef.current = true;
      setSaving(true);
      const parcelId = selectedBatch?.parcelId?.trim();
      await qualityEntryAPI.create({
        batchId: selectedBatchId,
        ...(parcelId ? { parcelId } : {}),
        qualityScore: hasScore ? parsedScore : undefined,
        notes: notes.trim() || undefined,
      });
      await loadQualityEntry();
      Alert.alert(t('alerts.success'), t('producer.qualityEntry.saveSuccessBody'), [
        {
          text: t('batchWorkflow.compliance'),
          onPress: () => {
            router.push(batchWorkflowHref('compliance', selectedBatchId));
          },
        },
      ]);
    } catch (error: unknown) {
      const ax = error as { response?: { data?: { message?: string | string[] } } };
      const fromApi = ax?.response?.data?.message;
      const apiText = Array.isArray(fromApi) ? fromApi.join(' ') : typeof fromApi === 'string' ? fromApi : null;
      const message =
        apiText || (error instanceof Error ? error.message : t('producer.qualityEntry.saveFailed'));
      Alert.alert(t('error'), message);
      console.error('Error saving quality entry:', error);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [selectedBatchId, selectedBatch, canEditQuality, saving, qualityScore, notes, loadQualityEntry, router, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return theme.colors.warning;
      case 'COMPLETED':
        return theme.colors.accent;
      case 'VERIFIED':
        return theme.colors.primary;
      case 'REJECTED':
        return theme.colors.error;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    const keys: Record<string, string> = {
      DRAFT: 'producer.qualityEntry.statusDraft',
      COMPLETED: 'producer.qualityEntry.statusCompleted',
      VERIFIED: 'producer.qualityEntry.statusVerified',
      REJECTED: 'producer.qualityEntry.statusRejected',
    };
    return keys[status] ? t(keys[status]) : status;
  };

  return {
    batches,
    filteredBatches,
    parcelFilterId,
    setParcelFilterId,
    parcelFilterOptions,
    selectedBatchId,
    setSelectedBatchId,
    missingRequestedBatch,
    selectedBatch,
    qualityEntry,
    qualityError,
    qualityScore,
    setQualityScore,
    notes,
    setNotes,
    loading,
    saving,
    refreshing,
    loadBatches,
    loadQualityEntry,
    onRefresh,
    handleSave,
    getStatusColor,
    getStatusLabel,
    canEditQuality,
  };
}

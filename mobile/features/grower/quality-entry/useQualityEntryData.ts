import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { qualityEntryAPI, QualityEntry, batchesAPI } from '../../../lib/api';
import { colors } from '../../../lib/colors';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';

/** Batches where a new quality entry is not applicable (web may still list them). */
const TERMINAL_BATCH_STATUSES = new Set(['DELIVERED', 'EXPIRED', 'RETURNED']);

function batchesEligibleForQualityList(raw: BatchItem[]): BatchItem[] {
  return raw.filter((b) => {
    if (!b?.id) return false;
    if (!b.status) return true;
    return !TERMINAL_BATCH_STATUSES.has(b.status);
  });
}

export interface BatchItem {
  id: string;
  batchId?: string;
  status?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
}

export function useQualityEntryData() {
  const { t } = useTranslation();
  const router = useRouter();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [qualityEntry, setQualityEntry] = useState<QualityEntry | null>(null);
  const [qualityScore, setQualityScore] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      let raw: BatchItem[] = [];
      try {
        const data = await batchesAPI.getAll();
        raw = Array.isArray(data) ? data : [];
        await growerOfflineCache.saveBatches(raw);
      } catch (error) {
        console.error('Error loading batches:', error);
        const cached = await growerOfflineCache.loadBatches<BatchItem>();
        raw = cached ?? [];
      }
      const list = batchesEligibleForQualityList(raw);
      setBatches(list);
      setSelectedBatchId((prev) => {
        if (prev && list.some((b) => b.id === prev)) return prev;
        return list[0]?.id ?? '';
      });
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQualityEntry = useCallback(async () => {
    if (!selectedBatchId) return;
    try {
      const entry = await qualityEntryAPI.getByBatch(selectedBatchId);
      setQualityEntry(entry);
      if (entry) {
        setQualityScore(entry.qualityScore?.toString() || '');
        setNotes(entry.notes || '');
      } else {
        setQualityScore('');
        setNotes('');
      }
    } catch (error) {
      console.error('Error loading quality entry:', error);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      loadQualityEntry();
    } else {
      setQualityEntry(null);
    }
  }, [selectedBatchId, loadQualityEntry]);

  /** Only draft (or no row yet) can be edited; sent / finished rows are read-only. */
  const canEditQuality = useMemo(
    () => !qualityEntry || qualityEntry.status === 'DRAFT',
    [qualityEntry],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBatches(), selectedBatchId ? loadQualityEntry() : Promise.resolve()]);
    setRefreshing(false);
  }, [loadBatches, loadQualityEntry, selectedBatchId]);

  const handleSave = useCallback(async () => {
    if (!selectedBatchId) {
      Alert.alert(t('error'), t('producer.qualityEntry.selectBatch'));
      return;
    }
    if (qualityEntry && qualityEntry.status !== 'DRAFT') {
      return;
    }
    if (qualityScore && (isNaN(parseFloat(qualityScore)) || parseFloat(qualityScore) < 0 || parseFloat(qualityScore) > 100)) {
      Alert.alert(t('error'), t('producer.qualityEntry.qualityScoreRange'));
      return;
    }
    try {
      setSaving(true);
      await qualityEntryAPI.create({
        batchId: selectedBatchId,
        qualityScore: qualityScore ? parseFloat(qualityScore) : undefined,
        notes: notes.trim() || undefined,
      });
      await loadQualityEntry();
      Alert.alert(t('alerts.success'), t('producer.qualityEntry.saveSuccessBody'), [
        {
          text: t('common.ok'),
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(producer)/(tabs)/shop');
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
      setSaving(false);
    }
  }, [selectedBatchId, qualityEntry, qualityScore, notes, loadQualityEntry, router, t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return colors.warning;
      case 'COMPLETED': return colors.accent;
      case 'VERIFIED': return colors.primary;
      case 'REJECTED': return colors.error;
      default: return colors.text.secondary;
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

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    selectedBatch,
    qualityEntry,
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

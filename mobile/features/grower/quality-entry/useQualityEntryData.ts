import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { qualityEntryAPI, QualityEntry, batchesAPI } from '../../../lib/api';
import { colors } from '../../../lib/colors';

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
      const data = await batchesAPI.getAll();
      const packedBatches = (data || []).filter((b: BatchItem) => b.status === 'PACKED');
      setBatches(packedBatches);
      setSelectedBatchId(prev => prev || (packedBatches[0]?.id ?? ''));
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
      Alert.alert(t('alerts.success'), t('producer.qualityEntry.saved'));
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
  }, [selectedBatchId, qualityScore, notes, loadQualityEntry]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return colors.warning;
      case 'SUBMITTED': return colors.accent;
      case 'APPROVED': return colors.primary;
      case 'REJECTED': return colors.error;
      default: return colors.text.secondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Nacrt';
      case 'SUBMITTED': return 'Poslato';
      case 'APPROVED': return 'Odobreno';
      case 'REJECTED': return 'Odbijeno';
      default: return status;
    }
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
  };
}

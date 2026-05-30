import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import type { QualityEntry } from '../../../lib/api';
import type { BatchItem } from './useQualityEntryData';
import {
  EnterpriseButton,
  EnterpriseTextField,
  EnterpriseTextArea,
  EnterprisePanel,
  dsColors,
} from '../../../design-system';

export interface QualityFormProps {
  selectedBatch: BatchItem | undefined;
  qualityEntry: QualityEntry | null;
  canEdit: boolean;
  qualityScore: string;
  setQualityScore: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  saving: boolean;
  handleSave: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export function QualityForm({
  selectedBatch,
  qualityEntry,
  canEdit,
  qualityScore,
  setQualityScore,
  notes,
  setNotes,
  saving,
  handleSave,
  getStatusColor,
  getStatusLabel,
}: QualityFormProps) {
  const { t } = useTranslation();
  if (!selectedBatch) {
    return null;
  }

  const est = selectedBatch.estates?.name?.trim();
  const crop = selectedBatch.parcels?.cropType?.trim();
  const code = selectedBatch.parcels?.publicCode?.trim();
  const bits = [est, crop, code && code !== crop ? code : null].filter(Boolean) as string[];
  const fallbackPid = selectedBatch.parcelId?.trim();
  const plotText =
    bits.length > 0
      ? bits.join(' · ')
      : fallbackPid
        ? `${fallbackPid.slice(0, 8)}…`
        : '';

  return (
    <>
      <EnterprisePanel style={styles.panel}>
        <View style={styles.batchHeader}>
          <Package size={18} color={dsColors.gray900} strokeWidth={1} />
          <Text style={styles.batchTitle}>
            {selectedBatch.productName || t('producer.qualityEntry.product')}
          </Text>
        </View>
        {plotText ? (
          <Text style={styles.plotText}>
            {t('producer.qualityEntry.linkedPlot')}: {plotText}
          </Text>
        ) : (
          <Text style={styles.plotWarn}>{t('producer.qualityEntry.noParcelOnBatch')}</Text>
        )}
        {selectedBatch.quantity != null ? (
          <Text style={styles.qtyText}>
            {selectedBatch.quantity} {selectedBatch.unit || 'kg'}
          </Text>
        ) : null}
      </EnterprisePanel>

      {qualityEntry ? (
        <EnterprisePanel style={styles.panel}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('producer.qualityEntry.statusLabel')}</Text>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(qualityEntry.status)}15` }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(qualityEntry.status) }]}>
                {getStatusLabel(qualityEntry.status)}
              </Text>
            </View>
          </View>
        </EnterprisePanel>
      ) : null}

      <EnterpriseTextField
        label={t('producer.qualityEntry.qualityScore')}
        value={qualityScore}
        onChangeText={setQualityScore}
        editable={canEdit}
        placeholder={t('producer.qualityEntry.scorePlaceholder')}
        keyboardType="numeric"
        size="farmer"
      />

      <EnterpriseTextArea
        label={t('producer.qualityEntry.notes')}
        value={notes}
        onChangeText={setNotes}
        editable={canEdit}
        placeholder={t('producer.qualityEntry.notesPlaceholder')}
        minRows={4}
      />

      {canEdit ? (
        <EnterpriseButton
          label={qualityEntry ? t('producer.qualityEntry.update') : t('producer.qualityEntry.save')}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          fullWidth
          size="large"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: dsColors.gray900,
    marginLeft: 8,
    letterSpacing: 0.3,
    flex: 1,
  },
  plotText: {
    fontSize: 13,
    color: dsColors.muted,
    lineHeight: 18,
  },
  plotWarn: {
    fontSize: 13,
    color: dsColors.destructive,
  },
  qtyText: {
    fontSize: 16,
    color: dsColors.muted,
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    color: dsColors.muted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

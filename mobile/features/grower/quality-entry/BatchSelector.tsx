import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GrowerSelectField } from '../../../components/grower/GrowerSelectField';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { BatchItem, ParcelFilterOption } from './useQualityEntryData';

export interface BatchSelectorProps {
  filteredBatches: BatchItem[];
  parcelFilterOptions: ParcelFilterOption[];
  parcelFilterId: string;
  setParcelFilterId: (id: string) => void;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  loading: boolean;
  parcelLabel?: string;
  batchLabel?: string;
}

function parcelSummaryLine(batch: BatchItem): string {
  const est = batch.estates?.name?.trim();
  const crop = batch.parcels?.cropType?.trim();
  const code = batch.parcels?.publicCode?.trim();
  const parts = [est, crop || code].filter(Boolean);
  if (parts.length > 0) return parts.join(' · ');
  if (batch.parcelId) return batch.parcelId.slice(0, 8) + '…';
  return '';
}

export function BatchSelector({
  filteredBatches,
  parcelFilterOptions,
  parcelFilterId,
  setParcelFilterId,
  selectedBatchId,
  setSelectedBatchId,
  loading,
  parcelLabel,
  batchLabel,
}: BatchSelectorProps) {
  const { t } = useTranslation();

  const parcelOptions = parcelFilterOptions.map((opt) => ({
    id: String(opt.id),
    label: opt.label,
  }));

  const batchOptions = filteredBatches.map((batch) => {
    const title = batch.batchId || (batch.id ? batch.id.slice(0, 8) : '—');
    const sub = parcelSummaryLine(batch);
    return {
      id: batch.id,
      label: title,
      subtitle: sub || undefined,
    };
  });

  return (
    <View style={styles.wrap}>
      <GrowerSelectField
        label={parcelLabel ?? t('producer.qualityEntry.parcelHeading')}
        placeholder={t('producer.select.parcel')}
        valueId={parcelFilterId}
        options={parcelOptions}
        onSelect={setParcelFilterId}
      />

      {loading ? (
        <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 16 }} />
      ) : batchOptions.length === 0 ? (
        <View style={[enterpriseUi.inAppPanel, styles.empty]}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('producer.qualityEntry.noBatches')}</Text>
        </View>
      ) : (
        <GrowerSelectField
          label={batchLabel ?? t('producer.qualityEntry.batchHeading')}
          placeholder={t('producer.select.batch')}
          valueId={selectedBatchId}
          options={batchOptions}
          onSelect={setSelectedBatchId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  batchHeading: {
    marginTop: 4,
    marginBottom: 0,
  },
  empty: {
    padding: 16,
    marginTop: 8,
  },
});

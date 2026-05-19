import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import type { BatchItem, ParcelFilterOption } from './useQualityEntryData';

export interface BatchSelectorProps {
  filteredBatches: BatchItem[];
  parcelFilterOptions: ParcelFilterOption[];
  parcelFilterId: string;
  setParcelFilterId: (id: string) => void;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  loading: boolean;
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
}: BatchSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={enterpriseUi.inAppSectionLabel}>{t('producer.qualityEntry.parcelHeading')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <View style={styles.chipRow}>
          {parcelFilterOptions.map((opt) => {
            const sel = parcelFilterId === opt.id;
            return (
              <TouchableOpacity
                key={String(opt.id)}
                onPress={() => setParcelFilterId(String(opt.id))}
                style={[growerUi.filterChip, sel && growerUi.filterChipOn]}
              >
                <Text
                  style={[growerUi.filterChipText, sel && growerUi.filterChipTextOn]}
                  numberOfLines={2}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={[enterpriseUi.inAppSectionLabel, styles.batchHeading]}>
        {t('producer.qualityEntry.batchHeading')}
      </Text>
      {loading ? (
        <ActivityIndicator color={enterpriseColors.primary} style={{ marginVertical: 16 }} />
      ) : filteredBatches.length === 0 ? (
        <View style={[enterpriseUi.inAppPanel, styles.empty]}>
          <Text style={enterpriseUi.navRowSubtitle}>{t('producer.qualityEntry.noBatches')}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {filteredBatches.map((batch) => {
              const sel = selectedBatchId === batch.id;
              return (
                <TouchableOpacity
                  key={batch.id}
                  onPress={() => setSelectedBatchId(batch.id)}
                  style={[styles.batchChip, growerUi.filterChip, sel && growerUi.filterChipOn]}
                >
                  <Text
                    style={[growerUi.filterChipText, sel && growerUi.filterChipTextOn]}
                    numberOfLines={2}
                  >
                    {batch.batchId || (batch.id ? batch.id.slice(0, 8) : '')}
                  </Text>
                  {parcelSummaryLine(batch).length > 0 ? (
                    <Text style={[enterpriseUi.navRowSubtitle, styles.batchSub]} numberOfLines={2}>
                      {parcelSummaryLine(batch)}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  chipScroll: {
    marginTop: 8,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  batchHeading: {
    marginTop: 4,
  },
  batchChip: {
    maxWidth: 200,
    alignItems: 'flex-start',
  },
  batchSub: {
    marginTop: 4,
    fontSize: 13,
  },
  empty: {
    padding: 16,
  },
});

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
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
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}
      >
        {t('producer.qualityEntry.parcelHeading')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {parcelFilterOptions.map((opt) => {
            const sel = parcelFilterId === opt.id;
            return (
              <TouchableOpacity
                key={String(opt.id)}
                onPress={() => setParcelFilterId(String(opt.id))}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: sel ? colors.primary : colors.border,
                  backgroundColor: sel ? `${colors.primary}10` : colors.background,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: sel ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.2,
                    maxWidth: 260,
                  }}
                  numberOfLines={2}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text
        style={{
          fontSize: 16,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}
      >
        {t('producer.qualityEntry.batchHeading')}
      </Text>
      {loading ? (
        <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : filteredBatches.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 0.5,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '300', color: colors.text.secondary }}>
            {t('producer.qualityEntry.noBatches')}
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {filteredBatches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                onPress={() => setSelectedBatchId(batch.id)}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: selectedBatchId === batch.id ? colors.primary : colors.border,
                  backgroundColor: selectedBatchId === batch.id ? `${colors.primary}10` : colors.background,
                  maxWidth: 200,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: selectedBatchId === batch.id ? colors.primary : colors.text.secondary,
                    letterSpacing: 0.3,
                  }}
                  numberOfLines={2}
                >
                  {batch.batchId || (batch.id ? batch.id.slice(0, 8) : '')}
                </Text>
                {parcelSummaryLine(batch).length > 0 ? (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '300',
                      color: colors.text.tertiary,
                      marginTop: 4,
                      letterSpacing: 0.2,
                    }}
                    numberOfLines={2}
                  >
                    {parcelSummaryLine(batch)}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

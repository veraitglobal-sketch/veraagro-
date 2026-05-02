import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { BatchItem } from './useQualityEntryData';

export interface BatchSelectorProps {
  batches: BatchItem[];
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  loading: boolean;
}

/**
 * Horizontal list of non-terminal batches (same idea as web — not only PACKED).
 * Receives data from useQualityEntryData (call hook in parent and pass props).
 */
export function BatchSelector({
  batches,
  selectedBatchId,
  setSelectedBatchId,
  loading,
}: BatchSelectorProps) {
  const { t } = useTranslation();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '300',
        color: colors.text.secondary,
        marginBottom: theme.spacing.xs,
        letterSpacing: 0.3,
      }}>
        {t('producer.qualityEntry.batchHeading')}
      </Text>
      {loading ? (
        <View style={{ padding: theme.spacing.md, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : batches.length === 0 ? (
        <View style={{
          backgroundColor: colors.background,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: colors.border,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.secondary,
          }}>
            {t('producer.qualityEntry.noBatches')}
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {batches.map((batch) => (
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
                }}
              >
                <Text style={{
                  fontSize: 15,
                  fontWeight: '300',
                  color: selectedBatchId === batch.id ? colors.primary : colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {batch.batchId || batch.id.slice(0, 8)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

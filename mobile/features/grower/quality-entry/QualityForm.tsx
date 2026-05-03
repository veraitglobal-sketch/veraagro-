import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { QualityEntry } from '../../../lib/api';
import type { BatchItem } from './useQualityEntryData';

export interface QualityFormProps {
  selectedBatch: BatchItem | undefined;
  qualityEntry: QualityEntry | null;
  /** When false, score/notes are read-only (entry already submitted / completed). */
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

/**
 * Form for quality score and notes; shows batch info and status.
 * Receives data from useQualityEntryData (call hook in parent and pass props).
 */
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

  return (
    <>
      {/* Batch Info */}
      <View style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <Package size={18} color={colors.text.primary} strokeWidth={1} />
          <Text style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}>
            {selectedBatch.productName || t('producer.qualityEntry.product')}
          </Text>
        </View>
        {(() => {
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
          if (plotText) {
            return (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginTop: theme.spacing.xs,
                  lineHeight: 18,
                }}
              >
                {t('producer.qualityEntry.linkedPlot')}
                {': '}
                {plotText}
              </Text>
            );
          }
          return (
            <Text
              style={{
                fontSize: 13,
                fontWeight: '300',
                color: colors.warning,
                marginTop: theme.spacing.xs,
              }}
            >
              {t('producer.qualityEntry.noParcelOnBatch')}
            </Text>
          );
        })()}
        {selectedBatch.quantity != null && (
          <Text style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.secondary,
            marginTop: theme.spacing.sm,
          }}>
            {selectedBatch.quantity} {selectedBatch.unit || 'kg'}
          </Text>
        )}
      </View>

      {/* Quality Entry Status */}
      {qualityEntry && (
        <View style={{
          backgroundColor: colors.background,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.secondary,
            }}>
              {t('producer.qualityEntry.statusLabel')}
            </Text>
            <View style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 4,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: `${getStatusColor(qualityEntry.status)}15`,
            }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '300',
                color: getStatusColor(qualityEntry.status),
                letterSpacing: 0.3,
              }}>
                {getStatusLabel(qualityEntry.status)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quality Score */}
      <View style={{ marginBottom: theme.spacing.md }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}>
          {t('producer.qualityEntry.qualityScore')}
        </Text>
        <TextInput
          value={qualityScore}
          onChangeText={setQualityScore}
          editable={canEdit}
          placeholder={t('producer.qualityEntry.scorePlaceholder')}
          keyboardType="numeric"
          style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            borderWidth: 0.5,
            borderColor: colors.border,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
            backgroundColor: canEdit ? colors.background : colors.surface,
            opacity: canEdit ? 1 : 0.85,
          }}
        />
      </View>

      {/* Notes */}
      <View style={{ marginBottom: theme.spacing.md }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}>
          {t('producer.qualityEntry.notes')}
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          editable={canEdit}
          placeholder={t('producer.qualityEntry.notesPlaceholder')}
          multiline
          numberOfLines={4}
          style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            borderWidth: 0.5,
            borderColor: colors.border,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
            backgroundColor: canEdit ? colors.background : colors.surface,
            minHeight: 100,
            textAlignVertical: 'top',
            opacity: canEdit ? 1 : 0.85,
          }}
        />
      </View>

      {/* Save Button */}
      {canEdit && (
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.md,
            backgroundColor: colors.primary,
            alignItems: 'center',
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={{
              fontSize: 15,
              fontWeight: '300',
              color: colors.background,
              letterSpacing: 0.3,
            }}>
              {qualityEntry ? t('producer.qualityEntry.update') : t('producer.qualityEntry.save')}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </>
  );
}

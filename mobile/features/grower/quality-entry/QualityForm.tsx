import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Package } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { QualityEntry } from '../../../lib/api';
import type { BatchItem } from './useQualityEntryData';

export interface QualityFormProps {
  selectedBatch: BatchItem | undefined;
  qualityEntry: QualityEntry | null;
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
  qualityScore,
  setQualityScore,
  notes,
  setNotes,
  saving,
  handleSave,
  getStatusColor,
  getStatusLabel,
}: QualityFormProps) {

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
            {selectedBatch.productName || 'Proizvod'}
          </Text>
        </View>
        {selectedBatch.quantity != null && (
          <Text style={{
            fontSize: 13,
            fontWeight: '300',
            color: colors.text.secondary,
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
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
            }}>
              Status
            </Text>
            <View style={{
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: 4,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: `${getStatusColor(qualityEntry.status)}15`,
            }}>
              <Text style={{
                fontSize: 12,
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
          fontSize: 13,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}>
          Ocena kvaliteta (0-100, opciono)
        </Text>
        <TextInput
          value={qualityScore}
          onChangeText={setQualityScore}
          placeholder="npr. 85"
          keyboardType="numeric"
          style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            borderWidth: 0.5,
            borderColor: colors.border,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
            backgroundColor: colors.background,
          }}
        />
      </View>

      {/* Notes */}
      <View style={{ marginBottom: theme.spacing.md }}>
        <Text style={{
          fontSize: 13,
          fontWeight: '300',
          color: colors.text.secondary,
          marginBottom: theme.spacing.xs,
          letterSpacing: 0.3,
        }}>
          Napomene (opciono)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Dodatne napomene o kvalitetu..."
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
            backgroundColor: colors.background,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
        />
      </View>

      {/* Save Button */}
      {(!qualityEntry || qualityEntry.status === 'DRAFT') && (
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
              {qualityEntry ? 'Ažuriraj' : 'Sačuvaj'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </>
  );
}

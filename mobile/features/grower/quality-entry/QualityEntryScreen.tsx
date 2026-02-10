import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useQualityEntryData } from './useQualityEntryData';
import { BatchSelector } from './BatchSelector';
import { QualityForm } from './QualityForm';

/**
 * Quality entry screen: batch selection + form for quality score and notes.
 * Uses useQualityEntryData once and passes data to BatchSelector and QualityForm.
 */
export function QualityEntryScreen() {
  const router = useRouter();
  const data = useQualityEntryData();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4 border-b-[0.5px] flex-row items-center"
        style={{
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text
          className="text-lg flex-1"
          style={{
            color: colors.text.primary,
            fontWeight: '300',
            letterSpacing: 0.5,
          }}
        >
          Unos Kvaliteta
        </Text>
        {data.qualityEntry && (
          <TouchableOpacity
            onPress={data.handleSave}
            disabled={data.saving}
          >
            {data.saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Save size={24} color={colors.primary} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={data.refreshing}
            onRefresh={data.onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          <BatchSelector
            batches={data.batches}
            selectedBatchId={data.selectedBatchId}
            setSelectedBatchId={data.setSelectedBatchId}
            loading={data.loading}
          />
          <QualityForm
            selectedBatch={data.selectedBatch}
            qualityEntry={data.qualityEntry}
            qualityScore={data.qualityScore}
            setQualityScore={data.setQualityScore}
            notes={data.notes}
            setNotes={data.setNotes}
            saving={data.saving}
            handleSave={data.handleSave}
            getStatusColor={data.getStatusColor}
            getStatusLabel={data.getStatusLabel}
          />
        </View>
      </ScrollView>
    </View>
  );
}

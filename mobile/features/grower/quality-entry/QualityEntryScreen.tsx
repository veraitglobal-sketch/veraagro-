import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Save } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useQualityEntryData } from './useQualityEntryData';
import { BatchSelector } from './BatchSelector';
import { QualityForm } from './QualityForm';

/**
 * Quality entry screen: batch selection + form for quality score and notes.
 * Uses useQualityEntryData once and passes data to BatchSelector and QualityForm.
 */
export function QualityEntryScreen() {
  const data = useQualityEntryData();
  const p = useBioVeraScreenPadding();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BioVeraSubpageHeader
        title="Unos Kvaliteta"
        left="back"
        right={
          data.qualityEntry ? (
            <TouchableOpacity onPress={data.handleSave} disabled={data.saving} hitSlop={8}>
              {data.saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Save size={24} color={colors.primary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
          ) : null
        }
      />

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
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.md),
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
          }}
        >
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

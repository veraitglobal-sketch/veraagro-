import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Save } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useBioVeraScreenPadding } from '../../../lib/screen-insets';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useQualityEntryData } from './useQualityEntryData';
import { BatchSelector } from './BatchSelector';
import { QualityForm } from './QualityForm';
import { BatchWorkflowActions } from '../batches/BatchWorkflowActions';

/**
 * Quality entry screen: batch selection + form for quality score and notes.
 * Uses useQualityEntryData once and passes data to BatchSelector and QualityForm.
 */
export function QualityEntryScreen() {
  const { t } = useTranslation();
  const data = useQualityEntryData();
  const p = useBioVeraScreenPadding();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <BioVeraSubpageHeader
        title={t('producer.qualityEntry.title')}
        left="back"
        right={
          data.canEditQuality ? (
            <TouchableOpacity onPress={data.handleSave} disabled={data.saving} hitSlop={8}>
              {data.saving ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Save size={24} color={theme.colors.primary} strokeWidth={1.5} />
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
            tintColor={theme.colors.primary}
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
          {data.missingRequestedBatch && !data.loading ? (
            <Text style={{ color: theme.colors.text.secondary }}>{t('batchWorkflow.unavailable')}</Text>
          ) : null}
          <BatchSelector
            filteredBatches={data.filteredBatches}
            parcelFilterOptions={data.parcelFilterOptions}
            parcelFilterId={data.parcelFilterId}
            setParcelFilterId={data.setParcelFilterId}
            selectedBatchId={data.selectedBatchId}
            setSelectedBatchId={data.setSelectedBatchId}
            loading={data.loading}
          />
          <QualityForm
            selectedBatch={data.selectedBatch}
            qualityEntry={data.qualityEntry}
            canEdit={data.canEditQuality}
            qualityScore={data.qualityScore}
            setQualityScore={data.setQualityScore}
            notes={data.notes}
            setNotes={data.setNotes}
            saving={data.saving}
            handleSave={data.handleSave}
            getStatusColor={data.getStatusColor}
            getStatusLabel={data.getStatusLabel}
          />
          {data.selectedBatchId && data.qualityError ? (
            <TouchableOpacity onPress={() => void data.loadQualityEntry()} accessibilityRole="button">
              <Text style={{ color: theme.colors.error }}>{t('batchWorkflow.qualityLoadFailed')} {t('common.tryAgain')}</Text>
            </TouchableOpacity>
          ) : null}
          {data.qualityEntry && ['COMPLETED', 'VERIFIED'].includes(data.qualityEntry.status) ? (
            <BatchWorkflowActions batchId={data.selectedBatchId} steps={['labels', 'compliance', 'detail']} />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { useBatchDetailData } from './useBatchDetailData';
import BatchDetailHeader from './BatchDetailHeader';
import BatchHeaderBlock from './BatchHeaderBlock';
import BatchProductBlock from './BatchProductBlock';
import TraceabilityBlock from './TraceabilityBlock';
import LocationHistoryBlock from './LocationHistoryBlock';
import QualityIssuesBlock from './QualityIssuesBlock';
import { BatchHarvestContext } from './BatchHarvestContext';
import { BatchWorkflowActions } from './BatchWorkflowActions';

interface BatchDetailScreenProps {
  batchId: string | undefined;
}

export default function BatchDetailScreen({ batchId }: BatchDetailScreenProps) {
  const { t } = useTranslation();
  const locale = useAppLocaleTag();
  const { batch, loading, onRefresh } = useBatchDetailData(batchId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch {
      Alert.alert(t('common.error'), t('common.tryAgain'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !batch) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{t('producer.batches.loading')}</Text>
      </View>
    );
  }
  if (!batch) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text.secondary, fontSize: 13 }}>{t('producer.batches.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <BatchDetailHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={{ padding: theme.spacing.md }}>
          <BatchHeaderBlock batch={batch} />
          <BatchProductBlock batch={batch} />
          <Text style={{ color: theme.colors.text.secondary, fontSize: 12.5, lineHeight: 17, marginBottom: 14, marginHorizontal: 4 }}>
            {batch.packing?.completedAt
              ? t('batchWorkflow.packingSaved', { at: new Date(batch.packing.completedAt).toLocaleString(locale) })
              : t('batchWorkflow.packingNotSaved')}
          </Text>
          <BatchHarvestContext key={batch.id || batch.batchId} batchId={batch.id || batch.batchId} />
          <BatchWorkflowActions batchId={batch.id || batch.batchId || batchId}
            steps={['packing', 'labels', 'quality', 'compliance', 'transport']} />
          <TraceabilityBlock batch={batch} />
          <LocationHistoryBlock locationHistory={batch.locationHistory} />
          <QualityIssuesBlock qualityIssues={batch.qualityIssues} />
        </View>
      </ScrollView>
    </View>
  );
}

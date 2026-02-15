import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useBatchDetailData } from './useBatchDetailData';
import BatchDetailHeader from './BatchDetailHeader';
import BatchHeaderBlock from './BatchHeaderBlock';
import BatchProductBlock from './BatchProductBlock';
import TraceabilityBlock from './TraceabilityBlock';
import LocationHistoryBlock from './LocationHistoryBlock';
import QualityIssuesBlock from './QualityIssuesBlock';

interface BatchDetailScreenProps {
  batchId: string | undefined;
}

export default function BatchDetailScreen({ batchId }: BatchDetailScreenProps) {
  const { t } = useTranslation();
  const { batch, loading, onRefresh } = useBatchDetailData(batchId);
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (loading && !batch) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>{t('producer.batches.loading')}</Text>
      </View>
    );
  }
  if (!batch) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary, fontSize: 13 }}>{t('producer.batches.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <BatchDetailHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={{ padding: theme.spacing.md }}>
          <BatchHeaderBlock batch={batch} />
          <BatchProductBlock batch={batch} />
          <TraceabilityBlock batch={batch} />
          <LocationHistoryBlock locationHistory={batch.locationHistory} />
          <QualityIssuesBlock qualityIssues={batch.qualityIssues} />
        </View>
      </ScrollView>
    </View>
  );
}

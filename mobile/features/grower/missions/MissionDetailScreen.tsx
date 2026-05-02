import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import { useMissionDetailData } from './useMissionDetailData';
import MissionHeader from './MissionHeader';
import MissionInfoBlock from './MissionInfoBlock';
import BatchInfoBlock from './BatchInfoBlock';
import JourneyMapBlock from './JourneyMapBlock';
import TimelineBlock from './TimelineBlock';
import ConsumerFeedbackBlock from './ConsumerFeedbackBlock';
import FinancialStatusBlock from './FinancialStatusBlock';
import LogisticsMissionLifecycleBar from './LogisticsMissionLifecycleBar';

interface MissionDetailScreenProps {
  missionId: string | undefined;
  /** Logistics app: show status advance controls for the grower journey map. */
  variant?: 'grower' | 'logistics';
}

export default function MissionDetailScreen({ missionId, variant = 'grower' }: MissionDetailScreenProps) {
  const { t } = useTranslation();
  const {
    mission,
    journeyMap,
    consumerFeedback,
    financialStatus,
    loading,
    onRefresh,
  } = useMissionDetailData(missionId);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (loading && !mission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.text.secondary, fontSize: 17, fontWeight: '500' }}>{t('producer.missions.loading')}</Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.text.secondary, fontSize: 17, fontWeight: '500', textAlign: 'center', paddingHorizontal: 24 }}>
          {t('producer.missions.notFound')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <MissionHeader />
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ padding: theme.spacing.md }}>
          <MissionInfoBlock mission={mission} />
          <BatchInfoBlock mission={mission} />
          {variant === 'logistics' && (
            <LogisticsMissionLifecycleBar mission={mission} onUpdated={onRefresh} />
          )}
          <JourneyMapBlock journeyMap={journeyMap} />
          <TimelineBlock mission={mission} />
          <ConsumerFeedbackBlock feedback={consumerFeedback} />
          <FinancialStatusBlock financial={financialStatus} />
        </View>
      </ScrollView>
    </View>
  );
}

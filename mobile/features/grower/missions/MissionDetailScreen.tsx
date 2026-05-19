import { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { enterpriseColors } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useMissionDetailData } from './useMissionDetailData';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import MissionInfoBlock from './MissionInfoBlock';
import MissionLogisticsBlock from './MissionLogisticsBlock';
import BatchInfoBlock from './BatchInfoBlock';
import JourneyMapBlock from './JourneyMapBlock';
import TimelineBlock from './TimelineBlock';
import ConsumerFeedbackBlock from './ConsumerFeedbackBlock';
import FinancialStatusBlock from './FinancialStatusBlock';
import LogisticsMissionLifecycleBar from './LogisticsMissionLifecycleBar';
import LogisticsClaimMissionBlock from './LogisticsClaimMissionBlock';

interface MissionDetailScreenProps {
  missionId: string | undefined;
  variant?: 'grower' | 'logistics';
}

export default function MissionDetailScreen({ missionId, variant = 'grower' }: MissionDetailScreenProps) {
  const { t } = useTranslation();
  const { mission, journeyMap, consumerFeedback, financialStatus, loading, onRefresh } =
    useMissionDetailData(missionId);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  if (loading && !mission) {
    return (
      <View style={[growerUi.canvas, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={enterpriseColors.primary} />
        <Text style={[growerUi.pageLead, { marginTop: 12 }]}>{t('producer.missions.loading')}</Text>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={[growerUi.canvas, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={[growerUi.pageLead, { textAlign: 'center' }]}>{t('producer.missions.notFound')}</Text>
      </View>
    );
  }

  const title =
    mission.missionNumber || t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) });

  return (
    <EnterpriseScreen
      withTopWash
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentPaddingBottom={32}
      header={<GrowerStackHeader title={title} />}
    >
      <View style={growerUi.scrollContent}>
        <MissionInfoBlock mission={mission} />
        <MissionLogisticsBlock mission={mission} />
        <BatchInfoBlock mission={mission} />
        {variant === 'logistics' && (
          <>
            <LogisticsClaimMissionBlock mission={mission} onClaimed={onRefresh} />
            <LogisticsMissionLifecycleBar mission={mission} onUpdated={onRefresh} />
          </>
        )}
        <JourneyMapBlock journeyMap={journeyMap} />
        <TimelineBlock mission={mission} />
        <ConsumerFeedbackBlock feedback={consumerFeedback} />
        <FinancialStatusBlock financial={financialStatus} />
      </View>
    </EnterpriseScreen>
  );
}

import { useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { deliveryStatusLabel } from '../../../../shared/i18n/labels';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { useMissionDetailData } from './useMissionDetailData';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { EnterpriseScreen } from '../../../components/enterprise/EnterpriseScreen';
import MissionInfoBlock from './MissionInfoBlock';
import MissionLogisticsBlock from './MissionLogisticsBlock';
import { LogisticsAssignDriverBlock } from './LogisticsAssignDriverBlock';
import BatchInfoBlock from './BatchInfoBlock';
import JourneyMapBlock from './JourneyMapBlock';
import TimelineBlock from './TimelineBlock';
import ConsumerFeedbackBlock from './ConsumerFeedbackBlock';
import FinancialStatusBlock from './FinancialStatusBlock';
import LogisticsMissionLifecycleBar from './LogisticsMissionLifecycleBar';
import LogisticsClaimMissionBlock from './LogisticsClaimMissionBlock';
import { useRouter } from 'expo-router';
import { EnterpriseButton } from '../../../design-system/EnterpriseButton';

interface MissionDetailScreenProps {
  missionId: string | undefined;
  variant?: 'grower' | 'logistics';
}

export default function MissionDetailScreen({ missionId, variant = 'grower' }: MissionDetailScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { mission, journeyMap, consumerFeedback, financialStatus, loading, onRefresh } =
    useMissionDetailData(missionId);

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
        <MissionLogisticsBlock mission={mission} viewer={variant} />
        <BatchInfoBlock mission={mission} />
        {variant === 'logistics' && (
          <>
            <LogisticsClaimMissionBlock mission={mission} onClaimed={onRefresh} />
            <LogisticsAssignDriverBlock mission={mission} onChanged={onRefresh} />
            <LogisticsMissionLifecycleBar mission={mission} onUpdated={onRefresh} />
            {mission.delivery ? (
              <View style={[enterpriseUi.inAppPanel, { padding: 14, gap: 10, marginBottom: 10 }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 0.9, textTransform: 'uppercase', color: '#6B7A67' }}>
                  {t('logistics.delivery.title')}
                </Text>
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: enterpriseColors.gray900 }}>
                  {mission.delivery.deliveryNumber}
                  <Text style={{ fontWeight: '400', color: enterpriseColors.gray600 }}>
                    {' · '}
                    {deliveryStatusLabel(t, mission.delivery.status, 'logistics')}
                  </Text>
                </Text>
                {mission.delivery.status === 'IN_TRANSIT' && !mission.delivery.digital_handovers ? (
                  <EnterpriseButton
                    label={t('handover.initTitle')}
                    onPress={() => router.push({ pathname: '/driver/handover-initiate', params: { deliveryId: mission.delivery!.id } })}
                  />
                ) : null}
                {mission.delivery.digital_handovers ? (
                  <Text style={{ fontSize: 13, color: enterpriseColors.gray700 }}>
                    {t('logistics.delivery.handover')}:{' '}
                    {t(`logistics.delivery.handoverStatus.${mission.delivery.digital_handovers.status}`, {
                      defaultValue: mission.delivery.digital_handovers.status,
                    })}
                  </Text>
                ) : null}
              </View>
            ) : null}
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

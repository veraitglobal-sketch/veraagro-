import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react-native';
import type { Mission } from '../../../lib/api';
import { missionStatusEnterpriseTone } from '../../../lib/mission-status';
import { growerStyles } from '../../../lib/grower-ui';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { getStatusLabel } from './useMissionDetailData';
import { MissionDetailSection } from './MissionDetailSection';
import {
  formatDriverName,
  missionAssignedDriverFromApi,
  missionLogisticsPartnerLabel,
} from '../../../lib/mission-logistics';

interface MissionInfoBlockProps {
  mission: Mission;
}

export default function MissionInfoBlock({ mission }: MissionInfoBlockProps) {
  const { t } = useTranslation();
  const tone = missionStatusEnterpriseTone(mission.status);
  const raw = mission as unknown as Record<string, unknown>;
  const driverName = formatDriverName(missionAssignedDriverFromApi(raw));
  const partnerLabel = missionLogisticsPartnerLabel(raw);
  const status = String(mission.status ?? '').toUpperCase();

  let assignmentLine: string | null = null;
  if (driverName) {
    assignmentLine = t('producer.missions.assignmentLineDriver', { name: driverName });
  } else if (partnerLabel && status !== 'PENDING') {
    assignmentLine = t('producer.missions.assignmentLineCarrier', { name: partnerLabel });
  } else if (status === 'PENDING') {
    assignmentLine = t('producer.missions.assignmentLinePending');
  }

  return (
    <MissionDetailSection
      title={t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) })}
      icon={Truck}
    >
      <View style={styles.row}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('producer.missions.statusFieldLabel')}</Text>
        <View style={[growerStyles.statusPill, { backgroundColor: tone.bg }]}>
          <Text style={[growerStyles.statusPillText, { color: tone.text }]}>
            {getStatusLabel(mission.status, t)}
          </Text>
        </View>
      </View>
      {status === 'AWAITING_APPROVAL' ? (
        <Text style={styles.awaitingBanner}>{t('producer.missions.awaitingAdminApproval')}</Text>
      ) : null}
      {assignmentLine ? (
        <Text style={styles.assignmentLine}>{assignmentLine}</Text>
      ) : null}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  assignmentLine: {
    fontSize: 14.5,
    fontWeight: '600',
    color: enterpriseColors.primary,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  awaitingBanner: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    lineHeight: 18,
    marginBottom: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: enterpriseColors.gray100,
    borderRadius: 10,
  },
});

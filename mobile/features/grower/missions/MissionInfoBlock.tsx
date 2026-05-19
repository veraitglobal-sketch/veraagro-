import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react-native';
import type { Mission } from '../../../lib/api';
import { missionStatusEnterpriseTone } from '../../../lib/mission-status';
import { growerStyles } from '../../../lib/grower-ui';
import { enterpriseUi } from '../../../lib/enterprise-ui';
import { getStatusLabel } from './useMissionDetailData';
import { MissionDetailSection } from './MissionDetailSection';

interface MissionInfoBlockProps {
  mission: Mission;
}

export default function MissionInfoBlock({ mission }: MissionInfoBlockProps) {
  const { t } = useTranslation();
  const tone = missionStatusEnterpriseTone(mission.status);

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
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});

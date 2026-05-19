import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Clock } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { Mission } from '../../../lib/api';
import { isMissionCompletedSuccess } from '../../../lib/mission-status';
import {
  formatDriverName,
  missionAssignedDriverFromApi,
  missionShowsDriverBlock,
} from '../../../lib/mission-logistics';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { MissionDetailSection } from './MissionDetailSection';

interface TimelineBlockProps {
  mission: Mission;
}

const dateFormat = {
  day: '2-digit' as const,
  month: '2-digit' as const,
  year: 'numeric' as const,
  hour: '2-digit' as const,
  minute: '2-digit' as const,
};

function TimelineRow({
  title,
  detail,
  icon: Icon,
  lineColor,
}: {
  title: string;
  detail?: ReactNode;
  icon?: typeof Calendar;
  lineColor: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: lineColor }]} />
      <View style={styles.copy}>
        <Text style={enterpriseUi.navRowTitle}>{title}</Text>
        {detail ? (
          <View style={styles.detailRow}>
            {Icon ? <Icon size={14} color={enterpriseColors.gray600} strokeWidth={1.5} /> : null}
            {typeof detail === 'string' ? (
              <Text style={enterpriseUi.navRowSubtitle}>{detail}</Text>
            ) : (
              detail
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function TimelineBlock({ mission }: TimelineBlockProps) {
  const { t } = useTranslation();
  const driverName = formatDriverName(missionAssignedDriverFromApi(mission as unknown as Record<string, unknown>));
  const showDriver = missionShowsDriverBlock(mission.status) && Boolean(driverName);
  const dateLocale = useAppLocaleTag();

  return (
    <MissionDetailSection title={t('producer.missions.timelineTitle')}>
      <TimelineRow
        title={t('producer.missions.created')}
        lineColor={enterpriseColors.primary}
        icon={Calendar}
        detail={new Date(mission.createdAt).toLocaleDateString(dateLocale, dateFormat)}
      />
      {showDriver ? (
        <TimelineRow
          title={t('producer.missions.assignedToDriver')}
          lineColor={enterpriseColors.gray900}
          icon={User}
          detail={driverName}
        />
      ) : null}
      {mission.status === 'IN_TRANSIT' ? (
        <TimelineRow
          title={t('producer.missions.inTransit')}
          lineColor={enterpriseColors.primary}
          detail={t('producer.missions.enRouteToDestination')}
        />
      ) : null}
      {isMissionCompletedSuccess(mission.status) ? (
        <TimelineRow
          title={t('producer.missions.delivered')}
          lineColor={enterpriseColors.primary}
          icon={Clock}
          detail={
            mission.updatedAt
              ? new Date(mission.updatedAt).toLocaleDateString(dateLocale, dateFormat)
              : undefined
          }
        />
      ) : null}
    </MissionDetailSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  line: {
    width: 3,
    borderRadius: 2,
    minHeight: 44,
    marginTop: 4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
});

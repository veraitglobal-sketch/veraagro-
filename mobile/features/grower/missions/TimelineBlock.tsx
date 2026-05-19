import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Clock, Building2 } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import type { Mission } from '../../../lib/api';
import { isMissionCompletedSuccess } from '../../../lib/mission-status';
import {
  formatDriverName,
  missionAssignedDriverFromApi,
  missionLogisticsPartnerLabel,
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
  const raw = mission as unknown as Record<string, unknown>;
  const driverName = formatDriverName(missionAssignedDriverFromApi(raw));
  const partnerLabel = missionLogisticsPartnerLabel(raw);
  const showLogistics = missionShowsDriverBlock(mission.status);
  const dateLocale = useAppLocaleTag();

  return (
    <MissionDetailSection title={t('producer.missions.timelineTitle')}>
      <TimelineRow
        title={t('producer.missions.created')}
        lineColor={enterpriseColors.primary}
        icon={Calendar}
        detail={new Date(mission.createdAt).toLocaleDateString(dateLocale, dateFormat)}
      />
      {showLogistics && partnerLabel ? (
        <TimelineRow
          title={t('producer.missions.assignedToCarrier')}
          lineColor={enterpriseColors.gray900}
          icon={Building2}
          detail={partnerLabel}
        />
      ) : null}
      {showLogistics && driverName ? (
        <TimelineRow
          title={t('producer.missions.assignedToDriver')}
          lineColor={enterpriseColors.primary}
          icon={User}
          detail={driverName}
        />
      ) : showLogistics && partnerLabel ? (
        <TimelineRow
          title={t('producer.missions.driverPendingTitle')}
          lineColor={enterpriseColors.gray600}
          icon={User}
          detail={t('producer.missions.driverPendingDetail')}
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

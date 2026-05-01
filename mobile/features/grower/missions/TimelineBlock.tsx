import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar, User, Truck, Clock } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Mission } from '../../../lib/api';
import { isMissionCompletedSuccess } from '../../../lib/mission-status';
import { useAppLocaleTag } from '../../../lib/date-locale';

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

export default function TimelineBlock({ mission }: TimelineBlockProps) {
  const { t } = useTranslation();
  const driver = mission.driver as { firstName?: string; lastName?: string } | undefined;
  const dateLocale = useAppLocaleTag();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: '300',
          color: colors.text.primary,
          marginBottom: theme.spacing.md,
          letterSpacing: 0.3,
        }}
      >
        {t('producer.missions.timelineTitle')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View
            style={{
              width: 2,
              height: 40,
              backgroundColor: colors.primary,
              marginRight: theme.spacing.sm,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}
            >
              {t('producer.missions.created')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Calendar size={11} color={colors.text.secondary} strokeWidth={1} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: colors.text.secondary,
                  marginLeft: 4,
                }}
              >
                {new Date(mission.createdAt).toLocaleDateString(dateLocale, dateFormat)}
              </Text>
            </View>
          </View>
        </View>
        {mission.status === 'ASSIGNED' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                width: 2,
                height: 40,
                backgroundColor: colors.accent,
                marginRight: theme.spacing.sm,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}
              >
                {t('producer.missions.assignedToDriver')}
              </Text>
              {driver && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <User size={11} color={colors.text.secondary} strokeWidth={1} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}
                  >
                    {driver.firstName} {driver.lastName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        {mission.status === 'IN_TRANSIT' && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                width: 2,
                height: 40,
                backgroundColor: colors.primary,
                marginRight: theme.spacing.sm,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}
              >
                {t('producer.missions.inTransit')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Truck size={11} color={colors.text.secondary} strokeWidth={1} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '300',
                    color: colors.text.secondary,
                    marginLeft: 4,
                  }}
                >
                  {t('producer.missions.enRouteToDestination')}
                </Text>
              </View>
            </View>
          </View>
        )}
        {isMissionCompletedSuccess(mission.status) && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View
              style={{
                width: 2,
                height: 40,
                backgroundColor: colors.success || colors.primary,
                marginRight: theme.spacing.sm,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}
              >
                {t('producer.missions.delivered')}
              </Text>
              {mission.updatedAt && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Clock size={11} color={colors.text.secondary} strokeWidth={1} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '300',
                      color: colors.text.secondary,
                      marginLeft: 4,
                    }}
                  >
                    {new Date(mission.updatedAt).toLocaleDateString(dateLocale, dateFormat)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

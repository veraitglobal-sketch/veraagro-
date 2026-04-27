import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Truck } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Mission } from '../../../lib/api';
import { getStatusColor, getStatusLabel } from './useMissionDetailData';

interface MissionInfoBlockProps {
  mission: Mission;
}

export default function MissionInfoBlock({ mission }: MissionInfoBlockProps) {
  const { t } = useTranslation();
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Truck size={18} color={colors.text.primary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          {t('producer.missions.missionPrefix', { id: mission.id.slice(0, 8) })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '300',
            color: colors.text.secondary,
          }}
        >
          Status
        </Text>
        <View
          style={{
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: 4,
            borderRadius: theme.borderRadius.sm,
            backgroundColor: `${getStatusColor(mission.status)}15`,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: getStatusColor(mission.status),
              letterSpacing: 0.3,
            }}
          >
            {getStatusLabel(mission.status, t)}
          </Text>
        </View>
      </View>
    </View>
  );
}

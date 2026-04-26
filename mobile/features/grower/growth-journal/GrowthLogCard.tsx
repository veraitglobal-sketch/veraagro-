import { View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar } from 'lucide-react-native';
import { colors } from '../../../lib/colors';
import { theme } from '../../../lib/theme';
import type { GrowthLog } from '../../../lib/api';

interface GrowthLogCardProps {
  log: GrowthLog;
}

export function GrowthLogCard({ log }: GrowthLogCardProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      {log.imageUrl && (
        <Image
          source={{ uri: log.imageUrl }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: theme.borderRadius.sm,
            marginBottom: theme.spacing.sm,
          }}
          resizeMode="cover"
        />
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.xs,
        }}
      >
        <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '300',
            color: colors.text.secondary,
            marginLeft: 4,
          }}
        >
          {log.gpsLatitude.toFixed(6)}, {log.gpsLongitude.toFixed(6)}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing.xs,
        }}
      >
        <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 11,
            fontWeight: '300',
            color: colors.text.secondary,
            marginLeft: 4,
          }}
        >
          {new Date(log.createdAt).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {log.growthStage && (
        <View
          style={{
            marginTop: theme.spacing.xs,
            paddingTop: theme.spacing.xs,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          >
            Faza: {log.growthStage}
          </Text>
        </View>
      )}
      {log.notes && (
        <View
          style={{
            marginTop: theme.spacing.xs,
            paddingTop: theme.spacing.xs,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {log.notes}
          </Text>
        </View>
      )}
      {log.parcel && (
        <View
          style={{
            marginTop: theme.spacing.xs,
            paddingTop: theme.spacing.xs,
            borderTopWidth: 0.5,
            borderTopColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.growthJournal.parcelWithType', { type: log.parcel.cropType || '—' })}
          </Text>
        </View>
      )}
    </View>
  );
}

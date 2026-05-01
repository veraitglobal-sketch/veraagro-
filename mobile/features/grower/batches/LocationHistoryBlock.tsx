import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import { useAppLocaleTag } from '../../../lib/date-locale';

export default function LocationHistoryBlock({ locationHistory }: { locationHistory: any[] }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  if (!locationHistory?.length) return null;
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
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.md, letterSpacing: 0.3 }}>
        {t('producer.batches.locationHistoryTitle')}
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        {locationHistory.map((entry: any, index: number) => (
          <View
            key={index}
            style={{
              paddingBottom: index < locationHistory.length - 1 ? theme.spacing.sm : 0,
              borderBottomWidth: index < locationHistory.length - 1 ? 0.5 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {entry.hubId || entry.location || t('producer.batches.locationUnknown')}
            </Text>
            {entry.timestamp && (
              <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginTop: 2 }}>
                {new Date(entry.timestamp).toLocaleString(dateLocale, dateOpts)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

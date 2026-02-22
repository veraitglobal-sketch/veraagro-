import { View, Text } from 'react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function LocationHistoryBlock({ locationHistory }: { locationHistory: any[] }) {
  if (!locationHistory?.length) return null;
  const dateOpts = { day: '2-digit' as const, month: '2-digit' as const, year: 'numeric' as const, hour: '2-digit' as const, minute: '2-digit' as const };
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
        Istorija lokacija
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
              {entry.hubId || entry.location || 'Unknown location'}
            </Text>
            {entry.timestamp && (
              <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginTop: 2 }}>
                {new Date(entry.timestamp).toLocaleDateString('en-US', dateOpts)}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

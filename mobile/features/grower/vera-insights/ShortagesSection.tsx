import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { CropInsight } from './types';

interface ShortagesSectionProps {
  insights: CropInsight[];
}

export default function ShortagesSection({ insights }: ShortagesSectionProps) {
  const withShortage = insights.filter((i) => i.historicalDeficit != null && i.historicalDeficit > 0);

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '300',
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          letterSpacing: 0.5,
        }}
      >
        Shortages Last Season
      </Text>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
        }}
      >
        {withShortage.map((insight) => (
          <View
            key={insight.id}
            style={{
              marginBottom: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '300',
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                  letterSpacing: 0.3,
                }}
              >
                {insight.cropName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <AlertCircle size={14} color={theme.colors.warning} strokeWidth={1.5} />
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '300',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}
                >
                  {insight.historicalDeficit}% shortage
                </Text>
              </View>
            </View>
          </View>
        ))}
        {withShortage.length === 0 && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: theme.colors.text.secondary,
              fontStyle: 'italic',
              letterSpacing: 0.2,
            }}
          >
            No data on shortages for last season.
          </Text>
        )}
      </View>
    </View>
  );
}

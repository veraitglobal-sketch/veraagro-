import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { CropInsight } from './types';

interface ShortagesSectionProps {
  insights: CropInsight[];
}

export default function ShortagesSection({ insights }: ShortagesSectionProps) {
  const { t } = useTranslation();
  const withShortage = insights.filter((i) => i.historicalDeficit != null && i.historicalDeficit > 0);

  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: theme.colors.text.primary,
          marginBottom: theme.spacing.sm,
          letterSpacing: 0.5,
        }}
      >
        {t('producer.insights.shortages')}
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
                  fontSize: 14,
                  fontWeight: '400',
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
                    fontSize: 13,
                    fontWeight: '400',
                    color: theme.colors.text.secondary,
                    letterSpacing: 0.2,
                  }}
                >
                  {t('producer.insights.shortagePercent', { percent: insight.historicalDeficit })}
                </Text>
              </View>
            </View>
          </View>
        ))}
        {withShortage.length === 0 && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: '400',
              color: theme.colors.text.secondary,
              fontStyle: 'italic',
              letterSpacing: 0.2,
            }}
          >
            {t('producer.insights.noShortages')}
          </Text>
        )}
      </View>
    </View>
  );
}

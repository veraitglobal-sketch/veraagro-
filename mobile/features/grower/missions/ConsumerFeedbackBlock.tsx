import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

interface ConsumerFeedbackBlockProps {
  feedback: { rating?: number; comment?: string } | null;
}

export default function ConsumerFeedbackBlock({ feedback }: ConsumerFeedbackBlockProps) {
  const { t } = useTranslation();
  if (!feedback) return null;
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
        <MessageSquare size={18} color={colors.text.primary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 17,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          {t('producer.missions.consumerFeedbackTitle')}
        </Text>
      </View>
      {feedback.rating != null && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.secondary,
            marginBottom: theme.spacing.xs,
          }}
        >
          {t('producer.missions.ratingWithMax', { n: feedback.rating })}
        </Text>
      )}
      {feedback.comment && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '300',
            color: colors.text.primary,
          }}
        >
          {feedback.comment}
        </Text>
      )}
    </View>
  );
}

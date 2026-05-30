import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';

export default function QualityIssuesBlock({ qualityIssues }: { qualityIssues: any }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  if (!qualityIssues) return null;
  const text = typeof qualityIssues === 'string' ? qualityIssues : qualityIssues?.issue;
  const timestamp = typeof qualityIssues === 'object' && qualityIssues?.timestamp;
  return (
    <View
      style={{
        backgroundColor: `${theme.colors.error}10`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: theme.colors.error,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AlertCircle size={18} color={theme.colors.error} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.error, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.batches.qualityIssues')}
        </Text>
      </View>
      {text && <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.primary }}>{text}</Text>}
      {timestamp && (
        <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary, marginTop: theme.spacing.xs }}>
          {`${t('producer.batches.reportedLabel')}: ${new Date(timestamp).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}`}
        </Text>
      )}
    </View>
  );
}

import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

export default function QualityIssuesBlock({ qualityIssues }: { qualityIssues: any }) {
  if (!qualityIssues) return null;
  const text = typeof qualityIssues === 'string' ? qualityIssues : qualityIssues?.issue;
  const timestamp = typeof qualityIssues === 'object' && qualityIssues?.timestamp;
  return (
    <View
      style={{
        backgroundColor: `${colors.error}10`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.error,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AlertCircle size={18} color={colors.error} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.error, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          Problemi sa kvalitetom
        </Text>
      </View>
      {text && <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>{text}</Text>}
      {timestamp && (
        <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginTop: theme.spacing.xs }}>
          Reported: {new Date(timestamp).toLocaleDateString('en-US')}
        </Text>
      )}
    </View>
  );
}

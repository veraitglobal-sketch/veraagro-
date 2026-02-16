import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

interface FinancialStatusBlockProps {
  financial: {
    totalAmount?: number;
    farmerPayout?: number;
    status?: string;
  } | null;
}

export default function FinancialStatusBlock({ financial }: FinancialStatusBlockProps) {
  const { t } = useTranslation();
  if (!financial) return null;
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
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Euro size={18} color={colors.text.primary} strokeWidth={1} />
        <Text
          style={{
            fontSize: 15,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          Finansijski status
        </Text>
      </View>
      {financial.totalAmount != null && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.missions.total')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          >
            {financial.totalAmount.toLocaleString('en-US', {
              style: 'currency',
              currency: 'EUR',
            })}
          </Text>
        </View>
      )}
      {financial.farmerPayout != null && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.missions.yourPayout')}
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '300',
              color: colors.primary,
            }}
          >
            {financial.farmerPayout.toLocaleString('en-US', {
              style: 'currency',
              currency: 'EUR',
            })}
          </Text>
        </View>
      )}
      {financial.status && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            Status: {financial.status}
          </Text>
        </View>
      )}
    </View>
  );
}

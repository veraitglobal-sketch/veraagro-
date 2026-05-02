import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface FinancialStatusBlockProps {
  financial: {
    totalAmount?: number;
    farmerPayout?: number;
    status?: string;
  } | null;
}

export default function FinancialStatusBlock({ financial }: FinancialStatusBlockProps) {
  const { t } = useTranslation();
  const priceLocale = useAppLocaleTag();
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
            fontSize: 17,
            fontWeight: '300',
            color: colors.text.primary,
            marginLeft: theme.spacing.xs,
            letterSpacing: 0.3,
          }}
        >
          {t('producer.missions.financialStatus')}
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
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.missions.total')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          >
            {financial.totalAmount.toLocaleString(priceLocale, {
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
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.missions.yourPayout')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.primary,
            }}
          >
            {financial.farmerPayout.toLocaleString(priceLocale, {
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
              fontSize: 14,
              fontWeight: '300',
              color: colors.text.secondary,
            }}
          >
            {t('producer.missions.financialApiStatusLine', { status: financial.status })}
          </Text>
        </View>
      )}
    </View>
  );
}

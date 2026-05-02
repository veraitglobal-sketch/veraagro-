import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import { useAppLocaleTag } from '../../../lib/date-locale';

interface FinancialStatusBlockProps {
  financial: {
    totalAmount?: number;
    /** @deprecated use paidAmount */
    farmerPayout?: number;
    paidAmount?: number;
    pendingAmount?: number;
    inEscrowAmount?: number;
    paymentStatus?: string;
    paymentStatusMessage?: string;
    status?: string;
  } | null;
}

export default function FinancialStatusBlock({ financial }: FinancialStatusBlockProps) {
  const { t } = useTranslation();
  const priceLocale = useAppLocaleTag();
  if (!financial) return null;
  const released =
    typeof financial.paidAmount === 'number'
      ? financial.paidAmount
      : typeof financial.farmerPayout === 'number'
        ? financial.farmerPayout
        : null;
  const inEscrow = financial.inEscrowAmount ?? 0;
  const statusLine =
    financial.paymentStatusMessage ||
    financial.paymentStatus ||
    financial.status ||
    '';

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
      {released != null && (
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
            {t('producer.missions.financialReleased')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.primary,
            }}
          >
            {released.toLocaleString(priceLocale, {
              style: 'currency',
              currency: 'EUR',
            })}
          </Text>
        </View>
      )}
      {inEscrow > 0 && (
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
            {t('producer.missions.financialInEscrow')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '300',
              color: colors.text.primary,
            }}
          >
            {inEscrow.toLocaleString(priceLocale, {
              style: 'currency',
              currency: 'EUR',
            })}
          </Text>
        </View>
      )}
      {statusLine !== '' && (
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
            {statusLine}
          </Text>
        </View>
      )}
    </View>
  );
}

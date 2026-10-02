import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro, CheckCircle, Clock, XCircle } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import type { GrowerPaymentSummary } from '../../../lib/api/types';

interface PaymentStatusBlockProps {
  growerPaymentSummary?: GrowerPaymentSummary | null;
}

function summaryLabelKey(summary: GrowerPaymentSummary): string {
  return `producer.orders.growerPaymentSummary.${summary.toLowerCase()}`;
}

function summaryIcon(summary: GrowerPaymentSummary) {
  if (summary === 'SETTLED' || summary === 'PAID_IN_ESCROW') {
    return <CheckCircle size={16} color={theme.colors.primary} strokeWidth={1} />;
  }
  if (summary === 'CANCELLED' || summary === 'REFUNDED') {
    return <XCircle size={16} color={theme.colors.text.secondary} strokeWidth={1} />;
  }
  return <Clock size={16} color={theme.colors.warning} strokeWidth={1} />;
}

export default function PaymentStatusBlock({ growerPaymentSummary }: PaymentStatusBlockProps) {
  const { t } = useTranslation();
  const label = growerPaymentSummary
    ? t(summaryLabelKey(growerPaymentSummary), { defaultValue: growerPaymentSummary })
    : t('producer.orders.growerPaymentSummary.unknown');

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Euro size={18} color={theme.colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.orders.paymentStatus')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>{label}</Text>
        {summaryIcon(growerPaymentSummary ?? 'UNKNOWN')}
      </View>
    </View>
  );
}

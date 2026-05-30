import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Euro, CheckCircle, Clock } from 'lucide-react-native';
import { theme } from '../../../lib/theme';

interface PaymentStatusBlockProps {
  paymentStatus: string;
}

export default function PaymentStatusBlock({ paymentStatus }: PaymentStatusBlockProps) {
  const { t } = useTranslation();
  const label = paymentStatus === 'PAID' ? t('producer.orders.paid') : paymentStatus === 'PENDING' ? t('producer.orders.pending') : paymentStatus;
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
        {paymentStatus === 'PAID' ? (
          <CheckCircle size={16} color={theme.colors.primary} strokeWidth={1} />
        ) : (
          <Clock size={16} color={theme.colors.warning} strokeWidth={1} />
        )}
      </View>
    </View>
  );
}

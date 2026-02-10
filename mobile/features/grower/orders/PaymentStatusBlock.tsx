import { View, Text } from 'react-native';
import { Euro, CheckCircle, Clock } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

interface PaymentStatusBlockProps {
  paymentStatus: string;
}

export default function PaymentStatusBlock({ paymentStatus }: PaymentStatusBlockProps) {
  const label = paymentStatus === 'PAID' ? 'Plaćeno' : paymentStatus === 'PENDING' ? 'Na čekanju' : paymentStatus;
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
        <Euro size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          Status plaćanja
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>{label}</Text>
        {paymentStatus === 'PAID' ? (
          <CheckCircle size={16} color={colors.primary} strokeWidth={1} />
        ) : (
          <Clock size={16} color={colors.warning} strokeWidth={1} />
        )}
      </View>
    </View>
  );
}

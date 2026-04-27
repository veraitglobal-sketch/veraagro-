import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

interface BuyerBlockProps {
  buyer: { firstName?: string; lastName?: string; companyName?: string } | null;
}

export default function BuyerBlock({ buyer }: BuyerBlockProps) {
  const { t } = useTranslation();
  if (!buyer) return null;
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
        <User size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.orders.buyerSection')}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>
        {buyer.firstName} {buyer.lastName || ''}
      </Text>
      {buyer.companyName && (
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginTop: theme.spacing.xs }}>
          {buyer.companyName}
        </Text>
      )}
    </View>
  );
}

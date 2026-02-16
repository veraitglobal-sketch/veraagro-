import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import type { Order } from '../../../lib/api';

export default function OrderLinesBlock({ order }: { order: Order }) {
  const { t } = useTranslation();
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
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.sm, letterSpacing: 0.3 }}>
        {t('producer.orders.product')}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {order.productName}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>
        {t('producer.orders.quantity')}: {order.quantity} {order.unit}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 0.5, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>{t('producer.orders.unitPrice')}</Text>
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
          {order.unitPrice.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary }}>{t('producer.orders.total')}</Text>
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.primary }}>
          {order.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
    </View>
  );
}
